import { useState, useMemo } from "react";
import {
  BarChart3, TrendingUp, TrendingDown, Users, DollarSign,
  ArrowUpRight, ArrowDownRight, Target, Eye
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getRelatorioDashboardData } from "@/data/clienteData";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar,
} from "recharts";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const kpiCards = [
  { label: "Receita Total", value: "R$ 47.500", change: "+12%", trend: "up", icon: DollarSign, gradient: "from-emerald-500/15 to-emerald-600/5" },
  { label: "Leads Captados", value: "134", change: "+23%", trend: "up", icon: Users, gradient: "from-blue-500/15 to-blue-600/5" },
  { label: "Taxa de Conversão", value: "18,5%", change: "+2.3pp", trend: "up", icon: Target, gradient: "from-purple-500/15 to-purple-600/5" },
  { label: "Ticket Médio", value: "R$ 4.500", change: "-3%", trend: "down", icon: Eye, gradient: "from-amber-500/15 to-amber-600/5" },
];

export default function ClienteRelatorios() {
  const data = useMemo(() => getRelatorioDashboardData(), []);
  const [period, setPeriod] = useState("30d");

  const conversionRadial = [
    { name: "Conversão", value: 72, fill: "hsl(var(--primary))" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Relatórios"
        subtitle="Análises de vendas, conversão e performance"
        icon={<BarChart3 className="w-5 h-5 text-primary" />}
        actions={
          <div className="flex gap-1 p-1 rounded-lg bg-muted/50 border">
            {["7d", "30d", "90d"].map(p => (
              <Button
                key={p}
                variant={period === p ? "default" : "ghost"}
                size="sm"
                className="text-xs h-7 px-3"
                onClick={() => setPeriod(p)}
              >
                {p}
              </Button>
            ))}
          </div>
        }
      />

      {/* KPI Cards with animated gradients */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, i) => (
          <Card
            key={kpi.label}
            className="relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${kpi.gradient} opacity-60`} />
            <CardContent className="relative p-4">
              <div className="flex items-start justify-between">
                <div className="w-9 h-9 rounded-lg bg-background/50 border flex items-center justify-center">
                  <kpi.icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <Badge
                  variant="outline"
                  className={`text-[9px] gap-0.5 ${kpi.trend === "up" ? "text-emerald-400 border-emerald-500/30" : "text-red-400 border-red-500/30"}`}
                >
                  {kpi.trend === "up" ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                  {kpi.change}
                </Badge>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold tracking-tight">{kpi.value}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{kpi.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue area chart */}
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Receita Acumulada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.receitaAcumulada}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="mes" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="receita"
                    stroke="hsl(var(--primary))"
                    fill="url(#revenueGrad)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Conversion radial */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" /> Meta vs Realizado
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <div className="h-48 w-full">
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
              <p className="text-3xl font-bold">72%</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">da meta atingida</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales bar chart */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" /> Vendas por Período
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.vendasPorPeriodo}>
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.9} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="period" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="vendas" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Conversion by channel */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" /> Conversão por Canal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56 flex items-center">
              <div className="w-1/2 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.conversaoPorCanal}
                      dataKey="taxa"
                      nameKey="canal"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={45}
                      strokeWidth={2}
                      stroke="hsl(var(--card))"
                    >
                      {data.conversaoPorCanal.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-1/2 space-y-2">
                {data.conversaoPorCanal.map((item, i) => (
                  <div key={item.canal} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-xs flex-1 truncate">{item.canal}</span>
                    <span className="text-xs font-bold">{item.taxa}%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
