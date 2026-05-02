import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useRoleAccess } from "@/hooks/useRoleAccess";

/**
 * Wraps cliente routes to enforce useRoleAccess restrictions centrally.
 * Blocked routes redirect to /cliente/inicio.
 */
export function RoleAccessGuard({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { canAccessRoute } = useRoleAccess();

  if (!canAccessRoute(location.pathname)) {
    return <Navigate to="/cliente/inicio" replace />;
  }

  return <>{children}</>;
}
