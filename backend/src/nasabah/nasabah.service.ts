import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JenisNasabah, Nasabah, Prisma, StatusNasabah } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { wibDateParts } from '../common/wib-date';
import { PasswordVaultService } from '../common/password-vault.service';
import { NotificationsService } from '../notifications/notifications.service';

const JENIS_LABEL: Record<JenisNasabah, string> = {
  siswa: 'siswa',
  guru: 'guru',
  wali_kelas: 'wali kelas',
  umum: 'umum',
  kelas: 'kelas',
};

export interface CreateNasabahInput {
  nama: string;
  jenisNasabah: JenisNasabah;
  nis?: string;
  kelas?: string;
  jurusan?: string;
  nip?: string;
  jabatan?: string;
  alamat?: string;
  tahunAngkatan?: string;
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
  tahunAngkatan?: string;
  noTelepon?: string;
  jenisKelamin?: 'L' | 'P';
  tanggalLahir?: Date;
  status?: StatusNasabah;
}

export interface FindAllNasabahFilter {
  jenis?: JenisNasabah;
  status?: StatusNasabah;
  search?: string;
  kelas?: string;
}

type PrismaClientOrTx = PrismaService | Prisma.TransactionClient;
export type SafeNasabah = Omit<Nasabah, 'password' | 'passwordPlainEncrypted'>;

@Injectable()
export class NasabahService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordVault: PasswordVaultService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private excludePassword(nasabah: Nasabah): SafeNasabah {
    const { password, passwordPlainEncrypted, ...safeNasabah } = nasabah;
    return safeNasabah;
  }

  private buildUsername(
    input: Pick<CreateNasabahInput, 'jenisNasabah' | 'nis' | 'nip'>,
    noRekening: string,
  ): string | null {
    if (input.jenisNasabah === 'siswa') return input.nis || noRekening;
    if (input.jenisNasabah === 'guru' || input.jenisNasabah === 'wali_kelas')
      return input.nip || noRekening;
    return null;
  }

  async findAll(filter: FindAllNasabahFilter = {}): Promise<SafeNasabah[]> {
    try {
      const where: Prisma.NasabahWhereInput = {};
      if (filter.jenis) where.jenisNasabah = filter.jenis;
      if (filter.status) where.status = filter.status;
      if (filter.kelas) where.kelas = filter.kelas;
      if (filter.search) {
        where.OR = [
          { nama: { contains: filter.search, mode: 'insensitive' } },
          { noRekening: { contains: filter.search, mode: 'insensitive' } },
        ];
      }

      const nasabah = await this.prisma.nasabah.findMany({
        where,
        orderBy: filter.jenis === 'siswa' ? { nis: 'asc' } : { createdAt: 'desc' },
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

  async findByNoRekeningOrNull(noRekening: string): Promise<Nasabah | null> {
    try {
      return await this.prisma.nasabah.findUnique({ where: { noRekening } });
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
    const { year, month, day } = wibDateParts();
    const yy = String(year).slice(-2);
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const prefix = `BM${yy}${mm}${dd}`;

    const last = await tx.nasabah.findFirst({
      where: { noRekening: { startsWith: prefix } },
      orderBy: { noRekening: 'desc' },
      select: { noRekening: true },
    });
    const lastSequence = last
      ? parseInt(last.noRekening.slice(prefix.length), 10)
      : 0;
    const sequence = String(lastSequence + 1).padStart(4, '0');
    return `${prefix}${sequence}`;
  }

  async create(input: CreateNasabahInput): Promise<SafeNasabah> {
    try {
      for (let attempt = 0; attempt < 3; attempt++) {
        const noRekening = await this.generateNoRekening();
        const username = this.buildUsername(input, noRekening);
        const hashedPassword = username
          ? await bcrypt.hash(noRekening, 10)
          : null;
        const passwordPlainEncrypted = username
          ? this.passwordVault.encrypt(noRekening)
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
              tahunAngkatan: input.tahunAngkatan,
              noTelepon: input.noTelepon,
              jenisKelamin: input.jenisKelamin,
              tanggalLahir: input.tanggalLahir,
              username,
              password: hashedPassword,
              mustChangePassword: true,
              passwordPlainEncrypted,
            },
          });
          if (nasabah.jenisNasabah !== 'kelas') {
            this.notificationsService
              .create({
                recipientType: 'staff_broadcast',
                type: 'nasabah_baru',
                title: 'Nasabah baru terdaftar',
                description: `${nasabah.nama} mendaftar sebagai nasabah ${JENIS_LABEL[nasabah.jenisNasabah]}`,
              })
              .catch(() => {});
          }
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

  // Koreksi saldo manual (mis. salah input saat migrasi/import data) - beda
  // dari transaksi setor/tarik biasa karena tidak membuat baris Transaksi,
  // jadi dicatat sebagai notifikasi broadcast supaya tetap ada jejak siapa
  // yang mengubah, kapan, dan alasannya.
  async koreksiSaldo(
    id: string,
    saldoBaru: number,
    alasan: string,
    staffNama: string,
  ): Promise<SafeNasabah> {
    try {
      const existing = await this.findById(id);
      const saldoLama = Number(existing.saldo);
      const nasabah = await this.prisma.nasabah.update({
        where: { id },
        data: { saldo: saldoBaru },
      });
      const formatRp = (value: number) =>
        new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0,
        }).format(value);
      this.notificationsService
        .create({
          recipientType: 'staff_broadcast',
          type: 'saldo_dikoreksi',
          title: 'Koreksi saldo nasabah',
          description: `${staffNama} mengubah saldo ${nasabah.nama} dari ${formatRp(saldoLama)} menjadi ${formatRp(saldoBaru)}. Alasan: ${alasan}`,
        })
        .catch(() => {});
      return this.excludePassword(nasabah);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Gagal mengoreksi saldo');
    }
  }

  async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    try {
      const nasabah = await this.prisma.nasabah.findUnique({ where: { id } });
      if (!nasabah || !nasabah.password) {
        throw new NotFoundException('Akun tidak ditemukan');
      }
      const isValid = await bcrypt.compare(currentPassword, nasabah.password);
      if (!isValid) {
        throw new BadRequestException('Password saat ini salah');
      }
      const hashed = await bcrypt.hash(newPassword, 10);
      await this.prisma.nasabah.update({
        where: { id },
        data: {
          password: hashed,
          mustChangePassword: false,
          passwordPlainEncrypted: this.passwordVault.encrypt(newPassword),
        },
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Gagal mengubah password');
    }
  }

  async getDecryptedPassword(id: string): Promise<string | null> {
    try {
      const nasabah = await this.prisma.nasabah.findUnique({ where: { id } });
      if (!nasabah) {
        throw new NotFoundException('Akun tidak ditemukan');
      }
      if (!nasabah.passwordPlainEncrypted) return null;
      return this.passwordVault.decrypt(nasabah.passwordPlainEncrypted);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Gagal mengambil password');
    }
  }

  async resetPassword(id: string): Promise<void> {
    try {
      const nasabah = await this.prisma.nasabah.findUnique({ where: { id } });
      if (!nasabah) {
        throw new NotFoundException('Akun tidak ditemukan');
      }
      if (!nasabah.username) {
        throw new BadRequestException(
          'Akun ini tidak memiliki login untuk direset',
        );
      }
      const hashed = await bcrypt.hash(nasabah.username, 10);
      await this.prisma.nasabah.update({
        where: { id },
        data: {
          password: hashed,
          mustChangePassword: true,
          passwordPlainEncrypted: this.passwordVault.encrypt(nasabah.username),
        },
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Gagal mereset password');
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

  async getKelasSummary(waliKelasId: string) {
    try {
      const waliKelas = await this.prisma.nasabah.findUnique({
        where: { id: waliKelasId },
      });
      if (!waliKelas) {
        throw new NotFoundException('Akun tidak ditemukan');
      }
      if (waliKelas.jenisNasabah !== 'wali_kelas' || !waliKelas.kelas) {
        throw new ForbiddenException(
          'Hanya wali kelas yang dapat mengakses ringkasan saldo kelas',
        );
      }

      const [kelasAccount, siswaList] = await this.prisma.$transaction([
        this.prisma.nasabah.findFirst({
          where: { jenisNasabah: 'kelas', kelas: waliKelas.kelas },
        }),
        this.prisma.nasabah.findMany({
          where: { jenisNasabah: 'siswa', kelas: waliKelas.kelas },
          orderBy: { nis: 'asc' },
        }),
      ]);

      const siswaSaldoTotal = siswaList.reduce(
        (sum, siswa) => sum + Number(siswa.saldo),
        0,
      );
      const kelasSaldo = kelasAccount ? Number(kelasAccount.saldo) : 0;

      return {
        kelas: waliKelas.kelas,
        totalSaldo: kelasSaldo + siswaSaldoTotal,
        kelasAccount: kelasAccount
          ? {
              id: kelasAccount.id,
              noRekening: kelasAccount.noRekening,
              nama: kelasAccount.nama,
              saldo: kelasAccount.saldo,
            }
          : null,
        totalSiswa: siswaList.length,
        totalSaldoSiswa: siswaSaldoTotal,
        siswa: siswaList.map((siswa) => ({
          id: siswa.id,
          noRekening: siswa.noRekening,
          nama: siswa.nama,
          nis: siswa.nis,
          saldo: siswa.saldo,
          status: siswa.status,
        })),
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Gagal mengambil ringkasan saldo kelas',
      );
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
