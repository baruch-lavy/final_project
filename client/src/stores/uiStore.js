import { create } from 'zustand';

export const useUIStore = create((set) => ({
  chatOpen: false,
  toggleChat: () => set((s) => ({ chatOpen: !s.chatOpen })),
  setChatOpen: (open) => set({ chatOpen: open }),

  notifications: [],
  addNotification: (notification) =>
    set((s) => ({
      notifications: [
        { id: Date.now(), ...notification },
        ...s.notifications,
      ].slice(0, 50),
    })),
  clearNotification: (id) =>
    set((s) => ({
      notifications: s.notifications.filter((n) => n.id !== id),
    })),
}));
