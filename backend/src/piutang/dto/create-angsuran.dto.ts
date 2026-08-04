import { IsNotEmpty, IsString } from 'class-validator';

// Nominal is deliberately absent - it's derived server-side from the loan's
// jenisPiutang and how many installments are already paid (see
// PiutangService.createAngsuran), never accepted from the client.
export class CreateAngsuranDto {
  @IsString()
  @IsNotEmpty()
  piutangId: string;
}
