// @ts-nocheck
import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { supabase } from "@/lib/supabase";
import { supabase as transferClient } from "@/integrations/supabase/client";
import { Loader2, ChevronDown, Target, TrendingUp, Globe, Megaphone, BarChart3, ShoppingCart, Sparkles, CheckCircle, AlertTriangle } from "lucide-react";
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
  PieChart, Pie, Cell, Legend, CartesianGrid,
} from "recharts";
import { motion } from "framer-motion";

const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899"];
const MONTH_NAMES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

function getMonthLabel(ref: string) {
  const [y, m] = ref.split("-");
  return `${MONTH_NAMES[parseInt(m, 10) - 1]} ${y}`;
}

function fmt(v: number | undefined) {
  if (v == null || v === 0) return "—";
  return v.toLocaleString("pt-BR");
}

/* ── Section wrapper ── */
function Section({ children, id, className = "" }: { children: React.ReactNode; id?: string; className?: string }) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6 }}
      className={`py-20 px-6 md:px-16 lg:px-24 max-w-[1400px] mx-auto ${className}`}
    >
      {children}
    </motion.section>
  );
}

function SectionLabel({ text, color = "bg-red-500" }: { text: string; color?: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-xs uppercase tracking-[0.2em] text-gray-400 font-medium">{text}</span>
    </div>
  );
}

function MetricBox({ label, value, color = "text-white" }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center mb-2">
        <span className="text-gray-500 text-sm">{label.includes("R$") ? "R$" : ""}</span>
      </div>
      <p className={`text-3xl md:text-4xl font-bold ${color}`}>{typeof value === "number" ? fmt(value) : value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}

/* ── HERO / CAPA ── */
function HeroSection({ clientName, monthRef }: { clientName: string; monthRef: string }) {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center relative px-6">
      <SectionLabel text="Planejamento Estratégico" />
      <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white text-center mt-4 leading-tight">
        {clientName}
      </h1>
      <p className="text-2xl md:text-4xl font-bold text-red-500 mt-2 text-center">
        Acompanhamento Mensal
      </p>
      <p className="text-lg text-gray-400 mt-6 text-center max-w-2xl">
        Análise de Performance & Planejamento Estratégico
      </p>
      <p className="text-gray-500 mt-4">{getMonthLabel(monthRef)}</p>
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-12"
      >
        <ChevronDown className="w-8 h-8 text-gray-600" />
      </motion.div>
    </section>
  );
}

/* ── SCORE GERAL (substitui radar) ── */
function ScoreSection({ analise }: { analise: FollowupAnalise }) {
  const areas = [
    { key: "conteudo", label: "Criativos", color: "#8b5cf6", icon: Megaphone },
    { key: "trafego", label: "Tráfego Pago", color: "#3b82f6", icon: TrendingUp },
    { key: "web", label: "Web", color: "#22c55e", icon: Globe },
    { key: "vendas", label: "Vendas", color: "#f97316", icon: ShoppingCart },
  ];

  const getScore = (section?: AnaliseSubSection) => section?.score || 0;
  const scores = {
    conteudo: getScore(analise.conteudo),
    trafego: getScore(analise.trafego),
    web: getScore(analise.web),
    vendas: getScore(analise.vendas),
  };
  const media = Object.values(scores).reduce((a, b) => a + b, 0) / 4;
  const chartData = areas.map((a) => ({
    area: a.label,
    score: scores[a.key as keyof typeof scores],
    fill: a.color,
  }));

  const scoreLabel = (s: number) =>
    s === 0 ? "Sem avaliação" :
    s <= 1 ? "Crítico" :
    s <= 2 ? "Abaixo do esperado" :
    s <= 3 ? "Regular" :
    s <= 4 ? "Bom" : "Excelente";

  return (
    <Section id="score">
      <SectionLabel text="Score de Performance" />
      <h2 className="text-3xl md:text-5xl font-bold text-white mb-2">
        Avaliação do Período
      </h2>
      <p className="text-gray-400 mb-12 max-w-2xl">
        Score individual por frente estratégica — de 0 a 5.
      </p>

      <div className="flex justify-center mb-16">
        <div className="text-center">
          <p className="text-gray-500 text-sm uppercase tracking-widest mb-2">Score Médio Geral</p>
          <p className="text-8xl font-bold text-white leading-none">{media.toFixed(1)}</p>
          <p className="text-2xl text-gray-500 mt-1">/5</p>
          <p className="text-lg mt-3" style={{ color: media >= 4 ? "#22c55e" : media >= 3 ? "#f97316" : "#ef4444" }}>
            {scoreLabel(media)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
        {areas.map((a) => {
          const score = scores[a.key as keyof typeof scores];
          const Icon = a.icon;
          return (
            <motion.div
              key={a.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 text-center"
              style={{ borderTopColor: a.color, borderTopWidth: 4 }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: a.color + "20" }}>
                <Icon className="w-6 h-6" style={{ color: a.color }} />
              </div>
              <p className="text-gray-400 text-sm mb-3">{a.label}</p>
              <p className="text-5xl font-bold mb-1" style={{ color: a.color }}>
                {score}
              </p>
              <p className="text-gray-600 text-xs">/5 — {scoreLabel(score)}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8">
        <h3 className="text-lg font-semibold text-white mb-6 text-center">
          Comparativo por Frente
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#222" />
            <XAxis dataKey="area" tick={{ fill: "#ccc", fontSize: 13 }} />
            <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tick={{ fill: "#666", fontSize: 12 }} />
            <Tooltip
              formatter={(v: number) => [`${v}/5`, "Score"]}
              contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8 }}
            />
            <Bar dataKey="score" radius={[8, 8, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Section>
  );
}

/* ── ANÁLISE POR ÁREA ── */
function AnaliseAreaSection({
  id, label, color, icon: Icon, section, isConteudo = false,
}: {
  id: string; label: string; color: string;
  icon: React.ElementType; section?: AnaliseSubSection; isConteudo?: boolean;
}) {
  if (!section) return null;

  const metricas = Object.entries(section.metricas || {}).filter(([, v]) => (v as number) > 0);
  const indicadores = section.indicadores || [];
  const positivos = section.positivos?.filter(Boolean) || [];
  const negativos = section.negativos?.filter(Boolean) || [];
  const score = section.score || 0;
  const hasContent = metricas.length > 0 || indicadores.length > 0 || positivos.length > 0 || negativos.length > 0 || section.observacoes;
  if (!hasContent) return null;

  return (
    <Section id={id}>
      <SectionLabel text={`Análise — ${label}`} color="bg-gray-500" />
      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: color + "20" }}>
          <Icon className="w-7 h-7" style={{ color }} />
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-white">{label}</h2>
        {score > 0 && (
          <span className="ml-auto text-3xl font-bold" style={{ color }}>
            {score}<span className="text-lg text-gray-500">/5</span>
          </span>
        )}
      </div>

      {metricas.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {metricas.map(([k, v]) => (
            <div key={k} className="bg-white/[0.03] border border-white/10 rounded-xl p-5 text-center">
              <p className="text-2xl font-bold text-white">{fmt(v as number)}</p>
              <p className="text-xs text-gray-500 mt-1">{k}</p>
            </div>
          ))}
        </div>
      )}

      {indicadores.length > 0 && (
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 mb-8">
          <h3 className="text-sm text-gray-500 uppercase tracking-widest mb-6">
            Indicadores — Meta vs Realizado
          </h3>
          <div className="space-y-5">
            {indicadores.map((ind, i) => {
              const pct = ind.ideal > 0 ? Math.min((ind.atual / ind.ideal) * 100, 100) : 0;
              const barColor = pct >= 90 ? "#22c55e" : pct >= 60 ? "#f97316" : "#ef4444";
              return (
                <div key={i}>
                  <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
                    <span className="text-gray-300 text-sm">{ind.label}</span>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-gray-500">Meta: {ind.ideal} {ind.unidade}</span>
                      <span className="font-bold text-white">Atual: {ind.atual} {ind.unidade}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: barColor + "20", color: barColor }}>
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: barColor }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!isConteudo && section.imagens?.filter(Boolean).length > 0 && (
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 mb-8">
          <h3 className="text-sm text-gray-500 uppercase tracking-widest mb-4">
            Anúncios em Veiculação
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {section.imagens!.filter(Boolean).map((url, idx) => (
              <img key={idx} src={url} alt={`Anúncio ${idx + 1}`}
                className="rounded-xl border border-white/10 w-full object-cover aspect-square" />
            ))}
          </div>
        </div>
      )}

      {(positivos.length > 0 || negativos.length > 0) && (
        <div className="grid md:grid-cols-2 gap-6">
          {positivos.length > 0 && (
            <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-8">
              <p className="text-green-400 text-xs font-semibold uppercase tracking-wider mb-4">
                ✓ Pontos Positivos
              </p>
              {positivos.map((p, i) => (
                <p key={i} className="text-gray-300 text-sm mb-2 flex gap-2">
                  <span className="text-green-400 shrink-0">•</span> {p}
                </p>
              ))}
            </div>
          )}
          {negativos.length > 0 && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-8">
              <p className="text-red-400 text-xs font-semibold uppercase tracking-wider mb-4">
                → A Melhorar
              </p>
              {negativos.map((p, i) => (
                <p key={i} className="text-gray-300 text-sm mb-2 flex gap-2">
                  <span className="text-red-400 shrink-0">•</span> {p}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {section.observacoes && (
        <div className="mt-6 bg-white/[0.03] border border-white/10 rounded-2xl p-6">
          <p className="text-gray-400 text-sm italic">{section.observacoes}</p>
        </div>
      )}
    </Section>
  );
}

/* ── DIVISOR DE PARTES ── */
function ParteDivisor({ id, numero, titulo, descricao }: {
  id?: string; numero: string; titulo: string; descricao: string;
}) {
  return (
    <section
      id={id}
      className="min-h-[50vh] flex flex-col items-center justify-center px-6 bg-gradient-to-b from-[#0a0a0f] via-[#0d0d15] to-[#0a0a0f] relative overflow-hidden"
    >
      <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
        <p className="text-[20rem] font-black text-white leading-none select-none">
          {numero}
        </p>
      </div>
      <SectionLabel text={`Parte ${numero}`} />
      <h2 className="text-4xl md:text-6xl font-bold text-white text-center mt-4 relative">
        {titulo}
      </h2>
      <p className="text-gray-400 mt-4 text-center max-w-xl text-lg relative">{descricao}</p>
    </section>
  );
}

/* ── CONTEÚDO ── */
function ConteudoSection({ plano, analise }: { plano: FollowupPlano; analise?: FollowupAnalise }) {
  const pautas = plano.conteudo?.pautas || [];
  const orgCount = pautas.filter((p) => p.tipo === "organico").length;
  const pagoCount = pautas.filter((p) => p.tipo === "pago").length;

  const formatData = useMemo(() => {
    const map = new Map<string, number>();
    pautas.forEach((p) => { if (p.formato) map.set(p.formato, (map.get(p.formato) || 0) + 1); });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [pautas]);

  if (pautas.length === 0 && !plano.conteudo?.linha_editorial) return null;

  return (
    <Section id="conteudo">
      <SectionLabel text="Conteúdo e Linha Editorial" color="bg-violet-500" />
      <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Plano de Conteúdo</h2>
      <p className="text-gray-400 mb-12 max-w-2xl">
        Estrutura completa de produção de conteúdo orgânico e pago para o próximo ciclo.
      </p>

      {/* Metrics row */}
      <div className="flex flex-wrap gap-12 justify-center mb-16">
        <MetricBox label="Total Pautas" value={pautas.length} color="text-violet-400" />
        <MetricBox label="Orgânico" value={orgCount} color="text-green-400" />
        <MetricBox label="Pago" value={pagoCount} color="text-blue-400" />
      </div>

      {plano.conteudo?.linha_editorial && (
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 mb-12">
          <h3 className="text-lg font-semibold text-white mb-3">Linha Editorial</h3>
          <p className="text-gray-300 leading-relaxed">{plano.conteudo.linha_editorial}</p>
        </div>
      )}

      {formatData.length > 0 && (
        <div className="flex justify-center mb-16">
          <div className="w-full max-w-md">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={formatData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {formatData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend wrapperStyle={{ color: "#999", fontSize: 13 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {(analise?.conteudo?.imagens?.filter(Boolean)?.length ?? 0) > 0 && (
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 mb-12">
          <h3 className="text-lg font-semibold text-white mb-4">Criativos em Veiculação</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {analise!.conteudo!.imagens!.filter(Boolean).map((url, idx) => (
              <img key={idx} src={url} alt={`Criativo ${idx + 1}`} className="rounded-xl border border-white/10 w-full object-cover aspect-square" />
            ))}
          </div>
        </div>
      )}

      {/* Pautas */}
      <div className="space-y-8">
        {pautas.map((p, i) => {
          const refImgs = (p.imagens_referencia || []).filter(Boolean);
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 md:p-10"
              style={{ borderLeftColor: p.tipo === "organico" ? "#22c55e" : "#3b82f6", borderLeftWidth: 4 }}
            >
              <div className="flex justify-between items-start mb-6 gap-4 flex-wrap">
                <h4 className="text-xl md:text-2xl font-bold text-white leading-tight">{p.titulo || `Pauta ${i + 1}`}</h4>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${p.tipo === "organico" ? "bg-green-500/20 text-green-400" : "bg-blue-500/20 text-blue-400"}`}>
                  {p.tipo === "organico" ? "Orgânico" : "Pago"}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4 text-sm mb-6">
                {p.formato && <div><span className="text-gray-500 text-xs uppercase tracking-wider block mb-1">Formato</span><p className="text-gray-200 font-medium">{p.formato}</p></div>}
                {p.plataforma && <div><span className="text-gray-500 text-xs uppercase tracking-wider block mb-1">Plataforma</span><p className="text-gray-200 font-medium">{p.plataforma}</p></div>}
                {p.tempo_duracao && <div><span className="text-gray-500 text-xs uppercase tracking-wider block mb-1">Duração</span><p className="text-gray-200 font-medium">{p.tempo_duracao}</p></div>}
                {p.data_postagem && <div><span className="text-gray-500 text-xs uppercase tracking-wider block mb-1">Data</span><p className="text-gray-200 font-medium">{p.data_postagem}</p></div>}
              </div>
              <div className="space-y-5">
                {p.objetivo && (<div><span className="text-gray-500 text-xs uppercase tracking-wider block mb-1.5">Objetivo</span><p className="text-gray-300 text-[15px] leading-relaxed">{p.objetivo}</p></div>)}
                {p.roteiro && (<div><span className="text-gray-500 text-xs uppercase tracking-wider block mb-1.5">Roteiro</span><p className="text-gray-300 text-[15px] leading-relaxed whitespace-pre-line">{p.roteiro}</p></div>)}
                {p.cta && (<div><span className="text-gray-500 text-xs uppercase tracking-wider block mb-1.5">Call to Action</span><p className="text-gray-300 text-[15px] leading-relaxed">{p.cta}</p></div>)}
                {p.necessidades_cliente && (<div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-5"><span className="text-yellow-500 text-xs font-semibold uppercase tracking-wider block mb-1.5">Necessidade do cliente</span><p className="text-yellow-100/90 text-[15px] leading-relaxed">{p.necessidades_cliente}</p></div>)}
              </div>
              {refImgs.length > 0 && (
                <div className="mt-8 pt-8 border-t border-white/10">
                  <span className="text-gray-500 text-xs uppercase tracking-wider block mb-4">Referências Visuais</span>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {refImgs.map((url, j) => (
                      <img key={j} src={url} alt={`Referência ${j + 1}`} className="rounded-xl border border-white/10 w-full object-cover aspect-square" />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </Section>
  );
}

/* ── TRÁFEGO PAGO ── */
function TrafegoSection({ plano }: { plano: FollowupPlano }) {
  const campanhas = plano.trafego?.campanhas || [];
  const totalInvest = campanhas.reduce((s, c) => s + (c.investimento_total || 0), 0);

  const investData = useMemo(() =>
    campanhas.filter((c) => c.investimento_total > 0).map((c) => ({
      name: c.nome_campanha?.slice(0, 25) || c.plataforma || "Campanha",
      valor: c.investimento_total,
    })), [campanhas]);

  if (campanhas.length === 0) return null;

  return (
    <Section id="trafego">
      <SectionLabel text="Tráfego e Distribuição" color="bg-blue-500" />
      <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Campanhas de Tráfego Pago</h2>
      <p className="text-gray-400 mb-12 max-w-2xl">
        Volume previsível de leads qualificados com campanhas segmentadas por intenção.
      </p>

      <div className="flex flex-wrap gap-12 justify-center mb-16">
        <MetricBox label="Campanhas" value={campanhas.length} color="text-blue-400" />
        <MetricBox label="Investimento Total" value={`R$ ${fmt(totalInvest)}`} color="text-green-400" />
      </div>

      {investData.length > 0 && (
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 mb-12">
          <h3 className="text-lg font-semibold text-white mb-6">Distribuição de Investimento</h3>
          <ResponsiveContainer width="100%" height={Math.max(200, investData.length * 60)}>
            <BarChart data={investData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" />
              <XAxis type="number" tick={{ fill: "#999", fontSize: 12 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#ccc", fontSize: 13 }} width={180} />
              <Tooltip formatter={(v: number) => `R$ ${fmt(v)}`} contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8 }} />
              <Bar dataKey="valor" fill="#3b82f6" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Campaign details */}
      <div className="space-y-6">
        {campanhas.map((c, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className="bg-white/[0.03] border border-white/10 rounded-2xl p-8"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-xs text-blue-400 font-medium uppercase tracking-wider">{c.plataforma}</span>
                <h4 className="text-xl font-bold text-white mt-1">{c.nome_campanha || `Campanha ${i + 1}`}</h4>
              </div>
              <span className="text-green-400 font-bold text-lg">R$ {fmt(c.investimento_total)}</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
              {c.objetivo_campanha && <div><span className="text-gray-500 block">Objetivo</span><p className="text-gray-200 font-medium">{c.objetivo_campanha}</p></div>}
              {c.tipo_campanha && <div><span className="text-gray-500 block">Tipo</span><p className="text-gray-200 font-medium">{c.tipo_campanha}</p></div>}
              {c.formato_anuncio && <div><span className="text-gray-500 block">Formato</span><p className="text-gray-200 font-medium">{c.formato_anuncio}</p></div>}
              {c.publico_alvo && <div><span className="text-gray-500 block">Público</span><p className="text-gray-200 font-medium">{c.publico_alvo}</p></div>}
              {c.segmentacao && <div><span className="text-gray-500 block">Segmentação</span><p className="text-gray-200 font-medium">{c.segmentacao}</p></div>}
              {c.localizacao && <div><span className="text-gray-500 block">Localização</span><p className="text-gray-200 font-medium">{c.localizacao}</p></div>}
              {c.faixa_etaria && <div><span className="text-gray-500 block">Faixa Etária</span><p className="text-gray-200 font-medium">{c.faixa_etaria}</p></div>}
              {c.duracao_dias > 0 && <div><span className="text-gray-500 block">Duração</span><p className="text-gray-200 font-medium">{c.duracao_dias} dias</p></div>}
            </div>

            {(c.meta_cpl > 0 || c.meta_cpc > 0 || c.meta_ctr > 0 || c.meta_roas > 0 || c.meta_conversoes > 0) && (
              <div className="mt-6 pt-6 border-t border-white/10">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Metas da Campanha</p>
                <div className="flex flex-wrap gap-6">
                  {c.meta_cpl > 0 && <div className="text-center"><p className="text-white font-bold">R$ {fmt(c.meta_cpl)}</p><p className="text-gray-500 text-xs">CPL</p></div>}
                  {c.meta_cpc > 0 && <div className="text-center"><p className="text-white font-bold">R$ {fmt(c.meta_cpc)}</p><p className="text-gray-500 text-xs">CPC</p></div>}
                  {c.meta_ctr > 0 && <div className="text-center"><p className="text-white font-bold">{c.meta_ctr}%</p><p className="text-gray-500 text-xs">CTR</p></div>}
                  {c.meta_conversoes > 0 && <div className="text-center"><p className="text-white font-bold">{fmt(c.meta_conversoes)}</p><p className="text-gray-500 text-xs">Conversões</p></div>}
                  {c.meta_roas > 0 && <div className="text-center"><p className="text-white font-bold">{c.meta_roas}x</p><p className="text-gray-500 text-xs">ROAS</p></div>}
                </div>
              </div>
            )}

            {c.copy_principal && (
              <div className="mt-6 pt-6 border-t border-white/10">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Copy Principal</p>
                <p className="text-gray-300 text-sm italic">"{c.copy_principal}"</p>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

/* ── WEB ── */
function WebSection({ plano }: { plano: FollowupPlano }) {
  const secoes = plano.web?.secoes || [];
  if (secoes.length === 0) return null;

  return (
    <Section id="web">
      <SectionLabel text="Web (Conversão)" color="bg-emerald-500" />
      <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Páginas & Landing Pages</h2>
      <p className="text-gray-400 mb-12 max-w-2xl">
        Estrutura web planejada para converter tráfego em leads qualificados.
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        {secoes.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className="bg-white/[0.03] border border-white/10 rounded-2xl p-8"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-xs text-emerald-400 font-medium uppercase">{s.tipo}</span>
                <h4 className="text-xl font-bold text-white mt-1">{s.titulo || `Página ${i + 1}`}</h4>
              </div>
              <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-medium">{s.status || "A criar"}</span>
            </div>

            {s.objetivo && <p className="text-gray-400 text-sm mb-4"><span className="text-gray-500">Objetivo:</span> {s.objetivo}</p>}
            {s.descricao && <p className="text-gray-400 text-sm mb-4"><span className="text-gray-500">Descrição:</span> {s.descricao}</p>}

            {s.secoes_pagina?.filter(Boolean).length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Seções</p>
                <div className="flex flex-wrap gap-2">
                  {s.secoes_pagina.filter(Boolean).map((sp, j) => (
                    <span key={j} className="text-xs px-3 py-1 bg-white/10 rounded-full text-gray-300">{sp}</span>
                  ))}
                </div>
              </div>
            )}

            {s.expectativa_resultado && <p className="text-gray-400 text-sm mb-2"><span className="text-gray-500">Resultado esperado:</span> {s.expectativa_resultado}</p>}
            {s.necessidades_cliente && (
              <p className="text-yellow-400/80 text-sm mt-4 bg-yellow-500/10 rounded-lg p-3">
                <span className="text-yellow-500 font-medium">Necessidade do cliente:</span> {s.necessidades_cliente}
              </p>
            )}
            {s.prazo_estimado && <p className="text-gray-500 text-sm mt-3">Prazo: {s.prazo_estimado}</p>}
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

/* ── VENDAS ── */
function VendasSectionComp({ plano }: { plano: FollowupPlano }) {
  const v = plano.vendas || {} as VendasSection;
  const hasContent = v.analise_crm || v.funil_atual || v.meta_vendas || (v.estrategias?.filter(Boolean).length ?? 0) > 0;
  if (!hasContent) return null;

  return (
    <Section id="vendas">
      <SectionLabel text="Sales (Comercial)" color="bg-orange-500" />
      <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Vendas & CRM</h2>
      <p className="text-gray-400 mb-12 max-w-2xl">
        Estratégia comercial estruturada para converter leads em clientes com previsibilidade.
      </p>

      <div className="flex flex-wrap gap-12 justify-center mb-16">
        {v.taxa_conversao && <MetricBox label="Taxa de Conversão" value={v.taxa_conversao} color="text-orange-400" />}
        {v.ticket_medio && <MetricBox label="Ticket Médio" value={v.ticket_medio} color="text-green-400" />}
        {v.meta_vendas && <MetricBox label="Meta de Vendas" value={v.meta_vendas} color="text-blue-400" />}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {v.funil_atual && (
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8">
            <h3 className="text-lg font-semibold text-white mb-3">Funil Atual</h3>
            <p className="text-gray-300 leading-relaxed">{v.funil_atual}</p>
          </div>
        )}
        {v.analise_crm && (
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8">
            <h3 className="text-lg font-semibold text-white mb-3">Análise CRM</h3>
            <p className="text-gray-300 leading-relaxed">{v.analise_crm}</p>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6 mt-8">
        {(v.estrategias?.filter(Boolean).length ?? 0) > 0 && (
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8">
            <h3 className="text-lg font-semibold text-white mb-4">Estratégias</h3>
            {v.estrategias?.filter(Boolean).map((e, i) => (
              <p key={i} className="text-gray-300 text-sm mb-2 flex items-start gap-2">
                <span className="text-orange-400 mt-0.5">•</span> {e}
              </p>
            ))}
          </div>
        )}
        {(v.melhorias?.filter(Boolean).length ?? 0) > 0 && (
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8">
            <h3 className="text-lg font-semibold text-white mb-4">Melhorias</h3>
            {v.melhorias?.filter(Boolean).map((e, i) => (
              <p key={i} className="text-gray-300 text-sm mb-2 flex items-start gap-2">
                <span className="text-yellow-400 mt-0.5">•</span> {e}
              </p>
            ))}
          </div>
        )}
        {(v.acoes_equipe?.filter(Boolean).length ?? 0) > 0 && (
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8">
            <h3 className="text-lg font-semibold text-white mb-4">Ações da Equipe</h3>
            {v.acoes_equipe?.filter(Boolean).map((e, i) => (
              <p key={i} className="text-gray-300 text-sm mb-2 flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span> {e}
              </p>
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}

/* ── RESUMO ── */
function ResumoSection({ analise }: { analise: FollowupAnalise }) {
  const hasAvancos = (analise.avancos_mes?.filter(Boolean).length ?? 0) > 0;
  const hasPontos = (analise.pontos_melhorar?.filter(Boolean).length ?? 0) > 0;
  if (!hasAvancos && !hasPontos && !analise.resumo_geral) return null;

  return (
    <Section id="resumo">
      <SectionLabel text="Conclusão Estratégica" />
      <h2 className="text-3xl md:text-5xl font-bold text-white mb-12">Resumo & Próximos Passos</h2>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {hasAvancos && (
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <h3 className="text-xl font-bold text-green-400">Avanços do Mês</h3>
            </div>
            {analise.avancos_mes?.filter(Boolean).map((a, i) => (
              <div key={i} className="flex items-start gap-3 mb-3">
                <span className="text-green-400 mt-1">✓</span>
                <p className="text-gray-200">{a}</p>
              </div>
            ))}
          </div>
        )}
        {hasPontos && (
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
              <h3 className="text-xl font-bold text-yellow-400">Pontos a Melhorar</h3>
            </div>
            {analise.pontos_melhorar?.filter(Boolean).map((p, i) => (
              <div key={i} className="flex items-start gap-3 mb-3">
                <span className="text-yellow-400 mt-1">→</span>
                <p className="text-gray-200">{p}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {analise.resumo_geral && (
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8">
          <h3 className="text-lg font-semibold text-white mb-3">Resumo Geral</h3>
          <p className="text-gray-300 leading-relaxed italic">{analise.resumo_geral}</p>
        </div>
      )}
    </Section>
  );
}

/* ── NAV DOTS ── */
function NavDots({ sections }: { sections: { id: string; label: string }[] }) {
  return (
    <nav className="fixed right-4 top-1/2 -translate-y-1/2 z-50 hidden lg:flex flex-col gap-3">
      {sections.map((s) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          className="group flex items-center gap-2"
          title={s.label}
        >
          <span className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">{s.label}</span>
          <span className="w-2 h-2 rounded-full bg-white/20 group-hover:bg-red-500 transition-colors" />
        </a>
      ))}
    </nav>
  );
}

/* ── MAIN ── */
export default function Apresentacao() {
  const { id } = useParams<{ id: string }>();
  const [followup, setFollowup] = useState<ClientFollowup | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchFollowup = async () => {
      // Try portal-scoped client first (correct storageKey)
      const { data } = await supabase.from("client_followups").select("*").eq("id", id).single();
      if (data) {
        setFollowup(data as unknown as ClientFollowup);
        setLoading(false);
        return;
      }
      // Fallback: try default-key client (OAuth transfer client)
      const { data: data2 } = await transferClient.from("client_followups").select("*").eq("id", id).single();
      if (data2) {
        setFollowup(data2 as unknown as ClientFollowup);
      }
      setLoading(false);
    };
    fetchFollowup();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-red-500" />
      </div>
    );
  }

  if (!followup) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-white text-2xl">
        Acompanhamento não encontrado
      </div>
    );
  }

  const analise = (followup.analise || {}) as FollowupAnalise;
  const plano = (followup.plano_proximo || {}) as FollowupPlano;

  return (
    <>
      <SEOHead
        title="Apresentação Comercial — Sistema Noé"
        description="Apresentação personalizada com análise completa de marketing digital para sua franquia."
        noindex={true}
      />
    <div className="min-h-screen bg-[#0a0a0f] text-white scroll-smooth">
      <NavDots sections={[
        { id: "score", label: "Score" },
        { id: "analise-criativos", label: "Criativos" },
        { id: "analise-trafego", label: "Tráfego" },
        { id: "analise-web", label: "Web" },
        { id: "analise-vendas", label: "Vendas" },
        { id: "resumo", label: "Resumo" },
        { id: "parte2", label: "Estratégia" },
        { id: "conteudo", label: "Conteúdo" },
        { id: "trafego", label: "Campanhas" },
        { id: "web", label: "Páginas" },
        { id: "vendas", label: "Vendas" },
      ]} />

      {/* ── CAPA ── */}
      <HeroSection clientName={followup.client_name} monthRef={followup.month_ref} />

      <div className="w-full h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />

      {/* ══════════════════════════════════ */}
      {/* PARTE 1 — ANÁLISE                 */}
      {/* ══════════════════════════════════ */}
      <ParteDivisor
        numero="1"
        titulo="Análise de Performance"
        descricao="O que aconteceu — métricas, indicadores, pontos fortes e oportunidades de melhoria."
      />

      <ScoreSection analise={analise} />

      <div className="w-full h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />

      <AnaliseAreaSection
        id="analise-criativos" label="Criativos"
        color="#8b5cf6" icon={Megaphone}
        section={analise.conteudo}
        isConteudo
      />

      <div className="w-full h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

      <AnaliseAreaSection
        id="analise-trafego" label="Tráfego Pago"
        color="#3b82f6" icon={TrendingUp}
        section={analise.trafego}
      />

      <div className="w-full h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

      <AnaliseAreaSection
        id="analise-web" label="Web"
        color="#22c55e" icon={Globe}
        section={analise.web}
      />

      <div className="w-full h-px bg-gradient-to-r from-transparent via-orange-500/40 to-transparent" />

      <AnaliseAreaSection
        id="analise-vendas" label="Vendas"
        color="#f97316" icon={ShoppingCart}
        section={analise.vendas}
      />

      <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <ResumoSection analise={analise} />

      {/* ══════════════════════════════════ */}
      {/* PARTE 2 — ESTRATÉGIA              */}
      {/* ══════════════════════════════════ */}
      <ParteDivisor
        id="parte2"
        numero="2"
        titulo="Estratégia & Próximas Ações"
        descricao="O que faremos — plano de criativos, campanhas, web e comercial para o próximo ciclo."
      />

      <ConteudoSection plano={plano} analise={analise} />

      <div className="w-full h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

      <TrafegoSection plano={plano} />

      <div className="w-full h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

      <WebSection plano={plano} />

      <div className="w-full h-px bg-gradient-to-r from-transparent via-orange-500/40 to-transparent" />

      <VendasSectionComp plano={plano} />

      <footer className="py-12 flex flex-col items-center gap-4 border-t border-white/5">
        <img src="/lovable-uploads/5765bdd4-e02b-42f0-b942-ad992bf21b09.png"
          alt="Logo" className="h-8 opacity-40" />
        <p className="text-gray-600 text-xs">Powered by No Excuse Digital</p>
      </footer>
    </div>
    </>
  );
}
