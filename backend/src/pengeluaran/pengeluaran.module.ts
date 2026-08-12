import { Module } from '@nestjs/common';
import { PengeluaranService } from './pengeluaran.service';
import { PengeluaranController } from './pengeluaran.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [PengeluaranController],
  providers: [PengeluaranService],
  exports: [PengeluaranService],
})
export class PengeluaranModule {}
