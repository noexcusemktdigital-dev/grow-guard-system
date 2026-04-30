// @ts-nocheck
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Target, Users, Megaphone, ArrowRight, Sparkles } from "lucide-react";
import { useFeatureGate } from "@/contexts/FeatureGateContext";

const STORAGE_KEY = "gps_completed_modal_seen";

const NEXT_STEPS = [
  {
    icon: Target,
    title: "Criar metas",
    desc: "Defina objetivos claros para acompanhar seu crescimento",
    cta: "Configurar metas",
    path: "/cliente/metas",
  },
  {
    icon: Users,
    title: "Importar leads",
    desc: "Comece a gerenciar seu funil de vendas no CRM",
    cta: "Ir para o CRM",
    path: "/cliente/crm",
  },
  {
    icon: Megaphone,
    title: "Conectar Meta Ads",
    desc: "Acompanhe campanhas e otimize seu tráfego pago",
    cta: "Conectar agora",
    path: "/cliente/trafego-pago",
  },
];

export function GpsCompletedModal() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { hasApprovedGPS } = useFeatureGate();

  useEffect(() => {
    if (hasApprovedGPS && !localStorage.getItem(STORAGE_KEY)) {
      const timer = setTimeout(() => setOpen(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [hasApprovedGPS]);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  };

  const handleNavigate = (path: string) => {
    handleClose();
    navigate(path);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-lg p-0 overflow-hidden gap-0">
        <DialogTitle className="sr-only">GPS do Negócio concluído</DialogTitle>

        {/* Header */}
        <div className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-6 pb-5 text-center">
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent pointer-events-none" />
          <div className="relative space-y-3">
            <div className="flex justify-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary">
              🎯 Estratégia definida!
            </p>
            <h2 className="text-xl font-bold text-foreground leading-tight">
              Parabéns! Você está entre os 10% que planejam antes de executar.
            </h2>
            <p className="text-sm text-muted-foreground">
              Empresas com estratégia definida crescem <strong className="text-foreground">3x mais rápido</strong> e gastam <strong className="text-foreground">40% menos</strong> em marketing.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Próximos passos recomendados
          </p>

          <div className="space-y-2">
            {NEXT_STEPS.map((step, idx) => (
              <div
                key={step.title}
                className="flex items-start gap-3 p-3 rounded-xl border border-primary/10 bg-primary/[0.03] hover:bg-primary/[0.06] transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                  <step.icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {idx + 1}. {step.title}
                  </p>
                  <p className="text-[12px] text-muted-foreground leading-snug mb-2">
                    {step.desc}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1.5"
                    onClick={() => handleNavigate(step.path)}
                  >
                    {step.cta} <ArrowRight className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Close */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            onClick={handleClose}
          >
            Continuar explorando
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
