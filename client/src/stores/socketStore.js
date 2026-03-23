import { create } from "zustand";
import { getSocket } from "../services/socket";

export const useSocketStore = create((set) => ({
  socket: null,
  connected: false,

  initSocket: () => {
    const check = setInterval(() => {
      const s = getSocket();
      if (s) {
        set({ socket: s, connected: s.connected });
        s.on("connect", () => set({ connected: true }));
        s.on("disconnect", () => set({ connected: false }));

        // Listen for broadcast alerts
        s.on("alert:received", ({ message, from }) => {
          // Import dynamically to avoid circular deps
          import("./uiStore").then(({ useUIStore }) => {
            useUIStore.getState().addNotification({
              type: "alert",
              title: `⚠ ALERT from ${from}`,
              message,
              duration: 8000,
            });
          });
        });

        clearInterval(check);
      }
    }, 100);

    return () => clearInterval(check);
  },
}));
