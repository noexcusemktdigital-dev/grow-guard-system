// @ts-nocheck
import { useAuth } from "@/contexts/AuthContext";

/** Routes completely blocked for cliente_user */
const ADMIN_ONLY_ROUTES = [
  "/cliente/disparos",
  "/cliente/dashboard",
  "/cliente/trafego-pago",
  "/cliente/integracoes",
  "/cliente/plano-creditos",
];

/** Routes that cliente_user can view but not edit */
const READ_ONLY_ROUTES_FOR_USER = [
  "/cliente/gps-negocio",
];

export type RouteAccess = "full" | "read_only" | "blocked";

export function useRoleAccess() {
  const { role } = useAuth();
  const isAdmin = role === "cliente_admin" || role === "super_admin" || role === "admin";

  const getRouteAccess = (path: string): RouteAccess => {
    if (isAdmin) return "full";
    if (ADMIN_ONLY_ROUTES.some((r) => path.startsWith(r))) return "blocked";
    if (READ_ONLY_ROUTES_FOR_USER.some((r) => path.startsWith(r))) return "read_only";
    return "full";
  };

  return {
    isAdmin,
    getRouteAccess,
    canAccessRoute: (path: string) => getRouteAccess(path) !== "blocked",
    canCreate: (module: string) => {
      if (isAdmin) return true;
      // cliente_user can't create agents, scripts, or dispatches
      const restrictedModules = ["agents", "scripts", "dispatches", "crm-config"];
      return !restrictedModules.includes(module);
    },
    canManageSettings: isAdmin,
    canManageUsers: isAdmin,
    canViewFinancials: isAdmin,
    isReadOnly: (path: string) => getRouteAccess(path) === "read_only",
  };
}
