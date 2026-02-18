import { useState } from "react";
import { TopSwitch } from "@/components/TopSwitch";
import { Outlet, useNavigate, useLocation } from "react-router-dom";

const Index = () => {
  const [level, setLevel] = useState("FRANQUEADORA");
  const navigate = useNavigate();
  const location = useLocation();

  const handleLevelChange = (newLevel: string) => {
    setLevel(newLevel);
    if (newLevel === "FRANQUEADORA") {
      if (!location.pathname.startsWith("/franqueadora")) {
        navigate("/franqueadora/financeiro");
      }
    }
    // Other levels are placeholders
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar with switch */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex items-center justify-center py-3">
          <TopSwitch active={level} onChange={handleLevelChange} />
        </div>
      </header>

      {level === "FRANQUEADORA" ? (
        <Outlet />
      ) : (
        <div className="flex items-center justify-center h-[calc(100vh-60px)]">
          <div className="text-center">
            <h2 className="text-xl font-bold text-foreground mb-2">{level}</h2>
            <p className="text-muted-foreground">Em desenvolvimento</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
