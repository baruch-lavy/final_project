import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";
import { useSocketStore } from "../stores/socketStore";

export const useMessages = (channel = "general") => {
  const queryClient = useQueryClient();
  const socket = useSocketStore((s) => s.socket);

  const query = useQuery({
    queryKey: ["messages", channel],
    queryFn: async () => {
      const { data } = await api.get(`/messages/${channel}`);
      return data;
    },
    enabled: !!channel,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!socket) return;

    const onNew = (message) => {
      if (message.channel === channel) {
        queryClient.setQueryData(["messages", channel], (old = []) => [
          ...old,
          message,
        ]);
      }
    };

    socket.on("message:new", onNew);
    return () => socket.off("message:new", onNew);
  }, [socket, channel, queryClient]);

  return {
    messages: query.data ?? [],
    loading: query.isLoading,
  };
};

export const useSendMessage = () => {
  return useMutation({
    mutationFn: (payload) => api.post("/messages", payload).then((r) => r.data),
  });
};
