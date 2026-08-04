import { Module } from '@nestjs/common';
import { SimpananService } from './simpanan.service';
import { SimpananController } from './simpanan.controller';

@Module({
  controllers: [SimpananController],
  providers: [SimpananService],
  exports: [SimpananService],
})
export class SimpananModule {}
