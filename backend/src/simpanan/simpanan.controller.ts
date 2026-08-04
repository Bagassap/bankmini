import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Role } from '../generated/prisma/client';
import { SimpananService } from './simpanan.service';
import { CreateSimpananPokokDto } from './dto/create-simpanan-pokok.dto';
import { CreateSimpananWajibDto } from './dto/create-simpanan-wajib.dto';
import { CreateSimpananHariRayaDto } from './dto/create-simpanan-hari-raya.dto';
import { DaftarSimpananHariRayaDto } from './dto/daftar-simpanan-hari-raya.dto';
import { CairkanSimpananHariRayaDto } from './dto/cairkan-simpanan-hari-raya.dto';
import { StaffOnlyGuard } from '../auth/staff-only.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { resolveStaffId } from '../auth/resolve-staff-id';
import type { JwtPayload } from '../auth/jwt.strategy';

@Controller('simpanan')
@UseGuards(StaffOnlyGuard, RolesGuard)
@Roles(Role.superadmin, Role.admin, Role.teller)
export class SimpananController {
  constructor(private readonly simpananService: SimpananService) {}

  @Get()
  findAll() {
    return this.simpananService.getRingkasan();
  }

  @Get('export')
  export() {
    return this.simpananService.getRingkasan();
  }

  @Get('wajib/:nasabahId')
  getWajibHistory(@Param('nasabahId') nasabahId: string) {
    return this.simpananService.getWajibHistory(nasabahId);
  }

  @Post('pokok')
  createPokok(
    @Body() dto: CreateSimpananPokokDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.simpananService.createPokok(
      dto.nasabahId,
      resolveStaffId(user),
    );
  }

  @Post('wajib')
  createWajib(
    @Body() dto: CreateSimpananWajibDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.simpananService.createWajib(
      dto.nasabahId,
      dto.periode,
      resolveStaffId(user),
    );
  }

  @Get('hari-raya')
  findAllHariRaya() {
    return this.simpananService.getHariRayaRingkasan();
  }

  @Get('hari-raya/:nasabahId')
  getHariRayaHistory(@Param('nasabahId') nasabahId: string) {
    return this.simpananService.getHariRayaHistory(nasabahId);
  }

  @Post('hari-raya/anggota')
  daftarAnggotaHariRaya(
    @Body() dto: DaftarSimpananHariRayaDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.simpananService.daftarAnggotaHariRaya(
      dto.nasabahId,
      dto.nominal,
      resolveStaffId(user),
    );
  }

  @Post('hari-raya')
  createHariRaya(
    @Body() dto: CreateSimpananHariRayaDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.simpananService.createHariRaya(
      dto.nasabahId,
      dto.periode,
      resolveStaffId(user),
    );
  }

  @Post('hari-raya/cairkan')
  cairkanHariRaya(
    @Body() dto: CairkanSimpananHariRayaDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.simpananService.cairkanHariRaya(
      dto.nasabahId,
      resolveStaffId(user),
    );
  }
}
