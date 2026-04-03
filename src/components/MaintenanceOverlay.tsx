import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Construction, ArrowLeft } from "lucide-react";

interface MaintenanceOverlayProps {
  backPath?: string;
  backLabel?: string;
}

export function MaintenanceOverlay({
  backPath = "/franqueado/inicio",
  backLabel = "Voltar ao início",
}: MaintenanceOverlayProps) {
  const navigate = useNavigate();

  return (
    <div className="w-full min-h-[60vh] flex items-center justify-center">
      <div className="relative max-w-md w-full mx-4">
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 opacity-40 blur-xl" />

        <div className="relative bg-card border border-border rounded-2xl p-8 text-center shadow-2xl space-y-5">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center">
              <Construction className="w-8 h-8 text-primary" />
            </div>
          </div>

          <div className="flex justify-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
              <Construction className="w-3 h-3" />
              Em manutenção
            </span>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">Estamos preparando tudo!</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Estamos finalizando os ajustes desta ferramenta. Em breve sua unidade terá acesso completo!
            </p>
          </div>

          <Button size="lg" className="w-full font-semibold gap-2" onClick={() => navigate(backPath)}>
            <ArrowLeft className="w-4 h-4" /> {backLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
