import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class DaftarSimpananHariRayaDto {
  @IsString()
  @IsNotEmpty()
  nasabahId: string;

  @IsNumber()
  @IsPositive()
  nominal: number;
}
