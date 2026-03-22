import { create } from "zustand";
import { connectSocket, disconnectSocket, getSocket } from "../services/socket";
import api from "../services/api";

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem("aegis_user") || "null"),
  token: localStorage.getItem("aegis_token"),
  loading: true,

  setLoading: (loading) => set({ loading }),

  login: async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("aegis_token", data.token);
    localStorage.setItem("aegis_user", JSON.stringify(data.user));
    set({ token: data.token, user: data.user });
    connectSocket(data.token);
    return data;
  },

  register: async (username, email, password, role) => {
    const { data } = await api.post("/auth/register", {
      username,
      email,
      password,
      role,
    });
    localStorage.setItem("aegis_token", data.token);
    localStorage.setItem("aegis_user", JSON.stringify(data.user));
    set({ token: data.token, user: data.user });
    connectSocket(data.token);
    return data;
  },

  logout: () => {
    localStorage.removeItem("aegis_token");
    localStorage.removeItem("aegis_user");
    disconnectSocket();
    set({ token: null, user: null });
  },

  verifyToken: async () => {
    const token = get().token;
    if (!token) {
      set({ loading: false });
      return;
    }
    try {
      const { data } = await api.get("/auth/me");
      localStorage.setItem("aegis_user", JSON.stringify(data));
      set({ user: data, loading: false });
      connectSocket(token);
    } catch {
      get().logout();
      set({ loading: false });
    }
  },
}));
