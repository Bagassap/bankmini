import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '../generated/prisma/client';
import { PengeluaranService } from './pengeluaran.service';
import { CreatePengeluaranDto } from './dto/create-pengeluaran.dto';
import { UpdatePengeluaranDto } from './dto/update-pengeluaran.dto';
import { StaffOnlyGuard } from '../auth/staff-only.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { resolveStaffId } from '../auth/resolve-staff-id';
import type { JwtPayload } from '../auth/jwt.strategy';

@Controller('pengeluaran')
@UseGuards(StaffOnlyGuard)
export class PengeluaranController {
  constructor(private readonly pengeluaranService: PengeluaranService) {}

  @Get()
  findAll(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
  ) {
    return this.pengeluaranService.findAll({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.teller, Role.co_teller)
  create(@Body() dto: CreatePengeluaranDto, @CurrentUser() user: JwtPayload) {
    return this.pengeluaranService.create({
      keterangan: dto.keterangan,
      jumlah: dto.jumlah,
      processedById: resolveStaffId(user),
    });
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.admin, Role.superadmin)
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePengeluaranDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.pengeluaranService.update(
      id,
      { jumlah: dto.jumlah, keterangan: dto.keterangan },
      resolveStaffId(user),
    );
  }
}
