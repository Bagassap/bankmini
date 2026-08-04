/**
 * One-time seed for real production accounts (staff + nasabah), replacing
 * all dummy/testing data. Run with: npx tsx prisma/seed-real-accounts.ts
 *
 * Password convention (per explicit product decision): password === username
 * for every account (No Rekening for staff, NPY/NIS for nasabah). A forced
 * password-change-on-first-login flow is planned as a future follow-up but
 * is intentionally NOT implemented here.
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role, JenisNasabah } from '../src/generated/prisma/client';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const KELAS_X_PEMASARAN_1 = 'X Pemasaran 1';

interface StaffSeed {
  noRekening: string;
  nama: string;
  role: Role;
}

// Staff (users table) - all 4 also have a personal nasabah savings account
// (jenisNasabah=guru, see GURU below) sharing the same noRekening/nama.
const STAFF: StaffSeed[] = [
  { noRekening: '7872336156', nama: 'Ahmad Imron, SE, MM', role: 'admin' },
  { noRekening: '1982587112', nama: 'Fitrianingsih S.Pd', role: 'admin' },
  { noRekening: '8798137717', nama: 'Fatim Purvitasari, SE', role: 'teller' },
  { noRekening: '6352692220', nama: 'Bagas Saputra, S.Kom', role: 'superadmin' },
];

interface GuruSeed {
  noRekening: string;
  npy: string;
  nama: string;
}

// Personal savings account for each staff member above (jenisNasabah=guru).
const GURU: GuruSeed[] = [
  { noRekening: '7872336156', npy: '15072006009', nama: 'Ahmad Imron, SE, MM' },
  { noRekening: '1982587112', npy: '15072004003', nama: 'Fitrianingsih S.Pd' },
  { noRekening: '8798137717', npy: '19082013041', nama: 'Fatim Purvitasari, SE' },
  { noRekening: '6352692220', npy: '2082021080', nama: 'Bagas Saputra, S.Kom' },
];

// Wali kelas: nasabah-only (no staff login), jenisNasabah=wali_kelas so the
// kelas-summary feature can query siswa/kelas balances by the `kelas` field.
const WALI_KELAS = {
  noRekening: '8956399708',
  npy: '14072025098',
  nama: 'Muhammad Kafabih, S.Pd',
  kelas: KELAS_X_PEMASARAN_1,
  jabatan: `Wali Kelas ${KELAS_X_PEMASARAN_1}`,
};

// Pooled class account - no login (mirrors how jenisNasabah=umum already
// has no username/password in this app).
const KELAS_ACCOUNT = {
  noRekening: '0201000001',
  nama: `Kelas ${KELAS_X_PEMASARAN_1}`,
  kelas: KELAS_X_PEMASARAN_1,
};

interface SiswaSeed {
  noRekening: string;
  nis: string;
  nama: string;
}

const SISWA: SiswaSeed[] = [
  { noRekening: '4044398163', nis: '260201001', nama: 'Adiva Rahadatul Aisy' },
  { noRekening: '4396901143', nis: '260201002', nama: 'Aisy Fadia Avrila' },
  { noRekening: '7448602271', nis: '260201003', nama: 'Almira Safa Aurora' },
  { noRekening: '5806893213', nis: '260201004', nama: 'Aninda Rahmawati' },
  { noRekening: '9411061356', nis: '260201005', nama: "Anisa Qod'Run Nada" },
  { noRekening: '4540705788', nis: '260201006', nama: 'Erlina Neyfora' },
  { noRekening: '7677962796', nis: '260201007', nama: 'Fahrizal Muhammad Anli' },
  { noRekening: '5785568177', nis: '260201008', nama: 'Feby Ariyanto' },
  { noRekening: '1165895355', nis: '260201009', nama: 'Fina Ramadani' },
  { noRekening: '3849206811', nis: '260201010', nama: 'Ifa Datun Nasiha' },
  { noRekening: '8536452329', nis: '260201011', nama: 'Johan Alfianto' },
  { noRekening: '5747852987', nis: '260201012', nama: 'Khaerul Nizar Ibrahim' },
  { noRekening: '6095255352', nis: '260201013', nama: 'Khusni Idla Thallaha' },
  { noRekening: '2829041730', nis: '260201014', nama: 'Livi Oktaviana Khoirotul Aini' },
  { noRekening: '9993291524', nis: '260201015', nama: 'Muhamad Hafidz Maulana' },
  { noRekening: '6400479985', nis: '260201016', nama: 'Natasha Jenny Miesella' },
  { noRekening: '7245429683', nis: '260201017', nama: 'Novalina Aula Sifa' },
  { noRekening: '2052018908', nis: '260201018', nama: 'Novia Indri Ani' },
  { noRekening: '7429961686', nis: '260201019', nama: 'Patria Muliani' },
  { noRekening: '3080594474', nis: '260201020', nama: 'Pramudita Anindya Ayu' },
  { noRekening: '6944637822', nis: '260201021', nama: 'Pravita Vidi Arsita Putri' },
  { noRekening: '9500291442', nis: '260201022', nama: 'Rizka Azkia' },
  { noRekening: '6313834403', nis: '260201023', nama: 'Selyn Dayu Sita' },
  { noRekening: '1219713487', nis: '260201024', nama: 'Septiya Nurul Aini' },
  { noRekening: '7881286352', nis: '260201025', nama: 'Sinda Aulia' },
  { noRekening: '9269929772', nis: '260201026', nama: 'Sintya Priscilia Putri' },
  { noRekening: '9601155320', nis: '260201027', nama: 'Tafia Kharisatun Nisa' },
  { noRekening: '2701101130', nis: '260201028', nama: 'Tiyara Khalerista Eka Pratiwi' },
  { noRekening: '1658898238', nis: '260201029', nama: 'Tyvennes Dwi Aprilia' },
  { noRekening: '2544840409', nis: '260201030', nama: 'Ulfi Ainissa' },
  { noRekening: '4461878459', nis: '260201031', nama: 'Zahra Nala Nada Navisa' },
  { noRekening: '3759863705', nis: '260201032', nama: 'Zaskia Dewi Nafaza' },
];

async function hash(value: string): Promise<string> {
  return bcrypt.hash(value, 10);
}

async function main() {
  console.log('Menghapus data lama (transaksi, sessions, nasabah, users)...');

  await prisma.$transaction([
    prisma.transaksi.deleteMany(),
    prisma.session.deleteMany(),
    prisma.nasabah.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  console.log('Membuat akun staf (users)...');
  for (const staff of STAFF) {
    await prisma.user.create({
      data: {
        username: staff.noRekening,
        password: await hash(staff.noRekening),
        nama: staff.nama,
        role: staff.role,
      },
    });
  }

  console.log('Membuat rekening nasabah guru...');
  for (const guru of GURU) {
    await prisma.nasabah.create({
      data: {
        noRekening: guru.noRekening,
        nama: guru.nama,
        jenisNasabah: JenisNasabah.guru,
        username: guru.npy,
        password: await hash(guru.npy),
      },
    });
  }

  console.log('Membuat rekening wali kelas...');
  await prisma.nasabah.create({
    data: {
      noRekening: WALI_KELAS.noRekening,
      nama: WALI_KELAS.nama,
      jenisNasabah: JenisNasabah.wali_kelas,
      kelas: WALI_KELAS.kelas,
      jabatan: WALI_KELAS.jabatan,
      username: WALI_KELAS.npy,
      password: await hash(WALI_KELAS.npy),
    },
  });

  console.log('Membuat rekening pooled kelas...');
  await prisma.nasabah.create({
    data: {
      noRekening: KELAS_ACCOUNT.noRekening,
      nama: KELAS_ACCOUNT.nama,
      jenisNasabah: JenisNasabah.kelas,
      kelas: KELAS_ACCOUNT.kelas,
      username: null,
      password: null,
    },
  });

  console.log('Membuat rekening nasabah siswa...');
  for (const siswa of SISWA) {
    await prisma.nasabah.create({
      data: {
        noRekening: siswa.noRekening,
        nama: siswa.nama,
        jenisNasabah: JenisNasabah.siswa,
        nis: siswa.nis,
        kelas: KELAS_X_PEMASARAN_1,
        username: siswa.nis,
        password: await hash(siswa.nis),
      },
    });
  }

  const [userCount, nasabahCount] = await Promise.all([
    prisma.user.count(),
    prisma.nasabah.count(),
  ]);

  console.log('\nSelesai.');
  console.log(`users: ${userCount}, nasabah: ${nasabahCount}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
