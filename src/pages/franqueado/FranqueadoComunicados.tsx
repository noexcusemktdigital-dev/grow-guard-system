import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useMemo, useState } from "react";
import { getComunicadosAtivos } from "@/data/homeData";
import { format } from "date-fns";

export default function FranqueadoComunicados() {
  const comunicados = useMemo(() => getComunicadosAtivos(10), []);
  const [lidos, setLidos] = useState<Set<string>>(new Set());

  const marcarLido = (id: string) => setLidos(prev => new Set(prev).add(id));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader title="Comunicados da Matriz" subtitle="Avisos e comunicados direcionados à sua unidade" />

      <div className="space-y-4">
        {comunicados.map(c => (
          <Card key={c.id} className={`glass-card hover-lift transition-all ${lidos.has(c.id) ? "opacity-60" : ""}`}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${c.prioridade === "Crítica" ? "bg-destructive animate-pulse" : c.prioridade === "Alta" ? "bg-yellow-500" : "bg-blue-500"}`} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold">{c.titulo}</h3>
                      <Badge variant={c.prioridade === "Crítica" ? "destructive" : "secondary"} className="text-[10px]">
                        {c.prioridade}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{c.autorNome} · {format(new Date(c.criadoEm), "dd/MM/yyyy")}</p>
                    <p className="text-sm text-foreground/80">{c.titulo}</p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {lidos.has(c.id) ? (
                    <Badge variant="outline" className="text-green-500 border-green-500/30"><Check className="w-3 h-3 mr-1" /> Lido</Badge>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => marcarLido(c.id)}>
                      <Check className="w-3.5 h-3.5 mr-1" /> Li e concordo
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
