import { useState } from "react";
import { NavLink as RouterNavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Calendar, Megaphone, MessageSquare, ChevronLeft, ChevronRight,
  Sparkles, ClipboardCheck, FileText, Users, FolderOpen, GraduationCap,
  DollarSign, FileSignature, User, Target, ChevronDown,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface SidebarItem {
  label: string;
  icon: React.ElementType;
  path: string;
  disabled?: boolean;
}

const principalSection: SidebarItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/franqueado/dashboard" },
  { label: "Agenda", icon: Calendar, path: "/franqueado/agenda" },
  { label: "Comunicados Matriz", icon: Megaphone, path: "/franqueado/comunicados" },
  { label: "Suporte", icon: MessageSquare, path: "/franqueado/suporte" },
];

const comercialSection: SidebarItem[] = [
  { label: "CRM de Vendas", icon: Target, path: "/franqueado/crm" },
  { label: "Prospecção", icon: Sparkles, path: "/franqueado/prospeccao" },
  { label: "Criador de Estratégia", icon: ClipboardCheck, path: "/franqueado/estrategia" },
  { label: "Gerador de Proposta", icon: FileText, path: "/franqueado/propostas" },
];

const marketingSection: SidebarItem[] = [
  { label: "Marketing", icon: FolderOpen, path: "/franqueado/materiais" },
  { label: "NOE Academy", icon: GraduationCap, path: "/franqueado/academy" },
];

const gestaoSection: SidebarItem[] = [
  { label: "Financeiro Unidade", icon: DollarSign, path: "/franqueado/financeiro" },
  { label: "Meus Contratos", icon: FileSignature, path: "/franqueado/contratos" },
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

function SidebarNavItems({ items, collapsed }: { items: SidebarItem[]; collapsed: boolean }) {
  return (
    <nav className="flex flex-col gap-[2px]">
      {items.map((item) => (
        <NavItem key={item.path} item={item} collapsed={collapsed} />
      ))}
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

export function FranqueadoSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`h-[calc(100vh-56px)] bg-sidebar flex flex-col transition-all duration-300 ease-out sticky top-14 ${collapsed ? "w-[60px]" : "w-[240px]"}`}
    >
      {/* Logo */}
      <div className={`flex items-center h-14 border-b border-sidebar-border ${collapsed ? "justify-center px-2" : "px-4"}`}>
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 flex-shrink-0 shadow-lg shadow-primary/20">
            <span className="text-sm font-black text-primary-foreground">N</span>
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-[13px] font-bold text-white tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                NOEXCUSE
              </span>
              <span className="text-[9px] text-sidebar-muted -mt-0.5 tracking-wide">Unidade</span>
            </div>
          )}
        </div>
      </div>

      {/* Menu */}
      <div className="flex-1 overflow-y-auto py-3 space-y-4">
        <SidebarNavItems items={principalSection} collapsed={collapsed} />
        <div className="mx-3 border-t border-sidebar-border/60" />
        <CollapsibleSection title="Comercial" items={comercialSection} collapsed={collapsed} defaultOpen />
        <CollapsibleSection title="Marketing" items={marketingSection} collapsed={collapsed} />
        <CollapsibleSection title="Gestão" items={gestaoSection} collapsed={collapsed} />
      </div>

      {/* Footer — User */}
      {!collapsed && (
        <div className="px-3 py-3 border-t border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-sidebar-primary/15 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-sidebar-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-white truncate">Davi Sócio</p>
              <p className="text-[10px] text-sidebar-muted truncate">Unidade Curitiba</p>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-10 border-t border-sidebar-border text-sidebar-muted hover:text-white hover:bg-white/[0.03] transition-all duration-200"
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>
    </aside>
  );
}
