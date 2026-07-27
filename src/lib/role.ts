import type { User } from "@/lib/types";

/** Nasabah teller pelaksana (setor/tarik, kelola nasabah) — pemilik semua halaman non-/admin saat ini. */
export function isTellerRole(user: User | null): boolean {
  return user?.role === "teller";
}

/** Admin & superadmin sama-sama diarahkan ke area /admin untuk sementara —
 * superadmin belum punya pengalaman tersendiri (menyusul di fase berikutnya). */
export function isAdminRole(user: User | null): boolean {
  return user?.role === "admin" || user?.role === "superadmin";
}
