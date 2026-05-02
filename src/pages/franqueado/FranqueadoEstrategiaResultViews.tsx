// @ts-nocheck
import { useRef, useState } from "react";
import {
  CheckCircle2, FileText, ClipboardCheck, Target, AlertTriangle,
  TrendingUp, Package, Layers, Map, BarChart3, Calculator, Download,
  ChevronDown, ChevronUp, Zap, Globe, ShoppingCart, LineChart,
  Users, Crosshair, Award, Shield,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { reportError } from "@/lib/error-toast";
import type { StrategyResult, EtapaEstrategica } from "@/hooks/useFranqueadoStrategies";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer,
  LineChart as ReLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { exportStrategyPdf } from "@/lib/strategyPdfGenerator";

// PDF generation is now handled by src/lib/strategyPdfGenerator.ts

// ── Etapa icons map ──────────────────────────────────────────────

const etapaIcons: Record<string, React.ReactNode> = {
  conteudo: <FileText className="w-5 h-5" />,
  trafego: <TrendingUp className="w-5 h-5" />,
  web: <Globe className="w-5 h-5" />,
  sales: <ShoppingCart className="w-5 h-5" />,
  validacao: <LineChart className="w-5 h-5" />,
};

const etapaLabels: Record<string, string> = {
  conteudo: "Conteúdo e Linha Editorial",
  trafego: "Tráfego e Distribuição",
  web: "Web e Conversão",
  sales: "Sales e Fechamento",
  validacao: "Validação e Escala",
};

const etapaNumbers: Record<string, string> = {
  conteudo: "01",
  trafego: "02",
  web: "03",
  sales: "04",
  validacao: "05",
};

const etapaColors: Record<string, { accent: string; bg: string; border: string }> = {
  conteudo: { accent: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/30" },
  trafego: { accent: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/30" },
  web: { accent: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/30" },
  sales: { accent: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
  validacao: { accent: "text-violet-500", bg: "bg-violet-500/10", border: "border-violet-500/30" },
};

// ── Strategy Result View (Entry Point) ──────────────────────────

export function StrategyResultView({
  result,
  title,
  showExport = true,
  onSendToCalculator,
}: {
  result: StrategyResult;
  title?: string;
  showExport?: boolean;
  onSendToCalculator?: () => void;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const radarRef = useRef<HTMLDivElement>(null);
  const barChartRef = useRef<HTMLDivElement>(null);
  const lineChartRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const isNewFormat = !!result.diagnostico_gps;
  const isLegacyNewFormat = !!result.diagnostico_negocio;

  const handleExportPdf = async () => {
    toast.info("Gerando PDF profissional...");
    try {
      await exportStrategyPdf(result, title || "Planejamento Estratégico", {
        radar: radarRef.current || undefined,
        bar: barChartRef.current || undefined,
        line: lineChartRef.current || undefined,
      });
      toast.success("PDF gerado com sucesso!");
    } catch (e) {
      reportError(e, { title: "Erro ao gerar PDF", category: "strategy.pdf_export" });
    }
  };

  const handleGoToCalculator = () => {
    if (result.entregaveis_calculadora?.length) {
      sessionStorage.setItem("strategy_deliverables", JSON.stringify(result.entregaveis_calculadora));
    }
    navigate("/franqueado/propostas");
  };

  return (
    <div className="space-y-4">
      <div ref={contentRef}>
        {isNewFormat ? (
          <NewStrategyResultView result={result} radarRef={radarRef} barChartRef={barChartRef} lineChartRef={lineChartRef} />
        ) : isLegacyNewFormat ? (
          <LegacyNewFormatView result={result} />
        ) : (
          <LegacyStrategyResultView result={result} />
        )}
      </div>

      {showExport && (
        <div className="bg-zinc-950 rounded-2xl p-6 -mx-2">
          <div className="flex flex-col sm:flex-row items-stretch gap-3">
            <Button
              variant="outline"
              size="lg"
              className="flex-1 h-14 text-base gap-2 border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800"
              onClick={handleExportPdf}
            >
              <Download className="w-5 h-5" /> Salvar em PDF
            </Button>
            {result.entregaveis_calculadora && result.entregaveis_calculadora.length > 0 && (
              <Button
                size="lg"
                className="flex-1 h-14 text-base gap-2 bg-red-600 hover:bg-red-700 text-white"
                onClick={onSendToCalculator || handleGoToCalculator}
              >
                <Calculator className="w-5 h-5" /> Gerar Proposta
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Score Circle Component ───────────────────────────────────────

function ScoreCircle({ score, size = 64, strokeWidth = 5, className = "" }: { score: number; size?: number; strokeWidth?: number; className?: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score <= 25 ? "#ef4444" : score <= 50 ? "#f97316" : score <= 75 ? "#eab308" : "#22c55e";

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <span className="absolute text-sm font-black text-white">{score}%</span>
    </div>
  );
}

// ── New 5-Step Strategy Result View ─────────────────────────────

function NewStrategyResultView({ result, radarRef, barChartRef, lineChartRef }: { result: StrategyResult; radarRef?: React.RefObject<HTMLDivElement>; barChartRef?: React.RefObject<HTMLDivElement>; lineChartRef?: React.RefObject<HTMLDivElement> }) {
  const gps = result.diagnostico_gps!;
  const score = gps.score_geral;
  const scoreMarketing = result.score_marketing ?? 0;
  const scoreComercial = result.score_comercial ?? 0;

  const getScoreColor = (s: number) =>
    s <= 25 ? "text-destructive" : s <= 50 ? "text-orange-500" : s <= 75 ? "text-amber-500" : "text-green-500";
  const getScoreBg = (s: number) =>
    s <= 25 ? "bg-destructive/10" : s <= 50 ? "bg-orange-500/10" : s <= 75 ? "bg-amber-500/10" : "bg-green-500/10";

  const scoreColor = getScoreColor(score);
  const scoreBg = getScoreBg(score);

  return (
    <div className="space-y-4">
      {/* ═══════════════ ZONA 1: DIAGNÓSTICO (Fundo Claro) ═══════════════ */}

      {/* Resumo Executivo */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" /> Resumo Executivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground whitespace-pre-line">{result.resumo_executivo}</p>
        </CardContent>
      </Card>

      {/* Resumo do Cliente */}
      {result.resumo_cliente && (
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-primary" /> Sobre a Empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { label: "Empresa", value: result.resumo_cliente.nome_empresa },
              { label: "Segmento", value: result.resumo_cliente.segmento },
              { label: "Modelo", value: result.resumo_cliente.modelo_negocio },
              { label: "Diferencial", value: result.resumo_cliente.diferencial },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-xs font-semibold text-muted-foreground uppercase">{item.label}</p>
                <p className="text-sm">{item.value}</p>
              </div>
            ))}
            <div className="md:col-span-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Proposta de Valor</p>
              <p className="text-sm">{result.resumo_cliente.proposta_valor}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPIs Hero */}
      {result.kpis_hero && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Meta Faturamento", value: result.kpis_hero.meta_faturamento, icon: <Target className="w-4 h-4" /> },
            { label: "Ticket Médio", value: result.kpis_hero.ticket_medio, icon: <BarChart3 className="w-4 h-4" /> },
            { label: "Recorrência", value: result.kpis_hero.recorrencia, icon: <TrendingUp className="w-4 h-4" /> },
            { label: "LTV/CAC", value: result.kpis_hero.ltv_cac, icon: <Zap className="w-4 h-4" /> },
          ].map((kpi) => (
            <Card key={kpi.label} className="glass-card">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-1 text-primary mb-1">{kpi.icon}</div>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <p className="text-lg font-bold text-primary">{kpi.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* GPS Score + Scores Separados */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" /> GPS do Negócio — Diagnóstico
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`rounded-lg p-4 ${scoreBg} flex items-center gap-4`}>
            <div className="text-center">
              <p className={`text-4xl font-black ${scoreColor}`}>{score}%</p>
              <Badge className="mt-1 text-xs">{gps.nivel}</Badge>
            </div>
            <p className="text-sm flex-1">{gps.descricao}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className={`rounded-lg p-3 ${getScoreBg(scoreMarketing)} text-center`}>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Score Marketing</p>
              <p className={`text-2xl font-black ${getScoreColor(scoreMarketing)}`}>{scoreMarketing}%</p>
            </div>
            <div className={`rounded-lg p-3 ${getScoreBg(scoreComercial)} text-center`}>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Score Comercial</p>
              <p className={`text-2xl font-black ${getScoreColor(scoreComercial)}`}>{scoreComercial}%</p>
            </div>
          </div>
          <div>
            <Progress value={score} className="h-2" />
            <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
              <span>Crítico</span><span>Básico</span><span>Intermediário</span><span>Avançado</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Radar 5 eixos */}
      {gps.radar_data && gps.radar_data.length > 0 && (
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" /> Radar das 5 Etapas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div ref={radarRef}>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={gps.radar_data}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="eixo" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9 }} />
                  <Radar name="Score" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gargalos ECE */}
      {gps.gargalos_ece && (
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" /> Gargalos — Metodologia ECE
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { key: "estrutura", label: "🏗️ Estrutura", value: gps.gargalos_ece.estrutura || gps.gargalos_ece.infraestrutura },
              { key: "coleta", label: "📊 Coleta de Dados", value: gps.gargalos_ece.coleta },
              { key: "escala", label: "📈 Escala", value: gps.gargalos_ece.escala },
            ].map((g) => (
              <div key={g.key} className="border rounded-lg p-3">
                <p className="text-xs font-bold uppercase text-primary mb-1">{g.label}</p>
                <p className="text-sm text-muted-foreground">{g.value}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Persona */}
      {result.persona && (
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" /> Persona — Cliente Ideal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground whitespace-pre-line">{result.persona.descricao}</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                { label: "Faixa Etária", value: result.persona.faixa_etaria },
                { label: "Gênero", value: result.persona.genero },
                { label: "Poder Aquisitivo", value: result.persona.poder_aquisitivo },
              ].filter(i => i.value).map((item) => (
                <div key={item.label} className="bg-primary/5 rounded-lg p-2 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase">{item.label}</p>
                  <p className="text-sm font-bold">{item.value}</p>
                </div>
              ))}
            </div>
            {result.persona.canais?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Canais Principais</p>
                <div className="flex flex-wrap gap-1">
                  {result.persona.canais.map((c, i) => (
                    <Badge key={i} variant="secondary" className="text-[10px]">{c}</Badge>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Dor Principal</p>
              <p className="text-sm">{result.persona.dor_principal}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Decisão de Compra</p>
              <p className="text-sm">{result.persona.decisao_compra}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Análise de Concorrência */}
      {result.analise_concorrencia && (
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-primary" /> Análise de Concorrência
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {result.analise_concorrencia.concorrentes?.map((c, i) => (
              <div key={i} className="border rounded-lg p-3 space-y-2">
                <p className="text-sm font-bold flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-primary" /> {c.nome}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div>
                    <p className="text-[10px] font-semibold text-green-600 uppercase">Pontos Fortes</p>
                    {c.pontos_fortes.map((p, pi) => (
                      <p key={pi} className="text-xs text-muted-foreground">• {p}</p>
                    ))}
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-destructive uppercase">Pontos Fracos</p>
                    {c.pontos_fracos.map((p, pi) => (
                      <p key={pi} className="text-xs text-muted-foreground">• {p}</p>
                    ))}
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-blue-600 uppercase">Oportunidades</p>
                    {c.oportunidades.map((p, pi) => (
                      <p key={pi} className="text-xs text-muted-foreground">• {p}</p>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            <div className="border-t pt-3 space-y-2">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Diferencial da Empresa</p>
                <p className="text-sm">{result.analise_concorrencia.diferencial_empresa}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Posicionamento Recomendado</p>
                <p className="text-sm">{result.analise_concorrencia.posicionamento_recomendado}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights */}
      {gps.insights && gps.insights.length > 0 && (
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" /> Insights Personalizados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {gps.insights.map((insight, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="text-primary font-bold shrink-0">💡</span>
                <p>{insight}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ═══════════════ ZONA 2: PLANO ESTRATÉGICO (Fundo Escuro) ═══════════════ */}

      {(result.etapas || result.projecoes || result.entregaveis_calculadora?.length) && (
        <div className="bg-zinc-950 rounded-2xl p-4 md:p-6 -mx-2 space-y-6 mt-8">
          {/* Divider / Header */}
          <div className="text-center space-y-2 pb-4 border-b border-zinc-800">
            <p className="text-xs font-bold tracking-[0.3em] text-red-500 uppercase">NoExcuse</p>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">PLANO ESTRATÉGICO</h2>
            <p className="text-sm text-zinc-500">Metodologia 5 Etapas — Execução personalizada para o seu negócio</p>
          </div>

          {/* Visão Geral das 5 Etapas */}
          {result.etapas && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {(["conteudo", "trafego", "web", "sales", "validacao"] as const).map((key) => {
                  const etapa = result.etapas![key];
                  const colors = etapaColors[key];
                  return (
                    <div key={key} className={`bg-zinc-900 border ${colors.border} rounded-xl p-4 text-center`}>
                      <p className={`text-2xl font-black ${colors.accent}`}>{etapaNumbers[key]}</p>
                      <div className={`flex items-center justify-center gap-1 ${colors.accent} my-2`}>{etapaIcons[key]}</div>
                      <p className="text-[11px] font-semibold leading-tight text-zinc-300">{etapaLabels[key]}</p>
                      <ScoreCircle score={etapa.score} size={48} strokeWidth={4} className="mt-2" />
                    </div>
                  );
                })}
              </div>

              {/* Detailed Etapas — Expanded Cards */}
              {(["conteudo", "trafego", "web", "sales", "validacao"] as const).map((key) => (
                <EtapaDetailCardDark key={key} etapaKey={key} etapa={result.etapas![key]} />
              ))}
            </>
          )}

          {/* Projeções */}
          {result.projecoes && <ProjecoesSectionDark projecoes={result.projecoes} barChartRef={barChartRef} lineChartRef={lineChartRef} />}

          {/* Execuções do Plano */}
          {result.entregaveis_calculadora && result.entregaveis_calculadora.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-red-500" />
                <h3 className="text-lg font-bold text-white">Execuções do Plano — O Que Precisa Ser Feito</h3>
              </div>
              <p className="text-sm text-zinc-500">
                Para que o plano estratégico seja executado com sucesso, os seguintes serviços do catálogo NoExcuse precisam ser contratados e implementados:
              </p>
              {(() => {
                const grouped: Record<string, typeof result.entregaveis_calculadora> = {};
                result.entregaveis_calculadora!.forEach((e) => {
                  const key = e.etapa || "geral";
                  if (!grouped[key]) grouped[key] = [];
                  grouped[key]!.push(e);
                });
                const order = ["conteudo", "trafego", "web", "sales", "validacao", "geral"];
                return order.filter((k) => grouped[k]?.length).map((key) => {
                  const colors = etapaColors[key] || { accent: "text-zinc-400", bg: "bg-zinc-800", border: "border-zinc-700" };
                  return (
                    <div key={key} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={`${colors.accent}`}>{etapaIcons[key] || <Package className="w-4 h-4" />}</span>
                        <p className={`text-sm font-bold ${colors.accent} uppercase`}>
                          {etapaNumbers[key] ? `${etapaNumbers[key]} — ` : ""}{etapaLabels[key] || "Geral"}
                        </p>
                      </div>
                      {grouped[key]!.map((e, i) => (
                        <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 flex items-start gap-3 ml-6">
                          <Badge className="text-[10px] shrink-0 font-bold bg-red-600/20 text-red-400 border-red-600/30">x{e.quantity}</Badge>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white">{e.service_name}</p>
                            <p className="text-xs text-zinc-500">{e.justificativa}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                });
              })()}
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-center mt-2">
                <p className="text-sm text-zinc-400">
                  Total de <span className="font-bold text-red-500">{result.entregaveis_calculadora.length}</span> serviços recomendados para execução do plano
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Etapa Detail Card (Dark Theme — Expanded) ───────────────────

function EtapaDetailCardDark({ etapaKey, etapa }: { etapaKey: string; etapa: EtapaEstrategica }) {
  const colors = etapaColors[etapaKey];

  return (
    <div className={`bg-zinc-900 border ${colors.border} rounded-xl overflow-hidden`}>
      {/* Header */}
      <div className="p-5 flex items-center gap-4">
        <div className="flex-shrink-0">
          <p className={`text-5xl font-black ${colors.accent} opacity-80 leading-none`}>{etapaNumbers[etapaKey]}</p>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={colors.accent}>{etapaIcons[etapaKey]}</span>
            <h3 className="text-base font-bold text-white">{etapaLabels[etapaKey]}</h3>
          </div>
          <p className="text-sm text-zinc-400 line-clamp-2">{etapa.diagnostico}</p>
        </div>
        <ScoreCircle score={etapa.score} size={56} strokeWidth={4} />
      </div>

      {/* Content */}
      <div className="px-5 pb-5 space-y-5">
        {/* Problemas */}
        {etapa.problemas.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold text-red-400 uppercase tracking-wide">⚠ Problemas Identificados</p>
            <div className="space-y-1.5">
              {etapa.problemas.map((p, i) => (
                <div key={i} className="flex items-start gap-2 text-sm bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                  <span className="text-zinc-300">{p}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ações Estratégicas */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-emerald-400 uppercase tracking-wide">✓ Ações Estratégicas</p>
          <div className="space-y-1.5">
            {etapa.acoes.map((a, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                </div>
                <span className="text-zinc-200">{a}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Métricas-alvo */}
        {etapa.metricas_alvo && Object.keys(etapa.metricas_alvo).length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold text-blue-400 uppercase tracking-wide">📊 Métricas-Alvo</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.entries(etapa.metricas_alvo).map(([key, val]) => (
                <div key={key} className={`${colors.bg} border ${colors.border} rounded-lg p-2.5 text-center`}>
                  <p className="text-[10px] text-zinc-500 uppercase">{key.replace(/_/g, " ")}</p>
                  <p className={`text-sm font-bold ${colors.accent}`}>{val}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Entregáveis */}
        {etapa.entregaveis.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wide">📦 Entregáveis NoExcuse</p>
            <div className="flex flex-wrap gap-1.5">
              {etapa.entregaveis.map((e, i) => (
                <Badge key={i} className="text-[10px] bg-zinc-800 text-zinc-300 border-zinc-700">{e}</Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Projeções Section (Dark Theme) ──────────────────────────────

function ProjecoesSectionDark({ projecoes, barChartRef, lineChartRef }: { projecoes: NonNullable<StrategyResult["projecoes"]>; barChartRef?: React.RefObject<HTMLDivElement>; lineChartRef?: React.RefObject<HTMLDivElement> }) {
  return (
    <div className="space-y-4">
      {/* Unit Economics */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Calculator className="w-5 h-5 text-red-500" />
          <h3 className="text-lg font-bold text-white">Unit Economics</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "CAC", value: projecoes.unit_economics.cac },
            { label: "LTV", value: projecoes.unit_economics.ltv },
            { label: "LTV/CAC", value: projecoes.unit_economics.ltv_cac_ratio },
            { label: "Ticket Médio", value: projecoes.unit_economics.ticket_medio },
            { label: "Margem", value: projecoes.unit_economics.margem },
          ].map((item) => (
            <div key={item.label} className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-center">
              <p className="text-[10px] text-zinc-500 uppercase">{item.label}</p>
              <p className="text-lg font-bold text-red-500">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Funil de Conversão */}
      {projecoes.funil_conversao && projecoes.funil_conversao.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Layers className="w-5 h-5 text-red-500" />
            <h3 className="text-lg font-bold text-white">Funil de Conversão</h3>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-2">
            {projecoes.funil_conversao.map((etapa, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-xs font-bold text-red-400">{i + 1}</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-zinc-200">{etapa.etapa}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-white">{etapa.volume.toLocaleString("pt-BR")}</p>
                  <p className="text-[10px] text-zinc-500">{etapa.taxa}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projeção Mensal Chart */}
      {projecoes.projecao_mensal && projecoes.projecao_mensal.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-red-500" />
            <h3 className="text-lg font-bold text-white">Projeção de 6 Meses</h3>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4" ref={barChartRef}>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={projecoes.projecao_mensal.map(p => ({ ...p, nome: `Mês ${p.mes}` }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="nome" tick={{ fontSize: 10, fill: "#71717a" }} />
                <YAxis tick={{ fontSize: 10, fill: "#71717a" }} />
                <Tooltip
                  formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`}
                  contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: 8, color: "#fff" }}
                  labelStyle={{ color: "#a1a1aa" }}
                />
                <Legend wrapperStyle={{ fontSize: 10, color: "#a1a1aa" }} />
                <Bar dataKey="receita" name="Receita" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="investimento" name="Investimento" fill="rgba(239,68,68,0.25)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Crescimento Acumulado */}
      {projecoes.crescimento_acumulado && projecoes.crescimento_acumulado.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <LineChart className="w-5 h-5 text-red-500" />
            <h3 className="text-lg font-bold text-white">Crescimento Acumulado</h3>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4" ref={lineChartRef}>
            <ResponsiveContainer width="100%" height={250}>
              <ReLineChart data={projecoes.crescimento_acumulado.map(p => ({ ...p, nome: `Mês ${p.mes}` }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="nome" tick={{ fontSize: 10, fill: "#71717a" }} />
                <YAxis tick={{ fontSize: 10, fill: "#71717a" }} />
                <Tooltip
                  formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`}
                  contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: 8, color: "#fff" }}
                  labelStyle={{ color: "#a1a1aa" }}
                />
                <Legend wrapperStyle={{ fontSize: 10, color: "#a1a1aa" }} />
                <Line type="monotone" dataKey="receita_acumulada" name="Receita Acumulada" stroke="#ef4444" strokeWidth={2} dot={{ fill: "#ef4444" }} />
              </ReLineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Legacy New Format View (diagnostico_negocio) ────────────────

function LegacyNewFormatView({ result }: { result: StrategyResult }) {
  const diag = result.diagnostico_negocio!;
  const matScore = diag.maturidade.score;

  const maturityColor =
    matScore <= 25 ? "text-destructive" :
    matScore <= 50 ? "text-orange-500" :
    matScore <= 75 ? "text-amber-500" : "text-green-500";

  const maturityBg =
    matScore <= 25 ? "bg-destructive/10" :
    matScore <= 50 ? "bg-orange-500/10" :
    matScore <= 75 ? "bg-amber-500/10" : "bg-green-500/10";

  return (
    <div className="space-y-4">
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" /> Resumo Executivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground whitespace-pre-line">{result.resumo_executivo}</p>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" /> Termômetro de Maturidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`rounded-lg p-4 ${maturityBg} flex items-center gap-4`}>
            <div className="text-center">
              <p className={`text-3xl font-bold ${maturityColor}`}>{matScore}%</p>
              <p className={`text-sm font-semibold ${maturityColor}`}>{diag.maturidade.nivel}</p>
            </div>
            <p className="text-sm flex-1">{diag.maturidade.descricao}</p>
          </div>
        </CardContent>
      </Card>

      {diag.radar_data && diag.radar_data.length > 0 && (
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" /> Análise por Área
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={diag.radar_data}>
                <PolarGrid />
                <PolarAngleAxis dataKey="eixo" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fontSize: 10 }} />
                <Radar name="Score" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {result.servicos_indicados && result.servicos_indicados.length > 0 && (
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" /> Serviços Indicados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {result.servicos_indicados.map((s, i) => (
              <div key={i} className="border rounded-md p-3">
                <p className="text-sm font-medium">{s.servico}</p>
                <p className="text-xs text-muted-foreground">{s.justificativa}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {result.roadmap && result.roadmap.length > 0 && (
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Map className="w-4 h-4 text-primary" /> Roadmap
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {result.roadmap.map((fase) => (
              <div key={fase.fase} className="border rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-[10px]">{fase.periodo}</Badge>
                  <p className="text-sm font-semibold">Fase {fase.fase} — {fase.titulo}</p>
                </div>
                <div className="space-y-1">
                  {fase.acoes.map((a, ai) => (
                    <div key={ai} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                      <span>{a}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Legacy Strategy Result View ─────────────────────────────────

function LegacyStrategyResultView({ result }: { result: StrategyResult }) {
  if (!result?.maturidade) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Resultado incompleto. Tente regenerar a estratégia.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" /> Resumo Executivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground whitespace-pre-line">{result.resumo_executivo}</p>
        </CardContent>
      </Card>

      {result.plano_acao && (
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Plano de Ação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.plano_acao.map((fase, fi) => (
              <div key={fi} className="border rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-[10px]">{fase.periodo}</Badge>
                  <p className="text-sm font-semibold">{fase.fase}</p>
                </div>
                <div className="space-y-1.5">
                  {fase.acoes.map((a, ai) => (
                    <div key={ai} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                      <span>{a.acao}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
