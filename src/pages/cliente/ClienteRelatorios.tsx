import { useState, useMemo } from "react";
import {
  BarChart3, TrendingUp, Users, DollarSign,
  ArrowUpRight, ArrowDownRight, Target, Eye
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCrmLeads } from "@/hooks/useClienteCrm";
import {
  RadialBarChart, RadialBar,
  ResponsiveContainer,
} from "recharts";

const kpiCards: { label: string; icon: React.ElementType; gradient: string }[] = [
  { label: "Receita Total", icon: DollarSign, gradient: "from-emerald-500/15 to-emerald-600/5" },
  { label: "Leads Captados", icon: Users, gradient: "from-blue-500/15 to-blue-600/5" },
  { label: "Taxa de Conversão", icon: Target, gradient: "from-purple-500/15 to-purple-600/5" },
  { label: "Ticket Médio", icon: Eye, gradient: "from-amber-500/15 to-amber-600/5" },
];

export default function ClienteRelatorios() {
  const { data: leads, isLoading } = useCrmLeads();
  const [period, setPeriod] = useState("30d");

  const allLeads = leads ?? [];
  const wonLeads = allLeads.filter(l => l.won_at);
  const totalValue = wonLeads.reduce((sum, l) => sum + Number(l.value || 0), 0);
  const conversionRate = allLeads.length > 0 ? ((wonLeads.length / allLeads.length) * 100).toFixed(1) : "0";
  const ticketMedio = wonLeads.length > 0 ? (totalValue / wonLeads.length) : 0;

  const kpiValues: { value: string; change: string; trend: "up" | "down" | "neutral" }[] = [
    { value: `R$ ${totalValue.toLocaleString("pt-BR")}`, change: "—", trend: "neutral" },
    { value: String(allLeads.length), change: "—", trend: "neutral" },
    { value: `${conversionRate}%`, change: "—", trend: "neutral" },
    { value: `R$ ${ticketMedio.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`, change: "—", trend: "neutral" },
  ];

  const conversionRadial = [
    { name: "Conversão", value: Number(conversionRate), fill: "hsl(var(--primary))" },
  ];

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader title="Relatórios" subtitle="Análises de vendas e performance" icon={<BarChart3 className="w-5 h-5 text-primary" />} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Relatórios"
        subtitle="Análises de vendas, conversão e performance"
        icon={<BarChart3 className="w-5 h-5 text-primary" />}
        actions={
          <div className="flex gap-1 p-1 rounded-lg bg-muted/50 border">
            {["7d", "30d", "90d"].map(p => (
              <Button key={p} variant={period === p ? "default" : "ghost"} size="sm" className="text-xs h-7 px-3" onClick={() => setPeriod(p)}>
                {p}
              </Button>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((cfg, i) => {
          const kpi = kpiValues[i];
          return (
            <Card key={cfg.label} className="relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
              <div className={`absolute inset-0 bg-gradient-to-br ${cfg.gradient} opacity-60`} />
              <CardContent className="relative p-4">
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-lg bg-background/50 border flex items-center justify-center">
                    <cfg.icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  {kpi.change !== "—" && (
                    <Badge variant="outline" className={`text-[9px] gap-0.5 ${kpi.trend === "up" ? "text-emerald-400 border-emerald-500/30" : "text-red-400 border-red-500/30"}`}>
                      {kpi.trend === "up" ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                      {kpi.change}
                    </Badge>
                  )}
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-bold tracking-tight">{kpi.value}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{cfg.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Conversion radial */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" /> Taxa de Conversão
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center">
          <div className="h-48 w-full max-w-xs">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                innerRadius="70%"
                outerRadius="100%"
                data={conversionRadial}
                startAngle={90}
                endAngle={-270}
              >
                <RadialBar
                  background={{ fill: "hsl(var(--muted))" }}
                  dataKey="value"
                  cornerRadius={10}
                />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center -mt-28 relative z-10">
            <p className="text-3xl font-bold">{conversionRate}%</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">de conversão</p>
          </div>
        </CardContent>
      </Card>

      {allLeads.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <BarChart3 className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium">Sem dados suficientes</p>
            <p className="text-xs text-muted-foreground mt-1">Adicione leads no CRM para ver relatórios detalhados.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
