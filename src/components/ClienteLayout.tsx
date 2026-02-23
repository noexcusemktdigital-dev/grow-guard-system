import { Outlet, useLocation } from "react-router-dom";
import { ClienteSidebar } from "./ClienteSidebar";
import { FeatureGateProvider } from "@/contexts/FeatureGateContext";
import { FeatureGateOverlay } from "./FeatureGateOverlay";
import { CreditAlertBanner } from "./cliente/CreditAlertBanner";
import { ActionAlertsBanner } from "./cliente/ActionAlertsBanner";

export function ClienteLayout() {
  const location = useLocation();

  return (
    <FeatureGateProvider>
      <div className="flex min-h-screen w-full">
        <ClienteSidebar />
        <main className="flex-1 h-screen overflow-hidden flex flex-col relative">
          <CreditAlertBanner />
          <div key={location.pathname} className="flex-1 min-h-0 overflow-y-auto page-enter p-6 lg:p-8">
            <ActionAlertsBanner />
            <Outlet />
          </div>
          <FeatureGateOverlay />
        </main>
      </div>
    </FeatureGateProvider>
  );
}