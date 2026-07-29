import { JenisNasabah } from '../../generated/prisma/client';
import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateNasabahDto {
  @IsString()
  @IsNotEmpty()
  nama: string;

  @IsIn(['siswa', 'guru', 'umum', 'kelas', 'wali_kelas'])
  jenisNasabah: JenisNasabah;

  @IsOptional()
  @IsString()
  nis?: string;

  @IsOptional()
  @IsString()
  kelas?: string;

  @IsOptional()
  @IsString()
  jurusan?: string;

  @IsOptional()
  @IsString()
  nip?: string;

  @IsOptional()
  @IsString()
  jabatan?: string;

  @IsOptional()
  @IsString()
  alamat?: string;

  @IsOptional()
  @IsString()
  tahunAngkatan?: string;

  @IsOptional()
  @IsString()
  noTelepon?: string;

  @IsOptional()
  @IsIn(['L', 'P'])
  jenisKelamin?: 'L' | 'P';

  @IsOptional()
  @IsDateString()
  tanggalLahir?: string;
}
