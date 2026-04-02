// @ts-nocheck
import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { UNIFIED_PLANS } from "@/constants/plans";
import {
  Check, Sparkles, Zap, BarChart3, MessageSquare, Bot, Target, ArrowRight,
  ChevronDown, Layers, Megaphone, Shield, TrendingUp, Users, Clock,
  Star, Globe, Compass, BrainCircuit, Palette, LineChart, Rocket,
  AlertTriangle, CheckCircle2, X, Gauge, PenTool, Send, CalendarCheck,
  Crosshair, Trophy, ClipboardCheck
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

const fadeIn = {
  hidden: { opacity: 0 } as const,
  visible: (i: number = 0) => ({ opacity: 1, transition: { delay: i * 0.15, duration: 0.6 } }),
};

/* ── Data ─────────────────────────────────────────────────────── */

const HERO_BADGES = [
  { icon: Compass, label: "GPS do Negócio" },
  { icon: Target, label: "CRM Inteligente" },
  { icon: Palette, label: "Marketing com a nossa IA" },
  { icon: Bot, label: "Agente de Vendas 24/7" },
  { icon: LineChart, label: "Metas & Resultados" },
];

const PROBLEMS = [
  {
    icon: AlertTriangle,
    problem: "Sem estratégia clara",
    desc: "Sua equipe vende sem direção, sem metas definidas e sem saber o que funciona.",
    solution: "GPS do Negócio",
    solutionDesc: "A nossa IA analisa seu negócio, cria um diagnóstico completo e entrega um plano de ação personalizado com metas reais.",
    solutionIcon: Compass,
  },
  {
    icon: AlertTriangle,
    problem: "Marketing sem resultado",
    desc: "Você investe em conteúdo, artes e anúncios, mas nada é alinhado ao seu público real.",
    solution: "Marketing Estratégico com IA",
    solutionDesc: "A nossa IA gera conteúdos, artes, sites e campanhas com base no perfil real do seu negócio e do seu cliente ideal.",
    solutionIcon: Megaphone,
  },
  {
    icon: AlertTriangle,
    problem: "Vendas desorganizadas",
    desc: "Leads perdidos, sem follow-up, sem scripts, sem acompanhamento de performance.",
    solution: "CRM + Automação Comercial",
    solutionDesc: "Funis visuais, scripts gerados pela IA, metas por equipe, ranking de vendedores e acompanhamento em tempo real.",
    solutionIcon: TrendingUp,
  },
];

const ECOSYSTEM = [
  {
    phase: "Diagnosticar",
    icon: Compass,
    title: "GPS do Negócio",
    desc: "Análise completa do seu negócio com a nossa IA. Score comercial, maturidade de marketing, perfil de cliente ideal e plano de ação personalizado.",
    color: "from-blue-500/20 to-blue-600/5",
    borderColor: "border-blue-500/20 hover:border-blue-500/40",
  },
  {
    phase: "Planejar",
    icon: BrainCircuit,
    title: "Estratégia Personalizada",
    desc: "A nossa IA cria sua estratégia de marketing e vendas com base no diagnóstico. Calendário editorial, plano de conteúdo e metas comerciais.",
    color: "from-purple-500/20 to-purple-600/5",
    borderColor: "border-purple-500/20 hover:border-purple-500/40",
  },
  {
    phase: "Executar Marketing",
    icon: Palette,
    title: "Conteúdos, Artes & Sites",
    desc: "Gere posts, artes profissionais, landing pages e campanhas de tráfego pago — tudo alinhado à identidade e estratégia do seu negócio.",
    color: "from-pink-500/20 to-pink-600/5",
    borderColor: "border-pink-500/20 hover:border-pink-500/40",
  },
  {
    phase: "Executar Vendas",
    icon: Target,
    title: "CRM, Scripts & Metas",
    desc: "CRM com funis visuais, scripts de vendas gerados pela IA, metas por equipe, ranking de vendedores e prospecção automatizada.",
    color: "from-emerald-500/20 to-emerald-600/5",
    borderColor: "border-emerald-500/20 hover:border-emerald-500/40",
  },
  {
    phase: "Automatizar",
    icon: Bot,
    title: "Agente de IA & WhatsApp",
    desc: "Robôs treinados que atendem, qualificam e agendam reuniões 24/7. Disparos em massa, follow-ups automáticos e integração com WhatsApp.",
    color: "from-amber-500/20 to-amber-600/5",
    borderColor: "border-amber-500/20 hover:border-amber-500/40",
  },
  {
    phase: "Acompanhar",
    icon: LineChart,
    title: "Dashboards & Relatórios",
    desc: "Métricas comerciais e de marketing em tempo real. Checklist diário, alertas inteligentes e visão completa da operação.",
    color: "from-cyan-500/20 to-cyan-600/5",
    borderColor: "border-cyan-500/20 hover:border-cyan-500/40",
  },
];

const STEPS = [
  { num: "01", title: "Crie sua conta e responda o GPS", desc: "Em 5 minutos, a nossa IA entende seu negócio, seu mercado e seu momento comercial.", icon: Compass },
  { num: "02", title: "Receba sua estratégia personalizada", desc: "A nossa IA cria seu plano de marketing e vendas com metas, scripts e calendário editorial.", icon: BrainCircuit },
  { num: "03", title: "Execute e acompanhe resultados", desc: "Use as ferramentas integradas para executar o plano e acompanhe a evolução em tempo real.", icon: Rocket },
];

const DIFFERENTIALS = [
  { icon: Layers, title: "Tudo em um só lugar", desc: "CRM, marketing, vendas, conteúdo, artes, sites, automação e relatórios. Sem precisar de 5 ferramentas separadas." },
  { icon: BrainCircuit, title: "IA que entende SEU negócio", desc: "Não é uma IA genérica. Ela é treinada com os dados do seu GPS, seu público, seus produtos e seus objetivos." },
  { icon: Compass, title: "Do diagnóstico à execução", desc: "Não é só ferramenta — é estratégia. O sistema diagnostica, planeja e executa com você." },
  { icon: Users, title: "Para empresas, equipes e setores", desc: "Funciona para o empresário sozinho, para equipes de vendas e para empresas com múltiplos setores e unidades." },
];

const STATS = [
  { value: "500+", label: "Empresas ativas" },
  { value: "10M+", label: "Leads gerenciados" },
  { value: "2M+", label: "Mensagens enviadas" },
  { value: "99.9%", label: "Uptime garantido" },
];

const TESTIMONIALS = [
  { name: "Carlos M.", role: "CEO, Agência Digital", text: "Triplicamos nossas vendas em 3 meses. O GPS do Negócio deu clareza total sobre onde atacar.", stars: 5 },
  { name: "Ana Paula R.", role: "Diretora Comercial", text: "A nossa equipe nunca teve tanta organização. CRM, metas e scripts — tudo em um lugar só.", stars: 5 },
  { name: "Ricardo S.", role: "Fundador, StartupX", text: "A IA que entende meu negócio fez toda a diferença. As artes e conteúdos saem alinhados com minha marca.", stars: 5 },
];

const FAQ = [
  { q: "O que é o GPS do Negócio?", a: "É o diagnóstico completo da sua empresa feito pela nossa IA. Ele analisa marketing, vendas, público-alvo e maturidade comercial, gerando um score e um plano de ação personalizado." },
  { q: "Preciso de cartão de crédito para começar?", a: "Não! O trial de 7 dias é 100% gratuito e inclui 500 créditos para você testar todas as funcionalidades." },
  { q: "A IA realmente entende meu negócio?", a: "Sim. Através do GPS do Negócio, a nossa IA aprende sobre seu mercado, produtos, público e objetivos. Todas as sugestões, conteúdos e estratégias são personalizados." },
  { q: "Posso usar para minha equipe de vendas?", a: "Sim! O sistema suporta múltiplos usuários com metas individuais, ranking, scripts personalizados e acompanhamento em tempo real." },
  { q: "Substitui meu CRM atual?", a: "Sim. O CRM da NoExcuse inclui funis visuais, automações, integração com WhatsApp, qualificação com IA e muito mais — tudo conectado à estratégia do GPS." },
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

  return (
    <div className="min-h-screen bg-[hsl(225,20%,4%)] text-white overflow-x-hidden">
      {/* ── Nav ──────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 lg:px-16 py-4 border-b border-white/5 bg-[hsl(225,20%,4%)]/80 backdrop-blur-xl">
        <img src={logoDark} alt="NoExcuse" className="h-8 object-contain" />
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

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative px-6 lg:px-16 py-24 lg:py-36 max-w-6xl mx-auto text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[hsl(355,78%,50%)]/10 rounded-full blur-[120px] pointer-events-none" />

        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(355,78%,50%)]/10 border border-[hsl(355,78%,50%)]/20 mb-8">
          <Sparkles className="h-4 w-4 text-[hsl(355,78%,50%)]" />
          <span className="text-sm font-medium text-[hsl(355,78%,60%)]">7 dias grátis · 500 créditos · Sem cartão</span>
        </motion.div>

        <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={1}
          className="text-4xl sm:text-5xl lg:text-7xl font-black uppercase italic tracking-tighter leading-[0.95] mb-6">
          Gestão comercial<br />
          <span className="text-[hsl(355,78%,50%)]">completa com IA.</span>
        </motion.h1>

        <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2}
          className="text-lg lg:text-xl text-white/50 max-w-2xl mx-auto mb-10">
          Do diagnóstico à execução — marketing, vendas e estratégia personalizada em um só lugar. A nossa IA entende seu negócio e entrega resultados.
        </motion.p>

        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3}
          className="flex flex-wrap justify-center gap-3 mb-12">
          {HERO_BADGES.map((f) => (
            <div key={f.label} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10">
              <f.icon className="h-4 w-4 text-[hsl(355,78%,55%)]" />
              <span className="text-sm text-white/70">{f.label}</span>
            </div>
          ))}
        </motion.div>

        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={4}>
          <Link to="/app">
            <Button size="lg" className="bg-[hsl(355,78%,50%)] hover:bg-[hsl(355,78%,45%)] text-white text-lg px-10 py-6 h-auto shadow-lg shadow-[hsl(355,78%,50%)]/25">
              Começar meu diagnóstico grátis <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <p className="mt-4 text-xs text-white/30">Teste grátis por 7 dias · Cancele quando quiser</p>
        </motion.div>
      </section>

      {/* ── Problema → Solução ───────────────────────────────── */}
      <section className="px-6 lg:px-16 py-20 lg:py-28 bg-white/[0.01]">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-3">Sua empresa enfrenta isso?</h2>
            <p className="text-white/50 max-w-lg mx-auto">A maioria das empresas perde vendas por falta de estratégia, não de esforço</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {PROBLEMS.map((p, i) => (
              <motion.div key={p.problem} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
                {/* Problem */}
                <div className="p-6 border-b border-white/5">
                  <div className="flex items-center gap-2 mb-3">
                    <X className="h-5 w-5 text-red-400" />
                    <span className="text-sm font-bold text-red-400 uppercase tracking-wider">O problema</span>
                  </div>
                  <h3 className="text-lg font-bold mb-2">{p.problem}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">{p.desc}</p>
                </div>
                {/* Solution */}
                <div className="p-6 bg-[hsl(355,78%,50%)]/[0.03]">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    <span className="text-sm font-bold text-emerald-400 uppercase tracking-wider">A solução</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <p.solutionIcon className="h-5 w-5 text-[hsl(355,78%,55%)]" />
                    <h4 className="text-base font-bold">{p.solution}</h4>
                  </div>
                  <p className="text-white/50 text-sm leading-relaxed">{p.solutionDesc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social Proof Numbers ─────────────────────────────── */}
      <section className="border-y border-white/5">
        <div className="max-w-6xl mx-auto px-6 lg:px-16 py-14 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s, i) => (
            <motion.div key={s.label} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              className="text-center">
              <div className="text-3xl lg:text-4xl font-black text-[hsl(355,78%,55%)]">{s.value}</div>
              <div className="text-sm text-white/40 mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Ecossistema ──────────────────────────────────────── */}
      <section className="px-6 lg:px-16 py-20 lg:py-28 max-w-6xl mx-auto">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
          className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold mb-3">O ecossistema completo para crescer</h2>
          <p className="text-white/50 max-w-xl mx-auto">Uma jornada completa: do diagnóstico ao resultado — com a nossa IA em cada etapa</p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {ECOSYSTEM.map((item, i) => (
            <motion.div key={item.phase} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              className={`relative rounded-2xl p-6 border ${item.borderColor} bg-gradient-to-br ${item.color} transition-colors group`}>
              <div className="text-xs font-bold text-[hsl(355,78%,55%)] uppercase tracking-widest mb-4">{item.phase}</div>
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 mb-4 group-hover:bg-white/10 transition-colors">
                <item.icon className="h-6 w-6 text-white/80" />
              </div>
              <h3 className="text-lg font-bold mb-2">{item.title}</h3>
              <p className="text-white/40 text-sm leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Como funciona ────────────────────────────────────── */}
      <section className="px-6 lg:px-16 py-20 lg:py-28 bg-white/[0.01]">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-3">Comece em 3 passos</h2>
            <p className="text-white/50 max-w-lg mx-auto">Da conta criada ao resultado — em minutos, não meses</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <motion.div key={step.num} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className="relative rounded-2xl p-8 border border-white/10 bg-white/[0.02] text-center group hover:border-[hsl(355,78%,50%)]/30 transition-colors">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-[hsl(355,78%,50%)]/10 mb-5">
                  <step.icon className="h-7 w-7 text-[hsl(355,78%,55%)]" />
                </div>
                <div className="text-xs font-bold text-[hsl(355,78%,50%)] tracking-widest uppercase mb-2">{step.num}</div>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Diferenciais ─────────────────────────────────────── */}
      <section className="px-6 lg:px-16 py-20 lg:py-28 max-w-6xl mx-auto">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
          className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold mb-3">Por que a NoExcuse é diferente?</h2>
          <p className="text-white/50 max-w-lg mx-auto">Não é mais uma ferramenta — é um sistema de crescimento comercial</p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-6">
          {DIFFERENTIALS.map((d, i) => (
            <motion.div key={d.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              className="flex gap-5 rounded-2xl p-6 border border-white/10 bg-white/[0.02] hover:border-[hsl(355,78%,50%)]/20 transition-colors">
              <div className="shrink-0 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[hsl(355,78%,50%)]/10">
                <d.icon className="h-6 w-6 text-[hsl(355,78%,55%)]" />
              </div>
              <div>
                <h3 className="text-base font-bold mb-1">{d.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{d.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────── */}
      <section className="px-6 lg:px-16 py-20 lg:py-28 bg-white/[0.01]">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-3">Resultados reais de quem usa</h2>
            <p className="text-white/50 max-w-lg mx-auto">Empresas que pararam de dar desculpas e começaram a vender com estratégia</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={t.name} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className="rounded-2xl p-6 border border-white/10 bg-white/[0.02]">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-[hsl(40,95%,55%)] text-[hsl(40,95%,55%)]" />
                  ))}
                </div>
                <p className="text-white/60 text-sm leading-relaxed mb-5">"{t.text}"</p>
                <div>
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-xs text-white/40">{t.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────── */}
      <section className="px-6 lg:px-16 py-20 lg:py-28" id="pricing">
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
                }`}
              >
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
                  <Button
                    className={`w-full ${
                      plan.popular
                        ? "bg-[hsl(355,78%,50%)] hover:bg-[hsl(355,78%,45%)] text-white"
                        : "bg-white/10 hover:bg-white/15 text-white"
                    }`}
                  >
                    Começar grátis
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section className="px-6 lg:px-16 py-20 lg:py-28 bg-white/[0.01] max-w-5xl mx-auto">
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
                className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-white/[0.02] transition-colors"
              >
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

      {/* ── CTA Final ────────────────────────────────────────── */}
      <section className="px-6 lg:px-16 py-20 lg:py-28">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
          className="max-w-4xl mx-auto text-center rounded-3xl p-12 lg:p-16 border border-[hsl(355,78%,50%)]/20 bg-gradient-to-br from-[hsl(355,78%,50%)]/10 to-transparent relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[hsl(355,78%,50%)]/5 rounded-full blur-[100px] pointer-events-none" />
          <h2 className="text-3xl lg:text-5xl font-black uppercase italic tracking-tighter mb-4 relative z-10">
            Pare de dar desculpas.<br /><span className="text-[hsl(355,78%,50%)]">Comece a crescer.</span>
          </h2>
          <p className="text-white/50 max-w-lg mx-auto mb-8 relative z-10">
            Faça o diagnóstico gratuito do seu negócio e descubra exatamente onde estão as oportunidades de crescimento.
          </p>
          <Link to="/app" className="relative z-10">
            <Button size="lg" className="bg-[hsl(355,78%,50%)] hover:bg-[hsl(355,78%,45%)] text-white text-lg px-10 py-6 h-auto shadow-lg shadow-[hsl(355,78%,50%)]/25">
              Fazer meu diagnóstico grátis <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-white/5 px-6 lg:px-16 py-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <img src={logoDark} alt="NoExcuse" className="h-6 object-contain opacity-40" />
          <div className="flex flex-wrap justify-center gap-6 text-sm text-white/30">
            <Link to="/termos" className="hover:text-white/60 transition-colors">Termos de Uso</Link>
            <Link to="/privacidade" className="hover:text-white/60 transition-colors">Política de Privacidade</Link>
            <a href="#pricing" className="hover:text-white/60 transition-colors">Planos</a>
          </div>
          <span className="text-xs text-white/20">© {new Date().getFullYear()} NoExcuse. Todos os direitos reservados.</span>
        </div>
      </footer>
    </div>
  );
};

export default SaasLanding;
