import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { startOfWibMonth, endOfWibMonthExclusive } from '../common/wib-date';
import {
  JenisPembayaranAngsuran,
  JenisPiutang,
  Prisma,
} from '../generated/prisma/client';
import { formatRupiah } from '../common/format-rupiah';
import { NotificationsService } from '../notifications/notifications.service';

type PiutangWithRelations = Prisma.PiutangGetPayload<{
  include: {
    nasabah: true;
    angsuran: { include: { processedBy: { select: { nama: true } } } };
    processedBy: { select: { nama: true } };
  };
}>;

const TENOR_MAX = 24;
const PERSENTASE_JASA: Record<JenisPiutang, number> = {
  bulanan: 1,
  berkala: 1.5,
};
const PERSENTASE_ADM = 0.5;

export interface PiutangNextAngsuran {
  bulanKe: number;
  nominal: number;
  jenisPembayaran: JenisPembayaranAngsuran;
}

export interface PiutangRingkasanItem {
  id: string;
  nasabahId: string;
  nama: string;
  noRekening: string;
  pinjamanKe: number;
  jenisPiutang: JenisPiutang;
  jumlahPinjaman: number;
  tenor: number;
  nominalJasaFlat: number;
  jasaAnggotaTotal: number;
  provisiAdm: number;
  nominalAngsuranPokokPerBulan: number | null;
  totalAngsuran: number;
  jumlahAngsuranTerbayar: number;
  saldo: number;
  status: 'aktif' | 'lunas';
  tanggalPinjam: Date;
  keterangan: string | null;
  processedBy: string;
  nextAngsuran: PiutangNextAngsuran | null;
  sudahBayarBulanIni: boolean;
  lastAngsuran: PiutangAngsuranHistoryItem | null;
}

export interface PiutangAngsuranHistoryItem {
  id: string;
  bulanKe: number;
  jenisPembayaran: JenisPembayaranAngsuran;
  nominal: number;
  tanggalBayar: Date;
  processedBy: string;
  createdAt: Date;
}

@Injectable()
export class PiutangService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getRingkasan(): Promise<PiutangRingkasanItem[]> {
    try {
      const rows = await this.prisma.piutang.findMany({
        orderBy: { tanggalPinjam: 'desc' },
        include: {
          nasabah: true,
          angsuran: { include: { processedBy: { select: { nama: true } } } },
          processedBy: { select: { nama: true } },
        },
      });

      return rows.map((p) => this.toRingkasanItem(p));
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Gagal mengambil data piutang');
    }
  }

  private toRingkasanItem(p: PiutangWithRelations): PiutangRingkasanItem {
    const jumlahAngsuranTerbayar = p.angsuran.length;
    const totalAngsuran = p.angsuran.reduce(
      (sum, a) => sum + Number(a.nominal),
      0,
    );

    let pokokTerbayar = 0;
    for (const a of p.angsuran) {
      if (a.jenisPembayaran === 'pokok_dan_jasa') {
        pokokTerbayar += Number(p.nominalAngsuranPokokPerBulan ?? 0);
      } else if (a.jenisPembayaran === 'pelunasan') {
        pokokTerbayar += Number(p.jumlahPinjaman);
      }
    }
    const saldo = Math.max(0, Number(p.jumlahPinjaman) - pokokTerbayar);
    const jasaAnggotaTotal = Number(p.nominalJasaFlat) * p.tenor;

    const lastAngsuranRow =
      p.angsuran.length > 0
        ? [...p.angsuran].sort((a, b) => b.bulanKe - a.bulanKe)[0]
        : null;
    const lastAngsuran: PiutangAngsuranHistoryItem | null = lastAngsuranRow
      ? {
          id: lastAngsuranRow.id,
          bulanKe: lastAngsuranRow.bulanKe,
          jenisPembayaran: lastAngsuranRow.jenisPembayaran,
          nominal: Number(lastAngsuranRow.nominal),
          tanggalBayar: lastAngsuranRow.tanggalBayar,
          processedBy: lastAngsuranRow.processedBy.nama,
          createdAt: lastAngsuranRow.createdAt,
        }
      : null;

    const monthStart = startOfWibMonth();
    const monthEnd = endOfWibMonthExclusive();
    const sudahBayarBulanIni = lastAngsuranRow
      ? lastAngsuranRow.tanggalBayar >= monthStart &&
        lastAngsuranRow.tanggalBayar < monthEnd
      : false;

    const nextAngsuran = this.computeAngsuran(
      {
        jenisPiutang: p.jenisPiutang,
        tenor: p.tenor,
        jumlahPinjaman: Number(p.jumlahPinjaman),
        nominalJasaFlat: Number(p.nominalJasaFlat),
        nominalAngsuranPokokPerBulan: p.nominalAngsuranPokokPerBulan
          ? Number(p.nominalAngsuranPokokPerBulan)
          : null,
      },
      jumlahAngsuranTerbayar,
    );

    return {
      id: p.id,
      nasabahId: p.nasabahId,
      nama: p.nasabah.nama,
      noRekening: p.nasabah.noRekening,
      pinjamanKe: p.pinjamanKe,
      jenisPiutang: p.jenisPiutang,
      jumlahPinjaman: Number(p.jumlahPinjaman),
      tenor: p.tenor,
      nominalJasaFlat: Number(p.nominalJasaFlat),
      jasaAnggotaTotal,
      provisiAdm: Number(p.provisiAdm),
      nominalAngsuranPokokPerBulan: p.nominalAngsuranPokokPerBulan
        ? Number(p.nominalAngsuranPokokPerBulan)
        : null,
      totalAngsuran,
      jumlahAngsuranTerbayar,
      saldo,
      status: saldo <= 0 ? 'lunas' : 'aktif',
      tanggalPinjam: p.tanggalPinjam,
      keterangan: p.keterangan,
      processedBy: p.processedBy.nama,
      nextAngsuran,
      sudahBayarBulanIni,
      lastAngsuran,
    };
  }

  private computeAngsuran(
    piutang: {
      jenisPiutang: JenisPiutang;
      tenor: number;
      jumlahPinjaman: number;
      nominalJasaFlat: number;
      nominalAngsuranPokokPerBulan: number | null;
    },
    jumlahAngsuranTerbayar: number,
  ): PiutangNextAngsuran | null {
    if (jumlahAngsuranTerbayar >= piutang.tenor) return null;

    const bulanKe = jumlahAngsuranTerbayar + 1;

    if (piutang.jenisPiutang === 'bulanan') {
      return {
        bulanKe,
        nominal:
          Number(piutang.nominalAngsuranPokokPerBulan) +
          piutang.nominalJasaFlat,
        jenisPembayaran: 'pokok_dan_jasa',
      };
    }

    if (bulanKe < piutang.tenor) {
      return {
        bulanKe,
        nominal: piutang.nominalJasaFlat,
        jenisPembayaran: 'jasa_saja',
      };
    }
    return {
      bulanKe,
      nominal: piutang.jumlahPinjaman + piutang.nominalJasaFlat,
      jenisPembayaran: 'pelunasan',
    };
  }

  private async findWithRelationsOrThrow(piutangId: string) {
    const piutang = await this.prisma.piutang.findUnique({
      where: { id: piutangId },
      include: { nasabah: true, angsuran: true },
    });
    if (!piutang) {
      throw new NotFoundException('Piutang tidak ditemukan');
    }
    return piutang;
  }

  async createPiutang(
    nasabahId: string,
    jenisPiutang: JenisPiutang,
    jumlahPinjaman: number,
    tenor: number,
    keterangan: string | undefined,
    processedById: string,
  ) {
    try {
      if (tenor < 1 || tenor > TENOR_MAX) {
        throw new BadRequestException(
          `Tenor harus antara 1 - ${TENOR_MAX} bulan`,
        );
      }

      const nasabah = await this.prisma.nasabah.findUnique({
        where: { id: nasabahId },
      });
      if (!nasabah) {
        throw new NotFoundException('Nasabah tidak ditemukan');
      }

      const persentaseJasa = PERSENTASE_JASA[jenisPiutang];
      const persentaseAdm = PERSENTASE_ADM;
      const nominalJasaFlat = Math.round(
        (jumlahPinjaman * persentaseJasa) / 100,
      );
      const provisiAdm = Math.round((jumlahPinjaman * persentaseAdm) / 100);
      const nominalAngsuranPokokPerBulan =
        jenisPiutang === 'bulanan' ? Math.round(jumlahPinjaman / tenor) : null;

      const pinjamanSebelumnya = await this.prisma.piutang.count({
        where: { nasabahId },
      });

      const piutang = await this.prisma.piutang.create({
        data: {
          nasabahId,
          pinjamanKe: pinjamanSebelumnya + 1,
          jenisPiutang,
          jumlahPinjaman,
          tenor,
          persentaseJasa,
          persentaseAdm,
          nominalJasaFlat,
          provisiAdm,
          nominalAngsuranPokokPerBulan,
          keterangan,
          processedById,
        },
      });

      const jumlahLabel = formatRupiah(jumlahPinjaman);
      this.notificationsService
        .create({
          recipientType: 'staff_broadcast',
          type: 'piutang_baru',
          title: 'Pinjaman baru dicairkan',
          description: `${nasabah.nama} mencairkan pinjaman ${jumlahLabel}`,
        })
        .catch(() => {});
      this.notificationsService
        .create({
          recipientType: 'nasabah',
          nasabahId,
          type: 'piutang_baru',
          title: 'Pinjaman Anda telah dicairkan',
          description: `Pinjaman sebesar ${jumlahLabel} telah dicairkan ke rekening Anda`,
          link: '/portal/riwayat',
        })
        .catch(() => {});

      return piutang;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Gagal menambahkan piutang');
    }
  }

  async getAngsuranHistory(
    piutangId: string,
  ): Promise<PiutangAngsuranHistoryItem[]> {
    try {
      const piutang = await this.prisma.piutang.findUnique({
        where: { id: piutangId },
      });
      if (!piutang) {
        throw new NotFoundException('Piutang tidak ditemukan');
      }

      const rows = await this.prisma.piutangAngsuran.findMany({
        where: { piutangId },
        orderBy: { bulanKe: 'desc' },
        include: { processedBy: { select: { nama: true } } },
      });
      return rows.map((r) => ({
        id: r.id,
        bulanKe: r.bulanKe,
        jenisPembayaran: r.jenisPembayaran,
        nominal: Number(r.nominal),
        tanggalBayar: r.tanggalBayar,
        processedBy: r.processedBy.nama,
        createdAt: r.createdAt,
      }));
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Gagal mengambil riwayat angsuran',
      );
    }
  }

  async createAngsuran(
    piutangId: string,
    processedById: string,
  ): Promise<PiutangAngsuranHistoryItem> {
    try {
      const piutang = await this.findWithRelationsOrThrow(piutangId);

      const next = this.computeAngsuran(
        {
          jenisPiutang: piutang.jenisPiutang,
          tenor: piutang.tenor,
          jumlahPinjaman: Number(piutang.jumlahPinjaman),
          nominalJasaFlat: Number(piutang.nominalJasaFlat),
          nominalAngsuranPokokPerBulan: piutang.nominalAngsuranPokokPerBulan
            ? Number(piutang.nominalAngsuranPokokPerBulan)
            : null,
        },
        piutang.angsuran.length,
      );

      if (!next) {
        throw new BadRequestException('Piutang ini sudah lunas');
      }

      const lastAngsuranRow =
        piutang.angsuran.length > 0
          ? [...piutang.angsuran].sort((a, b) => b.bulanKe - a.bulanKe)[0]
          : null;
      const monthStart = startOfWibMonth();
      const monthEnd = endOfWibMonthExclusive();
      const sudahBayarBulanIni = lastAngsuranRow
        ? lastAngsuranRow.tanggalBayar >= monthStart &&
          lastAngsuranRow.tanggalBayar < monthEnd
        : false;
      if (sudahBayarBulanIni) {
        throw new BadRequestException(
          'Angsuran bulan ini sudah dibayar, hanya bisa membayar 1x angsuran per bulan',
        );
      }

      const created = await this.prisma.piutangAngsuran.create({
        data: {
          piutangId,
          bulanKe: next.bulanKe,
          jenisPembayaran: next.jenisPembayaran,
          nominal: next.nominal,
          processedById,
        },
        include: { processedBy: { select: { nama: true } } },
      });

      return {
        id: created.id,
        bulanKe: created.bulanKe,
        jenisPembayaran: created.jenisPembayaran,
        nominal: Number(created.nominal),
        tanggalBayar: created.tanggalBayar,
        processedBy: created.processedBy.nama,
        createdAt: created.createdAt,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Gagal menambahkan angsuran');
    }
  }
}
