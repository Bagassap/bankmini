import { redirect } from "next/navigation";

/** /transaksi kini terpecah jadi /transaksi/setor dan /transaksi/tarik masing-masing
 * sebagai halaman tersendiri — redirect ini cuma jaga-jaga untuk link/bookmark lama. */
export default function TransaksiPage() {
  redirect("/transaksi/setor");
}
