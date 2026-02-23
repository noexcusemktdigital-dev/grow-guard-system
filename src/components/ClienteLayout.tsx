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
        <main className="flex-1 overflow-x-hidden relative">
          <CreditAlertBanner />
          <div key={location.pathname} className="page-enter p-6 lg:p-8">
            <ActionAlertsBanner />
            <Outlet />
          </div>
          <FeatureGateOverlay />
        </main>
      </div>
    </FeatureGateProvider>
  );
}