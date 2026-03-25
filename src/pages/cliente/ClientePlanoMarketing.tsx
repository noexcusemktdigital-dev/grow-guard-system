import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles, CheckCircle2, RotateCcw, Clock, Target, Users, Lightbulb,
  Globe, DollarSign, TrendingUp, BarChart3, Megaphone, ArrowRight,
  FileText, Palette, Monitor, Zap, CheckSquare, XSquare,
  PenTool, Share2, ExternalLink, MessageSquare, Eye, Calendar,
  Trophy, Shield, Flame, Heart, ThumbsUp, ThumbsDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useActiveStrategy, useStrategyHistory, useSaveStrategy, useApproveStrategy, useGenerateStrategy } from "@/hooks/useMarketingStrategy";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { useClienteWallet } from "@/hooks/useClienteWallet";
import { toast } from "@/hooks/use-toast";
import { ChatBriefing } from "@/components/cliente/ChatBriefing";
import { InsufficientCreditsDialog, isInsufficientCreditsError } from "@/components/cliente/InsufficientCreditsDialog";
import { AGENTS, SOFIA_STEPS } from "@/components/cliente/briefingAgents";
import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, AreaChart, Area,
} from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const CHART_COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2, 160 60% 45%))", "hsl(var(--chart-3, 30 80% 55%))", "hsl(var(--chart-4, 280 65% 60%))", "hsl(var(--chart-5, 340 75% 55%))"];

const TOOL_ROUTES: Record<string, { label: string; path: string; icon: any }> = {
  conteudos: { label: "Conteúdos", path: "/cliente/conteudos", icon: FileText },
  postagens: { label: "Postagens", path: "/cliente/redes-sociais", icon: Palette },
  sites: { label: "Sites", path: "/cliente/sites", icon: Monitor },
  trafego: { label: "Tráfego Pago", path: "/cliente/trafego-pago", icon: Zap },
  crm: { label: "CRM", path: "/cliente/crm", icon: Users },
  scripts: { label: "Scripts", path: "/cliente/scripts", icon: PenTool },
  manual: { label: "Manual", path: "#", icon: CheckSquare },
};

/* ═══════════════ HELPER COMPONENTS ═══════════════ */

function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 100, delay: 0.1 }}
      className="font-bold text-2xl"
    >
      {value}{suffix}
    </motion.span>
  );
}

function ScoreRing({ score, label, size = 120 }: { score: number; label: string; size?: number }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? "hsl(var(--chart-2, 160 60% 45%))" : score >= 40 ? "hsl(var(--chart-3, 30 80% 55%))" : "hsl(var(--destructive))";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
          <motion.circle
            cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth="8"
            strokeLinecap="round" strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">{score}</span>
          <span className="text-[10px] text-muted-foreground">/100</span>
        </div>
      </div>
      <p className="text-xs font-medium text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

function TagList({ items, variant = "secondary" }: { items: string[]; variant?: "secondary" | "outline" | "default" }) {
  if (!items?.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <Badge key={i} variant={variant} className="text-xs">{item}</Badge>
      ))}
    </div>
  );
}

function ToolButton({ ferramenta }: { ferramenta: string }) {
  const navigate = useNavigate();
  const tool = TOOL_ROUTES[ferramenta] || TOOL_ROUTES.manual;
  const Icon = tool.icon;
  if (ferramenta === "manual") return null;
  return (
    <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => navigate(tool.path)}>
      <Icon className="w-3.5 h-3.5" /> {tool.label} <ExternalLink className="w-3 h-3" />
    </Button>
  );
}

/* ═══════════════ TAB: RESUMO ═══════════════ */

function TabResumo({ result }: { result: any }) {
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
      {/* Hero metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card className="col-span-2 lg:col-span-1 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4 flex flex-col items-center justify-center gap-1 relative">
            <ScoreRing score={scoreGeral} label="Score Geral" />
          </CardContent>
        </Card>
        {[
          { label: "Objetivo", value: result.objetivo_principal, icon: Target, color: "text-primary" },
          { label: "Canal Prioritário", value: result.canal_prioritario, icon: Share2, color: "text-primary" },
          { label: "Investimento", value: result.investimento_recomendado, icon: DollarSign, color: "text-primary" },
          { label: "Potencial", value: result.potencial_crescimento, icon: TrendingUp, color: "text-primary" },
        ].map((kpi, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="h-full">
              <CardContent className="p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                  <span className="text-xs text-muted-foreground">{kpi.label}</span>
                </div>
                <p className="font-semibold text-sm">{kpi.value || "—"}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Radar + Diagnóstico */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {radarData.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Radar de Maturidade (6 dimensões)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
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

/* ═══════════════ TAB: CLIENTE IDEAL ═══════════════ */

function TabClienteIdeal({ result }: { result: any }) {
  const icp = result.icp;
  const pv = result.proposta_valor;
  if (!icp) return null;

  return (
    <div className="space-y-4">
      {/* Persona Card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-3xl">
              {icp.avatar_emoji || "👤"}
            </div>
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
              { label: "Gatilhos de Compra", items: icp.gatilhos_compra, icon: Zap, color: "text-green-500" },
            ].map((section, i) => section.items?.length > 0 && (
              <div key={i} className="p-3 rounded-lg bg-muted/30">
                <p className={`text-xs font-semibold mb-1.5 flex items-center gap-1 ${section.color}`}>
                  <section.icon className="w-3 h-3" /> {section.label}
                </p>
                <div className="space-y-1">
                  {section.items.map((item: string, j: number) => (
                    <p key={j} className="text-xs flex items-start gap-1.5">
                      <span className="text-muted-foreground mt-0.5">•</span> {item}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Proposta de Valor */}
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

/* ═══════════════ TAB: CONCORRÊNCIA ═══════════════ */

function TabConcorrencia({ result }: { result: any }) {
  const ac = result.analise_concorrencia;
  if (!ac) return <p className="text-sm text-muted-foreground p-4">Análise de concorrência não disponível nesta versão. Regenere a estratégia.</p>;

  return (
    <div className="space-y-4">
      <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground leading-relaxed">{ac.visao_geral}</p></CardContent></Card>

      {ac.concorrentes?.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ac.concorrentes.map((c: any, i: number) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="h-full">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm">{c.nome}</h4>
                      {c.url && (
                        <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline flex items-center gap-0.5 truncate">
                          <ExternalLink className="w-2.5 h-2.5 shrink-0" /> {c.url}
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2"><ThumbsUp className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" /><p className="text-xs">{c.pontos_fortes}</p></div>
                    <div className="flex items-start gap-2"><ThumbsDown className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" /><p className="text-xs">{c.pontos_fracos}</p></div>
                    <div className="flex items-start gap-2"><Lightbulb className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" /><p className="text-xs font-medium">{c.oportunidade_diferenciacao}</p></div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {ac.posicionamento_recomendado && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-primary mb-1">Posicionamento Recomendado</p>
            <p className="text-sm">{ac.posicionamento_recomendado}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ═══════════════ TAB: TOM DE VOZ ═══════════════ */

function TabTomVoz({ result }: { result: any }) {
  const navigate = useNavigate();
  const tc = result.tom_comunicacao;
  if (!tc) return <p className="text-sm text-muted-foreground p-4">Tom de comunicação não disponível nesta versão. Regenere a estratégia.</p>;

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-r from-primary/10 to-transparent">
        <CardContent className="p-6 text-center">
          <p className="text-xs text-muted-foreground mb-1">Tom Principal</p>
          <h3 className="text-xl font-bold">{tc.tom_principal}</h3>
          {tc.personalidade_marca?.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mt-3">
              {tc.personalidade_marca.map((p: string, i: number) => (
                <Badge key={i} className="text-xs">{p}</Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {tc.voz_exemplo && (
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold mb-2">Exemplo de como a marca fala:</p>
            <div className="p-4 rounded-lg bg-muted/30 border-l-4 border-primary italic text-sm">{tc.voz_exemplo}</div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card className="border-green-500/20">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-green-600 mb-2 flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> Palavras para USAR</p>
            <TagList items={tc.palavras_usar} variant="outline" />
          </CardContent>
        </Card>
        <Card className="border-destructive/20">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-destructive mb-2 flex items-center gap-1"><ThumbsDown className="w-3 h-3" /> Palavras para EVITAR</p>
            <TagList items={tc.palavras_evitar} variant="outline" />
          </CardContent>
        </Card>
      </div>

      {tc.exemplos_posts?.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Exemplos de Posts</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tc.exemplos_posts.map((ex: any, i: number) => (
                <div key={i} className="p-3 rounded-lg bg-muted/30">
                  <Badge variant="outline" className="text-[10px] mb-2 capitalize">{ex.tipo}</Badge>
                  <p className="text-sm">{ex.exemplo}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* CTA */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Aplique esse tom nos seus scripts</p>
            <p className="text-xs text-muted-foreground">Use as dores, objeções e gatilhos do ICP para criar scripts de venda</p>
          </div>
          <Button size="sm" className="gap-1.5" onClick={() => navigate("/cliente/scripts")}>
            <PenTool className="w-3.5 h-3.5" /> Gerar Scripts <ExternalLink className="w-3 h-3" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══════════════ TAB: AQUISIÇÃO ═══════════════ */

function TabAquisicao({ result }: { result: any }) {
  const navigate = useNavigate();
  const ea = result.estrategia_aquisicao;
  const funil = ea?.funil;

  const pieData = (ea?.canais_prioritarios || []).reduce((acc: any[], c: any) => {
    const tipo = c.tipo === "organico" ? "Orgânico" : c.tipo === "pago" ? "Tráfego Pago" : "Parcerias";
    const existing = acc.find(a => a.name === tipo);
    if (existing) existing.value += (c.percentual || 0);
    else acc.push({ name: tipo, value: c.percentual || 0 });
    return acc;
  }, []);

  const funnelData = funil ? [
    { name: "Visitantes", value: funil.topo?.estimativa_visitantes || 0, fill: CHART_COLORS[0] },
    { name: "Leads", value: funil.meio?.estimativa_leads || 0, fill: CHART_COLORS[1] },
    { name: "Clientes", value: funil.fundo?.estimativa_clientes || 0, fill: CHART_COLORS[2] },
  ] : [];

  return (
    <div className="space-y-4">
      {/* Visual funnel */}
      {funnelData.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Funil de Aquisição</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-2 py-4">
              {funnelData.map((stage, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.2 }}
                  className="text-center rounded-xl py-3 px-6 text-sm font-medium"
                  style={{
                    width: `${100 - i * 20}%`,
                    background: `hsl(var(--primary) / ${0.15 + i * 0.1})`,
                    border: `1px solid hsl(var(--primary) / ${0.3 + i * 0.1})`,
                  }}
                >
                  <span className="font-bold text-lg">{stage.value.toLocaleString("pt-BR")}</span>
                  <span className="text-xs text-muted-foreground ml-2">{stage.name}</span>
                </motion.div>
              ))}
            </div>
            {funil && (
              <div className="grid grid-cols-3 gap-2 mt-3">
                {(["topo", "meio", "fundo"] as const).map((etapa) => (
                  <div key={etapa} className="text-center p-2 rounded-lg bg-muted/30">
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground">{etapa}</p>
                    <p className="text-xs mt-0.5">{funil[etapa]?.objetivo}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {pieData.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Distribuição de Canais</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}%`}>
                    {pieData.map((_: any, i: number) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {ea?.canais_prioritarios?.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Canais Prioritários</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {ea.canais_prioritarios.map((c: any, i: number) => (
                  <div key={i} className="p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="outline" className="text-xs">{c.canal}</Badge>
                      <span className="text-xs font-bold">{c.percentual}%</span>
                    </div>
                    <Progress value={c.percentual} className="h-1.5 mb-1" />
                    <p className="text-xs text-muted-foreground">{c.acao_principal}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* CTAs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Configurar Tráfego Pago</p>
              <p className="text-xs text-muted-foreground">Aplique os canais na estratégia de anúncios</p>
            </div>
            <Button size="sm" className="gap-1.5" onClick={() => navigate("/cliente/trafego-pago")}>
              <Zap className="w-3.5 h-3.5" /> Ir
            </Button>
          </CardContent>
        </Card>
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Abrir CRM</p>
              <p className="text-xs text-muted-foreground">Gerencie leads do funil de aquisição</p>
            </div>
            <Button size="sm" className="gap-1.5" onClick={() => navigate("/cliente/crm")}>
              <Users className="w-3.5 h-3.5" /> Ir
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ═══════════════ TAB: CONTEÚDO ═══════════════ */

function TabConteudo({ result }: { result: any }) {
  const navigate = useNavigate();
  const ec = result.estrategia_conteudo;
  const pilarIcons: Record<string, any> = { educacao: Lightbulb, autoridade: Target, prova_social: Users, oferta: DollarSign };

  return (
    <div className="space-y-4">
      {/* Pilares with percentual */}
      {ec?.pilares?.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ec.pilares.map((p: any, i: number) => {
            const Icon = pilarIcons[p.tipo] || Lightbulb;
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className="h-full">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><Icon className="w-4 h-4 text-primary" /></div>
                        <div>
                          <p className="font-semibold text-sm">{p.nome}</p>
                          <Badge variant="outline" className="text-[10px] capitalize">{p.tipo?.replace("_", " ")}</Badge>
                        </div>
                      </div>
                      {p.percentual && <span className="text-lg font-bold text-primary">{p.percentual}%</span>}
                    </div>
                    <Progress value={p.percentual || 25} className="h-1.5 mb-2" />
                    <p className="text-xs text-muted-foreground mb-2">{p.descricao}</p>
                    <TagList items={p.exemplos} variant="secondary" />
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Calendário Semanal */}
      {ec?.calendario_semanal?.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" /> Calendário Semanal</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-2">
              {ec.calendario_semanal.map((dia: any, i: number) => (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                  className="p-3 rounded-lg bg-muted/30 text-center border hover:border-primary/30 transition-colors">
                  <p className="text-xs font-bold text-primary">{dia.dia}</p>
                  <Badge variant="outline" className="text-[9px] mt-1">{dia.formato}</Badge>
                  <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{dia.sugestao}</p>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ideias de conteúdo */}
      {ec?.ideias_conteudo?.length > 0 && (
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Ideias de Conteúdo ({ec.ideias_conteudo.length})</CardTitle>
            <Button size="sm" className="gap-1.5" onClick={() => navigate("/cliente/conteudos")}>
              <Sparkles className="w-3.5 h-3.5" /> Gerar Conteúdos
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {ec.ideias_conteudo.map((idea: any, i: number) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                  <Badge variant="outline" className="text-[10px] shrink-0">{idea.formato}</Badge>
                  <span className="text-xs flex-1">{idea.titulo}</span>
                  <Badge variant="secondary" className="text-[10px]">{idea.etapa_funil}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ═══════════════ TAB: PROJEÇÃO ═══════════════ */

function TabProjecao({ result }: { result: any }) {
  const pc = result.plano_crescimento;
  const projecoes = pc?.projecoes_mensais || [];
  const ind = pc?.indicadores;
  const bench = result.benchmarks_setor;

  const chartData = projecoes.map((p: any) => ({
    name: `Mês ${p.mes}`,
    leads: p.leads, clientes: p.clientes, receita: p.receita, investimento: p.investimento,
  }));

  return (
    <div className="space-y-4">
      {ind && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "CPC Médio", value: ind.cpc_medio },
            { label: "CPL", value: ind.cpl_estimado },
            { label: "CAC", value: ind.cac_estimado },
            { label: "ROI", value: ind.roi_esperado },
            { label: "LTV", value: ind.ltv_estimado || "—" },
          ].map((kpi, i) => (
            <Card key={i}>
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <p className="font-bold text-sm mt-0.5">{kpi.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Leads & Clientes</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="leadsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="leads" stroke="hsl(var(--primary))" fill="url(#leadsGrad)" name="Leads" strokeWidth={2} />
                  <Line type="monotone" dataKey="clientes" stroke={CHART_COLORS[1]} name="Clientes" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Receita vs Investimento</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: any) => `R$ ${Number(v).toLocaleString("pt-BR")}`} />
                  <Legend />
                  <Bar dataKey="receita" fill="hsl(var(--primary))" name="Receita" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="investimento" fill={CHART_COLORS[2]} name="Investimento" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Benchmarks */}
      {bench && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" /> Benchmarks: {bench.setor}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-muted/30 text-center">
                <p className="text-xs text-muted-foreground">Taxa Conversão</p>
                <p className="font-bold text-sm">{bench.taxa_conversao_media}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 text-center">
                <p className="text-xs text-muted-foreground">CPL Médio</p>
                <p className="font-bold text-sm">{bench.cpl_medio_setor}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 text-center">
                <p className="text-xs text-muted-foreground">Ticket Médio</p>
                <p className="font-bold text-sm">{bench.ticket_medio_setor}</p>
              </div>
            </div>
            {bench.tendencias?.length > 0 && (
              <div>
                <p className="text-xs font-semibold mb-1.5">Tendências do Setor</p>
                <TagList items={bench.tendencias} variant="outline" />
              </div>
            )}
            {bench.insight_competitivo && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-xs font-semibold text-primary mb-0.5">Insight</p>
                <p className="text-sm">{bench.insight_competitivo}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ═══════════════ TAB: EXECUÇÃO ═══════════════ */

function TabExecucao({ result }: { result: any }) {
  const plano = result.plano_execucao || [];
  const estrutura = result.estrutura_recomendada || [];

  return (
    <div className="space-y-4">
      {estrutura.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Checklist de Estrutura</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {estrutura.map((e: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  {e.status === "tem" ? <CheckSquare className="w-4 h-4 text-green-500 shrink-0" /> : <XSquare className="w-4 h-4 text-destructive shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{e.item}</p>
                      <Badge variant={e.prioridade === "alta" ? "destructive" : e.prioridade === "media" ? "secondary" : "outline"} className="text-[10px]">{e.prioridade}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{e.recomendacao}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {plano.length > 0 && (
        <div className="space-y-3">
          {plano.map((mes: any, i: number) => (
            <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.15 }}>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">{mes.mes}</div>
                    {mes.titulo}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {mes.passos?.map((passo: any, j: number) => (
                      <div key={j} className="flex items-center justify-between gap-3 p-2 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">{j + 1}</span>
                          <span className="text-xs">{passo.acao}</span>
                        </div>
                        <ToolButton ferramenta={passo.ferramenta} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════ STRATEGY DASHBOARD ═══════════════ */

function StrategyDashboard({ result, onApprove, onRegenerate, isApproving, status, createdAt }: {
  result: any; onApprove: () => void; onRegenerate: () => void; isApproving: boolean; status: string; createdAt?: string;
}) {
  const navigate = useNavigate();
  if (!result) return null;

  const daysSinceCreation = createdAt ? Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const isStale = daysSinceCreation >= 30;

  return (
    <div className="space-y-4">
      {/* Hero card */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/10 to-transparent overflow-hidden">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <ScoreRing score={result.diagnostico?.score_geral ?? 0} label="" size={80} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={status === "approved" ? "default" : "secondary"} className="gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {status === "approved" ? "Aprovada" : "Pendente"}
                  </Badge>
                  {createdAt && (
                    <Badge variant="outline" className="text-[10px] gap-1">
                      <Clock className="w-3 h-3" /> {format(new Date(createdAt), "dd MMM yyyy", { locale: ptBR })} ({daysSinceCreation} dias)
                    </Badge>
                  )}
                </div>
                {isStale && (
                  <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                    ⚠️ Sua estratégia tem {daysSinceCreation} dias. Considere atualizar!
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5" /> Nova Estratégia
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Criar nova estratégia?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Sua estratégia atual será movida para o histórico. Você poderá consultá-la a qualquer momento, mas uma nova será gerada do zero.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={onRegenerate}>Sim, criar nova</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              {status !== "approved" && (
                <Button size="sm" onClick={onApprove} disabled={isApproving} className="gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {isApproving ? "Aprovando..." : "Aprovar (50 créditos)"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Próximos Passos card - marketing tools only */}
      {status === "approved" && (
        <Card className="border-primary/10">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-primary mb-3 flex items-center gap-1.5">
              <ArrowRight className="w-3.5 h-3.5" /> Próximos Passos — Aplique sua estratégia
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {[
                { key: "conteudos", label: "Gerar Conteúdos", desc: "Textos estratégicos com IA", icon: FileText, path: "/cliente/conteudos" },
                { key: "postagens", label: "Criar Postagens", desc: "Artes para redes sociais", icon: Palette, path: "/cliente/redes-sociais" },
                { key: "sites", label: "Criar Site", desc: "Landing pages otimizadas", icon: Monitor, path: "/cliente/sites" },
                { key: "trafego", label: "Tráfego Pago", desc: "Estratégia de anúncios", icon: Zap, path: "/cliente/trafego-pago" },
                { key: "scripts", label: "Gerar Scripts", desc: "Roteiros de venda", icon: PenTool, path: "/cliente/scripts" },
              ].map((tool) => (
                <button
                  key={tool.key}
                  onClick={() => navigate(tool.path)}
                  className="flex items-center gap-3 p-3 rounded-xl border bg-muted/30 hover:bg-muted/50 text-left transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <tool.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{tool.label}</p>
                    <p className="text-[10px] text-muted-foreground">{tool.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="resumo" className="w-full">
        <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
          <TabsTrigger value="resumo" className="text-xs gap-1"><BarChart3 className="w-3.5 h-3.5" /> Resumo</TabsTrigger>
          <TabsTrigger value="icp" className="text-xs gap-1"><Users className="w-3.5 h-3.5" /> Cliente Ideal</TabsTrigger>
          <TabsTrigger value="concorrencia" className="text-xs gap-1"><Shield className="w-3.5 h-3.5" /> Concorrência</TabsTrigger>
          <TabsTrigger value="tom" className="text-xs gap-1"><MessageSquare className="w-3.5 h-3.5" /> Tom de Voz</TabsTrigger>
          <TabsTrigger value="aquisicao" className="text-xs gap-1"><TrendingUp className="w-3.5 h-3.5" /> Aquisição</TabsTrigger>
          <TabsTrigger value="conteudo" className="text-xs gap-1"><Lightbulb className="w-3.5 h-3.5" /> Conteúdo</TabsTrigger>
          <TabsTrigger value="projecao" className="text-xs gap-1"><DollarSign className="w-3.5 h-3.5" /> Projeção</TabsTrigger>
          <TabsTrigger value="execucao" className="text-xs gap-1"><Target className="w-3.5 h-3.5" /> Execução</TabsTrigger>
        </TabsList>
        <TabsContent value="resumo"><TabResumo result={result} /></TabsContent>
        <TabsContent value="icp"><TabClienteIdeal result={result} /></TabsContent>
        <TabsContent value="concorrencia"><TabConcorrencia result={result} /></TabsContent>
        <TabsContent value="tom"><TabTomVoz result={result} /></TabsContent>
        <TabsContent value="aquisicao"><TabAquisicao result={result} /></TabsContent>
        <TabsContent value="conteudo"><TabConteudo result={result} /></TabsContent>
        <TabsContent value="projecao"><TabProjecao result={result} /></TabsContent>
        <TabsContent value="execucao"><TabExecucao result={result} /></TabsContent>
      </Tabs>
    </div>
  );
}

/* ═══════════════ HISTORY ═══════════════ */

function StrategyHistoryItem({ strategy }: { strategy: any }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Card>
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-left">
        <div>
          <p className="text-sm font-medium">Estratégia de {format(new Date(strategy.created_at), "dd MMM yyyy", { locale: ptBR })}</p>
          <p className="text-xs text-muted-foreground">{strategy.status === "approved" ? "✅ Aprovada" : "⏳ Pendente"}</p>
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

/* ═══════════════ MAIN PAGE ═══════════════ */

export default function ClientePlanoMarketing() {
  const [showChat, setShowChat] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showCreditsDialog, setShowCreditsDialog] = useState(false);

  const { data: activeStrategy, isLoading } = useActiveStrategy();
  const { data: history } = useStrategyHistory();
  const { data: orgId } = useUserOrgId();
  const { data: wallet } = useClienteWallet();
  const saveStrategy = useSaveStrategy();
  const approveStrategy = useApproveStrategy();
  const generateStrategy = useGenerateStrategy();

  const hasResult = !!activeStrategy?.strategy_result;
  const status = activeStrategy?.status || "pending";
  const generationCount = (history?.length ?? 0) + (activeStrategy ? 1 : 0);

  const handleChatComplete = async (answers: Record<string, any>) => {
    if (!orgId) return;
    setIsGenerating(true);
    try {
      const aiResult = await generateStrategy.mutateAsync({ answers, organization_id: orgId });
      await saveStrategy.mutateAsync({
        answers,
        score_percentage: aiResult.result?.diagnostico?.score_geral || 0,
        nivel: "gerado",
        strategy_result: aiResult.result,
        status: "pending",
      });
      toast({ title: "Estratégia gerada!", description: "Revise o resultado e aprove para finalizar." });
    } catch (err: any) {
      toast({ title: "Erro ao gerar estratégia", description: err.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
      setShowChat(false);
    }
  };

  const handleApprove = async () => {
    if (!activeStrategy?.id) return;
    try {
      await approveStrategy.mutateAsync(activeStrategy.id);
      toast({ title: "Estratégia aprovada! ✅", description: "50 créditos foram consumidos." });
    } catch (err: any) {
      if (isInsufficientCreditsError(err)) {
        setShowCreditsDialog(true);
      } else {
        toast({ title: "Erro ao aprovar", description: err.message, variant: "destructive" });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <PageHeader title="Plano de Marketing" subtitle="Carregando..." icon={<Megaphone className="w-5 h-5 text-primary" />} />
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 rounded-xl bg-muted/50" />)}
        </div>
      </div>
    );
  }

  if (showChat || isGenerating) {
    return (
      <div className="space-y-4">
        <PageHeader title="Plano de Marketing" subtitle="Responda as perguntas para gerar seu plano" icon={<Megaphone className="w-5 h-5 text-primary" />} />
        {isGenerating ? (
          <Card>
            <CardContent className="p-12 flex flex-col items-center gap-4">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                <Sparkles className="w-10 h-10 text-primary" />
              </motion.div>
              <div className="text-center">
                <p className="font-semibold">Gerando sua estratégia completa...</p>
                <p className="text-sm text-muted-foreground">Isso pode levar até 40 segundos — estamos analisando concorrência, definindo tom de voz, criando calendário editorial e muito mais.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <ChatBriefing agent={AGENTS.sofia} steps={SOFIA_STEPS} onComplete={handleChatComplete} onCancel={() => setShowChat(false)} />
        )}
      </div>
    );
  }

  if (hasResult) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <PageHeader title="Plano de Marketing" subtitle="Dashboard estratégico personalizado" icon={<Megaphone className="w-5 h-5 text-primary" />} />
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">{generationCount} geração(ões)</Badge>
            {(history?.length ?? 0) > 0 && (
              <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)} className="gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Histórico ({history?.length})
              </Button>
            )}
          </div>
        </div>

        {showHistory && history && history.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-muted-foreground">Estratégias anteriores</p>
            {history.map((s) => <StrategyHistoryItem key={s.id} strategy={s} />)}
          </div>
        )}

        <StrategyDashboard
          result={activeStrategy?.strategy_result}
          onApprove={handleApprove}
          onRegenerate={() => setShowChat(true)}
          isApproving={approveStrategy.isPending}
          status={status}
          createdAt={activeStrategy?.created_at ?? ""}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Plano de Marketing" subtitle="Crie seu plano de marketing personalizado com IA" icon={<Megaphone className="w-5 h-5 text-primary" />} />

      <Card className="border-dashed">
        <CardContent className="p-12 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Crie seu Plano de Marketing</h3>
            <p className="text-sm text-muted-foreground max-w-lg mt-1">
              Responda perguntas estratégicas e a IA vai gerar um plano completo com diagnóstico, radar 6D,
              análise de concorrência, tom de voz, calendário editorial, projeções de crescimento, benchmarks do setor e roadmap de execução.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> ~7 minutos</span>
            <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> 50 créditos</span>
            <span className="flex items-center gap-1">Saldo: {wallet?.balance ?? 0}</span>
          </div>
          <Button size="lg" onClick={() => setShowChat(true)} className="gap-2 mt-2">
            <Sparkles className="w-4 h-4" /> Iniciar Diagnóstico
          </Button>

          {(history?.length ?? 0) > 0 && (
            <div className="w-full mt-6 space-y-2">
              <p className="text-sm font-semibold text-muted-foreground">Estratégias anteriores ({history?.length})</p>
              {history?.map((s) => <StrategyHistoryItem key={s.id} strategy={s} />)}
            </div>
          )}
        </CardContent>
      </Card>
      <InsufficientCreditsDialog
        open={showCreditsDialog}
        onOpenChange={setShowCreditsDialog}
        actionLabel="esta estratégia"
        creditCost={300}
      />
    </div>
  );
}
