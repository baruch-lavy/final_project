import { create } from "zustand";
import { getSocket } from "../services/socket";

export const useSocketStore = create((set, get) => ({
  socket: null,
  connected: false,

  initSocket: () => {
    const check = setInterval(() => {
      const s = getSocket();
      if (s) {
        set({ socket: s, connected: s.connected });
        s.on("connect", () => set({ connected: true }));
        s.on("disconnect", () => set({ connected: false }));
        clearInterval(check);
      }
    }, 100);

    // Return cleanup
    return () => clearInterval(check);
  },
}));
