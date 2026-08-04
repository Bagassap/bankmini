import { Module } from '@nestjs/common';
import { PiutangService } from './piutang.service';
import { PiutangController } from './piutang.controller';

@Module({
  controllers: [PiutangController],
  providers: [PiutangService],
  exports: [PiutangService],
})
export class PiutangModule {}
