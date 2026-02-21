import { useState } from "react";
import { Megaphone, Save } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/KpiCard";
import { getPlanoMarketingData } from "@/data/clienteData";
import { toast } from "@/hooks/use-toast";

export default function ClientePlanoMarketing() {
  const data = getPlanoMarketingData();
  const [objetivo, setObjetivo] = useState(data.objetivo);
  const [orcamento, setOrcamento] = useState(data.orcamento);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Plano de Marketing"
        subtitle="Estratégia mensal de canais e orçamento"
        icon={<Megaphone className="w-5 h-5 text-primary" />}
        actions={<Button size="sm" onClick={() => toast({ title: "Plano salvo!" })}><Save className="w-4 h-4 mr-1" /> Salvar</Button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard label="Orçamento Total" value={`R$ ${orcamento.toLocaleString()}`} variant="accent" />
        <KpiCard label="Gasto Atual" value={`R$ ${data.gasto.toLocaleString()}`} sublabel={`${Math.round((data.gasto / orcamento) * 100)}% utilizado`} />
        <KpiCard label="Canais Ativos" value={data.canais.filter(c => c.active).length.toString()} sublabel={`de ${data.canais.length} canais`} />
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Objetivo do Mês</CardTitle></CardHeader>
        <CardContent>
          <Input value={objetivo} onChange={e => setObjetivo(e.target.value)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Canais e Frequência</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.canais.map(canal => (
              <div key={canal.name} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <Checkbox checked={canal.active} />
                  <span className="text-sm font-medium">{canal.name}</span>
                </div>
                <Badge variant={canal.active ? "secondary" : "outline"} className="text-[10px]">{canal.frequency}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Orçamento Mensal (R$)</CardTitle></CardHeader>
        <CardContent>
          <Input type="number" value={orcamento} onChange={e => setOrcamento(Number(e.target.value))} />
        </CardContent>
      </Card>
    </div>
  );
}
