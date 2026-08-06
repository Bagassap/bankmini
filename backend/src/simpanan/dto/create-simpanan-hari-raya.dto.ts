import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreateSimpananHariRayaDto {
  @IsString()
  @IsNotEmpty()
  nasabahId: string;

  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'periode harus berformat YYYY-MM',
  })
  periode: string;
}
