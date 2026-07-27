import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JenisNasabah, Nasabah, Prisma, StatusNasabah } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateNasabahInput {
  nama: string;
  jenisNasabah: JenisNasabah;
  nis?: string;
  kelas?: string;
  jurusan?: string;
  nip?: string;
  jabatan?: string;
  alamat?: string;
  noTelepon?: string;
  jenisKelamin?: 'L' | 'P';
  tanggalLahir?: Date;
}

export interface UpdateNasabahInput {
  nama?: string;
  jenisNasabah?: JenisNasabah;
  nis?: string;
  kelas?: string;
  jurusan?: string;
  nip?: string;
  jabatan?: string;
  alamat?: string;
  noTelepon?: string;
  jenisKelamin?: 'L' | 'P';
  tanggalLahir?: Date;
  status?: StatusNasabah;
}

export interface FindAllNasabahFilter {
  jenis?: JenisNasabah;
  status?: StatusNasabah;
  search?: string;
}

type PrismaClientOrTx = PrismaService | Prisma.TransactionClient;
export type SafeNasabah = Omit<Nasabah, 'password'>;

@Injectable()
export class NasabahService {
  constructor(private readonly prisma: PrismaService) {}

  private excludePassword(nasabah: Nasabah): SafeNasabah {
    const { password, ...safeNasabah } = nasabah;
    return safeNasabah;
  }

  /**
   * Nasabah umum tidak diberi akun login — mereka hanya bisa melihat
   * data rekening dengan datang langsung ke teller.
   */
  private buildUsername(
    input: Pick<CreateNasabahInput, 'jenisNasabah' | 'nis' | 'nip'>,
    noRekening: string,
  ): string | null {
    if (input.jenisNasabah === 'siswa') return input.nis || noRekening;
    if (input.jenisNasabah === 'guru') return input.nip || noRekening;
    return null;
  }

  async findAll(filter: FindAllNasabahFilter = {}): Promise<SafeNasabah[]> {
    try {
      const where: Prisma.NasabahWhereInput = {};
      if (filter.jenis) where.jenisNasabah = filter.jenis;
      if (filter.status) where.status = filter.status;
      if (filter.search) {
        where.OR = [
          { nama: { contains: filter.search, mode: 'insensitive' } },
          { noRekening: { contains: filter.search, mode: 'insensitive' } },
        ];
      }

      const nasabah = await this.prisma.nasabah.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
      return nasabah.map((item) => this.excludePassword(item));
    } catch (error) {
      throw new InternalServerErrorException('Gagal mengambil data nasabah');
    }
  }

  async findById(id: string): Promise<SafeNasabah> {
    try {
      const nasabah = await this.prisma.nasabah.findUnique({ where: { id } });
      if (!nasabah) {
        throw new NotFoundException(
          `Nasabah dengan id ${id} tidak ditemukan`,
        );
      }
      return this.excludePassword(nasabah);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Gagal mencari nasabah');
    }
  }

  async findByNoRekening(noRekening: string): Promise<SafeNasabah> {
    try {
      const nasabah = await this.prisma.nasabah.findUnique({
        where: { noRekening },
      });
      if (!nasabah) {
        throw new NotFoundException(
          `Nasabah dengan no rekening ${noRekening} tidak ditemukan`,
        );
      }
      return this.excludePassword(nasabah);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Gagal mencari nasabah');
    }
  }

  async findByUsername(username: string): Promise<Nasabah | null> {
    try {
      return await this.prisma.nasabah.findUnique({ where: { username } });
    } catch (error) {
      throw new InternalServerErrorException('Gagal mencari nasabah');
    }
  }

  async updateLastLogin(id: string): Promise<void> {
    try {
      await this.prisma.nasabah.update({
        where: { id },
        data: { lastLogin: new Date() },
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Gagal memperbarui waktu login terakhir',
      );
    }
  }

  private async generateNoRekening(
    tx: PrismaClientOrTx = this.prisma,
  ): Promise<string> {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const prefix = `BM${yy}${mm}${dd}`;

    const count = await tx.nasabah.count({
      where: { noRekening: { startsWith: prefix } },
    });
    const sequence = String(count + 1).padStart(4, '0');
    return `${prefix}${sequence}`;
  }

  async create(input: CreateNasabahInput): Promise<SafeNasabah> {
    try {
      // retry sekali jika terjadi tabrakan no rekening akibat race condition
      for (let attempt = 0; attempt < 3; attempt++) {
        const noRekening = await this.generateNoRekening();
        const username = this.buildUsername(input, noRekening);
        const hashedPassword = username
          ? await bcrypt.hash(noRekening, 10)
          : null;
        try {
          const nasabah = await this.prisma.nasabah.create({
            data: {
              noRekening,
              nama: input.nama,
              jenisNasabah: input.jenisNasabah,
              nis: input.nis,
              kelas: input.kelas,
              jurusan: input.jurusan,
              nip: input.nip,
              jabatan: input.jabatan,
              alamat: input.alamat,
              noTelepon: input.noTelepon,
              jenisKelamin: input.jenisKelamin,
              tanggalLahir: input.tanggalLahir,
              username,
              password: hashedPassword,
            },
          });
          return this.excludePassword(nasabah);
        } catch (error) {
          if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2002'
          ) {
            const target = (error.meta?.target as string[]) ?? [];
            if (target.includes('username')) {
              throw new ConflictException(
                `NIS/NIP "${username}" sudah digunakan nasabah lain`,
              );
            }
            if (attempt < 2) continue;
          }
          throw error;
        }
      }
      throw new InternalServerErrorException(
        'Gagal membuat nomor rekening unik',
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Gagal membuat nasabah');
    }
  }

  async update(id: string, input: UpdateNasabahInput): Promise<SafeNasabah> {
    try {
      await this.findById(id);
      // saldo, noRekening, dan username tidak boleh diubah lewat method ini
      const nasabah = await this.prisma.nasabah.update({
        where: { id },
        data: input,
      });
      return this.excludePassword(nasabah);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Gagal memperbarui nasabah');
    }
  }

  async updateSaldo(
    id: string,
    saldo: Prisma.Decimal | number | string,
    tx: PrismaClientOrTx = this.prisma,
  ): Promise<Nasabah> {
    try {
      return await tx.nasabah.update({
        where: { id },
        data: { saldo },
      });
    } catch (error) {
      throw new InternalServerErrorException('Gagal memperbarui saldo');
    }
  }

  async delete(id: string): Promise<SafeNasabah> {
    try {
      const nasabah = await this.findById(id);
      if (Number(nasabah.saldo) !== 0) {
        throw new BadRequestException(
          'Saldo nasabah harus 0 sebelum dapat dihapus',
        );
      }
      const deleted = await this.prisma.nasabah.delete({ where: { id } });
      return this.excludePassword(deleted);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Gagal menghapus nasabah');
    }
  }

  async getDashboardStats() {
    try {
      const [perJenis, aggregate] = await this.prisma.$transaction([
        this.prisma.nasabah.groupBy({
          by: ['jenisNasabah'],
          orderBy: { jenisNasabah: 'asc' },
          _count: { _all: true },
        }),
        this.prisma.nasabah.aggregate({
          _sum: { saldo: true },
          _count: { _all: true },
        }),
      ]);

      return {
        totalNasabah: aggregate._count._all,
        totalSaldo: aggregate._sum.saldo ?? 0,
        perJenis: perJenis.map((item) => ({
          jenisNasabah: item.jenisNasabah,
          jumlah: (item._count as { _all: number })._all,
        })),
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Gagal mengambil statistik dashboard',
      );
    }
  }
}
