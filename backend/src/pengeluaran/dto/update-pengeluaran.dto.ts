import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class UpdatePengeluaranDto {
  @IsNumber()
  @IsPositive()
  jumlah: number;

  @IsOptional()
  @IsString()
  keterangan?: string;
}
