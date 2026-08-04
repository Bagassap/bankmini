"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toPng } from "html-to-image";
import Image from "next/image";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Check,
  Download,
  Loader2,
  X,
} from "lucide-react";
import { notify } from "@/store/notifyStore";
import { formatCurrency, formatDate } from "@/lib/format";
import { terbilangRupiah } from "@/lib/terbilang";
import { jenisLabel } from "@/lib/transaksiMeta";
import logo from "@/assets/logo bank-mini2.png";
import type { Nasabah, Transaksi } from "@/lib/types";

type KuitansiNasabah = Pick<Nasabah, "nama" | "noRekening" | "jenisNasabah">;

export function KuitansiModal({
  transaksi,
  nasabah,
  tellerNama,
  onClose,
}: {
  transaksi: Transaksi | null;
  nasabah: KuitansiNasabah | null;
  tellerNama: string;
  onClose: () => void;
}) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const isSetor = transaksi?.jenisTransaksi === "setor";

  async function handleDownload() {
    if (!receiptRef.current || !transaksi) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(receiptRef.current, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        cacheBust: true,
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `kuitansi-${transaksi.noTransaksi}.png`;
      a.click();
    } catch {
      notify.error("Gagal membuat gambar kuitansi");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <AnimatePresence>
      {transaksi && nasabah && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 10 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="scrollbar-hide relative max-h-[92vh] w-full max-w-sm overflow-y-auto rounded-3xl bg-white shadow-2xl"
          >
            <div ref={receiptRef} className="bg-white px-6 pt-8 pb-6 text-center">
              <motion.span
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-success text-white">
                  <Check size={22} strokeWidth={3} />
                </span>
              </motion.span>

              <p className="mt-4 text-base font-bold text-neutral-900">Transaksi Berhasil</p>
              <p className="mt-1 text-xs text-neutral-500">{formatDate(transaksi.createdAt)}</p>

              <p
                className={`mt-4 text-3xl font-bold ${isSetor ? "text-success" : "text-danger"}`}
              >
                {isSetor ? "+" : "-"}
                {formatCurrency(transaksi.jumlah)}
              </p>
              <p className="mt-1 text-[11px] text-neutral-400 italic">
                {terbilangRupiah(Number(transaksi.jumlah))}
              </p>

              <span
                className={`mt-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold ${
                  isSetor ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                }`}
              >
                {isSetor ? <ArrowDownToLine size={11} /> : <ArrowUpFromLine size={11} />}
                {isSetor ? "Setor Tunai" : "Tarik Tunai"}
              </span>

              <div className="my-5 border-t border-dashed border-neutral-200" />

              <dl className="space-y-2.5 text-left text-sm">
                <Row label="No. Referensi" value={transaksi.noTransaksi} mono />
                <Row label="Nama Nasabah" value={nasabah.nama} />
                <Row label="No Rekening" value={nasabah.noRekening} mono />
                <Row label="Jenis Nasabah" value={jenisLabel[nasabah.jenisNasabah]} />
                <Row label="Saldo Sebelum" value={formatCurrency(transaksi.saldoSebelum)} />
                <Row label="Saldo Sesudah" value={formatCurrency(transaksi.saldoSesudah)} bold />
                {transaksi.keterangan && (
                  <Row label="Keterangan" value={transaksi.keterangan} />
                )}
                <Row label="Petugas" value={tellerNama} />
              </dl>

              <div className="my-5 border-t border-dashed border-neutral-200" />

              <div className="flex items-center justify-center gap-1.5">
                <Image src={logo} alt="Bank Mini NUSA" className="h-4 w-auto object-contain" />
              </div>
              <p className="mt-1.5 text-[10px] text-neutral-400">
                Kuitansi digital ini sah tanpa tanda tangan basah
              </p>
            </div>

            <div className="flex items-center gap-2 border-t border-border p-4">
              <button
                type="button"
                onClick={onClose}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-background-hover px-4 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:text-text-primary"
              >
                <X size={15} />
                Tutup
              </button>
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                disabled={downloading}
                onClick={handleDownload}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:opacity-60"
              >
                {downloading ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Download size={15} />
                )}
                Unduh PNG
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Row({
  label,
  value,
  mono,
  bold,
}: {
  label: string;
  value: string;
  mono?: boolean;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-neutral-500">{label}</dt>
      <dd
        className={`truncate text-right text-neutral-900 ${mono ? "font-mono" : ""} ${
          bold ? "font-bold" : "font-semibold"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
