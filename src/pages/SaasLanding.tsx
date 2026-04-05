import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sparkles, ArrowRight, Lock, CheckCircle2,
  Target, TrendingUp, Users, BarChart3, Bot,
  Rocket, BrainCircuit, Compass, Zap, MessageSquare,
} from "lucide-react";
import logoDark from "@/assets/NOE3.png";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect, useCallback, useRef } from "react";

/* ── Colors ──────────────────────────────────────────────────── */
const BG = "#000017";
const BLUE = "#3582F5";
const ORANGE = "#F8931F";

/* ── Constants ──────────────────────────────────────────────── */
const LOADING_PHRASES = [
  "Analisando comportamento do mercado...",
  "Mapeando concorrência...",
  "Identificando oportunidades...",
  "Estruturando estratégias...",
  "Gerando plano inicial...",
];

const FLOATING_WORDS = [
  "leads", "ROI", "conversão", "funil", "tráfego", "vendas",
  "escala", "pipeline", "metas", "automação", "WhatsApp",
];

const SYSTEM_BLOCKS = [
  { icon: Target, title: "Marketing", items: ["Conteúdo automático", "Tráfego", "Criativos"] },
  { icon: TrendingUp, title: "Vendas", items: ["CRM", "Pipeline", "Leads"] },
  { icon: BarChart3, title: "Gestão", items: ["Metas", "Indicadores", "Controle"] },
  { icon: Rocket, title: "Execução", items: ["Tarefas", "Times", "Fluxos"] },
  { icon: Bot, title: "IA", items: ["Estratégia automática", "Sugestões", "Otimizações"] },
  { icon: MessageSquare, title: "Integração", items: ["WhatsApp", "Comunicação", "Automação"] },
];

/* ── Animated Word Cloud ─────────────────────────────────────── */
const WordCloud = () => {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % FLOATING_WORDS.length);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-wrap justify-center gap-3 max-w-md mx-auto mt-8">
      {FLOATING_WORDS.map((word, i) => (
        <motion.span
          key={word}
          className="text-lg font-mono pointer-events-none select-none"
          animate={{
            opacity: i === activeIdx ? 1 : 0.15,
            scale: i === activeIdx ? 1.3 : 1,
            y: i === activeIdx ? -6 : 0,
          }}
          transition={{ duration: 0.3 }}
          style={{ color: i === activeIdx ? ORANGE : "rgba(255,255,255,0.3)" }}
        >
          {word}
        </motion.span>
      ))}
    </div>
  );
};

/* ── Score Ring ──────────────────────────────────────────────── */
const ScoreRing = ({ score }: { score: number }) => {
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
        <motion.circle
          cx="60" cy="60" r="54" fill="none" stroke={BLUE} strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-4xl font-black"
          style={{ color: BLUE }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {score}
        </motion.span>
        <span className="text-xs text-white/40 font-medium">/100</span>
      </div>
    </div>
  );
};

/* ── Main Component ─────────────────────────────────────────── */
type Phase = "form" | "loading" | "result";

const SaasLanding = () => {
  const { isAuthenticated } = useAuth();
  const [phase, setPhase] = useState<Phase>("form");
  const [segment, setSegment] = useState("");
  const [region, setRegion] = useState("");
  const [channel, setChannel] = useState("");
  const [site, setSite] = useState("");
  const [phraseIdx, setPhraseIdx] = useState(0);

  // Loading phrase rotation
  useEffect(() => {
    if (phase !== "loading") return;
    const interval = setInterval(() => {
      setPhraseIdx((p) => (p + 1) % LOADING_PHRASES.length);
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  // Auto-transition loading → result
  useEffect(() => {
    if (phase !== "loading") return;
    const timer = setTimeout(() => setPhase("result"), 3000);
    return () => clearTimeout(timer);
  }, [phase]);

  const handleSubmit = useCallback(() => {
    if (!segment.trim() || !region.trim()) return;
    setPhase("loading");
  }, [segment, region]);

  if (isAuthenticated) return <Navigate to="/redirect" replace />;

  return (
    <div className="min-h-screen" style={{ background: BG, color: "#fff" }}>
      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
        style={{ background: `${BG}ee`, backdropFilter: "blur(12px)" }}>
        <img src={logoDark} alt="NoExcuse" className="h-8" />
        <Link to="/auth">
          <Button size="sm" className="text-white font-semibold px-5" style={{ background: BLUE }}>
            Entrar
          </Button>
        </Link>
      </nav>

      {/* ── HERO / FORM ── */}
      <AnimatePresence mode="wait">
        {phase === "form" && (
          <motion.section
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.4 }}
            className="min-h-screen flex flex-col items-center justify-center px-4 pt-20"
          >
            <motion.h1
              className="text-3xl sm:text-4xl md:text-5xl font-black text-center max-w-3xl leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              Descubra onde sua empresa está{" "}
              <span style={{ color: ORANGE }}>perdendo vendas</span>{" "}
              em menos de 60 segundos
            </motion.h1>

            <motion.p
              className="text-white/50 text-center mt-4 max-w-xl text-sm sm:text-base"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Veja estratégias reais de marketing, vendas e gestão para o seu segmento com base na sua região
            </motion.p>

            <motion.div
              className="mt-10 w-full max-w-md space-y-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Input
                placeholder="Segmento da empresa *"
                value={segment}
                onChange={(e) => setSegment(e.target.value)}
                className="h-12 text-base border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-1"
                style={{ borderColor: "rgba(255,255,255,0.1)" }}
              />
              <Input
                placeholder="Região *"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="h-12 text-base border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-1"
                style={{ borderColor: "rgba(255,255,255,0.1)" }}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Canal principal"
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  className="h-12 text-base border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-1"
                  style={{ borderColor: "rgba(255,255,255,0.1)" }}
                />
                <Input
                  placeholder="Site (opcional)"
                  value={site}
                  onChange={(e) => setSite(e.target.value)}
                  className="h-12 text-base border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-1"
                  style={{ borderColor: "rgba(255,255,255,0.1)" }}
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!segment.trim() || !region.trim()}
                className="w-full h-12 text-base font-bold text-white mt-2"
                style={{ background: `linear-gradient(135deg, ${BLUE}, ${ORANGE})` }}
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Gerar análise estratégica
              </Button>
              <p className="text-center text-white/30 text-xs">
                Diagnóstico gratuito · Acesso parcial ao plano de crescimento
              </p>
            </motion.div>
          </motion.section>
        )}

        {/* ── LOADING ── */}
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
            <div className="relative w-20 h-20 mb-8">
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-transparent"
                style={{ borderTopColor: BLUE, borderRightColor: ORANGE }}
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              />
              <div className="absolute inset-2 rounded-full flex items-center justify-center"
                style={{ background: BG }}>
                <Sparkles className="w-6 h-6" style={{ color: BLUE }} />
              </div>
            </div>

            {/* Phrase */}
            <AnimatePresence mode="wait">
              <motion.p
                key={phraseIdx}
                className="text-lg font-medium text-white/70 text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {LOADING_PHRASES[phraseIdx]}
              </motion.p>
            </AnimatePresence>

            {/* Word Cloud */}
            <WordCloud />
          </motion.section>
        )}

        {/* ── RESULT ── */}
        {phase === "result" && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Result Hero */}
            <section className="pt-28 pb-16 px-4 text-center">
              <motion.p className="text-sm font-semibold uppercase tracking-widest mb-2"
                style={{ color: BLUE }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                Análise concluída
              </motion.p>
              <motion.h2 className="text-2xl sm:text-3xl font-black mb-8"
                initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                Estratégias iniciais para o seu segmento
              </motion.h2>

              {/* Score */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <ScoreRing score={42} />
                <p className="text-white/40 text-sm mt-3">Potencial de crescimento</p>
              </motion.div>
            </section>

            {/* Analysis Cards */}
            <section className="max-w-5xl mx-auto px-4 pb-16">
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  {
                    title: "Marketing", icon: Target, color: BLUE,
                    items: [
                      "Sua região exige presença em canais de alta intenção",
                      "Seu segmento depende de aquisição contínua",
                      "Concorrentes utilizam tráfego pago ativo",
                    ],
                  },
                  {
                    title: "Vendas", icon: TrendingUp, color: ORANGE,
                    items: [
                      "Leads não estão sendo acompanhados corretamente",
                      "Falta de pipeline estruturado",
                      "Conversão abaixo do potencial",
                    ],
                  },
                  {
                    title: "Gestão", icon: BarChart3, color: "#22c55e",
                    items: [
                      "Sem metas claras por equipe",
                      "Falta de indicadores",
                      "Crescimento sem previsibilidade",
                    ],
                  },
                ].map((card, ci) => (
                  <motion.div
                    key={card.title}
                    className="rounded-2xl p-5 border"
                    style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + ci * 0.15 }}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <card.icon className="w-5 h-5" style={{ color: card.color }} />
                      <h3 className="font-bold text-lg">{card.title}</h3>
                    </div>
                    <ul className="space-y-2">
                      {card.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-white/60">
                          <span className="mt-1 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: card.color }} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* What you should be doing */}
            <section className="max-w-3xl mx-auto px-4 pb-16">
              <motion.h3 className="text-xl font-bold text-center mb-6"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
                O que você deveria estar fazendo agora
              </motion.h3>
              <div className="space-y-3">
                {[
                  "Campanhas segmentadas por intenção",
                  "Funil estruturado",
                  "Processo comercial ativo",
                  "Metas por equipe",
                  "Acompanhamento de números",
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.03)" }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 + i * 0.1 }}
                  >
                    <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: BLUE }} />
                    <span className="text-sm text-white/70">{item}</span>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Blocked / Gated */}
            <section className="max-w-3xl mx-auto px-4 pb-20">
              <div className="relative rounded-2xl p-8 border overflow-hidden"
                style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                {/* Blur overlay */}
                <div className="absolute inset-0 backdrop-blur-md z-10 flex flex-col items-center justify-center"
                  style={{ background: `${BG}cc` }}>
                  <Lock className="w-8 h-8 mb-3" style={{ color: ORANGE }} />
                  <p className="text-white/60 text-sm mb-4 text-center max-w-xs">
                    Plano completo de crescimento e operação
                  </p>
                  <Link to="/auth">
                    <Button className="font-bold text-white px-6"
                      style={{ background: `linear-gradient(135deg, ${BLUE}, ${ORANGE})` }}>
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Desbloquear estratégia completa
                    </Button>
                  </Link>
                </div>
                {/* Blurred content */}
                <div className="space-y-2 select-none" aria-hidden>
                  {[
                    "Estratégia completa de marketing",
                    "Plano de conteúdo para redes sociais",
                    "Pipeline comercial estruturado",
                    "Automação de follow-up (WhatsApp)",
                    "Metas e tarefas por equipe",
                    "Dashboard de indicadores",
                    "Projeção de crescimento",
                    "Agentes de IA",
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-white/40 p-2">
                      <Lock className="w-4 h-4 shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ── SYSTEM SECTION ── */}
            <section className="py-20 px-4" style={{ background: "rgba(255,255,255,0.02)" }}>
              <div className="max-w-5xl mx-auto">
                <h2 className="text-2xl sm:text-3xl font-black text-center mb-3">
                  Um sistema que conecta{" "}
                  <span style={{ color: BLUE }}>marketing</span>,{" "}
                  <span style={{ color: ORANGE }}>vendas</span> e gestão
                </h2>
                <p className="text-white/40 text-center mb-12 max-w-lg mx-auto text-sm">
                  Você não precisa de mais ferramentas separadas. Precisa de um sistema que conecta tudo.
                </p>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {SYSTEM_BLOCKS.map((block) => (
                    <div
                      key={block.title}
                      className="rounded-2xl p-5 border transition-all duration-300 hover:-translate-y-1"
                      style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <block.icon className="w-5 h-5" style={{ color: BLUE }} />
                        <h4 className="font-bold">{block.title}</h4>
                      </div>
                      <ul className="space-y-1">
                        {block.items.map((item) => (
                          <li key={item} className="text-sm text-white/50 flex items-center gap-2">
                            <span className="w-1 h-1 rounded-full" style={{ background: ORANGE }} />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ── HOW IT WORKS ── */}
            <section className="py-20 px-4">
              <div className="max-w-3xl mx-auto">
                <h2 className="text-2xl font-black text-center mb-12">Como funciona</h2>
                <div className="grid md:grid-cols-3 gap-8">
                  {[
                    { num: "01", icon: Compass, title: "A IA analisa seu negócio" },
                    { num: "02", icon: BrainCircuit, title: "Gera estratégias" },
                    { num: "03", icon: Rocket, title: "Você executa e acompanha" },
                  ].map((step) => (
                    <div key={step.num} className="text-center">
                      <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
                        style={{ background: `${BLUE}15` }}>
                        <step.icon className="w-6 h-6" style={{ color: BLUE }} />
                      </div>
                      <span className="text-xs font-bold text-white/30 uppercase tracking-wider">Passo {step.num}</span>
                      <p className="font-semibold mt-1 text-sm">{step.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ── STATS ── */}
            <section className="py-16 px-4" style={{ background: "rgba(255,255,255,0.02)" }}>
              <div className="max-w-3xl mx-auto grid grid-cols-3 gap-4 text-center">
                {[
                  { value: "+3.842", label: "empresas analisadas" },
                  { value: "+27.000", label: "oportunidades identificadas" },
                  { value: "+63%", label: "média de melhoria" },
                ].map((s) => (
                  <div key={s.label}>
                    <p className="text-2xl sm:text-3xl font-black" style={{ color: BLUE }}>{s.value}</p>
                    <p className="text-xs text-white/40 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* ── PAIN ── */}
            <section className="py-20 px-4 text-center">
              <h2 className="text-2xl sm:text-3xl font-black max-w-lg mx-auto">
                Empresas não quebram por falta de <span style={{ color: ORANGE }}>esforço</span>
              </h2>
              <p className="text-white/40 mt-4 max-w-md mx-auto text-sm">
                Elas quebram por falta de controle. Sem metas, sem acompanhamento e sem processo, não existe crescimento previsível.
              </p>
            </section>

            {/* ── CTA FINAL ── */}
            <section className="py-20 px-4 text-center">
              <h2 className="text-xl sm:text-2xl font-black mb-6">
                Tenha clareza, execução e controle do seu crescimento
              </h2>
              <Link to="/auth">
                <Button className="h-12 px-8 text-base font-bold text-white"
                  style={{ background: `linear-gradient(135deg, ${BLUE}, ${ORANGE})` }}>
                  Criar conta e ver plano completo
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </section>

            {/* Footer */}
            <footer className="py-8 text-center border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <img src={logoDark} alt="NoExcuse" className="h-6 mx-auto mb-3 opacity-40" />
              <p className="text-xs text-white/20">© {new Date().getFullYear()} NoExcuse. Todos os direitos reservados.</p>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SaasLanding;
