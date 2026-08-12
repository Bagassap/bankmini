import type { Role, User } from "@/lib/types";

export function isTellerRole(user: User | null): boolean {
  return user?.role === "teller";
}

export function isCoTellerRole(user: User | null): boolean {
  return user?.role === "co_teller";
}

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

// Role/id staff yang sebenarnya berlaku untuk pengguna ini, baik login
// langsung sebagai staff maupun sebagai nasabah dual-role (guru/wali
// kelas yang juga staff).
export function effectiveStaffRole(user: User | null): Role | null {
  if (!user) return null;
  return user.accountType === "staff" ? (user.role as Role) : linkedStaffRole(user);
}

export function effectiveStaffId(user: User | null): string | null {
  if (!user) return null;
  return user.accountType === "staff" ? user.id : (user.linkedStaff?.id ?? null);
}

// Ke mana pengguna yang sudah login diarahkan - dipakai halaman publik
// (splash "/" dan "/login") supaya sesi yang masih valid tidak pernah
// ditampilkan form login/splash lagi, langsung masuk ke area masing-masing.
export function resolveAuthedDestination(user: User): string {
  if (isNasabahRole(user)) {
    const staffRole = linkedStaffRole(user);
    if (staffRole) {
      return isTellerTierRoleValue(staffRole) ? "/dashboard" : "/admin/dashboard";
    }
    return "/portal/dashboard";
  }
  return isAdminRole(user) ? "/admin/dashboard" : "/dashboard";
}
