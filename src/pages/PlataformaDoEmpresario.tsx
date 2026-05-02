import { useEffect, useRef, useState } from "react";
import { SEOHead } from "@/components/SEOHead";

const SISTEMA_URL = "https://sistema.noexcusedigital.com.br/";
const WHATSAPP_URL = "https://wa.me/5511999999999?text=Quero%20falar%20com%20um%20especialista%20NOEXCUSE";
// Match /crescimento (SaasLanding) visual identity
const RED = "hsl(355,78%,55%)";

const INTER_STACK = "'Inter', system-ui, -apple-system, sans-serif";
// Headlines: Inter 900 italic uppercase tight tracking (matches SaasLanding's font-black tracking-tight)
const fontHead: React.CSSProperties = {
  fontFamily: INTER_STACK,
  fontWeight: 900,
  letterSpacing: "-0.025em",
};
const fontBody: React.CSSProperties = {
  fontFamily: INTER_STACK,
  fontWeight: 400,
  letterSpacing: "-0.011em",
};
const fontMono: React.CSSProperties = {
  fontFamily: INTER_STACK,
  fontWeight: 600,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
};

type Answers = {
  segmento: string;
  cidade: string;
  faturamento: string;
  gargalo: string;
  canais: string[];
  processo: string;
  investimento: string;
  ferramenta: string;
  ia: string;
  nome: string;
  empresa: string;
  email: string;
};

const emptyAnswers: Answers = {
  segmento: "",
  cidade: "",
  faturamento: "",
  gargalo: "",
  canais: [],
  processo: "",
  investimento: "",
  ferramenta: "",
  ia: "",
  nome: "",
  empresa: "",
  email: "",
};

const SEGMENTOS = [
  "Varejo / Comércio",
  "Serviços (clínica, salão, escritório...)",
  "Alimentação / Restaurante",
  "Educação / Cursos",
  "Imóveis / Construtora",
  "Saúde e Bem-estar",
  "Tecnologia / SaaS",
  "Indústria / Atacado",
  "E-commerce",
  "Outro",
];

const FATURAMENTOS = [
  "Até R$ 30 mil",
  "R$ 30 mil a R$ 100 mil",
  "R$ 100 mil a R$ 500 mil",
  "Acima de R$ 500 mil",
];

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("noe-revealed");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

function calcScore(a: Answers): number {
  let s = 25;
  if (a.canais.length >= 3) s += 15;
  else if (a.canais.length === 2) s += 8;
  else if (a.canais.length === 1) s += 3;
  if (a.processo === "✅ Sim, temos um funil estruturado com etapas claras") s += 15;
  else if (a.processo.startsWith("⚠️ Parcialmente")) s += 7;
  if (a.ferramenta.startsWith("CRM básico")) s += 10;
  else if (a.ferramenta === "Nenhuma (controlo na cabeça ou papel)") s -= 5;
  if (a.ia === "Já uso IA com consistência no meu processo") s += 10;
  else if (a.ia === "Uso ChatGPT de forma básica e pontual") s += 4;
  if (a.investimento === "Sim, invisto acima de R$ 3.000/mês") s += 8;
  else if (a.investimento === "Invisto, mas menos de R$ 3.000/mês") s += 3;
  return Math.max(10, Math.min(75, s));
}

function scoreLabel(score: number) {
  if (score < 40) return { text: "⚠️ Gargalos críticos identificados", color: "#FFB020" };
  if (score <= 65) return { text: "📊 Potencial de crescimento moderado", color: "#4DA3FF" };
  return { text: "🚀 Base sólida — hora de escalar", color: "#22C55E" };
}

function recommendedChannel(a: Answers): string {
  if (a.canais.includes("🤝 Indicação e boca a boca") && a.canais.length === 1) return "Tráfego pago segmentado (Meta Ads + Google Ads)";
  if (!a.canais.includes("📱 Tráfego pago (Meta/Google Ads)")) return "Tráfego pago performance (Meta Ads)";
  if (!a.canais.includes("📲 Redes sociais / conteúdo orgânico")) return "Conteúdo orgânico estruturado em Reels";
  return "Mix de aquisição multicanal otimizado";
}

function avgCAC(seg: string): string {
  if (seg.includes("Imóveis")) return "180";
  if (seg.includes("Saúde") || seg.includes("Serviços")) return "65";
  if (seg.includes("E-commerce") || seg.includes("Varejo")) return "42";
  if (seg.includes("Educação")) return "55";
  if (seg.includes("Alimentação")) return "28";
  if (seg.includes("Tecnologia")) return "120";
  return "60";
}

export default function PlataformaDoEmpresario() {
  useReveal();
  const [scrolled, setScrolled] = useState(false);
  const [answers, setAnswers] = useState<Answers>(emptyAnswers);
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [lockedFront, setLockedFront] = useState<null | { title: string; bullets: string[] }>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const open = modalOpen || !!lockedFront;
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [modalOpen, lockedFront]);

  useEffect(() => {
    if (!showResult) return;
    const els = document.querySelectorAll<HTMLElement>("[data-reveal]:not(.noe-revealed)");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("noe-revealed");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [showResult]);

  function startDiagnosis() {
    if (!answers.segmento || !answers.cidade.trim() || !answers.faturamento) {
      alert("Preencha os 3 campos para começar.");
      return;
    }
    setStep(0);
    setModalOpen(true);
  }

  function nextStep() {
    if (step < 6) setStep(step + 1);
    else finishDiagnosis();
  }

  function finishDiagnosis() {
    if (!answers.nome.trim() || !answers.empresa.trim() || !answers.email.trim()) {
      alert("Preencha nome, empresa e e-mail.");
      return;
    }
    setModalOpen(false);
    setShowResult(true);
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  }

  function scrollToHero() {
    heroRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const score = calcScore(answers);
  const sLabel = scoreLabel(score);
  const channel = recommendedChannel(answers);
  const cac = avgCAC(answers.segmento);

  const fronts = [
    {
      icon: "📣",
      title: "Estratégia de Aquisição de Clientes",
      badge: answers.canais.length <= 1 ? { text: "PRIORIDADE ALTA", color: RED } : { text: "OPORTUNIDADE", color: "#4DA3FF" },
      visible: `Com base no seu segmento (${answers.segmento || "—"}) e localização (${answers.cidade || "—"}), identificamos que o canal de maior potencial para sua empresa é ${channel}. O custo de aquisição médio no seu segmento é de R$${cac} por lead qualificado.`,
      blurred: "Campanhas específicas para o seu nicho · Segmentação granular por interesses e comportamento · Budget recomendado mês a mês · Copies e criativos prontos para Meta e Google · Configuração de pixel e eventos de conversão · Otimização semanal automatizada por IA.",
      cta: "Ver estratégia completa de aquisição",
      bullets: [
        "Plano de mídia detalhado para Meta + Google",
        "Públicos, criativos e budget calculados pela IA",
        "Acompanhamento de CAC e ROAS em tempo real",
      ],
    },
    {
      icon: "💸",
      title: "Funil de Vendas e Conversão",
      badge: answers.processo.startsWith("Não") || answers.processo.startsWith("Sou eu") ? { text: "PRIORIDADE ALTA", color: RED } : { text: "OTIMIZAÇÃO", color: "#FFB020" },
      visible: `Seu processo de vendas atual tem lacunas em ${answers.processo.startsWith("Não") ? "estruturação de etapas e cadência" : "padronização e follow-up"}. Empresas do seu segmento com funil estruturado convertem em média 3x mais leads em clientes.`,
      blurred: "Etapas do funil mapeadas · Scripts de abordagem por etapa · Objeções e respostas mapeadas · Cadência de follow-up automática · Métricas de conversão por etapa · Automação de tarefas comerciais.",
      cta: "Ver meu funil de vendas",
      bullets: [
        "Funil Kanban pronto, customizado para seu negócio",
        "Scripts de vendas gerados pela IA",
        "Automação de follow-up integrada ao WhatsApp",
      ],
    },
    {
      icon: "🔍",
      title: "Análise de Concorrência Digital",
      badge: { text: "INTELIGÊNCIA COMPETITIVA", color: "#A855F7" },
      visible: `Mapeamos o cenário digital de ${answers.segmento || "seu segmento"} em ${answers.cidade || "sua região"}. Existem oportunidades não exploradas pelos seus concorrentes que podem ser capturadas nos próximos 30 dias.`,
      blurred: "Análise detalhada dos top 5 concorrentes · Lacunas de posicionamento identificadas · Palavras-chave que eles ignoram · Estratégia de conteúdo deles · Pontos fracos exploráveis · Movimentos recomendados.",
      cta: "Ver análise de concorrência",
      bullets: [
        "Radar competitivo atualizado mensalmente",
        "Alertas de movimentos da concorrência",
        "Oportunidades de posicionamento exclusivas",
      ],
    },
    {
      icon: "📲",
      title: "Plano de Conteúdo e Presença Digital",
      badge: { text: "PLANO EDITORIAL", color: "#4DA3FF" },
      visible: `Para ${answers.segmento || "seu segmento"} em ${answers.cidade || "sua cidade"}, os formatos de conteúdo com maior engajamento e conversão são Reels curtos (até 60s) e Stories com CTA direto. A frequência ideal para seu estágio é de 5 publicações por semana.`,
      blurred: "Calendário editorial completo de 30 dias · Pautas específicas para seu nicho · Copies prontos com CTAs testados · Estratégia de hashtags · Melhores horários de publicação · Templates visuais.",
      cta: "Ver plano de conteúdo",
      bullets: [
        "Calendário de 30 dias gerado pela IA",
        "Roteiros e copies prontos para usar",
        "Análise de performance pós-publicação",
      ],
    },
    {
      icon: "🤖",
      title: "Automações e Inteligência Artificial",
      badge: { text: "IAs CONFIGURADAS PARA SEU NEGÓCIO", color: RED },
      visible: "Identificamos 3 processos no seu negócio que podem ser automatizados com IA agora, sem precisar de conhecimento técnico. O ganho de tempo estimado é de 8 a 12 horas por semana.",
      blurred: "Lista das automações específicas · Configuração dos agentes de IA · Prompts prontos para o seu contexto · Integrações com WhatsApp, e-mail e CRM · Treinamento dos agentes com seus dados.",
      cta: "Ver automações recomendadas",
      bullets: [
        "Agente de qualificação de leads no WhatsApp",
        "Geração automática de propostas e scripts",
        "Análise contínua de métricas com insights IA",
      ],
    },
    {
      icon: "🎯",
      title: "Plano de 90 Dias com Metas",
      badge: { text: "ROTEIRO DE CRESCIMENTO", color: "#22C55E" },
      visible: `Com base no seu faturamento atual e nos gargalos identificados, projetamos um crescimento de ${score < 40 ? "25-40" : score < 65 ? "40-70" : "70-120"}% nos próximos 90 dias seguindo o plano abaixo. Os primeiros 30 dias são críticos para estruturar a base.`,
      blurred: "Cronograma semana a semana · KPIs por fase do plano · Metas numéricas por canal · Responsáveis e checklists · Pontos de checkpoint · Ajustes recomendados em cada fase.",
      cta: "Ver plano de 90 dias",
      bullets: [
        "Roadmap semanal de 90 dias estruturado",
        "Metas numéricas claras por fase",
        "Acompanhamento e ajustes guiados pela IA",
      ],
    },
  ];

  const tools = [
    { title: "CRM Completo", desc: "Pipeline visual, gestão de leads e follow-up automático. Nunca perca um cliente por falta de acompanhamento.", tag: "VENDAS" },
    { title: "Dashboards de Performance", desc: "KPIs em tempo real. Veja o que está gerando dinheiro e o que está desperdiçando.", tag: "DADOS" },
    { title: "Kanban de Tarefas", desc: "Gerencie projetos e equipe com visibilidade total da operação.", tag: "OPERAÇÃO" },
    { title: "Disparos em Massa", desc: "WhatsApp e e-mail com segmentação inteligente. Sem custo por mensagem.", tag: "MARKETING" },
    { title: "Relatórios Automáticos", desc: "Relatórios de vendas e marketing gerados automaticamente toda semana.", tag: "GESTÃO" },
    { title: "Análise de Marketing Digital", desc: "Redes sociais, tráfego pago e aquisição — tudo centralizado.", tag: "MARKETING" },
    { title: "GPS de Crescimento", desc: "A plataforma mostra exatamente onde estão seus gargalos e o que fazer para crescer.", tag: "ESTRATÉGIA" },
    { title: "Scripts de Vendas com IA", desc: "Scripts personalizados criados e otimizados com base nos seus dados reais.", tag: "VENDAS" },
    { title: "Metas Comerciais", desc: "Defina, acompanhe e ajuste metas com visibilidade total da equipe.", tag: "COMERCIAL" },
  ];

  return (
    <>
      <SEOHead
        title="Plataforma do Empresário — Sistema Noé"
        description="Para empresários que querem escalar suas redes de franquias com marketing digital estruturado, automação e inteligência de dados."
        canonical="https://noexcuse.com.br/plataformadoempresario"
        ogImage="https://noexcuse.com.br/og-default.png"
      />
    <div style={{ background: "#0a0a0f", color: "#fff", minHeight: "100vh", ...fontBody }}>
      <style>{`
        [data-reveal]{opacity:0;transform:translateY(24px);transition:opacity .6s ease,transform .6s ease}
        [data-reveal].noe-revealed{opacity:1;transform:none}
        .noe-link{color:#ddd;font-size:14px;font-weight:500;transition:color .2s}
        .noe-link:hover{color:#fff}
        .noe-btn-red{background:${RED};color:#fff;font-weight:600;border-radius:10px;transition:transform .15s, box-shadow .2s, background .2s; cursor:pointer; border:0}
        .noe-btn-red:hover{background:#ff2235;box-shadow:0 8px 30px rgba(232,25,44,.35);transform:translateY(-1px)}
        .noe-btn-ghost{background:transparent;color:#fff;border:1px solid #2e2e2e;border-radius:10px;font-weight:600;transition:border-color .2s, background .2s; cursor:pointer}
        .noe-btn-ghost:hover{border-color:${RED};background:rgba(232,25,44,.08)}
        .noe-card{background:#161616;border:1px solid #2E2E2E;border-radius:16px;transition:border-color .25s, transform .25s}
        .noe-card:hover{border-color:rgba(232,25,44,.5)}
        .noe-input, .noe-select{width:100%;background:#0e0e0e;border:1px solid #2e2e2e;color:#fff;border-radius:10px;padding:12px 14px;font-size:14px;outline:none;transition:border-color .2s}
        .noe-input:focus, .noe-select:focus{border-color:${RED}}
        .noe-label{font-size:12px;color:#aaa;margin-bottom:6px;display:block;text-transform:uppercase;letter-spacing:.06em;${fontMono.fontFamily ? `font-family:${fontMono.fontFamily}` : ""}}
        .noe-blur{filter:blur(6px);user-select:none;pointer-events:none;color:#ccc}
        .noe-pill{display:inline-flex;align-items:center;gap:8px;padding:8px 14px;background:#161616;border:1px solid #2e2e2e;border-radius:999px;font-size:13px}
        .noe-pill::before{content:"";width:6px;height:6px;border-radius:999px;background:${RED}}
        @keyframes noeFade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        .noe-fade{animation:noeFade .4s ease both}
        html{scroll-behavior:smooth}
      `}</style>

      <header
        style={{
          position: "fixed",
          top: 0, left: 0, right: 0,
          zIndex: 50,
          background: scrolled ? "rgba(10,10,10,.92)" : "rgba(10,10,10,.6)",
          backdropFilter: "blur(12px)",
          borderBottom: scrolled ? "1px solid #1f1f1f" : "1px solid transparent",
          transition: "all .25s",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="#top" style={{ ...fontHead, fontSize: 26, color: "#fff", textDecoration: "none" }}>
            NO<span style={{ color: RED }}>EXCUSE</span>
          </a>
          <nav style={{ display: "flex", gap: 28 }} className="noe-nav-desktop">
            <a href="#plataforma" className="noe-link">Plataforma</a>
            <a href="#resultados" className="noe-link">Resultados</a>
            <a href="#planos" className="noe-link">Planos</a>
          </nav>
          <a href={SISTEMA_URL} className="noe-btn-red" style={{ padding: "10px 18px", fontSize: 14, textDecoration: "none" }}>
            Criar conta grátis
          </a>
        </div>
        <style>{`@media(max-width:768px){.noe-nav-desktop{display:none !important}}`}</style>
      </header>

      <main id="top" style={{ paddingTop: 90 }}>
        <section ref={heroRef} style={{ padding: "60px 24px 80px", maxWidth: 1100, margin: "0 auto" }}>
          <div data-reveal>
            <h1 style={{ ...fontHead, fontSize: "clamp(44px, 9vw, 92px)", lineHeight: 0.95, margin: 0, color: "#fff" }}>
              VAMOS CRIAR A <span style={{ color: RED }}>ESTRATÉGIA</span><br />
              DE MARKETING E VENDAS<br />
              DA SUA EMPRESA<br />
              EM 1 MINUTO
            </h1>
            <p style={{ marginTop: 24, fontSize: 17, color: "#777", maxWidth: 760, lineHeight: 1.6 }}>
              Responda 3 perguntas rápidas e nossa IA entrega um Plano Completo de Crescimento personalizado para o seu negócio — com estratégia de aquisição, funil de vendas, análise de concorrência e muito mais.
            </p>
          </div>

          <div data-reveal className="noe-card" style={{ marginTop: 36, padding: 28 }}>
            <div style={{ ...fontMono, color: RED, fontSize: 12, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 18 }}>
              CONTE UM POUCO SOBRE SEU NEGÓCIO
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14 }}>
              <div>
                <label className="noe-label">Qual é o segmento do seu negócio?</label>
                <select className="noe-select" value={answers.segmento} onChange={(e) => setAnswers({ ...answers, segmento: e.target.value })}>
                  <option value="">Selecione seu segmento...</option>
                  {SEGMENTOS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="noe-label">Onde sua empresa está localizada?</label>
                <input className="noe-input" placeholder="Ex: São Paulo, SP" value={answers.cidade} onChange={(e) => setAnswers({ ...answers, cidade: e.target.value })} />
              </div>
              <div>
                <label className="noe-label">Faturamento mensal aproximado?</label>
                <select className="noe-select" value={answers.faturamento} onChange={(e) => setAnswers({ ...answers, faturamento: e.target.value })}>
                  <option value="">Selecione...</option>
                  {FATURAMENTOS.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>
            <button className="noe-btn-red" onClick={startDiagnosis} style={{ marginTop: 18, width: "100%", padding: 16, fontSize: 16 }}>
              Criar minha estratégia de crescimento →
            </button>
            <div style={{ marginTop: 14, fontSize: 13, color: "#888", display: "flex", alignItems: "center", gap: 8 }}>
              🔒 <span>Gratuito, sem necessidade de cartão. Resultado em menos de 1 minuto.</span>
            </div>
          </div>

          <div data-reveal style={{ marginTop: 56, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", borderTop: "1px solid #1f1f1f", borderBottom: "1px solid #1f1f1f" }}>
            {[
              { n: "+340", l: "Empresários ativos" },
              { n: "12+", l: "Ferramentas integradas" },
              { n: "100%", l: "das IAs num lugar só" },
              { n: "01", l: "Plataforma. Só." },
            ].map((s, i) => (
              <div key={i} style={{ padding: "26px 18px", textAlign: "center", borderRight: i < 3 ? "1px solid #1f1f1f" : "none" }}>
                <div style={{ ...fontHead, fontSize: 38, color: "#fff" }}>{s.n}</div>
                <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </section>

        {showResult && (
          <section ref={resultRef} className="noe-fade" style={{ padding: "60px 24px", maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ textAlign: "center" }}>
              <span style={{ display: "inline-block", padding: "6px 14px", background: "rgba(34,197,94,.15)", color: "#22C55E", border: "1px solid rgba(34,197,94,.4)", borderRadius: 999, fontSize: 12, ...fontMono, letterSpacing: ".1em" }}>
                ✅ PLANO GERADO
              </span>
              <h2 style={{ ...fontHead, fontSize: "clamp(40px, 7vw, 72px)", margin: "16px 0 12px", lineHeight: 1 }}>
                SEU PLANO DE CRESCIMENTO<br />
                ESTÁ PRONTO, <span style={{ color: RED }}>{answers.empresa.toUpperCase()}</span>
              </h2>
              <p style={{ color: "#999", maxWidth: 700, margin: "0 auto", fontSize: 16 }}>
                Nossa IA analisou seu negócio e identificou <strong style={{ color: "#fff" }}>6 oportunidades</strong> de crescimento. Veja abaixo cada frente estratégica.
              </p>

              <div style={{ margin: "40px auto 0", display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div
                  style={{
                    width: 180, height: 180, borderRadius: "50%",
                    background: `conic-gradient(${RED} ${score * 3.6}deg, #1f1f1f 0)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    position: "relative",
                  }}
                >
                  <div style={{ position: "absolute", inset: 14, background: "#0a0a0a", borderRadius: "50%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ ...fontHead, fontSize: 56, color: "#fff", lineHeight: 1 }}>{score}</div>
                    <div style={{ fontSize: 11, color: "#888", letterSpacing: ".1em" }}>SCORE / 100</div>
                  </div>
                </div>
                <div style={{ marginTop: 16, color: sLabel.color, fontSize: 15, fontWeight: 600 }}>{sLabel.text}</div>
              </div>
            </div>

            <div style={{ marginTop: 48, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
              {fronts.map((f, i) => (
                <div key={i} className="noe-card" style={{ padding: 24, display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 28 }}>{f.icon}</span>
                      <h3 style={{ ...fontHead, fontSize: 24, margin: 0, color: "#fff", lineHeight: 1.05 }}>{f.title.toUpperCase()}</h3>
                    </div>
                    <span style={{ fontSize: 10, ...fontMono, padding: "4px 8px", borderRadius: 6, background: `${f.badge.color}20`, color: f.badge.color, border: `1px solid ${f.badge.color}40`, whiteSpace: "nowrap" }}>
                      {f.badge.text}
                    </span>
                  </div>
                  <div style={{ height: 1, background: "#222", margin: "12px 0 14px" }} />
                  <p style={{ color: "#bbb", fontSize: 14, lineHeight: 1.6, margin: 0 }}>{f.visible}</p>
                  <div style={{ position: "relative", marginTop: 14, padding: 14, background: "#0e0e0e", borderRadius: 10, border: "1px solid #1d1d1d" }}>
                    <p className="noe-blur" style={{ margin: 0, fontSize: 13 }}>{f.blurred}</p>
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(14,14,14,.3), rgba(14,14,14,.85))", borderRadius: 10 }} />
                  </div>
                  <button
                    className="noe-btn-red"
                    style={{ marginTop: 14, padding: "12px 16px", fontSize: 14 }}
                    onClick={() => setLockedFront({ title: f.title, bullets: f.bullets })}
                  >
                    👁 {f.cta}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        <section id="plataforma" style={{ padding: "100px 24px", maxWidth: 1200, margin: "0 auto" }}>
          <h2 data-reveal style={{ ...fontHead, fontSize: "clamp(38px, 6vw, 64px)", textAlign: "center", margin: 0, lineHeight: 1 }}>
            PARE DE PAGAR <span style={{ color: RED }}>12 PLATAFORMAS</span>
          </h2>
          <div data-reveal style={{ marginTop: 48, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }}>
            {tools.map((t) => (
              <div key={t.title} className="noe-card" style={{ padding: 22 }}>
                <div style={{ ...fontMono, color: RED, fontSize: 10, letterSpacing: ".15em", marginBottom: 10 }}>{t.tag}</div>
                <h3 style={{ ...fontHead, fontSize: 24, margin: 0, color: "#fff" }}>{t.title.toUpperCase()}</h3>
                <p style={{ color: "#999", fontSize: 14, marginTop: 8, lineHeight: 1.55 }}>{t.desc}</p>
              </div>
            ))}
          </div>

          <div data-reveal style={{ marginTop: 48, padding: 32, borderRadius: 16, background: "linear-gradient(135deg, rgba(232,25,44,.08), rgba(0,0,0,0))", borderLeft: `4px solid ${RED}`, border: "1px solid #1f1f1f", borderLeftWidth: 4 }}>
            <h3 style={{ ...fontHead, fontSize: "clamp(28px, 4vw, 44px)", margin: 0, lineHeight: 1.05 }}>
              TODAS AS IAs QUE O SEU NEGÓCIO PRECISA, NUM LUGAR SÓ
            </h3>
            <p style={{ color: "#aaa", marginTop: 14, fontSize: 15, lineHeight: 1.65, maxWidth: 880 }}>
              Você sabe que IA pode transformar seu negócio. Mas tentou usar ChatGPT e não funcionou como esperava. O problema não é a IA — é que ela não estava configurada para o SEU negócio, com os SEUS dados, no SEU contexto. Na NOEXCUSE, as IAs já vêm prontas para o empresário: treinadas, integradas e orientadas para resultado.
            </p>
            <div style={{ marginTop: 18, display: "flex", flexWrap: "wrap", gap: 10 }}>
              {[
                "Agente de vendas inteligente",
                "Análise de concorrência em tempo real",
                "Geração de conteúdo para redes",
                "Diagnóstico automático do negócio",
                "Scripts de vendas personalizados",
                "Previsão de resultados e metas",
                "Análise de campanhas e criativos",
                "Atendimento e qualificação automatizados",
                "Insights de marketing por segmento",
              ].map((p) => (
                <span key={p} className="noe-pill">{p}</span>
              ))}
            </div>
          </div>

          <h3 data-reveal style={{ ...fontHead, fontSize: "clamp(32px, 5vw, 52px)", textAlign: "center", marginTop: 80, marginBottom: 32 }}>
            ANTES vs DEPOIS DA <span style={{ color: RED }}>NOEXCUSE</span>
          </h3>
          <div data-reveal style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 18 }}>
            <div className="noe-card" style={{ padding: 24 }}>
              <div style={{ ...fontMono, color: "#888", fontSize: 11, letterSpacing: ".15em", marginBottom: 12 }}>SEM A PLATAFORMA</div>
              {[
                "CRM separado (R$ 200/mês)",
                "Ferramenta de disparos (R$ 150/mês)",
                "Relatórios manuais em planilha",
                "ChatGPT sem integração (R$ 100/mês)",
                "Ferramenta de tarefas separada",
                "Dados espalhados em 5 lugares",
                "Sem visão de crescimento real",
              ].map((it) => (
                <div key={it} style={{ padding: "10px 0", borderBottom: "1px solid #1f1f1f", color: "#aaa", fontSize: 14 }}>❌ {it}</div>
              ))}
              <div style={{ marginTop: 16, padding: 14, background: "rgba(232,25,44,.1)", border: "1px solid rgba(232,25,44,.3)", borderRadius: 10, color: "#FFB020", fontWeight: 700, fontSize: 16 }}>
                +R$ 600/mês em ferramentas soltas
              </div>
            </div>
            <div className="noe-card" style={{ padding: 24, borderColor: RED, position: "relative" }}>
              <div style={{ ...fontMono, color: RED, fontSize: 11, letterSpacing: ".15em", marginBottom: 12 }}>COM NOEXCUSE</div>
              {[
                "CRM integrado incluso",
                "Disparos ilimitados incluso",
                "Relatórios automáticos incluso",
                "Todas as IAs do negócio incluso",
                "Kanban e gestão de tarefas incluso",
                "Todos os dados integrados",
                "GPS de crescimento incluso",
              ].map((it) => (
                <div key={it} style={{ padding: "10px 0", borderBottom: "1px solid #1f1f1f", color: "#ddd", fontSize: 14 }}>✅ {it}</div>
              ))}
              <div style={{ marginTop: 16, padding: 14, background: "rgba(232,25,44,.15)", border: `1px solid ${RED}`, borderRadius: 10, color: RED, fontWeight: 700, fontSize: 16 }}>
                Tudo por um preço justo
              </div>
            </div>
          </div>
        </section>

        <section id="resultados" style={{ padding: "80px 24px", maxWidth: 1200, margin: "0 auto" }}>
          <h2 data-reveal style={{ ...fontHead, fontSize: "clamp(38px, 6vw, 64px)", textAlign: "center", margin: 0 }}>
            EMPRESÁRIOS QUE <span style={{ color: RED }}>CRESCERAM</span>
          </h2>
          <div data-reveal style={{ marginTop: 40, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 18 }}>
            {[
              { n: "Ricardo Moura", t: "Serviços", in: "RM", q: "Eu pagava 4 plataformas diferentes e mesmo assim não tinha visão nenhuma do meu negócio. Com a NOEXCUSE, em 30 dias eu já sabia exatamente onde estava perdendo clientes.", b: "📈 +67% em conversão de leads" },
              { n: "Camila Ferreira", t: "E-commerce", in: "CF", q: "A IA de análise de concorrência me mostrou uma oportunidade que eu estava ignorando há meses. Mudei minha estratégia e em 45 dias bati o melhor mês do ano.", b: "📈 Melhor mês em 3 anos" },
              { n: "Leandro Santos", t: "Clínica", in: "LS", q: "Tentei IA antes e não funcionou. Aqui é diferente porque as IAs já entendem do meu segmento. O agente de vendas sozinho já pagou 3 meses de plataforma.", b: "🤖 ROI em 15 dias" },
            ].map((c) => (
              <div key={c.n} className="noe-card" style={{ padding: 24 }}>
                <div style={{ color: "#FFB020", letterSpacing: 2 }}>★★★★★</div>
                <p style={{ color: "#ddd", fontSize: 14, lineHeight: 1.6, marginTop: 12 }}>"{c.q}"</p>
                <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: "50%", background: RED, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#fff" }}>{c.in}</div>
                  <div>
                    <div style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>{c.n}</div>
                    <div style={{ color: "#888", fontSize: 12 }}>{c.t}</div>
                  </div>
                </div>
                <div style={{ marginTop: 14, padding: "10px 12px", background: "rgba(34,197,94,.1)", border: "1px solid rgba(34,197,94,.3)", borderRadius: 8, color: "#22C55E", fontSize: 13, fontWeight: 600 }}>
                  {c.b}
                </div>
              </div>
            ))}
          </div>

          <div data-reveal className="noe-card" style={{ marginTop: 32, padding: 28, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 20, textAlign: "center" }}>
            {[
              { n: "+340", l: "Empresários usando a plataforma" },
              { n: "87%", l: "Reportam crescimento nos primeiros 60 dias" },
              { n: "R$600", l: "Economia média mensal em ferramentas" },
            ].map((s) => (
              <div key={s.l}>
                <div style={{ ...fontHead, fontSize: 44, color: RED }}>{s.n}</div>
                <div style={{ color: "#888", fontSize: 13 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </section>

        <section id="planos" style={{ padding: "80px 24px", maxWidth: 1200, margin: "0 auto" }}>
          <h2 data-reveal style={{ ...fontHead, fontSize: "clamp(38px, 6vw, 64px)", textAlign: "center", margin: 0 }}>
            PREÇO JUSTO. <span style={{ color: RED }}>RESULTADO REAL.</span>
          </h2>
          <div data-reveal style={{ marginTop: 48, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 18, alignItems: "stretch" }}>
            {[
              {
                name: "STARTER", price: "R$197", cycle: "/mês",
                items: [
                  { ok: true, t: "CRM até 500 contatos" },
                  { ok: true, t: "Dashboards de performance" },
                  { ok: true, t: "Kanban de tarefas" },
                  { ok: true, t: "GPS de crescimento" },
                  { ok: true, t: "IAs básicas do negócio" },
                  { ok: false, t: "Disparos em massa" },
                  { ok: false, t: "Análise de concorrência" },
                ],
                cta: "Começar agora", primary: false, popular: false,
              },
              {
                name: "GROWTH", price: "R$397", cycle: "/mês",
                items: [
                  { ok: true, t: "CRM ilimitado" },
                  { ok: true, t: "Dashboards avançados" },
                  { ok: true, t: "Kanban + metas comerciais" },
                  { ok: true, t: "GPS de crescimento completo" },
                  { ok: true, t: "Todas as IAs do negócio" },
                  { ok: true, t: "Disparos ilimitados" },
                  { ok: true, t: "Análise de concorrência" },
                  { ok: true, t: "Relatórios automáticos" },
                ],
                cta: "Assinar Growth", primary: true, popular: true,
              },
              {
                name: "ENTERPRISE", price: "Custom", cycle: "",
                items: [
                  { ok: true, t: "Tudo do Growth" },
                  { ok: true, t: "Múltiplos usuários" },
                  { ok: true, t: "Integrações customizadas" },
                  { ok: true, t: "Onboarding dedicado" },
                  { ok: true, t: "CS exclusivo" },
                  { ok: true, t: "SLA garantido" },
                  { ok: true, t: "White-label disponível" },
                ],
                cta: "Falar com especialista", primary: false, popular: false, whats: true,
              },
            ].map((p) => (
              <div key={p.name} className="noe-card" style={{ padding: 28, position: "relative", borderColor: p.popular ? RED : undefined }}>
                {p.popular && (
                  <span style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: RED, color: "#fff", fontSize: 11, padding: "4px 12px", borderRadius: 999, ...fontMono, letterSpacing: ".1em" }}>
                    MAIS POPULAR
                  </span>
                )}
                <div style={{ ...fontMono, color: "#888", fontSize: 11, letterSpacing: ".2em" }}>{p.name}</div>
                <div style={{ marginTop: 8, ...fontHead, fontSize: 48, color: "#fff" }}>
                  {p.price}<span style={{ fontSize: 18, color: "#888" }}>{p.cycle}</span>
                </div>
                <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 10 }}>
                  {p.items.map((it) => (
                    <div key={it.t} style={{ fontSize: 14, color: it.ok ? "#ddd" : "#555", display: "flex", alignItems: "center", gap: 8 }}>
                      <span>{it.ok ? "✓" : "✗"}</span> {it.t}
                    </div>
                  ))}
                </div>
                <a
                  href={p.whats ? WHATSAPP_URL : SISTEMA_URL}
                  target={p.whats ? "_blank" : undefined}
                  rel={p.whats ? "noopener noreferrer" : undefined}
                  className={p.primary ? "noe-btn-red" : "noe-btn-ghost"}
                  style={{ display: "block", textAlign: "center", marginTop: 22, padding: 14, textDecoration: "none", fontSize: 14 }}
                >
                  {p.cta}
                </a>
              </div>
            ))}
          </div>
        </section>

        <section style={{ padding: "100px 24px", maxWidth: 1000, margin: "0 auto", textAlign: "center" }}>
          <h2 data-reveal style={{ ...fontHead, fontSize: "clamp(40px, 7vw, 80px)", margin: 0, lineHeight: 1 }}>
            SEU NEGÓCIO TEM<br />
            <span style={{ color: RED }}>POTENCIAL.</span><br />
            VOCÊ PRECISA DO GPS.
          </h2>
          <p data-reveal style={{ color: "#999", marginTop: 18, fontSize: 17 }}>
            Crie sua estratégia de crescimento agora — gratuito, sem cartão, resultado em menos de 1 minuto.
          </p>
          <div data-reveal style={{ marginTop: 32, display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="noe-btn-red" onClick={scrollToHero} style={{ padding: "16px 28px", fontSize: 16 }}>
              Criar minha estratégia agora →
            </button>
            <a href={SISTEMA_URL} className="noe-btn-ghost" style={{ padding: "16px 24px", textDecoration: "none", fontSize: 15, display: "inline-block" }}>
              Criar conta gratuita →
            </a>
          </div>
        </section>

        <footer style={{ borderTop: "1px solid #1f1f1f", padding: "40px 24px", textAlign: "center" }}>
          <div style={{ ...fontHead, fontSize: 28 }}>NO<span style={{ color: RED }}>EXCUSE</span></div>
          <div style={{ ...fontMono, color: "#777", fontSize: 12, marginTop: 8, letterSpacing: ".15em" }}>
            PLATAFORMA · MARKETING · VENDAS · CRESCIMENTO
          </div>
          <div style={{ color: "#555", fontSize: 12, marginTop: 14 }}>© 2025 NOEXCUSE. Todos os direitos reservados.</div>
        </footer>
      </main>

      {modalOpen && (
        <DiagnosisModal
          step={step}
          answers={answers}
          setAnswers={setAnswers}
          onClose={() => setModalOpen(false)}
          onNext={nextStep}
          onBack={() => setStep(Math.max(0, step - 1))}
          onFinish={finishDiagnosis}
        />
      )}

      {lockedFront && (
        <LockedModal front={lockedFront} onClose={() => setLockedFront(null)} />
      )}
    </div>
    </>
  );
}

function DiagnosisModal({
  step, answers, setAnswers, onClose, onNext, onBack, onFinish,
}: {
  step: number;
  answers: Answers;
  setAnswers: (a: Answers) => void;
  onClose: () => void;
  onNext: () => void;
  onBack: () => void;
  onFinish: () => void;
}) {
  const total = 7;
  const pct = Math.round(((step + 1) / total) * 100);

  function toggleCanal(c: string) {
    setAnswers({
      ...answers,
      canais: answers.canais.includes(c)
        ? answers.canais.filter((x) => x !== c)
        : [...answers.canais, c],
    });
  }

  const canAdvance = (() => {
    switch (step) {
      case 0: return !!answers.gargalo;
      case 1: return answers.canais.length > 0;
      case 2: return !!answers.processo;
      case 3: return !!answers.investimento;
      case 4: return !!answers.ferramenta;
      case 5: return !!answers.ia;
      case 6: return !!answers.nome.trim() && !!answers.empresa.trim() && !!answers.email.trim();
      default: return false;
    }
  })();

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,.92)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
        animation: "noeFade .25s ease both",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 640, background: "#0F0F0F", border: "1px solid #222", borderRadius: 20,
          padding: 28, position: "relative", maxHeight: "90vh", overflowY: "auto",
        }}
      >
        <button onClick={onClose} aria-label="Fechar" style={{ position: "absolute", top: 14, right: 14, background: "transparent", border: 0, color: "#888", fontSize: 22, cursor: "pointer" }}>×</button>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", ...fontMono, fontSize: 12, color: "#aaa" }}>
          <span>Pergunta {step + 1} de {total}</span>
          <span>{pct}%</span>
        </div>
        <div style={{ height: 6, background: "#1f1f1f", borderRadius: 999, marginTop: 8, overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: RED, transition: "width .3s" }} />
        </div>

        <div style={{ marginTop: 24 }}>
          {step === 0 && (
            <Q title="Qual é o maior gargalo que está impedindo seu crescimento hoje?">
              <Grid2>
                {[
                  { i: "📣", t: "Poucos clientes novos", s: "Não consigo gerar leads qualificados" },
                  { i: "💸", t: "Leads existem mas não compram", s: "Problema na conversão de vendas" },
                  { i: "🔄", t: "Clientes não ficam ou não voltam", s: "Alto churn, baixo LTV" },
                  { i: "📊", t: "Não tenho dados nem visibilidade", s: "Decido no feeling" },
                ].map((o) => {
                  const v = `${o.i} ${o.t}`;
                  const sel = answers.gargalo === v;
                  return (
                    <OptCard key={o.t} selected={sel} onClick={() => setAnswers({ ...answers, gargalo: v })}>
                      <div style={{ fontSize: 24 }}>{o.i}</div>
                      <div style={{ fontWeight: 600, marginTop: 4, color: "#fff" }}>{o.t}</div>
                      <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>{o.s}</div>
                    </OptCard>
                  );
                })}
              </Grid2>
            </Q>
          )}

          {step === 1 && (
            <Q title="Como você adquire clientes hoje?" subtitle="Pode marcar mais de uma opção.">
              <div style={{ display: "grid", gap: 8 }}>
                {[
                  "🤝 Indicação e boca a boca",
                  "📱 Tráfego pago (Meta/Google Ads)",
                  "📲 Redes sociais / conteúdo orgânico",
                  "📞 Prospecção ativa (SDR, ligação)",
                  "🏪 Ponto físico / walk-in",
                  "🌐 SEO / Blog / Google orgânico",
                ].map((o) => {
                  const sel = answers.canais.includes(o);
                  return (
                    <OptCard key={o} selected={sel} onClick={() => toggleCanal(o)}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span>{o}</span>
                        <span style={{ width: 20, height: 20, borderRadius: 4, border: `2px solid ${sel ? RED : "#444"}`, background: sel ? RED : "transparent", color: "#fff", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>{sel ? "✓" : ""}</span>
                      </div>
                    </OptCard>
                  );
                })}
              </div>
            </Q>
          )}

          {step === 2 && (
            <Q title="Você tem um processo de vendas definido?">
              <SingleList
                value={answers.processo}
                onChange={(v) => setAnswers({ ...answers, processo: v })}
                options={[
                  "✅ Sim, temos um funil estruturado com etapas claras",
                  "⚠️ Parcialmente — existe um processo mas não é seguido por todos",
                  "❌ Não — cada vendedor faz do seu jeito",
                  "🙋 Sou eu quem vende, não tenho time ainda",
                ]}
                stripPrefix
              />
            </Q>
          )}

          {step === 3 && (
            <Q title="Você investe em marketing digital regularmente?">
              <SingleList
                value={answers.investimento}
                onChange={(v) => setAnswers({ ...answers, investimento: v })}
                options={[
                  "Sim, invisto acima de R$ 3.000/mês",
                  "Invisto, mas menos de R$ 3.000/mês",
                  "Investia, mas parei (não vi resultado)",
                  "Nunca investi em mídia paga",
                ]}
              />
            </Q>
          )}

          {step === 4 && (
            <Q title="Qual ferramenta você usa para gestão de clientes e vendas hoje?">
              <SingleList
                value={answers.ferramenta}
                onChange={(v) => setAnswers({ ...answers, ferramenta: v })}
                options={[
                  "Nenhuma (controlo na cabeça ou papel)",
                  "Planilha Excel/Google Sheets",
                  "WhatsApp + anotações",
                  "CRM básico (RD, Pipedrive, HubSpot...)",
                  "Tenho várias ferramentas que não conversam entre si",
                ]}
              />
            </Q>
          )}

          {step === 5 && (
            <Q title="Você já tentou usar Inteligência Artificial no seu negócio?">
              <SingleList
                value={answers.ia}
                onChange={(v) => setAnswers({ ...answers, ia: v })}
                options={[
                  "Nunca tentei",
                  "Tentei, mas não vi resultado real",
                  "Uso ChatGPT de forma básica e pontual",
                  "Já uso IA com consistência no meu processo",
                ]}
              />
            </Q>
          )}

          {step === 6 && (
            <Q title="Para onde enviar seu Plano de Crescimento?">
              <div style={{ display: "grid", gap: 12 }}>
                <div>
                  <label className="noe-label">Seu nome</label>
                  <input className="noe-input" value={answers.nome} onChange={(e) => setAnswers({ ...answers, nome: e.target.value })} />
                </div>
                <div>
                  <label className="noe-label">Nome da empresa</label>
                  <input className="noe-input" value={answers.empresa} onChange={(e) => setAnswers({ ...answers, empresa: e.target.value })} />
                </div>
                <div>
                  <label className="noe-label">Seu melhor e-mail</label>
                  <input className="noe-input" type="email" value={answers.email} onChange={(e) => setAnswers({ ...answers, email: e.target.value })} />
                </div>
              </div>
            </Q>
          )}
        </div>

        <div style={{ marginTop: 24, display: "flex", gap: 10, justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={onBack} disabled={step === 0} className="noe-btn-ghost" style={{ padding: "10px 16px", opacity: step === 0 ? 0.4 : 1 }}>
            ← Voltar
          </button>
          {step < 6 ? (
            <button className="noe-btn-red" disabled={!canAdvance} onClick={onNext} style={{ padding: "12px 22px", opacity: canAdvance ? 1 : 0.5 }}>
              Continuar →
            </button>
          ) : (
            <button className="noe-btn-red" disabled={!canAdvance} onClick={onFinish} style={{ padding: "14px 22px", fontSize: 15, opacity: canAdvance ? 1 : 0.5, flex: 1 }}>
              Gerar meu Plano de Crescimento →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Q({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="noe-fade">
      <h3 style={{ ...fontHead, fontSize: 26, color: "#fff", margin: 0, lineHeight: 1.1 }}>{title}</h3>
      {subtitle && <div style={{ color: "#888", fontSize: 13, marginTop: 6 }}>{subtitle}</div>}
      <div style={{ marginTop: 18 }}>{children}</div>
    </div>
  );
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>{children}</div>;
}

function OptCard({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        textAlign: "left", width: "100%", padding: 14, borderRadius: 12,
        background: selected ? "rgba(232,25,44,.12)" : "#0e0e0e",
        border: `1px solid ${selected ? RED : "#222"}`,
        color: "#ddd", cursor: "pointer", transition: "all .15s",
        ...fontBody, fontSize: 14,
      }}
    >
      {children}
    </button>
  );
}

function SingleList({ value, onChange, options, stripPrefix }: { value: string; onChange: (v: string) => void; options: string[]; stripPrefix?: boolean }) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {options.map((o) => {
        const stored = stripPrefix ? o.replace(/^[^\\w]+ /, "") : o;
        const v = stripPrefix ? stored : o;
        const sel = value === v;
        return (
          <OptCard key={o} selected={sel} onClick={() => onChange(v)}>{o}</OptCard>
        );
      })}
    </div>
  );
}

function LockedModal({ front, onClose }: { front: { title: string; bullets: string[] }; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 110, background: "rgba(0,0,0,.92)", backdropFilter: "blur(10px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
        animation: "noeFade .25s ease both",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480, background: "#0F0F0F", border: "1px solid rgba(232,25,44,.3)",
          borderRadius: 20, padding: 32, position: "relative", textAlign: "center",
        }}
      >
        <button onClick={onClose} aria-label="Fechar" style={{ position: "absolute", top: 14, right: 14, background: "transparent", border: 0, color: "#888", fontSize: 22, cursor: "pointer" }}>×</button>
        <div style={{ fontSize: 56 }}>🔒</div>
        <h3 style={{ ...fontHead, fontSize: 28, margin: "12px 0 8px", lineHeight: 1.05 }}>
          ESTA ESTRATÉGIA ESTÁ PRONTA PARA VOCÊ
        </h3>
        <p style={{ color: "#aaa", fontSize: 14, lineHeight: 1.6 }}>
          Para acessar a estratégia completa de <strong style={{ color: "#fff" }}>{front.title}</strong> e todas as outras frentes, você precisa da Plataforma NOEXCUSE — onde a IA executa, acompanha e otimiza cada parte do plano com você.
        </p>
        <ul style={{ textAlign: "left", listStyle: "none", padding: 0, margin: "20px 0", display: "grid", gap: 10 }}>
          {front.bullets.map((b) => (
            <li key={b} style={{ display: "flex", gap: 10, alignItems: "flex-start", color: "#ddd", fontSize: 14 }}>
              <span style={{ color: RED, fontWeight: 700 }}>›</span> {b}
            </li>
          ))}
        </ul>
        <a href={SISTEMA_URL} className="noe-btn-red" style={{ display: "block", padding: 14, textDecoration: "none", fontSize: 15 }}>
          🚀 Acessar a plataforma e ver estratégia completa
        </a>
        <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", marginTop: 14, color: "#aaa", fontSize: 13, textDecoration: "none", borderBottom: "1px solid #333", paddingBottom: 2 }}>
          Prefiro falar com um especialista →
        </a>
      </div>
    </div>
  );
}
