"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Eye,
  FileBarChart2,
  Gift,
  HandCoins,
  History,
  Landmark,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Receipt,
  Search,
  ShieldCheck,
  User,
  UserCog,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import {
  isAdminRole,
  isCoTellerRole,
  isNasabahRole,
  isSuperadminRole,
  isWaliKelasRole,
  linkedStaffRole,
} from "@/lib/role";
import type { Role } from "@/lib/types";
import logo from "@/assets/logo bank-mini2.png";
import logoMark from "@/assets/logo-mark.png";

interface MenuItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface MenuGroup {
  label: string;
  items: MenuItem[];
}

const TELLER_MENU_GROUPS: MenuGroup[] = [
  {
    label: "Menu Utama",
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Nasabah",
    items: [{ label: "Nasabah", href: "/nasabah", icon: Users }],
  },
  {
    label: "Transaksi",
    items: [
      { label: "Setor", href: "/transaksi/setor", icon: ArrowDownToLine },
      { label: "Tarik", href: "/transaksi/tarik", icon: ArrowUpFromLine },
      { label: "Mutasi", href: "/mutasi", icon: History },
    ],
  },
  {
    label: "Pengeluaran",
    items: [{ label: "Pengeluaran", href: "/pengeluaran", icon: Receipt }],
  },
  {
    label: "Laporan",
    items: [{ label: "Laporan", href: "/laporan", icon: FileBarChart2 }],
  },
  {
    label: "Simpanan",
    items: [
      { label: "Simpanan Pokok", href: "/simpanan", icon: HandCoins },
      { label: "Simpanan Hari Raya", href: "/simpanan-hari-raya", icon: Gift },
    ],
  },
  {
    label: "Piutang",
    items: [{ label: "Piutang", href: "/piutang", icon: Landmark }],
  },
];

const CO_TELLER_MENU_GROUPS: MenuGroup[] = TELLER_MENU_GROUPS.filter(
  (group) => group.label !== "Simpanan" && group.label !== "Piutang",
);

const ADMIN_MENU_GROUPS: MenuGroup[] = [
  {
    label: "Menu Utama",
    items: [{ label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Nasabah",
    items: [{ label: "Nasabah", href: "/admin/nasabah", icon: Users }],
  },
  {
    label: "Transaksi",
    items: [
      { label: "Transaksi", href: "/admin/transaksi", icon: Eye },
      { label: "Mutasi", href: "/admin/mutasi", icon: History },
    ],
  },
  {
    label: "Pengeluaran",
    items: [{ label: "Pengeluaran", href: "/admin/pengeluaran", icon: Receipt }],
  },
  {
    label: "Laporan",
    items: [{ label: "Laporan", href: "/admin/laporan", icon: FileBarChart2 }],
  },
  {
    label: "Simpanan",
    items: [
      { label: "Simpanan Pokok", href: "/admin/simpanan", icon: HandCoins },
      {
        label: "Simpanan Hari Raya",
        href: "/admin/simpanan-hari-raya",
        icon: Gift,
      },
    ],
  },
  {
    label: "Piutang",
    items: [{ label: "Piutang", href: "/admin/piutang", icon: Landmark }],
  },
];

const SUPERADMIN_MENU_GROUPS: MenuGroup[] = [
  ...ADMIN_MENU_GROUPS,
  {
    label: "Administrasi",
    items: [{ label: "Manajemen Akun", href: "/admin/akun", icon: UserCog }],
  },
];

const NASABAH_MENU_GROUPS: MenuGroup[] = [
  {
    label: "Menu Utama",
    items: [
      { label: "Dashboard", href: "/portal/dashboard", icon: LayoutDashboard },
      { label: "Riwayat", href: "/portal/riwayat", icon: History },
      { label: "Profil", href: "/portal/profil", icon: User },
    ],
  },
];

const WALI_KELAS_MENU_GROUPS: MenuGroup[] = [
  ...NASABAH_MENU_GROUPS,
  {
    label: "Wali Kelas",
    items: [{ label: "Saldo Kelas", href: "/portal/kelas", icon: ShieldCheck }],
  },
];

function withSectionLabel(groups: MenuGroup[], label: string): MenuGroup[] {
  if (groups.length === 0) return groups;
  return [{ ...groups[0], label }, ...groups.slice(1)];
}

const STAFF_MENU_BY_ROLE: Record<Role, MenuGroup[]> = {
  superadmin: SUPERADMIN_MENU_GROUPS,
  admin: ADMIN_MENU_GROUPS,
  teller: TELLER_MENU_GROUPS,
  co_teller: CO_TELLER_MENU_GROUPS,
};

const STAFF_SECTION_LABEL: Record<Role, string> = {
  superadmin: "Panel Superadmin",
  admin: "Panel Admin",
  teller: "Panel Teller",
  co_teller: "Panel Co Teller",
};

const ROLE_LABEL: Record<string, string> = {
  superadmin: "Superadmin",
  admin: "Admin",
  teller: "Teller",
  co_teller: "Co Teller",
  siswa: "Siswa",
  guru: "Guru",
  umum: "Umum",
  kelas: "Kelas",
  wali_kelas: "Wali Kelas",
};

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export default function Sidebar({
  mobileOpen,
  onClose,
  collapsed,
  onToggleCollapsed,
}: SidebarProps) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const staffRole = linkedStaffRole(user);
  const baseNasabahGroups = isWaliKelasRole(user)
    ? WALI_KELAS_MENU_GROUPS
    : NASABAH_MENU_GROUPS;

  const isCombined = isNasabahRole(user) && !!staffRole;

  const menuGroups = useMemo(() => {
    if (isNasabahRole(user)) {
      if (!staffRole) return baseNasabahGroups;
      return [
        ...withSectionLabel(STAFF_MENU_BY_ROLE[staffRole], STAFF_SECTION_LABEL[staffRole]),
        ...withSectionLabel(baseNasabahGroups, "Portal Nasabah"),
      ];
    }
    if (isSuperadminRole(user)) return SUPERADMIN_MENU_GROUPS;
    if (isAdminRole(user)) return ADMIN_MENU_GROUPS;
    if (isCoTellerRole(user)) return CO_TELLER_MENU_GROUPS;
    return TELLER_MENU_GROUPS;
  }, [user, staffRole, baseNasabahGroups]);

  const [activeHref, setActiveHref] = useState("");

  useEffect(() => {
    const current = menuGroups
      .flatMap((g) => g.items)
      .find((item) => pathname === item.href);
    if (current) setActiveHref(current.href);
  }, [pathname, menuGroups]);

  function handleMenuClick(item: MenuItem) {
    setActiveHref(item.href);
    onClose?.();
  }

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  const initials = (user?.nama ?? "BS").slice(0, 2).toUpperCase();

  return (
    <>
      {mobileOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-dvh shrink-0 flex-col bg-background transition-[width,transform] duration-300 ease-in-out md:static md:z-0 md:h-screen md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "w-20 p-2" : "w-64 p-3"}`}
      >
        <div
          className={`relative flex h-full w-full flex-col overflow-hidden rounded-2xl bg-linear-to-b from-primary to-primary-dark font-sans shadow-xl shadow-primary/25 ${
            collapsed ? "px-2 py-3" : "p-3"
          }`}
        >
          <div className="pointer-events-none absolute inset-0 opacity-[0.07] bg-[radial-gradient(circle,rgba(255,255,255,0.9)_1px,transparent_1px)] bg-size-[16px_16px]" />
          <div className="animate-glow-pulse pointer-events-none absolute -top-12 -right-14 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup menu"
            className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white/80 transition-colors duration-200 hover:bg-white hover:text-primary md:hidden"
          >
            <X className="h-4 w-4" strokeWidth={2.25} />
          </button>

          <div
            className={`relative z-10 flex h-full flex-col ${isCombined ? "gap-3" : "gap-4"}`}
          >
            <div
              className={`flex ${
                collapsed
                  ? "flex-col items-center gap-2"
                  : "items-center justify-between gap-2 px-1"
              }`}
            >
              <motion.span
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                className={`flex shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ${
                  collapsed ? "h-9 w-9" : "h-9 px-2.5"
                }`}
              >
                <Image
                  src={collapsed ? logoMark : logo}
                  alt="Bank Mini NUSA"
                  priority
                  className="h-6 w-auto object-contain"
                />
              </motion.span>

              <motion.button
                type="button"
                onClick={onToggleCollapsed}
                whileTap={{ scale: 0.9 }}
                aria-label={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
                className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15 text-white/80 transition-colors duration-200 hover:bg-white hover:text-primary md:flex"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={collapsed ? "open" : "close"}
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex"
                  >
                    {collapsed ? (
                      <PanelLeftOpen className="h-4 w-4" strokeWidth={2.25} />
                    ) : (
                      <PanelLeftClose className="h-4 w-4" strokeWidth={2.25} />
                    )}
                  </motion.span>
                </AnimatePresence>
              </motion.button>
            </div>

            {!collapsed && !isCombined && (
              <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2.5 backdrop-blur-sm transition-colors focus-within:border-white/30 focus-within:bg-white/15">
                <Search className="h-4 w-4 shrink-0 text-white/70" strokeWidth={2.25} />
                <input
                  type="text"
                  placeholder="Cari menu..."
                  className="w-full bg-transparent text-sm font-medium text-white placeholder:text-white/50 focus:outline-none"
                />
              </div>
            )}

            <nav
              className={`flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden ${
                isCombined ? "gap-1.5" : "gap-2"
              }`}
            >
              {menuGroups.map((group, i) => (
                <Fragment key={group.label}>
                  {i > 0 && <div className="border-t border-white/10" />}

                  {!collapsed && (
                    <p className="px-3 text-[10px] font-bold tracking-[0.15em] text-white/45 uppercase">
                      {group.label}
                    </p>
                  )}

                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = activeHref === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => handleMenuClick(item)}
                        title={collapsed ? item.label : undefined}
                        className={`group relative flex items-center rounded-xl text-sm transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                          isCombined ? "py-2" : "py-2.5"
                        } ${collapsed ? "justify-center px-0" : "gap-3 pr-3 pl-2"}`}
                      >
                        {active && (
                          <motion.span
                            layoutId="sidebar-active-pill"
                            transition={{ type: "spring", stiffness: 420, damping: 32 }}
                            className="absolute inset-0 rounded-xl bg-white shadow-lg shadow-black/10"
                          />
                        )}
                        <span
                          className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-200 ${
                            active
                              ? "text-primary"
                              : "text-white/75 group-hover:bg-white/10 group-hover:text-white"
                          }`}
                        >
                          <Icon
                            className="h-4.5 w-4.5"
                            strokeWidth={2.25}
                            fill={active ? "currentColor" : "none"}
                            fillOpacity={0.15}
                          />
                        </span>
                        <span
                          className={`relative z-10 overflow-hidden whitespace-nowrap font-semibold transition-all duration-300 ease-in-out ${
                            active
                              ? "text-primary"
                              : "text-white/85 group-hover:text-white"
                          } ${collapsed ? "max-w-0 opacity-0" : "max-w-32 opacity-100"}`}
                        >
                          {item.label}
                        </span>
                      </Link>
                    );
                  })}
                </Fragment>
              ))}
            </nav>

            <div className="border-t border-white/10 pt-3">
              <div
                className={`relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-sm transition-colors hover:bg-white/15 ${
                  collapsed ? "flex justify-center p-2" : "p-2.5"
                }`}
              >
                {!collapsed && (
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-[0.06] bg-[radial-gradient(circle,rgba(255,255,255,0.9)_1px,transparent_1px)] bg-size-[12px_12px]"
                  />
                )}
                <div className={`relative flex items-center ${collapsed ? "" : "gap-3"}`}>
                  <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-primary shadow-sm ring-2 ring-white/30">
                    {initials}
                    <motion.span
                      animate={{ opacity: [1, 0.4, 1] }}
                      transition={{ duration: 1.6, repeat: Infinity }}
                      className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full bg-success ring-2 ring-primary"
                    />
                  </span>
                  <div
                    className={`min-w-0 overflow-hidden transition-all duration-300 ease-in-out ${
                      collapsed ? "max-w-0 opacity-0" : "max-w-32 flex-1 opacity-100"
                    }`}
                  >
                    <p className="truncate text-sm font-semibold text-white">
                      {user?.nama ?? "Budi Santoso"}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold whitespace-nowrap text-white/90">
                        {isNasabahRole(user) ? (
                          <User size={10} />
                        ) : (
                          <ShieldCheck size={10} />
                        )}
                        {ROLE_LABEL[user?.role ?? "teller"] ?? "Teller"}
                      </span>
                      {staffRole && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold whitespace-nowrap text-white/90">
                          <ShieldCheck size={10} />
                          {ROLE_LABEL[staffRole] ?? staffRole}
                        </span>
                      )}
                    </div>
                  </div>
                  <motion.button
                    onClick={handleLogout}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    title="Logout"
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/60 transition-colors duration-200 hover:bg-danger/25 hover:text-white ${
                      collapsed ? "hidden" : ""
                    }`}
                  >
                    <LogOut className="h-4 w-4" strokeWidth={2.25} />
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
