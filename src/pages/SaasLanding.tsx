import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sparkles, ArrowRight, Lock, CheckCircle2,
  Target, TrendingUp, Users, BarChart3, Bot,
  Rocket, BrainCircuit, Compass, Zap, MessageSquare,
  Layers, Shield, Eye, ChevronRight, Play,
} from "lucide-react";
import logoDark from "@/assets/NOE3.png";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect, useCallback, useRef } from "react";

/* ── Constants ──────────────────────────────────────────────── */

const SEGMENTS = [
  "Advocacia", "Imobiliário", "Saúde e Clínicas", "Odontologia", "Estética",
  "Fitness e Academias", "Educação", "E-commerce", "Alimentação", "Moda",
  "Tecnologia / SaaS", "Agronegócio", "Construção Civil", "Automotivo",
  "Contabilidade", "Turismo", "Pet Shop / Veterinária", "Energia Solar",
  "Consultoria", "Indústria", "Franquias", "Serviços Gerais",
];

const REGIONS = [
  "São Paulo - Capital", "São Paulo - Interior", "Rio de Janeiro",
  "Minas Gerais", "Paraná", "Santa Catarina", "Rio Grande do Sul",
  "Bahia", "Pernambuco", "Ceará", "Goiás", "Distrito Federal",
  "Espírito Santo", "Mato Grosso", "Mato Grosso do Sul", "Pará",
  "Outro",
];

const CHANNELS = ["Instagram", "Google Ads", "Facebook Ads", "Indicação", "WhatsApp", "Orgânico", "TikTok", "LinkedIn"];

const LOADING_PHRASES = [
  "Analisando comportamento do seu mercado...",
  "Mapeando concorrência na sua região...",
  "Identificando oportunidades de aquisição...",
  "Estruturando estratégias de vendas...",
  "Organizando processos da sua operação...",
  "Gerando plano inicial de crescimento...",
];

const FLOATING_WORDS = [
  "leads", "conversão", "ROI", "funil", "tráfego", "vendas",
  "escala", "crescimento", "pipeline", "metas", "automação",
  "CRM", "conteúdo", "WhatsApp", "retenção", "aquisição",
];

const ANALYSIS_MARKETING = [
  "Sua empresa não possui estratégia consistente de aquisição",
  "Baixa presença em canais de alta intenção",
  "Conteúdo não estruturado para geração de demanda",
];
const ANALYSIS_VENDAS = [
  "Falta de processo comercial definido",
  "Leads não acompanhados corretamente",
  "Conversão abaixo do potencial",
];
const ANALYSIS_GESTAO = [
  "Ausência de metas claras por time",
  "Falta de indicadores de desempenho",
  "Crescimento sem previsibilidade",
];
const ANALYSIS_AQUISICAO = [
  "Dependência de poucos canais",
  "Baixa escala de entrada de leads",
  "Falta de estratégia contínua",
];

const VISIBLE_ACTIONS = [
  "Campanhas estruturadas por intenção de compra",
  "Produção de conteúdo estratégica para redes sociais",
  "Processo comercial com follow-up ativo",
  "Definição de metas por equipe",
  "Acompanhamento de indicadores em tempo real",
];

const BLOCKED_ACTIONS = [
  "Estratégia completa de marketing por canal",
  "Planejamento de conteúdo automatizado para redes sociais",
  "Calendário de posts gerado por IA",
  "Estrutura completa de funil de vendas",
  "Pipeline comercial pronto",
  "Automação de follow-up (WhatsApp e CRM)",
  "Metas por time e acompanhamento",
  "Tarefas organizadas por equipe",
  "Dashboard com números reais",
  "Projeção de faturamento e crescimento",
  "Agentes de IA para execução contínua",
];

const SYSTEM_BLOCKS = [
  {
    icon: Target, title: "Marketing", accent: "text-red-400", border: "border-red-500/20", bg: "bg-red-500/5",
    items: ["Planejamento estratégico por canal", "Geração de conteúdo com IA", "Criação de posts para redes sociais", "Estratégias de tráfego pago", "Sugestões de criativos"],
  },
  {
    icon: TrendingUp, title: "Vendas", accent: "text-blue-400", border: "border-blue-500/20", bg: "bg-blue-500/5",
    items: ["CRM completo integrado", "Pipeline de vendas estruturado", "Gestão de leads", "Histórico e acompanhamento", "Automação de follow-up"],
  },
  {
    icon: BarChart3, title: "Gestão", accent: "text-emerald-400", border: "border-emerald-500/20", bg: "bg-emerald-500/5",
    items: ["Metas por equipe e por usuário", "Indicadores em tempo real", "Dashboard de desempenho", "Previsibilidade de resultados", "Controle de crescimento"],
  },
  {
    icon: Rocket, title: "Execução", accent: "text-amber-400", border: "border-amber-500/20", bg: "bg-amber-500/5",
    items: ["Tarefas organizadas por time", "Fluxos de trabalho automatizados", "Gestão de atividades", "Distribuição de demandas"],
  },
  {
    icon: Bot, title: "IA (Agentes)", accent: "text-purple-400", border: "border-purple-500/20", bg: "bg-purple-500/5",
    items: ["IA que gera estratégias automaticamente", "IA que sugere ações diárias", "IA que analisa desempenho", "IA que ajusta o plano continuamente"],
  },
  {
    icon: MessageSquare, title: "Integrações", accent: "text-green-400", border: "border-green-500/20", bg: "bg-green-500/5",
    items: ["Integração com WhatsApp", "Comunicação direta com leads", "Automação de mensagens", "Centralização do atendimento"],
  },
];

const HOW_IT_WORKS = [
  { num: "01", icon: Compass, title: "A IA analisa", desc: "Seu segmento, região e contexto são processados pela nossa inteligência artificial" },
  { num: "02", icon: BrainCircuit, title: "O sistema gera", desc: "Estratégias completas de marketing, vendas e gestão personalizadas" },
  { num: "03", icon: Rocket, title: "Você executa", desc: "Com tarefas organizadas e acompanha tudo em tempo real" },
];

const STATS = [
  { value: "+3.842", label: "empresas analisadas" },
  { value: "+27.000", label: "oportunidades identificadas" },
  { value: "+63%", label: "média de melhoria potencial" },
];

/* ── Animations ─────────────────────────────────────────────── */

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

/* ── Floating Word Component ────────────────────────────────── */

const FloatingWord = ({ word, index }: { word: string; index: number }) => {
  const angle = (index / FLOATING_WORDS.length) * Math.PI * 2;
  const radius = 120 + Math.random() * 180;
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;

  return (
    <motion.span
      className="absolute text-white/20 font-mono text-sm pointer-events-none select-none"
      initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
      animate={{
        opacity: [0, 0.6, 0.3],
        scale: [0, 1.2, 1],
        x,
        y,
      }}
      transition={{ delay: 0.3 + index * 0.15, duration: 1.2, ease: "easeOut" }}
    >
      {word}
    </motion.span>
  );
};

/* ── Score Ring ──────────────────────────────────────────────── */

const ScoreRing = ({ score }: { score: number }) => {
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative w-32 h-32 mx-auto">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(225,15%,15%)" strokeWidth="8" />
        <motion.circle
          cx="60" cy="60" r="54" fill="none" stroke="hsl(355,78%,50%)" strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-3xl font-bold text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          {score}
        </motion.span>
        <span className="text-[10px] text-white/40 uppercase tracking-wider">/100</span>
      </div>
    </div>
  );
};

/* ── Analysis Card ──────────────────────────────────────────── */

const AnalysisCard = ({ title, icon: Icon, items, color, delay }: {
  title: string; icon: React.ElementType; items: string[]; color: string; delay: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className={`rounded-2xl border border-white/5 bg-white/[0.02] p-6`}
  >
    <div className="flex items-center gap-3 mb-4">
      <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <h4 className="text-sm font-semibold text-white uppercase tracking-wider">{title}</h4>
    </div>
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <motion.li
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: delay + 0.1 + i * 0.1 }}
          className="flex items-start gap-2"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-red-500/60 mt-1.5 flex-shrink-0" />
          <span className="text-sm text-white/60">{item}</span>
        </motion.li>
      ))}
    </ul>
  </motion.div>
);

/* ── Main Component ─────────────────────────────────────────── */

type Phase = "form" | "loading" | "result";

const SaasLanding = () => {
  const { user, role } = useAuth();

  if (user && role) {
    if (role === "super_admin" || role === "admin") return <Navigate to="/franqueadora/inicio" replace />;
    if (role === "franqueado") return <Navigate to="/franqueado/inicio" replace />;
    return <Navigate to="/cliente/inicio" replace />;
  }

  return <LandingContent />;
};

const LandingContent = () => {
  const [phase, setPhase] = useState<Phase>("form");
  const [segment, setSegment] = useState("");
  const [region, setRegion] = useState("");
  const [channel, setChannel] = useState("");
  const [site, setSite] = useState("");
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const resultRef = useRef<HTMLDivElement>(null);

  const bg = "bg-[hsl(225,20%,4%)]";

  const handleSubmit = useCallback(() => {
    if (!segment || !region) return;
    setPhase("loading");
    setLoadingIndex(0);
    setProgress(0);
  }, [segment, region]);

  // Loading phase animation
  useEffect(() => {
    if (phase !== "loading") return;
    const phraseInterval = setInterval(() => {
      setLoadingIndex(prev => {
        if (prev >= LOADING_PHRASES.length - 1) {
          clearInterval(phraseInterval);
          setTimeout(() => {
            setPhase("result");
            setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
          }, 800);
          return prev;
        }
        return prev + 1;
      });
    }, 1400);

    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 1.5, 100));
    }, 100);

    return () => { clearInterval(phraseInterval); clearInterval(progressInterval); };
  }, [phase]);

  return (
    <div className={`min-h-screen ${bg} text-white overflow-x-hidden`}>

      {/* ── Nav ──────────────────────────────────────────────── */}
      <nav className={`sticky top-0 z-50 flex items-center justify-between px-6 lg:px-16 py-4 border-b border-white/5 ${bg}/80 backdrop-blur-xl`}>
        <img src={logoDark} alt="N360" className="h-8 object-contain" />
        <div className="flex items-center gap-3">
          <Link to="/app">
            <Button variant="ghost" className="text-white/60 hover:text-white hover:bg-white/5">Entrar</Button>
          </Link>
          <Link to="/app">
            <Button className="bg-[hsl(355,78%,50%)] hover:bg-[hsl(355,78%,45%)] text-white">
              Começar grátis
            </Button>
          </Link>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════════
          1. HERO — FORM
          ══════════════════════════════════════════════════════════ */}
      <section className="relative px-6 lg:px-16 py-20 lg:py-32 max-w-5xl mx-auto text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-[hsl(355,78%,50%)]/8 rounded-full blur-[140px] pointer-events-none" />

        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="relative z-10">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight mb-5">
            Descubra onde sua empresa está{" "}
            <span className="text-[hsl(355,78%,50%)]">perdendo vendas</span>{" "}
            em menos de 60 segundos
          </h1>
          <p className="text-base lg:text-lg text-white/50 max-w-2xl mx-auto mb-10">
            Veja estratégias reais de marketing, vendas e gestão para o seu segmento — com base na sua região
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {phase === "form" && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="relative z-10 max-w-xl mx-auto"
            >
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6 lg:p-8 space-y-4">
                {/* Segmento */}
                <div className="text-left">
                  <label className="text-xs font-medium text-white/40 uppercase tracking-wider mb-1.5 block">Segmento da empresa *</label>
                  <select
                    value={segment}
                    onChange={e => setSegment(e.target.value)}
                    className="w-full h-12 rounded-xl border border-white/10 bg-white/5 text-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(355,78%,50%)]/50 appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-[hsl(225,20%,8%)]">Selecione seu segmento</option>
                    {SEGMENTS.map(s => <option key={s} value={s} className="bg-[hsl(225,20%,8%)]">{s}</option>)}
                  </select>
                </div>

                {/* Região */}
                <div className="text-left">
                  <label className="text-xs font-medium text-white/40 uppercase tracking-wider mb-1.5 block">Região *</label>
                  <select
                    value={region}
                    onChange={e => setRegion(e.target.value)}
                    className="w-full h-12 rounded-xl border border-white/10 bg-white/5 text-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(355,78%,50%)]/50 appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-[hsl(225,20%,8%)]">Selecione sua região</option>
                    {REGIONS.map(r => <option key={r} value={r} className="bg-[hsl(225,20%,8%)]">{r}</option>)}
                  </select>
                </div>

                {/* Row: Canal + Site */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="text-left">
                    <label className="text-xs font-medium text-white/40 uppercase tracking-wider mb-1.5 block">Canal principal</label>
                    <select
                      value={channel}
                      onChange={e => setChannel(e.target.value)}
                      className="w-full h-12 rounded-xl border border-white/10 bg-white/5 text-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(355,78%,50%)]/50 appearance-none cursor-pointer"
                    >
                      <option value="" className="bg-[hsl(225,20%,8%)]">Opcional</option>
                      {CHANNELS.map(c => <option key={c} value={c} className="bg-[hsl(225,20%,8%)]">{c}</option>)}
                    </select>
                  </div>
                  <div className="text-left">
                    <label className="text-xs font-medium text-white/40 uppercase tracking-wider mb-1.5 block">Site</label>
                    <Input
                      value={site}
                      onChange={e => setSite(e.target.value)}
                      placeholder="www.seusite.com.br"
                      className="h-12 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-white/20 focus-visible:ring-[hsl(355,78%,50%)]/50"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={!segment || !region}
                  className="w-full h-14 text-base font-semibold rounded-xl bg-[hsl(355,78%,50%)] hover:bg-[hsl(355,78%,45%)] text-white disabled:opacity-40 transition-all"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Gerar análise estratégica
                </Button>
                <p className="text-[11px] text-white/30 text-center">Diagnóstico gratuito + acesso parcial ao plano de crescimento</p>
              </div>
            </motion.div>
          )}

          {/* ── Loading Animation ─────────────────────────────── */}
          {phase === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 max-w-lg mx-auto py-16"
            >
              {/* Floating words */}
              <div className="relative flex items-center justify-center h-64">
                {FLOATING_WORDS.map((word, i) => (
                  <FloatingWord key={word} word={word} index={i} />
                ))}
                {/* Central pulse */}
                <div className="relative">
                  <motion.div
                    className="w-20 h-20 rounded-full bg-[hsl(355,78%,50%)]/20 border border-[hsl(355,78%,50%)]/30 flex items-center justify-center"
                    animate={{ scale: [1, 1.1, 1], boxShadow: ["0 0 0 0 hsl(355,78%,50%,0.2)", "0 0 0 20px hsl(355,78%,50%,0)", "0 0 0 0 hsl(355,78%,50%,0)"] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <BrainCircuit className="w-8 h-8 text-[hsl(355,78%,50%)]" />
                  </motion.div>
                </div>
              </div>

              {/* Phrase */}
              <AnimatePresence mode="wait">
                <motion.p
                  key={loadingIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="text-sm text-white/60 text-center mb-6"
                >
                  {LOADING_PHRASES[loadingIndex]}
                </motion.p>
              </AnimatePresence>

              {/* Progress bar */}
              <div className="w-full max-w-xs mx-auto h-1 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[hsl(355,78%,50%)] to-[hsl(355,78%,60%)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ══════════════════════════════════════════════════════════
          3. RESULT — ANÁLISE ESTRATÉGICA
          ══════════════════════════════════════════════════════════ */}
      {phase === "result" && (
        <div ref={resultRef}>
          <section className="px-6 lg:px-16 py-16 max-w-5xl mx-auto">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
              {/* Header */}
              <div className="text-center mb-12">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(355,78%,50%)]/10 border border-[hsl(355,78%,50%)]/20 mb-6"
                >
                  <Sparkles className="w-4 h-4 text-[hsl(355,78%,50%)]" />
                  <span className="text-sm text-[hsl(355,78%,60%)]">{segment} · {region}</span>
                </motion.div>
                <h2 className="text-2xl lg:text-3xl font-bold mb-3">Estratégias iniciais para o seu segmento</h2>
                <p className="text-white/40 text-sm">Potencial de crescimento atual</p>
                <div className="mt-6">
                  <ScoreRing score={42} />
                </div>
              </div>

              {/* 4 Analysis Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-16">
                <AnalysisCard title="Marketing" icon={Target} items={ANALYSIS_MARKETING} color="bg-red-500/20" delay={0.3} />
                <AnalysisCard title="Vendas" icon={TrendingUp} items={ANALYSIS_VENDAS} color="bg-blue-500/20" delay={0.5} />
                <AnalysisCard title="Gestão" icon={BarChart3} items={ANALYSIS_GESTAO} color="bg-emerald-500/20" delay={0.7} />
                <AnalysisCard title="Aquisição" icon={Layers} items={ANALYSIS_AQUISICAO} color="bg-amber-500/20" delay={0.9} />
              </div>

              {/* ── O que você deveria estar fazendo ─────────────── */}
              <div className="mb-16">
                <h3 className="text-xl font-bold text-center mb-8">O que você deveria estar fazendo</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-3xl mx-auto">
                  {VISIBLE_ACTIONS.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1 + i * 0.1 }}
                      className="flex items-start gap-2.5 p-3 rounded-xl border border-white/5 bg-white/[0.02]"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-white/70">{item}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* ── Bloqueio — Estratégia Completa ───────────────── */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5 }}
                className="relative rounded-2xl border border-white/10 overflow-hidden mb-16"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[hsl(225,20%,4%)]/60 to-[hsl(225,20%,4%)] z-10 pointer-events-none" />
                <div className="p-8 pb-24">
                  <div className="flex items-center gap-2 mb-6">
                    <Lock className="w-5 h-5 text-[hsl(355,78%,50%)]" />
                    <h3 className="text-lg font-bold">Plano completo de crescimento e operação</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 blur-[2px] select-none">
                    {BLOCKED_ACTIONS.map((item, i) => (
                      <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl border border-white/5 bg-white/[0.02]">
                        <Lock className="w-3.5 h-3.5 text-white/20 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-white/30">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* CTA overlay */}
                <div className="absolute bottom-0 left-0 right-0 z-20 flex justify-center pb-8">
                  <Link to="/app">
                    <Button className="h-14 px-8 text-base font-semibold rounded-xl bg-[hsl(355,78%,50%)] hover:bg-[hsl(355,78%,45%)] text-white shadow-lg shadow-[hsl(355,78%,50%)]/20">
                      <Lock className="w-4 h-4 mr-2" />
                      Desbloquear estratégia completa e sistema de gestão
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </motion.div>
          </section>

          {/* ══════════════════════════════════════════════════════════
              6. SISTEMA COMPLETO
              ══════════════════════════════════════════════════════════ */}
          <section className="px-6 lg:px-16 py-20 border-t border-white/5">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-14">
                <h2 className="text-2xl lg:text-3xl font-bold mb-4">
                  Um sistema que organiza, executa e acompanha o{" "}
                  <span className="text-[hsl(355,78%,50%)]">crescimento</span> da sua empresa
                </h2>
                <p className="text-white/40 max-w-xl mx-auto">
                  Você não precisa de mais ferramentas separadas.<br />
                  Precisa de um sistema que conecta tudo.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {SYSTEM_BLOCKS.map((block, bi) => (
                  <motion.div
                    key={block.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: bi * 0.08 }}
                    className={`rounded-2xl border ${block.border} ${block.bg} p-6`}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <block.icon className={`w-5 h-5 ${block.accent}`} />
                      <h4 className="font-semibold text-white">{block.title}</h4>
                    </div>
                    <ul className="space-y-2">
                      {block.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-white/50">
                          <ChevronRight className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-white/20" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════
              7. COMO FUNCIONA
              ══════════════════════════════════════════════════════════ */}
          <section className="px-6 lg:px-16 py-20 border-t border-white/5">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl lg:text-3xl font-bold text-center mb-14">Como funciona</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {HOW_IT_WORKS.map((step, i) => (
                  <motion.div
                    key={step.num}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15 }}
                    className="text-center"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-[hsl(355,78%,50%)]/10 border border-[hsl(355,78%,50%)]/20 flex items-center justify-center mx-auto mb-4">
                      <step.icon className="w-6 h-6 text-[hsl(355,78%,50%)]" />
                    </div>
                    <span className="text-xs font-mono text-[hsl(355,78%,50%)] mb-2 block">Passo {step.num}</span>
                    <h4 className="font-semibold text-white mb-2">{step.title}</h4>
                    <p className="text-sm text-white/40">{step.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════
              8. PROVA
              ══════════════════════════════════════════════════════════ */}
          <section className="px-6 lg:px-16 py-16 border-t border-white/5">
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
              {STATS.map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center"
                >
                  <p className="text-3xl lg:text-4xl font-extrabold text-[hsl(355,78%,50%)]">{stat.value}</p>
                  <p className="text-sm text-white/40 mt-1">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════
              9. REFORÇO DE DOR
              ══════════════════════════════════════════════════════════ */}
          <section className="px-6 lg:px-16 py-20 border-t border-white/5">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl lg:text-3xl font-bold mb-4">
                Empresas não quebram por falta de <span className="text-[hsl(355,78%,50%)]">esforço</span>
              </h2>
              <p className="text-lg text-white/50 mb-4">Elas quebram por falta de controle.</p>
              <p className="text-sm text-white/30 max-w-lg mx-auto leading-relaxed">
                Sem metas, sem acompanhamento e sem processo, não existe crescimento previsível.
              </p>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════
              10. CTA FINAL
              ══════════════════════════════════════════════════════════ */}
          <section className="px-6 lg:px-16 py-20 border-t border-white/5">
            <div className="max-w-3xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-2xl lg:text-3xl font-bold mb-6">
                  Tenha clareza, execução e controle do seu crescimento
                </h2>
                <Link to="/app">
                  <Button className="h-14 px-10 text-base font-semibold rounded-xl bg-[hsl(355,78%,50%)] hover:bg-[hsl(355,78%,45%)] text-white shadow-lg shadow-[hsl(355,78%,50%)]/20">
                    Criar conta e ver plano completo
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </motion.div>
            </div>
          </section>

          {/* Footer */}
          <footer className="px-6 lg:px-16 py-10 border-t border-white/5">
            <div className="max-w-6xl mx-auto flex items-center justify-between">
              <img src={logoDark} alt="N360" className="h-6 opacity-40" />
              <p className="text-xs text-white/20">© {new Date().getFullYear()} N360. Todos os direitos reservados.</p>
            </div>
          </footer>
        </div>
      )}

      {/* Show remaining sections when still on form/loading */}
      {phase !== "result" && (
        <footer className="px-6 lg:px-16 py-10 border-t border-white/5">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <img src={logoDark} alt="N360" className="h-6 opacity-40" />
            <p className="text-xs text-white/20">© {new Date().getFullYear()} N360. Todos os direitos reservados.</p>
          </div>
        </footer>
      )}
    </div>
  );
};

export default SaasLanding;
