import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class UpdateTransaksiDto {
  @IsNumber()
  @IsPositive()
  jumlah: number;

  @IsOptional()
  @IsString()
  keterangan?: string;
}
