import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { StaffOnlyGuard } from '../auth/staff-only.guard';

@Controller('dashboard')
@UseGuards(StaffOnlyGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('kas-utama')
  getKasUtama() {
    return this.dashboardService.getKasUtama();
  }
}
