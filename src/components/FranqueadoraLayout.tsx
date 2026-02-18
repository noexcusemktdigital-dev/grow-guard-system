import { Outlet } from "react-router-dom";
import { FranqueadoraSidebar } from "./FranqueadoraSidebar";

export function FranqueadoraLayout() {
  return (
    <div className="flex min-h-screen w-full">
      <FranqueadoraSidebar />
      <main className="flex-1 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
