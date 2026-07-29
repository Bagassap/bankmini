import { Role } from '../../generated/prisma/client';
import { IsIn, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  nama: string;

  @IsOptional()
  @IsIn(['superadmin', 'admin', 'teller'])
  role?: Role;
}
