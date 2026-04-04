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
import type { StrategyResult, EtapaEstrategica } from "@/hooks/useFranqueadoStrategies";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer,
  LineChart as ReLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar,
} from "recharts";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useNavigate } from "react-router-dom";

// ── PDF Export Helper ────────────────────────────────────────────

function exportPdf(element: HTMLElement, title: string) {
  Promise.all([import("jspdf"), import("html2canvas")]).then(([{ default: jsPDF }, { default: html2canvas }]) => {
    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.background = "#ffffff";
    clone.style.color = "#1a1a1a";
    clone.style.padding = "24px";
    clone.style.width = "800px";
    clone.querySelectorAll(".glass-card").forEach((el) => {
      (el as HTMLElement).style.background = "#ffffff";
      (el as HTMLElement).style.border = "1px solid #e5e7eb";
      (el as HTMLElement).style.boxShadow = "none";
    });
    clone.querySelectorAll("[class*='text-muted']").forEach((el) => {
      (el as HTMLElement).style.color = "#4b5563";
    });
    clone.querySelectorAll("[class*='text-primary']").forEach((el) => {
      (el as HTMLElement).style.color = "#dc2626";
    });

    document.body.appendChild(clone);

    html2canvas(clone, { scale: 2, useCORS: true, backgroundColor: "#ffffff" }).then((canvas) => {
      document.body.removeChild(clone);
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgW = pageW - 20;
      const imgH = (canvas.height * imgW) / canvas.width;
      let y = 0;
      const margin = 10;
      while (y < imgH) {
        if (y > 0) pdf.addPage();
        pdf.addImage(imgData, "JPEG", margin, margin - y, imgW, imgH);
        y += pageH - margin * 2;
      }
      pdf.save(`${title.replace(/[^a-zA-Z0-9À-ú ]/g, "")}.pdf`);
    });
  });
}

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
  const isNewFormat = !!result.diagnostico_gps;
  const isLegacyNewFormat = !!result.diagnostico_negocio;

  const handleExportPdf = () => {
    if (contentRef.current) {
      exportPdf(contentRef.current, title || "Planejamento Estratégico");
      toast.success("PDF gerado com sucesso!");
    }
  };

  return (
    <div className="space-y-4">
      {showExport && (
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleExportPdf}>
            <Download className="w-4 h-4 mr-1" /> Exportar PDF
          </Button>
          {onSendToCalculator && result.entregaveis_calculadora && result.entregaveis_calculadora.length > 0 && (
            <Button variant="default" size="sm" onClick={onSendToCalculator}>
              <Calculator className="w-4 h-4 mr-1" /> Enviar para Calculadora
            </Button>
          )}
        </div>
      )}
      <div ref={contentRef}>
        {isNewFormat ? (
          <NewStrategyResultView result={result} />
        ) : isLegacyNewFormat ? (
          <LegacyNewFormatView result={result} />
        ) : (
          <LegacyStrategyResultView result={result} />
        )}
      </div>
    </div>
  );
}

// ── New 5-Step Strategy Result View ─────────────────────────────

function NewStrategyResultView({ result }: { result: StrategyResult }) {
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
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={gps.radar_data}>
                <PolarGrid />
                <PolarAngleAxis dataKey="eixo" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9 }} />
                <Radar name="Score" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
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
              { key: "infraestrutura", label: "🏗️ Estruturar (Infraestrutura)", value: gps.gargalos_ece.infraestrutura },
              { key: "coleta", label: "📊 Coletar (Dados)", value: gps.gargalos_ece.coleta },
              { key: "escala", label: "📈 Escalar", value: gps.gargalos_ece.escala },
            ].map((g) => (
              <div key={g.key} className="border rounded-lg p-3">
                <p className="text-xs font-bold uppercase text-primary mb-1">{g.label}</p>
                <p className="text-sm text-muted-foreground">{g.value}</p>
              </div>
            ))}
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

      {/* Visão Geral das 5 Etapas */}
      {result.etapas && (
        <>
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Map className="w-4 h-4 text-primary" /> Visão Geral — 5 Etapas Estratégicas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                {(["conteudo", "trafego", "web", "sales", "validacao"] as const).map((key) => {
                  const etapa = result.etapas![key];
                  const etapaScoreColor =
                    etapa.score <= 25 ? "text-destructive" :
                    etapa.score <= 50 ? "text-orange-500" :
                    etapa.score <= 75 ? "text-amber-500" : "text-green-500";
                  return (
                    <div key={key} className="border rounded-lg p-3 text-center">
                      <p className="text-lg font-black text-primary">{etapaNumbers[key]}</p>
                      <div className="flex items-center justify-center gap-1 text-primary my-1">{etapaIcons[key]}</div>
                      <p className="text-[11px] font-semibold leading-tight">{etapaLabels[key]}</p>
                      <p className={`text-sm font-bold mt-1 ${etapaScoreColor}`}>{etapa.score}%</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Detailed view for each etapa */}
          {(["conteudo", "trafego", "web", "sales", "validacao"] as const).map((key) => (
            <EtapaDetailCard key={key} etapaKey={key} etapa={result.etapas![key]} />
          ))}
        </>
      )}

      {/* Projeções */}
      {result.projecoes && <ProjecoesSection projecoes={result.projecoes} />}

      {/* Entregáveis para Calculadora */}
      {result.entregaveis_calculadora && result.entregaveis_calculadora.length > 0 && (
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" /> Entregáveis Recomendados — Catálogo NoExcuse
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {result.entregaveis_calculadora.map((e, i) => (
              <div key={i} className="border rounded-md p-3 flex items-start gap-3">
                <Badge variant="outline" className="text-[10px] shrink-0">x{e.quantity}</Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{e.service_name}</p>
                  <p className="text-xs text-muted-foreground">{e.justificativa}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Etapa Detail Card ───────────────────────────────────────────

function EtapaDetailCard({ etapaKey, etapa }: { etapaKey: string; etapa: EtapaEstrategica }) {
  const [open, setOpen] = useState(false);

  const scoreColor =
    etapa.score <= 25 ? "text-destructive" :
    etapa.score <= 50 ? "text-orange-500" :
    etapa.score <= 75 ? "text-amber-500" : "text-green-500";

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="glass-card">
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-2 cursor-pointer hover:bg-accent/5 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <span className="text-primary font-black">{etapaNumbers[etapaKey]}</span>
                {etapaIcons[etapaKey]}
                {etapaLabels[etapaKey]}
                <Badge variant="outline" className={`text-[10px] ${scoreColor}`}>{etapa.score}%</Badge>
              </CardTitle>
              {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-4 pt-0">
            {/* Diagnóstico */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Diagnóstico</p>
              <p className="text-sm whitespace-pre-line">{etapa.diagnostico}</p>
            </div>

            {/* Problemas */}
            {etapa.problemas.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Problemas Identificados</p>
                <div className="space-y-1">
                  {etapa.problemas.map((p, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
                      <span>{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ações */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Ações Estratégicas</p>
              <div className="space-y-1">
                {etapa.acoes.map((a, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <span>{a}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Métricas-alvo */}
            {etapa.metricas_alvo && Object.keys(etapa.metricas_alvo).length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Métricas-Alvo</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.entries(etapa.metricas_alvo).map(([key, val]) => (
                    <div key={key} className="bg-primary/5 rounded-lg p-2 text-center">
                      <p className="text-[10px] text-muted-foreground uppercase">{key.replace(/_/g, " ")}</p>
                      <p className="text-sm font-bold text-primary">{val}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Entregáveis */}
            {etapa.entregaveis.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Entregáveis NoExcuse</p>
                <div className="flex flex-wrap gap-1">
                  {etapa.entregaveis.map((e, i) => (
                    <Badge key={i} variant="secondary" className="text-[10px]">{e}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

// ── Projeções Section ───────────────────────────────────────────

function ProjecoesSection({ projecoes }: { projecoes: NonNullable<StrategyResult["projecoes"]> }) {
  return (
    <>
      {/* Unit Economics */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Calculator className="w-4 h-4 text-primary" /> Unit Economics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: "CAC", value: projecoes.unit_economics.cac },
              { label: "LTV", value: projecoes.unit_economics.ltv },
              { label: "LTV/CAC", value: projecoes.unit_economics.ltv_cac_ratio },
              { label: "Ticket Médio", value: projecoes.unit_economics.ticket_medio },
              { label: "Margem", value: projecoes.unit_economics.margem },
            ].map((item) => (
              <div key={item.label} className="bg-primary/5 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-lg font-bold text-primary">{item.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Funil de Conversão */}
      {projecoes.funil_conversao && projecoes.funil_conversao.length > 0 && (
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" /> Funil de Conversão
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {projecoes.funil_conversao.map((etapa, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{i + 1}</div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{etapa.etapa}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{etapa.volume.toLocaleString("pt-BR")}</p>
                  <p className="text-[10px] text-muted-foreground">{etapa.taxa}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Projeção Mensal Chart */}
      {projecoes.projecao_mensal && projecoes.projecao_mensal.length > 0 && (
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Projeção de 6 Meses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={projecoes.projecao_mensal.map(p => ({ ...p, nome: `Mês ${p.mes}` }))}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="nome" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="receita" name="Receita" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="investimento" name="Investimento" fill="hsl(var(--primary) / 0.3)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Crescimento Acumulado */}
      {projecoes.crescimento_acumulado && projecoes.crescimento_acumulado.length > 0 && (
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <LineChart className="w-4 h-4 text-primary" /> Crescimento Acumulado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <ReLineChart data={projecoes.crescimento_acumulado.map(p => ({ ...p, nome: `Mês ${p.mes}` }))}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="nome" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="receita_acumulada" name="Receita Acumulada" stroke="hsl(var(--primary))" strokeWidth={2} />
              </ReLineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </>
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
