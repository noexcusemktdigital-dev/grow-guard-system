// @ts-nocheck
import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { UNIFIED_PLANS } from "@/constants/plans";
import {
  Check, Sparkles, Zap, BarChart3, MessageSquare, Bot, Target, ArrowRight,
  Lock, ChevronDown, Layers, Megaphone, Shield, TrendingUp, Users, Clock,
  Star, PlayCircle, Globe
} from "lucide-react";
import logoDark from "@/assets/NOE3.png";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

/* ── Data ─────────────────────────────────────────────────────── */

const HERO_FEATURES = [
  { icon: Zap, label: "CRM inteligente com a nossa IA" },
  { icon: MessageSquare, label: "WhatsApp integrado" },
  { icon: Bot, label: "Agentes de IA 24/7" },
  { icon: BarChart3, label: "Relatórios em tempo real" },
  { icon: Target, label: "Automação de vendas" },
];

const STEPS = [
  { num: "01", title: "Cadastre-se em segundos", desc: "Crie sua conta grátis e comece a usar em menos de 2 minutos. Sem cartão de crédito.", icon: PlayCircle },
  { num: "02", title: "Configure sua operação", desc: "Importe leads, conecte seu WhatsApp e ative o agente de IA para atender 24/7.", icon: Layers },
  { num: "03", title: "Venda no piloto automático", desc: "Acompanhe funis, dispare campanhas e deixe a IA qualificar seus leads.", icon: TrendingUp },
];

const FEATURES = [
  { icon: Target, title: "CRM Inteligente", desc: "Funis visuais, drag-and-drop, automações e qualificação de leads com IA." },
  { icon: MessageSquare, title: "WhatsApp Integrado", desc: "Atenda pelo WhatsApp direto no CRM. Histórico, etiquetas e respostas rápidas." },
  { icon: Bot, title: "Agentes de IA", desc: "Robôs treinados que atendem, qualificam e agendam reuniões 24 horas por dia." },
  { icon: Megaphone, title: "Marketing Completo", desc: "Crie artes, conteúdos, sites e estratégias com inteligência artificial." },
  { icon: Layers, title: "Automação de Vendas", desc: "Disparos em massa, follow-ups automáticos e scripts gerados por IA." },
  { icon: BarChart3, title: "Relatórios Avançados", desc: "Dashboards em tempo real com métricas comerciais e de marketing." },
  { icon: Globe, title: "Sites & Landing Pages", desc: "Crie sites otimizados para conversão com IA em poucos cliques." },
  { icon: Shield, title: "Seguro & Escalável", desc: "Infraestrutura robusta com criptografia, backups e uptime de 99.9%." },
];

const STATS = [
  { value: "500+", label: "Empresas ativas" },
  { value: "10M+", label: "Leads gerenciados" },
  { value: "2M+", label: "Mensagens enviadas" },
  { value: "99.9%", label: "Uptime garantido" },
];

const TESTIMONIALS = [
  { name: "Carlos M.", role: "CEO, Agência Digital", text: "Triplicamos nossas vendas em 3 meses. O agente de IA atende nossos leads enquanto dormimos.", stars: 5 },
  { name: "Ana Paula R.", role: "Diretora Comercial", text: "O CRM mais intuitivo que já usei. A integração com WhatsApp mudou completamente nosso processo.", stars: 5 },
  { name: "Ricardo S.", role: "Fundador, StartupX", text: "Saímos de planilhas para um sistema completo em um dia. O ROI foi imediato.", stars: 5 },
];

const FAQ = [
  { q: "Preciso de cartão de crédito para começar?", a: "Não! O trial de 7 dias é 100% gratuito e inclui 200 créditos para você testar todas as funcionalidades." },
  { q: "O que são créditos?", a: "Créditos são a moeda interna da plataforma. Cada ação de IA (gerar conteúdo, arte, resposta do agente) consome créditos. Você pode comprar pacotes extras a qualquer momento." },
  { q: "Posso integrar com meu WhatsApp?", a: "Sim! Nos planos Pro e Enterprise, você conecta seu WhatsApp Business e atende direto pelo CRM com histórico completo." },
  { q: "Quantos usuários posso ter?", a: "Depende do plano: Starter (10), Pro (20) e Enterprise (ilimitados). Usuários adicionais custam R$ 29/mês cada." },
  { q: "Posso cancelar a qualquer momento?", a: "Sim, sem multa e sem burocracia. Você pode cancelar diretamente nas configurações da sua conta." },
  { q: "Como funciona o agente de IA?", a: "Você configura o perfil, tom de voz e conhecimento do agente. Ele responde automaticamente pelo WhatsApp, qualifica leads e agenda reuniões." },
];

/* ── Animation helpers ────────────────────────────────────────── */

const fadeUp = {
  hidden: { opacity: 0, y: 30 } as const,
  visible: (i: number = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

/* ── Component ────────────────────────────────────────────────── */

const SaasLanding = () => {
  const { user, role } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Redirect authenticated users
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
        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[hsl(355,78%,50%)]/10 rounded-full blur-[120px] pointer-events-none" />

        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(355,78%,50%)]/10 border border-[hsl(355,78%,50%)]/20 mb-8">
          <Sparkles className="h-4 w-4 text-[hsl(355,78%,50%)]" />
          <span className="text-sm font-medium text-[hsl(355,78%,60%)]">7 dias grátis · 200 créditos · Sem cartão</span>
        </motion.div>

        <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={1}
          className="text-4xl sm:text-5xl lg:text-7xl font-black uppercase italic tracking-tighter leading-[0.95] mb-6">
          Venda mais.<br />
          <span className="text-[hsl(355,78%,50%)]">Sem desculpas.</span>
        </motion.h1>

        <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2}
          className="text-lg lg:text-xl text-white/50 max-w-2xl mx-auto mb-10">
          CRM, automação de vendas, WhatsApp, agentes de IA e marketing digital — tudo em uma plataforma para acelerar seus resultados comerciais.
        </motion.p>

        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3}
          className="flex flex-wrap justify-center gap-3 mb-12">
          {HERO_FEATURES.map((f) => (
            <div key={f.label} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10">
              <f.icon className="h-4 w-4 text-[hsl(355,78%,55%)]" />
              <span className="text-sm text-white/70">{f.label}</span>
            </div>
          ))}
        </motion.div>

        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={4}>
          <Link to="/app">
            <Button size="lg" className="bg-[hsl(355,78%,50%)] hover:bg-[hsl(355,78%,45%)] text-white text-lg px-10 py-6 h-auto shadow-lg shadow-[hsl(355,78%,50%)]/25">
              Criar conta grátis <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <p className="mt-4 text-xs text-white/30">Teste grátis por 7 dias · Cancele quando quiser</p>
        </motion.div>
      </section>

      {/* ── Social Proof Numbers ─────────────────────────────── */}
      <section className="border-y border-white/5 bg-white/[0.01]">
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

      {/* ── Como funciona ────────────────────────────────────── */}
      <section className="px-6 lg:px-16 py-20 lg:py-28 max-w-6xl mx-auto">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
          className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold mb-3">Como funciona</h2>
          <p className="text-white/50 max-w-lg mx-auto">Comece a vender mais em 3 passos simples</p>
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
      </section>

      {/* ── Features Grid ────────────────────────────────────── */}
      <section className="px-6 lg:px-16 py-20 lg:py-28 bg-white/[0.01]">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-3">Tudo que você precisa para vender mais</h2>
            <p className="text-white/50 max-w-lg mx-auto">Uma plataforma completa de vendas e marketing com inteligência artificial</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className="rounded-2xl p-6 border border-white/10 bg-white/[0.02] hover:border-[hsl(355,78%,50%)]/20 transition-colors group">
                <div className="inline-flex items-center justify-center w-11 h-11 rounded-lg bg-[hsl(355,78%,50%)]/10 mb-4 group-hover:bg-[hsl(355,78%,50%)]/20 transition-colors">
                  <f.icon className="h-5 w-5 text-[hsl(355,78%,55%)]" />
                </div>
                <h3 className="text-base font-bold mb-1.5">{f.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────── */}
      <section className="px-6 lg:px-16 py-20 lg:py-28 max-w-6xl mx-auto">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
          className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold mb-3">O que nossos clientes dizem</h2>
          <p className="text-white/50 max-w-lg mx-auto">Resultados reais de empresas que confiam na NoExcuse</p>
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
      </section>

      {/* ── Pricing ──────────────────────────────────────────── */}
      <section className="px-6 lg:px-16 py-20 lg:py-28 bg-white/[0.01]" id="pricing">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-bold mb-3">Planos que cabem no seu bolso</h2>
            <p className="text-white/50">Vendas + Marketing unificados. Tudo baseado em créditos.</p>
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
            Pronto para vender<br /><span className="text-[hsl(355,78%,50%)]">sem desculpas?</span>
          </h2>
          <p className="text-white/50 max-w-lg mx-auto mb-8 relative z-10">
            Junte-se a centenas de empresas que já transformaram seus resultados comerciais com a NoExcuse.
          </p>
          <Link to="/app" className="relative z-10">
            <Button size="lg" className="bg-[hsl(355,78%,50%)] hover:bg-[hsl(355,78%,45%)] text-white text-lg px-10 py-6 h-auto shadow-lg shadow-[hsl(355,78%,50%)]/25">
              Começar meu trial grátis <ArrowRight className="ml-2 h-5 w-5" />
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
