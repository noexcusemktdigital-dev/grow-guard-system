import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { PORTAL_STORAGE_KEY } from "@/lib/supabase";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useEffect, useState, useRef } from "react";

type AppRole = "super_admin" | "admin" | "franqueado" | "cliente_admin" | "cliente_user";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
}

function getRoleRedirect(role: AppRole | null): string {
  if (!role) return "/acessofranquia";
  if (role === "super_admin" || role === "admin") return "/franqueadora/inicio";
  if (role === "franqueado") return "/franqueado/inicio";
  return "/cliente/inicio";
}

function getLoginPath(pathname: string): string {
  if (pathname.startsWith("/cliente")) return "/";
  return "/acessofranquia";
}

function getExpectedPortalStorageKey(pathname: string): string | null {
  if (pathname.startsWith("/franqueadora") || pathname.startsWith("/franqueado") || pathname.startsWith("/acessofranquia")) {
    return "noe-franchise-auth";
  }

  if (pathname.startsWith("/cliente") || pathname === "/") {
    return "noe-saas-auth";
  }

  return null;
}

function detectPortalMismatch(): boolean {
  if (typeof window === "undefined") return false;

  const expectedKey = getExpectedPortalStorageKey(window.location.pathname);
  if (!expectedKey) return false;

  return PORTAL_STORAGE_KEY !== expectedKey;
}

const ROLE_TIMEOUT_MS = 6000;

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();
  const location = useLocation();
  const [timedOut, setTimedOut] = useState(false);
  const portalCheckDone = useRef(false);

  useEffect(() => {
    if (portalCheckDone.current) return;
    portalCheckDone.current = true;

    if (detectPortalMismatch()) {
      window.location.reload();
    }
  }, []);

  useEffect(() => {
    if (!user || role || loading) {
      setTimedOut(false);
      return;
    }
    const timer = setTimeout(() => setTimedOut(true), ROLE_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [user, role, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={getLoginPath(location.pathname)} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !role) {
    // Try cached role as a soft fallback when DB is slow — keeps the user inside
    // the portal that matches the cache instead of dumping them on a spinner.
    let cachedRole: AppRole | null = null;
    try {
      cachedRole = (localStorage.getItem("noe-cached-role") as AppRole) || null;
    } catch {/* ignore */}

    if (cachedRole && allowedRoles.includes(cachedRole)) {
      return <>{children}</>;
    }

    if (timedOut) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4 p-8">
          <p className="text-foreground text-center max-w-md">
            Não foi possível carregar suas permissões agora. O serviço pode estar temporariamente lento.
            Aguarde alguns segundos e recarregue, ou tente sair e entrar novamente.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Recarregar
            </button>
            <button
              onClick={() => window.location.href = getLoginPath(location.pathname)}
              className="px-4 py-2 rounded border border-border text-foreground hover:bg-muted transition-colors"
            >
              Voltar ao login
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (allowedRoles && allowedRoles.length > 0 && role && !allowedRoles.includes(role)) {
    return <Navigate to={getRoleRedirect(role)} replace />;
  }

  return <>{children}</>;
}
