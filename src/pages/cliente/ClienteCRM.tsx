import { useState, useMemo } from "react";
import { Users, Plus, Phone, Mail, ThermometerSun } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getCrmLeads, type CrmLead } from "@/data/clienteData";

const stages = [
  { key: "novo", label: "Novo Lead", color: "bg-blue-500" },
  { key: "contato", label: "Contato", color: "bg-yellow-500" },
  { key: "proposta", label: "Proposta", color: "bg-purple-500" },
  { key: "fechado", label: "Fechado", color: "bg-emerald-500" },
  { key: "perdido", label: "Perdido", color: "bg-destructive" },
] as const;

const tempColors: Record<string, string> = {
  Quente: "text-destructive bg-destructive/10",
  Morno: "text-yellow-500 bg-yellow-500/10",
  Frio: "text-blue-400 bg-blue-400/10",
};

export default function ClienteCRM() {
  const leads = useMemo(() => getCrmLeads(), []);
  const [selected, setSelected] = useState<CrmLead | null>(null);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="CRM"
        subtitle="Funil de vendas da empresa"
        icon={<Users className="w-5 h-5 text-primary" />}
        actions={<Button size="sm"><Plus className="w-4 h-4 mr-1" /> Novo Lead</Button>}
      />

      {selected ? (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{selected.name}</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setSelected(null)}>Voltar ao funil</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><p className="text-xs text-muted-foreground">Telefone</p><p className="text-sm font-medium flex items-center gap-1"><Phone className="w-3 h-3" /> {selected.phone}</p></div>
              <div><p className="text-xs text-muted-foreground">E-mail</p><p className="text-sm font-medium flex items-center gap-1"><Mail className="w-3 h-3" /> {selected.email}</p></div>
              <div><p className="text-xs text-muted-foreground">Valor</p><p className="text-sm font-bold text-primary">R$ {selected.value.toLocaleString()}</p></div>
              <div><p className="text-xs text-muted-foreground">Temperatura</p><Badge className={`text-[10px] ${tempColors[selected.temperature]}`}><ThermometerSun className="w-3 h-3 mr-1" />{selected.temperature}</Badge></div>
            </div>
            <div><p className="text-xs text-muted-foreground mb-1">Observações</p><p className="text-sm bg-muted/30 p-3 rounded-lg">{selected.notes}</p></div>
            <div><p className="text-xs text-muted-foreground">Responsável: {selected.responsible} · Criado em {selected.createdAt}</p></div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {stages.map(stage => {
            const stageLeads = leads.filter(l => l.stage === stage.key);
            return (
              <div key={stage.key} className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2 h-2 rounded-full ${stage.color}`} />
                  <span className="text-xs font-semibold uppercase tracking-wider">{stage.label}</span>
                  <Badge variant="outline" className="text-[9px] ml-auto">{stageLeads.length}</Badge>
                </div>
                <ScrollArea className="h-[calc(100vh-280px)]">
                  <div className="space-y-2 pr-1">
                    {stageLeads.map(lead => (
                      <Card key={lead.id} className="cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5" onClick={() => setSelected(lead)}>
                        <CardContent className="p-3">
                          <p className="text-sm font-medium">{lead.name}</p>
                          <p className="text-xs text-muted-foreground">{lead.phone}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs font-bold text-primary">R$ {lead.value.toLocaleString()}</span>
                            <Badge className={`text-[9px] ${tempColors[lead.temperature]}`}>{lead.temperature}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
