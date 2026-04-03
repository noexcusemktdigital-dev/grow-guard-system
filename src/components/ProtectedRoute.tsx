// @ts-nocheck
import { useAuth } from "@/contexts/AuthContext";
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
  if (pathname.startsWith("/cliente")) return "/app";
  return "/acessofranquia";
}

/**
 * Detect if the current pathname belongs to a different portal than the
 * storageKey that was calculated at module-load time. If so, a full page
 * reload is needed so supabase.ts recalculates the storageKey.
 */
function detectPortalMismatch(): boolean {
  const path = window.location.pathname;
  const isSaasRoute = path.startsWith("/cliente") || path.startsWith("/app");
  const isFranchiseRoute = path.startsWith("/franqueadora") || path.startsWith("/franqueado") || path.startsWith("/acessofranquia");

  // Only check when we can clearly identify the portal from the route
  if (!isSaasRoute && !isFranchiseRoute) return false;

  const expectedKey = isSaasRoute ? "noe-saas-auth" : "noe-franchise-auth";

  // Check which key the supabase client is actually using by looking at localStorage
  const saasToken = localStorage.getItem("noe-saas-auth");
  const franchiseToken = localStorage.getItem("noe-franchise-auth");

  // If there's a token in the OTHER portal's key but not in the expected one,
  // it means the client was initialized with the wrong storageKey
  if (expectedKey === "noe-saas-auth" && !saasToken && franchiseToken) return true;
  if (expectedKey === "noe-franchise-auth" && !franchiseToken && saasToken) return true;

  return false;
}

const ROLE_TIMEOUT_MS = 6000;

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();
  const location = useLocation();
  const [timedOut, setTimedOut] = useState(false);
  const portalCheckDone = useRef(false);

  // Portal mismatch guard — run once per mount
  useEffect(() => {
    if (portalCheckDone.current) return;
    portalCheckDone.current = true;

    if (detectPortalMismatch()) {
      // Force full reload to recalculate storageKey in supabase.ts
      window.location.reload();
    }
  }, []);

  // Timeout: if user exists but role never resolves, stop waiting
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

  // Waiting for role to resolve
  if (allowedRoles && allowedRoles.length > 0 && !role) {
    if (timedOut) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4 p-8">
          <p className="text-foreground text-center max-w-md">
            Não foi possível carregar suas permissões. Tente sair e entrar novamente.
          </p>
          <button
            onClick={() => window.location.href = getLoginPath(location.pathname)}
            className="px-4 py-2 rounded bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Voltar ao login
          </button>
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
