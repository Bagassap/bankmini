import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Pengeluaran, Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { wibDayRangeFromDateOnly } from '../common/wib-date';
import { formatRupiah } from '../common/format-rupiah';
import { NotificationsService } from '../notifications/notifications.service';

export interface CreatePengeluaranInput {
  keterangan: string;
  jumlah: number;
  processedById: string;
}

export interface PengeluaranFilter {
  from?: Date;
  to?: Date;
  limit?: number;
}

const INCLUDE = {
  processedBy: { select: { nama: true } },
  editedBy: { select: { nama: true } },
} satisfies Prisma.PengeluaranInclude;

@Injectable()
export class PengeluaranService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(input: CreatePengeluaranInput): Promise<Pengeluaran> {
    try {
      const pengeluaran = await this.prisma.pengeluaran.create({
        data: {
          keterangan: input.keterangan,
          jumlah: new Prisma.Decimal(input.jumlah),
          processedById: input.processedById,
        },
        include: INCLUDE,
      });
      this.notificationsService
        .create({
          recipientType: 'staff_broadcast',
          type: 'pengeluaran_baru',
          title: 'Pengeluaran operasional baru',
          description: `${pengeluaran.keterangan}: ${formatRupiah(pengeluaran.jumlah)}`,
        })
        .catch(() => {});
      return pengeluaran;
    } catch {
      throw new InternalServerErrorException('Gagal mencatat pengeluaran');
    }
  }

  async findAll(filter: PengeluaranFilter = {}) {
    try {
      const where: Prisma.PengeluaranWhereInput = {};
      if (filter.from || filter.to) {
        where.createdAt = {
          ...(filter.from
            ? { gte: wibDayRangeFromDateOnly(filter.from).start }
            : {}),
          ...(filter.to ? { lt: wibDayRangeFromDateOnly(filter.to).end } : {}),
        };
      }

      return await this.prisma.pengeluaran.findMany({
        where,
        include: INCLUDE,
        orderBy: { createdAt: 'desc' },
        take: filter.limit,
      });
    } catch {
      throw new InternalServerErrorException('Gagal mengambil data pengeluaran');
    }
  }

  async update(
    id: string,
    data: {
      jumlah: number;
      keterangan?: string;
    },
    editedById: string,
  ): Promise<Pengeluaran> {
    const newJumlah = new Prisma.Decimal(data.jumlah);
    if (newJumlah.lte(0)) {
      throw new BadRequestException('Jumlah harus lebih dari 0');
    }

    const existing = await this.prisma.pengeluaran.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Pengeluaran tidak ditemukan');
    }

    try {
      return await this.prisma.pengeluaran.update({
        where: { id },
        data: {
          jumlah: newJumlah,
          keterangan: data.keterangan ?? existing.keterangan,
          editedById,
        },
        include: INCLUDE,
      });
    } catch {
      throw new InternalServerErrorException('Gagal memperbarui pengeluaran');
    }
  }
}
