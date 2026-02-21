import { useNavigate } from "react-router-dom";
import { MessageSquare, GraduationCap, Rocket, FileText, DollarSign, Megaphone, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AlertaHome } from "@/data/homeData";

const tipoIcons: Record<string, React.ElementType> = {
  chamado: MessageSquare,
  prova: GraduationCap,
  onboarding: Rocket,
  contrato: FileText,
  fechamento: DollarSign,
  comunicado: Megaphone,
};

const prioridadeColors = {
  alta: "bg-destructive/10 text-destructive",
  media: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  baixa: "bg-muted text-muted-foreground",
};

interface Props {
  alertas: AlertaHome[];
}

export function HomeAlertas({ alertas }: Props) {
  const navigate = useNavigate();

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Ações Pendentes
        </h3>
        <Badge variant="destructive" className="text-[10px]">{alertas.length}</Badge>
      </div>
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {alertas.map(a => {
          const Icon = tipoIcons[a.tipo] || AlertCircle;
          return (
            <div
              key={a.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
            >
              <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-1">{a.titulo}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge className={`text-[10px] ${prioridadeColors[a.prioridade]}`}>{a.prioridade}</Badge>
                  <span className="text-[10px] text-muted-foreground">{a.moduloOrigem}</span>
                </div>
              </div>
              <Button variant="outline" size="sm" className="text-xs shrink-0" onClick={() => navigate(a.link)}>
                Resolver
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
