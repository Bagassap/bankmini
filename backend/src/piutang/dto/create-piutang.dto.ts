import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreatePiutangDto {
  @IsString()
  @IsNotEmpty()
  nasabahId: string;

  @IsIn(['bulanan', 'berkala'])
  jenisPiutang: 'bulanan' | 'berkala';

  @IsNumber()
  @IsPositive()
  jumlahPinjaman: number;

  @IsInt()
  @Min(1)
  @Max(24)
  tenor: number;

  @IsString()
  @IsOptional()
  keterangan?: string;
}
