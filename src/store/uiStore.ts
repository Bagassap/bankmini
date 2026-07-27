import { create } from "zustand";

interface UIState {
  sidebarCollapsed: boolean;
  toggleSidebarCollapsed: () => void;
}

// Disimpan di sini (bukan useState di Layout.tsx) karena Layout.tsx dirender
// ulang oleh setiap page.tsx (bukan file layout.tsx App Router), sehingga
// instance-nya ikut unmount/remount setiap kali pindah halaman — useState
// lokal akan reset ke default setiap navigasi. Zustand store hidup di luar
// siklus mount/unmount komponen sehingga state collapse bertahan antar halaman.
export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebarCollapsed: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}));
