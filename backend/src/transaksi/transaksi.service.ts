import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { JenisTransaksi, Prisma, Transaksi } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

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
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
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

  async getMutasi(
    nasabahId: string,
    filter: MutasiFilter = {},
  ): Promise<Transaksi[]> {
    try {
      const where: Prisma.TransaksiWhereInput = { nasabahId };
      if (filter.from || filter.to) {
        where.createdAt = {
          ...(filter.from ? { gte: filter.from } : {}),
          ...(filter.to ? { lte: filter.to } : {}),
        };
      }

      return await this.prisma.transaksi.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
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
          ...(filter.from ? { gte: filter.from } : {}),
          ...(filter.to ? { lte: filter.to } : {}),
        };
      }

      return await this.prisma.transaksi.findMany({
        where,
        include: { nasabah: true },
        orderBy: { createdAt: 'desc' },
        take: filter.limit,
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Gagal mengambil data transaksi',
      );
    }
  }

  async getTransaksiStats() {
    try {
      const now = new Date();
      const startOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );
      const endOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
      );

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
        totalTransaksi:
          (setor?._count._all ?? 0) + (tarik?._count._all ?? 0),
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Gagal mengambil statistik transaksi',
      );
    }
  }
}
