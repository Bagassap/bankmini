import { Module } from '@nestjs/common';
import { PiutangService } from './piutang.service';
import { PiutangController } from './piutang.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [PiutangController],
  providers: [PiutangService],
  exports: [PiutangService],
})
export class PiutangModule {}
