import { useState, useMemo } from "react";
import { Target, Save, AlertTriangle, Brain, TrendingUp, Users, ClipboardCheck, Rocket, Lightbulb, Zap, ArrowUpRight, ArrowDownRight, AlertCircle, Calendar, Plus, Lock, CheckCircle2, FileText, Phone, Mail, MessageSquare, Building2, UserCheck, Layers, BarChart3, History, DollarSign, UserPlus, Handshake, ShieldCheck, Receipt, BarChartHorizontal, Megaphone, Trash2, FolderOpen, ChevronDown, ChevronRight, Filter, Pencil, X, Check } from "lucide-react";
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
import { AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, LineChart, Line } from "recharts";

// ── Types ──
interface InfoAtual {
  receitaMensal: string; ticketMedio: string; clientesAtivos: string; conversaoMedia: string;
  leadsMensais: string; reunioesMensais: string; contratosMensais: string; taxaRetencao: string;
}
type TipoMeta = "faturamento" | "novos_clientes" | "contratos" | "retencao" | "ticket_medio" | "conversao" | "leads" | "reunioes";
type EscopoMeta = "empresa" | "equipe" | "individual";
type PeriodoMeta = "mensal" | "trimestral" | "semestral" | "anual";
interface MetaMensal {
  id: string; nome: string; mesRef: string; tipo: TipoMeta; escopo: EscopoMeta;
  periodo: PeriodoMeta; valorAlvo: number; equipe?: string; responsavel?: string;
  prioridade: "alta" | "media" | "baixa";
}

function fmtBRL(v: number) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
function fmtNum(v: number) { return v.toLocaleString("pt-BR"); }
function fmtPct(v: number) { return `${v.toLocaleString("pt-BR")}%`; }
interface EstruturaComercial {
  tamanhoEquipe: string; temSDR: string; temCloser: string; temCS: string;
  canaisAquisicao: string[]; ferramentas: string[]; processoDocumentado: string;
  etapasProcesso: string[]; tempoMedioFechamento: string; reuniaoRecorrente: boolean;
  frequenciaReuniao: string;
}
type EscopoAvaliacao = "empresa" | "individual";
interface Avaliacao { id: string; data: string; respostas: number[]; score: number; escopo: EscopoAvaliacao; vendedor?: string; }

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const CANAIS_OPTIONS = ["Google Ads", "Instagram", "Facebook", "LinkedIn", "Indicação", "Site/SEO", "WhatsApp", "TikTok", "Cold Call", "Outro"];

const TIPO_META_LABELS: Record<TipoMeta, string> = {
  faturamento: "Faturamento", novos_clientes: "Novos Clientes", contratos: "Contratos",
  retencao: "Retenção", ticket_medio: "Ticket Médio", conversao: "Conversão",
  leads: "Leads Gerados", reunioes: "Reuniões",
};
const TIPO_META_CONFIG: Record<TipoMeta, { label: string; icon: typeof Target; color: string; bg: string; gradient: string }> = {
  faturamento: { label: "Faturamento", icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-500/15", gradient: "bg-gradient-to-r from-emerald-400 to-emerald-600" },
  novos_clientes: { label: "Novos Clientes", icon: UserPlus, color: "text-blue-500", bg: "bg-blue-500/15", gradient: "bg-gradient-to-r from-blue-400 to-blue-600" },
  contratos: { label: "Contratos", icon: FileText, color: "text-purple-500", bg: "bg-purple-500/15", gradient: "bg-gradient-to-r from-purple-400 to-purple-600" },
  retencao: { label: "Retenção", icon: ShieldCheck, color: "text-teal-500", bg: "bg-teal-500/15", gradient: "bg-gradient-to-r from-teal-400 to-teal-600" },
  ticket_medio: { label: "Ticket Médio", icon: Receipt, color: "text-orange-500", bg: "bg-orange-500/15", gradient: "bg-gradient-to-r from-orange-400 to-orange-600" },
  conversao: { label: "Conversão", icon: BarChartHorizontal, color: "text-indigo-500", bg: "bg-indigo-500/15", gradient: "bg-gradient-to-r from-indigo-400 to-indigo-600" },
  leads: { label: "Leads Gerados", icon: Megaphone, color: "text-pink-500", bg: "bg-pink-500/15", gradient: "bg-gradient-to-r from-pink-400 to-pink-600" },
  reunioes: { label: "Reuniões", icon: Handshake, color: "text-cyan-500", bg: "bg-cyan-500/15", gradient: "bg-gradient-to-r from-cyan-400 to-cyan-600" },
};
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
  const [infoAtual, setInfoAtual] = useState<InfoAtual>({ receitaMensal: "", ticketMedio: "", clientesAtivos: "", conversaoMedia: "", leadsMensais: "", reunioesMensais: "", contratosMensais: "", taxaRetencao: "" });
  const [infoAtualSalva, setInfoAtualSalva] = useState(false);
  const [metasMensais, setMetasMensais] = useState<MetaMensal[]>([]);
  const [metasSalvas, setMetasSalvas] = useState(false);
  const [novaMeta, setNovaMeta] = useState<{ nome: string; mesRef: string; tipo: TipoMeta; escopo: EscopoMeta; periodo: PeriodoMeta; valorAlvo: number; equipe: string; responsavel: string; prioridade: "alta" | "media" | "baixa" }>({ nome: "", mesRef: "", tipo: "faturamento", escopo: "empresa", periodo: "mensal", valorAlvo: 0, equipe: "", responsavel: "", prioridade: "media" });
  const MESES_COMPLETOS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const anoAtual = new Date().getFullYear();

  // ── ESTRUTURA STATE ──
  const [estrutura, setEstrutura] = useState<EstruturaComercial>({
    tamanhoEquipe: "", temSDR: "", temCloser: "", temCS: "",
    canaisAquisicao: [], ferramentas: [], processoDocumentado: "",
    etapasProcesso: [], tempoMedioFechamento: "", reuniaoRecorrente: false,
    frequenciaReuniao: "",
  });
  const [estruturaSalva, setEstruturaSalva] = useState(false);
  const [estruturaDataSalva, setEstruturaDataSalva] = useState("");

  // ── AVALIAÇÃO STATE ──
  const [respostasAvaliacao, setRespostasAvaliacao] = useState<number[]>(new Array(AVALIACAO_PERGUNTAS.length).fill(0));
  const [avaliacoesSalvas, setAvaliacoesSalvas] = useState<Avaliacao[]>([]);
  const [avaliacaoAtiva, setAvaliacaoAtiva] = useState(false);
  const [avaliacaoEscopo, setAvaliacaoEscopo] = useState<EscopoAvaliacao>("empresa");
  const [avaliacaoVendedor, setAvaliacaoVendedor] = useState("");
  const [historicoFiltro, setHistoricoFiltro] = useState<"todos" | "empresa" | "individual">("todos");
  const [pastasAbertas, setPastasAbertas] = useState<Record<string, boolean>>({});

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

  const metasFaturamento = metasMensais.filter(m => m.tipo === "faturamento");
  const totalMetaAnual = metasFaturamento.reduce((s, m) => s + m.valorAlvo, 0);
  const metaFatMensal = totalMetaAnual > 0 ? Math.round(totalMetaAnual / metasFaturamento.length) : 0;
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
    if (estrutura.processoDocumentado === "Não" || !estrutura.processoDocumentado) ins.push({ text: "Processo comercial não documentado. Isso reduz previsibilidade.", severity: "error" });
    if (estrutura.canaisAquisicao.length < 2) ins.push({ text: "Poucos canais de aquisição. Diversifique para reduzir risco.", severity: "warn" });
    if (estrutura.canaisAquisicao.length >= 4) ins.push({ text: "Boa diversificação de canais. Continue testando e otimizando.", severity: "info" });
    const conv = Number(infoAtual.conversaoMedia) || 0;
    if (conv > 0 && conv < 15) ins.push({ text: `Sua conversão atual (${fmtPct(conv)}) está abaixo da média. Revise seu funil.`, severity: "warn" });
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
    if (estrutura.processoDocumentado === "Não" || !estrutura.processoDocumentado) acoes.push({ titulo: "Documentar processo comercial", descricao: "Crie um playbook com cada etapa do funil, scripts e critérios de qualificação.", prioridade: "alta" });
    if (totalEquipe < 3) acoes.push({ titulo: "Expandir equipe comercial", descricao: `Você tem ${totalEquipe} pessoa(s). Considere contratar SDRs para acelerar prospecção.`, prioridade: "media" });
    if (estrutura.canaisAquisicao.length < 3) acoes.push({ titulo: "Diversificar canais de aquisição", descricao: "Teste pelo menos 3 canais diferentes para reduzir dependência.", prioridade: "media" });
    if (scoreAvaliacao <= 50) acoes.push({ titulo: "Implantar rotina de CRM", descricao: "Garanta que 100% dos leads são registrados e acompanhados no CRM diariamente.", prioridade: "alta" });
    if (!estrutura.reuniaoRecorrente) acoes.push({ titulo: "Criar reunião comercial semanal", descricao: "Reunião de 30 min para revisar pipeline, metas e gargalos.", prioridade: "media" });
    if (metaFatMensal > 0) acoes.push({ titulo: "Definir metas semanais", descricao: `Meta mensal de ${fmtBRL(metaFatMensal)} = ~${fmtBRL(Math.round(metaFatMensal / 4))}/semana.`, prioridade: "baixa" });
    return acoes;
  }, [visaoDesbloqueada, estrutura, totalEquipe, scoreAvaliacao, metaFatMensal]);

  const prioridadeCores = { alta: "bg-destructive/10 text-destructive border-destructive/30", media: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30", baixa: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30" };

  // Projeção
  const projecaoData = totalMetaAnual > 0
    ? MESES.map((m, i) => ({ mes: m, meta: Math.round(totalMetaAnual * ((i + 1) / 12)), realizado: Math.round(totalMetaAnual * ((i + 1) / 12) * (0.6 + Math.random() * 0.5)) }))
    : [];

  // Save metas
  const salvarMetas = () => { setMetasSalvas(true); toast({ title: "Metas salvas com sucesso!" }); };
  const salvarEstrutura = () => { setEstruturaSalva(true); setEstruturaDataSalva(new Date().toLocaleDateString("pt-BR")); toast({ title: "Estrutura comercial salva!" }); };
  const finalizarAvaliacao = () => {
    const total = respostasAvaliacao.reduce((a, b) => a + b, 0);
    const max = AVALIACAO_PERGUNTAS.length * 5;
    const score = Math.round((total / max) * 100);
    const nova: Avaliacao = { id: `av-${Date.now()}`, data: new Date().toLocaleDateString("pt-BR"), respostas: [...respostasAvaliacao], score, escopo: avaliacaoEscopo, vendedor: avaliacaoEscopo === "individual" ? avaliacaoVendedor : undefined };
    setAvaliacoesSalvas(prev => [...prev, nova]);
    setAvaliacaoAtiva(false);
    setRespostasAvaliacao(new Array(AVALIACAO_PERGUNTAS.length).fill(0));
    setAvaliacaoVendedor("");
    toast({ title: `Avaliação concluída! Score: ${score}%` });
  };

  const VENDEDORES_MOCK = ["João Silva", "Maria Santos", "Carlos Oliveira", "Ana Costa", "Pedro Lima"];

  // ── INLINE EDIT STATE ──
  const [editingMetaId, setEditingMetaId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ nome: string; mesRef: string; valorAlvo: number }>({ nome: "", mesRef: "", valorAlvo: 0 });

  const startEditing = (m: MetaMensal) => {
    setEditingMetaId(m.id);
    setEditDraft({ nome: m.nome, mesRef: m.mesRef, valorAlvo: m.valorAlvo });
  };
  const saveEditing = () => {
    if (!editingMetaId) return;
    setMetasMensais(prev => prev.map(m => m.id === editingMetaId ? { ...m, nome: editDraft.nome || m.nome, mesRef: editDraft.mesRef || m.mesRef, valorAlvo: editDraft.valorAlvo || m.valorAlvo } : m));
    setEditingMetaId(null);
    toast({ title: "Meta atualizada!" });
  };
  const cancelEditing = () => setEditingMetaId(null);

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
                <KpiCard label="Receita Atual" value={fmtBRL(Number(infoAtual.receitaMensal) || 0)} />
                <KpiCard label="Meta Acumulada" value={fmtBRL(totalMetaAnual)} variant="accent" />
                <KpiCard label="Meta Mensal" value={fmtBRL(metaFatMensal)} />
                <KpiCard label="Equipe" value={estrutura.tamanhoEquipe || "—"} sublabel={`SDR: ${estrutura.temSDR} | Closer: ${estrutura.temCloser}`} />
                <KpiCard label="Maturidade" value={fmtPct(scoreAvaliacao)} sublabel={nivelAvaliacao.label} />
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
                          <Tooltip formatter={(v: number) => fmtBRL(v)} />
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
                  <p><strong>Receita Atual:</strong> {fmtBRL(Number(infoAtual.receitaMensal) || 0)} | <strong>Ticket Médio:</strong> {fmtBRL(Number(infoAtual.ticketMedio) || 0)} | <strong>Meta Total:</strong> {fmtBRL(totalMetaAnual)}</p>
                  <p><strong>Equipe:</strong> {estrutura.tamanhoEquipe} | <strong>SDR:</strong> {estrutura.temSDR} | <strong>Closer:</strong> {estrutura.temCloser} | <strong>CS:</strong> {estrutura.temCS}</p>
                  <p><strong>Canais:</strong> {estrutura.canaisAquisicao.join(", ") || "Nenhum"}</p>
                  <p><strong>Processo documentado:</strong> {estrutura.processoDocumentado || "Não informado"} | <strong>Tempo fechamento:</strong> {estrutura.tempoMedioFechamento}</p>
                  <p><strong>Maturidade:</strong> {fmtPct(scoreAvaliacao)} — {nivelAvaliacao.label}</p>
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
                  Situação Atual do Comercial
                </CardTitle>
                {infoAtualSalva && <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 text-[10px]"><CheckCircle2 className="w-3 h-3 mr-1" />Salvo</Badge>}
              </div>
              <p className="text-xs text-muted-foreground">Preencha os indicadores atuais para que as metas sejam calculadas corretamente.</p>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {/* Financeiro */}
              <div>
                <Label className="text-xs font-semibold mb-2 block flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> Indicadores Financeiros
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Receita Mensal (R$)</Label>
                    <Input value={infoAtual.receitaMensal} disabled={infoAtualSalva}
                      onChange={e => setInfoAtual(p => ({ ...p, receitaMensal: e.target.value }))} placeholder="Ex: 47.500" />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Ticket Médio (R$)</Label>
                    <Input value={infoAtual.ticketMedio} disabled={infoAtualSalva}
                      onChange={e => setInfoAtual(p => ({ ...p, ticketMedio: e.target.value }))} placeholder="Ex: 4.500" />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Contratos Ativos/Mês</Label>
                    <Input value={infoAtual.contratosMensais} disabled={infoAtualSalva}
                      onChange={e => setInfoAtual(p => ({ ...p, contratosMensais: e.target.value }))} placeholder="Ex: 8" />
                  </div>
                </div>
              </div>
              {/* Comercial */}
              <div>
                <Label className="text-xs font-semibold mb-2 block flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-500" /> Indicadores Comerciais
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Clientes Ativos</Label>
                    <Input value={infoAtual.clientesAtivos} disabled={infoAtualSalva}
                      onChange={e => setInfoAtual(p => ({ ...p, clientesAtivos: e.target.value }))} placeholder="Ex: 35" />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Leads/Mês</Label>
                    <Input value={infoAtual.leadsMensais} disabled={infoAtualSalva}
                      onChange={e => setInfoAtual(p => ({ ...p, leadsMensais: e.target.value }))} placeholder="Ex: 120" />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Reuniões/Mês</Label>
                    <Input value={infoAtual.reunioesMensais} disabled={infoAtualSalva}
                      onChange={e => setInfoAtual(p => ({ ...p, reunioesMensais: e.target.value }))} placeholder="Ex: 20" />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Conversão Média (%)</Label>
                    <Input value={infoAtual.conversaoMedia} disabled={infoAtualSalva}
                      onChange={e => setInfoAtual(p => ({ ...p, conversaoMedia: e.target.value }))} placeholder="Ex: 20" />
                  </div>
                </div>
              </div>
              {/* Retenção */}
              <div>
                <Label className="text-xs font-semibold mb-2 block flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-500" /> Retenção
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Taxa de Retenção (%)</Label>
                    <Input value={infoAtual.taxaRetencao} disabled={infoAtualSalva}
                      onChange={e => setInfoAtual(p => ({ ...p, taxaRetencao: e.target.value }))} placeholder="Ex: 85" />
                  </div>
                </div>
              </div>
            </CardContent>
            {!infoAtualSalva && (
              <div className="px-6 pb-4">
                <Button size="sm" onClick={() => { setInfoAtualSalva(true); toast({ title: "Situação atual salva com sucesso!" }); }}
                  disabled={!infoAtual.receitaMensal}>
                  <Save className="w-3 h-3 mr-1" /> Salvar Situação Atual
                </Button>
              </div>
            )}
          </Card>

          {/* Criar Nova Meta */}
          {infoAtualSalva && (
            <>
              <Card className="overflow-hidden">
                <CardHeader className="pb-3 bg-gradient-to-r from-amber-500/10 to-transparent border-b border-amber-500/10">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-500/15"><Plus className="w-4 h-4 text-amber-500" /></div>
                    Criar Nova Meta
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Selecione tipo, escopo e período para definir sua meta.</p>
                </CardHeader>
                <CardContent className="pt-4 space-y-5">
                  {/* Tipo de Meta */}
                  <div>
                    <Label className="text-xs font-semibold mb-2 block flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-amber-500" /> Qual o tipo da meta?
                    </Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {([
                        { value: "faturamento" as TipoMeta, label: "Faturamento", icon: DollarSign, color: "text-emerald-500" },
                        { value: "novos_clientes" as TipoMeta, label: "Novos Clientes", icon: UserPlus, color: "text-blue-500" },
                        { value: "contratos" as TipoMeta, label: "Contratos", icon: FileText, color: "text-purple-500" },
                        { value: "retencao" as TipoMeta, label: "Retenção", icon: ShieldCheck, color: "text-teal-500" },
                        { value: "ticket_medio" as TipoMeta, label: "Ticket Médio", icon: Receipt, color: "text-orange-500" },
                        { value: "conversao" as TipoMeta, label: "Conversão (%)", icon: BarChartHorizontal, color: "text-indigo-500" },
                        { value: "leads" as TipoMeta, label: "Leads Gerados", icon: Megaphone, color: "text-pink-500" },
                        { value: "reunioes" as TipoMeta, label: "Reuniões", icon: Handshake, color: "text-cyan-500" },
                      ]).map(opt => {
                        const Icon = opt.icon;
                        const selected = novaMeta.tipo === opt.value;
                        return (
                          <Button key={opt.value} variant={selected ? "default" : "outline"} size="sm"
                            className={`justify-start gap-2 h-auto py-2.5 px-3 ${!selected ? "border-dashed" : ""}`}
                            onClick={() => setNovaMeta(p => ({ ...p, tipo: opt.value }))}>
                            <Icon className={`w-4 h-4 ${selected ? "" : opt.color}`} />
                            <span className="text-xs">{opt.label}</span>
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Nome da Meta */}
                  <div>
                    <Label className="text-xs font-semibold mb-2 block flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-500" /> Dê um nome para essa meta
                    </Label>
                    <Input value={novaMeta.nome} className="max-w-md"
                      onChange={e => setNovaMeta(p => ({ ...p, nome: e.target.value }))}
                      placeholder="Ex: Meta de Faturamento Q1, Expansão Novos Clientes..." />
                  </div>

                  {/* Mês de Referência */}
                  <div>
                    <Label className="text-xs font-semibold mb-2 block flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-violet-500" /> Mês de referência
                    </Label>
                    <div className="flex flex-wrap gap-1.5">
                      {MESES_COMPLETOS.map((mes, i) => {
                        const valor = `${mes}/${anoAtual}`;
                        const valorProx = `${mes}/${anoAtual + 1}`;
                        const selected = novaMeta.mesRef === valor || novaMeta.mesRef === valorProx;
                        return (
                          <Button key={mes} size="sm" variant={selected ? "default" : "outline"}
                            className={`text-xs h-8 px-2.5 ${!selected ? "border-dashed" : ""}`}
                            onClick={() => setNovaMeta(p => ({ ...p, mesRef: i >= new Date().getMonth() ? valor : valorProx }))}>
                            {MESES[i]}
                          </Button>
                        );
                      })}
                    </div>
                    {novaMeta.mesRef && <p className="text-[10px] text-muted-foreground mt-1">📅 {novaMeta.mesRef}</p>}
                  </div>

                  {/* Escopo */}
                  <div>
                    <Label className="text-xs font-semibold mb-2 block flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-blue-500" /> Essa meta é para quem?
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {([
                        { value: "empresa" as EscopoMeta, label: "Empresa inteira", icon: Building2, desc: "Meta macro para toda a empresa" },
                        { value: "equipe" as EscopoMeta, label: "Por equipe", icon: Users, desc: "Meta específica por time" },
                        { value: "individual" as EscopoMeta, label: "Individual", icon: UserCheck, desc: "Meta para pessoa específica" },
                      ]).map(opt => {
                        const Icon = opt.icon;
                        const selected = novaMeta.escopo === opt.value;
                        return (
                          <Button key={opt.value} variant={selected ? "default" : "outline"} size="sm"
                            className={`gap-2 h-auto py-2.5 px-4 ${!selected ? "border-dashed" : ""}`}
                            onClick={() => setNovaMeta(p => ({ ...p, escopo: opt.value, equipe: "", responsavel: "" }))}>
                            <Icon className="w-4 h-4" />
                            <div className="text-left">
                              <span className="text-xs font-medium block">{opt.label}</span>
                              <span className="text-[10px] opacity-70">{opt.desc}</span>
                            </div>
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Equipe / Responsável (condicional) */}
                  {novaMeta.escopo === "equipe" && (
                    <div>
                      <Label className="text-xs font-semibold mb-2 block flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-purple-500" /> Qual equipe?
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {["Vendas", "Pré-vendas (SDR)", "Pós-venda (CS)", "Marketing", "Prospecção"].map(opt => (
                          <Button key={opt} size="sm" variant={novaMeta.equipe === opt ? "default" : "outline"}
                            className={`text-xs ${novaMeta.equipe !== opt ? "border-dashed" : ""}`}
                            onClick={() => setNovaMeta(p => ({ ...p, equipe: opt }))}>{opt}</Button>
                        ))}
                      </div>
                    </div>
                  )}
                  {novaMeta.escopo === "individual" && (
                    <div>
                      <Label className="text-xs font-semibold mb-2 block flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-purple-500" /> Quem é o responsável?
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {["João Silva", "Maria Santos", "Carlos Oliveira", "Ana Costa", "Pedro Lima"].map(opt => (
                          <Button key={opt} size="sm" variant={novaMeta.responsavel === opt ? "default" : "outline"}
                            className={`text-xs ${novaMeta.responsavel !== opt ? "border-dashed" : ""}`}
                            onClick={() => setNovaMeta(p => ({ ...p, responsavel: opt }))}>{opt}</Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Período */}
                  <div>
                    <Label className="text-xs font-semibold mb-2 block flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-green-500" /> Qual o período da meta?
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {([
                        { value: "mensal" as PeriodoMeta, label: "Mensal" },
                        { value: "trimestral" as PeriodoMeta, label: "Trimestral" },
                        { value: "semestral" as PeriodoMeta, label: "Semestral" },
                        { value: "anual" as PeriodoMeta, label: "Anual" },
                      ]).map(opt => (
                        <Button key={opt.value} size="sm" variant={novaMeta.periodo === opt.value ? "default" : "outline"}
                          className={`text-xs ${novaMeta.periodo !== opt.value ? "border-dashed" : ""}`}
                          onClick={() => setNovaMeta(p => ({ ...p, periodo: opt.value }))}>{opt.label}</Button>
                      ))}
                    </div>
                  </div>

                  {/* Valor Alvo */}
                  <div>
                    <Label className="text-xs font-semibold mb-2 block flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-red-500" /> Qual o valor alvo?
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {(novaMeta.tipo === "faturamento" || novaMeta.tipo === "ticket_medio"
                        ? ["R$ 10.000", "R$ 25.000", "R$ 50.000", "R$ 100.000", "R$ 200.000", "R$ 500.000"]
                        : novaMeta.tipo === "conversao" || novaMeta.tipo === "retencao"
                        ? ["10%", "20%", "30%", "50%", "70%", "90%"]
                        : ["5", "10", "20", "50", "100", "200"]
                      ).map(opt => {
                        const numVal = Number(opt.replace(/[^0-9]/g, ""));
                        const selected = novaMeta.valorAlvo === numVal;
                        return (
                          <Button key={opt} size="sm" variant={selected ? "default" : "outline"}
                            className={`text-xs ${!selected ? "border-dashed" : ""}`}
                            onClick={() => setNovaMeta(p => ({ ...p, valorAlvo: numVal }))}>{opt}</Button>
                        );
                      })}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Ou digite:</span>
                      <Input type="number" className="w-32 h-8 text-xs" value={novaMeta.valorAlvo || ""}
                        onChange={e => setNovaMeta(p => ({ ...p, valorAlvo: Number(e.target.value) }))}
                        placeholder="Valor personalizado" />
                    </div>
                  </div>

                  {/* Prioridade */}
                  <div>
                    <Label className="text-xs font-semibold mb-2 block flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-yellow-500" /> Prioridade dessa meta
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {([
                        { value: "alta" as const, label: "🔴 Alta", desc: "Crítica para o resultado" },
                        { value: "media" as const, label: "🟡 Média", desc: "Importante mas não urgente" },
                        { value: "baixa" as const, label: "🟢 Baixa", desc: "Desejável, secundária" },
                      ]).map(opt => (
                        <Button key={opt.value} size="sm" variant={novaMeta.prioridade === opt.value ? "default" : "outline"}
                          className={`gap-2 h-auto py-2 px-3 ${novaMeta.prioridade !== opt.value ? "border-dashed" : ""}`}
                          onClick={() => setNovaMeta(p => ({ ...p, prioridade: opt.value }))}>
                          <div className="text-left">
                            <span className="text-xs font-medium block">{opt.label}</span>
                            <span className="text-[10px] opacity-70">{opt.desc}</span>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Botão Criar */}
                  <Button className="w-full gap-2" disabled={novaMeta.valorAlvo === 0 || !novaMeta.mesRef || (novaMeta.escopo === "equipe" && !novaMeta.equipe) || (novaMeta.escopo === "individual" && !novaMeta.responsavel)} onClick={() => {
                    const nova: MetaMensal = {
                      id: `meta-${Date.now()}`, nome: novaMeta.nome || TIPO_META_LABELS[novaMeta.tipo], mesRef: novaMeta.mesRef,
                      tipo: novaMeta.tipo, escopo: novaMeta.escopo, periodo: novaMeta.periodo,
                      valorAlvo: novaMeta.valorAlvo, equipe: novaMeta.equipe, responsavel: novaMeta.responsavel,
                      prioridade: novaMeta.prioridade,
                    };
                    setMetasMensais(prev => [...prev, nova]);
                    setNovaMeta({ nome: "", mesRef: "", tipo: "faturamento", escopo: "empresa", periodo: "mensal", valorAlvo: 0, equipe: "", responsavel: "", prioridade: "media" });
                    setMetasSalvas(true);
                    toast({ title: `Meta "${nova.nome}" adicionada!` });
                  }}>
                    <Plus className="w-4 h-4" /> Criar Meta
                  </Button>
                </CardContent>
              </Card>

              {/* Metas Salvas */}
              {metasMensais.length > 0 && (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-emerald-500/15"><CheckCircle2 className="w-4 h-4 text-emerald-500" /></div>
                      Metas Definidas ({metasMensais.length})
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {metasMensais.map(m => {
                      const tipoConfig = TIPO_META_CONFIG[m.tipo];
                      const Icon = tipoConfig.icon;
                      const isMoney = m.tipo === "faturamento" || m.tipo === "ticket_medio";
                      const isPercent = m.tipo === "conversao" || m.tipo === "retencao";
                      const prioridadeColors = { alta: "border-red-500/30 bg-red-500/5", media: "border-yellow-500/30 bg-yellow-500/5", baixa: "border-emerald-500/30 bg-emerald-500/5" };
                      return (
                        <Card key={m.id} className={`overflow-hidden ${prioridadeColors[m.prioridade]}`}>
                          <div className={`h-1 ${tipoConfig.gradient}`} />
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded-lg ${tipoConfig.bg}`}>
                                  <Icon className={`w-3.5 h-3.5 ${tipoConfig.color}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  {editingMetaId === m.id ? (
                                    <Input value={editDraft.nome} onChange={e => setEditDraft(p => ({ ...p, nome: e.target.value }))}
                                      className="h-6 text-xs font-semibold px-1.5" autoFocus />
                                  ) : (
                                    <p className="text-xs font-semibold truncate">{m.nome}</p>
                                  )}
                                  {editingMetaId === m.id ? (
                                    <Select value={editDraft.mesRef} onValueChange={v => setEditDraft(p => ({ ...p, mesRef: v }))}>
                                      <SelectTrigger className="h-5 text-[10px] px-1.5 w-auto mt-0.5"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        {MESES_COMPLETOS.map((mes, i) => {
                                          const valor = `${mes}/${i >= new Date().getMonth() ? anoAtual : anoAtual + 1}`;
                                          return <SelectItem key={mes} value={valor} className="text-xs">{valor}</SelectItem>;
                                        })}
                                      </SelectContent>
                                    </Select>
                                  ) : (
                                    <p className="text-[10px] text-muted-foreground">{m.mesRef} · {tipoConfig.label} · {m.periodo}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {editingMetaId === m.id ? (
                                  <>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-emerald-500 hover:text-emerald-600" onClick={saveEditing}>
                                      <Check className="w-3 h-3" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground" onClick={cancelEditing}>
                                      <X className="w-3 h-3" />
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-primary" onClick={() => startEditing(m)}>
                                      <Pencil className="w-3 h-3" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                      onClick={() => { setMetasMensais(prev => prev.filter(x => x.id !== m.id)); toast({ title: "Meta removida." }); }}>
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                            {editingMetaId === m.id ? (
                              <div className="flex items-center gap-2">
                                <Input type="number" value={editDraft.valorAlvo || ""} onChange={e => setEditDraft(p => ({ ...p, valorAlvo: Number(e.target.value) }))}
                                  className="h-8 text-lg font-black w-40" />
                                <span className="text-xs text-muted-foreground">{isMoney ? "(R$)" : isPercent ? "(%)" : "(un)"}</span>
                              </div>
                            ) : (
                              <p className="text-xl font-black">
                                {isMoney ? fmtBRL(m.valorAlvo) : isPercent ? fmtPct(m.valorAlvo) : fmtNum(m.valorAlvo)}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-1.5">
                              <Badge variant="outline" className="text-[10px]">
                                {m.escopo === "empresa" ? "🏢 Empresa" : m.escopo === "equipe" ? `👥 ${m.equipe}` : `👤 ${m.responsavel}`}
                              </Badge>
                              <Badge variant="outline" className={`text-[10px] ${m.prioridade === "alta" ? "text-red-500 border-red-500/30" : m.prioridade === "media" ? "text-yellow-600 border-yellow-500/30" : "text-emerald-500 border-emerald-500/30"}`}>
                                {m.prioridade === "alta" ? "🔴 Alta" : m.prioridade === "media" ? "🟡 Média" : "🟢 Baixa"}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Resumo */}
                  <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                    <CardContent className="py-4 grid grid-cols-4 gap-4 text-center">
                      <div><p className="text-xl font-black text-primary">{metasMensais.length}</p><p className="text-xs text-muted-foreground">Total metas</p></div>
                      <div><p className="text-xl font-black">{metasMensais.filter(m => m.escopo === "empresa").length}</p><p className="text-xs text-muted-foreground">Empresa</p></div>
                      <div><p className="text-xl font-black">{metasMensais.filter(m => m.escopo === "equipe").length}</p><p className="text-xs text-muted-foreground">Por equipe</p></div>
                      <div><p className="text-xl font-black">{metasMensais.filter(m => m.escopo === "individual").length}</p><p className="text-xs text-muted-foreground">Individuais</p></div>
                    </CardContent>
                  </Card>
                </>
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
                    <Button key={opt} size="sm" variant={estrutura.processoDocumentado === opt ? "default" : "outline"}
                      onClick={() => setEstrutura(p => ({ ...p, processoDocumentado: opt }))}>{opt}</Button>
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

          {estruturaSalva ? (
            <Card className="border-emerald-500/20 bg-emerald-500/5">
              <CardContent className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-medium">Estrutura salva em {estruturaDataSalva}</span>
                </div>
                <Button size="sm" variant="outline" onClick={() => { setEstruturaSalva(false); setEstruturaDataSalva(""); }}>
                  <Pencil className="w-3 h-3 mr-1" /> Editar
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Button onClick={salvarEstrutura} className="w-full">
              <Save className="w-4 h-4 mr-2" /> Salvar Estrutura Comercial
            </Button>
          )}
        </TabsContent>

        {/* ===== AVALIAR MEU COMERCIAL ===== */}
        <TabsContent value="diagnostico" className="space-y-5">
          {/* Iniciar avaliação ou histórico */}
          {!avaliacaoAtiva ? (
            <>
              {/* Botão Nova Avaliação */}
              <Card className="overflow-hidden">
                <CardHeader className="pb-3 bg-gradient-to-r from-orange-500/10 to-transparent border-b border-orange-500/10">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-orange-500/15"><ClipboardCheck className="w-4 h-4 text-orange-500" /></div>
                    Nova Avaliação de Desempenho
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Avalie o desempenho comercial da empresa ou de um vendedor específico a qualquer momento.</p>
                </CardHeader>
                <CardContent className="pt-4 space-y-5">
                  {/* Escopo */}
                  <div>
                    <Label className="text-xs font-semibold mb-2 block flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-orange-500" /> Quem será avaliado?
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {([
                        { value: "empresa" as EscopoAvaliacao, label: "Empresa (Geral)", icon: Building2, desc: "Avaliação do comercial como um todo" },
                        { value: "individual" as EscopoAvaliacao, label: "Vendedor Individual", icon: UserCheck, desc: "Avaliação de desempenho individual" },
                      ]).map(opt => {
                        const Icon = opt.icon;
                        const selected = avaliacaoEscopo === opt.value;
                        return (
                          <Button key={opt.value} variant={selected ? "default" : "outline"} size="sm"
                            className={`gap-2 h-auto py-2.5 px-4 ${!selected ? "border-dashed" : ""}`}
                            onClick={() => { setAvaliacaoEscopo(opt.value); setAvaliacaoVendedor(""); }}>
                            <Icon className="w-4 h-4" />
                            <div className="text-left">
                              <span className="text-xs font-medium block">{opt.label}</span>
                              <span className="text-[10px] opacity-70">{opt.desc}</span>
                            </div>
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Vendedor (condicional) */}
                  {avaliacaoEscopo === "individual" && (
                    <div>
                      <Label className="text-xs font-semibold mb-2 block flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-blue-500" /> Selecione o vendedor
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {VENDEDORES_MOCK.map(v => (
                          <Button key={v} size="sm" variant={avaliacaoVendedor === v ? "default" : "outline"}
                            className={`text-xs ${avaliacaoVendedor !== v ? "border-dashed" : ""}`}
                            onClick={() => setAvaliacaoVendedor(v)}>{v}</Button>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button className="w-full gap-2"
                    disabled={avaliacaoEscopo === "individual" && !avaliacaoVendedor}
                    onClick={() => { setAvaliacaoAtiva(true); setRespostasAvaliacao(new Array(AVALIACAO_PERGUNTAS.length).fill(0)); }}>
                    <ClipboardCheck className="w-4 h-4" /> Iniciar Avaliação
                    {avaliacaoEscopo === "individual" && avaliacaoVendedor && <span className="text-xs opacity-80">— {avaliacaoVendedor}</span>}
                  </Button>
                </CardContent>
              </Card>

              {/* Gráfico de Evolução */}
              {avaliacoesSalvas.length >= 2 && (
                <Card className="overflow-hidden">
                  <CardHeader className="pb-3 bg-gradient-to-r from-emerald-500/10 to-transparent border-b border-emerald-500/10">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-emerald-500/15"><TrendingUp className="w-4 h-4 text-emerald-500" /></div>
                      Evolução dos Scores
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">Comparativo visual de todas as avaliações ao longo do tempo</p>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={avaliacoesSalvas.map((av, i) => ({
                        nome: av.escopo === "empresa" ? `Empresa #${i + 1}` : `${av.vendedor} #${i + 1}`,
                        score: av.score,
                        data: av.data,
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="data" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={v => `${v}%`} />
                        <Tooltip content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const d = payload[0].payload;
                          return (
                            <div className="bg-popover border rounded-lg p-2 shadow-lg text-xs">
                              <p className="font-semibold">{d.nome}</p>
                              <p className="text-muted-foreground">{d.data}</p>
                              <p className="font-bold text-primary">{d.score}%</p>
                            </div>
                          );
                        }} />
                        <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 5, fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "hsl(var(--background))" }} activeDot={{ r: 7 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Histórico Organizado */}
              {avaliacoesSalvas.length > 0 && (() => {
                const filtradas = avaliacoesSalvas.filter(av =>
                  historicoFiltro === "todos" ? true : av.escopo === historicoFiltro
                );

                // Agrupar por pasta: Empresa e por vendedor
                const grupos: Record<string, Avaliacao[]> = {};
                filtradas.forEach(av => {
                  const key = av.escopo === "empresa" ? "🏢 Empresa (Geral)" : `👤 ${av.vendedor}`;
                  if (!grupos[key]) grupos[key] = [];
                  grupos[key].push(av);
                });

                return (
                  <Card className="overflow-hidden">
                    <CardHeader className="pb-3 bg-gradient-to-r from-slate-500/10 to-transparent border-b border-slate-500/10">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-slate-500/15"><FolderOpen className="w-4 h-4 text-slate-400" /></div>
                          Histórico de Avaliações ({filtradas.length})
                        </CardTitle>
                        <div className="flex gap-1">
                          {(["todos", "empresa", "individual"] as const).map(f => (
                            <Button key={f} size="sm" variant={historicoFiltro === f ? "default" : "ghost"} className="text-[10px] h-7 px-2"
                              onClick={() => setHistoricoFiltro(f)}>
                              {f === "todos" ? "Todos" : f === "empresa" ? "🏢 Empresa" : "👤 Individual"}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {Object.entries(grupos).map(([pasta, avaliacoes]) => {
                        const aberta = pastasAbertas[pasta] !== false; // aberta por padrão
                        return (
                          <div key={pasta} className="border rounded-lg overflow-hidden">
                            <button
                              className="w-full flex items-center justify-between p-3 bg-muted/20 hover:bg-muted/40 transition-colors text-left"
                              onClick={() => setPastasAbertas(prev => ({ ...prev, [pasta]: !aberta }))}
                            >
                              <div className="flex items-center gap-2">
                                {aberta ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                                <FolderOpen className="w-4 h-4 text-primary" />
                                <span className="text-sm font-medium">{pasta}</span>
                                <Badge variant="secondary" className="text-[10px]">{avaliacoes.length} avaliação(ões)</Badge>
                              </div>
                              <div className="flex items-center gap-1.5">
                                {(() => {
                                  const ultima = avaliacoes[avaliacoes.length - 1];
                                  const nvl = getNivel(ultima.score);
                                  return <Badge style={{ backgroundColor: nvl.cor }} className="text-white text-[10px]">{ultima.score}% — {nvl.label}</Badge>;
                                })()}
                              </div>
                            </button>
                            {aberta && (
                              <div className="divide-y">
                                {avaliacoes.map((av, i) => {
                                  const nvl = getNivel(av.score);
                                  const anterior = i > 0 ? avaliacoes[i - 1].score : null;
                                  const diff = anterior !== null ? av.score - anterior : null;
                                  return (
                                    <div key={av.id} className="flex items-center justify-between p-3 hover:bg-muted/10 transition-colors">
                                      <div className="flex items-center gap-3">
                                        <Badge variant="outline" className="text-[10px] w-8 justify-center">#{i + 1}</Badge>
                                        <div>
                                          <span className="text-sm">{av.data}</span>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {diff !== null && (
                                          <span className={`text-[10px] font-medium flex items-center gap-0.5 ${diff > 0 ? "text-emerald-500" : diff < 0 ? "text-red-500" : "text-muted-foreground"}`}>
                                            {diff > 0 ? <ArrowUpRight className="w-3 h-3" /> : diff < 0 ? <ArrowDownRight className="w-3 h-3" /> : null}
                                            {diff > 0 ? "+" : ""}{diff}%
                                          </span>
                                        )}
                                        <span className="text-lg font-bold" style={{ color: nvl.cor }}>{av.score}%</span>
                                        <Badge style={{ backgroundColor: nvl.cor }} className="text-white text-[10px]">{nvl.label}</Badge>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                );
              })()}

              {/* Último resultado */}
              {ultimaAvaliacao && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="overflow-hidden">
                    <CardHeader className="pb-3 bg-gradient-to-r from-rose-500/10 to-transparent border-b border-rose-500/10">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-rose-500/15"><Target className="w-4 h-4 text-rose-500" /></div>
                        Último Score — {ultimaAvaliacao.escopo === "empresa" ? "Empresa" : ultimaAvaliacao.vendedor}
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
              {ultimaAvaliacao && (
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
              )}
            </>
          ) : (
            <>
              {/* Cabeçalho da avaliação em andamento */}
              <Card className="overflow-hidden border-orange-500/20">
                <CardContent className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ClipboardCheck className="w-5 h-5 text-orange-500" />
                    <div>
                      <p className="text-sm font-semibold">Avaliação em andamento</p>
                      <p className="text-xs text-muted-foreground">
                        {avaliacaoEscopo === "empresa" ? "🏢 Empresa (Geral)" : `👤 ${avaliacaoVendedor}`}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => setAvaliacaoAtiva(false)}>Cancelar</Button>
                </CardContent>
              </Card>

              {/* Formulário */}
              <Card className="overflow-hidden">
                <CardHeader className="pb-3 bg-gradient-to-r from-orange-500/10 to-transparent border-b border-orange-500/10">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-orange-500/15"><ClipboardCheck className="w-4 h-4 text-orange-500" /></div>
                    {avaliacaoEscopo === "empresa" ? "Avaliação do Comercial — Empresa" : `Avaliação Individual — ${avaliacaoVendedor}`}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Responda de 1 (muito ruim) a 5 (excelente). Seja honesto na avaliação.</p>
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
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
