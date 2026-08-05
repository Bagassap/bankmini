import { Module } from '@nestjs/common';
import { PengeluaranService } from './pengeluaran.service';
import { PengeluaranController } from './pengeluaran.controller';

@Module({
  controllers: [PengeluaranController],
  providers: [PengeluaranService],
  exports: [PengeluaranService],
})
export class PengeluaranModule {}
