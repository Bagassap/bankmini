import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { NasabahService } from '../nasabah/nasabah.service';
import { PrismaService } from '../prisma/prisma.service';
import type {
  AuthAccountType,
  JwtPayload,
  LinkedStaffInfo,
} from './jwt-payload.interface';

export interface LoginInput {
  username: string;
  password: string;
}

export interface LoginResult {
  accessToken: string;
  accountType: AuthAccountType;
  user: {
    id: string;
    username: string;
    nama: string;
    role: string;
    noRekening?: string;
    linkedStaff?: LinkedStaffInfo;
  };
}

const DEFAULT_IDLE_TIMEOUT_MINUTES = 30;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly nasabahService: NasabahService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private get idleTimeoutMs(): number {
    const minutes = Number(
      this.config.get('SESSION_IDLE_TIMEOUT_MINUTES') ??
        DEFAULT_IDLE_TIMEOUT_MINUTES,
    );
    return minutes * 60 * 1000;
  }

  async login(input: LoginInput): Promise<LoginResult> {
    try {
      const staff = await this.usersService.findByUsername(input.username);
      if (staff) {
        // A staff username that is also someone's nasabah No Rekening means
        // this is a dual-role account (e.g. admin who is also a guru) -
        // that person now logs in with their NPY/NIS only, which grants
        // both sides at once. Their old staff username is superseded, so
        // fall through (it won't match any nasabah username either, which
        // correctly ends in "invalid credentials" for a No Rekening login).
        const linkedNasabah = await this.nasabahService.findByNoRekeningOrNull(
          staff.username,
        );
        if (!linkedNasabah) {
          if (!staff.isActive) {
            throw new UnauthorizedException('Username atau password salah');
          }
          const isPasswordValid = await bcrypt.compare(
            input.password,
            staff.password,
          );
          if (!isPasswordValid) {
            throw new UnauthorizedException('Username atau password salah');
          }

          await this.usersService.updateLastLogin(staff.id);

          return this.buildResult('staff', {
            id: staff.id,
            username: staff.username,
            nama: staff.nama,
            role: staff.role,
          });
        }
      }

      const nasabah = await this.nasabahService.findByUsername(
        input.username,
      );
      if (nasabah) {
        if (!nasabah.isActive || !nasabah.username || !nasabah.password) {
          throw new UnauthorizedException('Username atau password salah');
        }
        const isPasswordValid = await bcrypt.compare(
          input.password,
          nasabah.password,
        );
        if (!isPasswordValid) {
          throw new UnauthorizedException('Username atau password salah');
        }

        await this.nasabahService.updateLastLogin(nasabah.id);

        const linkedStaffUser = await this.usersService.findByUsername(
          nasabah.noRekening,
        );
        const linkedStaff: LinkedStaffInfo | undefined =
          linkedStaffUser && linkedStaffUser.isActive
            ? {
                id: linkedStaffUser.id,
                role: linkedStaffUser.role,
                nama: linkedStaffUser.nama,
              }
            : undefined;
        if (linkedStaff) {
          await this.usersService.updateLastLogin(linkedStaff.id);
        }

        return this.buildResult('nasabah', {
          id: nasabah.id,
          username: nasabah.username,
          nama: nasabah.nama,
          role: nasabah.jenisNasabah,
          noRekening: nasabah.noRekening,
          linkedStaff,
        });
      }

      throw new UnauthorizedException('Username atau password salah');
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Gagal melakukan login');
    }
  }

  /**
   * Revokes the session tied to the given access token, if any. Called on
   * logout so the session is invalidated server-side rather than relying
   * solely on the browser dropping its cookie. Silently no-ops on an
   * invalid/expired/missing token so logout stays idempotent.
   */
  async logout(token?: string): Promise<void> {
    if (!token) return;
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      await this.prisma.session.updateMany({
        where: { id: payload.sid, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } catch {
      // Invalid/expired token: nothing to revoke.
    }
  }

  /**
   * Validates that a session is still alive (not revoked, not idle beyond
   * the configured timeout) and slides its expiry forward. Throws when the
   * session should no longer be trusted, forcing the client to log in
   * again even if it still holds an unexpired JWT.
   */
  async touchSession(sessionId: string): Promise<void> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });
    if (!session || session.revokedAt) {
      throw new UnauthorizedException('Sesi tidak valid, silakan login kembali');
    }

    const idleFor = Date.now() - session.lastActiveAt.getTime();
    if (idleFor > this.idleTimeoutMs) {
      await this.prisma.session.update({
        where: { id: sessionId },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException(
        'Sesi berakhir karena tidak aktif, silakan login kembali',
      );
    }

    await this.prisma.session.update({
      where: { id: sessionId },
      data: { lastActiveAt: new Date() },
    });
  }

  private async buildResult(
    accountType: AuthAccountType,
    user: LoginResult['user'],
  ): Promise<LoginResult> {
    const session = await this.prisma.session.create({
      data: { accountType, accountId: user.id },
    });

    const payload: JwtPayload = {
      id: user.id,
      username: user.username,
      nama: user.nama,
      role: user.role,
      accountType,
      sid: session.id,
      ...(user.linkedStaff ? { linkedStaff: user.linkedStaff } : {}),
    };
    const accessToken = await this.jwtService.signAsync(payload);
    return { accessToken, accountType, user };
  }
}
