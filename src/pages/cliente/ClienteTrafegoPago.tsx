import { useState, useMemo } from "react";
import { DollarSign } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/KpiCard";
import { getTrafegoPagoData } from "@/data/clienteData";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const chartData = [
  { period: "Jan", investimento: 5500, leads: 280 },
  { period: "Fev", investimento: 7200, leads: 380 },
  { period: "Mar", investimento: 6800, leads: 350 },
  { period: "Abr", investimento: 8000, leads: 420 },
];

export default function ClienteTrafegoPago() {
  const data = useMemo(() => getTrafegoPagoData(), []);
  const [period, setPeriod] = useState("30d");

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Tráfego Pago"
        subtitle="Painel de investimento e performance de mídia paga"
        icon={<DollarSign className="w-5 h-5 text-primary" />}
        actions={
          <div className="flex gap-1">
            {["7d", "30d", "90d"].map(p => (
              <Button key={p} variant={period === p ? "default" : "outline"} size="sm" className="text-xs" onClick={() => setPeriod(p)}>{p}</Button>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {data.kpis.map((kpi, i) => (
          <KpiCard key={kpi.label} label={kpi.label} value={kpi.value} trend={kpi.trend} variant={i === 0 ? "accent" : "default"} delay={i} />
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Investimento vs Leads</CardTitle></CardHeader>
        <CardContent>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Line yAxisId="left" type="monotone" dataKey="investimento" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="right" type="monotone" dataKey="leads" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Campanhas Ativas</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.campanhas.map((c, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors">
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  <Badge variant="outline" className="text-[9px]">{c.platform}</Badge>
                </div>
                <div className="flex items-center gap-6 text-center">
                  <div><p className="text-sm font-bold">R$ {c.investment.toLocaleString()}</p><p className="text-[10px] text-muted-foreground">Invest.</p></div>
                  <div><p className="text-sm font-bold text-primary">{c.leads}</p><p className="text-[10px] text-muted-foreground">Leads</p></div>
                  <div><p className="text-sm font-bold">R$ {c.cpl.toFixed(2)}</p><p className="text-[10px] text-muted-foreground">CPL</p></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
