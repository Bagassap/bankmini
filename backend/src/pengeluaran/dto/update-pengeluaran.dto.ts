import { IsEnum, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { KategoriPengeluaran } from '../../generated/prisma/client';

export class UpdatePengeluaranDto {
  @IsNumber()
  @IsPositive()
  jumlah: number;

  @IsOptional()
  @IsString()
  keterangan?: string;

  @IsOptional()
  @IsEnum(KategoriPengeluaran)
  kategori?: KategoriPengeluaran;
}
