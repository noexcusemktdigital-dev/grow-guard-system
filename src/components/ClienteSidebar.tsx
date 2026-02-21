import { useState } from "react";
import { NavLink as RouterNavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, CheckSquare, ChevronLeft, ChevronRight,
  Target, MessageCircle, Users, Bot, BookOpen, Send, BarChart3,
  Megaphone, Rocket, FileText, Share2, Globe, DollarSign,
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

const globalSection: SidebarItem[] = [
  { label: "Início", icon: LayoutDashboard, path: "/cliente/inicio" },
  { label: "Checklist", icon: CheckSquare, path: "/cliente/checklist" },
];

const vendasSection: SidebarItem[] = [
  { label: "Plano de Vendas", icon: Target, path: "/cliente/plano-vendas" },
  { label: "CRM", icon: Users, path: "/cliente/crm" },
  { label: "Chat", icon: MessageCircle, path: "/cliente/chat" },
  { label: "Agentes IA", icon: Bot, path: "/cliente/agentes-ia" },
  { label: "Scripts", icon: BookOpen, path: "/cliente/scripts" },
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
    <nav className="flex flex-col gap-px">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname.startsWith(item.path);
        return (
          <RouterNavLink
            key={item.path}
            to={item.path}
            className={`flex items-center gap-2.5 px-3 py-2 text-[13px] transition-all duration-150 rounded-lg mx-1.5
              ${collapsed ? "justify-center px-2" : ""}
              ${isActive
                ? "bg-primary/10 text-foreground font-semibold border-l-[3px] border-primary ml-0 pl-2.5"
                : "text-sidebar-foreground hover:text-foreground hover:bg-muted/50"
              }
            `}
            title={collapsed ? item.label : undefined}
          >
            <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
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
    return <SidebarNavItems items={items} collapsed={collapsed} />;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between cursor-pointer hover:bg-muted/30 rounded-md px-3 py-1.5 transition-colors mx-1.5">
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
            {title}
          </span>
          <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform duration-200 ${isOpen ? "" : "-rotate-90"}`} />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-0.5">
        <SidebarNavItems items={items} collapsed={collapsed} />
      </CollapsibleContent>
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
      className={`h-[calc(100vh-49px)] bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 sticky top-[49px] ${collapsed ? "w-[60px]" : "w-60"}`}
    >
      {/* Logo */}
      <div className={`flex items-center h-14 border-b border-sidebar-border ${collapsed ? "justify-center px-2" : "px-4"}`}>
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary flex-shrink-0">
            <span className="text-sm font-bold text-primary-foreground">N</span>
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold text-foreground tracking-tight">NOEXCUSE</span>
              <span className="text-[9px] text-muted-foreground -mt-0.5">Gestão Comercial</span>
            </div>
          )}
        </div>
      </div>

      {/* Menu */}
      <div className="flex-1 overflow-y-auto py-3 space-y-3">
        {/* Global items — no section header */}
        <SidebarNavItems items={globalSection} collapsed={collapsed} />

        <div className="mx-3 border-t border-sidebar-border" />

        <CollapsibleSection title="Vendas" items={vendasSection} collapsed={collapsed} defaultOpen />
        <CollapsibleSection title="Marketing" items={marketingSection} collapsed={collapsed} />
        <CollapsibleSection title="Sistema" items={sistemaSection} collapsed={collapsed} />
      </div>

      {/* Trial Banner */}
      {isTrialing && !collapsed && (
        <div
          className={`mx-2 mb-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${
            trialUrgent
              ? "bg-destructive/5 border-destructive/20"
              : "bg-amber-500/5 border-amber-500/20"
          }`}
          onClick={() => navigate("/cliente/plano-creditos")}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-[11px] font-semibold ${trialUrgent ? "text-destructive" : "text-amber-600 dark:text-amber-400"}`}>
              Trial · {trialDays} dias
            </span>
          </div>
          <Progress value={((14 - trialDays) / 14) * 100} className={`h-1 ${trialUrgent ? "[&>div]:bg-destructive" : "[&>div]:bg-amber-500"}`} />
          <p className={`text-[9px] mt-1 ${trialUrgent ? "text-destructive/70" : "text-amber-600/70 dark:text-amber-400/70"}`}>
            Ver planos →
          </p>
        </div>
      )}
      {isTrialing && collapsed && (
        <div className="flex justify-center py-2" title={`Trial: ${trialDays} dias`}>
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${trialUrgent ? "bg-destructive/10 text-destructive" : "bg-amber-500/10 text-amber-600 dark:text-amber-400"}`}>
            {trialDays}
          </div>
        </div>
      )}

      {/* Footer */}
      {!collapsed ? (
        <div className="px-3 py-2.5 border-t border-sidebar-border">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-muted-foreground">Créditos</span>
            <span className="font-medium text-foreground">{mockWallet.currentBalance.toLocaleString("pt-BR")}/{mockWallet.totalIncluded.toLocaleString("pt-BR")}</span>
          </div>
          <Progress value={(mockWallet.currentBalance / mockWallet.totalIncluded) * 100} className="h-1" />
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 gap-1 mt-1.5">
            <Zap className="w-2.5 h-2.5" />
            {mockSubscription.planName}{isTrialing && " · Trial"}
          </Badge>
        </div>
      ) : (
        <div className="flex justify-center py-2.5 border-t border-sidebar-border" title="Créditos">
          <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      )}

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-10 border-t border-sidebar-border text-muted-foreground hover:text-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>
    </aside>
  );
}
