import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class CreatePengeluaranDto {
  @IsString()
  @IsNotEmpty()
  keterangan: string;

  @IsNumber()
  @IsPositive()
  jumlah: number;
}
