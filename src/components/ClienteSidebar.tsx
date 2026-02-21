import { NavLink as RouterNavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, CheckSquare, Bell, Trophy, ChevronLeft, ChevronRight,
  Target, MessageCircle, Users, Bot, BookOpen, Send, BarChart3,
  Megaphone, Rocket, FileText, Share2, Globe, DollarSign, User,
} from "lucide-react";
import { useState } from "react";

interface SidebarItem {
  label: string;
  icon: React.ElementType;
  path: string;
}

const principalSection: SidebarItem[] = [
  { label: "Início", icon: LayoutDashboard, path: "/cliente/inicio" },
  { label: "Checklist do Dia", icon: CheckSquare, path: "/cliente/checklist" },
  { label: "Notificações", icon: Bell, path: "/cliente/notificacoes" },
  { label: "Gamificação", icon: Trophy, path: "/cliente/gamificacao" },
];

const vendasSection: SidebarItem[] = [
  { label: "Plano de Vendas", icon: Target, path: "/cliente/plano-vendas" },
  { label: "Chat", icon: MessageCircle, path: "/cliente/chat" },
  { label: "CRM", icon: Users, path: "/cliente/crm" },
  { label: "Agentes de IA", icon: Bot, path: "/cliente/agentes-ia" },
  { label: "Scripts & Playbooks", icon: BookOpen, path: "/cliente/scripts" },
  { label: "Disparos", icon: Send, path: "/cliente/disparos" },
  { label: "Relatórios", icon: BarChart3, path: "/cliente/relatorios" },
];

const marketingSection: SidebarItem[] = [
  { label: "Plano de Marketing", icon: Megaphone, path: "/cliente/plano-marketing" },
  { label: "Campanhas", icon: Rocket, path: "/cliente/campanhas" },
  { label: "Conteúdos", icon: FileText, path: "/cliente/conteudos" },
  { label: "Redes Sociais", icon: Share2, path: "/cliente/redes-sociais" },
  { label: "Sites", icon: Globe, path: "/cliente/sites" },
  { label: "Tráfego Pago", icon: DollarSign, path: "/cliente/trafego-pago" },
];

function SidebarSection({ title, items, collapsed }: { title: string; items: SidebarItem[]; collapsed: boolean }) {
  const location = useLocation();

  return (
    <div className="mb-6">
      {!collapsed && <div className="section-label px-4 mb-3">{title}</div>}
      <nav className="flex flex-col gap-0.5">
        {items.map((item) => {
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

export function ClienteSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`h-[calc(100vh-49px)] bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 sticky top-[49px] ${collapsed ? "w-16" : "w-60"}`}
    >
      <div className={`flex items-center h-14 border-b border-sidebar-border ${collapsed ? "justify-center px-2" : "px-4"}`}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-6 bg-primary rounded-full" />
            <span className="text-[10px] font-bold tracking-[0.25em] text-muted-foreground uppercase">SaaS NoExcuse</span>
          </div>
        )}
        {collapsed && <div className="w-2 h-6 bg-primary rounded-full" />}
      </div>

      <div className="flex-1 overflow-y-auto py-6">
        <SidebarSection title="Principal" items={principalSection} collapsed={collapsed} />
        <SidebarSection title="Vendas" items={vendasSection} collapsed={collapsed} />
        <SidebarSection title="Marketing" items={marketingSection} collapsed={collapsed} />
      </div>

      {!collapsed && (
        <div className="px-4 py-3 border-t border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">Empresa Demo</p>
              <p className="text-[10px] text-muted-foreground truncate">Plano Profissional</p>
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
