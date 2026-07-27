import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JenisTransaksi, Role } from '../generated/prisma/client';
import { TransaksiService } from './transaksi.service';
import { SetorTarikDto } from './dto/setor-tarik.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StaffOnlyGuard } from '../auth/staff-only.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';

@Controller('transaksi')
@UseGuards(JwtAuthGuard)
export class TransaksiController {
  constructor(private readonly transaksiService: TransaksiService) {}

  // Setor/tarik tunai adalah tugas teller — Admin/Superadmin hanya boleh
  // memantau (endpoint GET di bawah), bukan memproses transaksi kas.
  @Post('setor')
  @UseGuards(StaffOnlyGuard, RolesGuard)
  @Roles(Role.teller)
  setor(@Body() dto: SetorTarikDto, @CurrentUser() user: JwtPayload) {
    return this.transaksiService.setor({
      nasabahId: dto.nasabahId,
      jumlah: dto.jumlah,
      keterangan: dto.keterangan,
      processedById: user.id,
    });
  }

  @Post('tarik')
  @UseGuards(StaffOnlyGuard, RolesGuard)
  @Roles(Role.teller)
  tarik(@Body() dto: SetorTarikDto, @CurrentUser() user: JwtPayload) {
    return this.transaksiService.tarik({
      nasabahId: dto.nasabahId,
      jumlah: dto.jumlah,
      keterangan: dto.keterangan,
      processedById: user.id,
    });
  }

  @Get('stats')
  @UseGuards(StaffOnlyGuard)
  getStats() {
    return this.transaksiService.getTransaksiStats();
  }

  @Get('mutasi/:nasabahId')
  getMutasi(
    @Param('nasabahId') nasabahId: string,
    @CurrentUser() user: JwtPayload,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    if (user.accountType === 'nasabah' && user.id !== nasabahId) {
      throw new ForbiddenException('Tidak dapat mengakses mutasi nasabah lain');
    }
    return this.transaksiService.getMutasi(nasabahId, {
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Get()
  @UseGuards(StaffOnlyGuard)
  findAll(
    @Query('jenisTransaksi') jenisTransaksi?: JenisTransaksi,
    @Query('nasabahId') nasabahId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
  ) {
    return this.transaksiService.getAllTransaksi({
      jenisTransaksi,
      nasabahId,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }
}
