import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Target, Users, Lightbulb, Globe, DollarSign, TrendingUp, BarChart3,
  Trophy, Shield, Flame, Heart, ThumbsUp, ThumbsDown,
  Calendar, Sparkles, PenTool,
  CheckSquare, XSquare,
  ArrowRight,
} from "lucide-react";
import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, AreaChart, Area,
} from "recharts";

import { CHART_COLORS as THEME_COLORS, CHART_TICK_STYLE, CHART_GRID_COLOR, ChartTooltip } from "@/lib/chartTheme";
import { InfoTip, ScoreRing, TagList, ToolButton } from "./ClientePlanoMarketingHelpers";
import type {
  StrategyResult, ConcorrenteRow, CanalRow, PilarRow, CalendarioRow,
  IdeiaRow, ProjecaoRow, EstruturaRow, PlanoMesRow, PassoRow,
} from "./ClientePlanoMarketingTypes";

export const CHART_COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2, 160 60% 45%))", "hsl(var(--chart-3, 30 80% 55%))", "hsl(var(--chart-4, 280 65% 60%))", "hsl(var(--chart-5, 340 75% 55%))"];

/* ═══════════════ MARKETING: RESUMO ═══════════════ */

export function MktResumo({ result }: { result: StrategyResult }) {
  const diag = result.diagnostico || result.diagnostico_gps || {};
  const radar = diag.radar;
  const gpsRadarData = Array.isArray(diag.radar_data) ? diag.radar_data : [];
  const radarData = gpsRadarData.length > 0
    ? gpsRadarData.map((item) => ({ subject: item.eixo, value: item.score, max: item.max || 100 }))
    : radar ? [
        { subject: "Autoridade", value: radar.autoridade, max: 10 },
        { subject: "Aquisição", value: radar.aquisicao, max: 10 },
        { subject: "Conversão", value: radar.conversao, max: 10 },
        { subject: "Retenção", value: radar.retencao, max: 10 },
        { subject: "Conteúdo", value: radar.conteudo ?? 5, max: 10 },
        { subject: "Branding", value: radar.branding ?? 5, max: 10 },
      ] : [];
  const radarMax = radarData.length ? Math.max(...radarData.map((item) => item.max || 10)) : 10;
  const scoreGeral = diag.score_geral ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card className="col-span-2 lg:col-span-1 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4 flex flex-col items-center justify-center gap-1">
            <ScoreRing score={scoreGeral} label="Score Marketing" />
          </CardContent>
        </Card>
        {[
          { label: "Objetivo", value: result.objetivo_principal, icon: Target },
          { label: "Canal Prioritário", value: result.canal_prioritario, icon: BarChart3 },
          { label: "Investimento", value: result.investimento_recomendado, icon: DollarSign },
          { label: "Potencial", value: result.potencial_crescimento, icon: TrendingUp },
        ].map((kpi, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="h-full">
              <CardContent className="p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <kpi.icon className="w-4 h-4 text-primary" />
                  <span className="text-xs text-muted-foreground">{kpi.label}</span>
                </div>
                <p className="font-semibold text-sm">{kpi.value || "—"}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {radarData.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Radar Marketing (6D) <InfoTip text="Avalia 6 áreas-chave do seu marketing. Nota de 0 a 10." /></CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                  <defs>
                    <radialGradient id="radarGrad" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor={THEME_COLORS.purple} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={THEME_COLORS.purple} stopOpacity={0.05} />
                    </radialGradient>
                  </defs>
                  <PolarGrid stroke={CHART_GRID_COLOR} />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#888" }} />
                  <PolarRadiusAxis angle={90} domain={[0, radarMax]} tick={false} axisLine={false} />
                  <Radar name="Score" dataKey="value" stroke={THEME_COLORS.purple}
                    strokeWidth={2.5} fill="url(#radarGrad)" dot={{ r: 4, fill: THEME_COLORS.purple }} />
                  <Tooltip content={<ChartTooltip formatter={(v) => `${v}/${radarMax}`} />} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Diagnóstico</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">{diag.analise}</p>
            <div className="grid grid-cols-1 gap-3">
              {[
                { label: "Pontos Fortes", items: diag.pontos_fortes, icon: Trophy, color: "text-green-600" },
                { label: "Oportunidades", items: diag.oportunidades, icon: Lightbulb, color: "text-blue-600" },
                { label: "Riscos", items: diag.riscos, icon: Shield, color: "text-orange-600" },
              ].map((section, i) => section.items?.length > 0 && (
                <div key={i}>
                  <p className={`text-xs font-semibold ${section.color} mb-1 flex items-center gap-1`}>
                    <section.icon className="w-3 h-3" /> {section.label}
                  </p>
                  <TagList items={section.items} variant="outline" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {result.resumo_executivo && (
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{result.resumo_executivo}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ═══════════════ MARKETING: CLIENTE IDEAL ═══════════════ */

export function MktClienteIdeal({ result }: { result: StrategyResult }) {
  const icp = result.icp;
  const pv = result.proposta_valor;
  if (!icp) return null;

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-3xl">{icp.avatar_emoji || "👤"}</div>
            <div>
              <h3 className="font-bold text-lg">{icp.nome_persona || "Cliente Ideal"}</h3>
              <p className="text-sm text-muted-foreground">{icp.demografia}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{icp.perfil_profissional}</p>
            </div>
          </div>
        </div>
        <CardContent className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground">{icp.descricao}</p>
          {icp.comportamento_digital && (
            <div className="p-3 rounded-lg bg-muted/30">
              <p className="text-xs font-semibold mb-1 flex items-center gap-1"><Globe className="w-3 h-3" /> Comportamento Digital</p>
              <p className="text-sm">{icp.comportamento_digital}</p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { label: "Dores", items: icp.dores, icon: Flame, color: "text-red-500" },
              { label: "Desejos", items: icp.desejos, icon: Heart, color: "text-pink-500" },
              { label: "Objeções", items: icp.objecoes, icon: Shield, color: "text-orange-500" },
              { label: "Gatilhos de Compra", items: icp.gatilhos_compra, icon: Sparkles, color: "text-green-500" },
            ].map((section, i) => section.items?.length > 0 && (
              <div key={i} className="p-3 rounded-lg bg-muted/30">
                <p className={`text-xs font-semibold mb-1.5 flex items-center gap-1 ${section.color}`}>
                  <section.icon className="w-3 h-3" /> {section.label}
                </p>
                <div className="space-y-1">
                  {section.items.map((item: string, j: number) => (
                    <p key={j} className="text-xs flex items-start gap-1.5"><span className="text-muted-foreground mt-0.5">•</span> {item}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      {pv && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Target className="w-4 h-4 text-primary" /> Proposta de Valor</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {pv.headline && (
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-center">
                <p className="font-bold text-lg text-primary">"{pv.headline}"</p>
              </div>
            )}
            <div className="flex flex-col md:flex-row items-stretch gap-3">
              {[
                { label: "Problema", value: pv.problema, color: "bg-destructive/5 border-destructive/20 text-destructive" },
                { label: "Método", value: pv.metodo, color: "bg-primary/5 border-primary/20 text-primary" },
                { label: "Resultado", value: pv.resultado, color: "bg-green-500/5 border-green-500/20 text-green-600" },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-2 flex-1">
                  <div className={`flex-1 p-4 rounded-lg border text-center ${step.color}`}>
                    <p className="text-xs font-semibold mb-1">{step.label}</p>
                    <p className="text-sm text-foreground">{step.value}</p>
                  </div>
                  {i < 2 && <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 rotate-90 md:rotate-0" />}
                </div>
              ))}
            </div>
            {pv.prova && (
              <div className="p-3 rounded-lg bg-muted/30 text-center">
                <p className="text-xs font-semibold text-muted-foreground mb-0.5">Prova Social</p>
                <p className="text-sm">{pv.prova}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ═══════════════ MARKETING: CONCORRÊNCIA ═══════════════ */

export function MktConcorrencia({ result }: { result: StrategyResult }) {
  const ac = result.analise_concorrencia;
  if (!ac) return <p className="text-sm text-muted-foreground p-4">Análise de concorrência não disponível.</p>;
  return (
    <div className="space-y-4">
      <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground leading-relaxed">{ac.visao_geral}</p></CardContent></Card>
      {ac.concorrentes?.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ac.concorrentes.map((c, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="h-full"><CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">{i + 1}</div>
                  <h4 className="font-semibold text-sm">{c.nome}</h4>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start gap-2"><ThumbsUp className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" /><p className="text-xs">{c.pontos_fortes as string}</p></div>
                  <div className="flex items-start gap-2"><ThumbsDown className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" /><p className="text-xs">{c.pontos_fracos as string}</p></div>
                  <div className="flex items-start gap-2"><Lightbulb className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" /><p className="text-xs font-medium">{c.oportunidade_diferenciacao}</p></div>
                </div>
              </CardContent></Card>
            </motion.div>
          ))}
        </div>
      )}
      {ac.posicionamento_recomendado && (
        <Card className="border-primary/20 bg-primary/5"><CardContent className="p-4">
          <p className="text-xs font-semibold text-primary mb-1">Posicionamento Recomendado</p>
          <p className="text-sm">{ac.posicionamento_recomendado}</p>
        </CardContent></Card>
      )}
    </div>
  );
}

/* ═══════════════ MARKETING: TOM DE VOZ ═══════════════ */

export function MktTomVoz({ result }: { result: StrategyResult }) {
  const navigate = useNavigate();
  const tc = result.tom_comunicacao;
  if (!tc) return <p className="text-sm text-muted-foreground p-4">Tom de comunicação não disponível.</p>;
  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-r from-primary/10 to-transparent"><CardContent className="p-6 text-center">
        <p className="text-xs text-muted-foreground mb-1">Tom Principal</p>
        <h3 className="text-xl font-bold">{tc.tom_principal}</h3>
        {tc.personalidade_marca?.length > 0 && <div className="flex flex-wrap justify-center gap-2 mt-3">{tc.personalidade_marca.map((p, i) => <Badge key={i} className="text-xs">{p}</Badge>)}</div>}
      </CardContent></Card>
      {tc.voz_exemplo && <Card><CardContent className="p-4"><p className="text-xs font-semibold mb-2">Exemplo de como a marca fala:</p><div className="p-4 rounded-lg bg-muted/30 border-l-4 border-primary italic text-sm">{tc.voz_exemplo}</div></CardContent></Card>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card className="border-green-500/20"><CardContent className="p-4"><p className="text-xs font-semibold text-green-600 mb-2 flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> Palavras para USAR</p><TagList items={tc.palavras_usar} variant="outline" /></CardContent></Card>
        <Card className="border-destructive/20"><CardContent className="p-4"><p className="text-xs font-semibold text-destructive mb-2 flex items-center gap-1"><ThumbsDown className="w-3 h-3" /> Palavras para EVITAR</p><TagList items={tc.palavras_evitar} variant="outline" /></CardContent></Card>
      </div>
      {tc.exemplos_posts?.length > 0 && <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Exemplos de Posts</CardTitle></CardHeader><CardContent><div className="grid grid-cols-1 md:grid-cols-2 gap-3">{tc.exemplos_posts.map((ex, i) => <div key={i} className="p-3 rounded-lg bg-muted/30"><Badge variant="outline" className="text-[10px] mb-2 capitalize">{ex.tipo}</Badge><p className="text-sm">{ex.exemplo}</p></div>)}</div></CardContent></Card>}
      <Card className="border-primary/20 bg-primary/5"><CardContent className="p-4 flex items-center justify-between"><div><p className="text-sm font-medium">Aplique esse tom nos seus scripts</p><p className="text-xs text-muted-foreground">Use as dores, objeções e gatilhos do ICP para criar scripts de venda</p></div><Button size="sm" className="gap-1.5" onClick={() => navigate("/cliente/scripts")}><PenTool className="w-3.5 h-3.5" /> Gerar Scripts</Button></CardContent></Card>
    </div>
  );
}

/* ═══════════════ MARKETING: AQUISIÇÃO ═══════════════ */

export function MktAquisicao({ result }: { result: StrategyResult }) {
  const navigate = useNavigate();
  const ea = result.estrategia_aquisicao;
  const funil = ea?.funil;
  const pieData = (ea?.canais_prioritarios || []).reduce((acc: { name: string; value: number }[], c: CanalRow) => {
    const tipo = c.tipo === "organico" ? "Orgânico" : c.tipo === "pago" ? "Tráfego Pago" : "Parcerias";
    const existing = acc.find(a => a.name === tipo);
    if (existing) existing.value += (c.percentual || 0); else acc.push({ name: tipo, value: c.percentual || 0 });
    return acc;
  }, []);
  const funnelData = funil ? [
    { name: "Visitantes", value: funil.topo?.estimativa_visitantes || 0, fill: CHART_COLORS[0] },
    { name: "Leads", value: funil.meio?.estimativa_leads || 0, fill: CHART_COLORS[1] },
    { name: "Clientes", value: funil.fundo?.estimativa_clientes || 0, fill: CHART_COLORS[2] },
  ] : [];
  return (
    <div className="space-y-4">
      {funnelData.length > 0 && <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Funil de Aquisição</CardTitle></CardHeader><CardContent><div className="flex flex-col items-center gap-2 py-4">{funnelData.map((stage, i) => <motion.div key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.2 }} className="text-center rounded-xl py-3 px-6 text-sm font-medium" style={{ width: `${100 - i * 20}%`, background: `hsl(var(--primary) / ${0.15 + i * 0.1})`, border: `1px solid hsl(var(--primary) / ${0.3 + i * 0.1})` }}><span className="font-bold text-lg">{stage.value.toLocaleString("pt-BR")}</span><span className="text-xs text-muted-foreground ml-2">{stage.name}</span></motion.div>)}</div></CardContent></Card>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pieData.length > 0 && <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Distribuição de Canais</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={220}><PieChart><Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}%`}>{pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></CardContent></Card>}
        {ea?.canais_prioritarios?.length > 0 && <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Canais Prioritários</CardTitle></CardHeader><CardContent><div className="space-y-2">{ea.canais_prioritarios.map((c, i) => <div key={i} className="p-3 rounded-lg bg-muted/30"><div className="flex items-center justify-between mb-1"><Badge variant="outline" className="text-xs">{c.nome}</Badge><span className="text-xs font-bold">{c.percentual}%</span></div><Progress value={c.percentual} className="h-1.5 mb-1" /><p className="text-xs text-muted-foreground">{c.acao_principal}</p></div>)}</div></CardContent></Card>}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card className="border-primary/20 bg-primary/5"><CardContent className="p-4 flex items-center justify-between"><div><p className="text-sm font-medium">Configurar Tráfego Pago</p><p className="text-xs text-muted-foreground">Aplique os canais na estratégia de anúncios</p></div><Button size="sm" className="gap-1.5" onClick={() => navigate("/cliente/trafego-pago")}>Ir</Button></CardContent></Card>
        <Card className="border-primary/20 bg-primary/5"><CardContent className="p-4 flex items-center justify-between"><div><p className="text-sm font-medium">Abrir CRM</p><p className="text-xs text-muted-foreground">Gerencie leads do funil de aquisição</p></div><Button size="sm" className="gap-1.5" onClick={() => navigate("/cliente/crm")}>Ir</Button></CardContent></Card>
      </div>
    </div>
  );
}

/* ═══════════════ MARKETING: CONTEÚDO ═══════════════ */

export function MktConteudo({ result }: { result: StrategyResult }) {
  const navigate = useNavigate();
  const ec = result.estrategia_conteudo;
  const pilarIcons: Record<string, React.ElementType> = { educacao: Lightbulb, autoridade: Target, prova_social: Users, oferta: DollarSign };
  return (
    <div className="space-y-4">
      {ec?.pilares?.length > 0 && <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{ec.pilares.map((p, i) => { const Icon = pilarIcons[p.tipo || ""] || Lightbulb; return (<motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}><Card className="h-full"><CardContent className="p-4"><div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><Icon className="w-4 h-4 text-primary" /></div><div><p className="font-semibold text-sm">{p.nome}</p><Badge variant="outline" className="text-[10px] capitalize">{p.tipo?.replace("_", " ")}</Badge></div></div>{p.percentual && <span className="text-lg font-bold text-primary">{p.percentual}%</span>}</div><Progress value={p.percentual || 25} className="h-1.5 mb-2" /><p className="text-xs text-muted-foreground mb-2">{p.descricao}</p><TagList items={p.exemplos} variant="secondary" /></CardContent></Card></motion.div>); })}</div>}
      {ec?.calendario_semanal?.length > 0 && <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" /> Calendário Semanal</CardTitle></CardHeader><CardContent><div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-2">{ec.calendario_semanal.map((dia, i) => <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} className="p-3 rounded-lg bg-muted/30 text-center border hover:border-primary/30 transition-colors"><p className="text-xs font-bold text-primary">{dia.dia}</p><Badge variant="outline" className="text-[9px] mt-1">{dia.formato}</Badge><p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{String(dia.sugestao ?? "")}</p></motion.div>)}</div></CardContent></Card>}
      {ec?.ideias_conteudo?.length > 0 && <Card><CardHeader className="pb-2 flex flex-row items-center justify-between"><CardTitle className="text-sm">Ideias de Conteúdo ({ec.ideias_conteudo.length})</CardTitle><Button size="sm" className="gap-1.5" onClick={() => navigate("/cliente/conteudos")}><Sparkles className="w-3.5 h-3.5" /> Gerar Conteúdos</Button></CardHeader><CardContent><div className="space-y-2">{ec.ideias_conteudo.map((idea, i) => <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30"><Badge variant="outline" className="text-[10px] shrink-0">{idea.formato}</Badge><span className="text-xs flex-1">{idea.titulo}</span><Badge variant="secondary" className="text-[10px]">{String(idea.etapa_funil ?? "")}</Badge></div>)}</div></CardContent></Card>}
    </div>
  );
}

/* ═══════════════ MARKETING: PROJEÇÃO ═══════════════ */

export function MktProjecao({ result }: { result: StrategyResult }) {
  const pc = result.plano_crescimento;
  const projecoes = pc?.projecoes_mensais || [];
  const ind = pc?.indicadores;
  const bench = result.benchmarks_setor;
  const chartData = projecoes.map((p) => ({ name: `Mês ${p.mes}`, leads: p.leads, clientes: String(p.clientes ?? ""), receita: p.receita, investimento: p.investimento }));
  return (
    <div className="space-y-4">
      {ind && <div className="grid grid-cols-2 md:grid-cols-5 gap-3">{[{ label: "CPC Médio", value: ind.cpc_medio, tip: "Custo Por Clique." }, { label: "CPL", value: ind.cpl_estimado, tip: "Custo Por Lead." }, { label: "CAC", value: ind.cac_estimado, tip: "Custo de Aquisição de Cliente." }, { label: "ROI", value: ind.roi_esperado, tip: "Retorno sobre Investimento." }, { label: "LTV", value: ind.ltv_estimado || "—", tip: "Lifetime Value." }].map((kpi, i) => <Card key={i}><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">{kpi.label} <InfoTip text={kpi.tip} /></p><p className="font-bold text-sm mt-0.5">{String(kpi.value ?? "—")}</p></CardContent></Card>)}</div>}
      {chartData.length > 0 && <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Leads & Clientes</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="areaLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={THEME_COLORS.purple} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={THEME_COLORS.purple} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_COLOR} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#888" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#888" }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="leads" stroke={THEME_COLORS.purple}
                  strokeWidth={2.5} fill="url(#areaLeads)" name="Leads" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Receita vs Investimento</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_COLOR} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#888" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#888" }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `R$ ${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTooltip formatter={(v) => `R$ ${Number(v).toLocaleString("pt-BR")}`} />} />
                <Bar dataKey="receita" name="Receita" fill={THEME_COLORS.purple} radius={[6,6,0,0]} />
                <Bar dataKey="investimento" name="Investimento" fill={THEME_COLORS.teal} radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>}
      {bench && <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" /> Benchmarks: {bench.setor}</CardTitle></CardHeader><CardContent className="space-y-3"><div className="grid grid-cols-2 md:grid-cols-3 gap-3"><div className="p-3 rounded-lg bg-muted/30 text-center"><p className="text-xs text-muted-foreground">Taxa Conversão</p><p className="font-bold text-sm">{bench.taxa_conversao_media}</p></div><div className="p-3 rounded-lg bg-muted/30 text-center"><p className="text-xs text-muted-foreground">CPL Médio</p><p className="font-bold text-sm">{bench.cpl_medio_setor}</p></div><div className="p-3 rounded-lg bg-muted/30 text-center"><p className="text-xs text-muted-foreground">Ticket Médio</p><p className="font-bold text-sm">{bench.ticket_medio_setor}</p></div></div>{bench.tendencias?.length > 0 && <div><p className="text-xs font-semibold mb-1.5">Tendências do Setor</p><TagList items={bench.tendencias} variant="outline" /></div>}{bench.insight_competitivo && <div className="p-3 rounded-lg bg-primary/5 border border-primary/20"><p className="text-xs font-semibold text-primary mb-0.5">Insight</p><p className="text-sm">{bench.insight_competitivo}</p></div>}</CardContent></Card>}
    </div>
  );
}

/* ═══════════════ MARKETING: EXECUÇÃO ═══════════════ */

export function MktExecucao({ result }: { result: StrategyResult }) {
  const plano = result.plano_execucao || [];
  const estrutura = result.estrutura_recomendada || [];
  return (
    <div className="space-y-4">
      {(estrutura as EstruturaRow[]).length > 0 && <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Checklist de Estrutura</CardTitle></CardHeader><CardContent><div className="space-y-2">{(estrutura as EstruturaRow[]).map((e, i) => <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">{e.status === "tem" ? <CheckSquare className="w-4 h-4 text-green-500 shrink-0" /> : <XSquare className="w-4 h-4 text-destructive shrink-0" />}<div className="flex-1 min-w-0"><div className="flex items-center gap-2"><p className="text-sm font-medium">{e.titulo}</p><Badge variant={e.prioridade === "alta" ? "destructive" : e.prioridade === "media" ? "secondary" : "outline"} className="text-[10px]">{e.prioridade}</Badge></div><p className="text-xs text-muted-foreground">{e.recomendacao}</p></div></div>)}</div></CardContent></Card>}
      {(plano as PlanoMesRow[]).length > 0 && <div className="space-y-3">{(plano as PlanoMesRow[]).map((mes, i) => <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.15 }}><Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">{mes.mes}</div>{mes.titulo}</CardTitle></CardHeader><CardContent><div className="space-y-2">{mes.passos?.map((passo, j) => <div key={j} className="flex items-center justify-between gap-3 p-2 rounded-lg bg-muted/30"><div className="flex items-center gap-2 flex-1 min-w-0"><span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">{j + 1}</span><span className="text-xs">{passo.titulo}</span></div><ToolButton ferramenta={passo.ferramenta || ""} /></div>)}</div></CardContent></Card></motion.div>)}</div>}
    </div>
  );
}
