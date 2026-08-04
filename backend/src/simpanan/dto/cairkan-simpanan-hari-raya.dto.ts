import { IsNotEmpty, IsString } from 'class-validator';

export class CairkanSimpananHariRayaDto {
  @IsString()
  @IsNotEmpty()
  nasabahId: string;
}
