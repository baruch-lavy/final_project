import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";
import { useSocketStore } from "../stores/socketStore";
import { useUIStore } from "../stores/uiStore";

const ASSETS_KEY = ["assets"];

const fetchAssets = async () => {
  const { data } = await api.get("/assets");
  return data;
};

export const useAssets = () => {
  const queryClient = useQueryClient();
  const socket = useSocketStore((s) => s.socket);
  const addNotification = useUIStore((s) => s.addNotification);

  const query = useQuery({
    queryKey: ASSETS_KEY,
    queryFn: fetchAssets,
    staleTime: 10_000,
    refetchInterval: 5_000, // poll for asset location changes from simulation
  });

  useEffect(() => {
    if (!socket) return;

    const onCreated = (asset) => {
      queryClient.setQueryData(ASSETS_KEY, (old = []) => [...old, asset]);
      addNotification({ type: "success", title: "Asset Added", message: `"${asset.name}" added to theater` });
    };
    const onUpdated = (asset) => {
      queryClient.setQueryData(ASSETS_KEY, (old = []) =>
        old.map((a) => (a._id === asset._id ? asset : a)),
      );
    };
    const onLocationUpdated = (update) => {
      queryClient.setQueryData(ASSETS_KEY, (old = []) =>
        old.map((a) =>
          a._id === update._id ? { ...a, location: update.location } : a,
        ),
      );
    };
    const onDeleted = ({ _id }) => {
      queryClient.setQueryData(ASSETS_KEY, (old = []) =>
        old.filter((a) => a._id !== _id),
      );
    };

    socket.on("asset:created", onCreated);
    socket.on("asset:updated", onUpdated);
    socket.on("asset:locationUpdated", onLocationUpdated);
    socket.on("asset:deleted", onDeleted);

    return () => {
      socket.off("asset:created", onCreated);
      socket.off("asset:updated", onUpdated);
      socket.off("asset:locationUpdated", onLocationUpdated);
      socket.off("asset:deleted", onDeleted);
    };
  }, [socket, queryClient, addNotification]);

  return {
    assets: query.data ?? [],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

export const useCreateAsset = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post("/assets", payload).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ASSETS_KEY }),
  });
};

export const useUpdateAsset = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }) =>
      api.put(`/assets/${id}`, payload).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ASSETS_KEY }),
  });
};

export const useDeleteAsset = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/assets/${id}`).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ASSETS_KEY }),
  });
};
