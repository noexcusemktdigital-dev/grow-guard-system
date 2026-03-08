import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { FranqueadoraSidebar, FranqueadoraSidebarContent } from "./FranqueadoraSidebar";
import { FranqueadoraTour } from "./FranqueadoraTour";
import { AnnouncementPopupDialog } from "./AnnouncementPopupDialog";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function FranqueadoraLayout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full">
      <FranqueadoraSidebar />

      {/* Mobile header */}
      <div className="md:hidden sticky top-0 z-30 bg-sidebar h-12 flex items-center px-4 border-b border-sidebar-border">
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
              <FranqueadoraSidebarContent collapsed={false} setCollapsed={() => {}} />
            </div>
          </SheetContent>
        </Sheet>
        <span className="text-sm font-semibold text-white ml-2">NOE</span>
      </div>

      <main className="flex-1 overflow-x-hidden">
        <div key={location.pathname} className="page-enter p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
      <FranqueadoraTour />
      <AnnouncementPopupDialog />
    </div>
  );
}
