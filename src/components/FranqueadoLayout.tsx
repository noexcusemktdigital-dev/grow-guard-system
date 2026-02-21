import { Outlet, useLocation } from "react-router-dom";
import { FranqueadoSidebar } from "./FranqueadoSidebar";

export function FranqueadoLayout() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen w-full">
      <FranqueadoSidebar />
      <main className="flex-1 overflow-x-hidden">
        <div key={location.pathname} className="animate-slide-up p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
