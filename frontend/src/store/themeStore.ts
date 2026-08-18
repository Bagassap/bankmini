import { create } from "zustand";

export type Theme = "light" | "dark";

const THEME_KEY = "bankmini_theme";

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

function persistTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // localStorage tidak tersedia (mis. mode privat ketat) - abaikan.
  }
}

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: "light",
  setTheme: (theme) => {
    applyTheme(theme);
    persistTheme(theme);
    set({ theme });
  },
  toggleTheme: () => {
    const next = get().theme === "dark" ? "light" : "dark";
    get().setTheme(next);
  },
}));

// Skrip inline di RootLayout sudah menerapkan class "dark" ke <html> sebelum
// hydrasi (mencegah flash tema terang). Ini hanya menyinkronkan state store
// dengan class yang sudah ada di DOM begitu komponen client pertama mount.
export function syncThemeFromDom() {
  const isDark = document.documentElement.classList.contains("dark");
  useThemeStore.setState({ theme: isDark ? "dark" : "light" });
}
