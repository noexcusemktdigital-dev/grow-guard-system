// @ts-nocheck
import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { UNIFIED_PLANS } from "@/constants/plans";
import {
  Check, Sparkles, ArrowRight, ChevronDown, Star,
  Compass, BrainCircuit, Rocket, BarChart3, Bot,
  Target, X, CheckCircle2, AlertTriangle, Eye, EyeOff,
  TrendingUp, Users, Layers, Crosshair, Zap,
  ShieldX, ShieldCheck, CircleDot
} from "lucide-react";
import logoDark from "@/assets/NOE3.png";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

/* ── Animation ────────────────────────────────────────────────── */

const fadeUp = {
  hidden: { opacity: 0, y: 30 } as const,
  visible: (i: number = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

/* ── Data ─────────────────────────────────────────────────────── */

const HERO_BULLETS = [
  "Diagnóstico completo do seu negócio (marketing, vendas e atendimento)",
  "Identificação dos gargalos que impedem crescimento",
  "Plano estratégico com metas claras",
  "Execução com IA + CRM + automações",
  "Acompanhamento em tempo real",
];

const PAIN_POINTS = [
  { icon: EyeOff, text: "Você não sabe por que não vende" },
  { icon: Target, text: "Seu marketing não converte" },
  { icon: Compass, text: "Seu time não tem direção" },
  { icon: Zap, text: "Você depende de sorte ou indicação" },
  { icon: BarChart3, text: "Não existe previsibilidade" },
];

const MECHANISM_STEPS = [
  {
    num: "01",
    icon: Compass,
    phase: "Diagnóstico",
    title: "GPS do Negócio",
    desc: "A nossa IA analisa sua operação e encontra os gargalos reais",
    details: ["Onde você perde dinheiro", "Onde seu processo quebra", "Onde sua equipe trava"],
    color: "from-blue-500/20 to-blue-600/5",
    border: "border-blue-500/30",
    accent: "text-blue-400",
  },
  {
    num: "02",
    icon: BrainCircuit,
    phase: "Direção",
    title: "Estratégia clara",
    desc: "Você recebe um plano completo com:",
    details: ["Metas reais", "Estrutura comercial", "Definição de funil", "Direcionamento de marketing"],
    color: "from-purple-500/20 to-purple-600/5",
    border: "border-purple-500/30",
    accent: "text-purple-400",
  },
  {
    num: "03",
    icon: Rocket,
    phase: "Execução",
    title: "Ferramentas integradas",
    desc: "A própria plataforma executa com você:",
    details: ["CRM estruturado", "Scripts comerciais", "Campanhas e conteúdos", "Automações de atendimento"],
    color: "from-emerald-500/20 to-emerald-600/5",
    border: "border-emerald-500/30",
    accent: "text-emerald-400",
  },
  {
    num: "04",
    icon: BarChart3,
    phase: "Crescimento",
    title: "Acompanhamento",
    desc: "Você acompanha tudo em tempo real:",
    details: ["Metas", "Desempenho", "Evolução", "Previsibilidade"],
    color: "from-amber-500/20 to-amber-600/5",
    border: "border-amber-500/30",
    accent: "text-amber-400",
  },
];

const PRACTICE_ITEMS = [
  { icon: Crosshair, text: "Diagnostica sua operação" },
  { icon: Eye, text: "Mostra os erros reais" },
  { icon: BrainCircuit, text: "Define o que precisa ser feito" },
  { icon: Rocket, text: "Executa junto com você" },
  { icon: BarChart3, text: "Acompanha até gerar resultado" },
];

const BEFORE_AFTER = {
  before: [
    "Sem clareza",
    "Sem processo",
    "Sem previsibilidade",
    "Dependência do dono",
    "Time perdido",
  ],
  after: [
    "Operação estruturada",
    "Metas claras",
    "Funil organizado",
    "Time produtivo",
    "Crescimento previsível",
  ],
};

const HOW_IT_WORKS = [
  { num: "01", icon: Compass, title: "Responda o diagnóstico", desc: "Você entra e responde as perguntas do GPS do Negócio" },
  { num: "02", icon: BrainCircuit, title: "Receba o plano estratégico", desc: "A nossa IA monta sua estratégia completa com metas e ações" },
  { num: "03", icon: Rocket, title: "Execute na plataforma", desc: "Use as ferramentas integradas para colocar o plano em prática" },
];

const COMPARISON = {
  others: [
    "Ferramentas isoladas",
    "Genéricas, sem contexto",
    "Sem estratégia",
  ],
  n360: [
    "Totalmente integrada",
    "Estratégica e personalizada",
    "Orientada a resultado",
  ],
};

const QUALIFICATION = {
  isFor: [
    "Empresas que já vendem, mas não escalam",
    "Quem quer previsibilidade",
    "Quem quer organizar operação",
  ],
  notFor: [
    "Quem quer resultado sem execução",
    "Quem não tem operação mínima",
    "Quem busca \"atalho\"",
  ],
};

const FAQ = [
  { q: "O que é o GPS do Negócio?", a: "É o diagnóstico completo da sua empresa feito pela nossa IA. Ele analisa marketing, vendas, público-alvo e maturidade comercial, gerando um score e um plano de ação personalizado." },
  { q: "Preciso de cartão de crédito para começar?", a: "Não! O trial de 7 dias é 100% gratuito e inclui 500 créditos para você testar todas as funcionalidades." },
  { q: "A IA realmente entende meu negócio?", a: "Sim. Através do GPS do Negócio, a nossa IA aprende sobre seu mercado, produtos, público e objetivos. Todas as sugestões, conteúdos e estratégias são personalizados." },
  { q: "Posso usar para minha equipe de vendas?", a: "Sim! O sistema suporta múltiplos usuários com metas individuais, ranking, scripts personalizados e acompanhamento em tempo real." },
  { q: "Substitui meu CRM atual?", a: "Sim. O CRM da N360 inclui funis visuais, automações, integração com WhatsApp, qualificação com IA e muito mais — tudo conectado à estratégia do GPS." },
  { q: "Posso cancelar a qualquer momento?", a: "Sim, sem multa e sem burocracia. Você pode cancelar diretamente nas configurações da sua conta." },
];

/* ── Component ────────────────────────────────────────────────── */

const SaasLanding = () => {
  const { user, role } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  if (user && role) {
    if (role === "super_admin" || role === "admin") return <Navigate to="/franqueadora/inicio" replace />;
    if (role === "franqueado") return <Navigate to="/franqueado/inicio" replace />;
    return <Navigate to="/cliente/inicio" replace />;
  }

  const bg = "bg-[hsl(225,20%,4%)]";
  const red = "hsl(355,78%,50%)";

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
            <Button className="bg-[hsl(var(--primary))] hover:bg-[hsl(355,78%,45%)] text-white">
              Começar grátis
            </Button>
          </Link>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════════
          1. HERO — PROMESSA DE CONTROLE E DIREÇÃO
          ══════════════════════════════════════════════════════════ */}
      <section className="relative px-6 lg:px-16 py-24 lg:py-36 max-w-6xl mx-auto">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-[hsl(355,78%,50%)]/8 rounded-full blur-[140px] pointer-events-none" />

        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(355,78%,50%)]/10 border border-[hsl(355,78%,50%)]/20 mb-8">
          <Sparkles className="h-4 w-4 text-[hsl(355,78%,50%)]" />
          <span className="text-sm font-medium text-[hsl(355,78%,60%)]">7 dias grátis · 500 créditos · Sem cartão</span>
        </motion.div>

        <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={1}
          className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight leading-[1.05] mb-4">
          Eu vou encontrar o que está<br />
          <span className="text-[hsl(355,78%,50%)]">travando seu crescimento.</span>
        </motion.h1>

        <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2}
          className="text-lg lg:text-xl text-white/50 max-w-3xl mb-3">
          A N360 diagnostica sua operação, mostra exatamente onde estão os gargalos e te direciona — com estratégia e execução — até o crescimento.
        </motion.p>

        <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2.5}
          className="text-base text-white/35 italic mb-10 max-w-2xl">
          Do ponto que você está hoje até o resultado que você quer atingir.
        </motion.p>

        <motion.ul initial="hidden" animate="visible" variants={stagger}
          className="space-y-2 mb-12 max-w-lg">
          {HERO_BULLETS.map((b, i) => (
            <motion.li key={i} variants={fadeUp} custom={3 + i * 0.5}
              className="flex items-start gap-3 text-sm text-white/60">
              <Check className="h-4 w-4 text-[hsl(355,78%,55%)] shrink-0 mt-0.5" />
              {b}
            </motion.li>
          ))}
        </motion.ul>

        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={6}>
          <Link to="/app">
            <Button size="lg" className="bg-[hsl(var(--primary))] hover:bg-[hsl(355,78%,45%)] text-white text-lg px-10 py-6 h-auto shadow-lg shadow-[hsl(355,78%,50%)]/25">
              Quero descobrir onde meu negócio está travando <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <p className="mt-4 text-xs text-white/30">Teste grátis por 7 dias · Cancele quando quiser</p>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          2. QUEBRA DE CRENÇA — O PROBLEMA REAL
          ══════════════════════════════════════════════════════════ */}
      <section className="px-6 lg:px-16 py-20 lg:py-28 bg-white/[0.01]">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="text-3xl lg:text-5xl font-black tracking-tight mb-3">
            Seu problema não é vender.
          </motion.h2>
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
            className="text-2xl lg:text-3xl text-[hsl(355,78%,55%)] font-bold mb-10">
            É não saber onde está errando.
          </motion.p>

          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2}
            className="text-white/50 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            A maioria das empresas tenta melhorar esforço, equipe ou investimento… Mas não resolve o principal:
          </motion.p>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
            className="flex flex-wrap justify-center gap-4 mb-10">
            {["Falta de diagnóstico", "Falta de direção", "Falta de processo"].map((item, i) => (
              <motion.div key={item} variants={fadeUp} custom={i}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[hsl(355,78%,50%)]/10 border border-[hsl(355,78%,50%)]/20">
                <AlertTriangle className="h-4 w-4 text-[hsl(355,78%,55%)]" />
                <span className="text-sm font-semibold text-white/80">{item}</span>
              </motion.div>
            ))}
          </motion.div>

          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={4}
            className="text-white/40 text-base italic">
            Sem isso, qualquer ação vira tentativa.
          </motion.p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          3. O MECANISMO — Diagnóstico → Direção → Execução → Crescimento
          ══════════════════════════════════════════════════════════ */}
      <section className="px-6 lg:px-16 py-20 lg:py-28 max-w-6xl mx-auto">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
          className="text-center mb-6">
          <h2 className="text-3xl lg:text-5xl font-black tracking-tight mb-3">
            Antes de crescer, você precisa enxergar.
          </h2>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            A N360 entra no seu negócio, analisa e mostra exatamente o que precisa ser corrigido.
          </p>
        </motion.div>

        {/* Timeline connector line */}
        <div className="hidden lg:block relative">
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-blue-500/30 via-purple-500/30 via-emerald-500/30 to-amber-500/30" />
        </div>

        <div className="grid gap-6 lg:gap-8 mt-14">
          {MECHANISM_STEPS.map((step, i) => (
            <motion.div key={step.num} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              className={`relative rounded-2xl p-8 border ${step.border} bg-gradient-to-br ${step.color} overflow-hidden`}>
              <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                <div className="shrink-0">
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/5`}>
                    <step.icon className={`h-7 w-7 ${step.accent}`} />
                  </div>
                </div>
                <div className="flex-1">
                  <div className={`text-xs font-bold uppercase tracking-widest mb-2 ${step.accent}`}>
                    {step.phase}
                  </div>
                  <h3 className="text-xl lg:text-2xl font-bold mb-2">{step.title}</h3>
                  <p className="text-white/50 mb-4">{step.desc}</p>
                  <div className="flex flex-wrap gap-2">
                    {step.details.map((d) => (
                      <span key={d} className="flex items-center gap-1.5 text-sm text-white/60 px-3 py-1.5 rounded-lg bg-white/5">
                        <ArrowRight className="h-3 w-3 text-white/30" />
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="shrink-0 hidden lg:flex items-center justify-center w-16 h-16 rounded-full bg-white/[0.03] border border-white/10">
                  <span className="text-2xl font-black text-white/20">{step.num}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          4. PROBLEMA → CONSEQUÊNCIA (AUMENTAR DOR)
          ══════════════════════════════════════════════════════════ */}
      <section className="px-6 lg:px-16 py-20 lg:py-28 bg-white/[0.01]">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="text-3xl lg:text-5xl font-black tracking-tight mb-4">
            Sem diagnóstico, você está<br />
            <span className="text-[hsl(355,78%,50%)]">operando no escuro.</span>
          </motion.h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-12 max-w-3xl mx-auto">
            {PAIN_POINTS.map((p, i) => (
              <motion.div key={p.text} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className="flex items-center gap-3 px-5 py-4 rounded-xl border border-red-500/15 bg-red-500/5 text-left">
                <p.icon className="h-5 w-5 text-red-400 shrink-0" />
                <span className="text-sm text-white/70">{p.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          5. O QUE A N360 FAZ NA PRÁTICA
          ══════════════════════════════════════════════════════════ */}
      <section className="px-6 lg:px-16 py-20 lg:py-28 max-w-6xl mx-auto">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
          className="text-center mb-14">
          <h2 className="text-3xl lg:text-4xl font-black tracking-tight mb-3">
            A gente não te entrega ferramentas.<br />
            <span className="text-[hsl(355,78%,50%)]">A gente organiza seu crescimento.</span>
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-12">
          {PRACTICE_ITEMS.map((item, i) => (
            <motion.div key={item.text} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              className="flex flex-col items-center text-center gap-3 p-6 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-[hsl(355,78%,50%)]/20 transition-colors">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[hsl(355,78%,50%)]/10">
                <item.icon className="h-6 w-6 text-[hsl(355,78%,55%)]" />
              </div>
              <span className="text-sm text-white/70 font-medium">{item.text}</span>
            </motion.div>
          ))}
        </div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
          className="text-center">
          <p className="text-white/40 text-lg italic max-w-lg mx-auto">
            Você não precisa de várias ferramentas.<br />
            <span className="text-white/70 font-semibold not-italic">Você precisa de direção + execução.</span>
          </p>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          6. TRANSFORMAÇÃO (ANTES vs DEPOIS)
          ══════════════════════════════════════════════════════════ */}
      <section className="px-6 lg:px-16 py-20 lg:py-28 bg-white/[0.01]">
        <div className="max-w-4xl mx-auto">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="text-3xl lg:text-4xl font-black tracking-tight text-center mb-14">
            A transformação que você vai viver
          </motion.h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Before */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
              className="rounded-2xl p-8 border border-red-500/20 bg-red-500/5">
              <div className="flex items-center gap-2 mb-6">
                <X className="h-5 w-5 text-red-400" />
                <span className="font-bold text-red-400 uppercase tracking-wider text-sm">Antes</span>
              </div>
              <ul className="space-y-4">
                {BEFORE_AFTER.before.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-white/50">
                    <div className="w-2 h-2 rounded-full bg-red-500/50 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* After */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
              className="rounded-2xl p-8 border border-emerald-500/20 bg-emerald-500/5">
              <div className="flex items-center gap-2 mb-6">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <span className="font-bold text-emerald-400 uppercase tracking-wider text-sm">Depois</span>
              </div>
              <ul className="space-y-4">
                {BEFORE_AFTER.after.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-white/70">
                    <div className="w-2 h-2 rounded-full bg-emerald-500/50 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          7. COMO FUNCIONA (3 PASSOS)
          ══════════════════════════════════════════════════════════ */}
      <section className="px-6 lg:px-16 py-20 lg:py-28 max-w-6xl mx-auto">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
          className="text-center mb-14">
          <h2 className="text-3xl lg:text-4xl font-black tracking-tight mb-3">
            Você não precisa montar nada.<br />
            <span className="text-white/50 font-normal text-2xl lg:text-3xl">Só seguir o processo.</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {HOW_IT_WORKS.map((step, i) => (
            <motion.div key={step.num} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              className="relative rounded-2xl p-8 border border-white/10 bg-white/[0.02] text-center group hover:border-[hsl(355,78%,50%)]/30 transition-colors">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-[hsl(355,78%,50%)]/10 mb-5">
                <step.icon className="h-7 w-7 text-[hsl(355,78%,55%)]" />
              </div>
              <div className="text-xs font-bold text-[hsl(355,78%,50%)] tracking-widest uppercase mb-2">Passo {step.num}</div>
              <h3 className="text-xl font-bold mb-2">{step.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          8. DIFERENCIAL — Isso não é mais uma IA
          ══════════════════════════════════════════════════════════ */}
      <section className="px-6 lg:px-16 py-20 lg:py-28 bg-white/[0.01]">
        <div className="max-w-4xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="text-center mb-14">
            <h2 className="text-3xl lg:text-5xl font-black tracking-tight mb-3">
              Isso não é mais uma IA.
            </h2>
            <p className="text-xl text-[hsl(355,78%,55%)] font-semibold">
              É uma IA que entende seu negócio e age dentro dele.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Others */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
              className="rounded-2xl p-8 border border-white/10 bg-white/[0.02]">
              <div className="flex items-center gap-2 mb-6">
                <ShieldX className="h-5 w-5 text-white/30" />
                <span className="font-bold text-white/30 uppercase tracking-wider text-sm">Outras ferramentas</span>
              </div>
              <ul className="space-y-4">
                {COMPARISON.others.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-white/40">
                    <X className="h-4 w-4 text-white/20 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* N360 */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
              className="rounded-2xl p-8 border border-[hsl(355,78%,50%)]/30 bg-[hsl(355,78%,50%)]/5">
              <div className="flex items-center gap-2 mb-6">
                <ShieldCheck className="h-5 w-5 text-[hsl(355,78%,55%)]" />
                <span className="font-bold text-[hsl(355,78%,55%)] uppercase tracking-wider text-sm">N360</span>
              </div>
              <ul className="space-y-4">
                {COMPARISON.n360.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-white/70">
                    <CheckCircle2 className="h-4 w-4 text-[hsl(355,78%,55%)] shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          9. QUALIFICAÇÃO
          ══════════════════════════════════════════════════════════ */}
      <section className="px-6 lg:px-16 py-20 lg:py-28 max-w-4xl mx-auto">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
          className="text-center mb-14">
          <h2 className="text-3xl lg:text-4xl font-black tracking-tight">
            Isso só funciona pra quem quer<br />
            <span className="text-[hsl(355,78%,50%)]">crescer de verdade.</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Is for */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="rounded-2xl p-8 border border-emerald-500/20 bg-emerald-500/5">
            <div className="flex items-center gap-2 mb-6">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <span className="font-bold text-emerald-400 uppercase tracking-wider text-sm">É para você se</span>
            </div>
            <ul className="space-y-4">
              {QUALIFICATION.isFor.map((item) => (
                <li key={item} className="flex items-start gap-3 text-white/70">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Not for */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
            className="rounded-2xl p-8 border border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-2 mb-6">
              <X className="h-5 w-5 text-white/30" />
              <span className="font-bold text-white/30 uppercase tracking-wider text-sm">Não é para você se</span>
            </div>
            <ul className="space-y-4">
              {QUALIFICATION.notFor.map((item) => (
                <li key={item} className="flex items-start gap-3 text-white/40">
                  <X className="h-4 w-4 text-white/20 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────── */}
      <section className="px-6 lg:px-16 py-20 lg:py-28 bg-white/[0.01]" id="pricing">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-bold mb-3">Planos que cabem no seu bolso</h2>
            <p className="text-white/50">Diagnóstico + Estratégia + Execução. Tudo baseado em créditos.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {UNIFIED_PLANS.map((plan, i) => (
              <motion.div key={plan.id} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className={`relative rounded-2xl p-6 border ${
                  plan.popular
                    ? "border-[hsl(355,78%,50%)] bg-[hsl(355,78%,50%)]/5 shadow-lg shadow-[hsl(355,78%,50%)]/10"
                    : "border-white/10 bg-white/[0.02]"
                }`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[hsl(355,78%,50%)] text-xs font-bold uppercase tracking-wider">
                    Mais popular
                  </div>
                )}
                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                <p className="text-white/40 text-sm mb-4">
                  {plan.credits.toLocaleString("pt-BR")} créditos/mês · até {plan.maxUsers >= 9999 ? "∞" : plan.maxUsers} usuários
                </p>
                <div className="mb-6">
                  <span className="text-3xl font-black">R$ {plan.price}</span>
                  <span className="text-white/40 text-sm">/mês</span>
                </div>
                <ul className="space-y-2 mb-4">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-white/60">
                      <Check className="h-4 w-4 text-[hsl(355,78%,55%)] shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/app">
                  <Button className={`w-full ${
                    plan.popular
                      ? "bg-[hsl(var(--primary))] hover:bg-[hsl(355,78%,45%)] text-white"
                      : "bg-white/10 hover:bg-white/15 text-white"
                  }`}>
                    Começar grátis
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section className="px-6 lg:px-16 py-20 lg:py-28 max-w-5xl mx-auto">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
          className="text-center mb-14">
          <h2 className="text-3xl lg:text-4xl font-bold mb-3">Perguntas frequentes</h2>
          <p className="text-white/50">Tudo que você precisa saber antes de começar</p>
        </motion.div>

        <div className="space-y-3">
          {FAQ.map((item, i) => (
            <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i * 0.5}
              className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-white/[0.02] transition-colors">
                <span className="text-sm font-medium pr-4">{item.q}</span>
                <ChevronDown className={`h-4 w-4 text-white/40 shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
              </button>
              {openFaq === i && (
                <div className="px-6 pb-4 text-sm text-white/50 leading-relaxed">{item.a}</div>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          10. CTA FINAL — FORTE
          ══════════════════════════════════════════════════════════ */}
      <section className="px-6 lg:px-16 py-20 lg:py-28">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
          className="max-w-4xl mx-auto text-center rounded-3xl p-12 lg:p-16 border border-[hsl(355,78%,50%)]/20 bg-gradient-to-br from-[hsl(355,78%,50%)]/10 to-transparent relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[hsl(355,78%,50%)]/5 rounded-full blur-[100px] pointer-events-none" />
          <h2 className="text-3xl lg:text-5xl font-black tracking-tight mb-4 relative z-10">
            Se você não sabe onde está errando,<br />
            <span className="text-[hsl(355,78%,50%)]">não tem como crescer.</span>
          </h2>
          <p className="text-white/50 max-w-lg mx-auto mb-8 relative z-10 text-lg">
            A N360 te mostra, organiza e executa com você.
          </p>
          <Link to="/app" className="relative z-10">
            <Button size="lg" className="bg-[hsl(var(--primary))] hover:bg-[hsl(355,78%,45%)] text-white text-lg px-10 py-6 h-auto shadow-lg shadow-[hsl(355,78%,50%)]/25">
              Quero diagnosticar meu negócio agora <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-white/5 px-6 lg:px-16 py-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <img src={logoDark} alt="N360" className="h-6 object-contain opacity-40" />
          <div className="flex flex-wrap justify-center gap-6 text-sm text-white/30">
            <Link to="/termos" className="hover:text-white/60 transition-colors">Termos de Uso</Link>
            <Link to="/privacidade" className="hover:text-white/60 transition-colors">Política de Privacidade</Link>
            <a href="#pricing" className="hover:text-white/60 transition-colors">Planos</a>
          </div>
          <span className="text-xs text-white/20">© {new Date().getFullYear()} N360. Todos os direitos reservados.</span>
        </div>
      </footer>
    </div>
  );
};

export default SaasLanding;
