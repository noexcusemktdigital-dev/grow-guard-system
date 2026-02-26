import { Outlet, useLocation } from "react-router-dom";
import { ClienteSidebar } from "./ClienteSidebar";
import { FeatureGateProvider } from "@/contexts/FeatureGateContext";
import { FeatureGateOverlay } from "./FeatureGateOverlay";
import { CreditAlertBanner } from "./cliente/CreditAlertBanner";
import { ActionAlertsBanner } from "./cliente/ActionAlertsBanner";
import { OnboardingTour } from "./cliente/OnboardingTour";
import { CelebrationEffect } from "./CelebrationEffect";

export function ClienteLayout() {
  const location = useLocation();
  const isChatRoute = location.pathname === "/cliente/chat";

  return (
    <FeatureGateProvider>
      <div className="flex min-h-screen w-full">
        <ClienteSidebar />
        <main className="flex-1 h-[calc(100vh-3.5rem)] overflow-hidden flex flex-col relative">
          <CreditAlertBanner />
          <div
            key={location.pathname}
            className={`flex-1 min-h-0 flex flex-col page-enter ${
              isChatRoute ? "overflow-hidden p-0" : "overflow-y-auto p-6 lg:p-8"
            }`}
          >
            {!isChatRoute && <ActionAlertsBanner />}
            <Outlet />
          </div>
          <FeatureGateOverlay />
        </main>
      </div>
      <OnboardingTour />
      <CelebrationEffect />
    </FeatureGateProvider>
  );
}