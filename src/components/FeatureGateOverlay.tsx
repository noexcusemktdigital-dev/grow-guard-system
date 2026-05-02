import type { ElementType } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useFeatureGate } from "@/contexts/FeatureGateContext";
import { Lock, Zap, Crown, Target, Megaphone, ShieldAlert, MessageSquare, Users, BarChart3, PenTool, Globe, Send, Bot, Navigation, AlertOctagon } from "lucide-react";
import { Button } from "@/components/ui/button";

const toolDescriptions: Record<string, { label: string; desc: string; icon: ElementType }> = {
  "/cliente/chat": {
    label: "Conversas WhatsApp",
    desc: "Espelhe seu WhatsApp e gerencie todos os atendimentos da sua equipe em um só lugar. Envie mensagens, áudios, imagens e documentos direto do sistema.",
    icon: MessageSquare,
  },
  "/cliente/crm": {
    label: "CRM de Vendas",
    desc: "Gerencie seus leads, funis de vendas e pipeline comercial com automações inteligentes e acompanhamento em tempo real.",
    icon: Users,
  },
  "/cliente/trafego": {
    label: "Tráfego Pago",
    desc: "Acompanhe métricas de campanhas de Meta Ads e Google Ads em um dashboard unificado com análise de ROI.",
    icon: BarChart3,
  },
  "/cliente/conteudo": {
    label: "Conteúdo & Posts",
    desc: "Crie posts, legendas e artes com IA para Instagram, Facebook e outras redes sociais.",
    icon: PenTool,
  },
  "/cliente/sites": {
    label: "Sites & Landing Pages",
    desc: "Crie landing pages de alta conversão com IA para capturar leads e vender seus produtos.",
    icon: Globe,
  },
  "/cliente/disparos": {
    label: "Disparos em Massa",
    desc: "Envie mensagens em massa via WhatsApp para sua base de contatos com segmentação inteligente.",
    icon: Send,
  },
  "/cliente/agentes": {
    label: "Agentes de IA",
    desc: "Configure assistentes inteligentes que atendem seus clientes 24h por dia via WhatsApp com respostas personalizadas.",
    icon: Bot,
  },
};

function getToolInfo(pathname: string) {
  // Match exact or prefix
  for (const [path, info] of Object.entries(toolDescriptions)) {
    if (pathname === path || pathname.startsWith(path + "/")) return info;
  }
  return null;
}

export function FeatureGateOverlay() {
  const location = useLocation();
  const navigate = useNavigate();
  const { getGateReason } = useFeatureGate();

  const reason = getGateReason(location.pathname);
  if (!reason) return null;

  const config = {
    trial_expired: {
      icon: Crown,
      title: "Seu período de trial expirou",
      description:
        "Para continuar usando esta funcionalidade, escolha um plano e desbloqueie todo o potencial do NOEXCUSE.",
      cta: "Ver planos disponíveis",
      ctaPath: "/cliente/plano-creditos",
      accent: "from-primary/90 to-primary/70",
      iconBg: "bg-primary/15 text-primary",
    },
    no_credits: {
      icon: Zap,
      title: "Créditos insuficientes",
      description:
        "Você não tem créditos disponíveis para usar este recurso. Recarregue para continuar gerando conteúdo com IA.",
      cta: "Comprar créditos",
      ctaPath: "/cliente/plano-creditos",
      accent: "from-amber-500/90 to-orange-500/70",
      iconBg: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
    },
    no_gps_approved: {
      icon: Navigation,
      title: "Complete e aprove o GPS do Negócio",
      description:
        "Para desbloquear esta funcionalidade, preencha e aprove o GPS do Negócio — o diagnóstico estratégico que direciona toda a estratégia de vendas e marketing da plataforma.",
      cta: "Abrir GPS do Negócio",
      ctaPath: "/cliente/gps-negocio",
      accent: "from-amber-500/90 to-amber-600/70",
      iconBg: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
    },
    admin_only: {
      icon: ShieldAlert,
      title: "Acesso restrito ao administrador",
      description:
        "Esta funcionalidade é exclusiva para administradores da conta. Solicite acesso ao administrador da sua organização.",
      cta: "Voltar ao início",
      ctaPath: "/cliente/inicio",
      accent: "from-muted-foreground/30 to-muted-foreground/10",
      iconBg: "bg-muted text-muted-foreground",
    },
    trial_limited: {
      icon: Crown,
      title: "Recurso exclusivo dos planos pagos",
      description:
        "Este recurso não está disponível no período de teste. Faça upgrade para desbloquear Sites, Tráfego Pago, Disparos e muito mais!",
      cta: "Ver planos e fazer upgrade",
      ctaPath: "/cliente/plano-creditos",
      accent: "from-primary/90 to-primary/70",
      iconBg: "bg-primary/15 text-primary",
    },
    module_locked: {
      icon: Lock,
      title: "Módulo não contratado",
      description:
        "Você não possui este módulo no seu plano atual. Contrate o módulo de Vendas ou Marketing para desbloquear estas ferramentas.",
      cta: "Ver planos disponíveis",
      ctaPath: "/cliente/plano-creditos",
      accent: "from-primary/90 to-primary/70",
      iconBg: "bg-primary/15 text-primary",
    },
    payment_blocked: {
      icon: AlertOctagon,
      title: "Acesso suspenso por pagamento em atraso",
      description:
        "Sua mensalidade está em atraso há mais de 2 dias. Regularize o pagamento para restaurar o acesso completo a todas as ferramentas. O acesso é restaurado automaticamente em até 1 hora após a confirmação.",
      cta: "Regularizar pagamento agora",
      ctaPath: "/cliente/plano-creditos",
      accent: "from-red-500/90 to-red-600/70",
      iconBg: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
    },
  }[reason];

  const Icon = config.icon;
  const toolInfo = getToolInfo(location.pathname);
  const ToolIcon = toolInfo?.icon;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-background/40">
      <div className="relative max-w-lg w-full mx-4">
        {/* Glow effect */}
        <div
          className={`absolute -inset-1 rounded-2xl bg-gradient-to-br ${config.accent} opacity-20 blur-xl`}
        />

        <div className="relative bg-card/95 border border-border rounded-2xl p-8 text-center shadow-2xl space-y-5 backdrop-blur-md">
          {/* Tool info section */}
          {toolInfo && (
            <div className="bg-muted/50 rounded-xl p-4 space-y-2 border border-border/50">
              <div className="flex items-center justify-center gap-2">
                {ToolIcon && <ToolIcon className="w-5 h-5 text-primary" />}
                <span className="text-sm font-semibold text-foreground">{toolInfo.label}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{toolInfo.desc}</p>
            </div>
          )}

          {/* Icon */}
          <div className="flex justify-center">
            <div className={`w-14 h-14 rounded-2xl ${config.iconBg} flex items-center justify-center`}>
              <Icon className="w-7 h-7" />
            </div>
          </div>

          {/* Lock badge */}
          <div className="flex justify-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
              <Lock className="w-3 h-3" />
              Funcionalidade bloqueada
            </span>
          </div>

          {/* Text */}
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">{config.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {config.description}
            </p>
          </div>

          {/* CTA */}
          <Button
            size="lg"
            className="w-full font-semibold"
            onClick={() => navigate(config.ctaPath)}
          >
            {config.cta}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => navigate("/cliente/inicio")}
          >
            Voltar ao início
          </Button>
        </div>
      </div>
    </div>
  );
}
