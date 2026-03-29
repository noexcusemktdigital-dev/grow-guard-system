// @ts-nocheck
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Target, Users, Megaphone, CheckCircle2,
  Lock, Bot, Send, ArrowRight, Sparkles, Zap,
} from "lucide-react";
import { useClienteSubscription } from "@/hooks/useClienteSubscription";

const INCLUDED = [
  { icon: Users, label: "CRM completo", desc: "Gerencie leads e funil de vendas" },
  { icon: Target, label: "Plano de Vendas", desc: "Estratégia comercial personalizada" },
  { icon: Megaphone, label: "Marketing completo", desc: "Conteúdos, artes, sites e tráfego" },
  { icon: Zap, label: "200 créditos", desc: "Para testar todas as ferramentas de IA" },
];

const BLOCKED = [
  { icon: Bot, label: "Agente de IA" },
  { icon: Send, label: "Disparos WhatsApp" },
];

const STORAGE_KEY = "trial_welcome_seen";

export function TrialWelcomeModal({ onComplete }: { onComplete?: () => void }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data: subscription } = useClienteSubscription();

  useEffect(() => {
    if (subscription?.status === "trial" && !localStorage.getItem(STORAGE_KEY)) {
      const timer = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(timer);
    } else if (subscription !== undefined) {
      // Not trial or already seen — signal done immediately
      onComplete?.();
    }
  }, [subscription]);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
    onComplete?.();
  };

  const handleStart = () => {
    handleClose();
    navigate("/cliente/plano-vendas");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-lg p-0 overflow-hidden gap-0">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-6 pb-5 text-center">
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent pointer-events-none" />
          <div className="relative space-y-3">
            <div className="flex justify-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-foreground">Bem-vindo ao NOEXCUSE! 🎉</h2>
            <p className="text-sm text-muted-foreground">
              Você tem <Badge variant="secondary" className="mx-1 font-bold">7 dias grátis</Badge> e
              <Badge variant="secondary" className="mx-1 font-bold">200 créditos</Badge> para explorar.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Included */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
              ✅ Incluso no seu trial
            </p>
            <div className="grid grid-cols-2 gap-2">
              {INCLUDED.map((item) => (
                <div
                  key={item.label}
                  className="flex items-start gap-2.5 p-3 rounded-xl border border-primary/10 bg-primary/[0.03]"
                >
                  <item.icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-[11px] text-muted-foreground leading-tight">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Blocked */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              🔒 Disponível a partir do Plano Pro
            </p>
            <div className="flex flex-wrap gap-2">
              {BLOCKED.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50 text-muted-foreground text-xs"
                >
                  <Lock className="w-3 h-3" />
                  {item.label}
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="space-y-2 pt-2">
            <Button className="w-full font-semibold gap-2" size="lg" onClick={handleStart}>
              Começar pelo Plano de Vendas <ArrowRight className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={handleClose}>
              Explorar livremente
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
