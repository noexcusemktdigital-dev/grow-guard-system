import { useState } from "react";
import { Target, Save } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/KpiCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getPlanoVendasData } from "@/data/clienteData";
import { toast } from "@/hooks/use-toast";

export default function ClientePlanoVendas() {
  const initial = getPlanoVendasData();
  const [meta, setMeta] = useState(initial.metaMensal);
  const [ticket, setTicket] = useState(initial.ticketMedio);
  const [conversao, setConversao] = useState(initial.taxaConversao);

  const leadsNecessarios = Math.ceil(meta / ticket / (conversao / 100));

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Plano de Vendas"
        subtitle="Estratégia e projeções comerciais"
        icon={<Target className="w-5 h-5 text-primary" />}
        actions={
          <Button size="sm" onClick={() => toast({ title: "Plano salvo com sucesso!" })}>
            <Save className="w-4 h-4 mr-1" /> Salvar
          </Button>
        }
      />

      {/* KPIs calculados */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Meta Mensal" value={`R$ ${meta.toLocaleString()}`} variant="accent" />
        <KpiCard label="Ticket Médio" value={`R$ ${ticket.toLocaleString()}`} />
        <KpiCard label="Conversão" value={`${conversao}%`} />
        <KpiCard label="Leads Necessários" value={leadsNecessarios.toString()} sublabel={`${initial.leadsAtivos} ativos agora`} trend={initial.leadsAtivos >= leadsNecessarios ? "up" : "down"} />
      </div>

      {/* Editor */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Meta Mensal (R$)</CardTitle></CardHeader>
          <CardContent>
            <Input type="number" value={meta} onChange={e => setMeta(Number(e.target.value))} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Ticket Médio (R$)</CardTitle></CardHeader>
          <CardContent>
            <Input type="number" value={ticket} onChange={e => setTicket(Number(e.target.value))} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Taxa de Conversão (%)</CardTitle></CardHeader>
          <CardContent>
            <Input type="number" value={conversao} onChange={e => setConversao(Number(e.target.value))} step={0.1} />
          </CardContent>
        </Card>
      </div>

      {/* Projecao */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="py-6">
          <h3 className="text-sm font-semibold mb-4">Projeção Automática</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div><p className="text-2xl font-black text-primary">{leadsNecessarios}</p><p className="text-xs text-muted-foreground">Leads necessários</p></div>
            <div><p className="text-2xl font-black">{Math.ceil(leadsNecessarios / 22)}</p><p className="text-xs text-muted-foreground">Leads/dia útil</p></div>
            <div><p className="text-2xl font-black">{Math.ceil(meta / ticket)}</p><p className="text-xs text-muted-foreground">Vendas necessárias</p></div>
            <div><p className="text-2xl font-black text-primary">{Math.round((initial.vendasRealizadas / meta) * 100)}%</p><p className="text-xs text-muted-foreground">Realizado</p></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
