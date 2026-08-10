import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface KasUtamaBreakdown {
  totalSetor: number;
  totalTarik: number;
  totalSimpanan: number;
  totalPencairanHariRaya: number;
  totalPiutangDicairkan: number;
  totalAngsuranMasuk: number;
  totalPengeluaran: number;
}

export interface KasUtamaResult {
  total: number;
  breakdown: KasUtamaBreakdown;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getKasUtama(): Promise<KasUtamaResult> {
    try {
      const [
        transaksiByJenis,
        simpananPokok,
        simpananWajib,
        simpananHariRaya,
        simpananHariRayaPencairan,
        piutang,
        piutangAngsuran,
        pengeluaran,
      ] = await this.prisma.$transaction([
        this.prisma.transaksi.groupBy({
          by: ['jenisTransaksi'],
          orderBy: { jenisTransaksi: 'asc' },
          _sum: { jumlah: true },
        }),
        this.prisma.simpananPokok.aggregate({ _sum: { nominal: true } }),
        this.prisma.simpananWajib.aggregate({ _sum: { nominal: true } }),
        this.prisma.simpananHariRaya.aggregate({ _sum: { nominal: true } }),
        this.prisma.simpananHariRayaPencairan.aggregate({
          _sum: { totalDicairkan: true },
        }),
        this.prisma.piutang.aggregate({ _sum: { jumlahPinjaman: true } }),
        this.prisma.piutangAngsuran.aggregate({ _sum: { nominal: true } }),
        this.prisma.pengeluaran.aggregate({ _sum: { jumlah: true } }),
      ]);

      const totalSetor = Number(
        transaksiByJenis.find((t) => t.jenisTransaksi === 'setor')?._sum
          ?.jumlah ?? 0,
      );
      const totalTarik = Number(
        transaksiByJenis.find((t) => t.jenisTransaksi === 'tarik')?._sum
          ?.jumlah ?? 0,
      );
      const totalSimpanan =
        Number(simpananPokok._sum.nominal ?? 0) +
        Number(simpananWajib._sum.nominal ?? 0) +
        Number(simpananHariRaya._sum.nominal ?? 0);
      const totalPencairanHariRaya = Number(
        simpananHariRayaPencairan._sum.totalDicairkan ?? 0,
      );
      const totalPiutangDicairkan = Number(
        piutang._sum.jumlahPinjaman ?? 0,
      );
      const totalAngsuranMasuk = Number(piutangAngsuran._sum.nominal ?? 0);
      const totalPengeluaran = Number(pengeluaran._sum.jumlah ?? 0);

      const total =
        totalSetor -
        totalTarik +
        (totalSimpanan - totalPencairanHariRaya) -
        (totalPiutangDicairkan - totalAngsuranMasuk) -
        totalPengeluaran;

      return {
        total,
        breakdown: {
          totalSetor,
          totalTarik,
          totalSimpanan,
          totalPencairanHariRaya,
          totalPiutangDicairkan,
          totalAngsuranMasuk,
          totalPengeluaran,
        },
      };
    } catch {
      throw new InternalServerErrorException('Gagal menghitung kas utama');
    }
  }
}
