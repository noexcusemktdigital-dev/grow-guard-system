import { NavLink as RouterNavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  DollarSign,
  FileText,
  FolderOpen,
  Building2,
  TrendingUp,
  Rocket,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  BarChart3,
  CalendarDays,
  Users,
  Settings,
} from "lucide-react";
import { useState } from "react";

interface SidebarItem {
  label: string;
  icon: React.ElementType;
  path: string;
  disabled?: boolean;
  children?: { label: string; icon: React.ElementType; path: string }[];
}

const adminSection: SidebarItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/franqueadora/dashboard", disabled: true },
  {
    label: "Financeiro", icon: DollarSign, path: "/franqueadora/financeiro",
    children: [
      { label: "Visão Geral", icon: BarChart3, path: "/franqueadora/financeiro" },
      { label: "Mês a Mês", icon: CalendarDays, path: "/franqueadora/financeiro/mes-a-mes" },
      { label: "Clientes", icon: Users, path: "/franqueadora/financeiro/clientes" },
      { label: "Configurações", icon: Settings, path: "/franqueadora/financeiro/configuracoes" },
    ],
  },
  { label: "Contratos", icon: FileText, path: "/franqueadora/contratos", disabled: true },
  { label: "Drive Corporativo", icon: FolderOpen, path: "/franqueadora/drive", disabled: true },
];

const redeSection: SidebarItem[] = [
  { label: "Franquias", icon: Building2, path: "/franqueadora/franquias", disabled: true },
  { label: "CRM Expansão", icon: TrendingUp, path: "/franqueadora/crm", disabled: true },
  { label: "Onboarding", icon: Rocket, path: "/franqueadora/onboarding", disabled: true },
];

function SidebarSection({ title, items, collapsed }: { title: string; items: SidebarItem[]; collapsed: boolean }) {
  const location = useLocation();

  return (
    <div className="mb-6">
      {!collapsed && <div className="section-label px-4 mb-3">{title}</div>}
      <nav className="flex flex-col gap-0.5">
        {items.map((item) => {
          const isParentActive = location.pathname.startsWith(item.path);
          const Icon = item.icon;
          const [open, setOpen] = useState(isParentActive);

          if (item.disabled) {
            return (
              <div
                key={item.path}
                className={`flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground/40 cursor-not-allowed ${collapsed ? "justify-center" : ""}`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </div>
            );
          }

          if (item.children && !collapsed) {
            return (
              <div key={item.path}>
                <button
                  onClick={() => setOpen(!open)}
                  className={`flex items-center gap-3 px-4 py-3 text-sm w-full transition-all duration-150 rounded-r-lg
                    ${isParentActive ? "sidebar-item-active font-medium" : "text-sidebar-foreground hover:text-foreground hover:bg-secondary/50"}
                  `}
                >
                  <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isParentActive ? "text-primary" : ""}`} />
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-0" : "-rotate-90"}`} />
                </button>
                {open && (
                  <div className="ml-7 border-l border-border/50 mt-0.5">
                    {item.children.map(child => {
                      const isChildActive = location.pathname === child.path;
                      const ChildIcon = child.icon;
                      return (
                        <RouterNavLink
                          key={child.path}
                          to={child.path}
                          className={`flex items-center gap-2.5 pl-4 pr-4 py-2 text-sm transition-colors ${
                            isChildActive ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <ChildIcon className="w-3.5 h-3.5" />
                          <span>{child.label}</span>
                        </RouterNavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <RouterNavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 text-sm transition-all duration-150 rounded-r-lg
                ${collapsed ? "justify-center" : ""}
                ${isParentActive ? "sidebar-item-active font-medium" : "text-sidebar-foreground hover:text-foreground hover:bg-secondary/50"}
              `}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isParentActive ? "text-primary" : ""}`} />
              {!collapsed && <span>{item.label}</span>}
            </RouterNavLink>
          );
        })}
      </nav>
    </div>
  );
}

export function FranqueadoraSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`h-[calc(100vh-49px)] bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 sticky top-[49px] ${collapsed ? "w-16" : "w-60"}`}
    >
      {/* Logo */}
      <div className={`flex items-center h-14 border-b border-sidebar-border ${collapsed ? "justify-center px-2" : "px-4"}`}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-6 bg-primary rounded-full" />
            <span className="text-[10px] font-bold tracking-[0.25em] text-muted-foreground uppercase">Franchise System</span>
          </div>
        )}
        {collapsed && <div className="w-2 h-6 bg-primary rounded-full" />}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6">
        <SidebarSection title="Administrativo" items={adminSection} collapsed={collapsed} />
        <SidebarSection title="Rede" items={redeSection} collapsed={collapsed} />
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-12 border-t border-sidebar-border text-muted-foreground hover:text-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
}
