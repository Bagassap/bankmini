import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class DaftarSimpananHariRayaDto {
  @IsString()
  @IsNotEmpty()
  nasabahId: string;

  // Free amount, decided once at registration and locked for every deposit
  // in this cycle afterward.
  @IsNumber()
  @IsPositive()
  nominal: number;
}
