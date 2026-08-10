"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  isAdminRole,
  isNasabahRole,
  isSuperadminRole,
  isTellerTierRole,
  isTellerTierRoleValue,
  isWaliKelasRole,
  linkedStaffRole,
} from "@/lib/role";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";
import { ForcePasswordChangeScreen } from "./ForcePasswordChangeScreen";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const hydrate = useAuthStore((state) => state.hydrate);
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const [mobileOpen, setMobileOpen] = useState(false);
  const collapsed = useUIStore((state) => state.sidebarCollapsed);
  const toggleCollapsed = useUIStore((state) => state.toggleSidebarCollapsed);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (!user) return;

    const isSuperadminOnlyRoute = pathname.startsWith("/admin/akun");

    if (isNasabahRole(user)) {
      const inPortal = pathname.startsWith("/portal");
      const staffRole = linkedStaffRole(user);

      if (staffRole) {
        const inStaffArea = isTellerTierRoleValue(staffRole)
          ? !pathname.startsWith("/portal") && !pathname.startsWith("/admin")
          : pathname.startsWith("/admin");

        if (!inPortal && !inStaffArea) {
          router.replace(
            isTellerTierRoleValue(staffRole) ? "/dashboard" : "/admin/dashboard",
          );
          return;
        }
        if (isSuperadminOnlyRoute && staffRole !== "superadmin") {
          router.replace("/admin/dashboard");
          return;
        }
        if (pathname.startsWith("/portal/kelas") && !isWaliKelasRole(user)) {
          router.replace("/portal/dashboard");
        }
        return;
      }

      if (!inPortal) {
        router.replace("/portal/dashboard");
      } else if (pathname.startsWith("/portal/kelas") && !isWaliKelasRole(user)) {
        router.replace("/portal/dashboard");
      }
      return;
    }

    const inAdminArea = pathname.startsWith("/admin");
    if (isAdminRole(user) && !inAdminArea) {
      router.replace("/admin/dashboard");
    } else if (isTellerTierRole(user) && (inAdminArea || pathname.startsWith("/portal"))) {
      router.replace("/dashboard");
    } else if (isSuperadminOnlyRoute && !isSuperadminRole(user)) {
      router.replace("/admin/dashboard");
    }
  }, [user, pathname, router]);

  if (status === "idle" || status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 size={28} className="animate-spin text-primary" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  if (isNasabahRole(user) && user?.mustChangePassword) {
    return <ForcePasswordChangeScreen />;
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
      />
      <div className="flex min-w-0 flex-1 flex-col transition-all duration-300 ease-in-out">
        <div className="isolate mx-auto flex w-full max-w-(--breakpoint-2xl) flex-1 flex-col overflow-hidden px-4 md:px-6 2xl:px-10">
          <Topbar onMenuClick={() => setMobileOpen(true)} />
          <main className="flex-1 overflow-y-auto py-4 md:py-6 2xl:py-10">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
