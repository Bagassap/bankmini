import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAngsuranDto {
  @IsString()
  @IsNotEmpty()
  piutangId: string;
}
