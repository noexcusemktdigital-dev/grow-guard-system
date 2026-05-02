import React, { useState } from "react";
import logoWhite from "@/assets/logo-noexcuse-white.png";
import { NavLink as RouterNavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, CheckSquare, ChevronLeft, ChevronRight,
  Target, MessageCircle, Users, Bot, BookOpen, Send, BarChart3,
  Megaphone, Rocket, FileText, Share2, Globe, DollarSign,
  ChevronDown, Link, CreditCard, Settings, Zap, Lock, Trophy, ClipboardCheck,
  Headphones, Calendar, Video, Image, Navigation, BarChart2,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { WorkspaceSwitcher } from "@/components/WorkspaceSwitcher";
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
import { useOrgPermissions } from "@/hooks/useOrgPermissions";
import { getEffectiveLimits } from "@/constants/plans";
import { differenceInDays } from "date-fns";

interface SidebarItem {
  label: string;
  icon: React.ElementType;
  path: string;
  badgeKey?: string;
  adminOnly?: boolean;
  highlight?: boolean;
  /** When set, the item is only visible if the user has `module.<moduleKey>` granted (admins always see it). */
  moduleKey?: string;
}

const globalSection: SidebarItem[] = [
  { label: "Início", icon: LayoutDashboard, path: "/cliente/inicio" },
  { label: "Tarefas", icon: CheckSquare, path: "/cliente/checklist" },
  { label: "Agenda", icon: Calendar, path: "/cliente/agenda" },
  { label: "Gamificação", icon: Trophy, path: "/cliente/gamificacao" },
];

const gpsItem: SidebarItem = {
  label: "GPS do Negócio",
  icon: Navigation,
  path: "/cliente/gps-negocio",
  highlight: true,
};

const vendasSection: SidebarItem[] = [
  { label: "CRM", icon: Users, path: "/cliente/crm", moduleKey: "crm" },
  { label: "WhatsApp", icon: MessageCircle, path: "/cliente/chat", moduleKey: "whatsapp" },
  { label: "Agentes IA", icon: Bot, path: "/cliente/agentes-ia", moduleKey: "agentes_ia" },
  { label: "Scripts", icon: BookOpen, path: "/cliente/scripts", moduleKey: "roteiro" },
  { label: "Disparos", icon: Send, path: "/cliente/disparos", adminOnly: true, moduleKey: "disparos" },
  { label: "Relatórios", icon: BarChart3, path: "/cliente/dashboard", adminOnly: true, moduleKey: "relatorios" },
];

const marketingSection: SidebarItem[] = [
  { label: "Roteiros", icon: Video, path: "/cliente/conteudos", moduleKey: "roteiro" },
  { label: "Postagem", icon: Image, path: "/cliente/postagem", moduleKey: "postagem" },
  { label: "Redes Sociais", icon: Share2, path: "/cliente/redes-sociais", moduleKey: "redes_sociais" },
  { label: "Sites", icon: Globe, path: "/cliente/sites", moduleKey: "sites" },
  { label: "Tráfego Pago", icon: DollarSign, path: "/cliente/trafego-pago", adminOnly: true, moduleKey: "trafego_pago" },
];

const sistemaSection: SidebarItem[] = [
  { label: "Acompanhamento", icon: BarChart3, path: "/cliente/acompanhamento" },
  { label: "Avaliações", icon: ClipboardCheck, path: "/cliente/avaliacoes" },
  { label: "Suporte", icon: Headphones, path: "/cliente/suporte" },
  { label: "Integrações", icon: Link, path: "/cliente/integracoes", adminOnly: true },
  { label: "Plano & Créditos", icon: CreditCard, path: "/cliente/plano-creditos", badgeKey: "plano-creditos", adminOnly: true },
  { label: "Configurações", icon: Settings, path: "/cliente/configuracoes?tab=organizacao" },
] as SidebarItem[];

const GATE_REASON_LABELS: Record<string, string> = {
  trial_expired: "Trial expirado",
  trial_limited: "Disponível no plano pago",
  no_credits: "Sem créditos",
  no_gps_approved: "Complete e aprove o GPS do Negócio",
  admin_only: "Apenas administradores",
};

const SECTION_DOT_COLORS: Record<string, string> = {
  Vendas: "bg-red-400",
  Marketing: "bg-purple-400",
  Sistema: "bg-slate-400",
};

function NavItem({ item, collapsed, isGated, gateReason }: { item: SidebarItem; collapsed: boolean; isGated: boolean; gateReason: string | null }) {
  const location = useLocation();
  const { level } = useCreditAlert();
  const Icon = item.icon;
  const basePath = item.path.split("?")[0];
  const isActive = location.pathname === basePath || (basePath !== "/cliente/inicio" && location.pathname.startsWith(basePath + "/"));
  const isHighlight = item.highlight;

  const showBadge = item.badgeKey === "plano-creditos" && (level === "warning" || level === "critical" || level === "zero");

  const link = (
    <RouterNavLink
      to={isGated ? "#" : item.path}
      onClick={isGated ? (e: React.MouseEvent) => { e.preventDefault(); import("sonner").then(m => m.toast.warning(gateReason ? GATE_REASON_LABELS[gateReason] || "Recurso bloqueado" : "Recurso bloqueado")); } : undefined}
      className={`group flex items-center gap-2.5 px-3 py-[7px] text-[13px] transition-colors duration-200 rounded-lg mx-1.5
        ${collapsed ? "justify-center px-2 mx-1" : ""}
        ${isGated ? "opacity-40 cursor-not-allowed" : ""}
        ${isHighlight && !isGated
          ? isActive
            ? "bg-amber-500/20 text-amber-300 font-semibold shadow-[inset_0_0_16px_rgba(245,158,11,0.08)]"
            : "text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 font-medium"
          : isActive && !isGated
            ? "bg-sidebar-primary/10 text-white font-medium shadow-[inset_0_0_12px_rgba(99,102,241,0.08)]"
            : "text-sidebar-foreground hover:text-white hover:bg-white/[0.06]"
        }
      `}
    >
      <div className="relative">
        <Icon className={`w-[18px] h-[18px] flex-shrink-0 transition-transform duration-200 ${
          isHighlight && !isGated ? "text-amber-400" :
          isActive && !isGated ? "text-sidebar-primary" : "text-sidebar-muted group-hover:text-sidebar-foreground"
        } group-hover:translate-x-0.5`} />
        {isActive && !isGated && (
          <div className={`absolute -left-[13px] top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full ${isHighlight ? "bg-gradient-to-b from-amber-400 to-amber-500" : "bg-gradient-to-b from-sidebar-primary to-indigo-500"}`} />
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

  if (isGated && !collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" className="text-xs font-medium">
          {gateReason ? GATE_REASON_LABELS[gateReason] || "Recurso bloqueado" : "Recurso bloqueado"}
        </TooltipContent>
      </Tooltip>
    );
  }

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" className="text-xs font-medium">
          {item.label}{isGated && gateReason ? ` · ${GATE_REASON_LABELS[gateReason]}` : ""}
        </TooltipContent>
      </Tooltip>
    );
  }

  return link;
}

function SidebarNavItems({ items, collapsed }: { items: SidebarItem[]; collapsed: boolean }) {
  const { getGateReason } = useFeatureGate();
  const { isAdmin } = useRoleAccess();
  const { can, isAdmin: isOrgAdmin } = useOrgPermissions();

  const visibleItems = items.filter((item) => {
    if (item.adminOnly && !isAdmin) return false;
    // Module-level gating: admins always see; non-admins need module.<key> granted
    if (item.moduleKey && !isOrgAdmin && !isAdmin) {
      if (!can(`module.${item.moduleKey}`)) return false;
    }
    return true;
  });

  return (
    <nav className="flex flex-col gap-[2px]">
      {visibleItems.map((item) => {
        const reason = getGateReason(item.path);
        return (
          <NavItem
            key={item.path}
            item={item}
            collapsed={collapsed}
            isGated={!!reason}
            gateReason={reason}
          />
        );
      })}
    </nav>
  );
}

function GPSNavCard({ collapsed }: { collapsed: boolean }) {
  const { getGateReason } = useFeatureGate();
  const reason = getGateReason(gpsItem.path);
  const isGated = !!reason;

  if (collapsed) {
    return (
      <div className="py-1">
        <SidebarNavItems items={[gpsItem]} collapsed={collapsed} />
      </div>
    );
  }

  return (
    <div className="mx-2.5 p-1 rounded-xl border border-amber-500/20 bg-amber-500/[0.04]">
      <NavItem item={gpsItem} collapsed={collapsed} isGated={isGated} gateReason={reason} />
    </div>
  );
}

function CollapsibleSection({ title, items, collapsed, defaultOpen = false }: { title: string; items: SidebarItem[]; collapsed: boolean; defaultOpen?: boolean }) {
  const location = useLocation();
  const isActive = items.some(item => { const bp = item.path.split("?")[0]; return location.pathname === bp || location.pathname.startsWith(bp + "/"); });
  const [isOpen, setIsOpen] = useState(defaultOpen || isActive);

  const dotColor = SECTION_DOT_COLORS[title] || "bg-slate-400";

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
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-sidebar-muted group-hover:text-sidebar-foreground transition-colors">
              {title}
            </span>
          </div>
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
  const isTrial = subscription?.status === "trial";
  const planId = subscription?.plan as string | null;
  const limits = getEffectiveLimits(planId, isTrial);
  const totalIncluded = limits.totalCredits || 500;
  const creditPercent = totalIncluded > 0 ? (currentBalance / totalIncluded) * 100 : 0;
  const planLabel = isTrial ? "Trial" : (planId ? planId.charAt(0).toUpperCase() + planId.slice(1) : "—");
  const creditLow = creditPercent < 25;

  return (
    <>
      {/* Logo */}
      <div className={`flex items-center h-16 border-b border-white/[0.06] ${collapsed ? "justify-center px-2" : "px-4"}`}>
        <div className="flex items-center gap-2.5">
          <img src={logoWhite} alt="NOEXCUSE" className={`object-contain flex-shrink-0 ${collapsed ? "h-7 w-7" : "h-9"}`} />
        </div>
      </div>

      {/* Workspace Switcher */}
      <WorkspaceSwitcher collapsed={collapsed} />

      {/* Menu */}
      <div className="flex-1 overflow-y-auto py-3 space-y-4">
        <div data-tour="global">
          <SidebarNavItems items={globalSection} collapsed={collapsed} />
        </div>
        {/* GPS do Negócio — destaque isolado como card */}
        <div className="mx-3 border-t border-white/[0.06]" />
        <div data-tour="gps">
          <GPSNavCard collapsed={collapsed} />
        </div>
        <div className="mx-3 border-t border-white/[0.06]" />
        <div data-tour="vendas">
          <CollapsibleSection title="Vendas" items={vendasSection} collapsed={collapsed} defaultOpen />
        </div>
        <div data-tour="marketing">
          <CollapsibleSection title="Marketing" items={marketingSection} collapsed={collapsed} defaultOpen />
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
        <div className="px-3 py-3 border-t border-white/[0.06]" data-tour="creditos">
          {walletLoading || subLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-3 w-full bg-white/10" />
              <Skeleton className="h-1.5 w-full bg-white/10" />
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
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    creditLow ? "bg-gradient-to-r from-red-500 to-amber-400 animate-shimmer bg-[length:200%_100%]" : "bg-sidebar-primary"
                  }`}
                  style={{ width: `${creditPercent}%` }}
                />
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <Badge variant="outline" className="text-[9px] px-2 py-0 h-[18px] gap-1 border-white/[0.08] text-sidebar-foreground rounded-full">
                  <Zap className="w-2.5 h-2.5 text-sidebar-primary" />
                  {planLabel}{isTrialing && " · Trial"}
                </Badge>
              </div>
            </>
          )}
        </div>
      ) : (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <div className="flex justify-center py-3 border-t border-white/[0.06] cursor-default">
              <div className="relative">
                <CreditCard className="h-3.5 w-3.5 text-sidebar-muted" />
                {creditLow && (
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

      {/* Collapse button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-10 border-t border-white/[0.06] text-sidebar-muted hover:text-white transition-colors duration-200"
      >
        <div className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/[0.06] transition-colors">
          {collapsed
            ? <ChevronRight className="w-3.5 h-3.5" />
            : <ChevronLeft className="w-3.5 h-3.5" />
          }
        </div>
      </button>
    </>
  );
}

export function ClienteSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`h-[calc(100vh-56px)] bg-gradient-to-b from-[hsl(225,20%,9%)] to-[hsl(225,20%,5%)] border-r border-white/[0.04] flex-col transition-all duration-300 ease-out sticky top-14 hidden md:flex ${collapsed ? "w-[60px]" : "w-[256px]"}`}
    >
      <ClienteSidebarContent collapsed={collapsed} setCollapsed={setCollapsed} />
    </aside>
  );
}
