"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isLoggedIn } from "@/lib/auth";
import { isAdminRole, isTellerRole } from "@/lib/role";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const hydrate = useAuthStore((state) => state.hydrate);
  const user = useAuthStore((state) => state.user);
  const [mobileOpen, setMobileOpen] = useState(false);
  // Bukan useState lokal — Layout ini dirender ulang oleh tiap page.tsx (bukan
  // file layout.tsx App Router), jadi useState di sini akan reset setiap
  // pindah halaman. State collapse disimpan di Zustand store agar bertahan.
  const collapsed = useUIStore((state) => state.sidebarCollapsed);
  const toggleCollapsed = useUIStore((state) => state.toggleSidebarCollapsed);

  useEffect(() => {
    hydrate();
    if (!isLoggedIn()) {
      router.replace("/login");
    }
  }, [hydrate, router]);

  useEffect(() => {
    if (user && user.accountType !== "staff") {
      router.replace("/portal");
    }
  }, [user, router]);

  // Pemisahan menu per role: Teller cuma boleh di luar /admin, Admin/Superadmin
  // cuma boleh di dalam /admin — supaya masing-masing tidak nyasar ke menu peran lain.
  useEffect(() => {
    if (!user || user.accountType !== "staff") return;
    const inAdminArea = pathname.startsWith("/admin");
    if (isAdminRole(user) && !inAdminArea) {
      router.replace("/admin/dashboard");
    } else if (isTellerRole(user) && inAdminArea) {
      router.replace("/dashboard");
    }
  }, [user, pathname, router]);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
      />
      <div className="flex min-w-0 flex-1 flex-col transition-all duration-300 ease-in-out">
        {/* Satu wrapper padding horizontal untuk Topbar & konten, supaya keduanya
            SELALU sejajar di semua breakpoint tanpa perlu disamakan manual. */}
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
