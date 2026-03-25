import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Rocket, Target, Megaphone, CheckSquare, CreditCard, Bell, X } from "lucide-react";

const STORAGE_KEY = "onboarding_tour_done";

interface TourStep {
  icon: React.ElementType;
  title: string;
  description: string;
  target?: string; // data-tour selector
  position?: "right" | "bottom" | "center";
}

const STEPS: TourStep[] = [
  {
    icon: Rocket,
    title: "Bem-vindo à plataforma! 🚀",
    description: "Vamos fazer um tour rápido pelas principais áreas para você aproveitar ao máximo.",
    position: "center",
  },
  {
    icon: Target,
    title: "Módulo Comercial",
    description: "Gerencie seus leads no CRM, configure Agentes de IA para atendimento automático, crie scripts de vendas e faça disparos em massa.",
    target: "vendas",
    position: "right",
  },
  {
    icon: Megaphone,
    title: "Módulo Marketing",
    description: "Crie estratégias, gere conteúdos e artes com IA, publique sites e gerencie campanhas de tráfego pago.",
    target: "marketing",
    position: "right",
  },
  {
    icon: CheckSquare,
    title: "Checklist & Gamificação",
    description: "Complete tarefas diárias para ganhar XP e subir de nível. Acompanhe sua evolução e conquiste badges exclusivos.",
    target: "global",
    position: "right",
  },
  {
    icon: CreditCard,
    title: "Créditos & Plano",
    description: "Cada ação de IA consome créditos. Acompanhe seu saldo aqui e escolha o plano ideal para o seu negócio.",
    target: "creditos",
    position: "right",
  },
  {
    icon: Bell,
    title: "Suporte & Notificações",
    description: "Acesse o suporte, veja notificações importantes e configure seu perfil no canto superior direito.",
    target: "header-actions",
    position: "bottom",
  },
];

export function OnboardingTour({ enabled = true, onComplete }: { enabled?: boolean; onComplete?: () => void }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({});
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) {
      const timer = setTimeout(() => setOpen(true), 1000);
      return () => clearTimeout(timer);
    } else {
      // Already completed — signal parent immediately
      onComplete?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  const positionTooltip = useCallback(() => {
    const current = STEPS[step];
    if (!current.target || current.position === "center") {
      setTooltipStyle({
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      });
      setHighlightStyle({ display: "none" });
      return;
    }

    const el = document.querySelector(`[data-tour="${current.target}"]`);
    if (!el) {
      setTooltipStyle({
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      });
      setHighlightStyle({ display: "none" });
      return;
    }

    const rect = el.getBoundingClientRect();
    const padding = 6;

    setHighlightStyle({
      position: "fixed",
      top: rect.top - padding,
      left: rect.left - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
      borderRadius: 12,
      display: "block",
    });

    if (current.position === "right") {
      setTooltipStyle({
        position: "fixed",
        top: Math.max(16, Math.min(rect.top, window.innerHeight - 280)),
        left: rect.right + 16,
      });
    } else if (current.position === "bottom") {
      setTooltipStyle({
        position: "fixed",
        top: rect.bottom + 12,
        left: Math.max(16, rect.left - 80),
      });
    }
  }, [step]);

  useEffect(() => {
    if (!open) return;
    positionTooltip();
    window.addEventListener("resize", positionTooltip);
    return () => window.removeEventListener("resize", positionTooltip);
  }, [open, step, positionTooltip]);

  const handleClose = () => {
    setOpen(false);
    localStorage.setItem(STORAGE_KEY, "true");
    onComplete?.();
  };

  const handleNext = () => {
    if (step === STEPS.length - 1) {
      handleClose();
    } else {
      setStep(step + 1);
    }
  };

  const handlePrev = () => {
    if (step > 0) setStep(step - 1);
  };

  if (!open) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isCenter = current.position === "center" || !current.target;
  const Icon = current.icon;

  return createPortal(
    <div className="fixed inset-0 z-[9999]">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 transition-opacity duration-300"
        onClick={handleClose}
      />

      {/* Highlight cutout */}
      {highlightStyle.display !== "none" && (
        <div
          style={highlightStyle}
          className="absolute z-[1] border-2 border-primary/60 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] pointer-events-none transition-all duration-300"
        />
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        style={tooltipStyle}
        className={`z-[2] w-80 bg-card border border-border rounded-2xl shadow-2xl p-5 space-y-3 transition-all duration-300 ${
          isCenter ? "" : "animate-in fade-in-0 slide-in-from-left-3"
        }`}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon + Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold">{current.title}</h3>
            <p className="text-[10px] text-muted-foreground">
              Passo {step + 1} de {STEPS.length}
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground leading-relaxed">{current.description}</p>

        {/* Progress dots */}
        <div className="flex items-center gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? "w-6 bg-primary" : i < step ? "w-1.5 bg-primary/40" : "w-1.5 bg-muted-foreground/20"
              }`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-1">
          <Button variant="ghost" size="sm" onClick={handleClose} className="text-[11px] text-muted-foreground h-8 px-2">
            Pular tour
          </Button>
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="outline" size="sm" onClick={handlePrev} className="text-xs h-8">
                Anterior
              </Button>
            )}
            <Button size="sm" onClick={handleNext} className="text-xs h-8">
              {isLast ? "Começar! 🎉" : "Próximo"}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
