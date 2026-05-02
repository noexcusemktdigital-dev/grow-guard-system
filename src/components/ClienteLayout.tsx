import { useState, useCallback } from "react";
import { Outlet, useLocation, Navigate } from "react-router-dom";
import { useOrgProfile } from "@/hooks/useOrgProfile";
import { ClienteSidebar, ClienteSidebarContent } from "./ClienteSidebar";
import { FeatureGateProvider } from "@/contexts/FeatureGateContext";
import { FeatureGateOverlay } from "./FeatureGateOverlay";
import { CreditAlertBanner } from "./cliente/CreditAlertBanner";
import { TrialCountdownBanner } from "./cliente/TrialCountdownBanner";
import { SupportAccessBanner } from "./cliente/SupportAccessBanner";
import { ActionAlertsBanner } from "./cliente/ActionAlertsBanner";
import { PaymentBlockedBanner } from "./cliente/PaymentBlockedBanner";
import { OnboardingTour } from "./cliente/OnboardingTour";
import { TrialWelcomeModal } from "./cliente/TrialWelcomeModal";
import { GpsCompletedModal } from "./cliente/GpsCompletedModal";
import { CelebrationEffect } from "./CelebrationEffect";
import { AnnouncementPopupDialog } from "./AnnouncementPopupDialog";
import { SystemAlertBanner } from "./SystemAlertBanner";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function ClienteLayout() {
  const location = useLocation();
  const { data: orgData, isLoading: orgLoading } = useOrgProfile();
  const isChatRoute = location.pathname === "/cliente/chat";
  const isOnboardingRoute = location.pathname === "/cliente/onboarding";
  const isGpsRoute = location.pathname === "/cliente/gps-negocio";
  const [mobileOpen, setMobileOpen] = useState(false);

  // Sequence: Welcome Modal → Tour → Announcements
  // Persist done states so they survive re-renders/navigation
  const [welcomeDone, setWelcomeDone] = useState(() => !!localStorage.getItem("trial_welcome_seen"));
  const [tourDone, setTourDone] = useState(() => !!localStorage.getItem("onboarding_tour_done"));

  const handleWelcomeDone = useCallback(() => setWelcomeDone(true), []);
  const handleTourDone = useCallback(() => setTourDone(true), []);

  // Gate: redirect to onboarding if not completed (skip if already on onboarding page or gps page)
  if (!isOnboardingRoute && !isGpsRoute && !orgLoading && orgData && (orgData as unknown as { onboarding_completed?: boolean }).onboarding_completed !== true) {
    return <Navigate to="/cliente/onboarding" replace />;
  }

  return (
    <FeatureGateProvider>
      <div className="flex min-h-screen w-full">
        <ClienteSidebar />

        <main className="flex-1 h-[calc(100vh-3.5rem)] overflow-hidden flex flex-col relative">
          {/* Mobile header */}
          <div className="md:hidden bg-sidebar h-12 flex items-center px-4 border-b border-sidebar-border shrink-0">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button className="p-2 text-sidebar-foreground hover:text-white transition-colors">
                  <Menu className="w-5 h-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-[260px] bg-sidebar border-sidebar-border">
                <div className="h-full flex flex-col" onClick={(e) => {
                  if ((e.target as HTMLElement).closest('a')) setMobileOpen(false);
                }}>
                  <ClienteSidebarContent collapsed={false} setCollapsed={() => {}} />
                </div>
              </SheetContent>
            </Sheet>
            <span className="text-sm font-semibold text-white ml-2">NOE</span>
          </div>

          <PaymentBlockedBanner />
          <SupportAccessBanner />
          {tourDone && <TrialCountdownBanner />}
          {tourDone && <CreditAlertBanner />}
          <div
            key={location.pathname}
            className={`flex-1 min-h-0 flex flex-col page-enter ${
              isChatRoute ? "overflow-hidden p-0" : "overflow-y-auto p-6 lg:p-8"
            }`}
          >
            {tourDone && !isChatRoute && <ActionAlertsBanner />}
            {tourDone && !isChatRoute && <SystemAlertBanner />}
            <Outlet />
          </div>
          <FeatureGateOverlay />
        </main>
      </div>
      <TrialWelcomeModal onComplete={handleWelcomeDone} />
      <GpsCompletedModal />
      <OnboardingTour enabled={welcomeDone} onComplete={handleTourDone} />
      <CelebrationEffect />
      <AnnouncementPopupDialog enabled={tourDone} />
    </FeatureGateProvider>
  );
}
