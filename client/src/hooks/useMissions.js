import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";
import { useSocketStore } from "../stores/socketStore";
import { useUIStore } from "../stores/uiStore";

const MISSIONS_KEY = ["missions"];

const fetchMissions = async () => {
  const { data } = await api.get("/missions");
  return data;
};

export const useMissions = () => {
  const queryClient = useQueryClient();
  const socket = useSocketStore((s) => s.socket);
  const addNotification = useUIStore((s) => s.addNotification);

  const query = useQuery({
    queryKey: MISSIONS_KEY,
    queryFn: fetchMissions,
    staleTime: 30_000,
  });

  // Real-time socket updates → optimistic cache updates
  useEffect(() => {
    if (!socket) return;

    const onCreated = (mission) => {
      queryClient.setQueryData(MISSIONS_KEY, (old = []) => [mission, ...old]);
      addNotification({ type: "success", title: "Mission Created", message: `"${mission.title}" created` });
    };
    const onUpdated = (mission) => {
      queryClient.setQueryData(MISSIONS_KEY, (old = []) =>
        old.map((m) => (m._id === mission._id ? mission : m)),
      );
    };
    const onStatusChanged = (mission) => {
      queryClient.setQueryData(MISSIONS_KEY, (old = []) =>
        old.map((m) => (m._id === mission._id ? mission : m)),
      );
      addNotification({ type: "info", title: "Mission Updated", message: `"${mission.title}" → ${mission.status}` });
    };
    const onDeleted = ({ _id }) => {
      queryClient.setQueryData(MISSIONS_KEY, (old = []) =>
        old.filter((m) => m._id !== _id),
      );
    };

    socket.on("mission:created", onCreated);
    socket.on("mission:updated", onUpdated);
    socket.on("mission:statusChanged", onStatusChanged);
    socket.on("mission:deleted", onDeleted);

    return () => {
      socket.off("mission:created", onCreated);
      socket.off("mission:updated", onUpdated);
      socket.off("mission:statusChanged", onStatusChanged);
      socket.off("mission:deleted", onDeleted);
    };
  }, [socket, queryClient]);

  return {
    missions: query.data ?? [],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

export const useMission = (id) => {
  return useQuery({
    queryKey: ["mission", id],
    queryFn: async () => {
      const { data } = await api.get(`/missions/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateMission = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post("/missions", payload).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MISSIONS_KEY }),
  });
};

export const useUpdateMission = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }) =>
      api.put(`/missions/${id}`, payload).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MISSIONS_KEY }),
  });
};

export const useUpdateMissionStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) =>
      api.put(`/missions/${id}/status`, { status }).then((r) => r.data),
    onSuccess: (data) => {
      queryClient.setQueryData(MISSIONS_KEY, (old = []) =>
        old.map((m) => (m._id === data._id ? data : m)),
      );
    },
  });
};

export const useDeleteMission = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/missions/${id}`).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MISSIONS_KEY }),
  });
};

export const useAddMissionUpdate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, message }) =>
      api.post(`/missions/${id}/updates`, { message }).then((r) => r.data),
    onSuccess: (data) => {
      queryClient.setQueryData(["mission", data._id], data);
    },
  });
};
