import { useEffect, useState, useCallback, useRef } from "react";
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

    const onReacted = ({ messageId, reactions }) => {
      queryClient.setQueryData(["messages", channel], (old = []) =>
        old.map((m) => (m._id === messageId ? { ...m, reactions } : m)),
      );
    };

    socket.on("message:new", onNew);
    socket.on("message:reacted", onReacted);
    return () => {
      socket.off("message:new", onNew);
      socket.off("message:reacted", onReacted);
    };
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

export const useTypingIndicator = (channel) => {
  const socket = useSocketStore((s) => s.socket);
  const [typingUsers, setTypingUsers] = useState([]);
  const timers = useRef({});

  useEffect(() => {
    if (!socket) return;

    const onTyping = ({ userId, username, channel: ch, isTyping }) => {
      if (ch !== channel) return;
      if (isTyping) {
        setTypingUsers((prev) => {
          if (prev.some((u) => u.userId === userId)) return prev;
          return [...prev, { userId, username }];
        });
        clearTimeout(timers.current[userId]);
        timers.current[userId] = setTimeout(() => {
          setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
        }, 3000);
      } else {
        clearTimeout(timers.current[userId]);
        setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
      }
    };

    socket.on("typing:update", onTyping);
    return () => {
      socket.off("typing:update", onTyping);
      Object.values(timers.current).forEach(clearTimeout);
    };
  }, [socket, channel]);

  const emitTyping = useCallback(
    (isTyping) => {
      if (!socket) return;
      socket.emit(isTyping ? "typing:start" : "typing:stop", { channel });
    },
    [socket, channel],
  );

  return { typingUsers, emitTyping };
};

export const useReactToMessage = () => {
  const socket = useSocketStore((s) => s.socket);
  return useCallback(
    (messageId, emoji) => {
      if (!socket) return;
      socket.emit("message:react", { messageId, emoji });
    },
    [socket],
  );
};
