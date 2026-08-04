import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreateSimpananWajibDto {
  @IsString()
  @IsNotEmpty()
  nasabahId: string;

  // "YYYY-MM" - which month this deposit covers, independent of the actual
  // deposit date (tellers may backfill a previous month).
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'periode harus berformat YYYY-MM',
  })
  periode: string;
}
