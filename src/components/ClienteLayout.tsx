import { Outlet, useLocation } from "react-router-dom";
import { ClienteSidebar } from "./ClienteSidebar";
import { FeatureGateProvider } from "@/contexts/FeatureGateContext";
import { FeatureGateOverlay } from "./FeatureGateOverlay";

export function ClienteLayout() {
  const location = useLocation();

  return (
    <FeatureGateProvider>
      <div className="flex min-h-screen w-full">
        <ClienteSidebar />
        <main className="flex-1 overflow-x-hidden relative">
          <div key={location.pathname} className="page-enter p-6 lg:p-8">
            <Outlet />
          </div>
          <FeatureGateOverlay />
        </main>
      </div>
    </FeatureGateProvider>
  );
}
