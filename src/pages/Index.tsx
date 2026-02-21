import { useState, useEffect } from "react";
import { TopSwitch } from "@/components/TopSwitch";
import { ThemeToggle } from "@/components/ThemeToggle";
import { GlobalSearch } from "@/components/GlobalSearch";
import { NotificationBell } from "@/components/NotificationBell";
import { UserMenu } from "@/components/UserMenu";
import { Outlet, useNavigate, useLocation } from "react-router-dom";

const Index = () => {
  const [level, setLevel] = useState("FRANQUEADORA");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.startsWith("/cliente")) {
      setLevel("CLIENTE FINAL");
    } else if (location.pathname.startsWith("/franqueado")) {
      setLevel("FRANQUEADO");
    } else if (location.pathname.startsWith("/franqueadora")) {
      setLevel("FRANQUEADORA");
    }
  }, [location.pathname]);

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

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-card/80 backdrop-blur-xl">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex-1 flex items-center">
            <GlobalSearch />
          </div>
          <div className="flex items-center justify-center">
            <TopSwitch active={level} onChange={handleLevelChange} />
          </div>
          <div className="flex-1 flex items-center justify-end gap-1.5">
            <NotificationBell />
            <UserMenu level={level} />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <Outlet />
    </div>
  );
};

export default Index;
