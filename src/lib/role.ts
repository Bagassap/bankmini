import type { User } from "@/lib/types";

export function isTellerRole(user: User | null): boolean {
  return user?.role === "teller";
}

export function isAdminRole(user: User | null): boolean {
  return user?.role === "admin" || user?.role === "superadmin";
}
