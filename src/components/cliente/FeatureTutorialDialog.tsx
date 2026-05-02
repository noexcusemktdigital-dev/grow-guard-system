import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ChevronLeft, ChevronRight, Lightbulb, Sparkles, Target } from "lucide-react";
import type { FeatureTutorial } from "@/constants/featureTutorials";
import { useStrategyData } from "@/hooks/useStrategyData";
import { getPersonalizedTips } from "@/utils/personalizedTutorialTips";

interface FeatureTutorialDialogProps {
  tutorial: FeatureTutorial;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TAB_LABELS = ["O que é", "Como usar", "Benefícios", "Para você"];

export function FeatureTutorialDialog({ tutorial, open, onOpenChange }: FeatureTutorialDialogProps) {
  const [step, setStep] = useState(0);
  const totalSteps = 4;
  const strategyData = useStrategyData();
  const personalizedTips = getPersonalizedTips(tutorial.slug, strategyData);
  const hasPersonalized = personalizedTips.length > 0;

  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  const handleClose = () => {
    localStorage.setItem(`feature_tutorial_${tutorial.slug}_seen`, "1");
    onOpenChange(false);
  };

  const Icon = tutorial.icon;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-6 pt-6 pb-4">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg">{tutorial.title}</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">{tutorial.subtitle}</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          {/* Step indicators */}
          <div className="flex items-center gap-2 mt-4">
            {TAB_LABELS.map((label, i) => (
              <button
                key={label}
                onClick={() => setStep(i)}
                className={`text-[10px] font-semibold px-3 py-1.5 rounded-full transition-all flex items-center gap-1 ${
                  step === i
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted"
                }`}
              >
                {i === 3 && <Sparkles className="w-3 h-3" />}
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 min-h-[240px]">
          {step === 0 && (
            <div className="space-y-4 animate-in fade-in-0 slide-in-from-right-4 duration-300">
              <div className="flex items-start gap-3 mt-2">
                <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-sm leading-relaxed text-foreground/90">{tutorial.whatIs}</p>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3 mt-2 animate-in fade-in-0 slide-in-from-right-4 duration-300">
              {tutorial.steps.map((s, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[11px] font-bold text-primary">{i + 1}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{s.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3 mt-2 animate-in fade-in-0 slide-in-from-right-4 duration-300">
              <Badge variant="outline" className="gap-1.5 text-emerald-600 border-emerald-500/30 mb-2">
                <Sparkles className="w-3 h-3" /> Por que usar?
              </Badge>
              {tutorial.benefits.map((b, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground/90">{b}</p>
                </div>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3 mt-2 animate-in fade-in-0 slide-in-from-right-4 duration-300">
              {hasPersonalized ? (
                <>
                  <Badge variant="outline" className="gap-1.5 text-primary border-primary/30 mb-2">
                    <Target className="w-3 h-3" /> Personalizado para o seu negócio
                  </Badge>
                  {personalizedTips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <p className="text-sm text-foreground/90">{tip}</p>
                    </div>
                  ))}
                </>
              ) : (
                <div className="rounded-lg bg-muted/50 border border-border p-5 text-center space-y-3 mt-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <Target className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-sm font-semibold">Recomendações personalizadas</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Complete o <strong>GPS do Negócio</strong> para receber dicas específicas de como usar esta ferramenta para gerar mais resultados pro seu negócio.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/20">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
            className="gap-1"
          >
            <ChevronLeft className="w-4 h-4" /> Anterior
          </Button>
          {step < totalSteps - 1 ? (
            <Button size="sm" onClick={() => setStep(s => s + 1)} className="gap-1">
              Próximo <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button size="sm" onClick={handleClose}>
              Entendi, vamos lá! 🚀
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
