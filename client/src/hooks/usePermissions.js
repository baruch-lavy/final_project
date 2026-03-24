import { use } from "react";
import AuthContext from "../stores/AuthContext";
import { useAuthStore } from "../stores/authStore";

const ROLE_PERMISSIONS = {
  Commander: {
    canCreateMission: true,
    canEditMission: true,
    canDeleteMission: true,
    canCreateAsset: true,
    canEditAsset: true,
    canDeleteAsset: true,
    canSendChat: true,
    canBroadcastAlert: true,
    canManagePersonnel: true,
    canDrawOnMap: true,
  },
  Operator: {
    canCreateMission: true,
    canEditMission: true,
    canDeleteMission: false,
    canCreateAsset: true,
    canEditAsset: true,
    canDeleteAsset: false,
    canSendChat: true,
    canBroadcastAlert: false,
    canManagePersonnel: false,
    canDrawOnMap: true,
  },
  Analyst: {
    canCreateMission: false,
    canEditMission: false,
    canDeleteMission: false,
    canCreateAsset: false,
    canEditAsset: false,
    canDeleteAsset: false,
    canSendChat: true,
    canBroadcastAlert: false,
    canManagePersonnel: false,
    canDrawOnMap: false,
  },
};

const NO_PERMISSIONS = Object.fromEntries(
  Object.keys(ROLE_PERMISSIONS.Commander).map((k) => [k, false]),
);

export const usePermissions = () => {
  // React 19 use() – read AuthContext directly (works in conditionals too)
  const auth = use(AuthContext);
  const role = auth?.user?.role ?? useAuthStore.getState().user?.role;
  return ROLE_PERMISSIONS[role] || NO_PERMISSIONS;
};
