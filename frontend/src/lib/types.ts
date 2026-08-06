export type Role = "superadmin" | "admin" | "teller" | "co_teller";

export type JenisNasabah = "siswa" | "guru" | "umum" | "kelas" | "wali_kelas";

export type JenisKelamin = "L" | "P";

export type StatusNasabah = "aktif" | "nonaktif";

export type JenisTransaksi = "setor" | "tarik";

export type AccountType = "staff" | "nasabah";

export interface LinkedStaffInfo {
  id: string;
  role: Role;
  nama: string;
}

export interface User {
  id: string;
  username: string;
  nama: string;
  role: Role | JenisNasabah;
  accountType: AccountType;
  noRekening?: string;
  linkedStaff?: LinkedStaffInfo | null;
}

export interface Akun {
  id: string;
  username: string;
  nama: string;
  role: Role;
  isActive: boolean;
  lastLogin?: string | null;
  createdAt: string;
  updatedAt: string;
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
  tahunAngkatan?: string | null;
  noTelepon?: string | null;
  jenisKelamin?: JenisKelamin | null;
  tanggalLahir?: string | null;
  saldo: string | number;
  status: StatusNasabah;
  username?: string | null;
  isActive: boolean;
  lastLogin?: string | null;
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
  processedBy?: { nama: string } | null;
  createdAt: string;
  updatedAt: string;
  editedById?: string | null;
  editedBy?: { nama: string } | null;
}

export interface Pengeluaran {
  id: string;
  keterangan: string;
  jumlah: string | number;
  processedById: string;
  processedBy?: { nama: string } | null;
  editedById?: string | null;
  editedBy?: { nama: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface NasabahStats {
  totalNasabah: number;
  totalSaldo: string | number;
  perJenis: { jenisNasabah: JenisNasabah; jumlah: number }[];
}

export interface KelasSummarySiswa {
  id: string;
  noRekening: string;
  nama: string;
  nis?: string | null;
  saldo: string | number;
  status: StatusNasabah;
}

export interface KelasSummary {
  kelas: string;
  totalSaldo: string | number;
  kelasAccount: {
    id: string;
    noRekening: string;
    nama: string;
    saldo: string | number;
  } | null;
  totalSiswa: number;
  totalSaldoSiswa: string | number;
  siswa: KelasSummarySiswa[];
}

export interface TransaksiStats {
  tanggal: string;
  setor: { jumlahTransaksi: number; totalNominal: string | number };
  tarik: { jumlahTransaksi: number; totalNominal: string | number };
  totalTransaksi: number;
}

export interface SimpananRingkasanItem {
  nasabahId: string;
  nama: string;
  noRekening: string;
  punyaSimpananPokok: boolean;
  simpananPokok: number;
  simpananWajib: number;
  jumlah: number;
}

export interface SimpananWajibHistoryItem {
  id: string;
  nominal: number;
  periode: string;
  tanggalSetor: string;
  processedBy: string;
  createdAt: string;
}

export interface SimpananHariRayaRingkasanItem {
  nasabahId: string;
  nama: string;
  noRekening: string;
  totalTerkumpul: number;
  jumlahSetoran: number;
  target: number;
  progress: number;
  nominalPerBulan: number | null;
  lastPencairan: { tanggal: string; jumlah: number } | null;
}

export interface SimpananHariRayaHistoryItem {
  id: string;
  nominal: number;
  periode: string;
  tanggalSetor: string;
  processedBy: string;
  createdAt: string;
}

export type PiutangStatus = "aktif" | "lunas";

export type JenisPiutang = "bulanan" | "berkala";

export type JenisPembayaranAngsuran =
  | "pokok_dan_jasa"
  | "jasa_saja"
  | "pelunasan";

export interface PiutangNextAngsuran {
  bulanKe: number;
  nominal: number;
  jenisPembayaran: JenisPembayaranAngsuran;
}

export interface PiutangRingkasanItem {
  id: string;
  nasabahId: string;
  nama: string;
  noRekening: string;
  pinjamanKe: number;
  jenisPiutang: JenisPiutang;
  jumlahPinjaman: number;
  tenor: number;
  nominalJasaFlat: number;
  jasaAnggotaTotal: number;
  provisiAdm: number;
  nominalAngsuranPokokPerBulan: number | null;
  totalAngsuran: number;
  jumlahAngsuranTerbayar: number;
  saldo: number;
  status: PiutangStatus;
  tanggalPinjam: string;
  keterangan?: string | null;
  processedBy: string;
  nextAngsuran: PiutangNextAngsuran | null;
  sudahBayarBulanIni: boolean;
  lastAngsuran: PiutangAngsuranHistoryItem | null;
}

export interface PiutangAngsuranHistoryItem {
  id: string;
  bulanKe: number;
  jenisPembayaran: JenisPembayaranAngsuran;
  nominal: number;
  tanggalBayar: string;
  processedBy: string;
  createdAt: string;
}
