"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Bell,
  Calendar,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Eye,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  PencilLine,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  UserCircle2,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { syncThemeFromDom, useThemeStore } from "@/store/themeStore";
import { useLiveClock } from "@/hooks/useLiveClock";
import { isAdminRole, isNasabahRole } from "@/lib/role";
import { formatFullDateID, formatRelativeTimeID, formatTime, getWibHour } from "@/lib/format";
import api from "@/lib/api";
import type { AppNotification, NotificationListResult } from "@/lib/types";

type MenuKey = "search" | "clock" | "notif" | "profile";

const NOTIF_ICON: Record<string, LucideIcon> = {
  transaksi_setor: Wallet,
  transaksi_tarik: History,
  nasabah_baru: Users,
  pengeluaran_baru: CreditCard,
  piutang_baru: Wallet,
  simpanan_hari_raya_pencairan: Sparkles,
  saldo_dikoreksi: PencilLine,
};
const NOTIF_COLOR: Record<string, string> = {
  transaksi_setor: "#22c55e",
  transaksi_tarik: "#ea580c",
  nasabah_baru: "#1120f0",
  pengeluaran_baru: "#dc2626",
  piutang_baru: "#8b5cf6",
  simpanan_hari_raya_pencairan: "#f59e0b",
  saldo_dikoreksi: "#f59e0b",
};
const NOTIF_ICON_DEFAULT = Bell;
const NOTIF_COLOR_DEFAULT = "#1120f0";

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

const NASABAH_QUICK_LINKS = [
  { label: "Dashboard", href: "/portal/dashboard", icon: LayoutDashboard, color: "#1120f0" },
  { label: "Riwayat Transaksi", href: "/portal/riwayat", icon: History, color: "#22c55e" },
  { label: "Profil Saya", href: "/portal/profil", icon: UserCircle2, color: "#ea580c" },
];

const ROLE_LABEL: Record<string, string> = {
  superadmin: "Super Admin",
  admin: "Admin",
  teller: "Teller",
  co_teller: "Co Teller",
  siswa: "Siswa",
  guru: "Guru",
  umum: "Umum",
  kelas: "Kelas",
  wali_kelas: "Wali Kelas",
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
  const QUICK_LINKS = isNasabahRole(user)
    ? NASABAH_QUICK_LINKS
    : isAdminRole(user)
      ? ADMIN_QUICK_LINKS
      : TELLER_QUICK_LINKS;
  const now = useLiveClock();
  const [query, setQuery] = useState("");
  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const containerRef = useRef<HTMLElement>(null);
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  useEffect(() => {
    syncThemeFromDom();
  }, []);

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

  useEffect(() => {
    let cancelled = false;
    api
      .get<NotificationListResult>("/notifications")
      .then(({ data }) => {
        if (cancelled) return;
        setNotifications(data.items);
        setUnreadCount(data.unreadCount);
      })
      .catch(() => {});

    const streamUrl = `${api.defaults.baseURL}/notifications/stream`;
    const source = new EventSource(streamUrl, { withCredentials: true });
    source.onmessage = (event) => {
      try {
        const notif = JSON.parse(event.data) as AppNotification;
        setNotifications((prev) => [notif, ...prev].slice(0, 30));
        setUnreadCount((prev) => prev + 1);
      } catch {
        // event tidak valid, abaikan
      }
    };
    return () => {
      cancelled = true;
      source.close();
    };
  }, []);

  function toggleMenu(key: MenuKey) {
    setOpenMenu((prev) => {
      const next = prev === key ? null : key;
      if (key === "notif" && next === "notif" && unreadCount > 0) {
        setUnreadCount(0);
        api.post("/notifications/mark-read").catch(() => {});
      }
      return next;
    });
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    const base = isNasabahRole(user)
      ? "/portal/riwayat"
      : isAdminRole(user)
        ? "/admin/nasabah"
        : "/nasabah";
    router.push(`${base}?search=${encodeURIComponent(query.trim())}`);
    setOpenMenu(null);
  }

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  const greeting = (() => {
    const hour = now ? getWibHour(now) : 12;
    if (hour < 10) return "Selamat pagi";
    if (hour < 15) return "Selamat siang";
    if (hour < 18) return "Selamat sore";
    return "Selamat malam";
  })();

  const fullDate = now ? formatFullDateID(now) : "—";
  const timeLabel = now ? formatTime(now) : "—:—:—";

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
            placeholder={isNasabahRole(user) ? "Cari riwayat transaksi..." : "Cari nasabah, transaksi..."}
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
                {isNasabahRole(user)
                  ? `Tekan Enter untuk mencari riwayat "${query || "..."}"`
                  : `Tekan Enter untuk mencari nasabah "${query || "..."}"`}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="relative hidden shrink-0 sm:block">
        <motion.button
          type="button"
          onClick={() => toggleMenu("clock")}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`relative flex items-center gap-2.5 overflow-hidden rounded-2xl bg-linear-to-br from-gradient-orange-from to-gradient-orange-to py-2 pr-4 pl-2 text-white shadow-sm shadow-orange-500/30 transition-shadow hover:shadow-md ${
            openMenu === "clock" ? "ring-2 ring-orange-400/40" : ""
          }`}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-20 bg-[radial-gradient(circle,rgba(255,255,255,0.8)_1px,transparent_1px)] bg-size-[10px_10px]"
          />
          <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <Calendar size={15} />
            <motion.span
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.6, repeat: Infinity }}
              className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-success ring-2 ring-orange-500"
            />
          </span>
          <span className="relative flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-xs font-bold text-white/90">{fullDate}</span>
            <span className="text-white/40">&middot;</span>
            <span className="flex items-center gap-1 font-mono text-sm font-extrabold tracking-tight text-white">
              {timeLabel}
              <span className="text-[9px] font-bold text-white/70">WIB</span>
            </span>
          </span>
        </motion.button>

        <AnimatePresence>
          {openMenu === "clock" && (
            <motion.div
              {...dropdownMotion}
              className="absolute top-full right-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl bg-background-card shadow-lg ring-1 ring-border"
            >
              <div className="relative overflow-hidden bg-linear-to-br from-gradient-orange-from to-gradient-orange-to p-5 text-white">
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
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Aktifkan tema terang" : "Aktifkan tema gelap"}
          title={theme === "dark" ? "Tema terang" : "Tema gelap"}
          className="relative flex h-11 w-20 shrink-0 items-center rounded-full bg-background-hover px-1 shadow-inner ring-1 ring-border transition-colors"
        >
          <Sun size={13} className="pointer-events-none absolute left-2 text-text-muted" />
          <Moon size={13} className="pointer-events-none absolute right-2 text-text-muted" />
          <motion.span
            layout
            transition={{ type: "spring", stiffness: 500, damping: 32 }}
            className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full bg-background-card text-text-primary shadow-sm ${
              theme === "dark" ? "ml-auto" : "mr-auto"
            }`}
          >
            {theme === "dark" ? <Moon size={16} /> : <Sun size={16} />}
          </motion.span>
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => toggleMenu("notif")}
            className="relative flex h-11 w-11 items-center justify-center rounded-full bg-background-card text-text-secondary shadow-sm transition hover:text-text-primary"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-0.5 text-[9px] font-bold text-white ring-2 ring-background">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
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
                    {notifications.length} notifikasi
                  </span>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-center text-xs text-text-muted">
                      Belum ada notifikasi
                    </p>
                  ) : (
                    notifications.map((n) => {
                      const Icon = NOTIF_ICON[n.type] ?? NOTIF_ICON_DEFAULT;
                      const color = NOTIF_COLOR[n.type] ?? NOTIF_COLOR_DEFAULT;
                      const content = (
                        <>
                          <span
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                            style={{ backgroundColor: `${color}1a`, color }}
                          >
                            <Icon size={15} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-text-primary">{n.title}</p>
                            <p className="truncate text-[11px] text-text-secondary">
                              {n.description}
                            </p>
                            <p className="mt-0.5 text-[10px] text-text-muted">
                              {formatRelativeTimeID(n.createdAt)}
                            </p>
                          </div>
                        </>
                      );
                      const rowClassName =
                        "flex w-full gap-3 border-b border-border p-3 text-left transition-colors last:border-0 hover:bg-background-hover";
                      return n.link ? (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => {
                            setOpenMenu(null);
                            router.push(n.link!);
                          }}
                          className={rowClassName}
                        >
                          {content}
                        </button>
                      ) : (
                        <div key={n.id} className={rowClassName}>
                          {content}
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

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
                className="absolute top-full right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl bg-background-card font-sans shadow-lg ring-1 ring-border"
              >
                <div className="relative overflow-hidden bg-linear-to-br from-primary to-primary-dark p-5 text-white">
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-20 bg-[radial-gradient(circle,rgba(255,255,255,0.7)_1px,transparent_1px)] bg-size-[14px_14px]"
                  />
                  <div className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
                  <div className="pointer-events-none absolute -bottom-10 -left-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                  <div className="relative flex items-center gap-3">
                    <motion.span
                      whileHover={{ scale: 1.08, rotate: 4 }}
                      className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-lg font-bold shadow-sm backdrop-blur-sm"
                    >
                      {initials}
                      <motion.span
                        animate={{ opacity: [1, 0.4, 1] }}
                        transition={{ duration: 1.6, repeat: Infinity }}
                        className="absolute -right-0.5 -bottom-0.5 h-4 w-4 rounded-full bg-success ring-2 ring-primary"
                      />
                    </motion.span>
                    <div className="min-w-0">
                      <p className="truncate text-base font-bold">{user?.nama ?? "Teller"}</p>
                      <p className="truncate text-xs text-white/70">
                        @{user?.username ?? "-"}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold backdrop-blur-sm">
                          <ShieldCheck size={10} />
                          {roleLabel}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-success/30 px-2 py-0.5 text-[10px] font-bold backdrop-blur-sm">
                          <motion.span
                            animate={{ opacity: [1, 0.4, 1] }}
                            transition={{ duration: 1.6, repeat: Infinity }}
                            className="h-1.5 w-1.5 rounded-full bg-success"
                          />
                          Online
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 p-3">
                  <p className="flex items-center gap-1.5 px-1 text-[11px] font-bold tracking-wide text-text-muted uppercase">
                    <Sparkles size={11} className="text-primary" />
                    Ringkasan Akun
                  </p>

                  <div className="relative overflow-hidden rounded-xl bg-linear-to-r from-primary/10 to-success/10 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                          <UserCircle2 size={15} />
                        </span>
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold text-text-secondary">
                            Username
                          </p>
                          <p className="truncate text-xs font-bold text-text-primary">
                            {user?.username ?? "-"}
                          </p>
                        </div>
                      </div>
                      <span className="h-8 w-px shrink-0 bg-border" />
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-success/15 text-success">
                          {user?.noRekening ? <CreditCard size={15} /> : <ShieldCheck size={15} />}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold text-text-secondary">
                            {user?.noRekening ? "No Rekening" : "Role"}
                          </p>
                          <p
                            className={`truncate text-xs font-bold text-text-primary ${
                              user?.noRekening ? "font-mono" : ""
                            }`}
                          >
                            {user?.noRekening ?? roleLabel}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {isNasabahRole(user) && (
                    <Link
                      href="/portal/profil"
                      onClick={() => setOpenMenu(null)}
                      className="group flex items-center justify-between gap-2 rounded-xl border border-border px-3 py-2.5 text-xs font-semibold text-text-secondary transition-colors hover:border-primary/40 hover:text-primary"
                    >
                      <span className="flex items-center gap-2">
                        <UserCircle2 size={14} />
                        Lihat Profil Saya
                      </span>
                      <ArrowRight
                        size={13}
                        className="transition-transform duration-200 group-hover:translate-x-0.5"
                      />
                    </Link>
                  )}
                </div>

                <div className="border-t border-border p-3">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
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
