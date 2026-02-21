import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Eye, Lock } from "lucide-react";
import { useMemo, useState } from "react";
import { getFranqueadoEventos } from "@/data/franqueadoData";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const visibilidades = ["Todos", "Pessoal", "Unidade", "Rede"] as const;

export default function FranqueadoAgenda() {
  const [visibilidade, setVisibilidade] = useState<typeof visibilidades[number]>("Todos");
  const todosEventos = useMemo(() => getFranqueadoEventos(), []);

  const eventosFiltrados = visibilidade === "Todos"
    ? todosEventos
    : todosEventos.filter(e => e.visibilidade === visibilidade.toLowerCase());

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
        {eventosFiltrados.map(e => (
          <Card key={e.id} className="glass-card hover-lift cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">{format(new Date(e.data), "dd")}</span>
                  <span className="text-[9px] text-muted-foreground uppercase">{format(new Date(e.data), "MMM", { locale: ptBR })}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{e.titulo}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{e.hora} · {e.tipo}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className="text-[10px] capitalize">{e.visibilidade}</Badge>
                    {!e.editavel && (
                      <Badge variant="secondary" className="text-[10px]">
                        <Lock className="w-2.5 h-2.5 mr-0.5" /> Somente leitura
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {eventosFiltrados.length === 0 && (
          <p className="text-sm text-muted-foreground col-span-full text-center py-8">Nenhum evento encontrado para este filtro.</p>
        )}
      </div>
    </div>
  );
}
