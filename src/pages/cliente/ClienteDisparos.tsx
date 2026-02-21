import { useMemo } from "react";
import { Send, Plus, Info } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getClienteDisparos } from "@/data/clienteData";

const statusColors: Record<string, string> = {
  Enviado: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  Agendado: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  Rascunho: "bg-muted text-muted-foreground",
};

export default function ClienteDisparos() {
  const disparos = useMemo(() => getClienteDisparos(), []);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Disparos"
        subtitle="Envie e-mails, mensagens e campanhas internas"
        icon={<Send className="w-5 h-5 text-primary" />}
        actions={<Button size="sm"><Plus className="w-4 h-4 mr-1" /> Novo Disparo</Button>}
      />

      <div className="flex items-center gap-2">
        <Info className="w-4 h-4 text-muted-foreground" />
        <Badge variant="outline" className="text-[10px]">Em breve: Integração WhatsApp API</Badge>
      </div>

      <div className="space-y-3">
        {disparos.map(d => (
          <Card key={d.id} className="hover:shadow-md transition-all">
            <CardContent className="py-4 flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold">{d.subject}</span>
                  <Badge variant="outline" className={`text-[9px] ${statusColors[d.status]}`}>{d.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {d.type} · {d.recipients} destinatários {d.sentAt && `· ${d.sentAt}`}
                </p>
              </div>
              {d.openRate !== undefined && (
                <div className="text-right">
                  <p className="text-sm font-bold text-primary">{d.openRate}%</p>
                  <p className="text-[10px] text-muted-foreground">abertura</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
