import { useState, useMemo } from "react";
import { Target, Save, AlertTriangle, Brain, TrendingUp, Users, Globe, ClipboardCheck, Rocket, ChevronRight } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { getPlanoVendasDefaults } from "@/data/clienteData";
import { AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

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

  // Tabs completadas (simples: considera preenchida se os campos-chave mudaram dos defaults iniciais)
  const tabKeys = ["visao", "meta", "estrutura", "mercado", "diagnostico", "acao"];
  const filledTabs = [
    state.receitaAtual > 0,
    state.metaFaturamento > 0,
    state.vendedores > 0,
    state.concorrentes.some(c => c.trim() !== ""),
    state.respostasDiagnostico.some(r => r > 0),
    true, // aba de ação é sempre "preenchida"
  ].filter(Boolean).length;

  // Projeção de crescimento (AreaChart)
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

  // Insights (aba 3)
  const insights: { text: string; severity: "warn" | "error" }[] = [];
  if (state.conversaoVenda < 15) insights.push({ text: "Seu funil indica baixa conversão. Recomendamos revisar a etapa de proposta.", severity: "error" });
  if (calc.leadsNecessarios > state.leadsAtivos * 1.3) insights.push({ text: `Sua meta exige ${Math.round(((calc.leadsNecessarios - state.leadsAtivos) / state.leadsAtivos) * 100)}% mais leads do que você tem hoje.`, severity: "warn" });
  if (state.vendedores > 0 && state.vendedores < calc.vendasNecessarias / 10) insights.push({ text: "Sua equipe pode estar subdimensionada para a meta.", severity: "warn" });
  if (!state.processoEstruturado) insights.push({ text: "A falta de processo impacta diretamente a previsibilidade comercial.", severity: "error" });

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
          <Progress value={(filledTabs / 6) * 100} className="h-2 flex-1" />
          <Badge variant="secondary" className="text-xs">{filledTabs}/6</Badge>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/50 p-1.5">
          {[
            { value: "visao", icon: TrendingUp, label: "Visão Geral" },
            { value: "meta", icon: Target, label: "Meta Financeira" },
            { value: "estrutura", icon: Users, label: "Estrutura Comercial" },
            { value: "mercado", icon: Globe, label: "Mercado" },
            { value: "diagnostico", icon: ClipboardCheck, label: "Diagnóstico" },
            { value: "acao", icon: Rocket, label: "Plano de Ação" },
          ].map(t => (
            <TabsTrigger key={t.value} value={t.value} className="flex-1 min-w-[120px] gap-1.5 text-xs">
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ===== ABA 1: Visão Geral ===== */}
        <TabsContent value="visao" className="space-y-4">
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

          {/* Crescimento calculado + gráfico */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="py-6 text-center">
                <p className="text-3xl font-black text-primary">{calc.crescimento.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground mt-1">Crescimento desejado</p>
              </CardContent>
            </Card>
            <Card className="md:col-span-2">
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
          </div>
        </TabsContent>

        {/* ===== ABA 2: Meta Financeira ===== */}
        <TabsContent value="meta" className="space-y-4">
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

          {/* Meta detalhada */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="py-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div><p className="text-2xl font-black text-primary">R$ {Math.round(calc.metaDiaria).toLocaleString()}</p><p className="text-xs text-muted-foreground">Meta / dia útil</p></div>
              <div><p className="text-2xl font-black">R$ {Math.round(calc.metaSemanal).toLocaleString()}</p><p className="text-xs text-muted-foreground">Meta / semana</p></div>
              <div><p className="text-2xl font-black">{calc.leadsDiarios}</p><p className="text-xs text-muted-foreground">Leads / dia</p></div>
              <div><p className="text-2xl font-black">{calc.leadsSemanais}</p><p className="text-xs text-muted-foreground">Leads / semana</p></div>
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

          {/* Insights automáticos */}
          {insights.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Insights Automáticos</h3>
              {insights.map((ins, i) => (
                <Card key={i} className={ins.severity === "error" ? "border-destructive/40 bg-destructive/5" : "border-yellow-500/40 bg-yellow-500/5"}>
                  <CardContent className="py-3 flex items-start gap-3">
                    <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${ins.severity === "error" ? "text-destructive" : "text-yellow-500"}`} />
                    <p className="text-sm">{ins.text}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ===== ABA 4: Mercado ===== */}
        <TabsContent value="mercado" className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Principais Concorrentes</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {state.concorrentes.map((c, i) => (
                <Input
                  key={i}
                  placeholder={`Concorrente ${i + 1}`}
                  value={c}
                  onChange={e => {
                    const arr = [...state.concorrentes];
                    arr[i] = e.target.value;
                    set("concorrentes", arr);
                  }}
                />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Diferenciais Competitivos</CardTitle></CardHeader>
            <CardContent>
              <Textarea value={state.diferenciais} onChange={e => set("diferenciais", e.target.value)} rows={3} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Posicionamento de Preço</CardTitle></CardHeader>
              <CardContent>
                <Select value={state.posicionamento} onValueChange={v => set("posicionamento", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Abaixo do mercado">Abaixo do mercado</SelectItem>
                    <SelectItem value="Na média">Na média</SelectItem>
                    <SelectItem value="Acima do mercado">Acima do mercado</SelectItem>
                    <SelectItem value="Premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Saturação do Mercado ({state.saturacao}/10)</CardTitle></CardHeader>
              <CardContent className="pt-2">
                <Slider value={[state.saturacao]} onValueChange={v => set("saturacao", v[0])} min={1} max={10} step={1} />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>Baixa</span><span>Média</span><span>Alta</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sugestões de IA */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent relative overflow-hidden">
            <Badge className="absolute top-3 right-3 text-[10px]" variant="secondary"><Brain className="w-3 h-3 mr-1" /> Powered by IA</Badge>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Sugestões de IA</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">• Baseado no seu nicho, considere diferenciação por atendimento personalizado.</p>
              <p className="text-sm text-muted-foreground">• Posicionamento premium requer prova social forte — invista em cases de sucesso.</p>
              <p className="text-sm text-muted-foreground">• Mercados com saturação acima de 7 exigem estratégia de nicho bem definida.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== ABA 5: Diagnóstico ===== */}
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
                {/* Mini termômetro */}
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
        </TabsContent>

        {/* ===== ABA 6: Plano de Ação ===== */}
        <TabsContent value="acao" className="space-y-4">
          {/* Metas calculadas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Leads / dia" value={calc.leadsDiarios.toString()} variant="accent" />
            <KpiCard label="Leads / semana" value={calc.leadsSemanais.toString()} />
            <KpiCard label="Vendas / semana" value={Math.ceil(calc.vendasNecessarias / 4).toString()} />
            <KpiCard label="Valor / semana" value={`R$ ${Math.round(calc.metaSemanal).toLocaleString()}`} />
          </div>

          {/* Estratégia de abordagem */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Estratégia de Abordagem</CardTitle></CardHeader>
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

          {/* Sugestões baseadas nos insights */}
          {insights.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Ações Recomendadas</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {insights.map((ins, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <ChevronRight className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                    <span>{ins.text}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

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
      </Tabs>
    </div>
  );
}
