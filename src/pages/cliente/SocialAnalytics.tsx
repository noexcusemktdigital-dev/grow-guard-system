// @ts-nocheck
import { useState, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BarChart2,
  TrendingUp,
  Eye,
  DollarSign,
  Users,
  RefreshCw,
  Wifi,
  Instagram,
  Linkedin,
  Globe,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { subDays, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { useSocialMetrics, useSocialSummary, SocialMetricRow } from "@/hooks/useSocialMetrics";

/* ─── Types ─── */
type PeriodKey = "7d" | "30d" | "90d";
type PlatformFilter = "all" | "instagram" | "facebook" | "linkedin" | "google_ads";

interface PeriodOption {
  label: string;
  days: number;
}

const PERIOD_OPTIONS: Record<PeriodKey, PeriodOption> = {
  "7d": { label: "Últimos 7 dias", days: 7 },
  "30d": { label: "Últimos 30 dias", days: 30 },
  "90d": { label: "Últimos 90 dias", days: 90 },
};

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  google_ads: "Google Ads",
  tiktok: "TikTok",
};

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "#E1306C",
  facebook: "#1877F2",
  linkedin: "#0A66C2",
  google_ads: "#4285F4",
  tiktok: "#010101",
};

const PIE_COLORS = ["#E1306C", "#1877F2", "#0A66C2", "#4285F4", "#010101", "#8B5CF6"];

function PlatformIcon({ platform, className }: { platform: string; className?: string }) {
  if (platform === "instagram") return <Instagram className={className ?? "w-4 h-4"} />;
  if (platform === "linkedin") return <Linkedin className={className ?? "w-4 h-4"} />;
  return <Globe className={className ?? "w-4 h-4"} />;
}

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/* ─── KPI Card ─── */
interface KpiCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  isLoading: boolean;
  trend?: { value: string; positive: boolean } | undefined;
}

function KpiCard({ title, value, icon, isLoading, trend }: KpiCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
        </div>
        {isLoading ? (
          <Skeleton className="h-8 w-28" />
        ) : (
          <div className="flex items-end gap-2">
            <p className="text-2xl font-bold tabular-nums">{value}</p>
            {trend && (
              <span
                className={`flex items-center text-xs font-semibold mb-0.5 ${
                  trend.positive ? "text-emerald-500" : "text-red-500"
                }`}
              >
                {trend.positive ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {trend.value}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Helpers ─── */
function groupByDate(metrics: SocialMetricRow[]) {
  const map: Record<string, { date: string; reach: number; impressions: number }> = {};
  for (const m of metrics) {
    const key = m.date.slice(0, 10);
    if (!map[key]) map[key] = { date: key, reach: 0, impressions: 0 };
    map[key].reach += m.reach;
    map[key].impressions += m.impressions;
  }
  return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
}

function topPostsByEngagement(
  metrics: SocialMetricRow[],
  limit = 10,
): { caption: string; likes: number; comments: number; shares: number }[] {
  // Group by post_id
  const map: Record<
    string,
    { caption: string; likes: number; comments: number; shares: number }
  > = {};
  for (const m of metrics) {
    const key = m.social_post_id;
    if (!map[key]) {
      map[key] = {
        caption: m.caption
          ? m.caption.slice(0, 40) + (m.caption.length > 40 ? "…" : "")
          : m.platform_post_id ?? key.slice(0, 8),
        likes: 0,
        comments: 0,
        shares: 0,
      };
    }
    map[key].likes += m.likes;
    map[key].comments += m.comments;
    map[key].shares += m.shares;
  }
  return Object.values(map)
    .sort((a, b) => b.likes + b.comments + b.shares - (a.likes + a.comments + a.shares))
    .slice(0, limit);
}

function byPlatform(
  metrics: SocialMetricRow[],
): { name: string; value: number }[] {
  const map: Record<string, number> = {};
  for (const m of metrics) {
    map[m.platform] = (map[m.platform] ?? 0) + m.reach;
  }
  return Object.entries(map).map(([platform, value]) => ({
    name: PLATFORM_LABELS[platform] ?? platform,
    value,
  }));
}

/* ─── Main Component ─── */
export default function SocialAnalytics() {
  const [period, setPeriod] = useState<PeriodKey>("30d");
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("all");

  const { data: orgId } = useUserOrgId();
  const days = PERIOD_OPTIONS[period].days;
  const from = useMemo(() => subDays(new Date(), days), [days]);

  const { data: metrics, isLoading, error, refetch } = useSocialMetrics(orgId, { from });
  const { data: summary, isLoading: summaryLoading } = useSocialSummary(orgId, days);

  // Also compute previous-period summary for trend
  const prevFrom = useMemo(() => subDays(from, days), [from, days]);
  const { data: prevMetrics } = useSocialMetrics(orgId, { from: prevFrom, to: from });

  const prevSummary = useMemo(() => {
    if (!prevMetrics || prevMetrics.length === 0) return null;
    const totalReach = prevMetrics.reduce((s, m) => s + m.reach, 0);
    const totalImp = prevMetrics.reduce((s, m) => s + m.impressions, 0);
    return { totalReach, totalImpressions: totalImp };
  }, [prevMetrics]);

  function calcTrend(current: number, prev: number | undefined): { value: string; positive: boolean } | undefined {
    if (prev == null || prev === 0) return undefined;
    const pct = ((current - prev) / prev) * 100;
    return {
      value: `${pct >= 0 ? "+" : ""}${pct.toFixed(0)}%`,
      positive: pct >= 0,
    };
  }

  // Apply platform filter
  const filtered = useMemo(() => {
    if (!metrics) return [];
    return platformFilter === "all"
      ? metrics
      : metrics.filter((m) => m.platform === platformFilter);
  }, [metrics, platformFilter]);

  // Chart data
  const timelineData = useMemo(() => groupByDate(filtered), [filtered]);
  const topPosts = useMemo(() => topPostsByEngagement(filtered, 10), [filtered]);
  const platformData = useMemo(() => byPlatform(metrics ?? []), [metrics]);

  /* ─── Empty / Error states ─── */
  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Analytics Social"
          subtitle="Acompanhe o desempenho das suas redes sociais"
          icon={<BarChart2 className="w-5 h-5 text-primary" />}
        />
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <Wifi className="w-12 h-12 text-muted-foreground/40" />
            <p className="text-muted-foreground">Erro ao carregar métricas.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isEmpty = !isLoading && (filtered.length === 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Analytics Social"
        subtitle="Acompanhe o desempenho das suas redes sociais"
        icon={<BarChart2 className="w-5 h-5 text-primary" />}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Select
              value={period}
              onValueChange={(v) => setPeriod(v as PeriodKey)}
            >
              <SelectTrigger className="w-[160px] h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(PERIOD_OPTIONS) as PeriodKey[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {PERIOD_OPTIONS[k].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={platformFilter}
              onValueChange={(v) => setPlatformFilter(v as PlatformFilter)}
            >
              <SelectTrigger className="w-[160px] h-9 text-sm">
                <SelectValue placeholder="Plataforma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as plataformas</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="google_ads">Google Ads</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Alcance"
          value={summary.totalReach.toLocaleString("pt-BR")}
          icon={<Users className="w-4 h-4" />}
          isLoading={summaryLoading}
          trend={calcTrend(summary.totalReach, prevSummary?.totalReach)}
        />
        <KpiCard
          title="Taxa de Engajamento"
          value={`${summary.avgEngagementRate.toFixed(2)}%`}
          icon={<TrendingUp className="w-4 h-4" />}
          isLoading={summaryLoading}
        />
        <KpiCard
          title="Total Impressões"
          value={summary.totalImpressions.toLocaleString("pt-BR")}
          icon={<Eye className="w-4 h-4" />}
          isLoading={summaryLoading}
          trend={calcTrend(summary.totalImpressions, prevSummary?.totalImpressions)}
        />
        <KpiCard
          title="Investimento Total"
          value={formatBRL(summary.totalSpendCents)}
          icon={<DollarSign className="w-4 h-4" />}
          isLoading={summaryLoading}
        />
      </div>

      {isEmpty ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <Wifi className="w-12 h-12 text-muted-foreground/40" />
            <p className="font-medium">Nenhuma métrica encontrada</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              Conecte uma conta social e publique posts para começar a ver analytics aqui.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Timeline chart */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Alcance × Impressões</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-56 w-full rounded-md" />
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={timelineData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(d: string) =>
                          format(parseISO(d), "dd/MM", { locale: ptBR })
                        }
                      />
                      <YAxis tick={{ fontSize: 11 }} width={50} />
                      <Tooltip
                        labelFormatter={(l: string) =>
                          format(parseISO(l), "dd MMM", { locale: ptBR })
                        }
                        formatter={(v: number, name: string) => [
                          v.toLocaleString("pt-BR"),
                          name === "reach" ? "Alcance" : "Impressões",
                        ]}
                      />
                      <Legend formatter={(v) => (v === "reach" ? "Alcance" : "Impressões")} />
                      <Line
                        type="monotone"
                        dataKey="reach"
                        stroke="#6366f1"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="impressions"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Platform donut */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Por Plataforma</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-56 w-full rounded-md" />
                ) : platformData.length === 0 ? (
                  <div className="flex items-center justify-center h-56 text-sm text-muted-foreground">
                    Sem dados
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={platformData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {platformData.map((_, i) => (
                          <Cell
                            key={i}
                            fill={PIE_COLORS[i % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v: number) => [
                          v.toLocaleString("pt-BR"),
                          "Alcance",
                        ]}
                      />
                      <Legend
                        iconType="circle"
                        iconSize={8}
                        formatter={(v) => (
                          <span className="text-xs">{v}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top posts bar chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">
                Top 10 Posts por Engajamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-64 w-full rounded-md" />
              ) : topPosts.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
                  Sem dados de posts
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={topPosts}
                    layout="vertical"
                    margin={{ left: 8, right: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis
                      type="category"
                      dataKey="caption"
                      width={130}
                      tick={{ fontSize: 10 }}
                    />
                    <Tooltip
                      formatter={(v: number, name: string) => [
                        v.toLocaleString("pt-BR"),
                        name === "likes"
                          ? "Curtidas"
                          : name === "comments"
                          ? "Comentários"
                          : "Compartilhamentos",
                      ]}
                    />
                    <Legend
                      formatter={(v) =>
                        v === "likes"
                          ? "Curtidas"
                          : v === "comments"
                          ? "Comentários"
                          : "Compartilhamentos"
                      }
                    />
                    <Bar dataKey="likes" stackId="a" fill="#6366f1" />
                    <Bar dataKey="comments" stackId="a" fill="#10b981" />
                    <Bar dataKey="shares" stackId="a" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Posts table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Posts Detalhados</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4 space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Plataforma</TableHead>
                        <TableHead>Caption</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead className="text-right">Alcance</TableHead>
                        <TableHead className="text-right">Engaj%</TableHead>
                        <TableHead className="text-right">Investimento</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.slice(0, 50).map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <PlatformIcon
                                platform={row.platform}
                                className="w-3.5 h-3.5 shrink-0"
                              />
                              <Badge variant="outline" className="text-[10px] whitespace-nowrap">
                                {PLATFORM_LABELS[row.platform] ?? row.platform}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-sm">
                            {row.caption
                              ? row.caption.slice(0, 50) +
                                (row.caption.length > 50 ? "…" : "")
                              : <span className="text-muted-foreground/50 italic text-xs">—</span>}
                          </TableCell>
                          <TableCell className="text-sm whitespace-nowrap">
                            {row.published_at
                              ? format(parseISO(row.published_at), "dd/MM/yy", { locale: ptBR })
                              : format(parseISO(row.date), "dd/MM/yy", { locale: ptBR })}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-sm">
                            {row.reach.toLocaleString("pt-BR")}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-sm">
                            {row.engagement_rate.toFixed(2)}%
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-sm">
                            {row.spend_cents > 0
                              ? formatBRL(row.spend_cents)
                              : <span className="text-muted-foreground/50 text-xs">—</span>}
                          </TableCell>
                        </TableRow>
                      ))}
                      {filtered.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center py-8 text-muted-foreground text-sm"
                          >
                            Nenhum dado para o período selecionado.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
