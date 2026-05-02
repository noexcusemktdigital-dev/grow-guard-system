import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Target, Lightbulb, TrendingUp, AlertTriangle, CheckCircle, CheckSquare,
} from "lucide-react";
import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, AreaChart, Area,
} from "recharts";

import { CHART_COLORS as THEME_COLORS, CHART_GRID_COLOR, ChartTooltip } from "@/lib/chartTheme";
import { InfoTip } from "./ClientePlanoMarketingHelpers";
import { CHART_COLORS } from "./ClientePlanoMarketingMktSections";

export interface DiagnosticoComercial {
  score_comercial?: number;
  nivel?: string;
  analise?: string;
  radar_comercial?: Array<{ eixo: string; score: number; max?: number }> | Record<string, number>;
  insights?: Array<string | { tipo?: string; type?: string; texto?: string; descricao?: string; titulo?: string }>;
  gaps?: Array<string | { texto?: string; descricao?: string; titulo?: string }>;
  funil_reverso?: Record<string, number | string>;
  projecao_leads?: Array<{ mes?: string; periodo?: string; atual?: number; com_estrategia?: number; projetado?: number }>;
  projecao_receita?: Array<{ mes?: string; periodo?: string; atual?: number; com_estrategia?: number; projetado?: number }>;
  plano_acao?: Array<{ fase?: string; titulo?: string; periodo?: string; items?: Array<string | Record<string, string>>; acoes?: Array<string | Record<string, string>>; descricao?: string }>;
  estrategias_vendas?: Array<{ titulo?: string; nome?: string; descricao?: string; passos?: Array<string | { acao?: string; titulo?: string }>; resultado_esperado?: string }>;
  [key: string]: unknown;
}

/* ═══════════════ COMERCIAL: NIVEIS & HELPER ═══════════════ */

export const COMERCIAL_NIVEIS = [
  { id: 1, label: "Crítico", range: "0-25%", cor: "#dc2626" },
  { id: 2, label: "Básico", range: "26-50%", cor: "#ea580c" },
  { id: 3, label: "Intermediário", range: "51-75%", cor: "#eab308" },
  { id: 4, label: "Avançado", range: "76-100%", cor: "#16a34a" },
];

export function getComercialNivel(score: number) {
  if (score >= 76) return COMERCIAL_NIVEIS[3];
  if (score >= 51) return COMERCIAL_NIVEIS[2];
  if (score >= 26) return COMERCIAL_NIVEIS[1];
  return COMERCIAL_NIVEIS[0];
}

/* ═══════════════ COMERCIAL: SCORE & RADAR ═══════════════ */

export function ComScoreRadar({ dc }: { dc: DiagnosticoComercial }) {
  if (!dc) return <p className="text-sm text-muted-foreground p-4">Diagnóstico comercial não disponível.</p>;

  const radarComercial = dc.radar_comercial;
  const radarData = Array.isArray(radarComercial)
    ? radarComercial.map((item) => ({
        subject: item.eixo,
        value: Number(item.score) || 0,
        max: Number(item.max) || 100,
      }))
    : radarComercial
      ? Object.entries(radarComercial).map(([key, val]) => ({
          subject: key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
          value: val as number,
          max: 10,
        }))
      : [];
  const radarMax = radarData.length ? Math.max(...radarData.map((item) => item.max || 10)) : 10;

  const score = dc.score_comercial ?? 0;
  const nivel = getComercialNivel(score);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Thermometer Card */}
        <Card>
          <CardContent className="p-6">
            {/* Score display */}
            <div className="text-center mb-6">
              <p className="text-5xl font-black" style={{ color: nivel.cor }}>{score}<span className="text-lg text-muted-foreground font-normal">/100</span></p>
              <Badge className="mt-2 text-sm px-4 py-1 text-white" style={{ backgroundColor: nivel.cor }}>
                {String(nivel.id).padStart(2, "0")} — {nivel.label.toUpperCase()}
              </Badge>
              {dc.analise && <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{dc.analise}</p>}
            </div>

            {/* Thermometer bar */}
            <div className="relative">
              <div className="h-6 rounded-full overflow-hidden" style={{ background: "linear-gradient(90deg, #dc2626 0%, #ea580c 33%, #eab308 66%, #16a34a 100%)" }}>
                <motion.div
                  className="absolute top-0 w-1.5 h-6 bg-foreground rounded-full shadow-lg"
                  initial={{ left: "2%" }}
                  animate={{ left: `${Math.min(Math.max(score, 2), 98)}%` }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  style={{ transform: "translateX(-50%)" }}
                />
              </div>
              {/* Phase markers */}
              <div className="flex justify-between mt-2">
                {COMERCIAL_NIVEIS.map(n => (
                  <div key={n.id} className={`text-center flex-1 transition-opacity ${nivel.id === n.id ? "opacity-100" : "opacity-40"}`}>
                    <div className="w-0.5 h-2 mx-auto mb-1" style={{ backgroundColor: n.cor }} />
                    <p className="text-[10px] font-bold" style={{ color: n.cor }}>{n.label}</p>
                    <p className="text-[9px] text-muted-foreground">{n.range}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Radar */}
        {radarData.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Radar Comercial (5 eixos) <InfoTip text="Processo, gestão de leads, ferramentas, canais e performance." /></CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                  <defs>
                    <radialGradient id="radarGradCom" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor={THEME_COLORS.teal} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={THEME_COLORS.teal} stopOpacity={0.05} />
                    </radialGradient>
                  </defs>
                  <PolarGrid stroke={CHART_GRID_COLOR} />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#888" }} />
                  <PolarRadiusAxis angle={90} domain={[0, radarMax]} tick={false} axisLine={false} />
                  <Radar name="Score" dataKey="value" stroke={THEME_COLORS.teal}
                    strokeWidth={2.5} fill="url(#radarGradCom)" dot={{ r: 4, fill: THEME_COLORS.teal }} />
                  <Tooltip content={<ChartTooltip formatter={(v) => `${v}/${radarMax}`} />} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Gaps */}
      {dc.gaps?.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-orange-500" /> Gaps Identificados</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {dc.gaps.map((gap, i) => (
                <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-orange-500/5 border border-orange-500/15">
                  <AlertTriangle className="w-3.5 h-3.5 text-orange-500 mt-0.5 shrink-0" />
                  <p className="text-xs">{typeof gap === "string" ? gap : gap.texto || gap.descricao || gap.titulo || JSON.stringify(gap)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ═══════════════ COMERCIAL: FUNIL REVERSO ═══════════════ */

export function ComFunilReverso({ dc }: { dc: DiagnosticoComercial }) {
  const funilReverso = dc.funil_reverso;
  if (!funilReverso) return <p className="text-sm text-muted-foreground p-4">Funil reverso não disponível.</p>;

  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> Funil Reverso <InfoTip text="Partindo da meta de receita, calcula quantas vendas, propostas, reuniões e leads são necessários." /></CardTitle></CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-2 py-4">
          {Object.entries(funilReverso).map(([key, val], i, arr) => (
            <motion.div key={key} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.15 }}
              className="text-center rounded-xl py-3 px-6 text-sm font-medium"
              style={{ width: `${100 - i * (60 / arr.length)}%`, background: `hsl(var(--primary) / ${0.1 + i * 0.08})`, border: `1px solid hsl(var(--primary) / ${0.2 + i * 0.1})` }}>
              <span className="font-bold text-lg">{typeof val === "number" ? val.toLocaleString("pt-BR") : val as string}</span>
              <span className="text-xs text-muted-foreground ml-2 capitalize">{key.replace(/_/g, " ")}</span>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ═══════════════ COMERCIAL: INSIGHTS ═══════════════ */

export function ComInsights({ dc }: { dc: DiagnosticoComercial }) {
  const insights = dc.insights || [];
  if (!insights.length) return <p className="text-sm text-muted-foreground p-4">Nenhum insight disponível.</p>;

  const iconMap: Record<string, { icon: React.ElementType; cls: string }> = {
    success: { icon: CheckCircle, cls: "text-green-600 border-green-500/20 bg-green-500/5" },
    sucesso: { icon: CheckCircle, cls: "text-green-600 border-green-500/20 bg-green-500/5" },
    warning: { icon: AlertTriangle, cls: "text-orange-600 border-orange-500/20 bg-orange-500/5" },
    alerta: { icon: AlertTriangle, cls: "text-orange-600 border-orange-500/20 bg-orange-500/5" },
    opportunity: { icon: Lightbulb, cls: "text-blue-600 border-blue-500/20 bg-blue-500/5" },
    oportunidade: { icon: Lightbulb, cls: "text-blue-600 border-blue-500/20 bg-blue-500/5" },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {insights.map((insight, i) => {
        const text = typeof insight === "string" ? insight : insight.texto || insight.descricao || insight.titulo || (typeof insight === "object" ? JSON.stringify(insight) : String(insight));
        const tipo = typeof insight === "object" ? (insight.tipo || insight.type || "info") : "info";
        const { icon: Icon, cls } = iconMap[tipo] || { icon: Lightbulb, cls: "text-muted-foreground border-muted bg-muted/30" };

        return (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Card className={`border ${cls} h-full`}>
              <CardContent className="p-4 flex items-start gap-3">
                <Icon className="w-4 h-4 mt-0.5 shrink-0" />
                <p className="text-sm leading-relaxed text-foreground">{text}</p>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ═══════════════ COMERCIAL: ESTRATÉGIAS ═══════════════ */

export function ComEstrategias({ dc }: { dc: DiagnosticoComercial }) {
  const estrategias = dc.estrategias_vendas || [];
  if (!estrategias.length) return <p className="text-sm text-muted-foreground p-4">Estratégias de vendas não disponíveis.</p>;

  return (
    <div className="space-y-3">
      {estrategias.map((est, i) => (
        <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</div>
                <p className="font-semibold text-sm">{est.titulo || est.nome || `Estratégia ${i + 1}`}</p>
              </div>
              {est.descricao && <p className="text-xs text-muted-foreground mb-3">{est.descricao}</p>}
              {est.passos?.length > 0 && (
                <div className="space-y-1.5 ml-11">
                  {est.passos.map((p, j) => (
                    <p key={j} className="text-xs flex items-start gap-1.5">
                      <span className="text-primary font-bold">{j + 1}.</span>
                      {typeof p === "string" ? p : p.acao || p.titulo || JSON.stringify(p)}
                    </p>
                  ))}
                </div>
              )}
              {est.resultado_esperado && (
                <div className="mt-3 p-2 rounded bg-green-500/5 border border-green-500/20 ml-11">
                  <p className="text-xs text-green-700">✓ {est.resultado_esperado}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

/* ═══════════════ COMERCIAL: PROJEÇÕES ═══════════════ */

export function ComProjecoes({ dc }: { dc: DiagnosticoComercial }) {
  const hasLeads = dc.projecao_leads?.length > 0;
  const hasReceita = dc.projecao_receita?.length > 0;
  if (!hasLeads && !hasReceita) return <p className="text-sm text-muted-foreground p-4">Projeções não disponíveis.</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {hasLeads && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Projeção de Leads</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={dc.projecao_leads.map((p) => ({ name: p.mes || p.periodo, atual: p.atual, estrategia: p.com_estrategia || p.projetado }))}>
                <defs>
                  <linearGradient id="areaAtual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={THEME_COLORS.teal} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={THEME_COLORS.teal} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="areaEstrategia" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={THEME_COLORS.purple} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={THEME_COLORS.purple} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_COLOR} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#888" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#888" }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="atual" name="Atual" stroke={THEME_COLORS.teal} strokeWidth={2} fill="url(#areaAtual)" />
                <Area type="monotone" dataKey="estrategia" name="Com Estratégia" stroke={THEME_COLORS.purple} strokeWidth={2.5} fill="url(#areaEstrategia)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
      {hasReceita && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Projeção de Receita</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={dc.projecao_receita.map((p) => ({ name: p.mes || p.periodo, atual: p.atual, estrategia: p.com_estrategia || p.projetado }))}>
                <defs>
                  <linearGradient id="areaRecAtual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={THEME_COLORS.teal} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={THEME_COLORS.teal} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="areaRecEstrategia" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={THEME_COLORS.purple} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={THEME_COLORS.purple} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_COLOR} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#888" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#888" }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTooltip formatter={(v) => `R$ ${Number(v).toLocaleString("pt-BR")}`} />} />
                <Area type="monotone" dataKey="atual" name="Atual" stroke={THEME_COLORS.teal} strokeWidth={2} fill="url(#areaRecAtual)" />
                <Area type="monotone" dataKey="estrategia" name="Com Estratégia" stroke={THEME_COLORS.purple} strokeWidth={2.5} fill="url(#areaRecEstrategia)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ═══════════════ COMERCIAL: PLANO DE AÇÃO ═══════════════ */

export function ComPlanoAcao({ dc }: { dc: DiagnosticoComercial }) {
  const planoAcao = dc.plano_acao || [];
  if (!planoAcao.length) return <p className="text-sm text-muted-foreground p-4">Plano de ação não disponível.</p>;

  const TIMELINE_COLORS = ["border-blue-500 bg-blue-500", "border-amber-500 bg-amber-500", "border-green-500 bg-green-500", "border-purple-500 bg-purple-500"];

  return (
    <div className="space-y-0 relative">
      {/* Vertical timeline line */}
      <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-border" />

      {planoAcao.map((fase, i) => {
        const items = fase.items || fase.acoes || [];
        const periodo = fase.periodo || `${(i + 1) * 30} dias`;
        const titulo = fase.fase || fase.titulo || `Fase ${i + 1}`;
        const colorSet = TIMELINE_COLORS[i % TIMELINE_COLORS.length];
        const [borderCls, bgCls] = colorSet.split(" ");

        return (
          <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.15 }} className="relative pl-12 pb-6">
            {/* Timeline dot */}
            <div className={`absolute left-2.5 top-1 w-5 h-5 rounded-full border-2 ${borderCls} ${bgCls} flex items-center justify-center z-10`}>
              <span className="text-[9px] font-bold text-white">{i + 1}</span>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-[10px] font-bold">{periodo}</Badge>
                <h4 className="text-sm font-semibold">{titulo}</h4>
              </div>

              {items.length > 0 ? (
                <div className="space-y-1.5">
                  {items.map((acao, j) => {
                    const text = typeof acao === "string" ? acao : acao.acao || acao.titulo || acao.texto || JSON.stringify(acao);
                    return (
                      <div key={j} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30">
                        <CheckSquare className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                        <span className="text-xs">{text}</span>
                      </div>
                    );
                  })}
                </div>
              ) : fase.descricao ? (
                <p className="text-xs text-muted-foreground">{fase.descricao}</p>
              ) : null}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
