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
    where: { username: usernameSiswa },
    update: {},
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
    where: { username: usernameGuru },
    update: {},
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

  const noRekeningSiswaTest = buildNoRekening(4);
  await prisma.nasabah.upsert({
    where: { username: '121212' },
    update: { password: await bcrypt.hash('siswa123', 10) },
    create: {
      noRekening: noRekeningSiswaTest,
      nama: 'Nasabah Siswa Test',
      jenisNasabah: 'siswa',
      nis: '121212',
      kelas: 'XI',
      jurusan: 'TKJ',
      jenisKelamin: 'L',
      alamat: 'Jl. Siswa Test No. 1',
      noTelepon: '081200000004',
      tanggalLahir: new Date('2009-01-01'),
      username: '121212',
      password: await bcrypt.hash('siswa123', 10),
    },
  });

  const noRekeningGuruTest = buildNoRekening(5);
  await prisma.nasabah.upsert({
    where: { username: '191919' },
    update: { password: await bcrypt.hash('guru123', 10) },
    create: {
      noRekening: noRekeningGuruTest,
      nama: 'Nasabah Guru Test',
      jenisNasabah: 'guru',
      nip: '191919',
      jabatan: 'Guru Test',
      jenisKelamin: 'P',
      alamat: 'Jl. Guru Test No. 1',
      noTelepon: '081200000005',
      tanggalLahir: new Date('1988-01-01'),
      username: '191919',
      password: await bcrypt.hash('guru123', 10),
    },
  });

  const noRekeningUmumTest = buildNoRekening(6);
  await prisma.nasabah.upsert({
    where: { username: '181818' },
    update: { password: await bcrypt.hash('umum123', 10) },
    create: {
      noRekening: noRekeningUmumTest,
      nama: 'Nasabah Umum Test',
      jenisNasabah: 'umum',
      jenisKelamin: 'L',
      alamat: 'Jl. Umum Test No. 1',
      noTelepon: '081200000006',
      tanggalLahir: new Date('1992-01-01'),
      username: '181818',
      password: await bcrypt.hash('umum123', 10),
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
