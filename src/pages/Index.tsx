import { useState, useEffect } from "react";
import { TopSwitch } from "@/components/TopSwitch";
import { ThemeToggle } from "@/components/ThemeToggle";
import { GlobalSearch } from "@/components/GlobalSearch";
import { NotificationBell } from "@/components/NotificationBell";
import { UserMenu } from "@/components/UserMenu";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine level from path
  const getLevel = () => {
    if (location.pathname.startsWith("/cliente")) return "CLIENTE FINAL";
    if (location.pathname.startsWith("/franqueado")) return "FRANQUEADO";
    return "FRANQUEADORA";
  };

  const [level, setLevel] = useState(getLevel());

  useEffect(() => {
    setLevel(getLevel());
  }, [location.pathname]);

  // Redirect based on role on initial load
  useEffect(() => {
    if (role && location.pathname === "/") {
      if (role === "super_admin" || role === "admin") {
        navigate("/franqueadora/dashboard", { replace: true });
      } else if (role === "franqueado") {
        navigate("/franqueado/dashboard", { replace: true });
      } else {
        navigate("/cliente/inicio", { replace: true });
      }
    }
  }, [role, location.pathname, navigate]);

  const handleLevelChange = (newLevel: string) => {
    setLevel(newLevel);
    if (newLevel === "FRANQUEADORA") {
      if (!location.pathname.startsWith("/franqueadora")) navigate("/franqueadora/dashboard");
    } else if (newLevel === "FRANQUEADO") {
      if (!location.pathname.startsWith("/franqueado")) navigate("/franqueado/dashboard");
    } else if (newLevel === "CLIENTE FINAL") {
      if (!location.pathname.startsWith("/cliente")) navigate("/cliente/inicio");
    }
  };

  // Only super_admins can switch levels
  const showSwitch = role === "super_admin";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-card/80 backdrop-blur-xl">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex-1 flex items-center">
            <GlobalSearch />
          </div>
          {showSwitch && (
            <div className="flex items-center justify-center">
              <TopSwitch active={level} onChange={handleLevelChange} />
            </div>
          )}
          <div className="flex-1 flex items-center justify-end gap-1.5">
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
