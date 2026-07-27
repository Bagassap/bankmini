"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Eye,
  Fingerprint,
  History,
  LogOut,
  Menu,
  Search,
  ShieldCheck,
  Sparkles,
  UserCircle2,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useLiveClock } from "@/hooks/useLiveClock";
import { isAdminRole } from "@/lib/role";

type MenuKey = "search" | "clock" | "notif" | "profile";

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  icon: LucideIcon;
  color: string;
}

const NOTIFICATIONS: NotificationItem[] = [
  {
    id: "n1",
    title: "Setoran baru diterima",
    description: "Siswa Contoh menyetor Rp 500.000",
    time: "5 menit lalu",
    icon: Wallet,
    color: "#22c55e",
  },
  {
    id: "n2",
    title: "Nasabah baru terdaftar",
    description: "Ahmad Fauzi mendaftar sebagai nasabah siswa",
    time: "1 jam lalu",
    icon: Users,
    color: "#1120f0",
  },
  {
    id: "n3",
    title: "Penarikan tunai diproses",
    description: "Guru Contoh menarik Rp 150.000",
    time: "3 jam lalu",
    icon: History,
    color: "#ea580c",
  },
];

const TELLER_QUICK_LINKS = [
  { label: "Cari Nasabah", href: "/nasabah", icon: Users, color: "#1120f0" },
  { label: "Setor Tunai", href: "/transaksi/setor", icon: Wallet, color: "#22c55e" },
  { label: "Mutasi Rekening", href: "/mutasi", icon: History, color: "#ea580c" },
];

const ADMIN_QUICK_LINKS = [
  { label: "Cari Nasabah", href: "/admin/nasabah", icon: Users, color: "#1120f0" },
  { label: "Pantau Transaksi", href: "/admin/transaksi", icon: Eye, color: "#22c55e" },
  { label: "Mutasi Rekening", href: "/admin/mutasi", icon: History, color: "#ea580c" },
];

const ROLE_LABEL: Record<string, string> = {
  superadmin: "Super Admin",
  admin: "Admin",
  teller: "Teller",
  siswa: "Siswa",
  guru: "Guru",
  umum: "Umum",
};

const dropdownMotion = {
  initial: { opacity: 0, y: -8, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.97 },
  transition: { duration: 0.15, ease: [0.16, 1, 0.3, 1] as const },
};

export default function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const QUICK_LINKS = isAdminRole(user) ? ADMIN_QUICK_LINKS : TELLER_QUICK_LINKS;
  const now = useLiveClock();
  const [query, setQuery] = useState("");
  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    }
    if (openMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [openMenu]);

  function toggleMenu(key: MenuKey) {
    setOpenMenu((prev) => (prev === key ? null : key));
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    const base = isAdminRole(user) ? "/admin/nasabah" : "/nasabah";
    router.push(`${base}?search=${encodeURIComponent(query.trim())}`);
    setOpenMenu(null);
  }

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  const greeting = (() => {
    const hour = now?.getHours() ?? 12;
    if (hour < 10) return "Selamat pagi";
    if (hour < 15) return "Selamat siang";
    if (hour < 18) return "Selamat sore";
    return "Selamat malam";
  })();

  const shortDate = now
    ? now.toLocaleDateString("id-ID", { day: "numeric", month: "short" })
    : "—";
  const fullDate = now
    ? now.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";
  const timeLabel = now ? now.toLocaleTimeString("id-ID") : "—:—:—";

  const initials = (user?.nama ?? "?").slice(0, 2).toUpperCase();
  const firstName = user?.nama?.split(" ")[0] ?? "Teller";
  const roleLabel = user?.role ? (ROLE_LABEL[user.role] ?? user.role) : "-";

  return (
    <header
      ref={containerRef}
      className="relative z-30 flex h-20 shrink-0 items-center gap-3"
    >
      <button
        onClick={onMenuClick}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-background-card text-text-secondary shadow-sm hover:text-text-primary md:hidden"
      >
        <Menu size={18} />
      </button>

      {/* Pencarian */}
      <div className="relative max-w-xs flex-1">
        <form
          onSubmit={handleSearch}
          onFocus={() => setOpenMenu("search")}
          className={`flex items-center gap-2 rounded-full bg-background-card px-4 py-2.5 shadow-sm transition-shadow ${
            openMenu === "search" ? "ring-2 ring-primary/25" : ""
          }`}
        >
          <Search size={16} className="shrink-0 text-text-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nasabah, transaksi..."
            className="w-full bg-transparent text-sm text-text-secondary placeholder:text-text-muted focus:outline-none"
          />
        </form>

        <AnimatePresence>
          {openMenu === "search" && (
            <motion.div
              {...dropdownMotion}
              className="absolute top-full left-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl bg-background-card p-3 shadow-lg ring-1 ring-border"
            >
              <p className="mb-2 flex items-center gap-1.5 px-1 text-[11px] font-bold tracking-wide text-text-muted uppercase">
                <Sparkles size={11} className="text-primary" />
                Akses Cepat
              </p>
              {QUICK_LINKS.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setOpenMenu(null)}
                  className="flex items-center gap-2.5 rounded-xl px-2 py-2 text-sm text-text-secondary transition-colors hover:bg-background-hover hover:text-text-primary"
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${item.color}1a`, color: item.color }}
                  >
                    <item.icon size={14} />
                  </span>
                  {item.label}
                </Link>
              ))}
              <p className="mt-2 border-t border-border px-1 pt-2 text-[11px] text-text-muted">
                Tekan Enter untuk mencari nasabah &quot;{query || "..."}&quot;
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hari & Jam */}
      <div className="relative hidden sm:block">
        <button
          type="button"
          onClick={() => toggleMenu("clock")}
          className={`flex items-center gap-2.5 rounded-2xl bg-background-card py-1.5 pr-3.5 pl-1.5 shadow-sm transition-colors hover:shadow-md ${
            openMenu === "clock" ? "ring-2 ring-primary/25" : ""
          }`}
        >
          <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary to-primary-dark text-white shadow-sm">
            <Calendar size={15} />
            <motion.span
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.6, repeat: Infinity }}
              className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-success ring-2 ring-background-card"
            />
          </span>
          <span className="text-left leading-tight">
            <span className="block text-[11px] font-semibold text-text-secondary">
              {shortDate}
            </span>
            <span className="flex items-center gap-1 font-mono text-xs font-bold text-primary">
              {timeLabel}
              <span className="text-[9px] font-bold text-text-muted">WIB</span>
            </span>
          </span>
        </button>

        <AnimatePresence>
          {openMenu === "clock" && (
            <motion.div
              {...dropdownMotion}
              className="absolute top-full right-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl bg-background-card shadow-lg ring-1 ring-border"
            >
              <div className="relative overflow-hidden bg-linear-to-br from-primary to-primary-dark p-5 text-white">
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-20 bg-[radial-gradient(circle,rgba(255,255,255,0.7)_1px,transparent_1px)] bg-size-[14px_14px]"
                />
                <div className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                <p className="relative flex items-center gap-1.5 text-xs font-semibold text-white/80">
                  <Sparkles size={12} />
                  {greeting}, {firstName} 👋
                </p>
                <p className="relative mt-2 font-mono text-4xl font-bold tracking-tight">
                  {timeLabel}
                  <span className="ml-1.5 text-xs font-bold text-white/70">WIB</span>
                </p>
                <p className="relative mt-1 flex items-center gap-1.5 text-xs text-white/80">
                  <Calendar size={11} />
                  {fullDate}
                </p>
              </div>
              <div className="p-3">
                <div className="flex items-center gap-1.5 rounded-xl bg-success/10 px-3 py-2.5 text-[11px] font-semibold text-success">
                  <CheckCircle2 size={13} className="shrink-0" />
                  Sesi aktif sebagai {roleLabel} &middot; Waktu Indonesia Barat
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="ml-auto flex items-center gap-3">
        {/* Notifikasi */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleMenu("notif")}
            className="relative flex h-11 w-11 items-center justify-center rounded-full bg-background-card text-text-secondary shadow-sm transition hover:text-text-primary"
          >
            <Bell size={18} />
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[9px] font-bold text-white ring-2 ring-background">
              {NOTIFICATIONS.length}
            </span>
          </button>

          <AnimatePresence>
            {openMenu === "notif" && (
              <motion.div
                {...dropdownMotion}
                className="absolute top-full right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl bg-background-card shadow-lg ring-1 ring-border"
              >
                <div className="flex items-center justify-between border-b border-border p-4">
                  <p className="flex items-center gap-1.5 text-sm font-bold text-text-primary">
                    <Bell size={14} className="text-primary" />
                    Notifikasi
                  </p>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                    {NOTIFICATIONS.length} baru
                  </span>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {NOTIFICATIONS.map((n) => (
                    <div
                      key={n.id}
                      className="flex gap-3 border-b border-border p-3 transition-colors last:border-0 hover:bg-background-hover"
                    >
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                        style={{ backgroundColor: `${n.color}1a`, color: n.color }}
                      >
                        <n.icon size={15} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-text-primary">{n.title}</p>
                        <p className="truncate text-[11px] text-text-secondary">
                          {n.description}
                        </p>
                        <p className="mt-0.5 text-[10px] text-text-muted">{n.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="flex items-center gap-1.5 border-t border-border px-4 py-2.5 text-[10px] text-text-muted">
                  <Sparkles size={10} className="shrink-0 text-primary" />
                  Contoh tampilan notifikasi, belum terhubung ke data sungguhan
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profil */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleMenu("profile")}
            className={`flex items-center gap-2 rounded-full bg-background-card py-1.5 pr-2.5 pl-1.5 shadow-sm transition hover:shadow-md ${
              openMenu === "profile" ? "ring-2 ring-primary/25" : ""
            }`}
          >
            <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary to-primary-dark text-xs font-bold text-white shadow-sm ring-2 ring-background-card">
              {initials}
              <span className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full bg-success ring-2 ring-background-card" />
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-xs font-bold text-text-primary">
                {user?.nama ?? "Teller"}
              </span>
              <span className="block text-[10px] text-text-muted">{roleLabel}</span>
            </span>
            <ChevronDown
              size={14}
              className={`hidden shrink-0 text-text-muted transition-transform duration-200 sm:block ${
                openMenu === "profile" ? "rotate-180" : ""
              }`}
            />
          </button>

          <AnimatePresence>
            {openMenu === "profile" && (
              <motion.div
                {...dropdownMotion}
                className="absolute top-full right-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl bg-background-card shadow-lg ring-1 ring-border"
              >
                <div className="relative overflow-hidden bg-linear-to-br from-primary to-primary-dark p-5 text-white">
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-20 bg-[radial-gradient(circle,rgba(255,255,255,0.7)_1px,transparent_1px)] bg-size-[14px_14px]"
                  />
                  <div className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                  <div className="relative flex items-center gap-3">
                    <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/20 text-lg font-bold shadow-sm backdrop-blur-sm">
                      {initials}
                      <motion.span
                        animate={{ opacity: [1, 0.4, 1] }}
                        transition={{ duration: 1.6, repeat: Infinity }}
                        className="absolute -right-0.5 -bottom-0.5 h-4 w-4 rounded-full bg-success ring-2 ring-primary"
                      />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-base font-bold">{user?.nama ?? "Teller"}</p>
                      <p className="truncate text-xs text-white/70">
                        @{user?.username ?? "-"}
                      </p>
                      <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold backdrop-blur-sm">
                        <CheckCircle2 size={10} />
                        Online sekarang
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 p-3">
                  <div className="rounded-xl bg-primary/10 p-2.5">
                    <p className="flex items-center gap-1 text-[10px] font-semibold text-primary">
                      <ShieldCheck size={11} />
                      Role
                    </p>
                    <p className="mt-0.5 truncate text-xs font-bold text-text-primary">
                      {roleLabel}
                    </p>
                  </div>
                  <div className="rounded-xl bg-success/10 p-2.5">
                    <p className="flex items-center gap-1 text-[10px] font-semibold text-success">
                      <CheckCircle2 size={11} />
                      Status
                    </p>
                    <p className="mt-0.5 truncate text-xs font-bold text-text-primary">Aktif</p>
                  </div>
                  <div className="rounded-xl bg-warning/10 p-2.5">
                    <p className="flex items-center gap-1 text-[10px] font-semibold text-warning">
                      <UserCircle2 size={11} />
                      Username
                    </p>
                    <p className="mt-0.5 truncate text-xs font-bold text-text-primary">
                      {user?.username ?? "-"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-background-hover p-2.5">
                    <p className="flex items-center gap-1 text-[10px] font-semibold text-text-secondary">
                      <Fingerprint size={11} />
                      ID Akun
                    </p>
                    <p className="mt-0.5 truncate font-mono text-xs font-bold text-text-primary">
                      {user?.id ? user.id.slice(0, 8) : "-"}
                    </p>
                  </div>
                </div>

                <div className="border-t border-border p-3">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleLogout}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-danger/10 px-3 py-2.5 text-xs font-bold text-danger transition-colors hover:bg-danger/20"
                  >
                    <LogOut size={14} />
                    Keluar
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
