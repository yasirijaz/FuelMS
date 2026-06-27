import { create } from 'zustand'

type AppShellState = {
  isSidebarCollapsed: boolean
  toggleSidebar: () => void
}

export const useAppShellStore = create<AppShellState>((set) => ({
  isSidebarCollapsed: false,
  toggleSidebar: () =>
    set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
}))
