import { create } from "zustand";

export type NotifyEntry = { status: "success" | "error"; message: string };

interface NotifyState {
  current: NotifyEntry | null;
  show: (entry: NotifyEntry) => void;
  close: () => void;
}

export const useNotifyStore = create<NotifyState>((set) => ({
  current: null,
  show: (entry) => set({ current: entry }),
  close: () => set({ current: null }),
}));

export const notify = {
  success: (message: string) =>
    useNotifyStore.getState().show({ status: "success", message }),
  error: (message: string) =>
    useNotifyStore.getState().show({ status: "error", message }),
};
