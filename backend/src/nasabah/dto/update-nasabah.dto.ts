import { JenisNasabah, StatusNasabah } from '../../generated/prisma/client';
import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateNasabahDto {
  @IsOptional()
  @IsString()
  nama?: string;

  @IsOptional()
  @IsIn(['siswa', 'guru', 'umum', 'kelas', 'wali_kelas'])
  jenisNasabah?: JenisNasabah;

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

  @IsOptional()
  @IsIn(['aktif', 'nonaktif'])
  status?: StatusNasabah;
}
