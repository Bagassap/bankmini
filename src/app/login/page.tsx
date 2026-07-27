"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, Loader2, User } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/error";
import { isAdminRole } from "@/lib/role";
import { useAuthStore } from "@/store/authStore";
import type { AccountType, User as AuthUser } from "@/lib/types";
import FloatingBlobs from "@/components/FloatingBlobs";
import logoLight from "@/assets/logo bank-mini1.png";

interface LoginResponse {
  accessToken: string;
  accountType: AccountType;
  user: Omit<AuthUser, "accountType">;
}

const fieldVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      delay: 0.35 + i * 0.08,
      ease: "easeOut" as const,
    },
  }),
};

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const year = new Date().getFullYear();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post<LoginResponse>("/auth/login", {
        username,
        password,
      });
      const user = { ...data.user, accountType: data.accountType };
      login(user, data.accessToken);
      toast.success(`Selamat datang, ${data.user.nama}`);
      const destination =
        data.accountType === "nasabah"
          ? "/portal"
          : isAdminRole(user)
            ? "/admin/dashboard"
            : "/dashboard";
      router.replace(destination);
    } catch (error) {
      toast.error(getErrorMessage(error, "Username atau password salah"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-dot-grid-dark relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background p-4 sm:p-8">
      {/* Ambient background glows */}
      <div className="animate-glow-pulse pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
      <div
        className="animate-glow-pulse pointer-events-none absolute -bottom-32 -right-20 h-112 w-md rounded-full bg-gradient-via/20 blur-3xl"
        style={{ animationDelay: "1.2s" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative flex w-full max-w-5xl flex-col overflow-hidden rounded-4xl bg-background-card p-3 shadow-2xl shadow-black/10 ring-1 ring-border lg:flex-row lg:p-4"
      >
        {/* Brand panel: compact bar on mobile, full showcase on desktop */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="relative order-1 flex w-full flex-row items-center gap-3 overflow-hidden rounded-3xl bg-linear-to-br from-gradient-from via-gradient-via to-gradient-to p-4 lg:order-0 lg:min-h-140 lg:w-[40%] lg:flex-col lg:items-center lg:justify-center lg:gap-8 lg:p-8"
        >
          <div className="bg-dot-grid pointer-events-none absolute inset-0 opacity-40" />
          <div className="hidden lg:block">
            <FloatingBlobs />
          </div>

          {/* Logo row: inline title on mobile, standalone mark on desktop */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="relative z-10 flex shrink-0 items-center gap-3"
          >
            <Image
              src={logoLight}
              alt="Bank Mini NUSA"
              width={180}
              height={70}
              priority
              className="h-auto w-28 lg:w-56"
            />
            <span className="text-base font-bold text-white lg:hidden">
              Bank Digital Sekolah
            </span>
          </motion.div>

          {/* Headline + tagline: desktop only */}
          <div className="relative z-10 hidden text-center lg:block">
            <h2 className="flex flex-wrap justify-center gap-x-2.5 text-2xl leading-tight font-black tracking-tight text-white">
              {["Bank", "Digital", "Sekolah"].map((word, i) => (
                <motion.span
                  key={word}
                  initial={{ opacity: 0, y: 26, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{
                    duration: 0.6,
                    delay: 0.6 + i * 0.12,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className={
                    word === "Sekolah"
                      ? "animate-gradient-x bg-linear-to-r from-white via-primary/30 to-white bg-clip-text text-transparent"
                      : "inline-block"
                  }
                >
                  {word}
                </motion.span>
              ))}
            </h2>

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.1 }}
              className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-white/70"
            >
              Solusi tabungan digital untuk siswa, guru, dan staf sekolah.
            </motion.p>
          </div>
        </motion.div>

        {/* Form panel */}
        <div className="order-2 flex w-full flex-col justify-center px-6 py-8 lg:w-[60%] lg:px-14 lg:py-12">
          <motion.form
            onSubmit={handleSubmit}
            initial="hidden"
            animate="visible"
            className="w-full"
          >
            <motion.h1
              custom={0}
              variants={fieldVariants}
              initial="hidden"
              animate="visible"
              className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl"
            >
              Selamat Datang
            </motion.h1>
            <motion.p
              custom={1}
              variants={fieldVariants}
              initial="hidden"
              animate="visible"
              className="mb-8 mt-2 text-sm leading-relaxed text-text-secondary"
            >
              Masuk ke akun Anda untuk mengakses Bank Mini NUSA.
            </motion.p>

            <motion.label
              custom={2}
              variants={fieldVariants}
              initial="hidden"
              animate="visible"
              htmlFor="username"
              className="mb-1.5 block text-sm font-medium text-text-secondary"
            >
              Username
            </motion.label>
            <motion.div
              custom={2}
              variants={fieldVariants}
              initial="hidden"
              animate="visible"
              className="relative mb-5"
            >
              <User
                size={17}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
              />
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Masukkan username"
                className="w-full rounded-xl border border-transparent bg-background-hover py-3 pl-11 pr-4 text-base text-text-primary outline-none transition placeholder:text-text-muted focus:border-primary focus:bg-background-card focus:ring-4 focus:ring-primary/15 sm:text-sm"
              />
            </motion.div>

            <motion.label
              custom={3}
              variants={fieldVariants}
              initial="hidden"
              animate="visible"
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-text-secondary"
            >
              Password
            </motion.label>
            <motion.div
              custom={3}
              variants={fieldVariants}
              initial="hidden"
              animate="visible"
              className="relative mb-8"
            >
              <Lock
                size={17}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
              />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Masukkan password"
                className="w-full rounded-xl border border-transparent bg-background-hover py-3 pl-11 pr-11 text-base text-text-primary outline-none transition placeholder:text-text-muted focus:border-primary focus:bg-background-card focus:ring-4 focus:ring-primary/15 sm:text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted transition hover:text-text-primary"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </motion.div>

            <motion.button
              custom={4}
              variants={fieldVariants}
              initial="hidden"
              animate="visible"
              whileTap={{ scale: 0.98 }}
              whileHover={{ scale: 1.01 }}
              type="submit"
              disabled={loading}
              className="group relative flex w-full items-center justify-center overflow-hidden rounded-xl bg-linear-to-r from-primary to-gradient-via py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/25 transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="animate-shine absolute inset-y-0 left-0 w-1/3 bg-linear-to-r from-transparent via-white/30 to-transparent" />
              <span className="relative flex items-center gap-2">
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? "Memproses..." : "Masuk"}
              </span>
            </motion.button>

            <motion.p
              custom={5}
              variants={fieldVariants}
              initial="hidden"
              animate="visible"
              className="mt-6 text-center text-xs text-text-muted"
            >
              Lupa Password?{" "}
              <span className="font-medium text-primary">
                Hubungi admin sekolah
              </span>
            </motion.p>

            <motion.p
              custom={6}
              variants={fieldVariants}
              initial="hidden"
              animate="visible"
              className="mt-6 text-center text-[11px] text-text-muted"
            >
              © {year} Bank Mini NUSA
            </motion.p>
          </motion.form>
        </div>
      </motion.div>
    </div>
  );
}
