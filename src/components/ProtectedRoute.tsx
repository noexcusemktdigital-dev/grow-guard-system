import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

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

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/acessofranquia" replace />;
  }

  // If roles are specified, check access
  if (allowedRoles && allowedRoles.length > 0 && role) {
    if (!allowedRoles.includes(role)) {
      return <Navigate to={getRoleRedirect(role)} replace />;
    }
  }

  return <>{children}</>;
}
