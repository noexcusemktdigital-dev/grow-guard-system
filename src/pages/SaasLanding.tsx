// @ts-nocheck
import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Sparkles, ArrowRight, Lock, CheckCircle2,
  Target, TrendingUp, BarChart3, Bot,
  Rocket, BrainCircuit, Compass, MessageSquare,
  Search, ShoppingCart, Megaphone, LineChart,
} from "lucide-react";
import logoDark from "@/assets/NOE3.png";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect, useCallback } from "react";

/* ── Rotating keywords for headline ─────────────────────────── */
const ROTATING_WORDS = [
  "vendas", "leads", "clientes", "resultados", "conversões",
  "oportunidades", "crescimento", "faturamento",
];

const LOADING_PHRASES = [
  "Analisando comportamento do seu mercado...",
  "Mapeando concorrência na sua região...",
  "Identificando oportunidades de aquisição...",
  "Estruturando estratégias de vendas...",
  "Gerando plano inicial de crescimento...",
];

const FLOATING_WORDS = [
  "leads", "ROI", "conversão", "funil", "tráfego", "vendas",
  "escala", "pipeline", "metas", "automação", "WhatsApp",
];

/* ── Word Cloud (loading phase) ──────────────────────────────── */
const WordCloud = () => {
  const [activeIdx, setActiveIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActiveIdx((p) => (p + 1) % FLOATING_WORDS.length), 500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 max-w-lg mx-auto mt-10">
      {FLOATING_WORDS.map((w, i) => (
        <motion.span
          key={w}
          className="text-base font-mono pointer-events-none select-none"
          animate={{
            opacity: i === activeIdx ? 1 : 0.12,
            scale: i === activeIdx ? 1.35 : 1,
            y: i === activeIdx ? -4 : 0,
          }}
          transition={{ duration: 0.25 }}
          style={{ color: i === activeIdx ? "hsl(355,78%,55%)" : "rgba(255,255,255,0.25)" }}
        >
          {w}
        </motion.span>
      ))}
    </div>
  );
};

/* ── Score Ring ──────────────────────────────────────────────── */
const ScoreRing = ({ score }: { score: number }) => {
  const c = 2 * Math.PI * 54;
  const off = c - (score / 100) * c;
  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <motion.circle
          cx="60" cy="60" r="54" fill="none" stroke="hsl(355,78%,55%)" strokeWidth="8"
          strokeLinecap="round" strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: off }}
          transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span className="text-4xl font-black text-white"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
          {score}
        </motion.span>
        <span className="text-xs text-white/30 font-medium">/100</span>
      </div>
    </div>
  );
};

/* ── Main ────────────────────────────────────────────────────── */
type Phase = "form" | "loading" | "result";

const SaasLanding = () => {
  const { user, role } = useAuth();
  const [phase, setPhase] = useState<Phase>("form");
  const [segment, setSegment] = useState("");
  const [region, setRegion] = useState("");
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [wordIdx, setWordIdx] = useState(0);

  // Rotating headline word
  useEffect(() => {
    if (phase !== "form") return;
    const t = setInterval(() => setWordIdx((p) => (p + 1) % ROTATING_WORDS.length), 2000);
    return () => clearInterval(t);
  }, [phase]);

  // Loading phrase rotation
  useEffect(() => {
    if (phase !== "loading") return;
    const t = setInterval(() => setPhraseIdx((p) => (p + 1) % LOADING_PHRASES.length), 1000);
    return () => clearInterval(t);
  }, [phase]);

  // Auto-transition
  useEffect(() => {
    if (phase !== "loading") return;
    const t = setTimeout(() => setPhase("result"), 4000);
    return () => clearTimeout(t);
  }, [phase]);

  const handleSubmit = useCallback(() => {
    if (!segment.trim() || !region.trim()) return;
    setPhase("loading");
  }, [segment, region]);

  if (user) {
    const dest = role === "super_admin" || role === "admin"
      ? "/franqueadora/inicio"
      : role === "franqueado"
      ? "/franqueado/inicio"
      : "/cliente/inicio";
    return <Navigate to={dest} replace />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
        style={{ background: "rgba(10,10,15,0.85)", backdropFilter: "blur(16px)" }}>
        <img src={logoDark} alt="NoExcuse" className="h-7" />
        <Link to="/auth">
          <Button size="sm" className="bg-[hsl(355,78%,50%)] hover:bg-[hsl(355,78%,45%)] text-white font-semibold px-5">
            Começar
          </Button>
        </Link>
      </nav>

      <AnimatePresence mode="wait">
        {/* ══════════════════════════════════════════════════════════
            🔴 SEÇÃO 1 — HERO + SEARCH
           ══════════════════════════════════════════════════════════ */}
        {phase === "form" && (
          <motion.section
            key="hero"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen flex flex-col items-center justify-center px-4 pt-16"
          >
            {/* Headline with rotating word */}
            <motion.h1
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-center max-w-4xl leading-[1.1] tracking-tight"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
            >
              Descubra onde sua empresa{" "}
              <br className="hidden sm:block" />
              está perdendo{" "}
              <span className="inline-block relative">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={wordIdx}
                    className="inline-block text-[hsl(355,78%,55%)]"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.35 }}
                  >
                    {ROTATING_WORDS[wordIdx]}
                  </motion.span>
                </AnimatePresence>
              </span>
            </motion.h1>

            <motion.p
              className="text-white/40 text-center mt-5 max-w-xl text-sm sm:text-base"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Veja estratégias reais de marketing, vendas e gestão para o seu segmento — com base na sua região
            </motion.p>

            {/* Search bar — Google/AnswerThePublic style */}
            <motion.div
              className="mt-10 w-full max-w-2xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="rounded-full border border-white/10 bg-white/[0.04] p-1.5 flex items-center gap-2 shadow-2xl shadow-black/30">
                <div className="flex items-center gap-3 flex-1 pl-4">
                  <Search className="w-5 h-5 text-white/30 shrink-0" />
                  <input
                    type="text"
                    placeholder="Segmento da empresa (ex: Odontologia, Advocacia...)"
                    value={segment}
                    onChange={(e) => setSegment(e.target.value)}
                    className="flex-1 bg-transparent text-white text-sm sm:text-base placeholder:text-white/25 focus:outline-none py-3"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Região"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="hidden sm:block w-36 bg-transparent text-white text-sm placeholder:text-white/25 focus:outline-none border-l border-white/10 pl-3 py-3"
                />
                <Button
                  onClick={handleSubmit}
                  disabled={!segment.trim() || !region.trim()}
                  className="rounded-full h-10 sm:h-11 px-5 sm:px-6 bg-[hsl(355,78%,50%)] hover:bg-[hsl(355,78%,45%)] text-white font-bold text-sm shrink-0"
                >
                  <Sparkles className="w-4 h-4 mr-1.5" />
                  Gerar análise
                </Button>
              </div>

              {/* Mobile region field */}
              <div className="sm:hidden mt-3">
                <div className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 flex items-center">
                  <input
                    type="text"
                    placeholder="Região *"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="flex-1 bg-transparent text-white text-sm placeholder:text-white/25 focus:outline-none"
                  />
                </div>
              </div>

              <p className="text-center text-white/20 text-xs mt-4">
                Diagnóstico gratuito · Acesso parcial ao plano de crescimento
              </p>
            </motion.div>
          </motion.section>
        )}

        {/* ══════════════════════════════════════════════════════════
            🟠 SEÇÃO 2 — LOADING / IA PROCESSING
           ══════════════════════════════════════════════════════════ */}
        {phase === "loading" && (
          <motion.section
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="min-h-screen flex flex-col items-center justify-center px-4"
          >
            {/* Spinner */}
            <div className="relative w-20 h-20 mb-10">
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-transparent"
                style={{ borderTopColor: "hsl(355,78%,55%)", borderRightColor: "hsl(355,78%,35%)" }}
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              />
              <div className="absolute inset-2 rounded-full bg-[#0a0a0f] flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-[hsl(355,78%,55%)]" />
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.p
                key={phraseIdx}
                className="text-lg sm:text-xl font-medium text-white/60 text-center"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
              >
                {LOADING_PHRASES[phraseIdx]}
              </motion.p>
            </AnimatePresence>

            <WordCloud />
          </motion.section>
        )}

        {/* ══════════════════════════════════════════════════════════
            SEÇÕES 3–10 — RESULTADO
           ══════════════════════════════════════════════════════════ */}
        {phase === "result" && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* ── 🔵 3. RESULTADO — ESTRATÉGIA INICIAL ── */}
            <section className="pt-28 pb-16 px-4 text-center">
              <motion.p className="text-xs font-bold uppercase tracking-[0.2em] text-[hsl(355,78%,55%)] mb-3"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                Análise concluída
              </motion.p>
              <motion.h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-10"
                initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                Estratégias iniciais para o seu segmento
              </motion.h2>

              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
                <ScoreRing score={42} />
                <p className="text-white/30 text-sm mt-3">Potencial de crescimento atual</p>
              </motion.div>
            </section>

            {/* Cards */}
            <section className="max-w-5xl mx-auto px-4 pb-20">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {([
                  { title: "Marketing", icon: Target, items: [
                    "Sua região exige presença em canais de alta intenção",
                    "Seu segmento depende de aquisição contínua",
                    "Concorrentes utilizam tráfego pago ativo",
                  ]},
                  { title: "Vendas", icon: TrendingUp, items: [
                    "Leads não estão sendo acompanhados corretamente",
                    "Falta de pipeline estruturado",
                    "Conversão abaixo do potencial",
                  ]},
                  { title: "Gestão", icon: BarChart3, items: [
                    "Sem metas claras por equipe",
                    "Falta de indicadores de desempenho",
                    "Crescimento sem previsibilidade",
                  ]},
                  { title: "Aquisição", icon: ShoppingCart, items: [
                    "Dependência de poucos canais",
                    "Baixa escala de entrada de leads",
                    "Oportunidades não exploradas",
                  ]},
                ] as const).map((card, ci) => (
                  <motion.div
                    key={card.title}
                    className="rounded-2xl p-5 border border-white/[0.06] bg-white/[0.02]"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + ci * 0.12 }}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <card.icon className="w-5 h-5 text-[hsl(355,78%,55%)]" />
                      <h3 className="font-bold">{card.title}</h3>
                    </div>
                    <ul className="space-y-2">
                      {card.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-[13px] text-white/50">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[hsl(355,78%,55%)] shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* ── 🟣 4. DIRECIONAMENTO ── */}
            <section className="max-w-3xl mx-auto px-4 pb-20">
              <h3 className="text-xl sm:text-2xl font-black text-center mb-8">
                O que sua empresa deveria estar <span className="text-[hsl(355,78%,55%)]">executando agora</span>
              </h3>
              <div className="space-y-3">
                {[
                  "Campanhas segmentadas por intenção de compra",
                  "Estrutura de funil com captação e nutrição",
                  "Processo comercial com acompanhamento ativo",
                  "Definição de metas por equipe",
                  "Acompanhamento de indicadores em tempo real",
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.05]"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1 + i * 0.1 }}
                  >
                    <CheckCircle2 className="w-5 h-5 text-[hsl(355,78%,55%)] shrink-0" />
                    <span className="text-sm text-white/60">{item}</span>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* ── 🔒 5. BLOQUEIO ── */}
            <section className="max-w-3xl mx-auto px-4 pb-20">
              <div className="relative rounded-2xl border border-white/[0.06] overflow-hidden">
                {/* Blur overlay */}
                <div className="absolute inset-0 backdrop-blur-md bg-[#0a0a0f]/80 z-10 flex flex-col items-center justify-center p-8">
                  <Lock className="w-8 h-8 text-[hsl(355,78%,55%)] mb-4" />
                  <h4 className="font-bold text-lg mb-1 text-center">Plano completo de crescimento e operação</h4>
                  <p className="text-white/30 text-sm mb-6 text-center max-w-sm">
                    Desbloqueie 11 estratégias avançadas e o sistema completo de gestão
                  </p>
                  <Link to="/auth">
                    <Button className="bg-[hsl(355,78%,50%)] hover:bg-[hsl(355,78%,45%)] text-white font-bold px-6 h-11">
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Desbloquear estratégia completa
                    </Button>
                  </Link>
                </div>
                {/* Blurred content behind */}
                <div className="p-6 space-y-2 select-none" aria-hidden>
                  {[
                    "Estratégia completa de marketing por canal",
                    "Planejamento de conteúdo para redes sociais",
                    "Calendário de posts automatizado",
                    "Funil completo de vendas",
                    "Pipeline comercial estruturado",
                    "Automação de follow-up (WhatsApp)",
                    "Metas por equipe",
                    "Tarefas organizadas por time",
                    "Dashboard com indicadores reais",
                    "Projeção de crescimento",
                    "Agentes de IA executando otimizações",
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-white/30 py-1.5">
                      <Lock className="w-4 h-4 shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ── 🟢 6. SISTEMA ── */}
            <section className="py-20 px-4 bg-white/[0.01]">
              <div className="max-w-5xl mx-auto">
                <h2 className="text-2xl sm:text-3xl font-black text-center mb-2">
                  Um sistema que organiza, executa e acompanha{" "}
                  <span className="text-[hsl(355,78%,55%)]">o crescimento</span> da sua empresa
                </h2>
                <p className="text-white/30 text-center mb-14 max-w-lg mx-auto text-sm">
                  Você não precisa de mais ferramentas separadas. Precisa de um sistema que conecta tudo.
                </p>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { icon: Target, title: "Marketing", items: ["Planejamento estratégico", "Conteúdo para redes sociais", "Criativos e campanhas"] },
                    { icon: TrendingUp, title: "Vendas", items: ["CRM completo", "Pipeline estruturado", "Gestão de leads"] },
                    { icon: BarChart3, title: "Gestão", items: ["Metas por equipe", "Indicadores em tempo real", "Previsibilidade de resultados"] },
                    { icon: Rocket, title: "Execução", items: ["Tarefas organizadas", "Fluxos de trabalho", "Gestão de times"] },
                    { icon: Bot, title: "IA", items: ["Estratégias automáticas", "Sugestões diárias", "Otimizações contínuas"] },
                    { icon: MessageSquare, title: "Integração", items: ["WhatsApp", "Automação de mensagens", "Centralização do atendimento"] },
                  ].map((block) => (
                    <div key={block.title}
                      className="rounded-2xl p-5 border border-white/[0.06] bg-white/[0.02] hover:-translate-y-1 transition-transform duration-300">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-[hsl(355,78%,50%)]/10 flex items-center justify-center">
                          <block.icon className="w-4 h-4 text-[hsl(355,78%,55%)]" />
                        </div>
                        <h4 className="font-bold">{block.title}</h4>
                      </div>
                      <ul className="space-y-1.5">
                        {block.items.map((item) => (
                          <li key={item} className="text-sm text-white/40 flex items-center gap-2">
                            <span className="w-1 h-1 rounded-full bg-[hsl(355,78%,55%)]" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ── 🟡 7. COMO FUNCIONA ── */}
            <section className="py-20 px-4">
              <div className="max-w-3xl mx-auto">
                <h2 className="text-2xl font-black text-center mb-14">Como funciona</h2>
                <div className="grid md:grid-cols-3 gap-10">
                  {[
                    { num: "01", icon: Compass, text: "A IA analisa seu segmento e região" },
                    { num: "02", icon: BrainCircuit, text: "O sistema gera estratégias completas de marketing, vendas e gestão" },
                    { num: "03", icon: Rocket, text: "Você executa e acompanha tudo com controle" },
                  ].map((step) => (
                    <div key={step.num} className="text-center">
                      <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center bg-[hsl(355,78%,50%)]/10">
                        <step.icon className="w-6 h-6 text-[hsl(355,78%,55%)]" />
                      </div>
                      <p className="text-xs font-bold text-white/25 uppercase tracking-wider mb-1">Passo {step.num}</p>
                      <p className="font-semibold text-sm text-white/70">{step.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ── 🔵 8. PROVA ── */}
            <section className="py-16 px-4 bg-white/[0.01]">
              <div className="max-w-3xl mx-auto grid grid-cols-3 gap-4 text-center">
                {[
                  { value: "+3.842", label: "empresas analisadas" },
                  { value: "+27.000", label: "oportunidades identificadas" },
                  { value: "+63%", label: "média de melhoria potencial" },
                ].map((s) => (
                  <div key={s.label}>
                    <p className="text-2xl sm:text-3xl font-black text-[hsl(355,78%,55%)]">{s.value}</p>
                    <p className="text-xs text-white/30 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* ── 🔴 9. REFORÇO DE DOR ── */}
            <section className="py-20 px-4 text-center">
              <h2 className="text-2xl sm:text-3xl font-black max-w-lg mx-auto leading-tight">
                Se você não mede, você <span className="text-[hsl(355,78%,55%)]">não cresce</span>
              </h2>
              <p className="text-white/35 mt-5 max-w-md mx-auto text-sm leading-relaxed">
                A maioria das empresas não falha por falta de esforço.
                <br />Falha por falta de controle.
              </p>
              <p className="text-white/25 mt-3 max-w-sm mx-auto text-xs">
                Sem processo, metas e acompanhamento, o crescimento vira tentativa.
              </p>
            </section>

            {/* ── 🟣 10. CTA FINAL ── */}
            <section className="py-20 px-4 text-center">
              <h2 className="text-xl sm:text-2xl font-black mb-2">
                Tenha clareza, execução e controle do seu crescimento
              </h2>
              <p className="text-white/30 text-sm mb-8">
                Comece agora e veja o plano completo para a sua empresa.
              </p>
              <Link to="/auth">
                <Button className="h-12 px-8 text-base font-bold bg-[hsl(355,78%,50%)] hover:bg-[hsl(355,78%,45%)] text-white rounded-full">
                  Criar conta e ver plano completo
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </section>

            {/* Footer */}
            <footer className="py-8 text-center border-t border-white/[0.05]">
              <img src={logoDark} alt="NoExcuse" className="h-6 mx-auto mb-3 opacity-30" />
              <div className="flex items-center justify-center gap-3 mb-2 text-xs text-white/50">
                <Link to="/privacidade" className="underline hover:text-white/80 transition-colors">Política de Privacidade</Link>
                <span>•</span>
                <Link to="/termos" className="underline hover:text-white/80 transition-colors">Termos de Uso</Link>
              </div>
              <p className="text-xs text-white/15">© {new Date().getFullYear()} NoExcuse. Todos os direitos reservados.</p>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SaasLanding;
