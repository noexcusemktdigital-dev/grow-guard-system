import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type Comunicado, getPrioridadeColor, getTipoColor } from "@/types/comunicados";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  comunicados: Comunicado[];
}

export function HomeComunicados({ comunicados }: Props) {
  const navigate = useNavigate();

  return (
    <div className="glass-card p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Comunicados Ativos
        </h3>
        <Badge variant="outline">{comunicados.length}</Badge>
      </div>
      <div className="flex-1 space-y-3">
        {comunicados.map(c => (
          <div
            key={c.id}
            className={`p-3 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50 ${
              c.prioridade === "Crítica" ? "border-destructive/50 bg-destructive/5" : "border-border"
            }`}
            onClick={() => navigate("/franqueadora/comunicados")}
          >
            <div className="flex items-start gap-2">
              {c.prioridade === "Crítica" && (
                <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5 animate-pulse" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-1">{c.titulo}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge className={`text-[10px] ${getPrioridadeColor(c.prioridade)}`}>{c.prioridade}</Badge>
                  <Badge className={`text-[10px] ${getTipoColor(c.tipo)}`}>{c.tipo}</Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {format(parseISO(c.criadoEm), "dd MMM", { locale: ptBR })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Button variant="ghost" size="sm" className="mt-3 text-xs w-full" onClick={() => navigate("/franqueadora/comunicados")}>
        Ver todos <ArrowRight className="w-3.5 h-3.5 ml-1" />
      </Button>
    </div>
  );
}
