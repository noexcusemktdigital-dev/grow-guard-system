import { useState } from "react";
import { NavLink as RouterNavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, CheckSquare, Bell, Trophy, ChevronLeft, ChevronRight,
  Target, MessageCircle, Users, Bot, BookOpen, Send, BarChart3,
  Megaphone, Rocket, FileText, Share2, Globe, DollarSign, User,
  ChevronDown, Link, CreditCard, Settings, Zap,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { mockSubscription, mockWallet, getTrialDaysRemaining } from "@/data/clienteData";

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

const sistemaSection: SidebarItem[] = [
  { label: "Integrações", icon: Link, path: "/cliente/integracoes" },
  { label: "Plano & Créditos", icon: CreditCard, path: "/cliente/plano-creditos" },
  { label: "Configurações", icon: Settings, path: "/cliente/configuracoes" },
];

function SidebarNavItems({ items, collapsed }: { items: SidebarItem[]; collapsed: boolean }) {
  const location = useLocation();
  return (
    <nav className="flex flex-col gap-0.5">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname.startsWith(item.path);
        return (
          <RouterNavLink
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-3 py-2.5 text-sm transition-all duration-200 rounded-lg mx-1
              ${collapsed ? "justify-center" : ""}
              ${isActive ? "bg-primary/10 text-foreground font-medium border-l-[3px] border-primary" : "text-sidebar-foreground hover:text-foreground hover:bg-primary/5"}
            `}
            title={collapsed ? item.label : undefined}
          >
            <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? "text-primary" : "text-primary/60"}`} />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </RouterNavLink>
        );
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
      <div className="mb-2">
        <SidebarNavItems items={items} collapsed={collapsed} />
      </div>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="mb-2">
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between cursor-pointer hover:bg-primary/5 rounded-lg px-4 py-2 transition-colors mx-1">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {title}
            </span>
            {isOpen ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarNavItems items={items} collapsed={collapsed} />
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export function ClienteSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const trialDays = getTrialDaysRemaining();
  const isTrialing = mockSubscription.status === "trial";
  const trialUrgent = trialDays <= 3;

  return (
    <aside
      className={`h-[calc(100vh-49px)] bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 sticky top-[49px] ${collapsed ? "w-16" : "w-64"}`}
    >
      {/* Logo Header */}
      <div className={`flex items-center h-16 border-b border-sidebar-border ${collapsed ? "justify-center px-2" : "px-4"}`}>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary flex-shrink-0">
            <span className="text-lg font-bold text-primary-foreground">N</span>
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-base font-bold text-foreground tracking-tight">NOEXCUSE</span>
              <span className="text-[10px] text-muted-foreground">Gestão Comercial</span>
            </div>
          )}
        </div>
      </div>

      {/* Menu */}
      <div className="flex-1 overflow-y-auto py-4 space-y-1">
        {/* Global - always open */}
        <div className="mb-2">
          {!collapsed && (
            <div className="px-4 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Global</span>
            </div>
          )}
          <SidebarNavItems items={principalSection} collapsed={collapsed} />
        </div>

        <CollapsibleSection title="Vendas" items={vendasSection} collapsed={collapsed} defaultOpen />
        <CollapsibleSection title="Marketing" items={marketingSection} collapsed={collapsed} />
        <CollapsibleSection title="Sistema" items={sistemaSection} collapsed={collapsed} />
      </div>

      {/* Trial Banner */}
      {isTrialing && !collapsed && (
        <div
          className={`mx-3 mb-2 p-3 rounded-lg border cursor-pointer transition-colors ${
            trialUrgent
              ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
              : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800"
          }`}
          onClick={() => navigate("/cliente/plano-creditos")}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className={`text-xs font-semibold ${trialUrgent ? "text-red-700 dark:text-red-300" : "text-amber-700 dark:text-amber-300"}`}>
              🧪 Trial: {trialDays} dias
            </span>
          </div>
          <Progress value={((14 - trialDays) / 14) * 100} className={`h-1 ${trialUrgent ? "[&>div]:bg-red-500" : "[&>div]:bg-amber-500"}`} />
          <p className={`text-[10px] mt-1 ${trialUrgent ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"}`}>
            Ver planos →
          </p>
        </div>
      )}
      {isTrialing && collapsed && (
        <div className="flex justify-center py-2" title={`Trial: ${trialDays} dias restantes`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${trialUrgent ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" : "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"}`}>
            {trialDays}
          </div>
        </div>
      )}

      {/* Footer - Credits + Plan */}
      {!collapsed ? (
        <div className="px-4 py-3 border-t border-sidebar-border space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Créditos</span>
            <span className="font-medium text-foreground">{mockWallet.currentBalance.toLocaleString("pt-BR")} / {mockWallet.totalIncluded.toLocaleString("pt-BR")}</span>
          </div>
          <Progress value={(mockWallet.currentBalance / mockWallet.totalIncluded) * 100} className="h-1.5" />
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 gap-1">
              <Zap className="w-2.5 h-2.5" />
              {mockSubscription.planName}
              {isTrialing && " · Trial"}
            </Badge>
          </div>
        </div>
      ) : (
        <div className="flex justify-center py-3 border-t border-sidebar-border">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
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
