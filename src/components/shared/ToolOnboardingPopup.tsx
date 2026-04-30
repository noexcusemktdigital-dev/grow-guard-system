import { useState, useEffect } from "react";
import { X, ArrowRight, ArrowLeft, Check, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

export type ToolKey = "crm" | "trafego" | "sites" | "postagem" | "roteiro";

interface OrgProfile {
  segment?: string;
  size?: string;
  name?: string;
}

interface ToolOnboardingProps {
  tool: ToolKey;
  storageKey: string;
  orgProfile?: OrgProfile;
}

interface ToolConfig {
  title: (org: OrgProfile) => string;
  subtitle?: (org: OrgProfile) => string;
  steps: string[];
  tip: (org: OrgProfile) => string;
  cta_text: string;
  cta_url: string;
}

const TOOL_ONBOARDING: Record<ToolKey, ToolConfig> = {
  crm: {
    title: (org) => `Como o CRM vai organizar os leads da ${org.name || "sua empresa"}`,
    subtitle: () => "Centralize seus contatos e nunca mais perca uma oportunidade",
    steps: [
      "Crie seus funis de vendas no painel de Configurações",
      "Importe seus contatos via planilha ou adicione manualmente",
      "Configure automações para não perder nenhum lead",
      "Use a roleta para distribuir leads entre sua equipe",
    ],
    tip: (org) =>
      `Para negócios como ${org.name || "o seu"}, o ideal é ter pelo menos 3 etapas no funil: Novo Lead → Em negociação → Fechado.`,
    cta_text: "Criar meu primeiro funil",
    cta_url: "/cliente/crm",
  },
  trafego: {
    title: () => "Como o Tráfego Pago vai gerar leads para você",
    subtitle: () => "Conecte suas contas e tenha métricas em tempo real",
    steps: [
      "Conecte sua conta Meta Ads ao sistema",
      "Sync automático das suas campanhas e métricas",
      "A IA analisa seus dados e sugere otimizações",
      "Gere estratégias de campanha baseadas nos seus resultados reais",
    ],
    tip: () => "Com a conta conectada, você vê CPL, CTR e investimento em tempo real.",
    cta_text: "Conectar Meta Ads",
    cta_url: "/cliente/trafego-pago",
  },
  sites: {
    title: (org) => `Crie o site da ${org.name || "sua empresa"} em minutos`,
    subtitle: () => "Construtor de sites com IA e publicação imediata",
    steps: [
      "Escolha um modelo de site adaptado ao seu segmento",
      "Edite seções, textos e imagens com poucos cliques",
      "A IA sugere copy e estrutura baseadas no seu GPS",
      "Publique e compartilhe o link com seus clientes",
    ],
    tip: (org) =>
      org.segment
        ? `Vamos sugerir layouts pensados para o segmento: ${org.segment}.`
        : "Preencha seu segmento nas configurações para layouts mais personalizados.",
    cta_text: "Criar meu site",
    cta_url: "/cliente/sites",
  },
  postagem: {
    title: (org) => `Criando conteúdo para a ${org.name || "sua empresa"} com IA`,
    subtitle: () => "Copy + arte + agendamento, tudo no mesmo lugar",
    steps: [
      "Defina seu estilo e identidade visual nas configurações",
      "A IA cria copies e artes baseadas no seu GPS do Negócio",
      "Aprove, edite e publique direto nas redes sociais",
      "Agende posts para a semana toda em minutos",
    ],
    tip: () =>
      "Quanto mais informações no seu GPS, mais personalizado fica o conteúdo gerado.",
    cta_text: "Criar meu primeiro post",
    cta_url: "/cliente/postagem",
  },
  roteiro: {
    title: (org) => `Roteiros de vídeo para a ${org.name || "sua empresa"}`,
    subtitle: () => "Estruturas prontas para Reels, Shorts e TikTok",
    steps: [
      "Escolha o formato do vídeo (Reels, Shorts, VSL...)",
      "A IA cria o roteiro baseado no seu nicho e tom de voz",
      "Edite ganchos, falas e CTAs com sugestões inteligentes",
      "Exporte e grave seguindo o passo a passo",
    ],
    tip: (org) =>
      org.segment
        ? `Vamos otimizar os ganchos para o público de ${org.segment}.`
        : "Os melhores roteiros começam com um gancho forte nos primeiros 3 segundos.",
    cta_text: "Criar meu primeiro roteiro",
    cta_url: "/cliente/roteiro",
  },
};

export function ToolOnboardingPopup({ tool, storageKey, orgProfile }: ToolOnboardingProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  const config = TOOL_ONBOARDING[tool];
  const org = orgProfile || {};

  useEffect(() => {
    const jaViu = localStorage.getItem(storageKey);
    if (!jaViu) {
      const t = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(t);
    }
  }, [storageKey]);

  if (!config) return null;

  const totalSteps = config.steps.length;
  const isLast = step === totalSteps - 1;

  const handleClose = () => {
    localStorage.setItem(storageKey, "1");
    setOpen(false);
  };

  const handleNext = () => {
    if (isLast) {
      handleClose();
      navigate(config.cta_url);
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => setStep((s) => Math.max(0, s - 1));

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
      style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.55)" }}
      onClick={handleClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="relative w-full max-w-xl bg-background border border-border/60 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors"
          aria-label="Fechar"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border/40">
          <div className="flex items-center gap-2 text-xs font-medium text-primary mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Bem-vindo à ferramenta</span>
          </div>
          <h2 className="text-xl font-semibold text-foreground leading-snug">
            {config.title(org)}
          </h2>
          {config.subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{config.subtitle(org)}</p>
          )}
        </div>

        {/* Progress */}
        <div className="px-6 pt-4">
          <div className="flex items-center gap-1.5">
            {config.steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i <= step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            Passo {step + 1} de {totalSteps}
          </p>
        </div>

        {/* Step content */}
        <div className="px-6 py-5 min-h-[180px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                  {step + 1}
                </div>
                <p className="text-base text-foreground leading-relaxed pt-1.5">
                  {config.steps[step]}
                </p>
              </div>

              {isLast && (
                <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
                  <p className="text-xs font-medium text-primary mb-1">💡 Dica</p>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {config.tip(org)}
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 pt-3 border-t border-border/40 flex items-center justify-between gap-3">
          <button
            onClick={step === 0 ? handleClose : handleBack}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            {step === 0 ? (
              "Pular"
            ) : (
              <>
                <ArrowLeft className="w-3.5 h-3.5" />
                Voltar
              </>
            )}
          </button>

          <button
            onClick={handleNext}
            className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors px-4 py-2 rounded-lg text-sm font-medium shadow-sm"
          >
            {isLast ? (
              <>
                <Check className="w-4 h-4" />
                {config.cta_text}
              </>
            ) : (
              <>
                Próximo
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default ToolOnboardingPopup;
