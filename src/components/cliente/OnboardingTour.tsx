import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Rocket, BarChart3, Megaphone, CheckSquare, CreditCard } from "lucide-react";

const STORAGE_KEY = "onboarding_tour_done";

const STEPS = [
  {
    icon: Rocket,
    title: "Bem-vindo à plataforma! 🚀",
    description: "Aqui você encontra tudo para gerenciar seu negócio de forma inteligente. Vamos fazer um tour rápido pelas principais áreas?",
  },
  {
    icon: BarChart3,
    title: "Módulo Comercial",
    description: "Gerencie seus leads no CRM, configure Agentes de IA para atendimento automático, e crie scripts de vendas personalizados para sua equipe.",
  },
  {
    icon: Megaphone,
    title: "Módulo Marketing",
    description: "Crie estratégias, gere conteúdos com IA, publique sites e gerencie campanhas de tráfego pago — tudo em um só lugar.",
  },
  {
    icon: CheckSquare,
    title: "Checklist & Gamificação",
    description: "Complete tarefas diárias para ganhar XP e subir de nível. Acompanhe sua evolução e conquiste badges exclusivos.",
  },
  {
    icon: CreditCard,
    title: "Créditos & Plano",
    description: "Cada ação de IA consome créditos. Acompanhe seu saldo, entenda os custos e escolha o plano ideal para o seu negócio.",
  },
];

export function OnboardingTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) {
      const timer = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setOpen(false);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const Icon = current.icon;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-2">
            <Icon className="w-7 h-7 text-primary" />
          </div>
          <DialogTitle className="text-lg">{current.title}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">{current.description}</DialogDescription>
        </DialogHeader>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 py-2">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/20"}`} />
          ))}
        </div>

        <DialogFooter className="flex-row gap-2 sm:justify-between">
          <Button variant="ghost" size="sm" onClick={handleClose} className="text-xs text-muted-foreground">
            Pular tour
          </Button>
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="outline" size="sm" onClick={() => setStep(step - 1)}>
                Anterior
              </Button>
            )}
            {isLast ? (
              <Button size="sm" onClick={handleClose}>
                Começar! 🎉
              </Button>
            ) : (
              <Button size="sm" onClick={() => setStep(step + 1)}>
                Próximo
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
