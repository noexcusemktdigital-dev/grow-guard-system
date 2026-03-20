import { useState } from "react";
import { DollarSign, Eye, MousePointer, TrendingUp, Target, Users, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAdMetrics, useAdMetricsSummary, AdMetric } from "@/hooks/useAdPlatforms";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

const chartConfig: ChartConfig = {
  spend: { label: "Investimento", color: "hsl(var(--primary))" },
  conversions: { label: "Conversões", color: "hsl(var(--chart-2, 142 71% 45%))" },
};

interface Props {
  period: number;
}

export function AdMetricsDashboard({ period }: Props) {
  const { data: metrics, isLoading } = useAdMetrics(period);
  const summary = useAdMetricsSummary(metrics);
  const [platformFilter, setPlatformFilter] = useState<string>("all");

  const filteredMetrics = metrics?.filter((m) =>
    platformFilter === "all" ? true : m.platform === platformFilter
  ) || [];

  // Aggregate by date for chart
  const dailyData = filteredMetrics.reduce((acc, m) => {
    const existing = acc.find((d) => d.date === m.date);
    if (existing) {
      existing.spend += Number(m.spend);
      existing.conversions += Number(m.conversions);
      existing.clicks += Number(m.clicks);
      existing.impressions += Number(m.impressions);
    } else {
      acc.push({
        date: m.date,
        spend: Number(m.spend),
        conversions: Number(m.conversions),
        clicks: Number(m.clicks),
        impressions: Number(m.impressions),
      });
    }
    return acc;
  }, [] as { date: string; spend: number; conversions: number; clicks: number; impressions: number }[])
    .sort((a, b) => a.date.localeCompare(b.date));

  // Aggregate by campaign
  const campaignMap = new Map<string, { name: string; platform: string; spend: number; clicks: number; conversions: number; impressions: number }>();
  for (const m of filteredMetrics) {
    const key = `${m.platform}|${m.campaign_id}`;
    const existing = campaignMap.get(key) || { name: m.campaign_name, platform: m.platform, spend: 0, clicks: 0, conversions: 0, impressions: 0 };
    existing.spend += Number(m.spend);
    existing.clicks += Number(m.clicks);
    existing.conversions += Number(m.conversions);
    existing.impressions += Number(m.impressions);
    campaignMap.set(key, existing);
  }
  const campaigns = Array.from(campaignMap.values()).sort((a, b) => b.spend - a.spend);

  const filteredSummary = platformFilter === "all" ? summary : (() => {
    const fm = filteredMetrics;
    const ts = fm.reduce((s, m) => s + Number(m.spend), 0);
    const ti = fm.reduce((s, m) => s + Number(m.impressions), 0);
    const tc = fm.reduce((s, m) => s + Number(m.clicks), 0);
    const tv = fm.reduce((s, m) => s + Number(m.conversions), 0);
    return { totalSpend: ts, totalImpressions: ti, totalClicks: tc, totalConversions: tv, avgCtr: ti > 0 ? (tc / ti) * 100 : 0, avgCpc: tc > 0 ? ts / tc : 0, avgCpl: tv > 0 ? ts / tv : 0 };
  })();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}><CardContent className="p-5 h-24 animate-pulse bg-muted/20" /></Card>
        ))}
      </div>
    );
  }

  if (!metrics?.length) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <TrendingUp className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm font-medium">Nenhuma métrica disponível</p>
          <p className="text-xs text-muted-foreground mt-1">Conecte suas contas e sincronize para ver os dados.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {/* Platform filter */}
      <div className="flex gap-2">
        {[
          { value: "all", label: "Todas", icon: Target },
          { value: "google_ads", label: "Google", icon: Globe },
          { value: "meta_ads", label: "Meta", icon: Users },
        ].map((f) => (
          <Button
            key={f.value}
            variant={platformFilter === f.value ? "default" : "outline"}
            size="sm"
            className="text-xs gap-1.5"
            onClick={() => setPlatformFilter(f.value)}
          >
            <f.icon className="w-3.5 h-3.5" /> {f.label}
          </Button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: "Investimento", value: `R$ ${filteredSummary.totalSpend.toFixed(2)}`, icon: DollarSign },
          { label: "Impressões", value: filteredSummary.totalImpressions.toLocaleString(), icon: Eye },
          { label: "Cliques", value: filteredSummary.totalClicks.toLocaleString(), icon: MousePointer },
          { label: "Conversões", value: filteredSummary.totalConversions.toString(), icon: Target },
          { label: "CTR", value: `${filteredSummary.avgCtr.toFixed(2)}%`, icon: TrendingUp },
          { label: "CPC", value: `R$ ${filteredSummary.avgCpc.toFixed(2)}`, icon: DollarSign },
          { label: "CPL", value: `R$ ${filteredSummary.avgCpl.toFixed(2)}`, icon: DollarSign },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="py-3 px-4 text-center">
              <kpi.icon className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
              <p className="text-sm font-bold">{kpi.value}</p>
              <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      {dailyData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Investimento x Conversões (diário)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tickFormatter={(v) => format(new Date(v + "T00:00:00"), "dd/MM")} className="text-[10px]" />
                <YAxis yAxisId="spend" className="text-[10px]" />
                <YAxis yAxisId="conv" orientation="right" className="text-[10px]" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area yAxisId="spend" type="monotone" dataKey="spend" fill="hsl(var(--primary))" fillOpacity={0.15} stroke="hsl(var(--primary))" strokeWidth={2} />
                <Area yAxisId="conv" type="monotone" dataKey="conversions" fill="hsl(142 71% 45%)" fillOpacity={0.15} stroke="hsl(142 71% 45%)" strokeWidth={2} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Campaign table */}
      {campaigns.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Campanhas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Campanha</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Plataforma</th>
                    <th className="text-right py-2 px-2 font-medium text-muted-foreground">Gasto</th>
                    <th className="text-right py-2 px-2 font-medium text-muted-foreground">Cliques</th>
                    <th className="text-right py-2 px-2 font-medium text-muted-foreground">Conv.</th>
                    <th className="text-right py-2 px-2 font-medium text-muted-foreground">CPL</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.slice(0, 20).map((c, i) => (
                    <tr key={i} className="border-b border-muted/50 hover:bg-muted/20">
                      <td className="py-2 px-2 font-medium max-w-[200px] truncate">{c.name}</td>
                      <td className="py-2 px-2">
                        <Badge variant="outline" className="text-[9px]">
                          {c.platform === "google_ads" ? "Google" : "Meta"}
                        </Badge>
                      </td>
                      <td className="py-2 px-2 text-right">R$ {c.spend.toFixed(2)}</td>
                      <td className="py-2 px-2 text-right">{c.clicks.toLocaleString()}</td>
                      <td className="py-2 px-2 text-right">{c.conversions}</td>
                      <td className="py-2 px-2 text-right">
                        {c.conversions > 0 ? `R$ ${(c.spend / c.conversions).toFixed(2)}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
