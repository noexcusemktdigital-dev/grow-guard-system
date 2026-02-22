import { useNavigate } from "react-router-dom";
import { MessageSquare, GraduationCap, Rocket, FileText, DollarSign, Megaphone, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PrioridadeDoDia } from "@/types/home";

const tipoIcons: Record<string, React.ElementType> = {
  chamado: MessageSquare,
  prova: GraduationCap,
  onboarding: Rocket,
  contrato: FileText,
  fechamento: DollarSign,
  comunicado: Megaphone,
};

const urgenciaColors = [
  "bg-destructive/10 border-destructive/30 text-destructive",
  "bg-orange-500/10 border-orange-500/30 text-orange-600 dark:text-orange-400",
  "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400",
];

interface Props {
  prioridades: PrioridadeDoDia[];
}

export function HomeHojePreciso({ prioridades }: Props) {
  const navigate = useNavigate();

  if (prioridades.length === 0) {
    return (
      <div className="glass-card p-6 bg-primary/5 border-primary/20">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          <div>
            <h3 className="font-semibold text-foreground">Tudo em dia!</h3>
            <p className="text-sm text-muted-foreground">Nenhuma ação pendente para hoje.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 bg-primary/5 border-primary/20">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
        Hoje eu preciso de...
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {prioridades.map((p) => {
          const Icon = tipoIcons[p.tipo] || MessageSquare;
          return (
            <div
              key={p.id}
              className={`rounded-lg border p-4 flex flex-col gap-3 ${urgenciaColors[p.urgencia - 1]}`}
            >
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-background flex items-center justify-center text-sm font-bold text-foreground">
                  {p.urgencia}
                </span>
                <Icon className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wider opacity-70">{p.tipo}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium leading-tight">{p.titulo}</p>
                <p className="text-xs opacity-70 mt-1 line-clamp-2">{p.descricao}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs"
                onClick={() => navigate(p.link)}
              >
                Resolver
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
