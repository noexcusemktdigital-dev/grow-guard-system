import { useState } from "react";
import logoWhite from "@/assets/logo-noexcuse-white.png";
import { NavLink as RouterNavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, CheckSquare, ChevronLeft, ChevronRight,
  Target, MessageCircle, Users, Bot, BookOpen, Send, BarChart3,
  Megaphone, Rocket, FileText, Share2, Globe, DollarSign,
  ChevronDown, Link, CreditCard, Settings, Zap, Lock, Trophy, ClipboardCheck,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useClienteSubscription } from "@/hooks/useClienteSubscription";
import { useClienteWallet } from "@/hooks/useClienteWallet";
import { useFeatureGate } from "@/contexts/FeatureGateContext";
import { useCreditAlert } from "@/hooks/useCreditAlert";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { getPlanBySlug } from "@/constants/plans";
import { differenceInDays } from "date-fns";

interface SidebarItem {
  label: string;
  icon: React.ElementType;
  path: string;
  badgeKey?: string;
  adminOnly?: boolean;
}

const globalSection: SidebarItem[] = [
  { label: "Início", icon: LayoutDashboard, path: "/cliente/inicio" },
  { label: "Comunicados", icon: Megaphone, path: "/cliente/comunicados" },
  { label: "Checklist", icon: CheckSquare, path: "/cliente/checklist" },
  { label: "Gamificação", icon: Trophy, path: "/cliente/gamificacao" },
];

const vendasSection: SidebarItem[] = [
  { label: "Plano de Vendas", icon: Target, path: "/cliente/plano-vendas" },
  { label: "CRM", icon: Users, path: "/cliente/crm" },
  { label: "Conversas", icon: MessageCircle, path: "/cliente/chat" },
  { label: "Agentes IA", icon: Bot, path: "/cliente/agentes-ia" },
  { label: "Scripts", icon: BookOpen, path: "/cliente/scripts" },
  { label: "Disparos", icon: Send, path: "/cliente/disparos", adminOnly: true },
  { label: "Relatórios", icon: BarChart3, path: "/cliente/dashboard", adminOnly: true },
];

const marketingSection: SidebarItem[] = [
  
  { label: "Estratégia", icon: Megaphone, path: "/cliente/plano-marketing" },
  { label: "Conteúdos", icon: FileText, path: "/cliente/conteudos" },
  { label: "Redes Sociais", icon: Share2, path: "/cliente/redes-sociais" },
  { label: "Sites", icon: Globe, path: "/cliente/sites" },
  { label: "Tráfego Pago", icon: DollarSign, path: "/cliente/trafego-pago", adminOnly: true },
];

const sistemaSection: SidebarItem[] = [
  { label: "Avaliações", icon: ClipboardCheck, path: "/cliente/avaliacoes" },
  { label: "Integrações", icon: Link, path: "/cliente/integracoes", adminOnly: true },
  { label: "Plano & Créditos", icon: CreditCard, path: "/cliente/plano-creditos", badgeKey: "plano-creditos", adminOnly: true },
  { label: "Configurações", icon: Settings, path: "/cliente/configuracoes" },
] as SidebarItem[];

function NavItem({ item, collapsed, isGated }: { item: SidebarItem; collapsed: boolean; isGated: boolean }) {
  const location = useLocation();
  const { level } = useCreditAlert();
  const Icon = item.icon;
  const isActive = location.pathname.startsWith(item.path);

  const showBadge = item.badgeKey === "plano-creditos" && (level === "warning" || level === "critical" || level === "zero");

  const link = (
    <RouterNavLink
      to={item.path}
      className={`group flex items-center gap-2.5 px-3 py-[7px] text-[13px] transition-all duration-200 rounded-lg mx-1.5
        ${collapsed ? "justify-center px-2 mx-1" : ""}
        ${isGated ? "opacity-40 pointer-events-auto" : ""}
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
      {!collapsed && (
        <>
          <span className="truncate flex-1">{item.label}</span>
          {showBadge && (
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
              level === "warning" ? "bg-amber-400" : "bg-destructive"
            }`} />
          )}
          {isGated && <Lock className="w-3 h-3 text-sidebar-muted" />}
        </>
      )}
    </RouterNavLink>
  );

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" className="text-xs font-medium">
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return link;
}

function SidebarNavItems({ items, collapsed }: { items: SidebarItem[]; collapsed: boolean }) {
  const { getGateReason } = useFeatureGate();
  const { isAdmin } = useRoleAccess();

  // Filter out admin-only items for non-admin users
  const visibleItems = items.filter((item) => !item.adminOnly || isAdmin);

  return (
    <nav className="flex flex-col gap-[2px]">
      {visibleItems.map((item) => (
        <NavItem
          key={item.path}
          item={item}
          collapsed={collapsed}
          isGated={!!getGateReason(item.path)}
        />
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

export function ClienteSidebarContent({ collapsed, setCollapsed }: { collapsed: boolean; setCollapsed: (v: boolean) => void }) {
  const navigate = useNavigate();
  const { simulateTrialExpired, setSimulateTrialExpired, simulateNoCredits, setSimulateNoCredits } = useFeatureGate();

  const { data: subscription, isLoading: subLoading } = useClienteSubscription();
  const { data: wallet, isLoading: walletLoading } = useClienteWallet();

  const isTrialing = subscription?.status === "trial";
  const trialDays = subscription?.expires_at
    ? Math.max(0, differenceInDays(new Date(subscription.expires_at), new Date()))
    : 0;
  const trialUrgent = trialDays <= 3;

  const currentBalance = wallet?.balance ?? 0;
  const planConfig = getPlanBySlug(subscription?.plan);
  const totalIncluded = planConfig?.credits ?? 2000;
  const creditPercent = totalIncluded > 0 ? (currentBalance / totalIncluded) * 100 : 0;
  const planName = subscription?.plan ?? "—";

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
        <div data-tour="global">
          <SidebarNavItems items={globalSection} collapsed={collapsed} />
        </div>
        <div className="mx-3 border-t border-sidebar-border/60" />
        <div data-tour="vendas">
          <CollapsibleSection title="Vendas" items={vendasSection} collapsed={collapsed} defaultOpen />
        </div>
        <div data-tour="marketing">
          <CollapsibleSection title="Marketing" items={marketingSection} collapsed={collapsed} />
        </div>
        <div data-tour="sistema">
          <CollapsibleSection title="Sistema" items={sistemaSection} collapsed={collapsed} />
        </div>
      </div>

      {/* Trial Banner */}
      {isTrialing && !collapsed && (
        <div
          className={`mx-2.5 mb-2 p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:scale-[1.01] ${
            trialUrgent
              ? "bg-red-500/8 border-red-500/15"
              : "bg-amber-500/8 border-amber-500/15"
          }`}
          onClick={() => navigate("/cliente/plano-creditos")}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className={`text-[11px] font-semibold ${trialUrgent ? "text-red-400" : "text-amber-400"}`}>
              Trial · {trialDays} dias restantes
            </span>
          </div>
          <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${trialUrgent ? "bg-red-400" : "bg-amber-400"}`}
              style={{ width: `${((14 - trialDays) / 14) * 100}%` }}
            />
          </div>
          <p className={`text-[9px] mt-1.5 ${trialUrgent ? "text-red-400/60" : "text-amber-400/60"}`}>
            Ver planos →
          </p>
        </div>
      )}
      {isTrialing && collapsed && (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <div className="flex justify-center py-2 cursor-pointer" onClick={() => navigate("/cliente/plano-creditos")}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${trialUrgent ? "bg-red-500/15 text-red-400" : "bg-amber-500/15 text-amber-400"}`}>
                {trialDays}
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">Trial: {trialDays} dias</TooltipContent>
        </Tooltip>
      )}

      {/* Footer — Credits */}
      {!collapsed ? (
        <div className="px-3 py-3 border-t border-sidebar-border" data-tour="creditos">
          {walletLoading || subLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-3 w-full bg-white/10" />
              <Skeleton className="h-1 w-full bg-white/10" />
              <Skeleton className="h-[18px] w-24 bg-white/10" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <span className="text-sidebar-muted">Créditos</span>
                <span className="font-medium text-white/90 tabular-nums">
                  {currentBalance.toLocaleString("pt-BR")}/{totalIncluded.toLocaleString("pt-BR")}
                </span>
              </div>
              <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-sidebar-primary transition-all duration-500"
                  style={{ width: `${creditPercent}%` }}
                />
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <Badge variant="outline" className="text-[9px] px-2 py-0 h-[18px] gap-1 border-sidebar-border text-sidebar-foreground rounded-full">
                  <Zap className="w-2.5 h-2.5 text-sidebar-primary" />
                  {planName}{isTrialing && " · Trial"}
                </Badge>
              </div>
            </>
          )}
        </div>
      ) : (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <div className="flex justify-center py-3 border-t border-sidebar-border cursor-default">
              <div className="relative">
                <CreditCard className="h-3.5 w-3.5 text-sidebar-muted" />
                {creditPercent < 25 && (
                  <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-red-400" />
                )}
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">
            Créditos: {currentBalance}/{totalIncluded}
          </TooltipContent>
        </Tooltip>
      )}

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-10 border-t border-sidebar-border text-sidebar-muted hover:text-white hover:bg-white/[0.03] transition-all duration-200"
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>
    </>
  );
}

export function ClienteSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`h-[calc(100vh-56px)] bg-sidebar flex-col transition-all duration-300 ease-out sticky top-14 hidden md:flex ${collapsed ? "w-[60px]" : "w-[240px]"}`}
    >
      <ClienteSidebarContent collapsed={collapsed} setCollapsed={setCollapsed} />
    </aside>
  );
}
