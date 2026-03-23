import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";
import { useSocketStore } from "../stores/socketStore";

const PERSONNEL_KEY = ["personnel"];

export const usePersonnel = () => {
  const queryClient = useQueryClient();
  const socket = useSocketStore((s) => s.socket);

  const query = useQuery({
    queryKey: PERSONNEL_KEY,
    queryFn: async () => {
      const { data } = await api.get("/auth/users");
      return data;
    },
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!socket) return;

    const onOnline = ({ userId }) => {
      queryClient.setQueryData(PERSONNEL_KEY, (old = []) =>
        old.map((u) => (u._id === userId ? { ...u, status: "online" } : u))
      );
    };
    const onOffline = ({ userId }) => {
      queryClient.setQueryData(PERSONNEL_KEY, (old = []) =>
        old.map((u) => (u._id === userId ? { ...u, status: "offline" } : u))
      );
    };

    socket.on("user:online", onOnline);
    socket.on("user:offline", onOffline);

    return () => {
      socket.off("user:online", onOnline);
      socket.off("user:offline", onOffline);
    };
  }, [socket, queryClient]);

  return {
    personnel: query.data ?? [],
    loading: query.isLoading,
  };
};
