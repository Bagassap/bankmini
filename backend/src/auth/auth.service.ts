import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { NasabahService } from '../nasabah/nasabah.service';

export type AuthAccountType = 'staff' | 'nasabah';

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
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly nasabahService: NasabahService,
    private readonly jwtService: JwtService,
  ) {}

  async login(input: LoginInput): Promise<LoginResult> {
    try {
      const staff = await this.usersService.findByUsername(input.username);
      if (staff) {
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

        return this.buildResult('nasabah', {
          id: nasabah.id,
          username: nasabah.username,
          nama: nasabah.nama,
          role: nasabah.jenisNasabah,
          noRekening: nasabah.noRekening,
        });
      }

      throw new UnauthorizedException('Username atau password salah');
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Gagal melakukan login');
    }
  }

  private async buildResult(
    accountType: AuthAccountType,
    user: LoginResult['user'],
  ): Promise<LoginResult> {
    const payload = {
      id: user.id,
      username: user.username,
      nama: user.nama,
      role: user.role,
      accountType,
    };
    const accessToken = await this.jwtService.signAsync(payload);
    return { accessToken, accountType, user };
  }
}
