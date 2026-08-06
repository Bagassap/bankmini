import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const SIMPANAN_POKOK_NOMINAL = 500_000;
const SIMPANAN_WAJIB_NOMINAL = 10_000;

const HARI_RAYA_TARGET_SETORAN = 10;

export interface SimpananRingkasanItem {
  nasabahId: string;
  nama: string;
  noRekening: string;
  punyaSimpananPokok: boolean;
  simpananPokok: number;
  simpananWajib: number;
  jumlah: number;
}

export interface SimpananWajibHistoryItem {
  id: string;
  nominal: number;
  periode: string;
  tanggalSetor: Date;
  processedBy: string;
  createdAt: Date;
}

export interface SimpananHariRayaRingkasanItem {
  nasabahId: string;
  nama: string;
  noRekening: string;
  totalTerkumpul: number;
  jumlahSetoran: number;
  target: number;
  progress: number;
  nominalPerBulan: number | null;
  lastPencairan: { tanggal: Date; jumlah: number } | null;
}

export interface SimpananHariRayaHistoryItem {
  id: string;
  nominal: number;
  periode: string;
  tanggalSetor: Date;
  processedBy: string;
  createdAt: Date;
}

@Injectable()
export class SimpananService {
  constructor(private readonly prisma: PrismaService) {}

  async getRingkasan(): Promise<SimpananRingkasanItem[]> {
    try {
      const guruList = await this.prisma.nasabah.findMany({
        where: { jenisNasabah: 'guru' },
        orderBy: { nama: 'asc' },
        include: {
          simpananPokok: true,
          simpananWajib: true,
        },
      });

      return guruList.map((n) => {
        const pokok = n.simpananPokok ? Number(n.simpananPokok.nominal) : 0;
        const wajib = n.simpananWajib.reduce(
          (sum, w) => sum + Number(w.nominal),
          0,
        );
        return {
          nasabahId: n.id,
          nama: n.nama,
          noRekening: n.noRekening,
          punyaSimpananPokok: !!n.simpananPokok,
          simpananPokok: pokok,
          simpananWajib: wajib,
          jumlah: pokok + wajib,
        };
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Gagal mengambil data simpanan');
    }
  }

  async getWajibHistory(
    nasabahId: string,
  ): Promise<SimpananWajibHistoryItem[]> {
    try {
      const rows = await this.prisma.simpananWajib.findMany({
        where: { nasabahId },
        orderBy: { tanggalSetor: 'desc' },
        include: { processedBy: { select: { nama: true } } },
      });
      return rows.map((r) => ({
        id: r.id,
        nominal: Number(r.nominal),
        periode: r.periode,
        tanggalSetor: r.tanggalSetor,
        processedBy: r.processedBy.nama,
        createdAt: r.createdAt,
      }));
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Gagal mengambil riwayat simpanan wajib',
      );
    }
  }

  private async assertGuruAnggota(nasabahId: string) {
    const nasabah = await this.prisma.nasabah.findUnique({
      where: { id: nasabahId },
    });
    if (!nasabah) {
      throw new NotFoundException('Nasabah tidak ditemukan');
    }
    if (nasabah.jenisNasabah !== 'guru') {
      throw new BadRequestException(
        'Simpanan pokok/wajib hanya berlaku untuk anggota guru',
      );
    }
    return nasabah;
  }

  async createPokok(nasabahId: string, processedById: string) {
    try {
      await this.assertGuruAnggota(nasabahId);

      const existing = await this.prisma.simpananPokok.findUnique({
        where: { nasabahId },
      });
      if (existing) {
        throw new ConflictException(
          'Anggota ini sudah memiliki simpanan pokok',
        );
      }

      return await this.prisma.simpananPokok.create({
        data: {
          nasabahId,
          nominal: SIMPANAN_POKOK_NOMINAL,
          processedById,
        },
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Gagal menambahkan simpanan pokok',
      );
    }
  }

  async createWajib(nasabahId: string, periode: string, processedById: string) {
    try {
      await this.assertGuruAnggota(nasabahId);

      return await this.prisma.simpananWajib.create({
        data: {
          nasabahId,
          nominal: SIMPANAN_WAJIB_NOMINAL,
          periode,
          processedById,
        },
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Gagal menambahkan simpanan wajib',
      );
    }
  }

  async getHariRayaRingkasan(): Promise<SimpananHariRayaRingkasanItem[]> {
    try {
      const guruList = await this.prisma.nasabah.findMany({
        where: { jenisNasabah: 'guru' },
        orderBy: { nama: 'asc' },
        include: {
          simpananHariRaya: true,
          simpananHariRayaAnggota: true,
          simpananHariRayaPencairan: {
            orderBy: { tanggalCair: 'desc' },
            take: 1,
          },
        },
      });

      return guruList.map((n) => {
        const lastPencairan = n.simpananHariRayaPencairan[0] ?? null;
        const currentCycleDeposits = n.simpananHariRaya
          .filter(
            (d) => !lastPencairan || d.tanggalSetor > lastPencairan.tanggalCair,
          )
          .sort((a, b) => a.tanggalSetor.getTime() - b.tanggalSetor.getTime());
        const currentCycleRegistrations = n.simpananHariRayaAnggota
          .filter(
            (a) =>
              !lastPencairan || a.terdaftarPada > lastPencairan.tanggalCair,
          )
          .sort(
            (a, b) => a.terdaftarPada.getTime() - b.terdaftarPada.getTime(),
          );
        const total = currentCycleDeposits.reduce(
          (sum, d) => sum + Number(d.nominal),
          0,
        );
        const jumlahSetoran = currentCycleDeposits.length;

        const nominalPerBulan =
          currentCycleRegistrations.length > 0
            ? Number(currentCycleRegistrations[0].nominal)
            : currentCycleDeposits.length > 0
              ? Number(currentCycleDeposits[0].nominal)
              : null;

        return {
          nasabahId: n.id,
          nama: n.nama,
          noRekening: n.noRekening,
          totalTerkumpul: total,
          jumlahSetoran,
          target: HARI_RAYA_TARGET_SETORAN,
          progress: Math.min(
            100,
            Math.round((jumlahSetoran / HARI_RAYA_TARGET_SETORAN) * 100),
          ),
          nominalPerBulan,
          lastPencairan: lastPencairan
            ? {
                tanggal: lastPencairan.tanggalCair,
                jumlah: Number(lastPencairan.totalDicairkan),
              }
            : null,
        };
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Gagal mengambil data simpanan hari raya',
      );
    }
  }

  async daftarAnggotaHariRaya(
    nasabahId: string,
    nominal: number,
    processedById: string,
  ) {
    try {
      await this.assertGuruAnggota(nasabahId);

      const lastPencairan =
        await this.prisma.simpananHariRayaPencairan.findFirst({
          where: { nasabahId },
          orderBy: { tanggalCair: 'desc' },
        });

      const existing = await this.prisma.simpananHariRayaAnggota.findFirst({
        where: {
          nasabahId,
          ...(lastPencairan
            ? { terdaftarPada: { gt: lastPencairan.tanggalCair } }
            : {}),
        },
      });
      if (existing) {
        throw new ConflictException(
          'Anggota ini sudah terdaftar pada siklus simpanan hari raya saat ini',
        );
      }

      return await this.prisma.simpananHariRayaAnggota.create({
        data: { nasabahId, nominal, processedById },
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Gagal mendaftarkan anggota simpanan hari raya',
      );
    }
  }

  async getHariRayaHistory(
    nasabahId: string,
  ): Promise<SimpananHariRayaHistoryItem[]> {
    try {
      const lastPencairan =
        await this.prisma.simpananHariRayaPencairan.findFirst({
          where: { nasabahId },
          orderBy: { tanggalCair: 'desc' },
        });

      const rows = await this.prisma.simpananHariRaya.findMany({
        where: {
          nasabahId,
          ...(lastPencairan
            ? { tanggalSetor: { gt: lastPencairan.tanggalCair } }
            : {}),
        },
        orderBy: { tanggalSetor: 'desc' },
        include: { processedBy: { select: { nama: true } } },
      });
      return rows.map((r) => ({
        id: r.id,
        nominal: Number(r.nominal),
        periode: r.periode,
        tanggalSetor: r.tanggalSetor,
        processedBy: r.processedBy.nama,
        createdAt: r.createdAt,
      }));
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Gagal mengambil riwayat simpanan hari raya',
      );
    }
  }

  async createHariRaya(
    nasabahId: string,
    periode: string,
    processedById: string,
  ) {
    try {
      await this.assertGuruAnggota(nasabahId);

      const lastPencairan =
        await this.prisma.simpananHariRayaPencairan.findFirst({
          where: { nasabahId },
          orderBy: { tanggalCair: 'desc' },
        });

      const [currentCycleDeposits, currentCycleRegistrations] =
        await Promise.all([
          this.prisma.simpananHariRaya.findMany({
            where: {
              nasabahId,
              ...(lastPencairan
                ? { tanggalSetor: { gt: lastPencairan.tanggalCair } }
                : {}),
            },
            orderBy: { tanggalSetor: 'asc' },
          }),
          this.prisma.simpananHariRayaAnggota.findMany({
            where: {
              nasabahId,
              ...(lastPencairan
                ? { terdaftarPada: { gt: lastPencairan.tanggalCair } }
                : {}),
            },
            orderBy: { terdaftarPada: 'asc' },
          }),
        ]);

      if (currentCycleDeposits.some((d) => d.periode === periode)) {
        throw new ConflictException(
          `Setoran untuk periode ${periode} sudah tercatat dan tidak dapat diubah`,
        );
      }

      const nominalToUse =
        currentCycleRegistrations.length > 0
          ? Number(currentCycleRegistrations[0].nominal)
          : currentCycleDeposits.length > 0
            ? Number(currentCycleDeposits[0].nominal)
            : null;

      if (nominalToUse === null) {
        throw new BadRequestException(
          'Anggota belum terdaftar di simpanan hari raya - tambahkan anggota terlebih dahulu',
        );
      }

      return await this.prisma.simpananHariRaya.create({
        data: {
          nasabahId,
          nominal: nominalToUse,
          periode,
          processedById,
        },
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Gagal menambahkan simpanan hari raya',
      );
    }
  }

  async cairkanHariRaya(nasabahId: string, processedById: string) {
    try {
      await this.assertGuruAnggota(nasabahId);

      const lastPencairan =
        await this.prisma.simpananHariRayaPencairan.findFirst({
          where: { nasabahId },
          orderBy: { tanggalCair: 'desc' },
        });

      const deposits = await this.prisma.simpananHariRaya.findMany({
        where: {
          nasabahId,
          ...(lastPencairan
            ? { tanggalSetor: { gt: lastPencairan.tanggalCair } }
            : {}),
        },
      });

      if (deposits.length === 0) {
        throw new BadRequestException(
          'Belum ada setoran simpanan hari raya yang bisa dicairkan',
        );
      }

      const total = deposits.reduce((sum, d) => sum + Number(d.nominal), 0);

      return await this.prisma.simpananHariRayaPencairan.create({
        data: {
          nasabahId,
          totalDicairkan: total,
          jumlahSetoran: deposits.length,
          processedById,
        },
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Gagal mencairkan simpanan hari raya',
      );
    }
  }
}
