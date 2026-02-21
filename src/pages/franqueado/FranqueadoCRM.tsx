import { useState, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KpiCard } from "@/components/KpiCard";
import { Users, DollarSign, Target, TrendingUp, ArrowLeft, Plus, Phone, Mail, Building2 } from "lucide-react";
import { getFranqueadoLeads, etapasCRM, FranqueadoLead } from "@/data/franqueadoData";

const etapaColors: Record<string, string> = {
  "Novo Lead": "bg-blue-500/20 text-blue-400",
  "Primeiro Contato": "bg-cyan-500/20 text-cyan-400",
  "Follow-up": "bg-yellow-500/20 text-yellow-400",
  "Diagnóstico": "bg-purple-500/20 text-purple-400",
  "Estratégia": "bg-indigo-500/20 text-indigo-400",
  "Proposta": "bg-orange-500/20 text-orange-400",
  "Venda": "bg-green-500/20 text-green-400",
  "Perdido": "bg-red-500/20 text-red-400",
};

export default function FranqueadoCRM() {
  const [leads, setLeads] = useState(() => getFranqueadoLeads());
  const [busca, setBusca] = useState("");
  const [etapaFiltro, setEtapaFiltro] = useState<string>("todas");
  const [view, setView] = useState<"kanban" | "lista">("kanban");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtrados = useMemo(() => {
    return leads.filter(l => {
      if (busca && !l.nome.toLowerCase().includes(busca.toLowerCase()) && !l.empresa?.toLowerCase().includes(busca.toLowerCase())) return false;
      if (etapaFiltro !== "todas" && l.etapa !== etapaFiltro) return false;
      return true;
    });
  }, [leads, busca, etapaFiltro]);

  const selected = leads.find(l => l.id === selectedId);
  const totalValor = leads.filter(l => l.etapa !== "Perdido").reduce((s, l) => s + (l.valor || 0), 0);
  const vendas = leads.filter(l => l.etapa === "Venda").length;

  if (selected) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <PageHeader title={selected.nome} subtitle={selected.empresa || "Sem empresa"}
          actions={<Button variant="ghost" size="sm" onClick={() => setSelectedId(null)}><ArrowLeft className="w-4 h-4 mr-1" /> Voltar</Button>}
        />
        <Card className="glass-card">
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-muted-foreground">Etapa</p><Badge className={etapaColors[selected.etapa]}>{selected.etapa}</Badge></div>
              <div><p className="text-xs text-muted-foreground">Valor</p><p className="font-semibold">{selected.valor ? `R$ ${selected.valor.toLocaleString()}` : "—"}</p></div>
              <div><p className="text-xs text-muted-foreground">Origem</p><p className="font-semibold">{selected.origem}</p></div>
              <div><p className="text-xs text-muted-foreground">Criado em</p><p className="font-semibold">{selected.criadoEm}</p></div>
            </div>
            <div className="flex gap-3 pt-4 border-t border-border">
              <Button variant="outline" size="sm"><Phone className="w-4 h-4 mr-1" /> {selected.telefone}</Button>
              <Button variant="outline" size="sm"><Mail className="w-4 h-4 mr-1" /> {selected.email}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader title="CRM de Vendas" subtitle="Gerencie seus leads e oportunidades"
        actions={<Button size="sm"><Plus className="w-4 h-4 mr-1" /> Novo Lead</Button>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total de Leads" value={String(leads.length)} icon={Users} delay={0} />
        <KpiCard label="Pipeline" value={`R$ ${totalValor.toLocaleString()}`} icon={DollarSign} delay={1} variant="accent" />
        <KpiCard label="Vendas Fechadas" value={String(vendas)} icon={Target} delay={2} />
        <KpiCard label="Taxa Conversão" value={leads.length ? `${Math.round((vendas / leads.length) * 100)}%` : "0%"} icon={TrendingUp} delay={3} />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Input placeholder="Buscar lead..." value={busca} onChange={e => setBusca(e.target.value)} className="max-w-xs" />
        <div className="flex gap-1">
          {["todas", ...etapasCRM].map(et => (
            <Button key={et} variant={etapaFiltro === et ? "default" : "outline"} size="sm" className="text-xs" onClick={() => setEtapaFiltro(et)}>
              {et === "todas" ? "Todas" : et}
            </Button>
          ))}
        </div>
      </div>

      {/* Kanban view */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {etapasCRM.map(etapa => {
            const leadsEtapa = filtrados.filter(l => l.etapa === etapa);
            return (
              <div key={etapa} className="w-64 flex-shrink-0">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider">{etapa}</h3>
                  <Badge variant="secondary" className="text-[10px]">{leadsEtapa.length}</Badge>
                </div>
                <div className="space-y-2">
                  {leadsEtapa.map(l => (
                    <Card key={l.id} className="glass-card hover-lift cursor-pointer" onClick={() => setSelectedId(l.id)}>
                      <CardContent className="p-3">
                        <p className="text-sm font-semibold truncate">{l.nome}</p>
                        {l.empresa && <p className="text-xs text-muted-foreground flex items-center gap-1"><Building2 className="w-3 h-3" /> {l.empresa}</p>}
                        {l.valor && <p className="text-xs font-semibold text-primary mt-1">R$ {l.valor.toLocaleString()}</p>}
                        <p className="text-[10px] text-muted-foreground mt-1">{l.origem}</p>
                      </CardContent>
                    </Card>
                  ))}
                  {leadsEtapa.length === 0 && <p className="text-xs text-muted-foreground/50 text-center py-4">Nenhum lead</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
