// @ts-nocheck
import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
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
        Análise de performance e planejamento estratégico completo para o próximo ciclo.
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

/* ── ANÁLISE GERAL ── */
function AnaliseSection({ analise }: { analise: FollowupAnalise }) {
  const areas = [
    { name: "Conteúdo", data: analise.conteudo, color: "#8b5cf6", icon: Megaphone },
    { name: "Tráfego", data: analise.trafego, color: "#3b82f6", icon: TrendingUp },
    { name: "Web", data: analise.web, color: "#22c55e", icon: Globe },
    { name: "Vendas", data: analise.vendas, color: "#f97316", icon: ShoppingCart },
  ];

  const radarData = areas.map((a) => {
    const m = a.data?.metricas || {};
    const vals = Object.values(m).filter((v) => typeof v === "number" && v > 0);
    const avg = vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
    return { area: a.name, valor: Math.min(avg, 100) };
  });

  const hasRadar = radarData.some((d) => d.valor > 0);

  return (
    <Section id="analise">
      <SectionLabel text="Análise de Performance" />
      <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Visão Geral do Mês</h2>
      <p className="text-gray-400 mb-12 max-w-2xl">
        Performance consolidada das 4 áreas estratégicas com métricas e indicadores do período.
      </p>

      {hasRadar && (
        <div className="flex justify-center mb-16">
          <div className="w-full max-w-lg">
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#333" />
                <PolarAngleAxis dataKey="area" tick={{ fill: "#ccc", fontSize: 14 }} />
                <PolarRadiusAxis tick={{ fill: "#666", fontSize: 12 }} domain={[0, 100]} />
                <Radar dataKey="valor" stroke="#ef4444" fill="#ef4444" fillOpacity={0.25} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {areas.map((a) => {
          const m = a.data?.metricas || {};
          const entries = Object.entries(m).filter(([, v]) => (v as number) > 0);
          const Icon = a.icon;
          return (
            <motion.div
              key={a.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-white/[0.03] border border-white/10 rounded-2xl p-8"
              style={{ borderLeftColor: a.color, borderLeftWidth: 4 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: a.color + "20" }}>
                  <Icon className="w-5 h-5" style={{ color: a.color }} />
                </div>
                <h3 className="text-xl font-bold text-white">{a.name}</h3>
              </div>

              {entries.length > 0 ? (
                <div className="space-y-3">
                  {entries.map(([k, v]) => (
                    <div key={k} className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">{k}</span>
                      <span className="text-white font-semibold text-lg">{fmt(v as number)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-sm">Sem métricas registradas</p>
              )}

              {((a.data?.positivos?.filter(Boolean).length ?? 0) > 0 || (a.data?.negativos?.filter(Boolean).length ?? 0) > 0) && (
                <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-green-400 text-xs font-semibold uppercase tracking-wider mb-2">Positivos</p>
                    {a.data?.positivos?.filter(Boolean).map((p, i) => (
                      <p key={i} className="text-gray-300 text-sm mb-1">• {p}</p>
                    ))}
                  </div>
                  <div>
                    <p className="text-red-400 text-xs font-semibold uppercase tracking-wider mb-2">A Melhorar</p>
                    {a.data?.negativos?.filter(Boolean).map((p, i) => (
                      <p key={i} className="text-gray-300 text-sm mb-1">• {p}</p>
                    ))}
                  </div>
                </div>
              )}

              {a.name === "Conteúdo" && (analise.conteudo?.imagens?.filter(Boolean)?.length ?? 0) > 0 && (
                <div className="mt-6 pt-6 border-t border-white/10">
                  <p className="text-xs text-violet-400 font-semibold uppercase tracking-wider mb-3">Criativos em Veiculação</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {analise.conteudo!.imagens!.filter(Boolean).map((url, idx) => (
                      <img key={idx} src={url} alt={`Criativo ${idx + 1}`} className="rounded-xl border border-white/10 w-full object-cover aspect-square" />
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
      <div className="space-y-6">
        {pautas.map((p, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className="bg-white/[0.03] border border-white/10 rounded-2xl p-8"
            style={{ borderLeftColor: p.tipo === "organico" ? "#22c55e" : "#3b82f6", borderLeftWidth: 4 }}
          >
            <div className="flex justify-between items-start mb-4">
              <h4 className="text-xl font-bold text-white">{p.titulo || `Pauta ${i + 1}`}</h4>
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${p.tipo === "organico" ? "bg-green-500/20 text-green-400" : "bg-blue-500/20 text-blue-400"}`}>
                {p.tipo === "organico" ? "Orgânico" : "Pago"}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {p.formato && <div><span className="text-gray-500">Formato</span><p className="text-gray-200 font-medium">{p.formato}</p></div>}
              {p.plataforma && <div><span className="text-gray-500">Plataforma</span><p className="text-gray-200 font-medium">{p.plataforma}</p></div>}
              {p.tempo_duracao && <div><span className="text-gray-500">Duração</span><p className="text-gray-200 font-medium">{p.tempo_duracao}</p></div>}
              {p.data_postagem && <div><span className="text-gray-500">Data</span><p className="text-gray-200 font-medium">{p.data_postagem}</p></div>}
            </div>
            {p.objetivo && <p className="text-gray-400 mt-4 text-sm"><span className="text-gray-500">Objetivo:</span> {p.objetivo}</p>}
            {p.roteiro && <p className="text-gray-400 mt-2 text-sm"><span className="text-gray-500">Roteiro:</span> {p.roteiro}</p>}
            {p.cta && <p className="text-gray-400 mt-2 text-sm"><span className="text-gray-500">CTA:</span> {p.cta}</p>}
            {p.necessidades_cliente && <p className="text-yellow-400/80 mt-2 text-sm"><span className="text-gray-500">Necessidade do cliente:</span> {p.necessidades_cliente}</p>}
          </motion.div>
        ))}
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

  const sections = [
    { id: "analise", label: "Análise" },
    { id: "conteudo", label: "Conteúdo" },
    { id: "trafego", label: "Tráfego" },
    { id: "web", label: "Web" },
    { id: "vendas", label: "Vendas" },
    { id: "resumo", label: "Resumo" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white scroll-smooth">
      <NavDots sections={sections} />

      <HeroSection clientName={followup.client_name} monthRef={followup.month_ref} />

      <div className="w-full h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />

      <AnaliseSection analise={analise} />

      <div className="w-full h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />

      <ConteudoSection plano={plano} analise={analise} />

      <div className="w-full h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

      <TrafegoSection plano={plano} />

      <div className="w-full h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

      <WebSection plano={plano} />

      <div className="w-full h-px bg-gradient-to-r from-transparent via-orange-500/40 to-transparent" />

      <VendasSectionComp plano={plano} />

      <div className="w-full h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />

      <ResumoSection analise={analise} />

      {/* Footer */}
      <footer className="py-12 flex flex-col items-center gap-4 border-t border-white/5">
        <img src="/lovable-uploads/5765bdd4-e02b-42f0-b942-ad992bf21b09.png" alt="Logo" className="h-8 opacity-40" />
        <p className="text-gray-600 text-xs">Powered by No Excuse Digital</p>
      </footer>
    </div>
  );
}
