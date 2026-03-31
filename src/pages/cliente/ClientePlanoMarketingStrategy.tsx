// @ts-nocheck
import { useState } from "react";
import type { ClientePlanoVendasMetasProps } from "./ClientePlanoVendasMetas";
import { useNavigate } from "react-router-dom";
import {
  Sparkles, CheckCircle2, RotateCcw, Clock, Target, Users, Lightbulb, HelpCircle,
  Globe, DollarSign, TrendingUp, BarChart3, ArrowRight,
  FileText, Palette, Monitor, Zap, PenTool,
  CheckSquare, XSquare, MessageSquare,
  Trophy, Shield, Flame, Heart, ThumbsUp, ThumbsDown,
  Calendar, Briefcase, AlertTriangle, CheckCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, AreaChart, Area,
} from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { ScoreRing, TagList, ToolButton } from "./ClientePlanoMarketingHelpers";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

function InfoTip({ text }: { text: string }) {
  return (
    <TooltipProvider delayDuration={200}>
      <UITooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="w-3.5 h-3.5 text-muted-foreground/60 hover:text-muted-foreground cursor-help inline-block ml-1.5" />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[260px] text-xs leading-relaxed">
          {text}
        </TooltipContent>
      </UITooltip>
    </TooltipProvider>
  );
}
import type {
  StrategyResult, ConcorrenteRow, CanalRow, PilarRow, CalendarioRow,
  IdeiaRow, ProjecaoRow, EstruturaRow, PlanoMesRow, PassoRow, HistoryStrategy,
} from "./ClientePlanoMarketingTypes";

const CHART_COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2, 160 60% 45%))", "hsl(var(--chart-3, 30 80% 55%))", "hsl(var(--chart-4, 280 65% 60%))", "hsl(var(--chart-5, 340 75% 55%))"];

/* ═══════════════ MARKETING: RESUMO ═══════════════ */

function MktResumo({ result }: { result: StrategyResult }) {
  const radar = result.diagnostico?.radar;
  const radarData = radar ? [
    { subject: "Autoridade", value: radar.autoridade },
    { subject: "Aquisição", value: radar.aquisicao },
    { subject: "Conversão", value: radar.conversao },
    { subject: "Retenção", value: radar.retencao },
    { subject: "Conteúdo", value: radar.conteudo ?? 5 },
    { subject: "Branding", value: radar.branding ?? 5 },
  ] : [];
  const scoreGeral = result.diagnostico?.score_geral ?? 0;

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {radarData.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Radar Marketing (6D) <InfoTip text="Avalia 6 áreas-chave do seu marketing. Nota de 0 a 10." /></CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fontSize: 9 }} />
                  <Radar name="Score" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.25} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Diagnóstico</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">{result.diagnostico?.analise}</p>
            <div className="grid grid-cols-1 gap-3">
              {[
                { label: "Pontos Fortes", items: result.diagnostico?.pontos_fortes, icon: Trophy, color: "text-green-600" },
                { label: "Oportunidades", items: result.diagnostico?.oportunidades, icon: Lightbulb, color: "text-blue-600" },
                { label: "Riscos", items: result.diagnostico?.riscos, icon: Shield, color: "text-orange-600" },
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

function MktClienteIdeal({ result }: { result: StrategyResult }) {
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
function MktConcorrencia({ result }: { result: StrategyResult }) {
  const ac = result.analise_concorrencia;
  if (!ac) return <p className="text-sm text-muted-foreground p-4">Análise de concorrência não disponível.</p>;
  return (
    <div className="space-y-4">
      <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground leading-relaxed">{ac.visao_geral}</p></CardContent></Card>
      {ac.concorrentes?.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ac.concorrentes.map((c: ConcorrenteRow, i: number) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="h-full"><CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">{i + 1}</div>
                  <h4 className="font-semibold text-sm">{c.nome}</h4>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start gap-2"><ThumbsUp className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" /><p className="text-xs">{c.pontos_fortes}</p></div>
                  <div className="flex items-start gap-2"><ThumbsDown className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" /><p className="text-xs">{c.pontos_fracos}</p></div>
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
function MktTomVoz({ result }: { result: StrategyResult }) {
  const navigate = useNavigate();
  const tc = result.tom_comunicacao;
  if (!tc) return <p className="text-sm text-muted-foreground p-4">Tom de comunicação não disponível.</p>;
  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-r from-primary/10 to-transparent"><CardContent className="p-6 text-center">
        <p className="text-xs text-muted-foreground mb-1">Tom Principal</p>
        <h3 className="text-xl font-bold">{tc.tom_principal}</h3>
        {tc.personalidade_marca?.length > 0 && <div className="flex flex-wrap justify-center gap-2 mt-3">{tc.personalidade_marca.map((p: string, i: number) => <Badge key={i} className="text-xs">{p}</Badge>)}</div>}
      </CardContent></Card>
      {tc.voz_exemplo && <Card><CardContent className="p-4"><p className="text-xs font-semibold mb-2">Exemplo de como a marca fala:</p><div className="p-4 rounded-lg bg-muted/30 border-l-4 border-primary italic text-sm">{tc.voz_exemplo}</div></CardContent></Card>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card className="border-green-500/20"><CardContent className="p-4"><p className="text-xs font-semibold text-green-600 mb-2 flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> Palavras para USAR</p><TagList items={tc.palavras_usar} variant="outline" /></CardContent></Card>
        <Card className="border-destructive/20"><CardContent className="p-4"><p className="text-xs font-semibold text-destructive mb-2 flex items-center gap-1"><ThumbsDown className="w-3 h-3" /> Palavras para EVITAR</p><TagList items={tc.palavras_evitar} variant="outline" /></CardContent></Card>
      </div>
      {tc.exemplos_posts?.length > 0 && <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Exemplos de Posts</CardTitle></CardHeader><CardContent><div className="grid grid-cols-1 md:grid-cols-2 gap-3">{tc.exemplos_posts.map((ex: any, i: number) => <div key={i} className="p-3 rounded-lg bg-muted/30"><Badge variant="outline" className="text-[10px] mb-2 capitalize">{ex.tipo}</Badge><p className="text-sm">{ex.exemplo}</p></div>)}</div></CardContent></Card>}
      <Card className="border-primary/20 bg-primary/5"><CardContent className="p-4 flex items-center justify-between"><div><p className="text-sm font-medium">Aplique esse tom nos seus scripts</p><p className="text-xs text-muted-foreground">Use as dores, objeções e gatilhos do ICP para criar scripts de venda</p></div><Button size="sm" className="gap-1.5" onClick={() => navigate("/cliente/scripts")}><PenTool className="w-3.5 h-3.5" /> Gerar Scripts</Button></CardContent></Card>
    </div>
  );
}

/* ═══════════════ MARKETING: AQUISIÇÃO ═══════════════ */
function MktAquisicao({ result }: { result: StrategyResult }) {
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {pieData.length > 0 && <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Distribuição de Canais</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={220}><PieChart><Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}%`}>{pieData.map((_: any, i: number) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></CardContent></Card>}
        {ea?.canais_prioritarios?.length > 0 && <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Canais Prioritários</CardTitle></CardHeader><CardContent><div className="space-y-2">{ea.canais_prioritarios.map((c: CanalRow, i: number) => <div key={i} className="p-3 rounded-lg bg-muted/30"><div className="flex items-center justify-between mb-1"><Badge variant="outline" className="text-xs">{c.canal}</Badge><span className="text-xs font-bold">{c.percentual}%</span></div><Progress value={c.percentual} className="h-1.5 mb-1" /><p className="text-xs text-muted-foreground">{c.acao_principal}</p></div>)}</div></CardContent></Card>}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card className="border-primary/20 bg-primary/5"><CardContent className="p-4 flex items-center justify-between"><div><p className="text-sm font-medium">Configurar Tráfego Pago</p><p className="text-xs text-muted-foreground">Aplique os canais na estratégia de anúncios</p></div><Button size="sm" className="gap-1.5" onClick={() => navigate("/cliente/trafego-pago")}>Ir</Button></CardContent></Card>
        <Card className="border-primary/20 bg-primary/5"><CardContent className="p-4 flex items-center justify-between"><div><p className="text-sm font-medium">Abrir CRM</p><p className="text-xs text-muted-foreground">Gerencie leads do funil de aquisição</p></div><Button size="sm" className="gap-1.5" onClick={() => navigate("/cliente/crm")}>Ir</Button></CardContent></Card>
      </div>
    </div>
  );
}

/* ═══════════════ MARKETING: CONTEÚDO ═══════════════ */
function MktConteudo({ result }: { result: StrategyResult }) {
  const navigate = useNavigate();
  const ec = result.estrategia_conteudo;
  const pilarIcons: Record<string, React.ElementType> = { educacao: Lightbulb, autoridade: Target, prova_social: Users, oferta: DollarSign };
  return (
    <div className="space-y-4">
      {ec?.pilares?.length > 0 && <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{ec.pilares.map((p: PilarRow, i: number) => { const Icon = pilarIcons[p.tipo] || Lightbulb; return (<motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}><Card className="h-full"><CardContent className="p-4"><div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><Icon className="w-4 h-4 text-primary" /></div><div><p className="font-semibold text-sm">{p.nome}</p><Badge variant="outline" className="text-[10px] capitalize">{p.tipo?.replace("_", " ")}</Badge></div></div>{p.percentual && <span className="text-lg font-bold text-primary">{p.percentual}%</span>}</div><Progress value={p.percentual || 25} className="h-1.5 mb-2" /><p className="text-xs text-muted-foreground mb-2">{p.descricao}</p><TagList items={p.exemplos} variant="secondary" /></CardContent></Card></motion.div>); })}</div>}
      {ec?.calendario_semanal?.length > 0 && <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" /> Calendário Semanal</CardTitle></CardHeader><CardContent><div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-2">{ec.calendario_semanal.map((dia: CalendarioRow, i: number) => <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} className="p-3 rounded-lg bg-muted/30 text-center border hover:border-primary/30 transition-colors"><p className="text-xs font-bold text-primary">{dia.dia}</p><Badge variant="outline" className="text-[9px] mt-1">{dia.formato}</Badge><p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{dia.sugestao}</p></motion.div>)}</div></CardContent></Card>}
      {ec?.ideias_conteudo?.length > 0 && <Card><CardHeader className="pb-2 flex flex-row items-center justify-between"><CardTitle className="text-sm">Ideias de Conteúdo ({ec.ideias_conteudo.length})</CardTitle><Button size="sm" className="gap-1.5" onClick={() => navigate("/cliente/conteudos")}><Sparkles className="w-3.5 h-3.5" /> Gerar Conteúdos</Button></CardHeader><CardContent><div className="space-y-2">{ec.ideias_conteudo.map((idea: IdeiaRow, i: number) => <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30"><Badge variant="outline" className="text-[10px] shrink-0">{idea.formato}</Badge><span className="text-xs flex-1">{idea.titulo}</span><Badge variant="secondary" className="text-[10px]">{idea.etapa_funil}</Badge></div>)}</div></CardContent></Card>}
    </div>
  );
}

/* ═══════════════ MARKETING: PROJEÇÃO ═══════════════ */
function MktProjecao({ result }: { result: StrategyResult }) {
  const pc = result.plano_crescimento;
  const projecoes = pc?.projecoes_mensais || [];
  const ind = pc?.indicadores;
  const bench = result.benchmarks_setor;
  const chartData = projecoes.map((p: ProjecaoRow) => ({ name: `Mês ${p.mes}`, leads: p.leads, clientes: p.clientes, receita: p.receita, investimento: p.investimento }));
  return (
    <div className="space-y-4">
      {ind && <div className="grid grid-cols-2 md:grid-cols-5 gap-3">{[{ label: "CPC Médio", value: ind.cpc_medio, tip: "Custo Por Clique." }, { label: "CPL", value: ind.cpl_estimado, tip: "Custo Por Lead." }, { label: "CAC", value: ind.cac_estimado, tip: "Custo de Aquisição de Cliente." }, { label: "ROI", value: ind.roi_esperado, tip: "Retorno sobre Investimento." }, { label: "LTV", value: ind.ltv_estimado || "—", tip: "Lifetime Value." }].map((kpi, i) => <Card key={i}><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">{kpi.label} <InfoTip text={kpi.tip} /></p><p className="font-bold text-sm mt-0.5">{kpi.value}</p></CardContent></Card>)}</div>}
      {chartData.length > 0 && <div className="grid grid-cols-1 lg:grid-cols-2 gap-4"><Card><CardHeader className="pb-2"><CardTitle className="text-sm">Leads & Clientes</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={250}><AreaChart data={chartData}><defs><linearGradient id="leadsGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip /><Legend /><Area type="monotone" dataKey="leads" stroke="hsl(var(--primary))" fill="url(#leadsGrad)" name="Leads" strokeWidth={2} /><Line type="monotone" dataKey="clientes" stroke={CHART_COLORS[1]} name="Clientes" strokeWidth={2} /></AreaChart></ResponsiveContainer></CardContent></Card><Card><CardHeader className="pb-2"><CardTitle className="text-sm">Receita vs Investimento</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={250}><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} /><Tooltip formatter={(v: number) => `R$ ${Number(v).toLocaleString("pt-BR")}`} /><Legend /><Bar dataKey="receita" fill="hsl(var(--primary))" name="Receita" radius={[4, 4, 0, 0]} /><Bar dataKey="investimento" fill={CHART_COLORS[2]} name="Investimento" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></CardContent></Card></div>}
      {bench && <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" /> Benchmarks: {bench.setor}</CardTitle></CardHeader><CardContent className="space-y-3"><div className="grid grid-cols-2 md:grid-cols-3 gap-3"><div className="p-3 rounded-lg bg-muted/30 text-center"><p className="text-xs text-muted-foreground">Taxa Conversão</p><p className="font-bold text-sm">{bench.taxa_conversao_media}</p></div><div className="p-3 rounded-lg bg-muted/30 text-center"><p className="text-xs text-muted-foreground">CPL Médio</p><p className="font-bold text-sm">{bench.cpl_medio_setor}</p></div><div className="p-3 rounded-lg bg-muted/30 text-center"><p className="text-xs text-muted-foreground">Ticket Médio</p><p className="font-bold text-sm">{bench.ticket_medio_setor}</p></div></div>{bench.tendencias?.length > 0 && <div><p className="text-xs font-semibold mb-1.5">Tendências do Setor</p><TagList items={bench.tendencias} variant="outline" /></div>}{bench.insight_competitivo && <div className="p-3 rounded-lg bg-primary/5 border border-primary/20"><p className="text-xs font-semibold text-primary mb-0.5">Insight</p><p className="text-sm">{bench.insight_competitivo}</p></div>}</CardContent></Card>}
    </div>
  );
}

/* ═══════════════ MARKETING: EXECUÇÃO ═══════════════ */
function MktExecucao({ result }: { result: StrategyResult }) {
  const plano = result.plano_execucao || [];
  const estrutura = result.estrutura_recomendada || [];
  return (
    <div className="space-y-4">
      {estrutura.length > 0 && <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Checklist de Estrutura</CardTitle></CardHeader><CardContent><div className="space-y-2">{estrutura.map((e: EstruturaRow, i: number) => <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">{e.status === "tem" ? <CheckSquare className="w-4 h-4 text-green-500 shrink-0" /> : <XSquare className="w-4 h-4 text-destructive shrink-0" />}<div className="flex-1 min-w-0"><div className="flex items-center gap-2"><p className="text-sm font-medium">{e.item}</p><Badge variant={e.prioridade === "alta" ? "destructive" : e.prioridade === "media" ? "secondary" : "outline"} className="text-[10px]">{e.prioridade}</Badge></div><p className="text-xs text-muted-foreground">{e.recomendacao}</p></div></div>)}</div></CardContent></Card>}
      {plano.length > 0 && <div className="space-y-3">{plano.map((mes: PlanoMesRow, i: number) => <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.15 }}><Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">{mes.mes}</div>{mes.titulo}</CardTitle></CardHeader><CardContent><div className="space-y-2">{mes.passos?.map((passo: PassoRow, j: number) => <div key={j} className="flex items-center justify-between gap-3 p-2 rounded-lg bg-muted/30"><div className="flex items-center gap-2 flex-1 min-w-0"><span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">{j + 1}</span><span className="text-xs">{passo.acao}</span></div><ToolButton ferramenta={passo.ferramenta} /></div>)}</div></CardContent></Card></motion.div>)}</div>}
    </div>
  );
}

/* ═══════════════ COMERCIAL: SCORE & RADAR ═══════════════ */
function ComScoreRadar({ dc }: { dc: any }) {
  const radarComercial = dc.radar_comercial;
  const radarData = radarComercial ? Object.entries(radarComercial).map(([key, val]) => ({
    subject: key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
    value: val as number,
  })) : [];

  const score = dc.score_comercial ?? 0;
  const nivelLabel = dc.nivel || (score >= 70 ? "Avançado" : score >= 40 ? "Intermediário" : "Básico");
  const nivelColor = score >= 70 ? "bg-green-500/10 text-green-700 border-green-500/30" : score >= 40 ? "bg-amber-500/10 text-amber-700 border-amber-500/30" : "bg-red-500/10 text-red-700 border-red-500/30";
  const barColor = score >= 70 ? "bg-green-500" : score >= 40 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Score Comercial</p>
                <p className="text-4xl font-black mt-1">{score}<span className="text-lg text-muted-foreground font-normal">/100</span></p>
              </div>
              <Badge className={`text-sm px-3 py-1 border capitalize ${nivelColor}`}>{nivelLabel}</Badge>
            </div>
            <div className="w-full h-3 rounded-full bg-muted overflow-hidden">
              <motion.div className={`h-full rounded-full ${barColor}`} initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 1.2, ease: "easeOut" }} />
            </div>
            {dc.analise && <p className="text-sm text-muted-foreground leading-relaxed">{dc.analise}</p>}
          </CardContent>
        </Card>

        {radarData.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Radar Comercial (5 eixos) <InfoTip text="Processo, gestão de leads, ferramentas, canais e performance." /></CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fontSize: 9 }} />
                  <Radar name="Score" dataKey="value" stroke={CHART_COLORS[1]} fill={CHART_COLORS[1]} fillOpacity={0.25} strokeWidth={2} />
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
              {dc.gaps.map((gap: any, i: number) => (
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
function ComFunilReverso({ dc }: { dc: any }) {
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
              <span className="font-bold text-lg">{typeof val === "number" ? val.toLocaleString("pt-BR") : val}</span>
              <span className="text-xs text-muted-foreground ml-2 capitalize">{key.replace(/_/g, " ")}</span>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ═══════════════ COMERCIAL: INSIGHTS ═══════════════ */
function ComInsights({ dc }: { dc: any }) {
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
      {insights.map((insight: any, i: number) => {
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
function ComEstrategias({ dc }: { dc: any }) {
  const estrategias = dc.estrategias_vendas || [];
  if (!estrategias.length) return <p className="text-sm text-muted-foreground p-4">Estratégias de vendas não disponíveis.</p>;

  return (
    <div className="space-y-3">
      {estrategias.map((est: any, i: number) => (
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
                  {est.passos.map((p: any, j: number) => (
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
function ComProjecoes({ dc }: { dc: any }) {
  const hasLeads = dc.projecao_leads?.length > 0;
  const hasReceita = dc.projecao_receita?.length > 0;
  if (!hasLeads && !hasReceita) return <p className="text-sm text-muted-foreground p-4">Projeções não disponíveis.</p>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {hasLeads && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Projeção de Leads</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={dc.projecao_leads.map((p: any) => ({ name: p.mes || p.periodo, atual: p.atual, estrategia: p.com_estrategia || p.projetado }))}>
                <defs>
                  <linearGradient id="leadsComGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS[1]} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART_COLORS[1]} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="atual" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted))" fillOpacity={0.3} name="Atual" strokeWidth={1.5} strokeDasharray="5 5" />
                <Area type="monotone" dataKey="estrategia" stroke={CHART_COLORS[1]} fill="url(#leadsComGrad2)" name="Com Estratégia" strokeWidth={2} />
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
              <AreaChart data={dc.projecao_receita.map((p: any) => ({ name: p.mes || p.periodo, atual: p.atual, estrategia: p.com_estrategia || p.projetado }))}>
                <defs>
                  <linearGradient id="receitaComGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => `R$ ${Number(v).toLocaleString("pt-BR")}`} />
                <Legend />
                <Area type="monotone" dataKey="atual" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted))" fillOpacity={0.3} name="Atual" strokeWidth={1.5} strokeDasharray="5 5" />
                <Area type="monotone" dataKey="estrategia" stroke="hsl(var(--primary))" fill="url(#receitaComGrad2)" name="Com Estratégia" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ═══════════════ COMERCIAL: PLANO DE AÇÃO ═══════════════ */
function ComPlanoAcao({ dc }: { dc: any }) {
  const planoAcao = dc.plano_acao || [];
  if (!planoAcao.length) return <p className="text-sm text-muted-foreground p-4">Plano de ação não disponível.</p>;

  const TIMELINE_COLORS = ["border-blue-500 bg-blue-500", "border-amber-500 bg-amber-500", "border-green-500 bg-green-500", "border-purple-500 bg-purple-500"];

  return (
    <div className="space-y-0 relative">
      {/* Vertical timeline line */}
      <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-border" />

      {planoAcao.map((fase: any, i: number) => {
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
                  {items.map((acao: any, j: number) => {
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

/* ═══════════════ STRATEGY DASHBOARD ═══════════════ */

export interface StrategyDashboardProps {
  result: StrategyResult;
  onApprove: () => void;
  onRegenerate: () => void;
  isApproving: boolean;
  status: string;
  createdAt?: string;
}

export function StrategyDashboard({ result, onApprove, onRegenerate, isApproving, status, createdAt }: StrategyDashboardProps) {
  const navigate = useNavigate();
  if (!result) return null;

  const daysSinceCreation = createdAt ? Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const isStale = daysSinceCreation >= 30;
  const hasComercial = !!result.diagnostico_comercial;

  return (
    <div className="space-y-4">
      {/* Header card with scores */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/10 to-transparent overflow-hidden">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
            <div className="flex items-center gap-4">
              <div className="relative flex gap-2">
                <ScoreRing score={result.diagnostico?.score_geral ?? 0} label="Marketing" size={70} />
                {hasComercial && <ScoreRing score={result.diagnostico_comercial?.score_comercial ?? 0} label="Comercial" size={70} />}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={status === "approved" ? "default" : "secondary"} className="gap-1"><CheckCircle2 className="w-3 h-3" /> {status === "approved" ? "Aprovada" : "Pendente"}</Badge>
                  {createdAt && <Badge variant="outline" className="text-[10px] gap-1"><Clock className="w-3 h-3" /> {format(new Date(createdAt), "dd MMM yyyy", { locale: ptBR })} ({daysSinceCreation} dias)</Badge>}
                </div>
                {isStale && <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">Sua estratégia tem {daysSinceCreation} dias. Considere atualizar!</p>}
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <AlertDialog>
                <AlertDialogTrigger asChild><Button variant="outline" size="sm" className="gap-1.5"><RotateCcw className="w-3.5 h-3.5" /> Nova Estratégia</Button></AlertDialogTrigger>
                <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Criar nova estratégia?</AlertDialogTitle><AlertDialogDescription>Sua estratégia atual será movida para o histórico.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={onRegenerate}>Sim, criar nova</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
              </AlertDialog>
              {status !== "approved" && <Button size="sm" onClick={onApprove} disabled={isApproving} className="gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> {isApproving ? "Aprovando..." : "Aprovar (50 créditos)"}</Button>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick actions when approved */}
      {status === "approved" && (
        <Card className="border-primary/10"><CardContent className="p-4">
          <p className="text-xs font-semibold text-primary mb-3 flex items-center gap-1.5"><ArrowRight className="w-3.5 h-3.5" /> Próximos Passos</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {[
              { key: "conteudos", label: "Gerar Conteúdos", desc: "Textos estratégicos com IA", icon: FileText, path: "/cliente/conteudos" },
              { key: "postagens", label: "Criar Postagens", desc: "Artes para redes sociais", icon: Palette, path: "/cliente/redes-sociais" },
              { key: "sites", label: "Criar Site", desc: "Landing pages otimizadas", icon: Monitor, path: "/cliente/sites" },
              { key: "trafego", label: "Tráfego Pago", desc: "Estratégia de anúncios", icon: Sparkles, path: "/cliente/trafego-pago" },
              { key: "scripts", label: "Gerar Scripts", desc: "Roteiros de venda", icon: PenTool, path: "/cliente/scripts" },
            ].map((tool) => (
              <button key={tool.key} onClick={() => navigate(tool.path)} className="flex items-center gap-3 p-3 rounded-xl border bg-muted/30 hover:bg-muted/50 text-left transition-colors">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><tool.icon className="w-4 h-4 text-primary" /></div>
                <div className="min-w-0"><p className="text-xs font-medium truncate">{tool.label}</p><p className="text-[10px] text-muted-foreground">{tool.desc}</p></div>
              </button>
            ))}
          </div>
        </CardContent></Card>
      )}

      {/* ═══ TWO-LEVEL TABS: Marketing / Comercial ═══ */}
      <Tabs defaultValue="marketing" className="w-full">
        <TabsList className="w-full flex h-auto gap-1 bg-muted/50 p-1">
          <TabsTrigger value="marketing" className="flex-1 gap-2 text-sm py-2.5">
            <BarChart3 className="w-4 h-4" /> Marketing
          </TabsTrigger>
          {hasComercial && (
            <TabsTrigger value="comercial" className="flex-1 gap-2 text-sm py-2.5">
              <Briefcase className="w-4 h-4" /> Comercial
            </TabsTrigger>
          )}
        </TabsList>

        {/* ═══ MARKETING SUB-TABS ═══ */}
        <TabsContent value="marketing" className="mt-4">
          <Tabs defaultValue="mkt-resumo" className="w-full">
            <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/30 p-1">
              <TabsTrigger value="mkt-resumo" className="text-xs gap-1"><BarChart3 className="w-3.5 h-3.5" /> Resumo</TabsTrigger>
              <TabsTrigger value="mkt-icp" className="text-xs gap-1"><Users className="w-3.5 h-3.5" /> Cliente Ideal</TabsTrigger>
              <TabsTrigger value="mkt-concorrencia" className="text-xs gap-1"><Shield className="w-3.5 h-3.5" /> Concorrência</TabsTrigger>
              <TabsTrigger value="mkt-tom" className="text-xs gap-1"><MessageSquare className="w-3.5 h-3.5" /> Tom de Voz</TabsTrigger>
              <TabsTrigger value="mkt-aquisicao" className="text-xs gap-1"><TrendingUp className="w-3.5 h-3.5" /> Aquisição</TabsTrigger>
              <TabsTrigger value="mkt-conteudo" className="text-xs gap-1"><Lightbulb className="w-3.5 h-3.5" /> Conteúdo</TabsTrigger>
              <TabsTrigger value="mkt-projecao" className="text-xs gap-1"><DollarSign className="w-3.5 h-3.5" /> Projeção</TabsTrigger>
              <TabsTrigger value="mkt-execucao" className="text-xs gap-1"><Target className="w-3.5 h-3.5" /> Execução</TabsTrigger>
            </TabsList>
            <TabsContent value="mkt-resumo"><MktResumo result={result} /></TabsContent>
            <TabsContent value="mkt-icp"><MktClienteIdeal result={result} /></TabsContent>
            <TabsContent value="mkt-concorrencia"><MktConcorrencia result={result} /></TabsContent>
            <TabsContent value="mkt-tom"><MktTomVoz result={result} /></TabsContent>
            <TabsContent value="mkt-aquisicao"><MktAquisicao result={result} /></TabsContent>
            <TabsContent value="mkt-conteudo"><MktConteudo result={result} /></TabsContent>
            <TabsContent value="mkt-projecao"><MktProjecao result={result} /></TabsContent>
            <TabsContent value="mkt-execucao"><MktExecucao result={result} /></TabsContent>
          </Tabs>
        </TabsContent>

        {/* ═══ COMERCIAL SUB-TABS ═══ */}
        {hasComercial && (
          <TabsContent value="comercial" className="mt-4">
            <Tabs defaultValue="com-score" className="w-full">
              <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/30 p-1">
                <TabsTrigger value="com-score" className="text-xs gap-1"><Trophy className="w-3.5 h-3.5" /> Score & Radar</TabsTrigger>
                <TabsTrigger value="com-funil" className="text-xs gap-1"><TrendingUp className="w-3.5 h-3.5" /> Funil Reverso</TabsTrigger>
                <TabsTrigger value="com-insights" className="text-xs gap-1"><Lightbulb className="w-3.5 h-3.5" /> Insights</TabsTrigger>
                <TabsTrigger value="com-estrategias" className="text-xs gap-1"><Target className="w-3.5 h-3.5" /> Estratégias</TabsTrigger>
                <TabsTrigger value="com-projecoes" className="text-xs gap-1"><DollarSign className="w-3.5 h-3.5" /> Projeções</TabsTrigger>
                <TabsTrigger value="com-plano" className="text-xs gap-1"><Calendar className="w-3.5 h-3.5" /> Plano de Ação</TabsTrigger>
              </TabsList>
              <TabsContent value="com-score"><ComScoreRadar dc={result.diagnostico_comercial} /></TabsContent>
              <TabsContent value="com-funil"><ComFunilReverso dc={result.diagnostico_comercial} /></TabsContent>
              <TabsContent value="com-insights"><ComInsights dc={result.diagnostico_comercial} /></TabsContent>
              <TabsContent value="com-estrategias"><ComEstrategias dc={result.diagnostico_comercial} /></TabsContent>
              <TabsContent value="com-projecoes"><ComProjecoes dc={result.diagnostico_comercial} /></TabsContent>
              <TabsContent value="com-plano"><ComPlanoAcao dc={result.diagnostico_comercial} /></TabsContent>
            </Tabs>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

/* ═══════════════ HISTORY ITEM ═══════════════ */

export function StrategyHistoryItem({ strategy }: { strategy: HistoryStrategy }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Card>
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-left">
        <div>
          <p className="text-sm font-medium">Estratégia de {format(new Date(strategy.created_at), "dd MMM yyyy", { locale: ptBR })}</p>
          <p className="text-xs text-muted-foreground">{strategy.status === "approved" ? "Aprovada" : "Pendente"}</p>
        </div>
      </button>
      {expanded && strategy.strategy_result && (
        <CardContent className="pt-0">
          <StrategyDashboard result={strategy.strategy_result} onApprove={() => {}} onRegenerate={() => {}} isApproving={false} status={strategy.status || "approved"} />
        </CardContent>
      )}
    </Card>
  );
}
