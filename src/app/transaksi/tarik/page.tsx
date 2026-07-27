"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import { AlertTriangle, Banknote, ClipboardList, Wallet } from "lucide-react";
import Layout from "@/components/Layout";
import { InformasiRekeningCard } from "@/components/transaksi/InformasiRekeningCard";
import { TransaksiHeader } from "@/components/transaksi/TransaksiHeader";
import { TransaksiRightPanel } from "@/components/transaksi/TransaksiRightPanel";
import { TransaksiSuccessPanel } from "@/components/transaksi/TransaksiSuccessPanel";
import { useLiveClock } from "@/hooks/useLiveClock";
import { useNasabahLookup } from "@/hooks/useNasabahLookup";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/error";
import { formatCurrency } from "@/lib/format";
import { terbilangRupiah } from "@/lib/terbilang";
import { TARIK_META } from "@/lib/transaksiMeta";
import { useAuthStore } from "@/store/authStore";
import type { Transaksi } from "@/lib/types";

const inputClass =
  "w-full rounded-xl border border-transparent bg-background-hover px-3 py-2.5 text-sm text-text-primary transition-shadow focus:border-primary focus:bg-background-card focus:outline-none focus:ring-2 focus:ring-primary/20";

export default function TarikTunaiPage() {
  const user = useAuthStore((state) => state.user);
  const now = useLiveClock();
  const {
    noRekening,
    setNoRekening,
    nasabah,
    searching,
    handleSearch,
    reset: resetLookup,
  } = useNasabahLookup();

  const [jumlah, setJumlah] = useState("");
  const [sumberDana, setSumberDana] = useState(TARIK_META.sumberOptions[0]);
  const [keterangan, setKeterangan] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Transaksi | null>(null);

  const jumlahNumber = Number(jumlah) || 0;
  const insufficientFunds = !!nasabah && jumlahNumber > Number(nasabah.saldo);

  function resetForm() {
    resetLookup();
    setJumlah("");
    setKeterangan("");
    setSumberDana(TARIK_META.sumberOptions[0]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nasabah || !user || insufficientFunds) return;
    setSubmitting(true);
    try {
      const combinedKeterangan = [sumberDana, keterangan.trim()]
        .filter(Boolean)
        .join(" — ");
      const { data } = await api.post<Transaksi>("/transaksi/tarik", {
        nasabahId: nasabah.id,
        jumlah: jumlahNumber,
        keterangan: combinedKeterangan || undefined,
        processedById: user.id,
      });
      setResult(data);
      toast.success("Tarik berhasil");
      resetForm();
    } catch (error) {
      toast.error(getErrorMessage(error, "Gagal melakukan tarik"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Layout>
      <TransaksiHeader meta={TARIK_META} now={now} />

      <div className="grid grid-cols-1 gap-4 md:gap-6 2xl:gap-7.5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4 md:space-y-6">
          <InformasiRekeningCard
            noRekening={noRekening}
            onNoRekeningChange={setNoRekening}
            onSubmit={handleSearch}
            searching={searching}
            nasabah={nasabah}
          />

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="relative overflow-hidden rounded-3xl bg-background-card p-5 shadow-soft"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle,rgba(17,32,240,0.9)_1px,transparent_1px)] bg-size-[16px_16px]"
            />
            <div className="relative mb-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-gradient-orange-from to-gradient-orange-to text-white shadow-sm">
                  <Banknote size={18} />
                </span>
                <div>
                  <p className="text-sm font-bold text-text-primary">Detail Penarikan Tunai</p>
                  <p className="text-xs text-text-secondary">
                    {nasabah
                      ? "Pastikan saldo mencukupi sebelum penarikan"
                      : "Cari nasabah terlebih dahulu untuk mengisi transaksi"}
                  </p>
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-background-hover px-2.5 py-1 text-[10px] font-bold whitespace-nowrap text-text-muted">
                LANGKAH 2
              </span>
            </div>

            {!nasabah && (
              <div className="relative mb-4 flex items-center gap-2 rounded-xl bg-warning/10 px-3 py-2 text-xs font-semibold text-warning">
                <AlertTriangle size={13} className="shrink-0" />
                Nomor rekening belum ditemukan — isi &amp; cari data nasabah di langkah 1.
              </div>
            )}

            <fieldset
              disabled={!nasabah}
              className="relative flex flex-col gap-4 disabled:opacity-50"
            >
              <form id="tarik-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
                      <Wallet size={12} className="text-primary" />
                      Nominal Penarikan (IDR)
                    </label>
                    <span className="text-[10px] font-bold text-text-muted">
                      Saldo: {nasabah ? formatCurrency(nasabah.saldo) : "-"}
                    </span>
                  </div>
                  <div
                    className={`flex items-center gap-2 rounded-2xl border-2 bg-background-hover px-4 py-3 transition-colors ${
                      insufficientFunds
                        ? "border-danger"
                        : "border-transparent focus-within:border-primary"
                    }`}
                  >
                    <span className="text-lg font-bold text-text-muted">Rp</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      value={jumlah}
                      onChange={(e) => setJumlah(e.target.value)}
                      placeholder="0"
                      className="w-full min-w-0 bg-transparent text-2xl font-bold text-text-primary focus:outline-none"
                    />
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-success/10 px-2 py-1 text-[10px] font-bold whitespace-nowrap text-success">
                      <motion.span
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 1.4, repeat: Infinity }}
                        className="h-1.5 w-1.5 rounded-full bg-success"
                      />
                      LIVE VALIDATING
                    </span>
                  </div>
                  <p
                    className={`mt-1.5 text-xs ${
                      insufficientFunds ? "font-semibold text-danger" : "text-text-muted italic"
                    }`}
                  >
                    {insufficientFunds ? (
                      <span className="flex items-center gap-1">
                        <AlertTriangle size={11} /> Saldo nasabah tidak mencukupi
                      </span>
                    ) : jumlahNumber > 0 ? (
                      <>
                        Terbilang:{" "}
                        <span className="font-semibold text-text-secondary not-italic">
                          {terbilangRupiah(jumlahNumber)}
                        </span>
                      </>
                    ) : (
                      "Terbilang: Menunggu nominal..."
                    )}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
                      <TARIK_META.sumberIcon size={12} className="text-primary" />
                      {TARIK_META.sumberLabel}
                    </label>
                    <select
                      value={sumberDana}
                      onChange={(e) => setSumberDana(e.target.value)}
                      className={inputClass}
                    >
                      {TARIK_META.sumberOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
                      <ClipboardList size={12} className="text-primary" />
                      Catatan Transaksi
                    </label>
                    <input
                      type="text"
                      value={keterangan}
                      onChange={(e) => setKeterangan(e.target.value)}
                      placeholder="Misal: Penarikan bulanan..."
                      className={inputClass}
                    />
                  </div>
                </div>
              </form>
            </fieldset>
          </motion.div>
        </div>

        <TransaksiRightPanel
          meta={TARIK_META}
          nasabah={nasabah}
          submitting={submitting}
          submitDisabled={!nasabah || submitting || insufficientFunds}
          formId="tarik-form"
          onCancel={resetForm}
        />
      </div>

      <AnimatePresence>{result && <TransaksiSuccessPanel result={result} />}</AnimatePresence>
    </Layout>
  );
}
