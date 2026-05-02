import { useMemo } from "react";
import { RefreshCw, BarChart2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAdMetrics, useSyncMetrics, AdConnection } from "@/hooks/useAdPlatforms";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatBRL } from "@/lib/formatting";
import { cn } from "@/lib/utils";

const fmtPct = (v: number) => `${v.toFixed(2).replace(".", ",")}%`;

const chartConfig: ChartConfig = {
  spend: { label: "Investimento", color: "hsl(var(--primary))" },
  conversions: { label: "Leads", color: "hsl(142 71% 45%)" },
};

function statusBadge(status: string) {
  const s = status?.toUpperCase();
  if (s === "ACTIVE" || s === "ENABLED") {
    return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px]">Ativo</Badge>;
  }
  if (s === "PAUSED") {
    return <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px]">Pausado</Badge>;
  }
  if (s === "DISAPPROVED" || s === "REMOVED" || s === "ARCHIVED") {
    return <Badge className="bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30 text-[10px]">{s === "PAUSED" ? "Pausado" : "Inativo"}</Badge>;
  }
  return <Badge variant="outline" className="text-[10px]">{status || "—"}</Badge>;
}

interface Props {
  metaConnection: AdConnection | undefined;
  period?: number;
}

export function TrafficOverview({ metaConnection, period = 30 }: Props) {
  const { data: metrics, isLoading } = useAdMetrics(period);
  const syncMutation = useSyncMetrics();

  // Agregação diária para o gráfico
  const dailyData = useMemo(() => {
    const map = new Map<string, { date: string; spend: number; conversions: number }>();
    for (const m of metrics || []) {
      const existing = map.get(m.date) || { date: m.date, spend: 0, conversions: 0 };
      existing.spend += Number(m.spend);
      existing.conversions += Number(m.conversions);
      map.set(m.date, existing);
    }
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [metrics]);

  // Agregação por campanha
  const campaigns = useMemo(() => {
    const map = new Map<string, {
      id: string; name: string; status: string;
      spend: number; clicks: number; conversions: number; impressions: number;
    }>();
    for (const m of metrics || []) {
      const key = m.campaign_id;
      const existing = map.get(key) || {
        id: key, name: m.campaign_name, status: m.campaign_status,
        spend: 0, clicks: 0, conversions: 0, impressions: 0,
      };
      existing.spend += Number(m.spend);
      existing.clicks += Number(m.clicks);
      existing.conversions += Number(m.conversions);
      existing.impressions += Number(m.impressions);
      map.set(key, existing);
    }
    return Array.from(map.values()).sort((a, b) => b.spend - a.spend);
  }, [metrics]);

  const lastSync = metaConnection?.last_synced_at
    ? `Sincronizado há ${formatDistanceToNow(new Date(metaConnection.last_synced_at), { locale: ptBR })}`
    : "Nunca sincronizado";

  if (!metaConnection) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center space-y-2">
          <BarChart2 className="w-10 h-10 text-muted-foreground/40 mx-auto" />
          <p className="text-sm font-semibold">Conecte sua conta Meta Ads</p>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Após conectar e sincronizar, você verá aqui o desempenho completo das suas campanhas.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto" />
        </CardContent>
      </Card>
    );
  }

  if (!metrics?.length) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center space-y-3">
          <BarChart2 className="w-10 h-10 text-muted-foreground/40 mx-auto" />
          <p className="text-sm font-semibold">Sem dados ainda</p>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Conecte sua conta Meta Ads e sincronize para ver seus dados.
          </p>
          <Button
            size="sm"
            className="gap-1.5 mt-2"
            disabled={syncMutation.isPending}
            onClick={() => syncMutation.mutate(metaConnection.id)}
          >
            <RefreshCw className={cn("w-3.5 h-3.5", syncMutation.isPending && "animate-spin")} />
            Sincronizar agora
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sync bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium text-foreground">{lastSync}</span>
        </p>
        <Button
          size="sm"
          variant="outline"
          className="text-xs gap-1.5"
          disabled={syncMutation.isPending}
          onClick={() => syncMutation.mutate(metaConnection.id)}
        >
          <RefreshCw className={cn("w-3.5 h-3.5", syncMutation.isPending && "animate-spin")} />
          {syncMutation.isPending ? "Sincronizando..." : "Sincronizar"}
        </Button>
      </div>

      {/* Chart */}
      {dailyData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Investimento × Leads ({period === 7 ? "últimos 7 dias" : period === 30 ? "últimos 30 dias" : period === 90 ? "últimos 90 dias" : period === 180 ? "últimos 6 meses" : period === 365 ? "último 1 ano" : `últimos ${period} dias`})</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[280px] w-full">
              <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => format(new Date(v + "T00:00:00"), "dd/MM")}
                  className="text-[10px]"
                />
                <YAxis yAxisId="spend" className="text-[10px]" />
                <YAxis yAxisId="conv" orientation="right" className="text-[10px]" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  yAxisId="spend"
                  type="monotone"
                  dataKey="spend"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.15}
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                />
                <Area
                  yAxisId="conv"
                  type="monotone"
                  dataKey="conversions"
                  fill="hsl(142 71% 45%)"
                  fillOpacity={0.15}
                  stroke="hsl(142 71% 45%)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Campaigns table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Campanhas no período</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-xs">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-left py-2.5 px-3 font-semibold text-muted-foreground uppercase tracking-wide text-[10px]">Nome</th>
                  <th className="text-left py-2.5 px-3 font-semibold text-muted-foreground uppercase tracking-wide text-[10px]">Status</th>
                  <th className="text-right py-2.5 px-3 font-semibold text-muted-foreground uppercase tracking-wide text-[10px]">Investido</th>
                  <th className="text-right py-2.5 px-3 font-semibold text-muted-foreground uppercase tracking-wide text-[10px]">Cliques</th>
                  <th className="text-right py-2.5 px-3 font-semibold text-muted-foreground uppercase tracking-wide text-[10px]">Leads</th>
                  <th className="text-right py-2.5 px-3 font-semibold text-muted-foreground uppercase tracking-wide text-[10px]">CPL</th>
                  <th className="text-right py-2.5 px-3 font-semibold text-muted-foreground uppercase tracking-wide text-[10px]">CTR</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c, idx) => {
                  const ctr = c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0;
                  const cpl = c.conversions > 0 ? c.spend / c.conversions : 0;
                  return (
                    <tr
                      key={c.id}
                      className={cn(
                        "border-t border-muted/50 transition-colors hover:bg-muted/40",
                        idx % 2 === 1 && "bg-muted/15"
                      )}
                    >
                      <td className="py-2.5 px-3 font-medium max-w-[260px] truncate">{c.name}</td>
                      <td className="py-2.5 px-3">{statusBadge(c.status)}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums">{formatBRL(c.spend)}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums">{c.clicks.toLocaleString("pt-BR")}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums font-semibold">{c.conversions}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums">{c.conversions > 0 ? formatBRL(cpl) : "—"}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums">{fmtPct(ctr)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
