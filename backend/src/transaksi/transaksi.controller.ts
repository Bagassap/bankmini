import {
  Body,
  Controller,
  Delete,
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
import { resolveStaffId, resolveStaffRole } from '../auth/resolve-staff-id';
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

  @Get('last-per-nasabah')
  @UseGuards(StaffOnlyGuard)
  getLastPerNasabah() {
    return this.transaksiService.getLastTransaksiPerNasabah();
  }

  // Teller/co_teller cuma boleh edit/hapus transaksi yang mereka proses
  // sendiri (koreksi salah input) - admin/superadmin bisa untuk semua.
  private async assertCanModify(id: string, user: JwtPayload): Promise<void> {
    const role = resolveStaffRole(user);
    if (role === Role.admin || role === Role.superadmin) return;
    const trx = await this.transaksiService.findTransaksiById(id);
    if (trx.processedById !== resolveStaffId(user)) {
      throw new ForbiddenException(
        'Hanya dapat mengubah/menghapus transaksi yang Anda proses sendiri',
      );
    }
  }

  @Patch(':id')
  @UseGuards(StaffOnlyGuard, RolesGuard)
  @Roles(Role.teller, Role.co_teller, Role.admin, Role.superadmin)
  async updateTransaksi(
    @Param('id') id: string,
    @Body() dto: UpdateTransaksiDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.assertCanModify(id, user);
    return this.transaksiService.updateTransaksi(
      id,
      dto.jumlah,
      dto.keterangan,
      resolveStaffId(user),
    );
  }

  @Delete(':id')
  @UseGuards(StaffOnlyGuard, RolesGuard)
  @Roles(Role.teller, Role.co_teller, Role.admin, Role.superadmin)
  async deleteTransaksi(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.assertCanModify(id, user);
    await this.transaksiService.deleteTransaksi(id);
    return { message: 'Transaksi berhasil dihapus' };
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
