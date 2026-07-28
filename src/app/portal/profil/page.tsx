"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  BookUser,
  Calendar,
  CheckCircle2,
  Edit3,
  Eye,
  EyeOff,
  GraduationCap,
  Hash,
  Home,
  KeyRound,
  Loader2,
  Lock,
  Phone,
  Save,
  ShieldCheck,
  User as UserIcon,
  Users,
  Wallet,
  X,
} from "lucide-react";
import Layout from "@/components/Layout";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/error";
import { formatCurrency, formatDate } from "@/lib/format";
import { useAuthStore } from "@/store/authStore";
import type { JenisNasabah, Nasabah } from "@/lib/types";

const JENIS_LABEL: Record<JenisNasabah, string> = {
  siswa: "Siswa",
  guru: "Guru",
  umum: "Umum",
};

const JENIS_ICON: Record<JenisNasabah, typeof GraduationCap> = {
  siswa: GraduationCap,
  guru: BookUser,
  umum: Users,
};

const inputClass =
  "w-full rounded-xl border border-transparent bg-background-hover px-3 py-2.5 text-sm text-text-primary transition-shadow focus:border-primary focus:bg-background-card focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60";

export default function ProfilPage() {
  const user = useAuthStore((state) => state.user);
  const [profile, setProfile] = useState<Nasabah | null>(null);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);
  const [alamat, setAlamat] = useState("");
  const [noTelepon, setNoTelepon] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      try {
        const { data } = await api.get<Nasabah>("/nasabah/me");
        setProfile(data);
        setAlamat(data.alamat ?? "");
        setNoTelepon(data.noTelepon ?? "");
      } catch (error) {
        toast.error(getErrorMessage(error, "Gagal memuat profil"));
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { data } = await api.patch<Nasabah>("/nasabah/me", { alamat, noTelepon });
      setProfile(data);
      setEditing(false);
      toast.success("Profil berhasil diperbarui");
    } catch (error) {
      toast.error(getErrorMessage(error, "Gagal memperbarui profil"));
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Konfirmasi password baru tidak cocok");
      return;
    }
    setChangingPassword(true);
    try {
      await api.patch("/nasabah/me/password", { currentPassword, newPassword });
      toast.success("Password berhasil diubah");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error(getErrorMessage(error, "Gagal mengubah password"));
    } finally {
      setChangingPassword(false);
    }
  }

  const initials = (user?.nama ?? "?").slice(0, 2).toUpperCase();

  return (
    <Layout>

      {loading || !profile ? (
        <p className="text-sm text-text-secondary">Memuat data...</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:gap-6 2xl:gap-7.5 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-3xl bg-linear-to-br from-primary to-primary-dark p-6 text-white shadow-soft lg:col-span-1"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-20 bg-[radial-gradient(circle,rgba(255,255,255,0.7)_1px,transparent_1px)] bg-size-[16px_16px]"
            />
            <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />

            <div className="relative flex flex-col items-center text-center">
              <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white/20 text-2xl font-bold backdrop-blur-sm">
                {initials}
              </span>
              <p className="mt-3 text-lg font-bold">{profile.nama}</p>
              <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur-sm">
                {(() => {
                  const Icon = JENIS_ICON[profile.jenisNasabah];
                  return <Icon size={12} />;
                })()}
                {JENIS_LABEL[profile.jenisNasabah]}
              </span>
            </div>

            <div className="relative mt-5 rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wide text-white/70 uppercase">
                <Wallet size={11} />
                Saldo Saat Ini
              </p>
              <p className="mt-1 text-xl font-bold">{formatCurrency(profile.saldo)}</p>
            </div>

            <div className="relative mt-4 space-y-2.5 text-sm">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <Hash size={13} />
                </span>
                <div>
                  <p className="text-[10px] text-white/60">No. Rekening</p>
                  <p className="font-mono font-semibold">{profile.noRekening}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <UserIcon size={13} />
                </span>
                <div>
                  <p className="text-[10px] text-white/60">Username</p>
                  <p className="font-semibold">{profile.username ?? "-"}</p>
                </div>
              </div>
              {profile.tanggalLahir && (
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
                    <Calendar size={13} />
                  </span>
                  <div>
                    <p className="text-[10px] text-white/60">Tanggal Lahir</p>
                    <p className="font-semibold">
                      {new Date(profile.tanggalLahir).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              )}
              {profile.jenisNasabah === "siswa" && (
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
                    <GraduationCap size={13} />
                  </span>
                  <div>
                    <p className="text-[10px] text-white/60">Kelas / Jurusan</p>
                    <p className="font-semibold">
                      {profile.kelas ?? "-"} &middot; {profile.jurusan ?? "-"}
                    </p>
                  </div>
                </div>
              )}
              {profile.jenisNasabah === "guru" && (
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
                    <BookUser size={13} />
                  </span>
                  <div>
                    <p className="text-[10px] text-white/60">Jabatan</p>
                    <p className="font-semibold">{profile.jabatan ?? "-"}</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          <div className="space-y-4 md:space-y-6 lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
              className="relative overflow-hidden rounded-3xl bg-background-card p-6 shadow-soft"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle,rgba(17,32,240,0.9)_1px,transparent_1px)] bg-size-[16px_16px]"
              />

              <div className="relative mb-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Home size={18} />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-text-primary">Data Kontak</p>
                    <p className="text-xs text-text-secondary">Alamat &amp; nomor telepon Anda</p>
                  </div>
                </div>
                {!editing && (
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-1.5 rounded-xl bg-primary/10 px-3.5 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary/20"
                  >
                    <Edit3 size={13} />
                    Edit
                  </motion.button>
                )}
              </div>

              <form onSubmit={handleSaveProfile} className="relative space-y-4">
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
                    <Home size={12} className="text-primary" />
                    Alamat
                  </label>
                  <input
                    type="text"
                    value={alamat}
                    onChange={(e) => setAlamat(e.target.value)}
                    disabled={!editing}
                    placeholder="Alamat lengkap"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
                    <Phone size={12} className="text-primary" />
                    Nomor Telepon
                  </label>
                  <input
                    type="text"
                    value={noTelepon}
                    onChange={(e) => setNoTelepon(e.target.value)}
                    disabled={!editing}
                    placeholder="08xxxxxxxxxx"
                    className={inputClass}
                  />
                </div>

                {editing && (
                  <div className="flex gap-2">
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={savingProfile}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:opacity-50"
                    >
                      {savingProfile ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Save size={14} />
                      )}
                      Simpan
                    </motion.button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(false);
                        setAlamat(profile.alamat ?? "");
                        setNoTelepon(profile.noTelepon ?? "");
                      }}
                      className="flex items-center gap-1.5 rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:bg-background-hover"
                    >
                      <X size={14} />
                      Batal
                    </button>
                  </div>
                )}
              </form>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="relative overflow-hidden rounded-3xl bg-background-card p-6 shadow-soft"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle,rgba(17,32,240,0.9)_1px,transparent_1px)] bg-size-[16px_16px]"
              />

              <div className="relative mb-5 flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning/15 text-warning">
                  <KeyRound size={18} />
                </span>
                <div>
                  <p className="text-sm font-bold text-text-primary">Ganti Password</p>
                  <p className="text-xs text-text-secondary">
                    Pastikan password baru Anda mudah diingat &amp; aman
                  </p>
                </div>
              </div>

              <form onSubmit={handleChangePassword} className="relative space-y-4">
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
                    <Lock size={12} className="text-warning" />
                    Password Saat Ini
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      className={inputClass}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
                      <Lock size={12} className="text-warning" />
                      Password Baru
                    </label>
                    <input
                      type={showPasswords ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      minLength={4}
                      required
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
                      <ShieldCheck size={12} className="text-warning" />
                      Konfirmasi Password Baru
                    </label>
                    <input
                      type={showPasswords ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      minLength={4}
                      required
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPasswords((v) => !v)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary transition-colors hover:text-primary"
                  >
                    {showPasswords ? <EyeOff size={13} /> : <Eye size={13} />}
                    {showPasswords ? "Sembunyikan" : "Tampilkan"} password
                  </button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={changingPassword}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-warning px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-warning/90 disabled:opacity-50"
                  >
                    {changingPassword ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <KeyRound size={14} />
                    )}
                    Ubah Password
                  </motion.button>
                </div>
              </form>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-3 rounded-2xl bg-success/10 p-4 text-success"
            >
              <CheckCircle2 size={18} className="shrink-0" />
              <p className="text-xs font-medium">
                Terakhir masuk: {profile.lastLogin ? formatDate(profile.lastLogin) : "-"}
              </p>
            </motion.div>
          </div>
        </div>
      )}
    </Layout>
  );
}
