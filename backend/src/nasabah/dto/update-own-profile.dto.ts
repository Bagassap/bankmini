import { IsOptional, IsString } from 'class-validator';

export class UpdateOwnProfileDto {
  @IsOptional()
  @IsString()
  alamat?: string;

  @IsOptional()
  @IsString()
  noTelepon?: string;
}
