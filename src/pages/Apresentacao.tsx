import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import {
  type ClientFollowup,
  type FollowupAnalise,
  type FollowupPlano,
  type ConteudoPauta,
  type TrafegoCampanha,
  type WebSecao,
  type VendasSection,
  type AnaliseSubSection,
} from "@/hooks/useClientFollowups";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899"];
const MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function getMonthLabel(ref: string) {
  const [y, m] = ref.split("-");
  return `${MONTH_NAMES[parseInt(m, 10) - 1]} ${y}`;
}

function fmt(v: number | undefined) {
  if (v == null) return "—";
  return v.toLocaleString("pt-BR");
}

/* ── Scaled slide wrapper ── */
function SlideWrapper({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`w-[1920px] h-[1080px] relative overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

/* ── SLIDE 1: Capa ── */
function SlideCapa({ clientName, monthRef }: { clientName: string; monthRef: string }) {
  return (
    <SlideWrapper className="bg-[#0f0f0f] flex flex-col items-center justify-center">
      <img src="/lovable-uploads/5765bdd4-e02b-42f0-b942-ad992bf21b09.png" alt="Logo" className="h-[120px] object-contain mb-16" />
      <h1 className="text-[72px] font-bold text-white tracking-tight">Acompanhamento Mensal</h1>
      <p className="text-[42px] text-red-400 font-semibold mt-4">{clientName}</p>
      <p className="text-[32px] text-gray-400 mt-6">{getMonthLabel(monthRef)}</p>
      <div className="absolute bottom-12 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent" />
    </SlideWrapper>
  );
}

/* ── Metric card ── */
function MetricCard({ label, value, color = "text-white" }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
      <p className="text-[18px] text-gray-400 mb-2">{label}</p>
      <p className={`text-[36px] font-bold ${color}`}>{typeof value === "number" ? fmt(value) : value}</p>
    </div>
  );
}

/* ── SLIDE 2: Análise Geral ── */
function SlideAnaliseGeral({ analise }: { analise: FollowupAnalise }) {
  const areas = [
    { name: "Conteúdo", data: analise.conteudo },
    { name: "Tráfego", data: analise.trafego },
    { name: "Web", data: analise.web },
    { name: "Vendas", data: analise.vendas },
  ];

  const radarData = areas.map((a) => {
    const m = a.data?.metricas || {};
    const vals = Object.values(m).filter((v) => typeof v === "number");
    const avg = vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
    return { area: a.name, valor: Math.min(avg, 100) };
  });

  return (
    <SlideWrapper className="bg-[#0f0f0f] p-16">
      <h2 className="text-[48px] font-bold text-white mb-2">Análise de Performance</h2>
      <div className="h-1 w-32 bg-red-500 mb-10" />
      <div className="flex gap-12 h-[800px]">
        <div className="flex-1 flex items-center justify-center">
          <ResponsiveContainer width="100%" height={600}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#333" />
              <PolarAngleAxis dataKey="area" tick={{ fill: "#ccc", fontSize: 22 }} />
              <PolarRadiusAxis tick={{ fill: "#666", fontSize: 16 }} domain={[0, 100]} />
              <Radar dataKey="valor" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 grid grid-cols-2 gap-6 content-center">
          {areas.map((a) => {
            const m = a.data?.metricas || {};
            const entries = Object.entries(m).slice(0, 3);
            return (
              <div key={a.name} className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="text-[24px] font-semibold text-white mb-4">{a.name}</h3>
                {entries.map(([k, v]) => (
                  <div key={k} className="flex justify-between text-[18px] mb-2">
                    <span className="text-gray-400">{k}</span>
                    <span className="text-white font-medium">{fmt(v as number)}</span>
                  </div>
                ))}
                {entries.length === 0 && <p className="text-gray-500 text-[16px]">Sem métricas</p>}
              </div>
            );
          })}
        </div>
      </div>
    </SlideWrapper>
  );
}

/* ── SLIDE 3: Pontos + / - ── */
function SlideAnaliseDetalhe({ analise }: { analise: FollowupAnalise }) {
  const areas = [
    { name: "Conteúdo", data: analise.conteudo, color: "#8b5cf6" },
    { name: "Tráfego", data: analise.trafego, color: "#3b82f6" },
    { name: "Web", data: analise.web, color: "#22c55e" },
    { name: "Vendas", data: analise.vendas, color: "#f97316" },
  ];

  return (
    <SlideWrapper className="bg-[#0f0f0f] p-16">
      <h2 className="text-[48px] font-bold text-white mb-2">Análise Detalhada</h2>
      <div className="h-1 w-32 bg-red-500 mb-8" />
      <div className="grid grid-cols-2 gap-8 h-[850px]">
        {areas.map((a) => (
          <div key={a.name} className="bg-white/5 border border-white/10 rounded-xl p-8" style={{ borderLeftColor: a.color, borderLeftWidth: 4 }}>
            <h3 className="text-[28px] font-semibold text-white mb-4">{a.name}</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-[16px] text-green-400 font-semibold mb-2">Pontos Positivos</p>
                {(a.data?.positivos || []).map((p, i) => (
                  <p key={i} className="text-[16px] text-gray-300 mb-1">• {p}</p>
                ))}
                {(!a.data?.positivos?.length) && <p className="text-gray-600 text-[14px]">—</p>}
              </div>
              <div>
                <p className="text-[16px] text-red-400 font-semibold mb-2">Pontos Negativos</p>
                {(a.data?.negativos || []).map((p, i) => (
                  <p key={i} className="text-[16px] text-gray-300 mb-1">• {p}</p>
                ))}
                {(!a.data?.negativos?.length) && <p className="text-gray-600 text-[14px]">—</p>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </SlideWrapper>
  );
}

/* ── SLIDE 4: Conteúdo ── */
function SlideConteudo({ plano }: { plano: FollowupPlano }) {
  const pautas = plano.conteudo?.pautas || [];
  const orgCount = pautas.filter((p) => p.tipo === "organico").length;
  const pagoCount = pautas.filter((p) => p.tipo === "pago").length;

  const formatData = pautas.reduce((acc, p) => {
    const f = p.formato || "Outro";
    const existing = acc.find((x) => x.name === f);
    if (existing) existing.value++;
    else acc.push({ name: f, value: 1 });
    return acc;
  }, [] as { name: string; value: number }[]);

  return (
    <SlideWrapper className="bg-[#0f0f0f] p-16">
      <h2 className="text-[48px] font-bold text-white mb-2">Plano de Conteúdo</h2>
      <div className="h-1 w-32 bg-violet-500 mb-8" />
      <div className="flex gap-12 h-[850px]">
        <div className="w-[500px] flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4">
            <MetricCard label="Total Pautas" value={pautas.length} color="text-violet-400" />
            <MetricCard label="Orgânico" value={orgCount} color="text-green-400" />
            <MetricCard label="Pago" value={pagoCount} color="text-blue-400" />
            <MetricCard label="Linha Editorial" value={plano.conteudo?.linha_editorial || "—"} />
          </div>
          {formatData.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex-1 flex items-center justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={formatData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {formatData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Legend wrapperStyle={{ color: "#ccc", fontSize: 16 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="space-y-4 max-h-[850px] overflow-y-auto pr-2">
            {pautas.slice(0, 6).map((p, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="text-[22px] font-semibold text-white">{p.titulo || `Pauta ${i + 1}`}</h4>
                  <span className={`text-[14px] px-3 py-1 rounded-full ${p.tipo === "organico" ? "bg-green-500/20 text-green-400" : "bg-blue-500/20 text-blue-400"}`}>
                    {p.tipo === "organico" ? "Orgânico" : "Pago"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-[16px]">
                  <div><span className="text-gray-500">Formato:</span> <span className="text-gray-300 ml-1">{p.formato}</span></div>
                  <div><span className="text-gray-500">Plataforma:</span> <span className="text-gray-300 ml-1">{p.plataforma}</span></div>
                  <div><span className="text-gray-500">Duração:</span> <span className="text-gray-300 ml-1">{p.tempo_duracao}</span></div>
                  <div><span className="text-gray-500">Data:</span> <span className="text-gray-300 ml-1">{p.data_postagem}</span></div>
                  <div className="col-span-2"><span className="text-gray-500">Objetivo:</span> <span className="text-gray-300 ml-1">{p.objetivo}</span></div>
                </div>
              </div>
            ))}
            {pautas.length > 6 && <p className="text-gray-500 text-[18px] text-center">+{pautas.length - 6} pautas adicionais</p>}
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}

/* ── SLIDE 5: Tráfego Pago ── */
function SlideTrafego({ plano }: { plano: FollowupPlano }) {
  const campanhas = plano.trafego?.campanhas || [];
  const totalInvest = campanhas.reduce((s, c) => s + (c.investimento_total || 0), 0);

  const investData = campanhas.filter((c) => c.investimento_total > 0).map((c) => ({
    name: c.nome_campanha?.slice(0, 20) || "Campanha",
    valor: c.investimento_total,
  }));

  return (
    <SlideWrapper className="bg-[#0f0f0f] p-16">
      <h2 className="text-[48px] font-bold text-white mb-2">Tráfego Pago</h2>
      <div className="h-1 w-32 bg-blue-500 mb-8" />
      <div className="flex gap-12 h-[850px]">
        <div className="w-[550px] flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4">
            <MetricCard label="Campanhas" value={campanhas.length} color="text-blue-400" />
            <MetricCard label="Investimento Total" value={`R$ ${fmt(totalInvest)}`} color="text-green-400" />
          </div>
          {investData.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex-1 flex items-center justify-center">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={investData} layout="vertical">
                  <XAxis type="number" tick={{ fill: "#999", fontSize: 14 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "#ccc", fontSize: 14 }} width={150} />
                  <Tooltip formatter={(v: number) => `R$ ${fmt(v)}`} contentStyle={{ background: "#1a1a1a", border: "1px solid #333" }} />
                  <Bar dataKey="valor" fill="#3b82f6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto max-h-[850px] pr-2">
          {campanhas.slice(0, 4).map((c, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h4 className="text-[22px] font-semibold text-white mb-3">{c.nome_campanha || `Campanha ${i + 1}`}</h4>
              <div className="grid grid-cols-2 gap-3 text-[16px]">
                <div><span className="text-gray-500">Plataforma:</span> <span className="text-gray-300 ml-1">{c.plataforma}</span></div>
                <div><span className="text-gray-500">Objetivo:</span> <span className="text-gray-300 ml-1">{c.objetivo_campanha}</span></div>
                <div><span className="text-gray-500">Público:</span> <span className="text-gray-300 ml-1">{c.publico_alvo}</span></div>
                <div><span className="text-gray-500">Formato:</span> <span className="text-gray-300 ml-1">{c.formato_anuncio}</span></div>
                <div><span className="text-gray-500">Invest. Diário:</span> <span className="text-green-400 ml-1">R$ {fmt(c.investimento_diario)}</span></div>
                <div><span className="text-gray-500">Duração:</span> <span className="text-gray-300 ml-1">{c.duracao_dias} dias</span></div>
                <div><span className="text-gray-500">Meta CPL:</span> <span className="text-gray-300 ml-1">R$ {fmt(c.meta_cpl)}</span></div>
                <div><span className="text-gray-500">Meta ROAS:</span> <span className="text-gray-300 ml-1">{fmt(c.meta_roas)}x</span></div>
              </div>
            </div>
          ))}
          {campanhas.length > 4 && <p className="text-gray-500 text-[18px] text-center">+{campanhas.length - 4} campanhas</p>}
        </div>
      </div>
    </SlideWrapper>
  );
}

/* ── SLIDE 6: Web ── */
function SlideWeb({ plano }: { plano: FollowupPlano }) {
  const secoes = plano.web?.secoes || [];
  return (
    <SlideWrapper className="bg-[#0f0f0f] p-16">
      <h2 className="text-[48px] font-bold text-white mb-2">Web & Landing Pages</h2>
      <div className="h-1 w-32 bg-emerald-500 mb-8" />
      <div className="grid grid-cols-2 gap-8 h-[850px] content-start">
        {secoes.slice(0, 4).map((s, i) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-8">
            <div className="flex justify-between items-start mb-4">
              <h4 className="text-[26px] font-semibold text-white">{s.titulo || `Seção ${i + 1}`}</h4>
              <span className="text-[14px] px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400">{s.status || "A criar"}</span>
            </div>
            <p className="text-[18px] text-gray-400 mb-4">{s.tipo}</p>
            <div className="space-y-2 text-[16px]">
              <div><span className="text-gray-500">Objetivo:</span> <span className="text-gray-300 ml-1">{s.objetivo}</span></div>
              <div><span className="text-gray-500">Prazo:</span> <span className="text-gray-300 ml-1">{s.prazo_estimado}</span></div>
              {s.necessidades_cliente && (
                <div><span className="text-gray-500">Necessidades do cliente:</span> <span className="text-yellow-400 ml-1">{s.necessidades_cliente}</span></div>
              )}
              {s.secoes_pagina?.length > 0 && (
                <div className="mt-2">
                  <span className="text-gray-500">Seções:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {s.secoes_pagina.map((sp, j) => (
                      <span key={j} className="text-[14px] px-2 py-1 bg-white/10 rounded text-gray-300">{sp}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {secoes.length === 0 && <p className="text-gray-500 text-[24px] col-span-2 text-center mt-20">Nenhuma seção web planejada</p>}
      </div>
    </SlideWrapper>
  );
}

/* ── SLIDE 7: Vendas ── */
function SlideVendas({ plano }: { plano: FollowupPlano }) {
  const v = plano.vendas || {} as VendasSection;
  return (
    <SlideWrapper className="bg-[#0f0f0f] p-16">
      <h2 className="text-[48px] font-bold text-white mb-2">Vendas & CRM</h2>
      <div className="h-1 w-32 bg-orange-500 mb-8" />
      <div className="grid grid-cols-2 gap-8 h-[850px] content-start">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <MetricCard label="Taxa Conversão" value={v.taxa_conversao || "—"} color="text-orange-400" />
            <MetricCard label="Ticket Médio" value={v.ticket_medio || "—"} color="text-green-400" />
            <MetricCard label="Meta de Vendas" value={v.meta_vendas || "—"} color="text-blue-400" />
            <MetricCard label="Funil Atual" value={v.funil_atual || "—"} />
          </div>
          {v.analise_crm && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h4 className="text-[20px] font-semibold text-white mb-3">Análise CRM</h4>
              <p className="text-[16px] text-gray-300 leading-relaxed">{v.analise_crm}</p>
            </div>
          )}
        </div>
        <div className="space-y-6">
          {(v.estrategias?.filter(Boolean).length ?? 0) > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h4 className="text-[20px] font-semibold text-white mb-3">Estratégias</h4>
              {v.estrategias?.filter(Boolean).map((e, i) => <p key={i} className="text-[16px] text-gray-300 mb-1">• {e}</p>)}
            </div>
          )}
          {(v.melhorias?.filter(Boolean).length ?? 0) > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h4 className="text-[20px] font-semibold text-white mb-3">Melhorias</h4>
              {v.melhorias?.filter(Boolean).map((e, i) => <p key={i} className="text-[16px] text-gray-300 mb-1">• {e}</p>)}
            </div>
          )}
          {(v.acoes_equipe?.filter(Boolean).length ?? 0) > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h4 className="text-[20px] font-semibold text-white mb-3">Ações da Equipe</h4>
              {v.acoes_equipe?.filter(Boolean).map((e, i) => <p key={i} className="text-[16px] text-gray-300 mb-1">• {e}</p>)}
            </div>
          )}
        </div>
      </div>
    </SlideWrapper>
  );
}

/* ── SLIDE 8: Resumo ── */
function SlideResumo({ analise, clientName }: { analise: FollowupAnalise; clientName: string }) {
  return (
    <SlideWrapper className="bg-[#0f0f0f] p-16">
      <h2 className="text-[48px] font-bold text-white mb-2">Resumo & Próximos Passos</h2>
      <div className="h-1 w-32 bg-red-500 mb-10" />
      <div className="grid grid-cols-2 gap-12 h-[800px]">
        <div>
          <h3 className="text-[30px] font-semibold text-green-400 mb-6">Avanços do Mês</h3>
          <div className="space-y-3">
            {(analise.avancos_mes || []).filter(Boolean).map((a, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-green-400 text-[24px] mt-1">✓</span>
                <p className="text-[20px] text-gray-200">{a}</p>
              </div>
            ))}
            {(!analise.avancos_mes?.filter(Boolean).length) && <p className="text-gray-600 text-[20px]">Nenhum avanço registrado</p>}
          </div>
        </div>
        <div>
          <h3 className="text-[30px] font-semibold text-yellow-400 mb-6">Pontos a Melhorar</h3>
          <div className="space-y-3">
            {(analise.pontos_melhorar || []).filter(Boolean).map((p, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-yellow-400 text-[24px] mt-1">→</span>
                <p className="text-[20px] text-gray-200">{p}</p>
              </div>
            ))}
            {(!analise.pontos_melhorar?.filter(Boolean).length) && <p className="text-gray-600 text-[20px]">Nenhum ponto registrado</p>}
          </div>
        </div>
      </div>
      {analise.resumo_geral && (
        <div className="absolute bottom-20 left-16 right-16 bg-white/5 border border-white/10 rounded-xl p-8">
          <p className="text-[20px] text-gray-300 italic leading-relaxed">{analise.resumo_geral}</p>
        </div>
      )}
      <div className="absolute bottom-8 right-16">
        <img src="/lovable-uploads/5765bdd4-e02b-42f0-b942-ad992bf21b09.png" alt="Logo" className="h-10 opacity-40" />
      </div>
    </SlideWrapper>
  );
}

/* ── Main Presentation ── */
export default function Apresentacao() {
  const { id } = useParams<{ id: string }>();
  const [followup, setFollowup] = useState<ClientFollowup | null>(null);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!id) return;
    supabase.from("client_followups").select("*").eq("id", id).single().then(({ data, error }) => {
      if (data) setFollowup(data as unknown as ClientFollowup);
      setLoading(false);
    });
  }, [id]);

  // Scale 1920x1080 to viewport
  useEffect(() => {
    function updateScale() {
      const sx = window.innerWidth / 1920;
      const sy = window.innerHeight / 1080;
      setScale(Math.min(sx, sy));
    }
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  const totalSlides = 8;

  const navigate = useCallback((dir: number) => {
    setCurrent((c) => Math.max(0, Math.min(totalSlides - 1, c + dir)));
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); navigate(1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); navigate(-1); }
      if (e.key === "Escape") window.close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#0f0f0f] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-red-500" />
      </div>
    );
  }

  if (!followup) {
    return (
      <div className="h-screen w-screen bg-[#0f0f0f] flex items-center justify-center text-white text-2xl">
        Acompanhamento não encontrado
      </div>
    );
  }

  const analise = (followup.analise || {}) as FollowupAnalise;
  const plano = (followup.plano_proximo || {}) as FollowupPlano;

  const slides = [
    <SlideCapa key={0} clientName={followup.client_name} monthRef={followup.month_ref} />,
    <SlideAnaliseGeral key={1} analise={analise} />,
    <SlideAnaliseDetalhe key={2} analise={analise} />,
    <SlideConteudo key={3} plano={plano} />,
    <SlideTrafego key={4} plano={plano} />,
    <SlideWeb key={5} plano={plano} />,
    <SlideVendas key={6} plano={plano} />,
    <SlideResumo key={7} analise={analise} clientName={followup.client_name} />,
  ];

  return (
    <div
      ref={containerRef}
      className="h-screen w-screen bg-[#0f0f0f] overflow-hidden relative cursor-none select-none"
      onClick={() => navigate(1)}
      style={{ touchAction: "none" }}
    >
      {/* Slide */}
      <div
        className="absolute"
        style={{
          width: 1920,
          height: 1080,
          left: "50%",
          top: "50%",
          marginLeft: -960,
          marginTop: -540,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        {slides[current]}
      </div>

      {/* Navigation arrows */}
      {current > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); navigate(-1); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-opacity opacity-0 hover:opacity-100 cursor-pointer z-10"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
      )}
      {current < totalSlides - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); navigate(1); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-opacity opacity-0 hover:opacity-100 cursor-pointer z-10"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      )}

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-10">
        <div className="h-full bg-red-500 transition-all duration-300" style={{ width: `${((current + 1) / totalSlides) * 100}%` }} />
      </div>

      {/* Slide counter */}
      <div className="absolute bottom-3 right-4 text-gray-500 text-sm z-10 opacity-0 hover:opacity-100 transition-opacity">
        {current + 1} / {totalSlides}
      </div>
    </div>
  );
}
