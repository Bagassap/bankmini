import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class UpdateSaldoDto {
  @IsNumber()
  @Min(0)
  saldo: number;

  @IsString()
  @IsNotEmpty()
  alasan: string;
}
