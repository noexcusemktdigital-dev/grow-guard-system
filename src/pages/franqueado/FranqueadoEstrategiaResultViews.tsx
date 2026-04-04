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

// ── PDF Export Helper (Professional A4) ─────────────────────────

async function exportProfessionalPdf(element: HTMLElement, title: string, result: StrategyResult) {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import("jspdf"),
    import("html2canvas"),
  ]);

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentW = pageW - margin * 2;
  let y = margin;

  const PRIMARY = [220, 38, 38]; // red-600
  const DARK = [26, 26, 26];
  const GRAY = [107, 114, 128];
  const LIGHT_BG = [249, 250, 251];

  function addPage() {
    pdf.addPage();
    y = margin;
  }

  function checkSpace(needed: number) {
    if (y + needed > pageH - margin) addPage();
  }

  function drawSectionHeader(text: string) {
    checkSpace(14);
    pdf.setFillColor(...PRIMARY);
    pdf.rect(margin, y, contentW, 8, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.text(text.toUpperCase(), margin + 4, y + 5.5);
    y += 12;
    pdf.setTextColor(...DARK);
  }

  function drawText(text: string, fontSize = 9, color = DARK, bold = false) {
    pdf.setFontSize(fontSize);
    pdf.setTextColor(...color);
    pdf.setFont("helvetica", bold ? "bold" : "normal");
    const lines = pdf.splitTextToSize(text, contentW - 4);
    const lineH = fontSize * 0.45;
    checkSpace(lines.length * lineH + 2);
    pdf.text(lines, margin + 2, y);
    y += lines.length * lineH + 2;
  }

  function drawKeyValue(key: string, value: string) {
    pdf.setFontSize(8);
    pdf.setTextColor(...GRAY);
    pdf.setFont("helvetica", "bold");
    checkSpace(8);
    pdf.text(key.toUpperCase(), margin + 2, y);
    y += 3.5;
    pdf.setFontSize(9);
    pdf.setTextColor(...DARK);
    pdf.setFont("helvetica", "normal");
    const lines = pdf.splitTextToSize(value, contentW - 4);
    pdf.text(lines, margin + 2, y);
    y += lines.length * 4 + 3;
  }

  function drawBullet(text: string, icon = "•") {
    pdf.setFontSize(9);
    pdf.setTextColor(...DARK);
    pdf.setFont("helvetica", "normal");
    const lines = pdf.splitTextToSize(text, contentW - 10);
    checkSpace(lines.length * 4 + 1);
    pdf.text(icon, margin + 3, y);
    pdf.text(lines, margin + 8, y);
    y += lines.length * 4 + 1.5;
  }

  // ── COVER PAGE ──
  pdf.setFillColor(...PRIMARY);
  pdf.rect(0, 0, pageW, pageH, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(32);
  pdf.setFont("helvetica", "bold");
  pdf.text("DIAGNÓSTICO", pageW / 2, pageH * 0.35, { align: "center" });
  pdf.text("ESTRATÉGICO", pageW / 2, pageH * 0.35 + 14, { align: "center" });
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "normal");
  pdf.text("Metodologia NoExcuse — 5 Etapas", pageW / 2, pageH * 0.35 + 28, { align: "center" });

  // Divider line
  pdf.setDrawColor(255, 255, 255);
  pdf.setLineWidth(0.5);
  pdf.line(pageW * 0.3, pageH * 0.5, pageW * 0.7, pageH * 0.5);

  if (result.resumo_cliente?.nome_empresa) {
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.text(result.resumo_cliente.nome_empresa, pageW / 2, pageH * 0.58, { align: "center" });
  }
  if (title) {
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.text(title, pageW / 2, pageH * 0.64, { align: "center" });
  }
  pdf.setFontSize(10);
  pdf.text(new Date().toLocaleDateString("pt-BR"), pageW / 2, pageH * 0.9, { align: "center" });
  pdf.text("NoExcuse Digital", pageW / 2, pageH * 0.93, { align: "center" });

  // ── CONTENT PAGES ──
  addPage();

  // Resumo Executivo
  drawSectionHeader("Resumo Executivo");
  drawText(result.resumo_executivo || "", 9);
  y += 4;

  // Empresa
  if (result.resumo_cliente) {
    drawSectionHeader("Sobre a Empresa");
    drawKeyValue("Empresa", result.resumo_cliente.nome_empresa);
    drawKeyValue("Segmento", result.resumo_cliente.segmento);
    drawKeyValue("Modelo de Negócio", result.resumo_cliente.modelo_negocio);
    drawKeyValue("Diferencial", result.resumo_cliente.diferencial);
    drawKeyValue("Proposta de Valor", result.resumo_cliente.proposta_valor);
    y += 4;
  }

  // Scores
  if (result.diagnostico_gps) {
    const gps = result.diagnostico_gps;
    drawSectionHeader(`GPS do Negócio — Score Geral: ${gps.score_geral}% (${gps.nivel})`);
    drawText(gps.descricao, 9);
    y += 2;
    drawKeyValue("Score Marketing", `${result.score_marketing ?? 0}%`);
    drawKeyValue("Score Comercial", `${result.score_comercial ?? 0}%`);

    // ECE
    if (gps.gargalos_ece) {
      y += 2;
      drawText("GARGALOS ECE", 9, PRIMARY, true);
      drawKeyValue("Estrutura", gps.gargalos_ece.estrutura || (gps.gargalos_ece as any).infraestrutura || "");
      drawKeyValue("Coleta de Dados", gps.gargalos_ece.coleta);
      drawKeyValue("Escala", gps.gargalos_ece.escala);
    }

    // Insights
    if (gps.insights?.length) {
      y += 2;
      drawText("INSIGHTS", 9, PRIMARY, true);
      gps.insights.forEach((i) => drawBullet(i, "💡"));
    }
    y += 4;
  }

  // Persona
  if (result.persona) {
    drawSectionHeader("Persona — Cliente Ideal");
    drawText(result.persona.descricao, 9);
    if (result.persona.faixa_etaria) drawKeyValue("Faixa Etária", result.persona.faixa_etaria);
    if (result.persona.dor_principal) drawKeyValue("Dor Principal", result.persona.dor_principal);
    if (result.persona.decisao_compra) drawKeyValue("Decisão de Compra", result.persona.decisao_compra);
    if (result.persona.canais?.length) drawKeyValue("Canais", result.persona.canais.join(", "));
    y += 4;
  }

  // Concorrência
  if (result.analise_concorrencia) {
    drawSectionHeader("Análise de Concorrência");
    result.analise_concorrencia.concorrentes?.forEach((c) => {
      drawText(c.nome, 10, DARK, true);
      c.pontos_fortes.forEach((p) => drawBullet(`Forte: ${p}`, "✓"));
      c.pontos_fracos.forEach((p) => drawBullet(`Fraco: ${p}`, "✗"));
      c.oportunidades.forEach((p) => drawBullet(`Oportunidade: ${p}`, "→"));
      y += 2;
    });
    drawKeyValue("Diferencial", result.analise_concorrencia.diferencial_empresa);
    drawKeyValue("Posicionamento", result.analise_concorrencia.posicionamento_recomendado);
    y += 4;
  }

  // 5 Etapas
  if (result.etapas) {
    const etapasOrder = ["conteudo", "trafego", "web", "sales", "validacao"] as const;
    const labels: Record<string, string> = {
      conteudo: "01 — Conteúdo e Linha Editorial",
      trafego: "02 — Tráfego e Distribuição",
      web: "03 — Web e Conversão",
      sales: "04 — Sales e Fechamento",
      validacao: "05 — Validação e Escala",
    };
    for (const key of etapasOrder) {
      const etapa = result.etapas[key];
      if (!etapa) continue;
      drawSectionHeader(`${labels[key]} — Score: ${etapa.score}%`);
      drawText(etapa.diagnostico, 9);
      y += 2;
      if (etapa.problemas?.length) {
        drawText("PROBLEMAS", 8, GRAY, true);
        etapa.problemas.forEach((p) => drawBullet(p, "⚠"));
      }
      if (etapa.acoes?.length) {
        drawText("AÇÕES ESTRATÉGICAS", 8, GRAY, true);
        etapa.acoes.forEach((a) => drawBullet(a, "→"));
      }
      if (etapa.metricas_alvo && Object.keys(etapa.metricas_alvo).length) {
        drawText("MÉTRICAS-ALVO", 8, GRAY, true);
        Object.entries(etapa.metricas_alvo).forEach(([k, v]) => drawKeyValue(k, v));
      }
      y += 4;
    }
  }

  // Projeções
  if (result.projecoes) {
    drawSectionHeader("Projeções Financeiras");
    const ue = result.projecoes.unit_economics;
    drawKeyValue("CAC", ue.cac);
    drawKeyValue("LTV", ue.ltv);
    drawKeyValue("LTV/CAC", ue.ltv_cac_ratio);
    drawKeyValue("Ticket Médio", ue.ticket_medio);
    drawKeyValue("Margem", ue.margem);

    if (result.projecoes.projecao_mensal?.length) {
      y += 2;
      drawText("PROJEÇÃO DE 6 MESES", 9, PRIMARY, true);
      result.projecoes.projecao_mensal.forEach((p) => {
        drawBullet(`Mês ${p.mes}: ${p.leads} leads → ${p.clientes} clientes → R$ ${p.receita.toLocaleString("pt-BR")} receita (inv: R$ ${p.investimento.toLocaleString("pt-BR")})`, "📊");
      });
    }
    y += 4;
  }

  // Entregáveis / Execuções
  if (result.entregaveis_calculadora?.length) {
    drawSectionHeader("Execuções do Plano — Entregáveis NoExcuse");
    const grouped: Record<string, typeof result.entregaveis_calculadora> = {};
    result.entregaveis_calculadora.forEach((e) => {
      const key = e.etapa || "geral";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(e);
    });
    const etapaNames: Record<string, string> = {
      conteudo: "Conteúdo", trafego: "Tráfego", web: "Web", sales: "Sales", validacao: "Validação/Escala", geral: "Geral",
    };
    Object.entries(grouped).forEach(([key, items]) => {
      drawText(etapaNames[key] || key, 10, PRIMARY, true);
      items.forEach((e) => {
        drawBullet(`${e.service_name} (x${e.quantity}) — ${e.justificativa}`, "📦");
      });
      y += 2;
    });
  }

  // Footer on last page
  pdf.setFontSize(8);
  pdf.setTextColor(...GRAY);
  pdf.text("Documento gerado automaticamente — NoExcuse Digital", pageW / 2, pageH - 8, { align: "center" });

  pdf.save(`${title.replace(/[^a-zA-Z0-9À-ú ]/g, "")}.pdf`);
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
              { key: "estrutura", label: "🏗️ Estrutura", value: gps.gargalos_ece.estrutura || (gps.gargalos_ece as any).infraestrutura },
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
