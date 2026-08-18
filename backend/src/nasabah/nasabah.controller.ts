import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JenisNasabah, Role, StatusNasabah } from '../generated/prisma/client';
import { NasabahService, SafeNasabah } from './nasabah.service';
import { CreateNasabahDto } from './dto/create-nasabah.dto';
import { UpdateNasabahDto } from './dto/update-nasabah.dto';
import { UpdateOwnProfileDto } from './dto/update-own-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateSaldoDto } from './dto/update-saldo.dto';
import { StaffOnlyGuard } from '../auth/staff-only.guard';
import { NasabahOnlyGuard } from '../auth/nasabah-only.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';

@Controller('nasabah')
export class NasabahController {
  constructor(private readonly nasabahService: NasabahService) {}

  @Get('stats')
  @UseGuards(StaffOnlyGuard)
  getStats() {
    return this.nasabahService.getDashboardStats();
  }

  @Get('me')
  @UseGuards(NasabahOnlyGuard)
  getMe(@CurrentUser() user: JwtPayload): Promise<SafeNasabah> {
    return this.nasabahService.findById(user.id);
  }

  @Patch('me')
  @UseGuards(NasabahOnlyGuard)
  updateMe(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateOwnProfileDto,
  ): Promise<SafeNasabah> {
    return this.nasabahService.update(user.id, dto);
  }

  @Get('me/kelas-summary')
  @UseGuards(NasabahOnlyGuard)
  getKelasSummary(@CurrentUser() user: JwtPayload) {
    return this.nasabahService.getKelasSummary(user.id);
  }

  @Patch('me/password')
  @UseGuards(NasabahOnlyGuard)
  async changePassword(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    await this.nasabahService.changePassword(
      user.id,
      dto.currentPassword,
      dto.newPassword,
    );
    return { message: 'Password berhasil diubah' };
  }

  @Get('no-rekening/:noRekening')
  @UseGuards(StaffOnlyGuard)
  findByNoRekening(
    @Param('noRekening') noRekening: string,
  ): Promise<SafeNasabah> {
    return this.nasabahService.findByNoRekening(noRekening);
  }

  @Get()
  @UseGuards(StaffOnlyGuard)
  findAll(
    @Query('jenis') jenis?: JenisNasabah,
    @Query('status') status?: StatusNasabah,
    @Query('search') search?: string,
    @Query('kelas') kelas?: string,
  ): Promise<SafeNasabah[]> {
    return this.nasabahService.findAll({ jenis, status, search, kelas });
  }

  @Post()
  @UseGuards(StaffOnlyGuard)
  create(@Body() dto: CreateNasabahDto): Promise<SafeNasabah> {
    return this.nasabahService.create({
      ...dto,
      tanggalLahir: dto.tanggalLahir ? new Date(dto.tanggalLahir) : undefined,
    });
  }

  @Get(':id')
  @UseGuards(StaffOnlyGuard)
  findById(@Param('id') id: string): Promise<SafeNasabah> {
    return this.nasabahService.findById(id);
  }

  @Patch(':id')
  @UseGuards(StaffOnlyGuard)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateNasabahDto,
  ): Promise<SafeNasabah> {
    return this.nasabahService.update(id, {
      ...dto,
      tanggalLahir: dto.tanggalLahir ? new Date(dto.tanggalLahir) : undefined,
    });
  }

  @Delete(':id')
  @UseGuards(StaffOnlyGuard)
  delete(@Param('id') id: string): Promise<SafeNasabah> {
    return this.nasabahService.delete(id);
  }

  @Patch(':id/saldo')
  @UseGuards(StaffOnlyGuard)
  koreksiSaldo(
    @Param('id') id: string,
    @Body() dto: UpdateSaldoDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<SafeNasabah> {
    const staffNama =
      user.accountType === 'staff' ? user.nama : user.linkedStaff!.nama;
    return this.nasabahService.koreksiSaldo(
      id,
      dto.saldo,
      dto.alasan,
      staffNama,
    );
  }

  @Get(':id/password')
  @UseGuards(StaffOnlyGuard, RolesGuard)
  @Roles(Role.superadmin)
  async getPassword(
    @Param('id') id: string,
  ): Promise<{ password: string | null }> {
    const password = await this.nasabahService.getDecryptedPassword(id);
    return { password };
  }

  @Post(':id/reset-password')
  @UseGuards(StaffOnlyGuard, RolesGuard)
  @Roles(Role.superadmin)
  async resetPassword(@Param('id') id: string): Promise<{ message: string }> {
    await this.nasabahService.resetPassword(id);
    return { message: 'Password berhasil direset ke default' };
  }
}
