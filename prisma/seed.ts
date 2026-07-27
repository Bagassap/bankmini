import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function buildNoRekening(sequence: number): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `BM${yy}${mm}${dd}${String(sequence).padStart(4, '0')}`;
}

async function main() {
  const superadminPassword = await bcrypt.hash('superadmin123', 10);
  const adminPassword = await bcrypt.hash('admin123', 10);
  const tellerPassword = await bcrypt.hash('teller123', 10);

  await prisma.user.upsert({
    where: { username: 'superadmin' },
    update: {},
    create: {
      username: 'superadmin',
      password: superadminPassword,
      nama: 'Super Administrator',
      role: 'superadmin',
    },
  });

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: adminPassword,
      nama: 'Administrator',
      role: 'admin',
    },
  });

  await prisma.user.upsert({
    where: { username: 'teller1' },
    update: {},
    create: {
      username: 'teller1',
      password: tellerPassword,
      nama: 'Teller Satu',
      role: 'teller',
    },
  });

  const noRekeningSiswa = buildNoRekening(1);
  const usernameSiswa = '2025001';
  await prisma.nasabah.upsert({
    where: { noRekening: noRekeningSiswa },
    update: { username: usernameSiswa },
    create: {
      noRekening: noRekeningSiswa,
      nama: 'Siswa Contoh',
      jenisNasabah: 'siswa',
      nis: usernameSiswa,
      kelas: 'XII',
      jurusan: 'RPL',
      jenisKelamin: 'L',
      alamat: 'Jl. Pendidikan No. 1',
      noTelepon: '081200000001',
      tanggalLahir: new Date('2008-05-12'),
      username: usernameSiswa,
      password: await bcrypt.hash(noRekeningSiswa, 10),
    },
  });

  const noRekeningGuru = buildNoRekening(2);
  const usernameGuru = '198501012010012001';
  await prisma.nasabah.upsert({
    where: { noRekening: noRekeningGuru },
    update: { username: usernameGuru },
    create: {
      noRekening: noRekeningGuru,
      nama: 'Guru Contoh',
      jenisNasabah: 'guru',
      nip: usernameGuru,
      jabatan: 'Guru Mata Pelajaran',
      jenisKelamin: 'P',
      alamat: 'Jl. Pendidikan No. 2',
      noTelepon: '081200000002',
      tanggalLahir: new Date('1985-01-01'),
      username: usernameGuru,
      password: await bcrypt.hash(noRekeningGuru, 10),
    },
  });

  const noRekeningUmum = buildNoRekening(3);
  await prisma.nasabah.upsert({
    where: { noRekening: noRekeningUmum },
    update: { username: null, password: null },
    create: {
      noRekening: noRekeningUmum,
      nama: 'Nasabah Umum Contoh',
      jenisNasabah: 'umum',
      jenisKelamin: 'L',
      alamat: 'Jl. Umum No. 3',
      noTelepon: '081200000003',
      tanggalLahir: new Date('1990-03-20'),
      username: null,
      password: null,
    },
  });
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
