import { IsEnum, IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';
import { KategoriPengeluaran } from '../../generated/prisma/client';

export class CreatePengeluaranDto {
  @IsEnum(KategoriPengeluaran)
  kategori: KategoriPengeluaran;

  @IsString()
  @IsNotEmpty()
  keterangan: string;

  @IsNumber()
  @IsPositive()
  jumlah: number;
}
