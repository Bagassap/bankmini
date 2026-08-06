import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { JenisTransaksi, Prisma, Transaksi } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  startOfWibDay,
  endOfWibDayExclusive,
  wibDateParts,
  wibDayRangeFromDateOnly,
} from '../common/wib-date';

export interface SetorTarikInput {
  nasabahId: string;
  jumlah: Prisma.Decimal | number | string;
  processedById: string;
  keterangan?: string;
}

export interface MutasiFilter {
  from?: Date;
  to?: Date;
}

export interface AllTransaksiFilter {
  jenisTransaksi?: JenisTransaksi;
  nasabahId?: string;
  from?: Date;
  to?: Date;
  limit?: number;
}

@Injectable()
export class TransaksiService {
  constructor(private readonly prisma: PrismaService) {}

  private async generateNoTransaksi(
    tx: Prisma.TransactionClient,
  ): Promise<string> {
    const { year, month, day } = wibDateParts();
    const yy = String(year).slice(-2);
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const prefix = `TRX${yy}${mm}${dd}`;

    const count = await tx.transaksi.count({
      where: { noTransaksi: { startsWith: prefix } },
    });
    const sequence = String(count + 1).padStart(6, '0');
    return `${prefix}${sequence}`;
  }

  async setor(input: SetorTarikInput): Promise<Transaksi> {
    try {
      const jumlah = new Prisma.Decimal(input.jumlah);
      if (jumlah.lte(0)) {
        throw new BadRequestException('Jumlah setor harus lebih dari 0');
      }

      return await this.prisma.$transaction(async (tx) => {
        const nasabah = await tx.nasabah.findUnique({
          where: { id: input.nasabahId },
        });
        if (!nasabah) {
          throw new NotFoundException(
            `Nasabah dengan id ${input.nasabahId} tidak ditemukan`,
          );
        }

        const saldoSebelum = nasabah.saldo;
        const saldoSesudah = saldoSebelum.add(jumlah);

        await tx.nasabah.update({
          where: { id: input.nasabahId },
          data: { saldo: saldoSesudah },
        });

        const noTransaksi = await this.generateNoTransaksi(tx);

        return await tx.transaksi.create({
          data: {
            noTransaksi,
            nasabahId: input.nasabahId,
            jenisTransaksi: JenisTransaksi.setor,
            jumlah,
            saldoSebelum,
            saldoSesudah,
            keterangan: input.keterangan,
            processedById: input.processedById,
          },
        });
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Gagal melakukan setor');
    }
  }

  async tarik(input: SetorTarikInput): Promise<Transaksi> {
    try {
      const jumlah = new Prisma.Decimal(input.jumlah);
      if (jumlah.lte(0)) {
        throw new BadRequestException('Jumlah tarik harus lebih dari 0');
      }

      return await this.prisma.$transaction(async (tx) => {
        const nasabah = await tx.nasabah.findUnique({
          where: { id: input.nasabahId },
        });
        if (!nasabah) {
          throw new NotFoundException(
            `Nasabah dengan id ${input.nasabahId} tidak ditemukan`,
          );
        }

        const saldoSebelum = nasabah.saldo;
        if (saldoSebelum.lt(jumlah)) {
          throw new BadRequestException('Saldo tidak mencukupi');
        }
        const saldoSesudah = saldoSebelum.sub(jumlah);

        await tx.nasabah.update({
          where: { id: input.nasabahId },
          data: { saldo: saldoSesudah },
        });

        const noTransaksi = await this.generateNoTransaksi(tx);

        return await tx.transaksi.create({
          data: {
            noTransaksi,
            nasabahId: input.nasabahId,
            jenisTransaksi: JenisTransaksi.tarik,
            jumlah,
            saldoSebelum,
            saldoSesudah,
            keterangan: input.keterangan,
            processedById: input.processedById,
          },
        });
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Gagal melakukan tarik');
    }
  }

  async updateTransaksi(
    id: string,
    jumlah: number,
    keterangan: string | undefined,
    editedById: string,
  ): Promise<Transaksi> {
    try {
      const newJumlah = new Prisma.Decimal(jumlah);
      if (newJumlah.lte(0)) {
        throw new BadRequestException('Jumlah harus lebih dari 0');
      }

      return await this.prisma.$transaction(async (tx) => {
        const trx = await tx.transaksi.findUnique({ where: { id } });
        if (!trx) {
          throw new NotFoundException('Transaksi tidak ditemukan');
        }

        const signedEffect = (t: {
          jenisTransaksi: JenisTransaksi;
          jumlah: Prisma.Decimal;
        }) =>
          t.jenisTransaksi === JenisTransaksi.setor
            ? t.jumlah
            : t.jumlah.negated();

        const delta = signedEffect({ ...trx, jumlah: newJumlah }).sub(
          signedEffect(trx),
        );
        const newSaldoSesudah = trx.saldoSesudah.add(delta);
        if (newSaldoSesudah.lt(0)) {
          throw new BadRequestException(
            'Perubahan ini membuat saldo nasabah menjadi negatif',
          );
        }

        const laterTrx = delta.isZero()
          ? []
          : await tx.transaksi.findMany({
              where: {
                nasabahId: trx.nasabahId,
                noTransaksi: { gt: trx.noTransaksi },
              },
              orderBy: { noTransaksi: 'asc' },
            });

        for (const t of laterTrx) {
          if (t.saldoSesudah.add(delta).lt(0)) {
            throw new BadRequestException(
              'Perubahan ini menyebabkan saldo nasabah menjadi negatif pada transaksi setelahnya',
            );
          }
        }

        const updated = await tx.transaksi.update({
          where: { id },
          data: {
            jumlah: newJumlah,
            saldoSesudah: newSaldoSesudah,
            keterangan: keterangan ?? null,
            editedById,
          },
        });

        for (const t of laterTrx) {
          await tx.transaksi.update({
            where: { id: t.id },
            data: {
              saldoSebelum: t.saldoSebelum.add(delta),
              saldoSesudah: t.saldoSesudah.add(delta),
            },
          });
        }

        if (!delta.isZero()) {
          await tx.nasabah.update({
            where: { id: trx.nasabahId },
            data: { saldo: { increment: delta } },
          });
        }

        return updated;
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Gagal mengubah transaksi');
    }
  }

  async getMutasi(nasabahId: string, filter: MutasiFilter = {}) {
    try {
      const where: Prisma.TransaksiWhereInput = { nasabahId };
      if (filter.from || filter.to) {
        where.createdAt = {
          ...(filter.from
            ? { gte: wibDayRangeFromDateOnly(filter.from).start }
            : {}),
          ...(filter.to ? { lt: wibDayRangeFromDateOnly(filter.to).end } : {}),
        };
      }

      return await this.prisma.transaksi.findMany({
        where,
        include: { processedBy: { select: { nama: true } } },
        orderBy: { createdAt: 'desc' },
      });
    } catch {
      throw new InternalServerErrorException('Gagal mengambil mutasi');
    }
  }

  async getAllTransaksi(filter: AllTransaksiFilter = {}) {
    try {
      const where: Prisma.TransaksiWhereInput = {};
      if (filter.jenisTransaksi) where.jenisTransaksi = filter.jenisTransaksi;
      if (filter.nasabahId) where.nasabahId = filter.nasabahId;
      if (filter.from || filter.to) {
        where.createdAt = {
          ...(filter.from
            ? { gte: wibDayRangeFromDateOnly(filter.from).start }
            : {}),
          ...(filter.to ? { lt: wibDayRangeFromDateOnly(filter.to).end } : {}),
        };
      }

      return await this.prisma.transaksi.findMany({
        where,
        include: {
          nasabah: true,
          processedBy: { select: { nama: true } },
          editedBy: { select: { nama: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: filter.limit,
      });
    } catch {
      throw new InternalServerErrorException('Gagal mengambil data transaksi');
    }
  }

  async getTransaksiStats() {
    try {
      const startOfDay = startOfWibDay();
      const endOfDay = endOfWibDayExclusive();

      const grouped = await this.prisma.transaksi.groupBy({
        by: ['jenisTransaksi'],
        where: { createdAt: { gte: startOfDay, lt: endOfDay } },
        _count: { _all: true },
        _sum: { jumlah: true },
      });

      const setor = grouped.find(
        (item) => item.jenisTransaksi === JenisTransaksi.setor,
      );
      const tarik = grouped.find(
        (item) => item.jenisTransaksi === JenisTransaksi.tarik,
      );

      return {
        tanggal: startOfDay,
        setor: {
          jumlahTransaksi: setor?._count._all ?? 0,
          totalNominal: setor?._sum.jumlah ?? 0,
        },
        tarik: {
          jumlahTransaksi: tarik?._count._all ?? 0,
          totalNominal: tarik?._sum.jumlah ?? 0,
        },
        totalTransaksi: (setor?._count._all ?? 0) + (tarik?._count._all ?? 0),
      };
    } catch {
      throw new InternalServerErrorException(
        'Gagal mengambil statistik transaksi',
      );
    }
  }
}
