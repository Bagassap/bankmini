import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JenisTransaksi, Role } from '../generated/prisma/client';
import { TransaksiService } from './transaksi.service';
import { SetorTarikDto } from './dto/setor-tarik.dto';
import { UpdateTransaksiDto } from './dto/update-transaksi.dto';
import { StaffOnlyGuard } from '../auth/staff-only.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { resolveStaffId } from '../auth/resolve-staff-id';
import type { JwtPayload } from '../auth/jwt.strategy';

@Controller('transaksi')
export class TransaksiController {
  constructor(private readonly transaksiService: TransaksiService) {}

  @Post('setor')
  @UseGuards(StaffOnlyGuard, RolesGuard)
  @Roles(Role.teller, Role.co_teller)
  setor(@Body() dto: SetorTarikDto, @CurrentUser() user: JwtPayload) {
    return this.transaksiService.setor({
      nasabahId: dto.nasabahId,
      jumlah: dto.jumlah,
      keterangan: dto.keterangan,
      processedById: resolveStaffId(user),
    });
  }

  @Post('tarik')
  @UseGuards(StaffOnlyGuard, RolesGuard)
  @Roles(Role.teller, Role.co_teller)
  tarik(@Body() dto: SetorTarikDto, @CurrentUser() user: JwtPayload) {
    return this.transaksiService.tarik({
      nasabahId: dto.nasabahId,
      jumlah: dto.jumlah,
      keterangan: dto.keterangan,
      processedById: resolveStaffId(user),
    });
  }

  @Get('stats')
  @UseGuards(StaffOnlyGuard)
  getStats() {
    return this.transaksiService.getTransaksiStats();
  }

  @Patch(':id')
  @UseGuards(StaffOnlyGuard, RolesGuard)
  @Roles(Role.admin, Role.superadmin)
  updateTransaksi(
    @Param('id') id: string,
    @Body() dto: UpdateTransaksiDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.transaksiService.updateTransaksi(
      id,
      dto.jumlah,
      dto.keterangan,
      resolveStaffId(user),
    );
  }

  @Get('mutasi/:nasabahId')
  getMutasi(
    @Param('nasabahId') nasabahId: string,
    @CurrentUser() user: JwtPayload,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const isPureNasabah = user.accountType === 'nasabah' && !user.linkedStaff;
    if (isPureNasabah && user.id !== nasabahId) {
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
