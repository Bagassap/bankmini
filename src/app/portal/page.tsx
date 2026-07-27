"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { LogOut } from "lucide-react";
import api from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import { getErrorMessage } from "@/lib/error";
import { formatCurrency, formatDate } from "@/lib/format";
import { useAuthStore } from "@/store/authStore";
import type { JenisNasabah, Nasabah, Transaksi } from "@/lib/types";

const jenisLabel: Record<JenisNasabah, string> = {
  siswa: "Siswa",
  guru: "Guru",
  umum: "Umum",
};

export default function PortalPage() {
  const router = useRouter();
  const hydrate = useAuthStore((state) => state.hydrate);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [profile, setProfile] = useState<Nasabah | null>(null);
  const [mutasi, setMutasi] = useState<Transaksi[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }
    if (user && user.accountType !== "nasabah") {
      router.replace("/dashboard");
    }
  }, [user, router]);

  useEffect(() => {
    if (!user || user.accountType !== "nasabah") return;
    async function loadPortal() {
      setLoading(true);
      try {
        const [profileRes, mutasiRes] = await Promise.all([
          api.get<Nasabah>("/nasabah/me"),
          api.get<Transaksi[]>(`/transaksi/mutasi/${user!.id}`),
        ]);
        setProfile(profileRes.data);
        setMutasi(mutasiRes.data);
      } catch (error) {
        toast.error(getErrorMessage(error, "Gagal memuat data akun"));
      } finally {
        setLoading(false);
      }
    }
    loadPortal();
  }, [user]);

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="flex h-20 items-center gap-4 px-4 md:px-6">
        <div className="rounded-full bg-background-card px-5 py-2.5 shadow-sm">
          <p className="text-sm font-semibold text-text-primary">Bank Mini NUSA</p>
          <p className="text-[11px] text-text-secondary">Portal Nasabah</p>
        </div>

        <span className="hidden text-sm font-medium text-text-secondary sm:block">
          Today, <span className="font-semibold text-primary">{today}</span>
        </span>

        <div className="ml-auto flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-xs font-bold text-white shadow-sm ring-2 ring-background-card">
            {(user?.nama ?? "?").slice(0, 2).toUpperCase()}
          </span>
          <button
            onClick={handleLogout}
            title="Logout"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-background-card text-danger shadow-sm transition hover:text-danger/80"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        {loading || !profile ? (
          <p className="text-sm text-text-secondary">Memuat data...</p>
        ) : (
          <>
            <div className="mb-6 rounded-xl border border-border bg-background-card p-6 shadow-sm">
              <p className="text-sm text-text-secondary">
                {jenisLabel[profile.jenisNasabah]} &middot; {profile.noRekening}
              </p>
              <h1 className="mt-1 text-xl font-bold text-text-primary">
                {profile.nama}
              </h1>
              <p className="mt-4 text-sm font-medium text-text-secondary">
                Saldo saat ini
              </p>
              <p className="text-3xl font-bold text-primary">
                {formatCurrency(profile.saldo)}
              </p>
            </div>

            <h2 className="mb-3 text-lg font-semibold text-text-primary">
              Riwayat Transaksi
            </h2>
            <div className="overflow-x-auto rounded-xl border border-border bg-background-card shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-background-hover text-text-secondary">
                  <tr>
                    <th className="px-4 py-3 font-medium">Tanggal</th>
                    <th className="px-4 py-3 font-medium">Jenis</th>
                    <th className="px-4 py-3 font-medium">Jumlah</th>
                    <th className="px-4 py-3 font-medium">Saldo Sesudah</th>
                    <th className="px-4 py-3 font-medium">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {mutasi.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-6 text-center text-text-secondary"
                      >
                        Belum ada transaksi
                      </td>
                    </tr>
                  ) : (
                    mutasi.map((trx) => (
                      <tr key={trx.id} className="border-b border-border">
                        <td className="px-4 py-3">
                          {formatDate(trx.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${
                              trx.jenisTransaksi === "setor"
                                ? "bg-success/15 text-success"
                                : "bg-danger/15 text-danger"
                            }`}
                          >
                            {trx.jenisTransaksi}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {formatCurrency(trx.jumlah)}
                        </td>
                        <td className="px-4 py-3">
                          {formatCurrency(trx.saldoSesudah)}
                        </td>
                        <td className="px-4 py-3 text-text-secondary">
                          {trx.keterangan ?? "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
