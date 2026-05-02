import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Rocket, TrendingUp, FolderOpen, Building2, Settings, X } from "lucide-react";

const STORAGE_KEY = "franqueado_tour_done";

interface TourStep {
  icon: React.ElementType;
  title: string;
  description: string;
  target?: string;
  position?: "right" | "bottom" | "center";
}

const STEPS: TourStep[] = [
  {
    icon: Rocket,
    title: "Bem-vindo ao painel! 🚀",
    description: "Vamos fazer um tour rápido pelas principais áreas para você aproveitar ao máximo sua unidade.",
    position: "center",
  },
  {
    icon: TrendingUp,
    title: "Comercial",
    description: "Gerencie seus leads no CRM de vendas, use prospecção com IA, crie estratégias comerciais e gere propostas profissionais.",
    target: "comercial",
    position: "right",
  },
  {
    icon: FolderOpen,
    title: "Marketing & Academy",
    description: "Acesse materiais de marketing da franqueadora e treinamentos do NOE Academy para se capacitar.",
    target: "marketing",
    position: "right",
  },
  {
    icon: Building2,
    title: "Gestão",
    description: "Administre sua unidade, controle financeiro e gerencie contratos com seus clientes.",
    target: "gestao",
    position: "right",
  },
  {
    icon: Settings,
    title: "Suporte & Configurações",
    description: "Acesse o suporte da rede, configure seu perfil e personalize as opções da sua unidade.",
    position: "center",
  },
];

export function FranqueadoTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({});
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;

    // Wait for welcome modal to be dismissed before showing tour
    const welcomeKey = "franqueado_welcome_seen";
    if (localStorage.getItem(welcomeKey)) {
      const timer = setTimeout(() => setOpen(true), 1000);
      return () => clearTimeout(timer);
    }

    const interval = setInterval(() => {
      if (localStorage.getItem(welcomeKey)) {
        clearInterval(interval);
        setTimeout(() => setOpen(true), 500);
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const positionTooltip = useCallback(() => {
    const current = STEPS[step];
    if (!current.target || current.position === "center") {
      setTooltipStyle({ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)" });
      setHighlightStyle({ display: "none" });
      return;
    }

    const el = document.querySelector(`[data-tour="${current.target}"]`);
    if (!el) {
      setTooltipStyle({ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)" });
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
  };

  const handleNext = () => {
    if (step === STEPS.length - 1) handleClose();
    else setStep(step + 1);
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
      <div className="absolute inset-0 bg-black/60 transition-opacity duration-300" onClick={handleClose} />

      {highlightStyle.display !== "none" && (
        <div
          style={highlightStyle}
          className="absolute z-[1] border-2 border-primary/60 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] pointer-events-none transition-all duration-300"
        />
      )}

      <div
        ref={tooltipRef}
        style={tooltipStyle}
        className={`z-[2] w-80 bg-card border border-border rounded-2xl shadow-2xl p-5 space-y-3 transition-all duration-300 ${
          isCenter ? "" : "animate-in fade-in-0 slide-in-from-left-3"
        }`}
      >
        <button onClick={handleClose} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold">{current.title}</h3>
            <p className="text-[10px] text-muted-foreground">Passo {step + 1} de {STEPS.length}</p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">{current.description}</p>

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

        <div className="flex items-center justify-between pt-1">
          <Button variant="ghost" size="sm" onClick={handleClose} className="text-[11px] text-muted-foreground h-8 px-2">
            Pular tour
          </Button>
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="outline" size="sm" onClick={handlePrev} className="text-xs h-8">Anterior</Button>
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
