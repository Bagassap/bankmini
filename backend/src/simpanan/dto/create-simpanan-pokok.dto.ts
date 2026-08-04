import { IsNotEmpty, IsString } from 'class-validator';

export class CreateSimpananPokokDto {
  @IsString()
  @IsNotEmpty()
  nasabahId: string;
}
