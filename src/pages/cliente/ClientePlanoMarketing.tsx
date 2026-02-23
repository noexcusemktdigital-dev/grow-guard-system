import { useState, useMemo } from "react";
import {
  Megaphone, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle,
  Lightbulb, FileText, Share2, Globe, DollarSign, TrendingUp,
  Target, Sparkles, RotateCcw, Clock, ChevronRight, Activity,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { DiagnosticoTermometro } from "@/components/diagnostico/DiagnosticoTermometro";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";

/* ══════════════════════════════════════════════
   STRATEGY QUESTIONS
   ══════════════════════════════════════════════ */

interface StrategyQuestion {
  id: string;
  category: string;
  question: string;
  subtitle?: string;
  type: "choice" | "multi-choice" | "slider" | "text";
  options?: { label: string; value: string; icon?: React.ElementType }[];
  sliderMin?: number;
  sliderMax?: number;
  sliderStep?: number;
  sliderPrefix?: string;
  placeholder?: string;
}

const strategyQuestions: StrategyQuestion[] = [
  // Negócio
  {
    id: "segmento", category: "Negócio", question: "Qual é o segmento da sua empresa?",
    subtitle: "Escolha o que melhor descreve o seu negócio",
    type: "choice",
    options: [
      { label: "Serviços", value: "servicos" },
      { label: "Varejo / Loja", value: "varejo" },
      { label: "Alimentação", value: "alimentacao" },
      { label: "Saúde / Estética", value: "saude" },
      { label: "Educação", value: "educacao" },
      { label: "Tecnologia", value: "tecnologia" },
      { label: "Indústria", value: "industria" },
      { label: "Outro", value: "outro" },
    ],
  },
  {
    id: "tempo_mercado", category: "Negócio", question: "Há quanto tempo sua empresa está no mercado?",
    type: "choice",
    options: [
      { label: "Menos de 1 ano", value: "0-1" },
      { label: "1 a 3 anos", value: "1-3" },
      { label: "3 a 5 anos", value: "3-5" },
      { label: "Mais de 5 anos", value: "5+" },
    ],
  },
  {
    id: "faturamento", category: "Negócio", question: "Qual o faturamento mensal aproximado?",
    type: "slider", sliderMin: 0, sliderMax: 500000, sliderStep: 5000, sliderPrefix: "R$",
  },
  {
    id: "ticket_medio", category: "Negócio", question: "Qual o ticket médio do seu produto/serviço?",
    type: "slider", sliderMin: 0, sliderMax: 50000, sliderStep: 100, sliderPrefix: "R$",
  },
  // Público
  {
    id: "cliente_ideal", category: "Público", question: "Quem é o seu cliente ideal?",
    subtitle: "Descreva brevemente o perfil do seu melhor cliente",
    type: "text", placeholder: "Ex: Mulheres de 25-40 anos, classe B, que buscam praticidade...",
  },
  {
    id: "faixa_etaria", category: "Público", question: "Qual a faixa etária principal do seu público?",
    type: "choice",
    options: [
      { label: "18-24 anos", value: "18-24" },
      { label: "25-34 anos", value: "25-34" },
      { label: "35-44 anos", value: "35-44" },
      { label: "45+ anos", value: "45+" },
    ],
  },
  {
    id: "onde_esta", category: "Público", question: "Onde seu público está mais presente?",
    type: "multi-choice",
    options: [
      { label: "Instagram", value: "instagram" },
      { label: "Facebook", value: "facebook" },
      { label: "TikTok", value: "tiktok" },
      { label: "Google", value: "google" },
      { label: "WhatsApp", value: "whatsapp" },
      { label: "YouTube", value: "youtube" },
    ],
  },
  // Marketing Atual
  {
    id: "redes_ativas", category: "Marketing Atual", question: "Quais redes sociais sua empresa usa ativamente?",
    type: "multi-choice",
    options: [
      { label: "Instagram", value: "instagram" },
      { label: "Facebook", value: "facebook" },
      { label: "TikTok", value: "tiktok" },
      { label: "LinkedIn", value: "linkedin" },
      { label: "YouTube", value: "youtube" },
      { label: "Nenhuma", value: "nenhuma" },
    ],
  },
  {
    id: "freq_publicacao", category: "Marketing Atual", question: "Com que frequência você publica conteúdo?",
    type: "choice",
    options: [
      { label: "Não publico", value: "nunca" },
      { label: "Esporadicamente", value: "esporadico" },
      { label: "Semanalmente", value: "semanal" },
      { label: "Diariamente", value: "diario" },
    ],
  },
  {
    id: "investe_trafego", category: "Marketing Atual", question: "Você investe em tráfego pago atualmente?",
    type: "choice",
    options: [
      { label: "Nunca investi", value: "nunca" },
      { label: "Já testei sem resultado", value: "testou" },
      { label: "Invisto mensalmente", value: "mensal" },
      { label: "Tenho campanha otimizada", value: "otimizado" },
    ],
  },
  {
    id: "tem_site", category: "Marketing Atual", question: "Sua empresa possui um site ou landing page?",
    type: "choice",
    options: [
      { label: "Não possui", value: "nao" },
      { label: "Tem, mas desatualizado", value: "desatualizado" },
      { label: "Sim, atualizado", value: "atualizado" },
      { label: "Sim, otimizado para SEO", value: "otimizado" },
    ],
  },
  // Objetivos
  {
    id: "meta_principal", category: "Objetivos", question: "Qual seu objetivo principal com o marketing?",
    subtitle: "Escolha o mais importante para você agora",
    type: "choice",
    options: [
      { label: "Gerar mais leads", value: "leads", icon: Target },
      { label: "Aumentar vendas", value: "vendas", icon: DollarSign },
      { label: "Construir autoridade", value: "autoridade", icon: Sparkles },
      { label: "Reconhecimento de marca", value: "reconhecimento", icon: Megaphone },
    ],
  },
  {
    id: "prazo", category: "Objetivos", question: "Em quanto tempo espera ver resultados?",
    type: "choice",
    options: [
      { label: "1-2 meses", value: "1-2" },
      { label: "3-4 meses", value: "3-4" },
      { label: "5-6 meses", value: "5-6" },
      { label: "Mais de 6 meses", value: "6+" },
    ],
  },
  // Orçamento
  {
    id: "investimento_atual", category: "Orçamento", question: "Quanto você investe em marketing por mês atualmente?",
    type: "slider", sliderMin: 0, sliderMax: 50000, sliderStep: 500, sliderPrefix: "R$",
  },
  {
    id: "investimento_possivel", category: "Orçamento", question: "Quanto poderia investir em marketing por mês?",
    type: "slider", sliderMin: 0, sliderMax: 50000, sliderStep: 500, sliderPrefix: "R$",
  },
  // Dores
  {
    id: "dificuldades", category: "Dores", question: "Quais são suas maiores dificuldades com marketing?",
    type: "multi-choice",
    options: [
      { label: "Falta de tempo", value: "tempo" },
      { label: "Não sei o que postar", value: "conteudo" },
      { label: "Não gero leads", value: "leads" },
      { label: "Não tenho equipe", value: "equipe" },
      { label: "Baixo engajamento", value: "engajamento" },
      { label: "Não sei usar tráfego pago", value: "trafego" },
    ],
  },
  {
    id: "tentativas", category: "Dores", question: "O que você já tentou que não funcionou?",
    subtitle: "Conte brevemente suas experiências anteriores",
    type: "text", placeholder: "Ex: Contratei um social media, mas não deu resultado...",
  },
];

/* ══════════════════════════════════════════════
   SCORING LOGIC
   ══════════════════════════════════════════════ */

type Answers = Record<string, string | string[] | number>;

function computeScores(answers: Answers) {
  const scoreMap: Record<string, number> = {
    "Presença Digital": 0,
    "Estratégia": 0,
    "Conteúdo": 0,
    "Tráfego": 0,
    "Branding": 0,
  };
  const maxMap: Record<string, number> = { ...scoreMap };

  // Presença Digital (redes_ativas, tem_site, freq_publicacao)
  maxMap["Presença Digital"] = 9;
  const redes = answers.redes_ativas;
  if (Array.isArray(redes)) {
    if (redes.includes("nenhuma")) scoreMap["Presença Digital"] += 0;
    else scoreMap["Presença Digital"] += Math.min(redes.length, 3);
  }
  const site = answers.tem_site as string;
  if (site === "otimizado") scoreMap["Presença Digital"] += 3;
  else if (site === "atualizado") scoreMap["Presença Digital"] += 2;
  else if (site === "desatualizado") scoreMap["Presença Digital"] += 1;

  const freq = answers.freq_publicacao as string;
  if (freq === "diario") scoreMap["Presença Digital"] += 3;
  else if (freq === "semanal") scoreMap["Presença Digital"] += 2;
  else if (freq === "esporadico") scoreMap["Presença Digital"] += 1;

  // Estratégia (meta_principal, prazo, cliente_ideal)
  maxMap["Estratégia"] = 7;
  if (answers.meta_principal) scoreMap["Estratégia"] += 2;
  if (answers.prazo) scoreMap["Estratégia"] += 2;
  if (answers.cliente_ideal && String(answers.cliente_ideal).length > 10) scoreMap["Estratégia"] += 3;
  else if (answers.cliente_ideal) scoreMap["Estratégia"] += 1;

  // Conteúdo (freq_publicacao, redes_ativas count)
  maxMap["Conteúdo"] = 6;
  if (freq === "diario") scoreMap["Conteúdo"] += 3;
  else if (freq === "semanal") scoreMap["Conteúdo"] += 2;
  else if (freq === "esporadico") scoreMap["Conteúdo"] += 1;
  if (Array.isArray(redes) && !redes.includes("nenhuma")) {
    scoreMap["Conteúdo"] += Math.min(redes.length, 3);
  }

  // Tráfego (investe_trafego, investimento_atual)
  maxMap["Tráfego"] = 6;
  const trafego = answers.investe_trafego as string;
  if (trafego === "otimizado") scoreMap["Tráfego"] += 3;
  else if (trafego === "mensal") scoreMap["Tráfego"] += 2;
  else if (trafego === "testou") scoreMap["Tráfego"] += 1;
  const investAtual = answers.investimento_atual as number || 0;
  if (investAtual >= 5000) scoreMap["Tráfego"] += 3;
  else if (investAtual >= 2000) scoreMap["Tráfego"] += 2;
  else if (investAtual >= 500) scoreMap["Tráfego"] += 1;

  // Branding (tempo_mercado, segmento)
  maxMap["Branding"] = 6;
  const tempo = answers.tempo_mercado as string;
  if (tempo === "5+") scoreMap["Branding"] += 3;
  else if (tempo === "3-5") scoreMap["Branding"] += 2;
  else if (tempo === "1-3") scoreMap["Branding"] += 1;
  if (answers.segmento) scoreMap["Branding"] += 3;

  const totalMax = Object.values(maxMap).reduce((a, b) => a + b, 0);
  const totalScore = Object.values(scoreMap).reduce((a, b) => a + b, 0);
  const percentage = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;

  const radarData = Object.keys(scoreMap).map(k => ({
    category: k,
    value: maxMap[k] > 0 ? Math.round((scoreMap[k] / maxMap[k]) * 100) : 0,
  }));

  return { scoreMap, maxMap, radarData, percentage };
}

const niveis = [
  { id: 1, label: "Iniciante", cor: "#dc2626", desc: "Seu marketing precisa de atenção urgente. Comece pelo básico." },
  { id: 2, label: "Básico", cor: "#ea580c", desc: "Você tem alguma estrutura, mas faltam consistência e estratégia." },
  { id: 3, label: "Intermediário", cor: "#eab308", desc: "Marketing organizado. Hora de otimizar e escalar resultados." },
  { id: 4, label: "Avançado", cor: "#16a34a", desc: "Marketing maduro e integrado. Foque em otimização contínua." },
];

function getNivel(pct: number) {
  if (pct <= 25) return niveis[0];
  if (pct <= 50) return niveis[1];
  if (pct <= 75) return niveis[2];
  return niveis[3];
}

/* ══════════════════════════════════════════════
   INSIGHTS GENERATOR
   ══════════════════════════════════════════════ */

function generateInsights(answers: Answers, scoreMap: Record<string, number>, maxMap: Record<string, number>) {
  const insights: { text: string; type: "success" | "warning" | "opportunity"; icon: React.ElementType }[] = [];

  const pct = (k: string) => maxMap[k] > 0 ? (scoreMap[k] / maxMap[k]) * 100 : 0;

  if (pct("Presença Digital") >= 70)
    insights.push({ text: "Sua presença digital está sólida. Continue investindo em conteúdo consistente.", type: "success", icon: CheckCircle2 });
  else
    insights.push({ text: "Sua presença digital precisa de atenção. Ative mais canais e publique com frequência.", type: "warning", icon: AlertCircle });

  if (pct("Tráfego") < 50)
    insights.push({ text: "Você não está aproveitando o potencial do tráfego pago. Campanhas estruturadas podem acelerar seus resultados.", type: "opportunity", icon: Lightbulb });

  if (pct("Conteúdo") < 50)
    insights.push({ text: "A produção de conteúdo está baixa. Com roteiros gerados por IA, você publica mais sem esforço.", type: "opportunity", icon: Lightbulb });
  else
    insights.push({ text: "Você já produz conteúdo regularmente. Diversifique formatos para aumentar o alcance.", type: "success", icon: CheckCircle2 });

  if (pct("Estratégia") < 50)
    insights.push({ text: "Falta clareza na estratégia. Defina persona, funil e KPIs para direcionar suas ações.", type: "warning", icon: AlertCircle });

  const site = answers.tem_site as string;
  if (site === "nao" || site === "desatualizado")
    insights.push({ text: "Você precisa de um site ou landing page otimizada para capturar leads e converter visitantes.", type: "opportunity", icon: Lightbulb });

  return insights;
}

/* ══════════════════════════════════════════════
   PROJECTION DATA
   ══════════════════════════════════════════════ */

function getProjectionData(pct: number) {
  const base = Math.round(pct * 0.5);
  return [
    { mes: "Mês 1", atual: base, comEstrategia: base + 10 },
    { mes: "Mês 2", atual: base + 3, comEstrategia: base + 25 },
    { mes: "Mês 3", atual: base + 5, comEstrategia: base + 45 },
    { mes: "Mês 4", atual: base + 6, comEstrategia: base + 70 },
    { mes: "Mês 5", atual: base + 7, comEstrategia: base + 95 },
    { mes: "Mês 6", atual: base + 8, comEstrategia: base + 125 },
  ];
}

/* ══════════════════════════════════════════════
   PRODUCT CARDS
   ══════════════════════════════════════════════ */

interface ProductCard {
  name: string;
  description: string;
  icon: React.ElementType;
  path: string;
  scoreKey: string;
  kpi: string;
}

const products: ProductCard[] = [
  { name: "Conteúdos", description: "Roteiros com IA baseados na sua estratégia. Feed, Stories e Reels planejados.", icon: FileText, path: "/cliente/conteudos", scoreKey: "Conteúdo", kpi: "0 roteiros gerados" },
  { name: "Redes Sociais", description: "Artes prontas para Feed e Story todo mês, com identidade visual da sua marca.", icon: Share2, path: "/cliente/redes-sociais", scoreKey: "Presença Digital", kpi: "0 artes criadas" },
  { name: "Sites", description: "Landing page otimizada para captura de leads e conversão de visitantes.", icon: Globe, path: "/cliente/sites", scoreKey: "Presença Digital", kpi: "Nenhum site criado" },
  { name: "Tráfego Pago", description: "Campanhas estruturadas para Meta, Google e TikTok Ads.", icon: DollarSign, path: "/cliente/trafego-pago", scoreKey: "Tráfego", kpi: "R$ 0 investidos" },
];

/* ══════════════════════════════════════════════
   ACTION PLAN
   ══════════════════════════════════════════════ */

const actionPlan = [
  {
    fase: "Fase 1 — Fundação",
    periodo: "Mês 1-2",
    cor: "hsl(var(--chart-blue))",
    items: [
      "Definir persona e posicionamento de marca",
      "Criar identidade visual e guia de comunicação",
      "Configurar perfis profissionais nas redes",
      "Criar landing page de captura de leads",
    ],
  },
  {
    fase: "Fase 2 — Crescimento",
    periodo: "Mês 3-4",
    cor: "hsl(var(--chart-orange))",
    items: [
      "Implementar calendário editorial semanal",
      "Iniciar campanhas de tráfego pago",
      "Diversificar formatos (carrossel, reels, stories)",
      "Configurar funil de nutrição por WhatsApp",
    ],
  },
  {
    fase: "Fase 3 — Escala",
    periodo: "Mês 5-6",
    cor: "hsl(var(--chart-green))",
    items: [
      "Otimizar campanhas com A/B testing",
      "Aumentar investimento em canais com melhor ROI",
      "Automatizar geração de conteúdo com IA",
      "Integrar CRM para acompanhar leads até venda",
    ],
  },
];

/* ══════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════ */

export default function ClientePlanoMarketing() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [completed, setCompleted] = useState(false);
  const [activeTab, setActiveTab] = useState("estrategia");

  // Mock history
  const [history] = useState([
    { date: "2026-01-15", score: 32, nivel: "Iniciante" },
    { date: "2026-02-01", score: 48, nivel: "Básico" },
  ]);

  const question = strategyQuestions[currentStep];
  const totalQuestions = strategyQuestions.length;
  const progressPct = ((currentStep + 1) / totalQuestions) * 100;

  const { scoreMap, maxMap, radarData, percentage } = useMemo(() => computeScores(answers), [answers]);
  const nivel = getNivel(percentage);
  const insights = useMemo(() => generateInsights(answers, scoreMap, maxMap), [answers, scoreMap, maxMap]);
  const projectionData = useMemo(() => getProjectionData(percentage), [percentage]);

  const canGoNext = () => {
    if (!question) return false;
    const val = answers[question.id];
    if (question.type === "text") return !!val && String(val).length > 0;
    if (question.type === "multi-choice") return Array.isArray(val) && val.length > 0;
    if (question.type === "slider") return val !== undefined;
    return !!val;
  };

  const handleNext = () => {
    if (currentStep < totalQuestions - 1) setCurrentStep(currentStep + 1);
    else setCompleted(true);
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleChoiceSelect = (value: string) => {
    setAnswers(prev => ({ ...prev, [question.id]: value }));
  };

  const handleMultiChoiceToggle = (value: string) => {
    setAnswers(prev => {
      const current = (prev[question.id] as string[]) || [];
      if (current.includes(value)) return { ...prev, [question.id]: current.filter(v => v !== value) };
      return { ...prev, [question.id]: [...current, value] };
    });
  };

  const handleSliderChange = (val: number[]) => {
    setAnswers(prev => ({ ...prev, [question.id]: val[0] }));
  };

  const handleTextChange = (val: string) => {
    setAnswers(prev => ({ ...prev, [question.id]: val }));
  };

  const handleRestart = () => {
    setAnswers({});
    setCurrentStep(0);
    setCompleted(false);
    setActiveTab("estrategia");
  };

  const getPriorityBadge = (scoreKey: string) => {
    const pct = maxMap[scoreKey] > 0 ? (scoreMap[scoreKey] / maxMap[scoreKey]) * 100 : 0;
    if (pct < 50) return { label: "Prioridade Alta", className: "bg-destructive/10 text-destructive border-destructive/20" };
    if (pct < 75) return { label: "Recomendado", className: "bg-warning/10 text-warning border-warning/20" };
    return { label: "Otimizar", className: "bg-success/10 text-success border-success/20" };
  };

  /* ── Render ── */
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Estratégia de Marketing"
        subtitle="Consultoria interativa para diagnosticar e evoluir seu marketing"
        icon={<Megaphone className="w-5 h-5 text-primary" />}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="estrategia" className="text-xs gap-1.5"><Activity className="w-3.5 h-3.5" /> Estratégia</TabsTrigger>
          <TabsTrigger value="produtos" className="text-xs gap-1.5" disabled={!completed}><Sparkles className="w-3.5 h-3.5" /> Produtos Recomendados</TabsTrigger>
          <TabsTrigger value="historico" className="text-xs gap-1.5"><Clock className="w-3.5 h-3.5" /> Histórico</TabsTrigger>
        </TabsList>

        {/* ═══════ ABA ESTRATÉGIA ═══════ */}
        <TabsContent value="estrategia" className="mt-4">
          {!completed ? (
            /* ── WIZARD ── */
            <div className="space-y-6">
              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                    {question?.category}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {currentStep + 1} de {totalQuestions}
                  </span>
                </div>
                <Progress value={progressPct} className="h-1.5" />
              </div>

              {/* Question card */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={question?.id}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <Card className="glass-card overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-primary via-primary/60 to-transparent" />
                    <CardContent className="py-8 px-6 md:px-10">
                      <h2 className="text-xl font-black tracking-tight mb-1">{question?.question}</h2>
                      {question?.subtitle && (
                        <p className="text-sm text-muted-foreground mb-6">{question.subtitle}</p>
                      )}
                      {!question?.subtitle && <div className="mb-6" />}

                      {/* Choice */}
                      {question?.type === "choice" && (
                        <div className="grid grid-cols-2 gap-3">
                          {question.options?.map(opt => {
                            const selected = answers[question.id] === opt.value;
                            const Icon = opt.icon;
                            return (
                              <button
                                key={opt.value}
                                onClick={() => handleChoiceSelect(opt.value)}
                                className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all duration-200
                                  ${selected
                                    ? "border-primary bg-primary/5 shadow-sm"
                                    : "border-border hover:border-primary/30 hover:bg-muted/50"
                                  }`}
                              >
                                {Icon && <Icon className={`w-5 h-5 shrink-0 ${selected ? "text-primary" : "text-muted-foreground"}`} />}
                                <span className={`text-sm font-medium ${selected ? "text-foreground" : "text-muted-foreground"}`}>
                                  {opt.label}
                                </span>
                                {selected && <CheckCircle2 className="w-4 h-4 text-primary ml-auto shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Multi-choice */}
                      {question?.type === "multi-choice" && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {question.options?.map(opt => {
                            const arr = (answers[question.id] as string[]) || [];
                            const selected = arr.includes(opt.value);
                            return (
                              <button
                                key={opt.value}
                                onClick={() => handleMultiChoiceToggle(opt.value)}
                                className={`flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all duration-200
                                  ${selected
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-primary/30 hover:bg-muted/50"
                                  }`}
                              >
                                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors
                                  ${selected ? "border-primary bg-primary" : "border-muted-foreground/30"}`}
                                >
                                  {selected && <CheckCircle2 className="w-3 h-3 text-primary-foreground" />}
                                </div>
                                <span className={`text-sm ${selected ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                                  {opt.label}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Slider */}
                      {question?.type === "slider" && (
                        <div className="space-y-6">
                          <p className="text-3xl font-black tracking-tight text-primary tabular-nums">
                            {question.sliderPrefix}{" "}
                            {((answers[question.id] as number) || question.sliderMin || 0).toLocaleString("pt-BR")}
                          </p>
                          <Slider
                            value={[(answers[question.id] as number) || question.sliderMin || 0]}
                            onValueChange={handleSliderChange}
                            min={question.sliderMin}
                            max={question.sliderMax}
                            step={question.sliderStep}
                            className="w-full"
                          />
                          <div className="flex justify-between text-[10px] text-muted-foreground">
                            <span>{question.sliderPrefix} {(question.sliderMin || 0).toLocaleString("pt-BR")}</span>
                            <span>{question.sliderPrefix} {(question.sliderMax || 0).toLocaleString("pt-BR")}</span>
                          </div>
                        </div>
                      )}

                      {/* Text */}
                      {question?.type === "text" && (
                        <Textarea
                          value={(answers[question.id] as string) || ""}
                          onChange={e => handleTextChange(e.target.value)}
                          placeholder={question.placeholder}
                          className="min-h-[100px] resize-none"
                        />
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={handlePrev} disabled={currentStep === 0} className="gap-2">
                  <ArrowLeft className="w-4 h-4" /> Voltar
                </Button>
                <Button onClick={handleNext} disabled={!canGoNext()} className="gap-2">
                  {currentStep === totalQuestions - 1 ? "Ver Resultado" : "Próximo"}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            /* ── RESULT ── */
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="section-label mb-1">SUA ESTRATÉGIA DE MARKETING</p>
                  <p className="text-sm text-muted-foreground">Resultado baseado nas suas respostas</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleRestart} className="gap-2">
                  <RotateCcw className="w-3.5 h-3.5" /> Refazer
                </Button>
              </div>

              {/* Termômetro + Radar */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DiagnosticoTermometro pontuacao={percentage} nivel={nivel} />

                <Card className="glass-card">
                  <CardContent className="py-6">
                    <p className="section-label mb-4">RADAR POR ÁREA</p>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData} outerRadius="70%">
                          <PolarGrid stroke="hsl(var(--border))" />
                          <PolarAngleAxis dataKey="category" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9 }} />
                          <Radar name="Score" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.15)" strokeWidth={2} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Insights */}
              <div>
                <p className="section-label mb-3">INSIGHTS DA SUA ESTRATÉGIA</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {insights.map((ins, i) => (
                    <Card
                      key={i}
                      className={`border-l-4 ${
                        ins.type === "success" ? "border-l-success" :
                        ins.type === "warning" ? "border-l-destructive" :
                        "border-l-chart-blue"
                      }`}
                    >
                      <CardContent className="py-3 flex items-start gap-3">
                        <ins.icon className={`w-4 h-4 mt-0.5 shrink-0 ${
                          ins.type === "success" ? "text-success" :
                          ins.type === "warning" ? "text-destructive" :
                          "text-chart-blue"
                        }`} />
                        <p className="text-sm">{ins.text}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Projeção */}
              <Card className="glass-card">
                <CardContent className="py-6">
                  <p className="section-label mb-4">PROJEÇÃO DE RESULTADOS — LEADS</p>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={projectionData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="mes" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip />
                        <Area type="monotone" dataKey="atual" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted) / 0.3)" strokeWidth={2} name="Cenário Atual" strokeDasharray="5 5" />
                        <Area type="monotone" dataKey="comEstrategia" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.1)" strokeWidth={2} name="Com Estratégia" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center gap-6 mt-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-0.5 bg-muted-foreground" style={{ borderTop: "2px dashed" }} />
                      Cenário Atual
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-0.5 bg-primary" />
                      Com Estratégia
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Plano de Ação */}
              <div>
                <p className="section-label mb-3">PLANO DE AÇÃO EM 3 FASES</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {actionPlan.map(fase => (
                    <Card key={fase.fase} className="glass-card overflow-hidden">
                      <div className="h-1" style={{ background: fase.cor }} />
                      <CardContent className="py-5">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-bold">{fase.fase}</p>
                          <Badge variant="outline" className="text-[9px]">{fase.periodo}</Badge>
                        </div>
                        <ul className="space-y-2">
                          {fase.items.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                              <ChevronRight className="w-3 h-3 mt-0.5 shrink-0 text-primary" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* CTA to products tab */}
              <Card className="glass-card border-primary/20 bg-primary/5">
                <CardContent className="py-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm font-bold">Veja os produtos recomendados para você</p>
                      <p className="text-xs text-muted-foreground">Baseado na sua estratégia, indicamos as melhores ferramentas</p>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => setActiveTab("produtos")} className="gap-2">
                    Ver Produtos <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* ═══════ ABA PRODUTOS RECOMENDADOS ═══════ */}
        <TabsContent value="produtos" className="mt-4 space-y-6">
          <div>
            <p className="section-label mb-1">PRODUTOS RECOMENDADOS</p>
            <p className="text-sm text-muted-foreground">Ferramentas que vão acelerar sua estratégia de marketing</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map(p => {
              const badge = getPriorityBadge(p.scoreKey);
              return (
                <Card key={p.name} className="glass-card hover-lift group cursor-pointer" onClick={() => navigate(p.path)}>
                  <CardContent className="py-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-primary/10">
                          <p.icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-base font-bold">{p.name}</p>
                          <p className="text-[10px] text-muted-foreground tabular-nums">{p.kpi}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={`text-[9px] ${badge.className}`}>
                        {badge.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{p.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-primary font-medium">Acessar módulo</span>
                      <ArrowRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ═══════ ABA HISTÓRICO ═══════ */}
        <TabsContent value="historico" className="mt-4 space-y-6">
          <div>
            <p className="section-label mb-1">HISTÓRICO DE ESTRATÉGIAS</p>
            <p className="text-sm text-muted-foreground">Acompanhe a evolução do seu marketing ao longo do tempo</p>
          </div>

          {history.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="py-12 text-center">
                <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium">Nenhuma estratégia gerada ainda</p>
                <p className="text-xs text-muted-foreground mt-1">Complete o wizard para ver seu primeiro diagnóstico aqui</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {history.map((h, i) => (
                <Card key={i} className="glass-card">
                  <CardContent className="py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        {i < history.length - 1 && <div className="w-0.5 h-6 bg-border mt-1" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{new Date(h.date).toLocaleDateString("pt-BR")}</p>
                        <p className="text-xs text-muted-foreground">Score: {h.score}% — {h.nivel}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[9px]">
                      {h.nivel}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
