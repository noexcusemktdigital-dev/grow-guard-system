import { useMemo } from "react";
import { Globe, Plus, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/KpiCard";
import { getClienteSites } from "@/data/clienteData";

export default function ClienteSites() {
  const sites = useMemo(() => getClienteSites(), []);
  const totalLeads = sites.reduce((s, site) => s + site.leads, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Sites"
        subtitle="Gestão de landing pages e páginas de captura"
        icon={<Globe className="w-5 h-5 text-primary" />}
        actions={<Button size="sm"><Plus className="w-4 h-4 mr-1" /> Nova Página</Button>}
      />

      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Total de Sites" value={sites.length.toString()} />
        <KpiCard label="Leads Gerados" value={totalLeads.toString()} trend="up" variant="accent" />
        <KpiCard label="Ativos" value={sites.filter(s => s.status === "Ativo").length.toString()} />
      </div>

      <div className="space-y-3">
        {sites.map(s => (
          <Card key={s.id} className="hover:shadow-md transition-all">
            <CardContent className="py-4 flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold">{s.name}</span>
                  <Badge variant={s.status === "Ativo" ? "default" : "outline"} className="text-[9px]">{s.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" /> {s.url}
                </p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-primary">{s.leads}</p>
                <p className="text-[10px] text-muted-foreground">leads</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">{s.conversion}%</p>
                <p className="text-[10px] text-muted-foreground">conversão</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
