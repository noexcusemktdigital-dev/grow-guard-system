import { useEffect } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { GlobalSearch } from "@/components/GlobalSearch";
import { NotificationBell } from "@/components/NotificationBell";
import { UserMenu } from "@/components/UserMenu";
import { SupportButton } from "@/components/SupportButton";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect based on role on initial load
  useEffect(() => {
    if (role && location.pathname === "/") {
      if (role === "super_admin" || role === "admin") {
        navigate("/franqueadora/inicio", { replace: true });
      } else if (role === "franqueado") {
        navigate("/franqueado/inicio", { replace: true });
      } else {
        navigate("/cliente/inicio", { replace: true });
      }
    }
  }, [role, location.pathname, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-card/80 backdrop-blur-xl">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex-1 flex items-center">
            <GlobalSearch />
          </div>
          <div className="flex-1 flex items-center justify-end gap-1.5" data-tour="header-actions">
            <SupportButton />
            <NotificationBell />
            <UserMenu />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <Outlet />
    </div>
  );
};

export default Index;
