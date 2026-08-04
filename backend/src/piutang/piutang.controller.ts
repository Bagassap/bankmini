import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Role } from '../generated/prisma/client';
import { PiutangService } from './piutang.service';
import { CreatePiutangDto } from './dto/create-piutang.dto';
import { CreateAngsuranDto } from './dto/create-angsuran.dto';
import { StaffOnlyGuard } from '../auth/staff-only.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { resolveStaffId } from '../auth/resolve-staff-id';
import type { JwtPayload } from '../auth/jwt.strategy';

@Controller('piutang')
@UseGuards(StaffOnlyGuard, RolesGuard)
@Roles(Role.superadmin, Role.admin, Role.teller)
export class PiutangController {
  constructor(private readonly piutangService: PiutangService) {}

  @Get()
  findAll() {
    return this.piutangService.getRingkasan();
  }

  @Get('export')
  export() {
    return this.piutangService.getRingkasan();
  }

  @Get(':id/angsuran')
  getAngsuranHistory(@Param('id') id: string) {
    return this.piutangService.getAngsuranHistory(id);
  }

  @Post()
  createPiutang(
    @Body() dto: CreatePiutangDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.piutangService.createPiutang(
      dto.nasabahId,
      dto.jenisPiutang,
      dto.jumlahPinjaman,
      dto.tenor,
      dto.keterangan,
      resolveStaffId(user),
    );
  }

  @Post('angsuran')
  createAngsuran(
    @Body() dto: CreateAngsuranDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.piutangService.createAngsuran(
      dto.piutangId,
      resolveStaffId(user),
    );
  }
}
