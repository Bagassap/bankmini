export type Role = "superadmin" | "admin" | "teller";

export type JenisNasabah = "siswa" | "guru" | "umum";

export type JenisKelamin = "L" | "P";

export type StatusNasabah = "aktif" | "nonaktif";

export type JenisTransaksi = "setor" | "tarik";

export type AccountType = "staff" | "nasabah";

export interface User {
  id: string;
  username: string;
  nama: string;
  role: Role | JenisNasabah;
  accountType: AccountType;
  noRekening?: string;
}

export interface Nasabah {
  id: string;
  noRekening: string;
  nama: string;
  jenisNasabah: JenisNasabah;
  nis?: string | null;
  kelas?: string | null;
  jurusan?: string | null;
  nip?: string | null;
  jabatan?: string | null;
  alamat?: string | null;
  noTelepon?: string | null;
  jenisKelamin?: JenisKelamin | null;
  tanggalLahir?: string | null;
  saldo: string | number;
  status: StatusNasabah;
  createdAt: string;
  updatedAt: string;
}

export interface Transaksi {
  id: string;
  noTransaksi: string;
  nasabahId: string;
  nasabah?: Nasabah;
  jenisTransaksi: JenisTransaksi;
  jumlah: string | number;
  saldoSebelum: string | number;
  saldoSesudah: string | number;
  keterangan?: string | null;
  processedById: string;
  createdAt: string;
}

export interface NasabahStats {
  totalNasabah: number;
  totalSaldo: string | number;
  perJenis: { jenisNasabah: JenisNasabah; jumlah: number }[];
}

export interface TransaksiStats {
  tanggal: string;
  setor: { jumlahTransaksi: number; totalNominal: string | number };
  tarik: { jumlahTransaksi: number; totalNominal: string | number };
  totalTransaksi: number;
}
