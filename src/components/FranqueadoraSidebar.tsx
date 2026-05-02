import { useState } from "react";
import logoWhite from "@/assets/logo-noexcuse-white.png";
import { NavLink as RouterNavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard, DollarSign, FileText, Building2, TrendingUp,
  Rocket, MessageSquare, ChevronLeft, ChevronRight, ChevronDown, BarChart3,
  Shield, Settings, Calendar, Megaphone, Zap, GraduationCap, Trophy, Receipt, Sparkles, ClipboardCheck,
  ArrowRightLeft, CreditCard, FileSpreadsheet, FilePlus, Copy, User, AlertTriangle, LogOut, Users,
  ClipboardList,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface SidebarChild {
  label: string;
  icon: React.ElementType;
  path: string;
}

interface SidebarItem {
  label: string;
  icon: React.ElementType;
  path: string;
  disabled?: boolean;
  children?: SidebarChild[];
}

const principalSection: SidebarItem[] = [
  { label: "Início", icon: LayoutDashboard, path: "/franqueadora/inicio" },
  { label: "Chat da Equipe", icon: MessageSquare, path: "/franqueadora/chat" },
  { label: "Agenda", icon: Calendar, path: "/franqueadora/agenda" },
  { label: "Comunicados", icon: Megaphone, path: "/franqueadora/comunicados" },
];

const franquiaSection: SidebarItem[] = [
  { label: "Unidades", icon: Building2, path: "/franqueadora/unidades" },
  { label: "Onboarding", icon: Rocket, path: "/franqueadora/onboarding" },
  { label: "Candidatos", icon: Users, path: "/franqueadora/candidatos" },
  { label: "Atendimento", icon: MessageSquare, path: "/franqueadora/atendimento" },
];

const comercialSection: SidebarItem[] = [
  { label: "CRM", icon: TrendingUp, path: "/franqueadora/crm" },
  { label: "Prospecção", icon: Sparkles, path: "/franqueadora/prospeccao" },
  { label: "Criador de Estratégia", icon: ClipboardCheck, path: "/franqueadora/estrategia" },
  { label: "Gerador de Proposta", icon: FileText, path: "/franqueadora/propostas" },
  { label: "Acompanhamento", icon: ClipboardList, path: "/franqueadora/acompanhamento" },
  { label: "Metas & Ranking", icon: Trophy, path: "/franqueadora/metas" },
];

const marketingSection: SidebarItem[] = [
  { label: "Marketing", icon: Zap, path: "/franqueadora/marketing" },
  { label: "Anúncios", icon: TrendingUp, path: "/franqueadora/anuncios" },
  { label: "Rede de Anúncios", icon: BarChart3, path: "/franqueadora/ads-rede" },
  { label: "NOE Academy", icon: GraduationCap, path: "/franqueadora/treinamentos" },
  { label: "Playbooks", icon: Copy, path: "/franqueadora/playbooks" },
];

const adminSection: SidebarItem[] = [
  { label: "Matriz", icon: Shield, path: "/franqueadora/matriz" },
  { label: "Contratos", icon: FileText, path: "/franqueadora/contratos" },
  { label: "Financeiro", icon: DollarSign, path: "/franqueadora/financeiro" },
  { label: "Logs & Erros", icon: AlertTriangle, path: "/franqueadora/logs" },
];

function NavItem({ item, collapsed }: { item: SidebarItem; collapsed: boolean }) {
  const location = useLocation();
  const Icon = item.icon;
  const isActive = location.pathname.startsWith(item.path);

  if (item.disabled) {
    const content = (
      <div
        className={`flex items-center gap-2.5 px-3 py-[7px] text-[13px] text-sidebar-muted/30 cursor-not-allowed mx-1.5 ${collapsed ? "justify-center px-2 mx-1" : ""}`}
      >
        <Icon className="w-[18px] h-[18px] flex-shrink-0" />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </div>
    );
    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="text-xs font-medium">{item.label}</TooltipContent>
        </Tooltip>
      );
    }
    return content;
  }

  const link = (
    <RouterNavLink
      to={item.path}
      className={`group flex items-center gap-2.5 px-3 py-[7px] text-[13px] transition-all duration-200 rounded-lg mx-1.5
        ${collapsed ? "justify-center px-2 mx-1" : ""}
        ${isActive
          ? "bg-sidebar-primary/15 text-white font-medium"
          : "text-sidebar-foreground hover:text-white hover:bg-white/[0.06]"
        }
      `}
    >
      <div className="relative">
        <Icon className={`w-[18px] h-[18px] flex-shrink-0 transition-colors duration-200 ${
          isActive ? "text-sidebar-primary" : "text-sidebar-muted group-hover:text-sidebar-foreground"
        }`} />
        {isActive && (
          <div className="absolute -left-[13px] top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-sidebar-primary" />
        )}
      </div>
      {!collapsed && <span className="truncate flex-1">{item.label}</span>}
    </RouterNavLink>
  );

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" className="text-xs font-medium">{item.label}</TooltipContent>
      </Tooltip>
    );
  }

  return link;
}

function NavItemWithChildren({ item, collapsed }: { item: SidebarItem; collapsed: boolean }) {
  const location = useLocation();
  const isParentActive = location.pathname.startsWith(item.path);
  const [open, setOpen] = useState(isParentActive);
  const Icon = item.icon;

  if (collapsed) {
    const link = (
      <RouterNavLink
        to={item.path}
        className={`group flex items-center justify-center px-2 py-[7px] text-[13px] transition-all duration-200 rounded-lg mx-1
          ${isParentActive
            ? "bg-sidebar-primary/15 text-white font-medium"
            : "text-sidebar-foreground hover:text-white hover:bg-white/[0.06]"
          }
        `}
      >
        <div className="relative">
          <Icon className={`w-[18px] h-[18px] flex-shrink-0 transition-colors duration-200 ${
            isParentActive ? "text-sidebar-primary" : "text-sidebar-muted group-hover:text-sidebar-foreground"
          }`} />
          {isParentActive && (
            <div className="absolute -left-[10px] top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-sidebar-primary" />
          )}
        </div>
      </RouterNavLink>
    );
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" className="text-xs font-medium">{item.label}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={`group flex items-center gap-2.5 px-3 py-[7px] text-[13px] w-full transition-all duration-200 rounded-lg mx-1.5
          ${isParentActive
            ? "bg-sidebar-primary/15 text-white font-medium"
            : "text-sidebar-foreground hover:text-white hover:bg-white/[0.06]"
          }
        `}
      >
        <div className="relative">
          <Icon className={`w-[18px] h-[18px] flex-shrink-0 transition-colors duration-200 ${
            isParentActive ? "text-sidebar-primary" : "text-sidebar-muted group-hover:text-sidebar-foreground"
          }`} />
          {isParentActive && (
            <div className="absolute -left-[13px] top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-sidebar-primary" />
          )}
        </div>
        <span className="flex-1 text-left truncate">{item.label}</span>
        <ChevronDown className={`w-3 h-3 text-sidebar-muted transition-transform duration-300 ${open ? "rotate-0" : "-rotate-90"}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="ml-[30px] border-l border-sidebar-border/40 mt-0.5 space-y-[1px]">
          {item.children?.map(child => {
            const isChildActive = location.pathname === child.path;
            const ChildIcon = child.icon;
            return (
              <RouterNavLink
                key={child.path}
                to={child.path}
                className={`flex items-center gap-2 pl-3.5 pr-3 py-[6px] text-[12px] transition-colors duration-200 rounded-r-md ${
                  isChildActive ? "text-sidebar-primary font-medium" : "text-sidebar-muted hover:text-white"
                }`}
              >
                <ChildIcon className={`w-3.5 h-3.5 ${isChildActive ? "text-sidebar-primary" : ""}`} />
                <span className="truncate">{child.label}</span>
              </RouterNavLink>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SidebarNavItems({ items, collapsed }: { items: SidebarItem[]; collapsed: boolean }) {
  return (
    <nav className="flex flex-col gap-[2px]">
      {items.map((item) => {
        if (item.children) {
          return <NavItemWithChildren key={item.path} item={item} collapsed={collapsed} />;
        }
        return <NavItem key={item.path} item={item} collapsed={collapsed} />;
      })}
    </nav>
  );
}

function CollapsibleSection({ title, items, collapsed, defaultOpen = false }: { title: string; items: SidebarItem[]; collapsed: boolean; defaultOpen?: boolean }) {
  const location = useLocation();
  const isActive = items.some(item => location.pathname.startsWith(item.path));
  const [isOpen, setIsOpen] = useState(defaultOpen || isActive);

  if (collapsed) {
    return (
      <div className="py-1">
        <SidebarNavItems items={items} collapsed={collapsed} />
      </div>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between cursor-pointer hover:bg-white/[0.03] rounded-md px-3 py-1.5 transition-colors mx-1.5 group">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-sidebar-muted group-hover:text-sidebar-foreground transition-colors">
            {title}
          </span>
          <ChevronDown className={`h-3 w-3 text-sidebar-muted transition-transform duration-300 ${isOpen ? "rotate-0" : "-rotate-90"}`} />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-0.5 animate-accordion-down">
        <SidebarNavItems items={items} collapsed={collapsed} />
      </CollapsibleContent>
    </Collapsible>
  );
}

function SidebarFooter({ collapsed = false }: { collapsed?: boolean }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const userName = profile?.full_name?.split(" ")[0] || "Admin";
  const initials = (profile?.full_name || "A")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return (
    <div className="border-t border-sidebar-border">
      <Popover>
        <PopoverTrigger asChild>
          <button className={`w-full flex items-center gap-2.5 hover:bg-white/[0.06] transition-colors ${collapsed ? "justify-center px-2 py-3" : "px-3 py-3"}`}>
            <div className="w-8 h-8 rounded-full bg-sidebar-primary/15 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={userName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-[11px] font-semibold text-sidebar-primary">{initials}</span>
              )}
            </div>
            {!collapsed && (
              <>
                <div className="min-w-0 text-left flex-1">
                  <p className="text-[12px] font-semibold text-white truncate">{userName}</p>
                  <p className="text-[10px] text-sidebar-muted truncate">Franqueadora</p>
                </div>
              </>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent side={collapsed ? "right" : "top"} align="start" className="w-48 p-1">
          <button
            onClick={() => navigate("/franqueadora/perfil")}
            className="flex items-center gap-2 w-full rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
          >
            <User className="w-4 h-4" /> Meu Perfil
          </button>
          <button
            onClick={() => navigate("/franqueadora/matriz")}
            className="flex items-center gap-2 w-full rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
          >
            <Settings className="w-4 h-4" /> Configurações
          </button>
          <button
            onClick={() => signOut("/acessofranquia")}
            className="flex items-center gap-2 w-full rounded-md px-3 py-2 text-sm hover:bg-destructive/10 text-destructive transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function FranqueadoraSidebarContent({ collapsed, setCollapsed }: { collapsed: boolean; setCollapsed: (v: boolean) => void }) {
  return (
    <>
      {/* Logo */}
      <div className={`flex items-center h-14 border-b border-sidebar-border ${collapsed ? "justify-center px-2" : "px-4"}`}>
        <div className="flex items-center gap-2.5">
          <img src={logoWhite} alt="NOEXCUSE" className={`object-contain flex-shrink-0 ${collapsed ? "h-7 w-7" : "h-8"}`} />
        </div>
      </div>

      {/* Menu */}
      <div className="flex-1 overflow-y-auto py-3 space-y-4">
        <SidebarNavItems items={principalSection} collapsed={collapsed} />
        <div className="mx-3 border-t border-sidebar-border/60" />
        <div data-tour="franquia">
          <CollapsibleSection title="Franquia" items={franquiaSection} collapsed={collapsed} defaultOpen />
        </div>
        <div data-tour="comercial">
          <CollapsibleSection title="Comercial" items={comercialSection} collapsed={collapsed} defaultOpen />
        </div>
        <div data-tour="marketing-academy">
          <CollapsibleSection title="Marketing & Academy" items={marketingSection} collapsed={collapsed} />
        </div>
        <div data-tour="gestao">
          <CollapsibleSection title="Gestão" items={adminSection} collapsed={collapsed} />
        </div>
      </div>

      {/* Footer — User */}
      <SidebarFooter collapsed={collapsed} />

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-10 border-t border-sidebar-border text-sidebar-muted hover:text-white hover:bg-white/[0.03] transition-all duration-200"
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>
    </>
  );
}

export function FranqueadoraSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`h-[calc(100vh-56px)] bg-sidebar flex-col transition-all duration-300 ease-out sticky top-14 hidden md:flex ${collapsed ? "w-[60px]" : "w-[240px]"}`}
    >
      <FranqueadoraSidebarContent collapsed={collapsed} setCollapsed={setCollapsed} />
    </aside>
  );
}
