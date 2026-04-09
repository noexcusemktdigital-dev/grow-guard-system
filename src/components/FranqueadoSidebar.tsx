import { useState } from "react";
import logoWhite from "@/assets/logo-noexcuse-white.png";
import { NavLink as RouterNavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Calendar, Megaphone, MessageSquare, ChevronLeft, ChevronRight,
  Sparkles, ClipboardCheck, FileText, Users, FolderOpen, GraduationCap,
  DollarSign, FileSignature, User, Target, ChevronDown, Settings, ChevronsUpDown, Building2, Trophy, LogOut, ClipboardList,
  TrendingUp,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/contexts/AuthContext";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAdsConnectionStatus } from "@/hooks/use-ads-connections";

interface SidebarItem {
  label: string;
  icon: React.ElementType;
  path: string;
  disabled?: boolean;
}

const principalSection: SidebarItem[] = [
  { label: "Início", icon: LayoutDashboard, path: "/franqueado/inicio" },
  { label: "Agenda", icon: Calendar, path: "/franqueado/agenda" },
  { label: "Comunicados Matriz", icon: Megaphone, path: "/franqueado/comunicados" },
  { label: "Suporte", icon: MessageSquare, path: "/franqueado/suporte" },
];

const comercialSection: SidebarItem[] = [
  { label: "CRM de Vendas", icon: Target, path: "/franqueado/crm" },
  { label: "Prospecção", icon: Sparkles, path: "/franqueado/prospeccao" },
  { label: "Criador de Estratégia", icon: ClipboardCheck, path: "/franqueado/estrategia" },
  { label: "Gerador de Proposta", icon: FileText, path: "/franqueado/propostas" },
  { label: "Acompanhamento", icon: ClipboardList, path: "/franqueado/acompanhamento" },
  { label: "Metas & Ranking", icon: Trophy, path: "/franqueado/metas" },
];

const marketingSection: SidebarItem[] = [
  { label: "Marketing", icon: FolderOpen, path: "/franqueado/materiais" },
  { label: "NOE Academy", icon: GraduationCap, path: "/franqueado/academy" },
  { label: "Anúncios", icon: TrendingUp, path: "/franqueado/anuncios" },
];

const gestaoSection: SidebarItem[] = [
  { label: "Minha Unidade", icon: Building2, path: "/franqueado/unidade" },
  { label: "Financeiro", icon: DollarSign, path: "/franqueado/financeiro" },
  { label: "Contratos", icon: FileSignature, path: "/franqueado/contratos" },
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

// AdsNavItem — item especial para /franqueado/anuncios com badge de status OAuth
function AdsNavItem({ collapsed }: { collapsed: boolean }) {
  const location = useLocation();
  const isActive = location.pathname.startsWith("/franqueado/anuncios");
  const { data: status } = useAdsConnectionStatus();

  const link = (
    <RouterNavLink
      to="/franqueado/anuncios"
      className={`group flex items-center gap-2.5 px-3 py-[7px] text-[13px] transition-all duration-200 rounded-lg mx-1.5
        ${collapsed ? "justify-center px-2 mx-1" : ""}
        ${isActive
          ? "bg-sidebar-primary/15 text-white font-medium"
          : "text-sidebar-foreground hover:text-white hover:bg-white/[0.06]"
        }
      `}
    >
      <div className="relative">
        <TrendingUp className={`w-[18px] h-[18px] flex-shrink-0 transition-colors duration-200 ${
          isActive ? "text-sidebar-primary" : "text-sidebar-muted group-hover:text-sidebar-foreground"
        }`} />
        {isActive && (
          <div className="absolute -left-[13px] top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-sidebar-primary" />
        )}
        {/* dot de status no canto superior direito do ícone */}
        {!collapsed && (
          <span
            className={`absolute -top-0.5 -right-1 w-2 h-2 rounded-full border border-sidebar ${
              status?.hasActiveConnection ? "bg-emerald-500" : "bg-zinc-400"
            }`}
          />
        )}
      </div>
      {!collapsed && <span className="truncate flex-1">Anúncios</span>}
    </RouterNavLink>
  );

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" className="text-xs font-medium">
          Anúncios {status?.hasActiveConnection ? "• Conectado" : "• Sem conexão"}
        </TooltipContent>
      </Tooltip>
    );
  }

  return link;
}

function SidebarNavItems({ items, collapsed }: { items: SidebarItem[]; collapsed: boolean }) {
  return (
    <nav className="flex flex-col gap-[2px]">
      {items.map((item) => {
        if (item.path === "/franqueado/anuncios") {
          return <AdsNavItem key={item.path} collapsed={collapsed} />;
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

export function FranqueadoSidebarContent({ collapsed, setCollapsed, onNavigate }: { collapsed: boolean; setCollapsed: (v: boolean) => void; onNavigate?: () => void }) {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const userName = profile?.full_name || "Usuário";
  const userInitials = userName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  const handleNav = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

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
        <div data-tour="comercial">
          <CollapsibleSection title="Comercial" items={comercialSection} collapsed={collapsed} defaultOpen />
        </div>
        <div data-tour="marketing">
          <CollapsibleSection title="Marketing" items={marketingSection} collapsed={collapsed} />
        </div>
        <div data-tour="gestao">
          <CollapsibleSection title="Gestão" items={gestaoSection} collapsed={collapsed} />
        </div>
      </div>

      {/* Footer — User Menu */}
      <div className="border-t border-sidebar-border">
        <Popover>
          <PopoverTrigger asChild>
            <button className={`w-full flex items-center gap-2.5 hover:bg-white/[0.06] transition-colors ${collapsed ? "justify-center px-2 py-3" : "px-3 py-3"}`}>
              <div className="w-8 h-8 rounded-full bg-sidebar-primary/15 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={userName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[11px] font-bold text-sidebar-primary">{userInitials}</span>
                )}
              </div>
              {!collapsed && (
                <>
                  <div className="min-w-0 text-left flex-1">
                    <p className="text-[12px] font-semibold text-white truncate">{userName}</p>
                    <p className="text-[10px] text-sidebar-muted truncate">{profile?.job_title || "Franqueado"}</p>
                  </div>
                  <ChevronsUpDown className="w-3.5 h-3.5 text-sidebar-muted flex-shrink-0" />
                </>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent side={collapsed ? "right" : "top"} align="start" className="w-48 p-1 bg-popover border border-border shadow-lg z-50">
            <button
              onClick={() => handleNav("/franqueado/perfil")}
              className="w-full flex items-center gap-2 px-3 py-2 text-[13px] rounded-md hover:bg-muted transition-colors text-foreground"
            >
              <User className="w-4 h-4" />
              Meu Perfil
            </button>
            <button
              onClick={() => handleNav("/franqueado/configuracoes")}
              className="w-full flex items-center gap-2 px-3 py-2 text-[13px] rounded-md hover:bg-muted transition-colors text-foreground"
            >
              <Settings className="w-4 h-4" />
              Configurações
            </button>
            <button
              onClick={() => { signOut("/acessofranquia"); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-[13px] rounded-md hover:bg-destructive/10 text-destructive transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </PopoverContent>
        </Popover>
      </div>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-10 border-t border-sidebar-border text-sidebar-muted hover:text-white hover:bg-white/[0.03] transition-all duration-200"
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>
    </>
  );
}

export function FranqueadoSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`h-[calc(100vh-56px)] bg-sidebar flex-col transition-all duration-300 ease-out sticky top-14 hidden md:flex ${collapsed ? "w-[60px]" : "w-[240px]"}`}
    >
      <FranqueadoSidebarContent collapsed={collapsed} setCollapsed={setCollapsed} />
    </aside>
  );
}
