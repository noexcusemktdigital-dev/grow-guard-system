import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { ClienteSidebar, ClienteSidebarContent } from "./ClienteSidebar";
import { FeatureGateProvider } from "@/contexts/FeatureGateContext";
import { FeatureGateOverlay } from "./FeatureGateOverlay";
import { CreditAlertBanner } from "./cliente/CreditAlertBanner";
import { ActionAlertsBanner } from "./cliente/ActionAlertsBanner";
import { OnboardingTour } from "./cliente/OnboardingTour";
import { CelebrationEffect } from "./CelebrationEffect";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function ClienteLayout() {
  const location = useLocation();
  const isChatRoute = location.pathname === "/cliente/chat";
  const [mobileOpen, setMobileOpen] = useState(false);

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
