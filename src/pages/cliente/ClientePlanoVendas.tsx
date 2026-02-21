import { useState, useMemo } from "react";
import { Target, Save, AlertTriangle, Brain, TrendingUp, Users, ClipboardCheck, Rocket, Lightbulb, Zap, ArrowUpRight, ArrowDownRight, AlertCircle, Calendar, Plus, Lock, CheckCircle2, FileText, Phone, Mail, MessageSquare, Building2, UserCheck, Layers, BarChart3, History } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from "recharts";

// ── Types ──
interface InfoAtual { receitaAtual: number; ticketMedio: number; clientesAtivos: number; conversaoMedia: number; }
interface MetaMensal { id: string; mes: string; ano: number; faturamento: number; novosClientes: number; }
interface EstruturaComercial {
  tamanhoEquipe: string; temSDR: string; temCloser: string; temCS: string;
  canaisAquisicao: string[]; ferramentas: string[]; processoDocumentado: boolean;
  etapasProcesso: string[]; tempoMedioFechamento: string; reuniaoRecorrente: boolean;
  frequenciaReuniao: string;
}
interface Avaliacao { id: string; data: string; respostas: number[]; score: number; }

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const CANAIS_OPTIONS = ["Google Ads", "Instagram", "Facebook", "LinkedIn", "Indicação", "Site/SEO", "WhatsApp", "TikTok", "Cold Call", "Outro"];
const FERRAMENTAS_OPTIONS = ["CRM", "WhatsApp Business", "Email Marketing", "Telefone", "ERP", "Planilhas", "Automação (RD, HubSpot)", "Nenhuma"];

const AVALIACAO_PERGUNTAS = [
  { pergunta: "Seu processo de vendas está documentado e é seguido pela equipe?", bloco: "Processo" },
  { pergunta: "Você acompanha taxa de conversão por etapa do funil?", bloco: "Processo" },
  { pergunta: "Existe gestão ativa de leads com follow-up estruturado?", bloco: "Gestão de Leads" },
  { pergunta: "Seus vendedores usam scripts ou roteiros padronizados?", bloco: "Gestão de Leads" },
  { pergunta: "Suas metas são baseadas em dados históricos e projeções?", bloco: "Metas" },
  { pergunta: "Você tem reuniões comerciais recorrentes com a equipe?", bloco: "Metas" },
  { pergunta: "Você usa CRM integrado ao dia a dia da operação?", bloco: "Ferramentas" },
  { pergunta: "Há automações no processo comercial (follow-up, nutrição)?", bloco: "Ferramentas" },
  { pergunta: "Você mede ROI dos seus canais de aquisição?", bloco: "Performance" },
  { pergunta: "Seus relatórios comerciais são gerados e analisados semanalmente?", bloco: "Performance" },
];
const RADAR_LABELS = ["Processo", "Gestão de Leads", "Metas", "Ferramentas", "Performance"];

function getNivel(score: number) {
  if (score <= 25) return { label: "Inicial", cor: "#dc2626", desc: "Processo comercial precisa ser construído do zero." };
  if (score <= 50) return { label: "Estruturando", cor: "#ea580c", desc: "Algumas bases existem, mas falta consistência." };
  if (score <= 75) return { label: "Escalável", cor: "#eab308", desc: "Estrutura sólida, pronta para escalar com ajustes." };
  return { label: "Alta Performance", cor: "#16a34a", desc: "Máquina comercial rodando com previsibilidade." };
}

// ── Mock weekly data ──
const weeklyPerformance = [
  { semana: "Sem 1", leads: 28, propostas: 12, vendas: 4 },
  { semana: "Sem 2", leads: 35, propostas: 15, vendas: 6 },
  { semana: "Sem 3", leads: 22, propostas: 10, vendas: 3 },
  { semana: "Sem 4", leads: 40, propostas: 18, vendas: 7 },
];

export default function ClientePlanoVendas() {
  const [activeTab, setActiveTab] = useState("visao");

  // ── METAS STATE ──
  const [infoAtual, setInfoAtual] = useState<InfoAtual>({ receitaAtual: 0, ticketMedio: 0, clientesAtivos: 0, conversaoMedia: 0 });
  const [infoAtualSalva, setInfoAtualSalva] = useState(false);
  const [metasMensais, setMetasMensais] = useState<MetaMensal[]>([]);
  const [metasSalvas, setMetasSalvas] = useState(false);
  const [novaMeta, setNovaMeta] = useState<{ faturamento: number; novosClientes: number }>({ faturamento: 0, novosClientes: 0 });
  const mesAtualIdx = new Date().getMonth(); // 0-based
  const anoAtual = new Date().getFullYear();

  // ── ESTRUTURA STATE ──
  const [estrutura, setEstrutura] = useState<EstruturaComercial>({
    tamanhoEquipe: "", temSDR: "", temCloser: "", temCS: "",
    canaisAquisicao: [], ferramentas: [], processoDocumentado: false,
    etapasProcesso: [], tempoMedioFechamento: "", reuniaoRecorrente: false,
    frequenciaReuniao: "",
  });
  const [estruturaSalva, setEstruturaSalva] = useState(false);

  // ── AVALIAÇÃO STATE ──
  const [respostasAvaliacao, setRespostasAvaliacao] = useState<number[]>(new Array(AVALIACAO_PERGUNTAS.length).fill(0));
  const [avaliacoesSalvas, setAvaliacoesSalvas] = useState<Avaliacao[]>([]);
  const [avaliacaoAtiva, setAvaliacaoAtiva] = useState(true); // true = formulário aberto

  const toggleCanal = (c: string) => setEstrutura(prev => ({ ...prev, canaisAquisicao: prev.canaisAquisicao.includes(c) ? prev.canaisAquisicao.filter(x => x !== c) : [...prev.canaisAquisicao, c] }));
  const toggleFerramenta = (f: string) => setEstrutura(prev => ({ ...prev, ferramentas: prev.ferramentas.includes(f) ? prev.ferramentas.filter(x => x !== f) : [...prev.ferramentas, f] }));

  // ── Checks for Visão Geral ──
  const temMetas = metasSalvas;
  const temEstrutura = estruturaSalva;
  const temAvaliacao = avaliacoesSalvas.length > 0;
  const visaoDesbloqueada = temMetas && temEstrutura && temAvaliacao;

  // ── Derived calcs for Visão Geral ──
  const ultimaAvaliacao = avaliacoesSalvas[avaliacoesSalvas.length - 1];
  const scoreAvaliacao = ultimaAvaliacao?.score ?? 0;
  const nivelAvaliacao = getNivel(scoreAvaliacao);

  const totalMetaAnual = metasMensais.reduce((s, m) => s + m.faturamento, 0);
  const metaFatMensal = totalMetaAnual > 0 ? Math.round(totalMetaAnual / 12) : 0;
  const EQUIPE_MAP: Record<string, number> = { "Só eu": 1, "2-3 pessoas": 2, "4-7 pessoas": 5, "8-15 pessoas": 10, "16+ pessoas": 20 };
  const totalEquipe = EQUIPE_MAP[estrutura.tamanhoEquipe] || 0;

  // Radar data from last evaluation
  const radarData = useMemo(() => {
    if (!ultimaAvaliacao) return [];
    const blocos = RADAR_LABELS;
    return blocos.map((label, i) => {
      const pergsDoBloco = AVALIACAO_PERGUNTAS.filter(p => p.bloco === label);
      const indices = pergsDoBloco.map(p => AVALIACAO_PERGUNTAS.indexOf(p));
      const media = indices.length > 0 ? indices.reduce((s, idx) => s + (ultimaAvaliacao.respostas[idx] || 0), 0) / indices.length : 0;
      return { subject: label, value: Math.round(media * 10) / 10, fullMark: 5 };
    });
  }, [ultimaAvaliacao]);

  // Insights based on all data
  const insights = useMemo(() => {
    if (!visaoDesbloqueada) return [];
    const ins: { text: string; severity: "warn" | "error" | "success" | "info" }[] = [];
    if (scoreAvaliacao <= 25) ins.push({ text: "Seu comercial está no nível Inicial. Priorize documentar o processo e implantar um CRM.", severity: "error" });
    if (scoreAvaliacao > 25 && scoreAvaliacao <= 50) ins.push({ text: "Seu comercial está se estruturando. Foque em padronizar follow-ups e metas semanais.", severity: "warn" });
    if (scoreAvaliacao > 75) ins.push({ text: "Seu comercial está em Alta Performance! Foque em escalar e otimizar margem.", severity: "success" });
    if (totalEquipe === 0) ins.push({ text: "Nenhum membro na equipe comercial. Considere contratar ou terceirizar.", severity: "error" });
    if (totalEquipe > 0 && totalEquipe < 3) ins.push({ text: "Equipe enxuta. Considere contratar SDRs para aumentar geração de leads.", severity: "warn" });
    if (!estrutura.processoDocumentado) ins.push({ text: "Processo comercial não documentado. Isso reduz previsibilidade.", severity: "error" });
    if (estrutura.canaisAquisicao.length < 2) ins.push({ text: "Poucos canais de aquisição. Diversifique para reduzir risco.", severity: "warn" });
    if (estrutura.canaisAquisicao.length >= 4) ins.push({ text: "Boa diversificação de canais. Continue testando e otimizando.", severity: "info" });
    if (infoAtual.conversaoMedia > 0 && infoAtual.conversaoMedia < 15) ins.push({ text: `Sua conversão atual (${infoAtual.conversaoMedia}%) está abaixo da média. Revise seu funil.`, severity: "warn" });
    if (estrutura.reuniaoRecorrente) ins.push({ text: "Reuniões recorrentes ajudam na previsibilidade. Mantenha a cadência.", severity: "success" });
    return ins;
  }, [visaoDesbloqueada, scoreAvaliacao, totalEquipe, estrutura, infoAtual]);

  const insightColors = {
    error: { border: "border-destructive/40", bg: "bg-destructive/5", icon: "text-destructive" },
    warn: { border: "border-yellow-500/40", bg: "bg-yellow-500/5", icon: "text-yellow-500" },
    success: { border: "border-emerald-500/40", bg: "bg-emerald-500/5", icon: "text-emerald-500" },
    info: { border: "border-blue-500/40", bg: "bg-blue-500/5", icon: "text-blue-500" },
  };
  const insightIcons = { error: AlertTriangle, warn: AlertCircle, success: ArrowUpRight, info: Lightbulb };

  // Plano de ação items
  const planoDeAcao = useMemo(() => {
    if (!visaoDesbloqueada) return [];
    const acoes: { titulo: string; descricao: string; prioridade: "alta" | "media" | "baixa" }[] = [];
    if (!estrutura.processoDocumentado) acoes.push({ titulo: "Documentar processo comercial", descricao: "Crie um playbook com cada etapa do funil, scripts e critérios de qualificação.", prioridade: "alta" });
    if (totalEquipe < 3) acoes.push({ titulo: "Expandir equipe comercial", descricao: `Você tem ${totalEquipe} pessoa(s). Considere contratar SDRs para acelerar prospecção.`, prioridade: "media" });
    if (estrutura.canaisAquisicao.length < 3) acoes.push({ titulo: "Diversificar canais de aquisição", descricao: "Teste pelo menos 3 canais diferentes para reduzir dependência.", prioridade: "media" });
    if (scoreAvaliacao <= 50) acoes.push({ titulo: "Implantar rotina de CRM", descricao: "Garanta que 100% dos leads são registrados e acompanhados no CRM diariamente.", prioridade: "alta" });
    if (!estrutura.reuniaoRecorrente) acoes.push({ titulo: "Criar reunião comercial semanal", descricao: "Reunião de 30 min para revisar pipeline, metas e gargalos.", prioridade: "media" });
    if (metaFatMensal > 0) acoes.push({ titulo: "Definir metas semanais", descricao: `Meta mensal de R$ ${metaFatMensal.toLocaleString()} = ~R$ ${Math.round(metaFatMensal / 4).toLocaleString()}/semana.`, prioridade: "baixa" });
    return acoes;
  }, [visaoDesbloqueada, estrutura, totalEquipe, scoreAvaliacao, metaFatMensal]);

  const prioridadeCores = { alta: "bg-destructive/10 text-destructive border-destructive/30", media: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30", baixa: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30" };

  // Projeção
  const projecaoData = totalMetaAnual > 0
    ? MESES.map((m, i) => ({ mes: m, meta: Math.round(totalMetaAnual * ((i + 1) / 12)), realizado: Math.round(totalMetaAnual * ((i + 1) / 12) * (0.6 + Math.random() * 0.5)) }))
    : [];

  // Save metas
  const salvarMetas = () => { setMetasSalvas(true); toast({ title: "Metas salvas com sucesso!" }); };
  const salvarEstrutura = () => { setEstruturaSalva(true); toast({ title: "Estrutura comercial salva!" }); };
  const finalizarAvaliacao = () => {
    const total = respostasAvaliacao.reduce((a, b) => a + b, 0);
    const max = AVALIACAO_PERGUNTAS.length * 5;
    const score = Math.round((total / max) * 100);
    const nova: Avaliacao = { id: `av-${Date.now()}`, data: new Date().toLocaleDateString("pt-BR"), respostas: [...respostasAvaliacao], score };
    setAvaliacoesSalvas(prev => [...prev, nova]);
    setAvaliacaoAtiva(false);
    setRespostasAvaliacao(new Array(AVALIACAO_PERGUNTAS.length).fill(0));
    toast({ title: `Avaliação concluída! Score: ${score}%` });
  };

  const podeNovaAvaliacao = useMemo(() => {
    if (avaliacoesSalvas.length === 0) return true;
    // Simula cooldown de 30 dias
    return false; // In real app, check date diff
  }, [avaliacoesSalvas]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Plano de Vendas"
        subtitle="Estratégia comercial completa — metas, estrutura e diagnóstico"
        icon={<Target className="w-5 h-5 text-primary" />}
      />

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
              {t.value === "visao" && !visaoDesbloqueada && <Lock className="w-3 h-3 text-muted-foreground" />}
              {t.value === "metas" && temMetas && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
              {t.value === "estrutura" && temEstrutura && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
              {t.value === "diagnostico" && temAvaliacao && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ===== VISÃO GERAL ===== */}
        <TabsContent value="visao" className="space-y-5">
          {!visaoDesbloqueada ? (
            <Card className="border-dashed border-2">
              <CardContent className="py-16 text-center space-y-4">
                <Lock className="w-12 h-12 mx-auto text-muted-foreground/50" />
                <h3 className="text-lg font-semibold">Visão Geral Bloqueada</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Para desbloquear a visão geral do seu comercial, preencha as 3 seções abaixo:
                </p>
                <div className="flex flex-col items-center gap-2 mt-4">
                  <div className="flex items-center gap-2 text-sm">
                    {temMetas ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />}
                    <span className={temMetas ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-muted-foreground"}>Minhas Metas</span>
                    {!temMetas && <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setActiveTab("metas")}>Preencher →</Button>}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {temEstrutura ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />}
                    <span className={temEstrutura ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-muted-foreground"}>Estrutura Comercial</span>
                    {!temEstrutura && <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setActiveTab("estrutura")}>Preencher →</Button>}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {temAvaliacao ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />}
                    <span className={temAvaliacao ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-muted-foreground"}>Avaliar Meu Comercial</span>
                    {!temAvaliacao && <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setActiveTab("diagnostico")}>Preencher →</Button>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard label="Receita Atual" value={`R$ ${infoAtual.receitaAtual.toLocaleString()}`} />
                <KpiCard label="Meta Acumulada" value={`R$ ${totalMetaAnual.toLocaleString()}`} variant="accent" />
                <KpiCard label="Meta Mensal" value={`R$ ${metaFatMensal.toLocaleString()}`} />
                <KpiCard label="Equipe" value={estrutura.tamanhoEquipe || "—"} sublabel={`SDR: ${estrutura.temSDR} | Closer: ${estrutura.temCloser}`} />
                <KpiCard label="Maturidade" value={`${scoreAvaliacao}%`} sublabel={nivelAvaliacao.label} />
              </div>

              {/* Alertas & Insights */}
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

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {projecaoData.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Projeção Anual</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={projecaoData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                          <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                          <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString()}`} />
                          <Area type="monotone" dataKey="meta" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.15)" strokeWidth={2} name="Meta" />
                          <Area type="monotone" dataKey="realizado" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2)/0.15)" strokeWidth={2} name="Projeção" strokeDasharray="5 5" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
                {radarData.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Radar de Maturidade</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <RadarChart data={radarData}>
                          <PolarGrid stroke="hsl(var(--border))" />
                          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                          <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                          <Radar dataKey="value" stroke={nivelAvaliacao.cor} fill={nivelAvaliacao.cor} fillOpacity={0.3} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Plano de Ação */}
              {planoDeAcao.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Rocket className="w-3.5 h-3.5 text-primary" /> Plano de Ação
                  </h3>
                  <div className="space-y-2">
                    {planoDeAcao.map((acao, i) => (
                      <Card key={i} className={`border ${prioridadeCores[acao.prioridade]}`}>
                        <CardContent className="py-3 flex items-start gap-3">
                          <Badge variant="outline" className="text-[10px] shrink-0 mt-0.5">{acao.prioridade}</Badge>
                          <div>
                            <p className="text-sm font-medium">{acao.titulo}</p>
                            <p className="text-xs text-muted-foreground">{acao.descricao}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Resumo consolidado */}
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                <CardHeader className="pb-2"><CardTitle className="text-sm">Resumo Consolidado</CardTitle></CardHeader>
                <CardContent className="text-sm space-y-1 text-muted-foreground">
                  <p><strong>Receita Atual:</strong> R$ {infoAtual.receitaAtual.toLocaleString()} | <strong>Ticket Médio:</strong> R$ {infoAtual.ticketMedio.toLocaleString()} | <strong>Meta Total:</strong> R$ {totalMetaAnual.toLocaleString()}</p>
                  <p><strong>Equipe:</strong> {estrutura.tamanhoEquipe} | <strong>SDR:</strong> {estrutura.temSDR} | <strong>Closer:</strong> {estrutura.temCloser} | <strong>CS:</strong> {estrutura.temCS}</p>
                  <p><strong>Canais:</strong> {estrutura.canaisAquisicao.join(", ") || "Nenhum"}</p>
                  <p><strong>Processo documentado:</strong> {estrutura.processoDocumentado ? "Sim" : "Não"} | <strong>Tempo fechamento:</strong> {estrutura.tempoMedioFechamento} dias</p>
                  <p><strong>Maturidade:</strong> {scoreAvaliacao}% — {nivelAvaliacao.label}</p>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ===== MINHAS METAS ===== */}
        <TabsContent value="metas" className="space-y-5">
          {/* Informações Atuais */}
          <Card className={`overflow-hidden ${infoAtualSalva ? "border-emerald-500/20" : ""}`}>
            <CardHeader className="pb-3 bg-gradient-to-r from-cyan-500/10 to-transparent border-b border-cyan-500/10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-cyan-500/15"><BarChart3 className="w-4 h-4 text-cyan-500" /></div>
                  Informações Atuais
                </CardTitle>
                {infoAtualSalva && <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 text-[10px]"><CheckCircle2 className="w-3 h-3 mr-1" />Salvo</Badge>}
              </div>
              <p className="text-xs text-muted-foreground">Antes de definir suas metas, precisamos entender onde você está hoje.</p>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Receita Atual Mensal (R$)</Label>
                <Input type="number" value={infoAtual.receitaAtual || ""} disabled={infoAtualSalva}
                  onChange={e => setInfoAtual(p => ({ ...p, receitaAtual: Number(e.target.value) }))} placeholder="Ex: 47500" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Ticket Médio (R$)</Label>
                <Input type="number" value={infoAtual.ticketMedio || ""} disabled={infoAtualSalva}
                  onChange={e => setInfoAtual(p => ({ ...p, ticketMedio: Number(e.target.value) }))} placeholder="Ex: 4500" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Clientes Ativos</Label>
                <Input type="number" value={infoAtual.clientesAtivos || ""} disabled={infoAtualSalva}
                  onChange={e => setInfoAtual(p => ({ ...p, clientesAtivos: Number(e.target.value) }))} placeholder="Ex: 35" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Conversão Média (%)</Label>
                <Input type="number" value={infoAtual.conversaoMedia || ""} disabled={infoAtualSalva}
                  onChange={e => setInfoAtual(p => ({ ...p, conversaoMedia: Number(e.target.value) }))} placeholder="Ex: 20" step={0.1} />
              </div>
            </CardContent>
            {!infoAtualSalva && (
              <div className="px-6 pb-4">
                <Button size="sm" onClick={() => { setInfoAtualSalva(true); toast({ title: "Informações atuais salvas!" }); }}
                  disabled={infoAtual.receitaAtual === 0}>
                  <Save className="w-3 h-3 mr-1" /> Salvar Informações
                </Button>
              </div>
            )}
          </Card>

          {/* Metas Mensais - Cards */}
          {infoAtualSalva && (
            <>
              <div className="flex items-center justify-between">
                <div>
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary/15"><Calendar className="w-4 h-4 text-primary" /></div>
                  Metas Mensais
                </h3>
                  <p className="text-xs text-muted-foreground">Adicione metas a partir do mês atual. Cada meta fica salva como um card.</p>
                </div>
              </div>

              {/* Cards de metas salvas */}
              {metasMensais.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {metasMensais.map(m => (
                    <Card key={m.id} className="border-emerald-500/20 bg-emerald-500/5">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge className="text-xs bg-primary/10 text-primary border-primary/20" variant="outline">{m.mes}/{m.ano}</Badge>
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Faturamento</p>
                            <p className="text-lg font-bold">R$ {m.faturamento.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Novos Clientes</p>
                            <p className="text-lg font-bold">{m.novosClientes}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Adicionar nova meta */}
              {(() => {
                // Determina próximo mês disponível
                const mesesUsados = metasMensais.map(m => `${m.mes}-${m.ano}`);
                let proximoMesIdx = mesAtualIdx;
                let proximoAno = anoAtual;
                // Avança até encontrar mês não usado
                while (mesesUsados.includes(`${MESES[proximoMesIdx]}-${proximoAno}`)) {
                  proximoMesIdx++;
                  if (proximoMesIdx > 11) { proximoMesIdx = 0; proximoAno++; }
                  if (proximoAno > anoAtual + 1) break; // Limite de 2 anos
                }
                const proximoMes = MESES[proximoMesIdx];

                return (
                  <Card className="border-dashed border-2">
                    <CardContent className="p-4 space-y-4">
                      <div className="flex items-center gap-2">
                        <Plus className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold">Nova meta — {proximoMes}/{proximoAno}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-muted-foreground">Faturamento (R$)</Label>
                          <Input type="number" value={novaMeta.faturamento || ""} onChange={e => setNovaMeta(p => ({ ...p, faturamento: Number(e.target.value) }))} placeholder="Ex: 65000" />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Novos Clientes</Label>
                          <Input type="number" value={novaMeta.novosClientes || ""} onChange={e => setNovaMeta(p => ({ ...p, novosClientes: Number(e.target.value) }))} placeholder="Ex: 10" />
                        </div>
                      </div>
                      <Button size="sm" disabled={novaMeta.faturamento === 0} onClick={() => {
                        const nova: MetaMensal = { id: `meta-${Date.now()}`, mes: proximoMes, ano: proximoAno, faturamento: novaMeta.faturamento, novosClientes: novaMeta.novosClientes };
                        setMetasMensais(prev => [...prev, nova]);
                        setNovaMeta({ faturamento: 0, novosClientes: 0 });
                        setMetasSalvas(true);
                        toast({ title: `Meta de ${proximoMes}/${proximoAno} adicionada!` });
                      }}>
                        <Plus className="w-3 h-3 mr-1" /> Adicionar Meta
                      </Button>
                    </CardContent>
                  </Card>
                );
              })()}

              {/* Resumo */}
              {metasMensais.length > 0 && (
                <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                  <CardContent className="py-4 grid grid-cols-3 gap-4 text-center">
                    <div><p className="text-xl font-black text-primary">R$ {totalMetaAnual.toLocaleString()}</p><p className="text-xs text-muted-foreground">Total acumulado</p></div>
                    <div><p className="text-xl font-black">{metasMensais.reduce((s, m) => s + m.novosClientes, 0)}</p><p className="text-xs text-muted-foreground">Total clientes</p></div>
                    <div><p className="text-xl font-black">{metasMensais.length}</p><p className="text-xs text-muted-foreground">Meses definidos</p></div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {!infoAtualSalva && (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Preencha as informações atuais acima para começar a definir suas metas.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ===== ESTRUTURA COMERCIAL ===== */}
        <TabsContent value="estrutura" className="space-y-5">
          {/* Equipe */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-3 bg-gradient-to-r from-blue-500/10 to-transparent border-b border-blue-500/10">
              <CardTitle className="text-sm flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-500/15"><Users className="w-4 h-4 text-blue-500" /></div>
                Equipe Comercial
              </CardTitle>
              <p className="text-xs text-muted-foreground">Quem faz parte da sua operação de vendas</p>
            </CardHeader>
            <CardContent className="pt-4 space-y-5">
              <div>
                <Label className="text-xs font-semibold mb-2 block flex items-center gap-1.5"><UserCheck className="w-3.5 h-3.5 text-blue-500" /> Quantas pessoas trabalham no comercial?</Label>
                <div className="flex flex-wrap gap-2">
                  {["Só eu", "2-3 pessoas", "4-7 pessoas", "8-15 pessoas", "16+ pessoas"].map(opt => (
                    <Button key={opt} size="sm" variant={estrutura.tamanhoEquipe === opt ? "default" : "outline"}
                      onClick={() => setEstrutura(p => ({ ...p, tamanhoEquipe: opt }))}>{opt}</Button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 rounded-xl bg-muted/30 space-y-2">
                  <Label className="text-xs font-semibold block">SDR / Pré-vendas</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {["Sim", "Não", "Pretendo"].map(opt => (
                      <Button key={opt} size="sm" className="text-xs h-7 px-2.5" variant={estrutura.temSDR === opt ? "default" : "outline"}
                        onClick={() => setEstrutura(p => ({ ...p, temSDR: opt }))}>{opt}</Button>
                    ))}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-muted/30 space-y-2">
                  <Label className="text-xs font-semibold block">Closer / Vendedor</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {["Sim", "Não", "Eu mesmo"].map(opt => (
                      <Button key={opt} size="sm" className="text-xs h-7 px-2.5" variant={estrutura.temCloser === opt ? "default" : "outline"}
                        onClick={() => setEstrutura(p => ({ ...p, temCloser: opt }))}>{opt}</Button>
                    ))}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-muted/30 space-y-2">
                  <Label className="text-xs font-semibold block">CS / Pós-venda</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {["Sim", "Não", "Pretendo"].map(opt => (
                      <Button key={opt} size="sm" className="text-xs h-7 px-2.5" variant={estrutura.temCS === opt ? "default" : "outline"}
                        onClick={() => setEstrutura(p => ({ ...p, temCS: opt }))}>{opt}</Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Processo */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-3 bg-gradient-to-r from-amber-500/10 to-transparent border-b border-amber-500/10">
              <CardTitle className="text-sm flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/15"><Layers className="w-4 h-4 text-amber-500" /></div>
                Processo Comercial
              </CardTitle>
              <p className="text-xs text-muted-foreground">Como funciona sua operação de vendas hoje</p>
            </CardHeader>
            <CardContent className="pt-4 space-y-5">
              <div>
                <Label className="text-xs font-semibold mb-2 block flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-amber-500" /> Processo documentado?</Label>
                <div className="flex gap-2">
                  {["Sim, completo", "Parcialmente", "Não"].map(opt => (
                    <Button key={opt} size="sm" variant={(estrutura.processoDocumentado && opt === "Sim, completo") || (!estrutura.processoDocumentado && opt === "Não") ? "default" : "outline"}
                      onClick={() => setEstrutura(p => ({ ...p, processoDocumentado: opt === "Sim, completo" }))}>{opt}</Button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs font-semibold mb-2 block flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-amber-500" /> Quais etapas existem no seu funil?</Label>
                <div className="flex flex-wrap gap-2">
                  {["Prospecção", "Qualificação", "Apresentação", "Proposta", "Negociação", "Fechamento", "Pós-venda"].map(etapa => (
                    <Button key={etapa} size="sm" variant={estrutura.etapasProcesso.includes(etapa) ? "default" : "outline"}
                      className={estrutura.etapasProcesso.includes(etapa) ? "" : "border-dashed"}
                      onClick={() => setEstrutura(p => ({
                        ...p,
                        etapasProcesso: p.etapasProcesso.includes(etapa) ? p.etapasProcesso.filter(e => e !== etapa) : [...p.etapasProcesso, etapa]
                      }))}>{etapa}</Button>
                  ))}
                </div>
                {estrutura.etapasProcesso.length > 0 && (
                  <p className="text-[10px] text-muted-foreground mt-1.5">{estrutura.etapasProcesso.length} etapas selecionadas: {estrutura.etapasProcesso.join(" → ")}</p>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold mb-2 block flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-amber-500" /> Tempo médio de fechamento</Label>
                  <div className="flex flex-wrap gap-2">
                    {["Até 7 dias", "7-15 dias", "15-30 dias", "30-60 dias", "60+ dias"].map(opt => (
                      <Button key={opt} size="sm" variant={estrutura.tempoMedioFechamento === opt ? "default" : "outline"}
                        onClick={() => setEstrutura(p => ({ ...p, tempoMedioFechamento: opt }))}>{opt}</Button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-semibold mb-2 block flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-amber-500" /> Reunião comercial recorrente?</Label>
                  <div className="flex gap-2">
                    {["Sim", "Não"].map(opt => (
                      <Button key={opt} size="sm" variant={(estrutura.reuniaoRecorrente && opt === "Sim") || (!estrutura.reuniaoRecorrente && opt === "Não") ? "default" : "outline"}
                        onClick={() => setEstrutura(p => ({ ...p, reuniaoRecorrente: opt === "Sim" }))}>{opt}</Button>
                    ))}
                  </div>
                  {estrutura.reuniaoRecorrente && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {["Diária", "Semanal", "Quinzenal", "Mensal"].map(opt => (
                        <Button key={opt} size="sm" className="text-xs h-7" variant={estrutura.frequenciaReuniao === opt ? "default" : "outline"}
                          onClick={() => setEstrutura(p => ({ ...p, frequenciaReuniao: opt }))}>{opt}</Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Canais e Ferramentas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="overflow-hidden">
              <CardHeader className="pb-3 bg-gradient-to-r from-emerald-500/10 to-transparent border-b border-emerald-500/10">
                <CardTitle className="text-sm flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/15"><TrendingUp className="w-4 h-4 text-emerald-500" /></div>
                  Canais de Aquisição
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3 flex flex-wrap gap-2">
                {CANAIS_OPTIONS.map(c => (
                  <Button key={c} size="sm" variant={estrutura.canaisAquisicao.includes(c) ? "default" : "outline"}
                    className={estrutura.canaisAquisicao.includes(c) ? "" : "border-dashed"}
                    onClick={() => toggleCanal(c)}>{c}</Button>
                ))}
              </CardContent>
            </Card>
            <Card className="overflow-hidden">
              <CardHeader className="pb-3 bg-gradient-to-r from-purple-500/10 to-transparent border-b border-purple-500/10">
                <CardTitle className="text-sm flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-purple-500/15"><Zap className="w-4 h-4 text-purple-500" /></div>
                  Ferramentas Utilizadas
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3 flex flex-wrap gap-2">
                {FERRAMENTAS_OPTIONS.map(f => (
                  <Button key={f} size="sm" variant={estrutura.ferramentas.includes(f) ? "default" : "outline"}
                    className={estrutura.ferramentas.includes(f) ? "" : "border-dashed"}
                    onClick={() => toggleFerramenta(f)}>{f}</Button>
                ))}
              </CardContent>
            </Card>
          </div>

          <Button onClick={salvarEstrutura} className="w-full">
            <Save className="w-4 h-4 mr-2" /> Salvar Estrutura Comercial
          </Button>
        </TabsContent>

        {/* ===== AVALIAR MEU COMERCIAL ===== */}
        <TabsContent value="diagnostico" className="space-y-5">
          {/* Histórico de avaliações */}
          {avaliacoesSalvas.length > 0 && (
            <Card className="overflow-hidden">
              <CardHeader className="pb-3 bg-gradient-to-r from-slate-500/10 to-transparent border-b border-slate-500/10">
                <CardTitle className="text-sm flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-slate-500/15"><History className="w-4 h-4 text-slate-400" /></div>
                  Histórico de Avaliações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {avaliacoesSalvas.map((av, i) => {
                  const nvl = getNivel(av.score);
                  return (
                    <div key={av.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-xs">#{i + 1}</Badge>
                        <span className="text-sm">{av.data}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold" style={{ color: nvl.cor }}>{av.score}%</span>
                        <Badge style={{ backgroundColor: nvl.cor }} className="text-white text-[10px]">{nvl.label}</Badge>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Formulário ou resultado */}
          {avaliacaoAtiva ? (
            <>
              <Card className="overflow-hidden">
                <CardHeader className="pb-3 bg-gradient-to-r from-orange-500/10 to-transparent border-b border-orange-500/10">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-orange-500/15"><ClipboardCheck className="w-4 h-4 text-orange-500" /></div>
                    Avalie sua Maturidade Comercial
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Responda com honestidade (1 a 5). A avaliação ficará salva e poderá ser refeita após 30 dias.</p>
                </CardHeader>
                <CardContent className="space-y-5">
                  {(() => {
                    const blocos = [...new Set(AVALIACAO_PERGUNTAS.map(p => p.bloco))];
                    return blocos.map(bloco => (
                      <div key={bloco}>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-3">{bloco}</h4>
                        <div className="space-y-3">
                          {AVALIACAO_PERGUNTAS.filter(p => p.bloco === bloco).map(p => {
                            const idx = AVALIACAO_PERGUNTAS.indexOf(p);
                            return (
                              <div key={idx} className="space-y-1">
                                <Label className="text-sm">{idx + 1}. {p.pergunta}</Label>
                                <div className="flex gap-2">
                                  {[1, 2, 3, 4, 5].map(v => (
                                    <Button key={v} size="sm" variant={respostasAvaliacao[idx] === v ? "default" : "outline"} className="w-10 h-10"
                                      onClick={() => { const arr = [...respostasAvaliacao]; arr[idx] = v; setRespostasAvaliacao(arr); }}>
                                      {v}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ));
                  })()}
                </CardContent>
              </Card>

              <Button onClick={finalizarAvaliacao} className="w-full" size="lg"
                disabled={respostasAvaliacao.some(r => r === 0)}>
                <ClipboardCheck className="w-4 h-4 mr-2" /> Finalizar Avaliação
              </Button>
            </>
          ) : (
            <>
              {/* Resultado da última avaliação */}
              {ultimaAvaliacao && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="overflow-hidden">
                    <CardHeader className="pb-3 bg-gradient-to-r from-rose-500/10 to-transparent border-b border-rose-500/10">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-rose-500/15"><Target className="w-4 h-4 text-rose-500" /></div>
                        Score de Maturidade
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-6 text-center space-y-3">
                      <p className="text-5xl font-black" style={{ color: nivelAvaliacao.cor }}>{scoreAvaliacao}%</p>
                      <Badge className="text-sm px-4 py-1 text-white" style={{ backgroundColor: nivelAvaliacao.cor }}>{nivelAvaliacao.label}</Badge>
                      <p className="text-sm text-muted-foreground">{nivelAvaliacao.desc}</p>
                      <div className="relative mt-4">
                        <div className="h-4 rounded-full overflow-hidden" style={{ background: "linear-gradient(90deg, #dc2626 0%, #ea580c 33%, #eab308 66%, #16a34a 100%)" }}>
                          <div className="absolute top-0 w-1 h-4 bg-foreground rounded-full shadow-lg transition-all" style={{ left: `${Math.min(Math.max(scoreAvaliacao, 2), 98)}%`, transform: "translateX(-50%)" }} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  {radarData.length > 0 && (
                    <Card className="overflow-hidden">
                      <CardHeader className="pb-2 bg-gradient-to-r from-indigo-500/10 to-transparent border-b border-indigo-500/10">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-indigo-500/15"><BarChart3 className="w-4 h-4 text-indigo-500" /></div>
                          Radar de Maturidade
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={220}>
                          <RadarChart data={radarData}>
                            <PolarGrid stroke="hsl(var(--border))" />
                            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                            <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                            <Radar dataKey="value" stroke={nivelAvaliacao.cor} fill={nivelAvaliacao.cor} fillOpacity={0.3} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Recomendações */}
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent relative overflow-hidden">
                <Badge className="absolute top-3 right-3 text-[10px]" variant="secondary"><Brain className="w-3 h-3 mr-1" /> IA</Badge>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Recomendações</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {scoreAvaliacao <= 25 && <>
                    <p className="text-sm text-muted-foreground">• Comece documentando seu processo de vendas passo a passo.</p>
                    <p className="text-sm text-muted-foreground">• Implante um CRM e registre todas as interações com leads.</p>
                    <p className="text-sm text-muted-foreground">• Defina metas semanais simples e acompanhe diariamente.</p>
                  </>}
                  {scoreAvaliacao > 25 && scoreAvaliacao <= 50 && <>
                    <p className="text-sm text-muted-foreground">• Estruture um funil de vendas com etapas claras e mensuráveis.</p>
                    <p className="text-sm text-muted-foreground">• Automatize follow-ups para leads sem resposta em 48h.</p>
                    <p className="text-sm text-muted-foreground">• Invista em scripts de vendas para padronizar a abordagem.</p>
                  </>}
                  {scoreAvaliacao > 50 && scoreAvaliacao <= 75 && <>
                    <p className="text-sm text-muted-foreground">• Otimize taxas de conversão por etapa do funil.</p>
                    <p className="text-sm text-muted-foreground">• Implante relatórios semanais de performance por vendedor.</p>
                    <p className="text-sm text-muted-foreground">• Considere escalar com novos canais de aquisição.</p>
                  </>}
                  {scoreAvaliacao > 75 && <>
                    <p className="text-sm text-muted-foreground">• Foque em previsibilidade: forecast semanal com precisão acima de 85%.</p>
                    <p className="text-sm text-muted-foreground">• Implante upselling e cross-selling para aumentar ticket médio.</p>
                    <p className="text-sm text-muted-foreground">• Automatize processos repetitivos com IA.</p>
                  </>}
                </CardContent>
              </Card>

              {/* Nova avaliação */}
              <Card className="border-dashed">
                <CardContent className="py-6 text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {podeNovaAvaliacao
                      ? "Você pode criar uma nova avaliação."
                      : "Próxima avaliação disponível em 30 dias."}
                  </p>
                  <Button variant="outline" disabled={!podeNovaAvaliacao} onClick={() => setAvaliacaoAtiva(true)}>
                    <Plus className="w-4 h-4 mr-1" /> Nova Avaliação
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
