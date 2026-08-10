"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, KeyRound, Loader2, ShieldAlert } from "lucide-react";
import { notify } from "@/store/notifyStore";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/error";
import { useAuthStore } from "@/store/authStore";

const inputClass =
  "w-full rounded-xl border border-transparent bg-background-hover px-3 py-2.5 text-sm text-text-primary transition-shadow focus:border-primary focus:bg-background-card focus:outline-none focus:ring-2 focus:ring-primary/20";
const labelClass = "mb-1.5 block text-xs font-semibold text-text-secondary";

export function ForcePasswordChangeScreen() {
  const hydrate = useAuthStore((state) => state.hydrate);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 4) {
      notify.error("Password baru minimal 4 karakter");
      return;
    }
    if (newPassword !== confirmPassword) {
      notify.error("Konfirmasi password tidak cocok");
      return;
    }
    if (newPassword === currentPassword) {
      notify.error("Password baru harus berbeda dari password default");
      return;
    }
    setSaving(true);
    try {
      await api.patch("/nasabah/me/password", {
        currentPassword,
        newPassword,
      });
      notify.success("Password berhasil diubah");
      await hydrate();
    } catch (error) {
      notify.error(getErrorMessage(error, "Gagal mengubah password"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md overflow-hidden rounded-3xl bg-background-card p-6 shadow-soft sm:p-8"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle,rgba(17,32,240,0.9)_1px,transparent_1px)] bg-size-[18px_18px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl"
        />

        <div className="relative mb-5 flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-primary-dark text-white shadow-sm">
            <KeyRound size={22} />
          </span>
          <div>
            <h1 className="text-lg font-bold text-text-primary">Ganti Password</h1>
            <p className="text-xs text-text-secondary">Wajib sebelum melanjutkan</p>
          </div>
        </div>

        <p className="relative mb-5 flex items-start gap-2 rounded-xl bg-warning/10 px-3 py-2.5 text-xs text-warning">
          <ShieldAlert size={15} className="mt-0.5 shrink-0" />
          Ini pertama kali Anda login (atau password Anda baru saja direset). Demi
          keamanan, Anda wajib mengganti password default sebelum bisa mengakses
          Bank Mini NUSA.
        </p>

        <form onSubmit={handleSubmit} className="relative flex flex-col gap-4">
          <div>
            <label className={labelClass}>Password Saat Ini (NIS/NPY Anda)</label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={`${inputClass} pr-10`}
                placeholder="Password default Anda"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-text-muted transition-colors hover:text-text-primary"
              >
                {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div>
            <label className={labelClass}>Password Baru</label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                required
                minLength={4}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`${inputClass} pr-10`}
                placeholder="Minimal 4 karakter"
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-text-muted transition-colors hover:text-text-primary"
              >
                {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div>
            <label className={labelClass}>Konfirmasi Password Baru</label>
            <input
              type={showNew ? "text" : "password"}
              required
              minLength={4}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass}
              placeholder="Ulangi password baru"
            />
          </div>

          <motion.button
            type="submit"
            disabled={saving}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:opacity-60"
          >
            {saving && <Loader2 size={15} className="animate-spin" />}
            Simpan Password Baru
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
