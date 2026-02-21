import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Eye } from "lucide-react";
import { useMemo, useState } from "react";
import { getProximosEventos } from "@/data/homeData";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const visibilidades = ["Pessoal", "Unidade", "Rede"] as const;

export default function FranqueadoAgenda() {
  const [visibilidade, setVisibilidade] = useState<typeof visibilidades[number]>("Unidade");
  const eventos = useMemo(() => getProximosEventos(10), []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Agenda"
        subtitle="Visualize e gerencie seus eventos"
        actions={
          <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Novo Evento</Button>
        }
      />

      <div className="flex gap-2">
        {visibilidades.map(v => (
          <Button
            key={v}
            variant={visibilidade === v ? "default" : "outline"}
            size="sm"
            onClick={() => setVisibilidade(v)}
          >
            <Eye className="w-3.5 h-3.5 mr-1" /> {v}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {eventos.map(e => (
          <Card key={e.id} className="glass-card hover-lift cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">{format(new Date(e.inicio), "dd")}</span>
                  <span className="text-[9px] text-muted-foreground uppercase">{format(new Date(e.inicio), "MMM", { locale: ptBR })}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{e.titulo}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{e.tipo}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className="text-[10px]">{e.tipo}</Badge>
                    <Badge variant="secondary" className="text-[10px]">{visibilidade}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
