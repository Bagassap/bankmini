export function formatRupiah(value: number | string | { toString(): string }): string {
  const amount = Math.round(Number(value.toString()));
  return `Rp ${amount.toLocaleString('id-ID')}`;
}
