import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles, CheckCircle2, RotateCcw, Clock, Target, Users, Lightbulb,
  Globe, DollarSign, TrendingUp, BarChart3, Megaphone, ArrowRight,
  FileText, Palette, Monitor, Zap, CheckSquare, XSquare, AlertCircle,
  PenTool, Share2, ExternalLink,
} from "lucide-react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useActiveStrategy, useStrategyHistory, useSaveStrategy, useApproveStrategy, useGenerateStrategy } from "@/hooks/useMarketingStrategy";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { useClienteWallet } from "@/hooks/useClienteWallet";
import { toast } from "@/hooks/use-toast";
import { ChatBriefing } from "@/components/cliente/ChatBriefing";
import { AGENTS, SOFIA_STEPS } from "@/components/cliente/briefingAgents";
import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar,
} from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

/* ══════════════════════════════════════════════
   COLORS
   ══════════════════════════════════════════════ */
const CHART_COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2, 160 60% 45%))", "hsl(var(--chart-3, 30 80% 55%))", "hsl(var(--chart-4, 280 65% 60%))"];
const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2, 160 60% 45%))", "hsl(var(--chart-3, 30 80% 55%))"];

const TOOL_ROUTES: Record<string, { label: string; path: string; icon: any }> = {
  conteudos: { label: "Conteúdos", path: "/cliente/conteudos", icon: FileText },
  postagens: { label: "Postagens", path: "/cliente/redes-sociais", icon: Palette },
  sites: { label: "Sites", path: "/cliente/sites", icon: Monitor },
  trafego: { label: "Tráfego Pago", path: "/cliente/trafego-pago", icon: Zap },
  crm: { label: "CRM", path: "/cliente/crm", icon: Users },
  scripts: { label: "Scripts", path: "/cliente/scripts", icon: PenTool },
  manual: { label: "Manual", path: "#", icon: CheckSquare },
};

/* ══════════════════════════════════════════════
   HELPER COMPONENTS
   ══════════════════════════════════════════════ */

function KpiCard({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{label}</p>
          <p className="font-semibold text-sm truncate">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function TagList({ items, variant = "secondary" }: { items: string[]; variant?: "secondary" | "outline" | "default" }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items?.map((item, i) => (
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

/* ══════════════════════════════════════════════
   TAB: RESUMO
   ══════════════════════════════════════════════ */

function TabResumo({ result }: { result: any }) {
  const radarData = result.diagnostico?.radar
    ? [
        { subject: "Autoridade", value: result.diagnostico.radar.autoridade },
        { subject: "Aquisição", value: result.diagnostico.radar.aquisicao },
        { subject: "Conversão", value: result.diagnostico.radar.conversao },
        { subject: "Retenção", value: result.diagnostico.radar.retencao },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Objetivo Principal" value={result.objetivo_principal || "—"} icon={Target} />
        <KpiCard label="Canal Prioritário" value={result.canal_prioritario || "—"} icon={Share2} />
        <KpiCard label="Investimento Recomendado" value={result.investimento_recomendado || "—"} icon={DollarSign} />
        <KpiCard label="Potencial de Crescimento" value={result.potencial_crescimento || "—"} icon={TrendingUp} />
      </div>

      {/* Radar + Diagnóstico */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {radarData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Radar de Maturidade</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fontSize: 9 }} />
                  <Radar name="Score" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Diagnóstico</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed">{result.diagnostico?.analise}</p>
            <div className="grid grid-cols-1 gap-2">
              {result.diagnostico?.pontos_fortes?.length > 0 && (
                <div><p className="text-xs font-semibold text-green-600 mb-1">Pontos Fortes</p><TagList items={result.diagnostico.pontos_fortes} variant="outline" /></div>
              )}
              {result.diagnostico?.oportunidades?.length > 0 && (
                <div><p className="text-xs font-semibold text-blue-600 mb-1">Oportunidades</p><TagList items={result.diagnostico.oportunidades} variant="outline" /></div>
              )}
              {result.diagnostico?.riscos?.length > 0 && (
                <div><p className="text-xs font-semibold text-orange-600 mb-1">Riscos</p><TagList items={result.diagnostico.riscos} variant="outline" /></div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumo executivo */}
      {result.resumo_executivo && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{result.resumo_executivo}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   TAB: CLIENTE IDEAL
   ══════════════════════════════════════════════ */

function TabClienteIdeal({ result }: { result: any }) {
  const icp = result.icp;
  const pv = result.proposta_valor;

  return (
    <div className="space-y-4">
      {/* ICP Card */}
      {icp && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> Perfil do Cliente Ideal (ICP)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{icp.descricao}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-xs font-semibold mb-1">Demografia</p>
                <p className="text-sm">{icp.demografia}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-xs font-semibold mb-1">Perfil Profissional</p>
                <p className="text-sm">{icp.perfil_profissional}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div><p className="text-xs font-semibold mb-1.5">Dores</p><TagList items={icp.dores} variant="outline" /></div>
              <div><p className="text-xs font-semibold mb-1.5">Desejos</p><TagList items={icp.desejos} variant="outline" /></div>
              <div><p className="text-xs font-semibold mb-1.5">Objeções</p><TagList items={icp.objecoes} variant="outline" /></div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Proposta de Valor */}
      {pv && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Target className="w-4 h-4 text-primary" /> Proposta de Valor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-stretch gap-3">
              <div className="flex-1 p-4 rounded-lg bg-destructive/5 border border-destructive/20 text-center">
                <p className="text-xs font-semibold text-destructive mb-1">Problema</p>
                <p className="text-sm">{pv.problema}</p>
              </div>
              <div className="flex items-center justify-center"><ArrowRight className="w-5 h-5 text-muted-foreground rotate-90 md:rotate-0" /></div>
              <div className="flex-1 p-4 rounded-lg bg-primary/5 border border-primary/20 text-center">
                <p className="text-xs font-semibold text-primary mb-1">Método / Solução</p>
                <p className="text-sm">{pv.metodo}</p>
              </div>
              <div className="flex items-center justify-center"><ArrowRight className="w-5 h-5 text-muted-foreground rotate-90 md:rotate-0" /></div>
              <div className="flex-1 p-4 rounded-lg bg-green-500/5 border border-green-500/20 text-center">
                <p className="text-xs font-semibold text-green-600 mb-1">Resultado</p>
                <p className="text-sm">{pv.resultado}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   TAB: AQUISIÇÃO
   ══════════════════════════════════════════════ */

function TabAquisicao({ result }: { result: any }) {
  const ea = result.estrategia_aquisicao;
  const funil = ea?.funil;

  // Prepare pie data from canal types
  const canalsByType = (ea?.canais_prioritarios || []).reduce((acc: any, c: any) => {
    const tipo = c.tipo === "organico" ? "Orgânico" : c.tipo === "pago" ? "Tráfego Pago" : "Parcerias";
    acc[tipo] = (acc[tipo] || 0) + (c.percentual || 0);
    return acc;
  }, {});
  const pieData = Object.entries(canalsByType).map(([name, value]) => ({ name, value }));

  // Funnel bar data
  const funnelData = funil
    ? [
        { name: "Visitantes", value: funil.topo?.estimativa_visitantes || 0 },
        { name: "Leads", value: funil.meio?.estimativa_leads || 0 },
        { name: "Clientes", value: funil.fundo?.estimativa_clientes || 0 },
      ]
    : [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Funil */}
        {funnelData.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Funil de Aquisição</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={funnelData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
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

        {/* Canais (Pie) */}
        {pieData.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Distribuição de Canais</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}%`}>
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Lista de canais */}
      {ea?.canais_prioritarios?.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Canais Prioritários</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {ea.canais_prioritarios.map((c: any, i: number) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <Badge variant="outline" className="text-xs shrink-0">{c.canal}</Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">{c.justificativa}</p>
                    <p className="text-xs font-medium mt-0.5">{c.acao_principal}</p>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">{c.percentual}%</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   TAB: CONTEÚDO
   ══════════════════════════════════════════════ */

function TabConteudo({ result }: { result: any }) {
  const navigate = useNavigate();
  const ec = result.estrategia_conteudo;
  const pilarIcons: Record<string, any> = { educacao: Lightbulb, autoridade: Target, prova_social: Users, oferta: DollarSign };

  return (
    <div className="space-y-4">
      {/* Pilares */}
      {ec?.pilares?.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ec.pilares.map((p: any, i: number) => {
            const Icon = pilarIcons[p.tipo] || Lightbulb;
            return (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><Icon className="w-4 h-4 text-primary" /></div>
                    <div>
                      <p className="font-semibold text-sm">{p.nome}</p>
                      <Badge variant="outline" className="text-[10px] capitalize">{p.tipo?.replace("_", " ")}</Badge>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{p.descricao}</p>
                  <TagList items={p.exemplos} variant="secondary" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Ideias de conteúdo */}
      {ec?.ideias_conteudo?.length > 0 && (
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Ideias de Conteúdo</CardTitle>
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

/* ══════════════════════════════════════════════
   TAB: PROJEÇÃO
   ══════════════════════════════════════════════ */

function TabProjecao({ result }: { result: any }) {
  const pc = result.plano_crescimento;
  const projecoes = pc?.projecoes_mensais || [];
  const ind = pc?.indicadores;

  const chartData = projecoes.map((p: any) => ({
    name: `Mês ${p.mes}`,
    leads: p.leads,
    clientes: p.clientes,
    receita: p.receita,
    investimento: p.investimento,
  }));

  return (
    <div className="space-y-4">
      {/* KPIs */}
      {ind && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard label="CPC Médio" value={ind.cpc_medio} icon={DollarSign} />
          <KpiCard label="CPL Estimado" value={ind.cpl_estimado} icon={TrendingUp} />
          <KpiCard label="CAC Estimado" value={ind.cac_estimado} icon={Users} />
          <KpiCard label="ROI Esperado" value={ind.roi_esperado} icon={BarChart3} />
        </div>
      )}

      {/* Gráficos */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Leads & Clientes por Mês</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="leads" stroke={CHART_COLORS[0]} name="Leads" strokeWidth={2} />
                  <Line type="monotone" dataKey="clientes" stroke={CHART_COLORS[1]} name="Clientes" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Receita Estimada por Mês</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: any) => `R$ ${Number(v).toLocaleString("pt-BR")}`} />
                  <Bar dataKey="receita" fill={CHART_COLORS[0]} name="Receita" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="investimento" fill={CHART_COLORS[2]} name="Investimento" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   TAB: PLANO DE EXECUÇÃO
   ══════════════════════════════════════════════ */

function TabExecucao({ result }: { result: any }) {
  const plano = result.plano_execucao || [];
  const estrutura = result.estrutura_recomendada || [];

  return (
    <div className="space-y-4">
      {/* Estrutura recomendada */}
      {estrutura.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Estrutura de Marketing Recomendada</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {estrutura.map((e: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  {e.status === "tem" ? (
                    <CheckSquare className="w-4 h-4 text-green-500 shrink-0" />
                  ) : (
                    <XSquare className="w-4 h-4 text-destructive shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{e.item}</p>
                      <Badge variant={e.prioridade === "alta" ? "destructive" : e.prioridade === "media" ? "secondary" : "outline"} className="text-[10px]">
                        {e.prioridade}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{e.recomendacao}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Roadmap 3 meses */}
      {plano.length > 0 && (
        <div className="space-y-3">
          {plano.map((mes: any, i: number) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">{mes.mes}</div>
                  {mes.titulo}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {mes.passos?.map((passo: any, j: number) => (
                    <div key={j} className="flex items-center justify-between gap-3 p-2 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-xs text-muted-foreground shrink-0">{j + 1}.</span>
                        <span className="text-xs">{passo.acao}</span>
                      </div>
                      <ToolButton ferramenta={passo.ferramenta} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   STRATEGY DASHBOARD
   ══════════════════════════════════════════════ */

function StrategyDashboard({ result, onApprove, onRegenerate, isApproving, status }: {
  result: any;
  onApprove: () => void;
  onRegenerate: () => void;
  isApproving: boolean;
  status: string;
}) {
  if (!result) return null;

  return (
    <div className="space-y-4">
      {/* Action bar */}
      {status !== "approved" && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
            <div>
              <p className="text-sm font-medium">Estratégia gerada com sucesso! 🎉</p>
              <p className="text-xs text-muted-foreground">Revise o resultado e aprove para consumir os créditos.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onRegenerate} className="gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" /> Regenerar
              </Button>
              <Button size="sm" onClick={onApprove} disabled={isApproving} className="gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> {isApproving ? "Aprovando..." : "Aprovar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {status === "approved" && (
        <Badge variant="default" className="gap-1.5">
          <CheckCircle2 className="w-3 h-3" /> Estratégia aprovada
        </Badge>
      )}

      {/* Tabbed dashboard */}
      <Tabs defaultValue="resumo" className="w-full">
        <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
          <TabsTrigger value="resumo" className="text-xs gap-1"><BarChart3 className="w-3.5 h-3.5" /> Resumo</TabsTrigger>
          <TabsTrigger value="icp" className="text-xs gap-1"><Users className="w-3.5 h-3.5" /> Cliente Ideal</TabsTrigger>
          <TabsTrigger value="aquisicao" className="text-xs gap-1"><TrendingUp className="w-3.5 h-3.5" /> Aquisição</TabsTrigger>
          <TabsTrigger value="conteudo" className="text-xs gap-1"><Lightbulb className="w-3.5 h-3.5" /> Conteúdo</TabsTrigger>
          <TabsTrigger value="projecao" className="text-xs gap-1"><DollarSign className="w-3.5 h-3.5" /> Projeção</TabsTrigger>
          <TabsTrigger value="execucao" className="text-xs gap-1"><Target className="w-3.5 h-3.5" /> Execução</TabsTrigger>
        </TabsList>
        <TabsContent value="resumo"><TabResumo result={result} /></TabsContent>
        <TabsContent value="icp"><TabClienteIdeal result={result} /></TabsContent>
        <TabsContent value="aquisicao"><TabAquisicao result={result} /></TabsContent>
        <TabsContent value="conteudo"><TabConteudo result={result} /></TabsContent>
        <TabsContent value="projecao"><TabProjecao result={result} /></TabsContent>
        <TabsContent value="execucao"><TabExecucao result={result} /></TabsContent>
      </Tabs>
    </div>
  );
}

/* ══════════════════════════════════════════════
   HISTORY
   ══════════════════════════════════════════════ */

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

/* ══════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════ */

export default function ClientePlanoMarketing() {
  const [showChat, setShowChat] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const { data: activeStrategy, isLoading } = useActiveStrategy();
  const { data: history } = useStrategyHistory();
  const { data: orgId } = useUserOrgId();
  const { data: wallet } = useClienteWallet();
  const saveStrategy = useSaveStrategy();
  const approveStrategy = useApproveStrategy();
  const generateStrategy = useGenerateStrategy();

  const hasResult = !!activeStrategy?.strategy_result;
  const status = activeStrategy?.status || "pending";

  const handleChatComplete = async (answers: Record<string, any>) => {
    if (!orgId) return;
    setIsGenerating(true);

    try {
      const aiResult = await generateStrategy.mutateAsync({ answers, organization_id: orgId });
      await saveStrategy.mutateAsync({
        answers,
        score_percentage: 0,
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
      toast({ title: "Estratégia aprovada! ✅", description: "300 créditos foram consumidos." });
    } catch (err: any) {
      toast({ title: "Erro ao aprovar", description: err.message, variant: "destructive" });
    }
  };

  const handleRegenerate = () => setShowChat(true);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <PageHeader title="Estratégia de Marketing" subtitle="Carregando..." icon={<Megaphone className="w-5 h-5 text-primary" />} />
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 rounded-xl bg-muted/50" />)}
        </div>
      </div>
    );
  }

  if (showChat || isGenerating) {
    return (
      <div className="p-6 space-y-4">
        <PageHeader title="Estratégia de Marketing" subtitle="Responda as perguntas para gerar sua estratégia" icon={<Megaphone className="w-5 h-5 text-primary" />} />
        {isGenerating ? (
          <Card>
            <CardContent className="p-12 flex flex-col items-center gap-4">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                <Sparkles className="w-10 h-10 text-primary" />
              </motion.div>
              <div className="text-center">
                <p className="font-semibold">Gerando sua estratégia...</p>
                <p className="text-sm text-muted-foreground">Isso pode levar até 30 segundos</p>
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
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <PageHeader title="Estratégia de Marketing" subtitle="Dashboard estratégico personalizado" icon={<Megaphone className="w-5 h-5 text-primary" />} />
          <div className="flex gap-2">
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
          result={activeStrategy!.strategy_result}
          onApprove={handleApprove}
          onRegenerate={handleRegenerate}
          isApproving={approveStrategy.isPending}
          status={status}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <PageHeader title="Estratégia de Marketing" subtitle="Crie sua estratégia personalizada com IA" icon={<Megaphone className="w-5 h-5 text-primary" />} />

      <Card className="border-dashed">
        <CardContent className="p-12 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Crie sua Estratégia de Marketing</h3>
            <p className="text-sm text-muted-foreground max-w-md mt-1">
              Responda 14 perguntas simples e a IA vai gerar uma estratégia executiva completa com diagnóstico,
              radar de maturidade, projeções de crescimento, pilares de conteúdo, plano de tráfego e roadmap de execução.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> ~5 minutos</span>
            <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> 300 créditos</span>
            <span className="flex items-center gap-1">Saldo: {wallet?.balance ?? 0}</span>
          </div>
          <Button size="lg" onClick={() => setShowChat(true)} className="gap-2 mt-2">
            <Sparkles className="w-4 h-4" /> Iniciar Diagnóstico
          </Button>

          {(history?.length ?? 0) > 0 && (
            <div className="w-full mt-6 space-y-2">
              <p className="text-sm font-semibold text-muted-foreground">Estratégias anteriores</p>
              {history!.map((s) => <StrategyHistoryItem key={s.id} strategy={s} />)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
