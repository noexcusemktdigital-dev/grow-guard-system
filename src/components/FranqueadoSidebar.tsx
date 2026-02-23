import { NavLink as RouterNavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Calendar, Megaphone, MessageSquare, ChevronLeft, ChevronRight,
  Sparkles, ClipboardCheck, FileText, Users, FolderOpen, GraduationCap,
  DollarSign, FileSignature, User, Target,
} from "lucide-react";
import { useState } from "react";

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
  { label: "Prospecção IA", icon: Sparkles, path: "/franqueado/prospeccao" },
  { label: "Diagnóstico NOE", icon: ClipboardCheck, path: "/franqueado/diagnostico" },
  { label: "Gerador de Proposta", icon: FileText, path: "/franqueado/propostas" },
];

const marketingSection: SidebarItem[] = [
  { label: "Marketing", icon: FolderOpen, path: "/franqueado/materiais" },
  { label: "Academy e Treinamentos", icon: GraduationCap, path: "/franqueado/academy" },
];

const gestaoSection: SidebarItem[] = [
  { label: "Financeiro Unidade", icon: DollarSign, path: "/franqueado/financeiro" },
  { label: "Meus Contratos", icon: FileSignature, path: "/franqueado/contratos" },
];

function SidebarSection({ title, items, collapsed }: { title: string; items: SidebarItem[]; collapsed: boolean }) {
  const location = useLocation();

  return (
    <div className="mb-6">
      {!collapsed && <div className="section-label px-4 mb-3">{title}</div>}
      <nav className="flex flex-col gap-0.5">
        {items.map((item) => {
          if (item.disabled) {
            const Icon = item.icon;
            return (
              <div
                key={item.path}
                className={`flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground/30 cursor-not-allowed ${collapsed ? "justify-center" : ""}`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </div>
            );
          }

          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.path);
          return (
            <RouterNavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 text-sm transition-all duration-200 rounded-r-xl mx-1
                ${collapsed ? "justify-center" : ""}
                ${isActive ? "sidebar-item-active font-medium" : "text-sidebar-foreground hover:text-foreground hover:bg-primary/5"}
              `}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? "text-primary" : "text-primary/60"}`} />
              {!collapsed && <span>{item.label}</span>}
            </RouterNavLink>
          );
        })}
      </nav>
    </div>
  );
}

export function FranqueadoSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`h-[calc(100vh-49px)] bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 sticky top-[49px] ${collapsed ? "w-16" : "w-60"}`}
    >
      <div className={`flex items-center h-14 border-b border-sidebar-border ${collapsed ? "justify-center px-2" : "px-4"}`}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-6 bg-primary rounded-full" />
            <span className="text-[10px] font-bold tracking-[0.25em] text-muted-foreground uppercase">Unidade</span>
          </div>
        )}
        {collapsed && <div className="w-2 h-6 bg-primary rounded-full" />}
      </div>

      <div className="flex-1 overflow-y-auto py-6">
        <SidebarSection title="Principal" items={principalSection} collapsed={collapsed} />
        <SidebarSection title="Comercial" items={comercialSection} collapsed={collapsed} />
        <SidebarSection title="Marketing" items={marketingSection} collapsed={collapsed} />
        <SidebarSection title="Gestão" items={gestaoSection} collapsed={collapsed} />
      </div>

      {!collapsed && (
        <div className="px-4 py-3 border-t border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">Davi Sócio</p>
              <p className="text-[10px] text-muted-foreground truncate">Unidade Curitiba</p>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-12 border-t border-sidebar-border text-muted-foreground hover:text-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
}
