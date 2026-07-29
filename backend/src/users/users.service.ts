import {
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma, Role, User } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateUserInput {
  username: string;
  password: string;
  nama: string;
  role?: Role;
}

export interface UpdateUserInput {
  username?: string;
  nama?: string;
  role?: Role;
  isActive?: boolean;
  password?: string;
}

type SafeUser = Omit<User, 'password'>;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private excludePassword(user: User): SafeUser {
    const { password, ...safeUser } = user;
    return safeUser;
  }

  async findAll(): Promise<SafeUser[]> {
    try {
      const users = await this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
      });
      return users.map((user) => this.excludePassword(user));
    } catch (error) {
      throw new InternalServerErrorException('Gagal mengambil data user');
    }
  }

  async findByUsername(username: string): Promise<User | null> {
    try {
      return await this.prisma.user.findUnique({ where: { username } });
    } catch (error) {
      throw new InternalServerErrorException('Gagal mencari user');
    }
  }

  async findById(id: string): Promise<SafeUser> {
    try {
      const user = await this.prisma.user.findUnique({ where: { id } });
      if (!user) {
        throw new NotFoundException(`User dengan id ${id} tidak ditemukan`);
      }
      return this.excludePassword(user);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Gagal mencari user');
    }
  }

  async create(input: CreateUserInput): Promise<SafeUser> {
    try {
      const existing = await this.prisma.user.findUnique({
        where: { username: input.username },
      });
      if (existing) {
        throw new ConflictException(
          `Username ${input.username} sudah digunakan`,
        );
      }

      const hashedPassword = await bcrypt.hash(input.password, 10);
      const user = await this.prisma.user.create({
        data: {
          username: input.username,
          password: hashedPassword,
          nama: input.nama,
          role: input.role ?? Role.teller,
        },
      });
      return this.excludePassword(user);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Username sudah digunakan');
      }
      throw new InternalServerErrorException('Gagal membuat user');
    }
  }

  async update(id: string, input: UpdateUserInput): Promise<SafeUser> {
    try {
      await this.findById(id);
      const { password, ...rest } = input;
      const user = await this.prisma.user.update({
        where: { id },
        data: {
          ...rest,
          ...(password ? { password: await bcrypt.hash(password, 10) } : {}),
        },
      });
      return this.excludePassword(user);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Username sudah digunakan');
      }
      throw new InternalServerErrorException('Gagal memperbarui user');
    }
  }

  async delete(id: string): Promise<SafeUser> {
    try {
      await this.findById(id);
      const user = await this.prisma.user.delete({ where: { id } });
      return this.excludePassword(user);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Gagal menghapus user');
    }
  }

  async updateLastLogin(id: string): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id },
        data: { lastLogin: new Date() },
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Gagal memperbarui waktu login terakhir',
      );
    }
  }
}
