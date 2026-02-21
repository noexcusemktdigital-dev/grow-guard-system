import { useState, useMemo } from "react";
import { Target, Save, AlertTriangle, Brain, TrendingUp, Users, ClipboardCheck, Rocket, ChevronRight, Lightbulb, Zap, BarChart3, ArrowUpRight, ArrowDownRight, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/KpiCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/hooks/use-toast";
import { getPlanoVendasDefaults } from "@/data/clienteData";
import { AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from "recharts";

const CANAIS_OPTIONS = ["Google Ads", "Instagram", "Indicação", "Site", "LinkedIn", "Outro"];
const FERRAMENTAS_OPTIONS = ["CRM", "WhatsApp", "Email", "Telefone"];
const DIAGNOSTICO_PERGUNTAS = [
  "Seu processo de vendas está documentado?",
  "Você acompanha taxa de conversão por etapa?",
  "Existe gestão ativa de leads e follow-up?",
  "Suas metas são baseadas em dados históricos?",
  "Você usa CRM integrado ao dia a dia?",
];
const RADAR_LABELS = ["Processo", "Conversão", "Gestão Leads", "Metas", "CRM"];

function getNivel(score: number) {
  if (score <= 25) return { label: "Inicial", cor: "#dc2626", desc: "Processo comercial precisa ser construído do zero." };
  if (score <= 50) return { label: "Estruturando", cor: "#ea580c", desc: "Algumas bases existem, mas falta consistência." };
  if (score <= 75) return { label: "Escalável", cor: "#eab308", desc: "Estrutura sólida, pronta para escalar com ajustes." };
  return { label: "Alta Performance", cor: "#16a34a", desc: "Máquina comercial rodando com previsibilidade." };
}

// Mock data for charts
const weeklyPerformance = [
  { semana: "Sem 1", leads: 28, propostas: 12, vendas: 4 },
  { semana: "Sem 2", leads: 35, propostas: 15, vendas: 6 },
  { semana: "Sem 3", leads: 22, propostas: 10, vendas: 3 },
  { semana: "Sem 4", leads: 40, propostas: 18, vendas: 7 },
];

export default function ClientePlanoVendas() {
  const defaults = getPlanoVendasDefaults();
  const [state, setState] = useState(defaults);
  const [activeTab, setActiveTab] = useState("visao");
  const navigate = useNavigate();

  const set = <K extends keyof typeof state>(k: K, v: (typeof state)[K]) => setState(s => ({ ...s, [k]: v }));

  const toggleArray = (field: "canais" | "ferramentas", val: string) => {
    setState(s => ({
      ...s,
      [field]: s[field].includes(val) ? s[field].filter(v => v !== val) : [...s[field], val],
    }));
  };

  // ===== Cálculos derivados =====
  const calc = useMemo(() => {
    const vendasNecessarias = Math.ceil(state.metaFaturamento / state.ticketMedio);
    const propostasNecessarias = Math.ceil(vendasNecessarias / (state.conversaoVenda / 100));
    const leadsNecessarios = Math.ceil(propostasNecessarias / (state.conversaoProposta / 100));
    const contatosNecessarios = Math.ceil(leadsNecessarios * 1.5);
    const metaDiaria = state.metaFaturamento / 22;
    const metaSemanal = state.metaFaturamento / 4;
    const leadsDiarios = Math.ceil(leadsNecessarios / 22);
    const leadsSemanais = Math.ceil(leadsNecessarios / 4);
    const crescimento = state.receitaAtual > 0 ? ((state.receitaDesejada - state.receitaAtual) / state.receitaAtual) * 100 : 0;
    const scoreMaturidade = state.respostasDiagnostico.reduce((a, b) => a + b, 0) / (5 * 5) * 100;
    return { vendasNecessarias, propostasNecessarias, leadsNecessarios, contatosNecessarios, metaDiaria, metaSemanal, leadsDiarios, leadsSemanais, crescimento, scoreMaturidade };
  }, [state]);

  const nivel = getNivel(calc.scoreMaturidade);

  const filledTabs = [
    state.receitaAtual > 0,
    state.metaFaturamento > 0,
    state.vendedores > 0,
    state.respostasDiagnostico.some(r => r > 0),
  ].filter(Boolean).length;

  // Projeção de crescimento
  const mesesLabel = state.periodo === "mensal" ? 1 : state.periodo === "trimestral" ? 3 : state.periodo === "semestral" ? 6 : 12;
  const projecaoData = Array.from({ length: mesesLabel + 1 }, (_, i) => ({
    mes: `Mês ${i}`,
    receita: Math.round(state.receitaAtual + (state.receitaDesejada - state.receitaAtual) * (i / mesesLabel)),
  }));

  // Radar data
  const radarData = RADAR_LABELS.map((label, i) => ({
    subject: label,
    value: state.respostasDiagnostico[i] || 0,
    fullMark: 5,
  }));

  // Funil data
  const funnelSteps = [
    { label: "Contatos", value: calc.contatosNecessarios, color: "hsl(var(--muted-foreground))" },
    { label: "Leads", value: calc.leadsNecessarios, color: "#eab308" },
    { label: "Propostas", value: calc.propostasNecessarias, color: "#ea580c" },
    { label: "Vendas", value: calc.vendasNecessarias, color: "#16a34a" },
  ];
  const maxFunnel = funnelSteps[0].value || 1;

  // Insights
  const insights: { text: string; severity: "warn" | "error" | "success" | "info" }[] = [];
  if (state.conversaoVenda < 15) insights.push({ text: "Seu funil indica baixa conversão. Recomendamos revisar a etapa de proposta.", severity: "error" });
  if (calc.leadsNecessarios > state.leadsAtivos * 1.3) insights.push({ text: `Sua meta exige ${Math.round(((calc.leadsNecessarios - state.leadsAtivos) / state.leadsAtivos) * 100)}% mais leads do que você tem hoje.`, severity: "warn" });
  if (state.vendedores > 0 && state.vendedores < calc.vendasNecessarias / 10) insights.push({ text: "Sua equipe pode estar subdimensionada para a meta.", severity: "warn" });
  if (!state.processoEstruturado) insights.push({ text: "A falta de processo impacta diretamente a previsibilidade comercial.", severity: "error" });
  if (state.conversaoVenda >= 20) insights.push({ text: "Sua taxa de conversão está acima da média do mercado. Excelente!", severity: "success" });
  if (state.canais.length >= 3) insights.push({ text: "Boa diversificação de canais de aquisição. Continue testando e otimizando.", severity: "info" });

  const insightColors = {
    error: { border: "border-destructive/40", bg: "bg-destructive/5", icon: "text-destructive" },
    warn: { border: "border-yellow-500/40", bg: "bg-yellow-500/5", icon: "text-yellow-500" },
    success: { border: "border-emerald-500/40", bg: "bg-emerald-500/5", icon: "text-emerald-500" },
    info: { border: "border-blue-500/40", bg: "bg-blue-500/5", icon: "text-blue-500" },
  };

  const insightIcons = {
    error: AlertTriangle,
    warn: AlertCircle,
    success: ArrowUpRight,
    info: Lightbulb,
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Plano de Vendas"
        subtitle="Cérebro estratégico — diagnóstico + motor de metas"
        icon={<Target className="w-5 h-5 text-primary" />}
        actions={
          <Button size="sm" onClick={() => toast({ title: "Plano salvo com sucesso!" })}>
            <Save className="w-4 h-4 mr-1" /> Salvar
          </Button>
        }
      />

      {/* Barra de progresso */}
      <Card>
        <CardContent className="py-4 flex items-center gap-4">
          <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Progresso do plano</span>
          <Progress value={(filledTabs / 4) * 100} className="h-2 flex-1" />
          <Badge variant="secondary" className="text-xs">{filledTabs}/4</Badge>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/50 p-1.5">
          {[
            { value: "visao", icon: TrendingUp, label: "Visão Geral" },
            { value: "metas", icon: Target, label: "Minhas Metas" },
            { value: "estrutura", icon: Users, label: "Estrutura Comercial" },
            { value: "diagnostico", icon: ClipboardCheck, label: "Avaliar Meu Comercial" },
          ].map(t => (
            <TabsTrigger key={t.value} value={t.value} className="flex-1 min-w-[140px] gap-1.5 text-xs">
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ===== ABA 1: Visão Geral (com alertas, insights, gráficos e plano de ação) ===== */}
        <TabsContent value="visao" className="space-y-5">
          {/* KPIs de alto nível */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Receita Atual" value={`R$ ${state.receitaAtual.toLocaleString()}`} />
            <KpiCard label="Meta" value={`R$ ${state.metaFaturamento.toLocaleString()}`} variant="accent" />
            <KpiCard label="Crescimento" value={`${calc.crescimento.toFixed(1)}%`} trend={calc.crescimento > 0 ? "up" : "down"} />
            <KpiCard label="Maturidade" value={`${Math.round(calc.scoreMaturidade)}%`} sublabel={nivel.label} />
          </div>

          {/* Alertas e Insights */}
          {insights.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-primary" /> Alertas & Insights
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {insights.map((ins, i) => {
                  const style = insightColors[ins.severity];
                  const Icon = insightIcons[ins.severity];
                  return (
                    <Card key={i} className={`${style.border} ${style.bg}`}>
                      <CardContent className="py-3 flex items-start gap-3">
                        <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${style.icon}`} />
                        <p className="text-sm">{ins.text}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Projeção de crescimento */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Projeção de Crescimento</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={projecaoData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString()}`} />
                    <Area type="monotone" dataKey="receita" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.2)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Performance semanal */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Performance Semanal</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={weeklyPerformance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="semana" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip />
                    <Bar dataKey="leads" fill="hsl(var(--chart-2))" name="Leads" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="propostas" fill="hsl(var(--chart-3))" name="Propostas" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="vendas" fill="hsl(var(--primary))" name="Vendas" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Funil dinâmico */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Funil Dinâmico</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {funnelSteps.map(step => (
                <div key={step.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">{step.label}</span>
                    <span className="font-bold">{step.value}</span>
                  </div>
                  <div className="h-6 rounded-md overflow-hidden bg-muted">
                    <div
                      className="h-full rounded-md transition-all duration-500"
                      style={{ width: `${Math.max((step.value / maxFunnel) * 100, 4)}%`, backgroundColor: step.color }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Metas diárias (do Plano de Ação) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Leads / dia" value={calc.leadsDiarios.toString()} variant="accent" />
            <KpiCard label="Leads / semana" value={calc.leadsSemanais.toString()} />
            <KpiCard label="Vendas / semana" value={Math.ceil(calc.vendasNecessarias / 4).toString()} />
            <KpiCard label="Valor / semana" value={`R$ ${Math.round(calc.metaSemanal).toLocaleString()}`} />
          </div>

          {/* Estratégia de abordagem (do Plano de Ação) */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Rocket className="w-4 h-4 text-primary" /> Plano de Ação</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                Com base no modelo <strong>{state.tipoVenda}</strong> e nos canais selecionados ({state.canais.join(", ") || "nenhum"}), recomendamos:
              </p>
              {(state.tipoVenda as string) === "B2B" && <p>• Foque em prospecção ativa com abordagem consultiva e follow-ups estruturados.</p>}
              {(state.tipoVenda as string) === "B2C" && <p>• Priorize campanhas de performance e automação de nutrição.</p>}
              {(state.tipoVenda as string) === "Hibrido" && <p>• Combine prospecção ativa para contas-chave com automação para volume.</p>}
              {state.canais.includes("Instagram") && <p>• Use Instagram para gerar autoridade e converter via conteúdo educativo.</p>}
              {state.canais.includes("Google Ads") && <p>• Google Ads para captura de demanda existente — foque em palavras de alta intenção.</p>}
              {state.canais.includes("Indicação") && <p>• Estruture um programa de indicação com incentivos claros.</p>}
            </CardContent>
          </Card>

          {/* Botões de integração */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-1" onClick={() => { toast({ title: "Gerando scripts com base no plano..." }); navigate("/cliente/scripts"); }}>
              <span className="font-semibold text-sm">Criar Scripts Automaticamente</span>
              <span className="text-xs text-muted-foreground">Baseado no nicho e tipo de venda</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-1" onClick={() => { toast({ title: "Gerando playbook estratégico..." }); navigate("/cliente/scripts"); }}>
              <span className="font-semibold text-sm">Gerar Playbook</span>
              <span className="text-xs text-muted-foreground">Roteiro completo de vendas</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-1" onClick={() => { toast({ title: "Atualizando metas no CRM..." }); navigate("/cliente/crm"); }}>
              <span className="font-semibold text-sm">Atualizar Metas no CRM</span>
              <span className="text-xs text-muted-foreground">Sincronizar funil e metas</span>
            </Button>
          </div>

          {/* Resumo consolidado */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Resumo do Plano</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-1 text-muted-foreground">
              <p><strong>Período:</strong> {state.periodo} | <strong>Tipo:</strong> {state.tipoVenda} | <strong>Mercado:</strong> {state.mercado}</p>
              <p><strong>Meta:</strong> R$ {state.metaFaturamento.toLocaleString()} | <strong>Ticket:</strong> R$ {state.ticketMedio.toLocaleString()}</p>
              <p><strong>Funil:</strong> {calc.contatosNecessarios} contatos → {calc.leadsNecessarios} leads → {calc.propostasNecessarias} propostas → {calc.vendasNecessarias} vendas</p>
              <p><strong>Equipe:</strong> {state.vendedores} vendedores | <strong>Fechamento:</strong> {state.tempoFechamento} dias</p>
              <p><strong>Maturidade:</strong> {Math.round(calc.scoreMaturidade)}% — {nivel.label}</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== ABA 2: Minhas Metas ===== */}
        <TabsContent value="metas" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Período</CardTitle></CardHeader>
              <CardContent>
                <Select value={state.periodo} onValueChange={v => set("periodo", v as typeof state.periodo)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="trimestral">Trimestral</SelectItem>
                    <SelectItem value="semestral">Semestral</SelectItem>
                    <SelectItem value="anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Tipo de Venda</CardTitle></CardHeader>
              <CardContent>
                <Select value={state.tipoVenda} onValueChange={v => set("tipoVenda", v as typeof state.tipoVenda)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="B2B">B2B</SelectItem>
                    <SelectItem value="B2C">B2C</SelectItem>
                    <SelectItem value="Hibrido">Híbrido</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Mercado de Atuação</CardTitle></CardHeader>
              <CardContent>
                <Input value={state.mercado} onChange={e => set("mercado", e.target.value)} />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Receita Atual Média (R$)</CardTitle></CardHeader>
              <CardContent>
                <Input type="number" value={state.receitaAtual} onChange={e => set("receitaAtual", Number(e.target.value))} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Receita Desejada (R$)</CardTitle></CardHeader>
              <CardContent>
                <Input type="number" value={state.receitaDesejada} onChange={e => set("receitaDesejada", Number(e.target.value))} />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Meta Faturamento (R$)</CardTitle></CardHeader>
              <CardContent><Input type="number" value={state.metaFaturamento} onChange={e => set("metaFaturamento", Number(e.target.value))} /></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Ticket Médio (R$)</CardTitle></CardHeader>
              <CardContent><Input type="number" value={state.ticketMedio} onChange={e => set("ticketMedio", Number(e.target.value))} /></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Conversão Lead→Venda (%)</CardTitle></CardHeader>
              <CardContent><Input type="number" value={state.conversaoVenda} onChange={e => set("conversaoVenda", Number(e.target.value))} step={0.1} /></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Conversão Lead→Proposta (%)</CardTitle></CardHeader>
              <CardContent><Input type="number" value={state.conversaoProposta} onChange={e => set("conversaoProposta", Number(e.target.value))} step={0.1} /></CardContent>
            </Card>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Vendas Necessárias" value={calc.vendasNecessarias.toString()} variant="accent" />
            <KpiCard label="Propostas Necessárias" value={calc.propostasNecessarias.toString()} />
            <KpiCard label="Leads Necessários" value={calc.leadsNecessarios.toString()} sublabel={`${defaults.leadsAtivos} ativos agora`} trend={defaults.leadsAtivos >= calc.leadsNecessarios ? "up" : "down"} />
            <KpiCard label="Contatos Necessários" value={calc.contatosNecessarios.toString()} />
          </div>

          {/* Meta detalhada */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="py-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div><p className="text-2xl font-black text-primary">R$ {Math.round(calc.metaDiaria).toLocaleString()}</p><p className="text-xs text-muted-foreground">Meta / dia útil</p></div>
              <div><p className="text-2xl font-black">R$ {Math.round(calc.metaSemanal).toLocaleString()}</p><p className="text-xs text-muted-foreground">Meta / semana</p></div>
              <div><p className="text-2xl font-black">{calc.leadsDiarios}</p><p className="text-xs text-muted-foreground">Leads / dia</p></div>
              <div><p className="text-2xl font-black">{calc.leadsSemanais}</p><p className="text-xs text-muted-foreground">Leads / semana</p></div>
            </CardContent>
          </Card>

          {/* Projeção */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Projeção de Crescimento</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={projecaoData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString()}`} />
                  <Area type="monotone" dataKey="receita" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.2)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== ABA 3: Estrutura Comercial ===== */}
        <TabsContent value="estrutura" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Vendedores</CardTitle></CardHeader>
              <CardContent><Input type="number" value={state.vendedores} onChange={e => set("vendedores", Number(e.target.value))} /></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Tempo Médio de Fechamento (dias)</CardTitle></CardHeader>
              <CardContent><Input type="number" value={state.tempoFechamento} onChange={e => set("tempoFechamento", Number(e.target.value))} /></CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Canais de Aquisição</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                {CANAIS_OPTIONS.map(c => (
                  <label key={c} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={state.canais.includes(c)} onCheckedChange={() => toggleArray("canais", c)} />
                    {c}
                  </label>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Ferramentas Usadas</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                {FERRAMENTAS_OPTIONS.map(f => (
                  <label key={f} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={state.ferramentas.includes(f)} onCheckedChange={() => toggleArray("ferramentas", f)} />
                    {f}
                  </label>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="py-4 flex items-center justify-between">
              <Label className="text-sm">Processo comercial estruturado?</Label>
              <Switch checked={state.processoEstruturado} onCheckedChange={v => set("processoEstruturado", v)} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== ABA 4: Avaliar Meu Comercial ===== */}
        <TabsContent value="diagnostico" className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Avalie sua Maturidade Comercial (1 a 5)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {DIAGNOSTICO_PERGUNTAS.map((q, i) => (
                <div key={i} className="space-y-1">
                  <Label className="text-sm">{i + 1}. {q}</Label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(v => (
                      <Button
                        key={v}
                        size="sm"
                        variant={state.respostasDiagnostico[i] === v ? "default" : "outline"}
                        className="w-10 h-10"
                        onClick={() => {
                          const arr = [...state.respostasDiagnostico];
                          arr[i] = v;
                          set("respostasDiagnostico", arr);
                        }}
                      >
                        {v}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Termômetro */}
            <Card>
              <CardContent className="py-6 text-center space-y-3">
                <p className="text-5xl font-black" style={{ color: nivel.cor }}>{Math.round(calc.scoreMaturidade)}%</p>
                <Badge className="text-sm px-4 py-1 text-white" style={{ backgroundColor: nivel.cor }}>{nivel.label}</Badge>
                <p className="text-sm text-muted-foreground">{nivel.desc}</p>
                <div className="relative mt-4">
                  <div className="h-4 rounded-full overflow-hidden" style={{ background: "linear-gradient(90deg, #dc2626 0%, #ea580c 33%, #eab308 66%, #16a34a 100%)" }}>
                    <div className="absolute top-0 w-1 h-4 bg-foreground rounded-full shadow-lg transition-all duration-500" style={{ left: `${Math.min(Math.max(calc.scoreMaturidade, 2), 98)}%`, transform: "translateX(-50%)" }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Radar Chart */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Radar de Maturidade</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                    <Radar dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.3)" fillOpacity={0.6} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Sugestões de IA */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent relative overflow-hidden">
            <Badge className="absolute top-3 right-3 text-[10px]" variant="secondary"><Brain className="w-3 h-3 mr-1" /> Powered by IA</Badge>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Recomendações Inteligentes</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {calc.scoreMaturidade <= 25 && (
                <>
                  <p className="text-sm text-muted-foreground">• Comece documentando seu processo de vendas passo a passo.</p>
                  <p className="text-sm text-muted-foreground">• Implante um CRM e registre todas as interações com leads.</p>
                  <p className="text-sm text-muted-foreground">• Defina metas semanais simples e acompanhe diariamente.</p>
                </>
              )}
              {calc.scoreMaturidade > 25 && calc.scoreMaturidade <= 50 && (
                <>
                  <p className="text-sm text-muted-foreground">• Estruture um funil de vendas com etapas claras e mensuráveis.</p>
                  <p className="text-sm text-muted-foreground">• Automatize follow-ups para leads que não respondem em 48h.</p>
                  <p className="text-sm text-muted-foreground">• Invista em scripts de vendas para padronizar a abordagem.</p>
                </>
              )}
              {calc.scoreMaturidade > 50 && calc.scoreMaturidade <= 75 && (
                <>
                  <p className="text-sm text-muted-foreground">• Otimize taxas de conversão por etapa do funil.</p>
                  <p className="text-sm text-muted-foreground">• Implante relatórios semanais de performance por vendedor.</p>
                  <p className="text-sm text-muted-foreground">• Considere escalar com novos canais de aquisição.</p>
                </>
              )}
              {calc.scoreMaturidade > 75 && (
                <>
                  <p className="text-sm text-muted-foreground">• Foque em previsibilidade: forecast semanal com precisão acima de 85%.</p>
                  <p className="text-sm text-muted-foreground">• Implante upselling e cross-selling para aumentar ticket médio.</p>
                  <p className="text-sm text-muted-foreground">• Automatize processos repetitivos com IA para liberar tempo dos vendedores.</p>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
