"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { notify } from "@/store/notifyStore";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  Filter,
  KeyRound,
  Lock,
  Pencil,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCheck,
  UserCog,
  UserPlus,
  Users,
  X,
  XCircle,
} from "lucide-react";
import Layout from "@/components/Layout";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/error";
import { formatDate } from "@/lib/format";
import { useAuthStore } from "@/store/authStore";
import type { Akun, Role } from "@/lib/types";

interface AddForm {
  username: string;
  password: string;
  nama: string;
  role: Role;
}

const initialAddForm: AddForm = {
  username: "",
  password: "",
  nama: "",
  role: "teller",
};

interface EditForm {
  username: string;
  nama: string;
  role: Role;
  isActive: boolean;
  password: string;
}

function toEditForm(akun: Akun): EditForm {
  return {
    username: akun.username,
    nama: akun.nama,
    role: akun.role,
    isActive: akun.isActive,
    password: "",
  };
}

const ROLE_LABEL: Record<Role, string> = {
  superadmin: "Superadmin",
  admin: "Admin",
  teller: "Teller",
  co_teller: "Co Teller",
};

const ROLE_ICON: Record<Role, typeof Shield> = {
  superadmin: ShieldCheck,
  admin: UserCog,
  teller: Users,
  co_teller: UserCheck,
};

const ROLE_COLOR: Record<Role, string> = {
  superadmin: "#a78bfa",
  admin: "#1120f0",
  teller: "#ea580c",
  co_teller: "#22c55e",
};

const ROLE_GRADIENT: Record<Role, string> = {
  superadmin: "from-gradient-purple-from to-gradient-purple-to",
  admin: "from-primary to-primary-dark",
  teller: "from-gradient-orange-from to-gradient-orange-to",
  co_teller: "from-gradient-green-from to-gradient-green-to",
};

const inputClass =
  "w-full rounded-xl border border-border bg-background-hover px-3 py-2.5 text-sm text-text-primary transition-shadow focus:border-primary focus:bg-background-card focus:outline-none focus:ring-2 focus:ring-primary/20";
const labelClass = "mb-1.5 block text-xs font-semibold text-text-secondary";

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
};

const rowVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

export function AkunPageContent() {
  const currentUser = useAuthStore((state) => state.user);

  const [akunList, setAkunList] = useState<Akun[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "">("");
  const [statusFilter, setStatusFilter] = useState<"aktif" | "nonaktif" | "">("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState<AddForm>(initialAddForm);
  const [addSaving, setAddSaving] = useState(false);
  const [showAddPassword, setShowAddPassword] = useState(false);

  const [editing, setEditing] = useState<Akun | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);

  async function loadAkun() {
    setLoading(true);
    try {
      const { data } = await api.get<Akun[]>("/users");
      setAkunList(data);
    } catch (error) {
      notify.error(getErrorMessage(error, "Gagal memuat data akun"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAkun();
  }, []);

  const roleCounts = useMemo(() => {
    return {
      superadmin: akunList.filter((a) => a.role === "superadmin").length,
      admin: akunList.filter((a) => a.role === "admin").length,
      teller: akunList.filter((a) => a.role === "teller").length,
      co_teller: akunList.filter((a) => a.role === "co_teller").length,
    };
  }, [akunList]);

  const statusCounts = useMemo(() => {
    return {
      aktif: akunList.filter((a) => a.isActive).length,
      nonaktif: akunList.filter((a) => !a.isActive).length,
    };
  }, [akunList]);

  const displayList = useMemo(() => {
    const q = search.trim().toLowerCase();
    return akunList
      .filter((a) => (roleFilter ? a.role === roleFilter : true))
      .filter((a) =>
        statusFilter
          ? statusFilter === "aktif"
            ? a.isActive
            : !a.isActive
          : true,
      )
      .filter((a) =>
        q
          ? a.nama.toLowerCase().includes(q) ||
            a.username.toLowerCase().includes(q)
          : true,
      );
  }, [akunList, search, roleFilter, statusFilter]);

  function clearFilters() {
    setRoleFilter("");
    setStatusFilter("");
  }

  function openAdd() {
    setAddForm(initialAddForm);
    setShowAddPassword(false);
    setShowAddModal(true);
  }

  function closeAdd() {
    setShowAddModal(false);
  }

  function openEdit(akun: Akun) {
    setEditing(akun);
    setEditForm(toEditForm(akun));
    setShowEditPassword(false);
  }

  function closeEdit() {
    setEditing(null);
    setEditForm(null);
  }

  async function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAddSaving(true);
    try {
      await api.post("/users", {
        username: addForm.username,
        password: addForm.password,
        nama: addForm.nama,
        role: addForm.role,
      });
      notify.success("Akun berhasil ditambahkan");
      closeAdd();
      loadAkun();
    } catch (error) {
      notify.error(getErrorMessage(error, "Gagal menambahkan akun"));
    } finally {
      setAddSaving(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editing || !editForm) return;
    setSaving(true);
    try {
      await api.patch(`/users/${editing.id}`, {
        username: editForm.username,
        nama: editForm.nama,
        role: editForm.role,
        isActive: editForm.isActive,
        ...(editForm.password ? { password: editForm.password } : {}),
      });
      notify.success("Akun berhasil diperbarui");
      closeEdit();
      loadAkun();
    } catch (error) {
      notify.error(getErrorMessage(error, "Gagal memperbarui akun"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(akun: Akun) {
    if (akun.id === currentUser?.id) {
      notify.error("Tidak dapat menghapus akun sendiri");
      return;
    }
    if (!confirm(`Hapus akun ${akun.nama} (${akun.username})?`)) {
      return;
    }
    try {
      await api.delete(`/users/${akun.id}`);
      notify.success("Akun berhasil dihapus");
      loadAkun();
    } catch (error) {
      notify.error(getErrorMessage(error, "Gagal menghapus akun"));
    }
  }

  const isEditingSelf = editing?.id === currentUser?.id;

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative mb-5 overflow-hidden rounded-3xl bg-background-card p-5 shadow-soft sm:p-6 md:mb-7 2xl:mb-8"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle,rgba(17,32,240,0.9)_1px,transparent_1px)] bg-size-[16px_16px]"
        />
        <div className="pointer-events-none absolute -top-14 -right-14 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <motion.span
              initial={{ scale: 0.6, opacity: 0, rotate: -15 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              whileHover={{ scale: 1.08, rotate: 6 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-primary-dark text-white shadow-sm"
            >
              <UserCog size={24} />
              <motion.span
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.6, repeat: Infinity }}
                className="absolute -right-0.5 -bottom-0.5 h-3.5 w-3.5 rounded-full bg-success ring-2 ring-background-card"
              />
            </motion.span>
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                <Sparkles size={12} />
                Administrasi Sistem
              </p>
              <h1 className="text-2xl font-bold text-text-primary">
                Manajemen Akun
              </h1>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-text-secondary">
                <ShieldCheck size={13} className="text-text-muted" />
                Kelola akun staf: superadmin, admin, teller, dan co teller
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-2.5 rounded-full bg-primary/10 py-1.5 pr-3.5 pl-1.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Users size={16} />
              </span>
              <span className="text-left leading-tight">
                <span className="block text-xs font-bold text-primary">
                  {akunList.length} Akun
                </span>
                <span className="block text-[10px] text-primary/70">Terdaftar</span>
              </span>
            </span>
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={openAdd}
              className="flex w-fit items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-dark"
            >
              <UserPlus size={16} />
              Tambah Akun
            </motion.button>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.08 } },
        }}
        className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
      >
        {(
          [
            {
              label: "Total Akun",
              value: akunList.length,
              caption: "Seluruh staf terdaftar",
              progressPct: 100,
              icon: Users,
              gradient: "from-primary to-primary-dark",
            },
            {
              label: "Superadmin",
              value: roleCounts.superadmin,
              caption: "Akses penuh sistem",
              progressPct:
                akunList.length > 0
                  ? Math.round((roleCounts.superadmin / akunList.length) * 100)
                  : 0,
              icon: ShieldCheck,
              gradient: ROLE_GRADIENT.superadmin,
            },
            {
              label: "Admin",
              value: roleCounts.admin,
              caption: "Kelola nasabah & laporan",
              progressPct:
                akunList.length > 0
                  ? Math.round((roleCounts.admin / akunList.length) * 100)
                  : 0,
              icon: UserCog,
              gradient: "from-gradient-blue-from to-gradient-blue-to",
            },
            {
              label: "Teller",
              value: roleCounts.teller,
              caption: "Input transaksi harian",
              progressPct:
                akunList.length > 0
                  ? Math.round((roleCounts.teller / akunList.length) * 100)
                  : 0,
              icon: Users,
              gradient: ROLE_GRADIENT.teller,
            },
            {
              label: "Co Teller",
              value: roleCounts.co_teller,
              caption: "Bantu transaksi teller",
              progressPct:
                akunList.length > 0
                  ? Math.round((roleCounts.co_teller / akunList.length) * 100)
                  : 0,
              icon: UserCheck,
              gradient: ROLE_GRADIENT.co_teller,
            },
          ] as const
        ).map((stat) => (
          <motion.div
            key={stat.label}
            variants={{
              hidden: { opacity: 0, y: 8 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
            }}
            whileHover={{ y: -3 }}
            className={`relative min-w-0 overflow-hidden rounded-2xl bg-linear-to-br p-4 text-white shadow-sm transition-shadow hover:shadow-md ${stat.gradient}`}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-20 bg-[radial-gradient(circle,rgba(255,255,255,0.7)_1px,transparent_1px)] bg-size-[12px_12px]"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -top-6 -right-6 h-16 w-16 rounded-full bg-white/10 blur-xl"
            />
            <div className="relative min-w-0">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                  <stat.icon size={15} />
                </span>
                <div className="min-w-0 leading-tight">
                  <p className="text-xl font-bold">{stat.value}</p>
                  <p className="truncate text-[11px] font-semibold text-white/85">
                    {stat.label}
                  </p>
                </div>
              </div>
              <p className="mt-2 truncate text-[10px] text-white/60">{stat.caption}</p>
              <div className="mt-2.5">
                <div className="mb-1 flex items-center justify-between text-[9px] text-white/70">
                  <span>Porsi staf</span>
                  <span className="font-bold text-white">{stat.progressPct}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-full rounded-full bg-white transition-[width] duration-700"
                    style={{ width: `${Math.min(100, Math.max(0, stat.progressPct))}%` }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative mb-4 overflow-hidden rounded-3xl bg-background-card p-4 shadow-soft sm:p-5"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.025] bg-[radial-gradient(circle,rgba(17,32,240,0.9)_1px,transparent_1px)] bg-size-[16px_16px]"
        />

        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-bold text-text-primary">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Filter size={13} />
              </span>
              Daftar Akun{" "}
              <span className="font-medium text-text-muted">
                ({displayList.length})
              </span>
            </p>
            <p className="mt-1 ml-9 text-xs text-text-secondary">
              Kelola, saring, dan cari akun staf dengan cepat
            </p>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search
              size={16}
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-text-muted"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau username..."
              className="w-full rounded-xl border border-transparent bg-background-hover py-2.5 pr-8 pl-9 text-sm text-text-primary transition-shadow focus:border-primary focus:bg-background-card focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute top-1/2 right-2.5 -translate-y-1/2 text-text-muted transition-colors hover:text-danger"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="relative mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { value: "" as const, label: "Semua Role", icon: Filter },
                { value: "superadmin" as const, label: "Superadmin", icon: ShieldCheck },
                { value: "admin" as const, label: "Admin", icon: UserCog },
                { value: "teller" as const, label: "Teller", icon: Users },
                { value: "co_teller" as const, label: "Co Teller", icon: UserCheck },
              ]
            ).map((opt) => {
              const active = roleFilter === opt.value;
              const color = opt.value ? ROLE_COLOR[opt.value] : "#1120f0";
              const OptIcon = opt.icon;
              return (
                <motion.button
                  key={opt.label}
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setRoleFilter(opt.value)}
                  className="relative rounded-md px-3.5 py-1.5 text-xs font-semibold"
                >
                  {active && (
                    <motion.span
                      layoutId="role-pill-active"
                      transition={{ type: "spring", stiffness: 420, damping: 32 }}
                      className="absolute inset-0 rounded-md shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                  )}
                  <span
                    className={`relative flex items-center gap-1.5 transition-colors ${
                      active
                        ? "text-white"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    <OptIcon size={12} />
                    {opt.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                {
                  value: "" as const,
                  label: "Semua Status",
                  icon: Filter,
                  count: akunList.length,
                },
                {
                  value: "aktif" as const,
                  label: "Aktif",
                  icon: CheckCircle2,
                  count: statusCounts.aktif,
                },
                {
                  value: "nonaktif" as const,
                  label: "Nonaktif",
                  icon: XCircle,
                  count: statusCounts.nonaktif,
                },
              ]
            ).map((opt) => {
              const active = statusFilter === opt.value;
              const OptIcon = opt.icon;
              return (
                <motion.button
                  key={opt.label}
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setStatusFilter(opt.value)}
                  className="relative rounded-md px-3.5 py-1.5 text-xs font-semibold"
                >
                  {active && (
                    <motion.span
                      layoutId="status-pill-active"
                      transition={{ type: "spring", stiffness: 420, damping: 32 }}
                      className="absolute inset-0 rounded-md bg-success shadow-sm"
                    />
                  )}
                  <span
                    className={`relative flex items-center gap-1.5 transition-colors ${
                      active
                        ? "text-white"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    <OptIcon size={12} />
                    {opt.label}
                    <span
                      className={`rounded-full px-1.5 text-[10px] ${
                        active ? "bg-white/20" : "bg-background-hover"
                      }`}
                    >
                      {opt.count}
                    </span>
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {(roleFilter || statusFilter) && (
          <div className="relative mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
            <span className="flex items-center gap-1 text-[11px] font-semibold text-text-muted">
              <Sparkles size={11} />
              Filter aktif:
            </span>
            {roleFilter && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {ROLE_LABEL[roleFilter]}
                <button type="button" onClick={() => setRoleFilter("")}>
                  <X size={12} />
                </button>
              </span>
            )}
            {statusFilter && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success capitalize">
                {statusFilter === "aktif" ? (
                  <CheckCircle2 size={12} />
                ) : (
                  <XCircle size={12} />
                )}
                {statusFilter}
                <button type="button" onClick={() => setStatusFilter("")}>
                  <X size={12} />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-semibold text-text-muted transition-colors hover:text-danger"
            >
              Clear all
            </button>
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="overflow-hidden rounded-3xl bg-background-card shadow-soft"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-background-hover">
              <tr>
                <th className="px-4 py-3 text-xs font-bold tracking-wide text-text-muted uppercase">
                  Nama &amp; Username
                </th>
                <th className="px-4 py-3 text-xs font-bold tracking-wide text-text-muted uppercase">
                  Role
                </th>
                <th className="px-4 py-3 text-xs font-bold tracking-wide text-text-muted uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-xs font-bold tracking-wide text-text-muted uppercase">
                  Login Terakhir
                </th>
                <th className="px-4 py-3 text-xs font-bold tracking-wide text-text-muted uppercase">
                  Terdaftar
                </th>
                <th className="px-4 py-3 text-xs font-bold tracking-wide text-text-muted uppercase">
                  Aksi
                </th>
              </tr>
            </thead>
            <motion.tbody initial="hidden" animate="visible" variants={listVariants}>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-text-secondary">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Memuat data akun...
                    </div>
                  </td>
                </tr>
              ) : displayList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-text-secondary">
                      <Users size={26} className="text-text-muted" />
                      Tidak ada data akun
                    </div>
                  </td>
                </tr>
              ) : (
                displayList.map((akun) => {
                  const RoleIcon = ROLE_ICON[akun.role];
                  const isSelf = akun.id === currentUser?.id;
                  return (
                    <motion.tr
                      key={akun.id}
                      variants={rowVariants}
                      className="border-b border-border transition-colors last:border-0 hover:bg-background-hover"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                            style={{ backgroundColor: ROLE_COLOR[akun.role] }}
                          >
                            {akun.nama.slice(0, 2).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <p className="flex items-center gap-1.5 font-medium text-text-primary">
                              {akun.nama}
                              {isSelf && (
                                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                                  Anda
                                </span>
                              )}
                            </p>
                            <p className="font-mono text-xs text-text-muted">
                              {akun.username}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-white"
                          style={{ backgroundColor: ROLE_COLOR[akun.role] }}
                        >
                          <RoleIcon size={12} />
                          {ROLE_LABEL[akun.role]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                            akun.isActive
                              ? "bg-success/15 text-success"
                              : "bg-background-hover text-text-secondary"
                          }`}
                        >
                          {akun.isActive ? (
                            <CheckCircle2 size={12} />
                          ) : (
                            <XCircle size={12} />
                          )}
                          {akun.isActive ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-text-secondary">
                        {akun.lastLogin ? formatDate(akun.lastLogin) : "Belum pernah"}
                      </td>
                      <td className="px-4 py-3 text-xs text-text-secondary">
                        {formatDate(akun.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.92 }}
                            onClick={() => openEdit(akun)}
                            className="flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-primary-dark"
                          >
                            <Pencil size={12} />
                            Edit
                          </motion.button>
                          <motion.button
                            whileHover={isSelf ? undefined : { scale: 1.05 }}
                            whileTap={isSelf ? undefined : { scale: 0.92 }}
                            onClick={() => handleDelete(akun)}
                            disabled={isSelf}
                            title={isSelf ? "Tidak dapat menghapus akun sendiri" : undefined}
                            className="flex items-center gap-1 rounded-lg bg-danger px-2.5 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-danger/90 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Trash2 size={12} />
                            Hapus
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </motion.tbody>
          </table>
        </div>
      </motion.div>

      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeAdd}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="scrollbar-hide relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-background-card p-6 shadow-soft"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle,rgba(17,32,240,0.9)_1px,transparent_1px)] bg-size-[18px_18px]"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl"
              />

              <div className="relative mb-4 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-primary-dark text-white">
                    <UserPlus size={20} />
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-text-primary">
                      Tambah Akun
                    </h2>
                    <p className="text-xs text-text-secondary">
                      Buat akun staf baru
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeAdd}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-background-hover hover:text-text-primary"
                >
                  <X size={16} />
                </button>
              </div>

              <p className="relative mb-4 flex items-center gap-1.5 rounded-xl bg-primary/5 px-3 py-2 text-xs text-text-secondary">
                <Sparkles size={13} className="shrink-0 text-primary" />
                Tentukan role sesuai tanggung jawab akun ini.
              </p>

              <form onSubmit={handleAddSubmit} className="relative flex flex-col gap-4">
                <div>
                  <label className={labelClass}>Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={addForm.nama}
                    onChange={(e) => setAddForm({ ...addForm, nama: e.target.value })}
                    className={inputClass}
                    placeholder="mis. Budi Santoso"
                  />
                </div>

                <div>
                  <label className={labelClass}>Username</label>
                  <input
                    type="text"
                    required
                    value={addForm.username}
                    onChange={(e) =>
                      setAddForm({ ...addForm, username: e.target.value })
                    }
                    className={inputClass}
                    placeholder="mis. budi.santoso"
                  />
                </div>

                <div>
                  <label className={labelClass}>Password</label>
                  <div className="relative">
                    <input
                      type={showAddPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={addForm.password}
                      onChange={(e) =>
                        setAddForm({ ...addForm, password: e.target.value })
                      }
                      className={`${inputClass} pr-10`}
                      placeholder="Minimal 6 karakter"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAddPassword((v) => !v)}
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-text-muted transition-colors hover:text-text-primary"
                    >
                      {showAddPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Role</label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {(["teller", "co_teller", "admin", "superadmin"] as Role[]).map((role) => {
                      const RoleIcon = ROLE_ICON[role];
                      const active = addForm.role === role;
                      return (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setAddForm({ ...addForm, role })}
                          className={`flex flex-col items-center gap-1.5 rounded-xl border py-3 text-xs font-semibold transition-colors ${
                            active
                              ? "border-transparent text-white"
                              : "border-border bg-background-hover text-text-secondary hover:text-text-primary"
                          }`}
                          style={active ? { backgroundColor: ROLE_COLOR[role] } : undefined}
                        >
                          <RoleIcon size={16} />
                          {ROLE_LABEL[role]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-end gap-2 border-t border-border pt-4">
                  <button
                    type="button"
                    onClick={closeAdd}
                    className="rounded-xl px-4 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:bg-background-hover"
                  >
                    Batal
                  </button>
                  <motion.button
                    type="submit"
                    disabled={addSaving}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:opacity-60"
                  >
                    {addSaving && (
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    )}
                    Simpan Akun
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editing && editForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeEdit}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="scrollbar-hide relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-background-card p-6 shadow-soft"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle,rgba(17,32,240,0.9)_1px,transparent_1px)] bg-size-[18px_18px]"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl"
              />

              <div className="relative mb-4 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-white"
                    style={{ backgroundColor: ROLE_COLOR[editing.role] }}
                  >
                    {editing.nama.slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-text-primary">
                      Edit Akun
                    </h2>
                    <p className="truncate text-xs text-text-secondary">
                      {editing.nama}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeEdit}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-background-hover hover:text-text-primary"
                >
                  <X size={16} />
                </button>
              </div>

              {isEditingSelf && (
                <p className="relative mb-4 flex items-center gap-1.5 rounded-xl bg-warning/10 px-3 py-2 text-xs text-warning">
                  <AlertTriangle size={13} className="shrink-0" />
                  Ini akun Anda sendiri — role dan status tidak dapat diubah untuk mencegah terkunci dari sistem.
                </p>
              )}

              <form onSubmit={handleUpdate} className="relative flex flex-col gap-4">
                <div>
                  <label className={labelClass}>Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={editForm.nama}
                    onChange={(e) =>
                      setEditForm({ ...editForm, nama: e.target.value })
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Username</label>
                  <input
                    type="text"
                    required
                    value={editForm.username}
                    onChange={(e) =>
                      setEditForm({ ...editForm, username: e.target.value })
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    <span className="flex items-center gap-1.5">
                      <KeyRound size={12} className="text-primary" />
                      Password Baru (opsional)
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type={showEditPassword ? "text" : "password"}
                      minLength={6}
                      value={editForm.password}
                      onChange={(e) =>
                        setEditForm({ ...editForm, password: e.target.value })
                      }
                      className={`${inputClass} pr-10`}
                      placeholder="Kosongkan jika tidak ingin mengubah"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditPassword((v) => !v)}
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-text-muted transition-colors hover:text-text-primary"
                    >
                      {showEditPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Role</label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {(["teller", "co_teller", "admin", "superadmin"] as Role[]).map((role) => {
                      const RoleIcon = ROLE_ICON[role];
                      const active = editForm.role === role;
                      return (
                        <button
                          key={role}
                          type="button"
                          disabled={isEditingSelf}
                          onClick={() => setEditForm({ ...editForm, role })}
                          className={`flex flex-col items-center gap-1.5 rounded-xl border py-3 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                            active
                              ? "border-transparent text-white"
                              : "border-border bg-background-hover text-text-secondary hover:text-text-primary"
                          }`}
                          style={active ? { backgroundColor: ROLE_COLOR[role] } : undefined}
                        >
                          <RoleIcon size={16} />
                          {ROLE_LABEL[role]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Status Akun</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={isEditingSelf}
                      onClick={() => setEditForm({ ...editForm, isActive: true })}
                      className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                        editForm.isActive
                          ? "border-transparent bg-success text-white"
                          : "border-border bg-background-hover text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      <CheckCircle2 size={14} />
                      Aktif
                    </button>
                    <button
                      type="button"
                      disabled={isEditingSelf}
                      onClick={() => setEditForm({ ...editForm, isActive: false })}
                      className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                        !editForm.isActive
                          ? "border-transparent bg-text-muted text-white"
                          : "border-border bg-background-hover text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      <Lock size={14} />
                      Nonaktif
                    </button>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-end gap-2 border-t border-border pt-4">
                  <button
                    type="button"
                    onClick={closeEdit}
                    className="rounded-xl px-4 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:bg-background-hover"
                  >
                    Batal
                  </button>
                  <motion.button
                    type="submit"
                    disabled={saving}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:opacity-60"
                  >
                    {saving && (
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    )}
                    Simpan Perubahan
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
