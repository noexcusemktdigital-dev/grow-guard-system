// @ts-nocheck
import { useAuth } from "@/contexts/AuthContext";
import { PORTAL_STORAGE_KEY } from "@/lib/supabase";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useEffect, useState, useRef } from "react";
...
function getExpectedPortalStorageKey(pathname: string): string | null {
  if (pathname.startsWith("/franqueadora") || pathname.startsWith("/franqueado") || pathname.startsWith("/acessofranquia")) {
    return "noe-franchise-auth";
  }

  if (pathname.startsWith("/cliente") || pathname === "/") {
    return "noe-saas-auth";
  }

  return null;
}

/**
 * Detect if the current pathname belongs to a different portal than the
 * storageKey used when the shared Supabase client was initialized.
 */
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
