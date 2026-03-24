import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";
import { useSocketStore } from "../stores/socketStore";

const NOTIF_KEY = ["notifications"];

export const useNotifications = () => {
  const queryClient = useQueryClient();
  const socket = useSocketStore((s) => s.socket);

  const query = useQuery({
    queryKey: NOTIF_KEY,
    queryFn: async () => {
      const { data } = await api.get("/notifications");
      return data;
    },
    staleTime: 15_000,
  });

  const countQuery = useQuery({
    queryKey: ["notifications-unread"],
    queryFn: async () => {
      const { data } = await api.get("/notifications/unread-count");
      return data.count;
    },
    staleTime: 10_000,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (!socket) return;

    const onNew = () => {
      queryClient.invalidateQueries({ queryKey: NOTIF_KEY });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
    };

    socket.on("notification:new", onNew);
    return () => socket.off("notification:new", onNew);
  }, [socket, queryClient]);

  return {
    notifications: query.data ?? [],
    unreadCount: countQuery.data ?? 0,
    loading: query.isLoading,
  };
};

export const useMarkRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIF_KEY });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });
};

export const useMarkAllRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.patch("/notifications/read-all"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIF_KEY });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });
};
