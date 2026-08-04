import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class SetorTarikDto {
  @IsString()
  @IsNotEmpty()
  nasabahId: string;

  @IsNumber()
  @IsPositive()
  jumlah: number;

  @IsOptional()
  @IsString()
  keterangan?: string;
}
