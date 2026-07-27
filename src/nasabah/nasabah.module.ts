import { Module } from '@nestjs/common';
import { NasabahService } from './nasabah.service';
import { NasabahController } from './nasabah.controller';

@Module({
  controllers: [NasabahController],
  providers: [NasabahService],
  exports: [NasabahService],
})
export class NasabahModule {}
