const SATUAN = [
  "",
  "satu",
  "dua",
  "tiga",
  "empat",
  "lima",
  "enam",
  "tujuh",
  "delapan",
  "sembilan",
];

function terbilangBase(n: number): string {
  if (n < 10) return SATUAN[n];
  if (n < 20) {
    if (n === 10) return "sepuluh";
    if (n === 11) return "sebelas";
    return `${SATUAN[n - 10]} belas`;
  }
  if (n < 100) {
    const sisa = n % 10;
    return `${SATUAN[Math.floor(n / 10)]} puluh${sisa ? ` ${SATUAN[sisa]}` : ""}`;
  }
  if (n < 200) {
    const sisa = n % 100;
    return `seratus${sisa ? ` ${terbilangBase(sisa)}` : ""}`;
  }
  if (n < 1000) {
    const sisa = n % 100;
    return `${SATUAN[Math.floor(n / 100)]} ratus${sisa ? ` ${terbilangBase(sisa)}` : ""}`;
  }
  if (n < 2000) {
    const sisa = n % 1000;
    return `seribu${sisa ? ` ${terbilangBase(sisa)}` : ""}`;
  }
  if (n < 1_000_000) {
    const sisa = n % 1000;
    return `${terbilangBase(Math.floor(n / 1000))} ribu${sisa ? ` ${terbilangBase(sisa)}` : ""}`;
  }
  if (n < 1_000_000_000) {
    const sisa = n % 1_000_000;
    return `${terbilangBase(Math.floor(n / 1_000_000))} juta${sisa ? ` ${terbilangBase(sisa)}` : ""}`;
  }
  if (n < 1_000_000_000_000) {
    const sisa = n % 1_000_000_000;
    return `${terbilangBase(Math.floor(n / 1_000_000_000))} miliar${sisa ? ` ${terbilangBase(sisa)}` : ""}`;
  }
  const sisa = n % 1_000_000_000_000;
  return `${terbilangBase(Math.floor(n / 1_000_000_000_000))} triliun${sisa ? ` ${terbilangBase(sisa)}` : ""}`;
}

export function terbilangRupiah(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "";
  const words = terbilangBase(Math.round(value)).replace(/\s+/g, " ").trim();
  return `${words.charAt(0).toUpperCase()}${words.slice(1)} rupiah`;
}
