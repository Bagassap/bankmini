import type { Role, User } from "@/lib/types";

export function isTellerRole(user: User | null): boolean {
  return user?.role === "teller";
}

export function isCoTellerRole(user: User | null): boolean {
  return user?.role === "co_teller";
}

// Any non-admin staff tier confined to the teller-style dashboard area
// (/dashboard, not /admin) - co_teller is teller minus Simpanan/Piutang, but
// shares the same area/route-guard behavior as a plain teller.
export function isTellerTierRole(user: User | null): boolean {
  return user?.role === "teller" || user?.role === "co_teller";
}

export function isTellerTierRoleValue(role: Role | null | undefined): boolean {
  return role === "teller" || role === "co_teller";
}

export function isAdminRole(user: User | null): boolean {
  return user?.role === "admin" || user?.role === "superadmin";
}

export function isSuperadminRole(user: User | null): boolean {
  return user?.role === "superadmin";
}

export function isNasabahRole(user: User | null): boolean {
  return user?.accountType === "nasabah";
}

export function isWaliKelasRole(user: User | null): boolean {
  return user?.accountType === "nasabah" && user?.role === "wali_kelas";
}

export function hasLinkedStaff(user: User | null): boolean {
  return !!user?.linkedStaff;
}

export function linkedStaffRole(user: User | null): Role | null {
  return user?.linkedStaff?.role ?? null;
}
