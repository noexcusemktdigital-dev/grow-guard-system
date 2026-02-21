import { Outlet, useLocation } from "react-router-dom";
import { FranqueadoraSidebar } from "./FranqueadoraSidebar";

export function FranqueadoraLayout() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen w-full">
      <FranqueadoraSidebar />
      <main className="flex-1 overflow-x-hidden">
        <div key={location.pathname} className="animate-slide-up p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
