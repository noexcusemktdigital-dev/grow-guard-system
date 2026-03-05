import { useLocation, useNavigate } from "react-router-dom";
import { useFeatureGate } from "@/contexts/FeatureGateContext";
import { Lock, Zap, Crown, Target, Megaphone, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    no_sales_plan: {
      icon: Target,
      title: "Complete o Plano de Vendas",
      description:
        "Para desbloquear esta funcionalidade, você precisa primeiro estruturar seu comercial completando o Plano de Vendas. Leva apenas alguns minutos!",
      cta: "Criar Plano de Vendas",
      ctaPath: "/cliente/plano-vendas",
      accent: "from-primary/90 to-primary/70",
      iconBg: "bg-primary/15 text-primary",
    },
    no_marketing_strategy: {
      icon: Megaphone,
      title: "Complete a Estratégia de Marketing",
      description:
        "Para desbloquear esta funcionalidade, complete primeiro sua Estratégia de Marketing. Ela guia toda a geração de conteúdo e artes com IA.",
      cta: "Criar Estratégia",
      ctaPath: "/cliente/plano-marketing",
      accent: "from-primary/90 to-primary/70",
      iconBg: "bg-primary/15 text-primary",
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
  }[reason];

  const Icon = config.icon;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-background/60">
      <div className="relative max-w-md w-full mx-4">
        {/* Glow effect */}
        <div
          className={`absolute -inset-1 rounded-2xl bg-gradient-to-br ${config.accent} opacity-20 blur-xl`}
        />

        <div className="relative bg-card border border-border rounded-2xl p-8 text-center shadow-2xl space-y-5">
          {/* Icon */}
          <div className="flex justify-center">
            <div className={`w-16 h-16 rounded-2xl ${config.iconBg} flex items-center justify-center`}>
              <Icon className="w-8 h-8" />
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
