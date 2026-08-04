import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreateSimpananHariRayaDto {
  @IsString()
  @IsNotEmpty()
  nasabahId: string;

  // No nominal here on purpose - the amount was already locked in when the
  // nasabah was registered (see DaftarSimpananHariRayaDto), Setor just
  // records which month it covers.
  // "YYYY-MM" - which month this deposit covers.
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'periode harus berformat YYYY-MM',
  })
  periode: string;
}
