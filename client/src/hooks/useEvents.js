import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";
import { useSocketStore } from "../stores/socketStore";

const EVENTS_KEY = ["events"];

export const useEvents = (limit = 20) => {
  const queryClient = useQueryClient();
  const socket = useSocketStore((s) => s.socket);

  const query = useQuery({
    queryKey: [...EVENTS_KEY, limit],
    queryFn: async () => {
      const { data } = await api.get(`/events?limit=${limit}`);
      return data;
    },
    staleTime: 15_000,
  });

  useEffect(() => {
    if (!socket) return;

    const onNewEvent = (event) => {
      queryClient.setQueryData([...EVENTS_KEY, limit], (old = []) =>
        [event, ...old].slice(0, limit),
      );
    };

    socket.on("event:new", onNewEvent);
    return () => socket.off("event:new", onNewEvent);
  }, [socket, queryClient, limit]);

  return {
    events: query.data ?? [],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const { data } = await api.get("/events/dashboard");
      return data;
    },
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
};
