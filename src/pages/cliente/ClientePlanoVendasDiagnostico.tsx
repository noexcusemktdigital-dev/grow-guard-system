// @ts-nocheck
import { ArrowRight, ChevronRight, TrendingUp, RotateCcw, Activity, HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { DiagnosticoTermometro } from "@/components/diagnostico/DiagnosticoTermometro";
import { ChatBriefing } from "@/components/cliente/ChatBriefing";
import { AGENTS, RAFAEL_STEPS } from "@/components/cliente/briefingAgents";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, BarChart, Bar, Cell, Legend, ReferenceLine,
} from "recharts";
import type { Answers } from "./ClientePlanoVendasData";
import { niveis, getNivel } from "./ClientePlanoVendasData";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

function InfoTip({ text }: { text: string }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="w-3.5 h-3.5 text-muted-foreground/60 hover:text-muted-foreground cursor-help inline-block ml-1.5" />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[260px] text-xs leading-relaxed">
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface InsightItem {
  text: string;
  type: "success" | "warning" | "opportunity";
  icon: React.ElementType;
  path: string;
  cta: string;
}

interface ActionPhase {
  fase: string;
  periodo: string;
  cor: string;
  items: string[];
}

export interface ClientePlanoVendasDiagnosticoProps {
  completed: boolean;
  answers: Answers;
  percentage: number;
  radarData: { category: string; value: number }[];
  insights: InsightItem[];
  leadsProjection: { mes: string; atual: number; comEstrategia: number }[];
  revenueProjection: { mes: string; atual: number; comEstrategia: number }[];
  actionPlan: ActionPhase[];
  onChatComplete: (chatAnswers: Record<string, any>) => void;
  onRestart: () => void;
  onShowWelcome: () => void;
}

export function ClientePlanoVendasDiagnostico({
  completed, answers, percentage, radarData, insights, leadsProjection, revenueProjection, actionPlan,
  onChatComplete, onRestart, onShowWelcome,
}: ClientePlanoVendasDiagnosticoProps) {
  const navigate = useNavigate();
  const nivel = getNivel(percentage);

  return (
    <div className="space-y-4">
      <Collapsible defaultOpen={!completed}>
        <CollapsibleTrigger className="group flex items-center gap-2 text-sm font-semibold hover:text-primary transition-colors w-full py-2 px-3 rounded-lg bg-muted/50 hover:bg-muted">
          <Activity className="w-4 h-4 text-primary" />
          Diagnóstico Comercial
          {completed && <Badge variant="outline" className="text-[9px] ml-1 border-primary/30 text-primary">Concluído</Badge>}
          <ChevronDown className="w-4 h-4 ml-auto transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4">
        {!completed ? (
          <ChatBriefing
            agent={AGENTS.rafael}
            steps={RAFAEL_STEPS}
            onComplete={onChatComplete}
            onCancel={() => onShowWelcome()}
          />
        ) : (
          /* ── RESULT ── */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-1">SEU DIAGNÓSTICO COMERCIAL</p>
                <p className="text-sm text-muted-foreground">Resultado baseado nas suas respostas</p>
              </div>
              <Button variant="outline" size="sm" onClick={onRestart} className="gap-2">
                <RotateCcw className="w-3.5 h-3.5" /> Refazer
              </Button>
            </div>

            {/* Termômetro + Radar */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DiagnosticoTermometro pontuacao={percentage} nivel={nivel} />
              <Card className="glass-card">
                <CardContent className="py-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-4">RADAR POR ÁREA — 5 EIXOS <InfoTip text="Mostra sua pontuação em 5 dimensões comerciais. Quanto mais preenchido, mais madura é sua operação naquele eixo." /></p>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData} outerRadius="65%">
                        <PolarGrid stroke="hsl(var(--border))" />
                        <PolarAngleAxis dataKey="category" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 8 }} />
                        <Radar name="Score" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.15)" strokeWidth={2} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bar Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass-card">
                <CardContent className="py-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-4">SCORE POR CATEGORIA <InfoTip text="Barra horizontal mostrando o percentual atingido em cada área. Verde (≥70%), Amarelo (≥40%), Vermelho (<40%)." /></p>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={radarData} layout="vertical" margin={{ left: 10, right: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} unit="%" />
                        <YAxis type="category" dataKey="category" tick={{ fontSize: 10 }} width={100} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                        <RechartsTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [`${v}%`, "Score"]} />
                        <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={22} name="Score">
                          {radarData.map((entry, i) => (
                            <Cell key={i} fill={entry.value >= 70 ? "hsl(var(--chart-3))" : entry.value >= 40 ? "hsl(var(--chart-2))" : "hsl(var(--destructive))"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="py-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-4">ATUAL vs IDEAL (100%)</p>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={radarData.map(d => ({ ...d, ideal: 100 }))} margin={{ left: 10, right: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="category" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} unit="%" />
                        <RechartsTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                        <Bar dataKey="ideal" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} barSize={24} name="Ideal" />
                        <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={24} name="Atual" />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gauge */}
            <Card className="glass-card">
              <CardContent className="py-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-4 text-center">INDICADOR DE MATURIDADE COMERCIAL</p>
                <div className="flex items-center justify-center">
                  <div className="relative w-64 h-44">
                    <svg viewBox="0 0 200 130" className="w-full h-full">
                      <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="hsl(var(--muted))" strokeWidth="14" strokeLinecap="round" />
                      <path
                        d="M 20 100 A 80 80 0 0 1 180 100"
                        fill="none"
                        stroke={nivel.cor}
                        strokeWidth="14"
                        strokeLinecap="round"
                        strokeDasharray={`${(percentage / 100) * 251.3} 251.3`}
                        className="transition-all duration-1000 ease-out"
                      />
                      {(() => {
                        const angle = -180 + (percentage / 100) * 180;
                        const rad = (angle * Math.PI) / 180;
                        const cx = 100, cy = 100, len = 60;
                        const x2 = cx + len * Math.cos(rad);
                        const y2 = cy + len * Math.sin(rad);
                        return <line x1={cx} y1={cy} x2={x2} y2={y2} stroke="hsl(var(--foreground))" strokeWidth="2.5" strokeLinecap="round" className="transition-all duration-1000 ease-out" />;
                      })()}
                      <circle cx="100" cy="100" r="5" fill="hsl(var(--foreground))" />
                      <text x="20" y="118" fontSize="9" fill="hsl(var(--muted-foreground))" textAnchor="middle">0%</text>
                      <text x="100" y="18" fontSize="9" fill="hsl(var(--muted-foreground))" textAnchor="middle">50%</text>
                      <text x="180" y="118" fontSize="9" fill="hsl(var(--muted-foreground))" textAnchor="middle">100%</text>
                    </svg>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center whitespace-nowrap">
                      <p className="text-2xl font-bold leading-tight" style={{ color: nivel.cor }}>{percentage}%</p>
                      <p className="text-xs font-medium" style={{ color: nivel.cor }}>{nivel.label}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-3 mt-4">
                  {niveis.map(n => (
                    <div key={n.id} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: n.cor }} />
                      <span className="text-[10px] text-muted-foreground">{n.label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Insights */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3">INSIGHTS E RECOMENDAÇÕES</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {insights.map((ins, i) => (
                  <Card key={i} className={`border-l-4 ${
                    ins.type === "success" ? "border-l-emerald-500" :
                    ins.type === "warning" ? "border-l-destructive" : "border-l-primary"
                  }`}>
                    <CardContent className="py-3">
                      <div className="flex items-start gap-3">
                        <ins.icon className={`w-4 h-4 mt-0.5 shrink-0 ${
                          ins.type === "success" ? "text-emerald-500" :
                          ins.type === "warning" ? "text-destructive" : "text-primary"
                        }`} />
                        <p className="text-sm flex-1">{ins.text}</p>
                      </div>
                      <div className="flex justify-end mt-2">
                        <Button variant="link" size="sm" className="h-auto p-0 text-xs gap-1" onClick={() => navigate(ins.path)}>
                          {ins.cta} <ArrowRight className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Action Plan */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3">PLANO DE AÇÃO EM 3 FASES</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {actionPlan.map(fase => (
                  <Card key={fase.fase} className="glass-card overflow-hidden">
                    <div className="h-1" style={{ background: fase.cor }} />
                    <CardContent className="py-5">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-bold">{fase.fase}</p>
                        <Badge variant="outline" className="text-[9px]">{fase.periodo}</Badge>
                      </div>
                      <ul className="space-y-2">
                        {fase.items.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                            <ChevronRight className="w-3 h-3 mt-0.5 shrink-0 text-primary" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* KPIs + Charts */}
            {(() => {
              const lastLead = leadsProjection[leadsProjection.length - 1];
              const lastRev = revenueProjection[revenueProjection.length - 1];
              const revGrowth = lastRev.atual > 0 ? Math.round(((lastRev.comEstrategia - lastRev.atual) / lastRev.atual) * 100) : 0;
              const ticketMap2: Record<string, number> = { "0-200": 150, "200-1k": 600, "1-5k": 3000, "5-15k": 10000, "15k+": 20000 };
              const ticket2 = ticketMap2[answers.ticket_medio as string] || 600;
              const conv2 = 0.1;
              const closingsM6 = Math.round(lastLead.comEstrategia * conv2);
              const funnelData = [
                { stage: "Leads", value: lastLead.comEstrategia, fill: "hsl(var(--primary))" },
                { stage: "Qualificados", value: Math.round(lastLead.comEstrategia * 0.5), fill: "hsl(var(--chart-1))" },
                { stage: "Propostas", value: Math.round(lastLead.comEstrategia * 0.2), fill: "hsl(var(--chart-2))" },
                { stage: "Fechamentos", value: closingsM6, fill: "hsl(var(--chart-3))" },
              ];

              return (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: "Receita Projetada M6", value: `R$ ${(lastRev.comEstrategia / 1000).toFixed(0)}k`, sublabel: `vs R$ ${(lastRev.atual / 1000).toFixed(0)}k atual` },
                      { label: "Crescimento Receita", value: `+${revGrowth}%`, sublabel: "em 6 meses" },
                      { label: "Leads Projetados M6", value: `${lastLead.comEstrategia}`, sublabel: `vs ${lastLead.atual} atual` },
                      { label: "Fechamentos M6", value: `${closingsM6}`, sublabel: `${Math.round(conv2 * 100)}% conversão` },
                    ].map((kpi, i) => (
                      <Card key={i} className="glass-card border-primary/10 overflow-hidden group relative">
                        <div className="absolute -top-6 -right-6 w-16 h-16 rounded-full bg-primary/5 group-hover:scale-150 transition-transform duration-500" />
                        <CardContent className="py-4 px-4 relative">
                          <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground">{kpi.label}</p>
                          <div className="flex items-end gap-2 mt-1">
                            <span className="text-xl font-black tracking-tight text-kpi-positive">{kpi.value}</span>
                            <TrendingUp className="w-3.5 h-3.5 text-kpi-positive mb-1" />
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{kpi.sublabel}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Revenue Projection Chart */}
                  <Card className="glass-card">
                    <CardContent className="py-6">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">PROJEÇÃO DE RECEITA — 6 MESES</p>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-[9px] gap-1 border-muted-foreground/30">
                            <span className="w-2 h-0.5 bg-muted-foreground inline-block" style={{ borderTop: "2px dashed" }} /> Cenário Atual
                          </Badge>
                          <Badge className="text-[9px] gap-1 bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
                            <span className="w-2 h-2 rounded-full bg-primary inline-block" /> Com Estratégia
                          </Badge>
                        </div>
                      </div>
                      <div className="h-64 relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={revenueProjection} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id="gradRevStrategy" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                            <XAxis dataKey="mes" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                            <RechartsTooltip
                              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                              formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, ""]}
                            />
                            <Area type="monotone" dataKey="atual" stroke="hsl(var(--muted-foreground))" fill="transparent" strokeWidth={2} strokeDasharray="6 4" name="Cenário Atual" />
                            <Area type="monotone" dataKey="comEstrategia" stroke="hsl(var(--primary))" fill="url(#gradRevStrategy)" strokeWidth={2.5} name="Com Estratégia" />
                          </AreaChart>
                        </ResponsiveContainer>
                        <div className="absolute top-2 right-4 flex flex-col items-end gap-1">
                          <Badge className="bg-kpi-positive/10 text-kpi-positive border-kpi-positive/20 hover:bg-kpi-positive/10 text-xs font-bold">
                            +{revGrowth}%
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">crescimento projetado</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Funnel Chart */}
                  <Card className="glass-card">
                    <CardContent className="py-6">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">FUNIL DE CONVERSÃO PROJETADO — MÊS 6</p>
                        <Badge variant="outline" className="text-[9px]">Ticket: R$ {ticket2.toLocaleString("pt-BR")}</Badge>
                      </div>
                      <div className="h-52">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={funnelData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                            <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                            <YAxis type="category" dataKey="stage" tick={{ fontSize: 11, fontWeight: 600 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} width={90} />
                            <RechartsTooltip
                              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                            />
                            <Bar dataKey="value" radius={[0, 6, 6, 0]} name="Quantidade" barSize={28}>
                              {funnelData.map((entry, idx) => (
                                <Cell key={idx} fill={entry.fill} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </>
              );
            })()}
          </div>
        )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
