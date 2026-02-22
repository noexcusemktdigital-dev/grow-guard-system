import { DollarSign, Target, FileText, Users, TrendingUp, TrendingDown, Trophy, Medal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBRL, levelThresholds } from "@/types/metas";
import { getNetworkTotals, getEvolutionData, getRevenueByProduct, getRankingForMonth } from "@/mocks/metasRankingData";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, PieChart, Pie, Cell } from "recharts";

const MONTH = "2026-02";

export default function MetasDashboard() {
  const totals = getNetworkTotals(MONTH);
  const evolution = getEvolutionData();
  const productData = getRevenueByProduct(MONTH);
  const ranking = totals.ranking;
  const top3 = ranking.slice(0, 3);

  const medalColors = ["from-amber-300 to-amber-500", "from-gray-300 to-gray-400", "from-orange-400 to-orange-600"];
  const medalIcons = ["🥇", "🥈", "🥉"];

  const kpis = [
    { label: "Faturamento da Rede", value: formatBRL(totals.totalRevenue), icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Meta da Rede", value: `${totals.goalPercent.toFixed(0)}%`, icon: Target, color: "text-blue-500", bg: "bg-blue-500/10", sub: `de ${formatBRL(totals.targetRevenue)}` },
    { label: "Contratos Fechados", value: totals.totalContracts.toString(), icon: FileText, color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: "Unidades Ativas", value: ranking.length.toString(), icon: Users, color: "text-amber-500", bg: "bg-amber-500/10" },
  ];

  // Meta vs Real per product
  const metaRealData = [
    { name: "Assessoria", meta: 30000, real: (totals.receitaPorProduto["Assessoria Noexcuse"] || 0) },
    { name: "SaaS", meta: 15000, real: (totals.receitaPorProduto["SaaS"] || 0) },
    { name: "Sistema", meta: 10000, real: (totals.receitaPorProduto["Sistema"] || 0) },
  ];

  const franchiseNames = ranking.map(r => r.franchiseName.replace("Franquia ", ""));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{kpi.label}</p>
                    <p className="text-2xl font-bold mt-1">{kpi.value}</p>
                    {kpi.sub && <p className="text-xs text-muted-foreground mt-0.5">{kpi.sub}</p>}
                  </div>
                  <div className={`p-2.5 rounded-xl ${kpi.bg}`}>
                    <Icon className={`w-5 h-5 ${kpi.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Meta vs Real Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Meta vs Real por Produto</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ meta: { label: "Meta", color: "hsl(var(--muted-foreground))" }, real: { label: "Real", color: "hsl(var(--primary))" } }} className="h-[250px]">
              <BarChart data={metaRealData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={11} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <ChartTooltip content={<ChartTooltipContent formatter={(v) => formatBRL(v as number)} />} />
                <Bar dataKey="meta" fill="hsl(var(--muted-foreground))" opacity={0.25} radius={[4, 4, 0, 0]} />
                <Bar dataKey="real" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Top 3 Podio */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-500" /> Top 3 do Mês</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {top3.map((f, i) => {
              const lvl = levelThresholds.find(l => l.level === f.level)!;
              const LvlIcon = lvl.icon;
              return (
                <div key={f.franchiseId} className={`flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r ${medalColors[i]} bg-opacity-10 dark:bg-opacity-5`} style={{ background: `linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--accent)) 100%)` }}>
                  <span className="text-2xl">{medalIcons[i]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{f.franchiseName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <LvlIcon className={`w-3 h-3 ${lvl.color}`} />
                      <span className="text-xs text-muted-foreground">{f.level}</span>
                      <span className="text-xs font-medium">{f.points} pts</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{formatBRL(f.revenue)}</p>
                    <p className={`text-xs flex items-center gap-0.5 justify-end ${f.growthPercent >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                      {f.growthPercent >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {Math.abs(f.growthPercent).toFixed(0)}%
                    </p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Evolution Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Evolução 6 Meses</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ total: { label: "Total", color: "hsl(var(--primary))" } }} className="h-[250px]">
              <LineChart data={evolution}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="mes" fontSize={11} />
                <YAxis fontSize={11} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <ChartTooltip content={<ChartTooltipContent formatter={(v) => formatBRL(v as number)} />} />
                {ranking.map((f, i) => (
                  <Line key={f.franchiseId} type="monotone" dataKey={f.franchiseName} stroke={`hsl(${i * 80}, 70%, 50%)`} strokeWidth={2} dot={{ r: 3 }} />
                ))}
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Revenue by Product */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Receita por Produto</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={Object.fromEntries(productData.map(p => [p.name, { label: p.name, color: p.fill }]))} className="h-[250px]">
              <PieChart>
                <Pie data={productData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} strokeWidth={0}>
                  {productData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent formatter={(v) => formatBRL(v as number)} />} />
              </PieChart>
            </ChartContainer>
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              {productData.map((p) => (
                <div key={p.name} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.fill }} />
                  <span className="text-muted-foreground">{p.name}</span>
                  <span className="font-medium">{formatBRL(p.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
