import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Rocket, Wrench, MessageSquareHeart, Bug,
  ArrowRight, Headset,
} from "lucide-react";

const POINTS = [
  { icon: Wrench, text: "Estamos ajustando funcionalidades continuamente para entregar a melhor experiência." },
  { icon: MessageSquareHeart, text: "Sua opinião é essencial — cada feedback nos ajuda a evoluir mais rápido." },
  { icon: Bug, text: "Encontrou um erro ou algo estranho? Nos avise pelo Suporte, isso nos ajuda demais!" },
];

const STORAGE_KEY = "franqueado_welcome_seen";

export function FranqueadoWelcomeModal() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      const timer = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  };

  const handleSupport = () => {
    handleClose();
    navigate("/franqueado/suporte");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-lg p-0 overflow-hidden gap-0">
        <DialogTitle className="sr-only">Bem-vindo à rede NOEXCUSE</DialogTitle>
        {/* Header */}
        <div className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-6 pb-5 text-center">
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent pointer-events-none" />
          <div className="relative space-y-3">
            <div className="flex justify-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center">
                <Rocket className="w-7 h-7 text-primary" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-foreground">Bem-vindo à rede NOEXCUSE! 🚀</h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Nosso sistema é <strong className="text-foreground">novo</strong> e está em constante evolução. 
              Estamos trabalhando todos os dias para melhorá-lo — e você faz parte disso.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div className="space-y-3">
            {POINTS.map((item) => (
              <div
                key={item.text}
                className="flex items-start gap-3 p-3 rounded-xl border border-primary/10 bg-primary/[0.03]"
              >
                <item.icon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <p className="text-sm text-foreground/90 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="space-y-2 pt-2">
            <Button className="w-full font-semibold gap-2" size="lg" onClick={handleClose}>
              Entendi, vamos lá! <ArrowRight className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="w-full text-muted-foreground gap-2" onClick={handleSupport}>
              <Headset className="w-4 h-4" /> Abrir Suporte
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
