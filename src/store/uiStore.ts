import { create } from "zustand";

interface UIState {
  // Sidebar
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;

  // Toast notifications are handled by react-hot-toast
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarCollapsed: false,
  toggleSidebar: () =>
    set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
}));
