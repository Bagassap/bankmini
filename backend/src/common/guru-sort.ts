interface GuruSortable {
  nama: string;
  username: string | null;
}

// NPY guru berformat ddmmyyyy+urutan (3 digit), 8 digit pertama adalah
// tanggal (mis. "15072003" = 15 Juli 2003). Susun ulang jadi yyyymmdd
// supaya perbandingan string-nya benar-benar kronologis (bukan urutan
// digit ddmmyyyy apa adanya, yang salah karena hari/bulan mendahului
// tahun). "Nurul Arifah" memakai NPY placeholder ("1919191919") yang
// tidak mengikuti format tanggal asli, jadi selalu ditaruh paling akhir.
function npyDateKey(username: string | null): string {
  const key = (username ?? '').slice(0, 8);
  if (key.length !== 8) return key;
  const dd = key.slice(0, 2);
  const mm = key.slice(2, 4);
  const yyyy = key.slice(4, 8);
  return `${yyyy}${mm}${dd}`;
}

export function compareGuruByNpy(a: GuruSortable, b: GuruSortable): number {
  const aLast = a.nama.trim().toLowerCase() === 'nurul arifah';
  const bLast = b.nama.trim().toLowerCase() === 'nurul arifah';
  if (aLast && bLast) return 0;
  if (aLast) return 1;
  if (bLast) return -1;

  return npyDateKey(a.username).localeCompare(npyDateKey(b.username));
}
