// @ts-nocheck
import { useRef } from "react";
import {
  CheckCircle2, FileText, ClipboardCheck, Target, AlertTriangle,
  TrendingUp, Package, Layers, Map, BarChart3, Calculator, Download,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import type { StrategyResult } from "@/hooks/useFranqueadoStrategies";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer,
} from "recharts";

// ── PDF Export Helper ────────────────────────────────────────────

function exportPdf(element: HTMLElement, title: string) {
  Promise.all([import("jspdf"), import("html2canvas")]).then(([{ default: jsPDF }, { default: html2canvas }]) => {
    html2canvas(element, { scale: 2, useCORS: true, backgroundColor: "#ffffff" }).then((canvas) => {
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgW = pageW;
      const imgH = (canvas.height * imgW) / canvas.width;
      let y = 0;
      while (y < imgH) { if (y > 0) pdf.addPage(); pdf.addImage(imgData, "JPEG", 0, -y, imgW, imgH); y += pageH; }
      pdf.save(`${title.replace(/[^a-zA-Z0-9À-ú ]/g, "")}.pdf`);
    });
  });
}

// ── Strategy Result View ────────────────────────────────────────

export function StrategyResultView({ result, title, showExport = true }: { result: StrategyResult; title?: string; showExport?: boolean }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const isNewFormat = !!result.diagnostico_negocio;

  const handleExportPdf = () => {
    if (contentRef.current) {
      exportPdf(contentRef.current, title || "Diagnóstico Estratégico");
      toast.success("PDF gerado com sucesso!");
    }
  };

  return (
    <div className="space-y-4">
      {showExport && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={handleExportPdf}>
            <Download className="w-4 h-4 mr-1" /> Exportar PDF
          </Button>
        </div>
      )}
      <div ref={contentRef}>
        {isNewFormat ? <NewStrategyResultView result={result} /> : <LegacyStrategyResultView result={result} />}
      </div>
    </div>
  );
}

function NewStrategyResultView({ result }: { result: StrategyResult }) {
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

  const prioridadeColor: Record<string, string> = {
    essencial: "bg-destructive/10 text-destructive",
    recomendado: "bg-primary/10 text-primary",
    opcional: "bg-muted text-muted-foreground",
  };

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
            <ClipboardCheck className="w-4 h-4 text-primary" /> Diagnóstico do Negócio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">Modelo de Negócio</p>
            <p className="text-sm whitespace-pre-line">{diag.modelo}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">Momento Atual</p>
            <p className="text-sm whitespace-pre-line">{diag.momento}</p>
          </div>
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
          <div className="mt-3">
            <Progress value={matScore} className="h-2" />
            <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
              <span>Inicial</span><span>Desenvolvimento</span><span>Estruturado</span><span>Avançado</span><span>Excelência</span>
            </div>
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

      {result.problemas_identificados && result.problemas_identificados.length > 0 && (
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-primary" /> Problemas Identificados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {result.problemas_identificados.map((p, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="text-destructive font-bold shrink-0">{i + 1}.</span>
                <p>{p}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {result.gargalos && (
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" /> Gargalos Estratégicos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(result.gargalos).map(([key, value]) => (
              <div key={key} className="border rounded-lg p-3">
                <p className="text-xs font-bold uppercase text-primary mb-1">
                  {key === "aquisicao" ? "Aquisição" : key === "conversao" ? "Conversão" : key === "estrutura" ? "Estrutura" : "Posicionamento"}
                </p>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{value}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {result.projecao_crescimento && (
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Calculator className="w-4 h-4 text-primary" /> Projeção de Crescimento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-primary/5 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Meta Faturamento</p>
                <p className="text-lg font-bold text-primary">{result.projecao_crescimento.meta_faturamento}</p>
              </div>
              <div className="bg-primary/5 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Vendas/mês</p>
                <p className="text-lg font-bold text-primary">{result.projecao_crescimento.vendas_necessarias}</p>
              </div>
              <div className="bg-primary/5 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Leads/mês</p>
                <p className="text-lg font-bold text-primary">{result.projecao_crescimento.leads_necessarios}</p>
              </div>
              <div className="bg-primary/5 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Conversão</p>
                <p className="text-lg font-bold text-primary">{result.projecao_crescimento.taxa_conversao}%</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-line">{result.projecao_crescimento.descricao}</p>
          </CardContent>
        </Card>
      )}

      {result.estrategia_recomendada && (
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Estratégia Recomendada
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(result.estrategia_recomendada).map(([pilar, acoes]) => (
              <div key={pilar} className="border rounded-lg p-3">
                <p className="text-xs font-bold uppercase text-primary mb-2">
                  {pilar === "estrutura" ? "🏗️ Estrutura" : pilar === "aquisicao" ? "📣 Aquisição" : pilar === "conversao" ? "🎯 Conversão" : "📈 Escala"}
                </p>
                <div className="space-y-1">
                  {acoes.map((a, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
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

      {result.servicos_indicados && result.servicos_indicados.length > 0 && (
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" /> Serviços Indicados NOEXCUSE
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {result.servicos_indicados.map((s, i) => (
              <div key={i} className="border rounded-md p-3 flex items-start gap-3">
                <div className={`px-2 py-0.5 rounded text-[10px] font-semibold shrink-0 ${prioridadeColor[s.prioridade] || "bg-muted text-muted-foreground"}`}>
                  {s.prioridade}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{s.servico}</p>
                  <p className="text-xs text-muted-foreground">{s.justificativa}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {result.roadmap && result.roadmap.length > 0 && (
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Map className="w-4 h-4 text-primary" /> Roadmap de Execução
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.roadmap.map((fase) => (
              <div key={fase.fase} className="border rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-[10px]">{fase.periodo}</Badge>
                  <p className="text-sm font-semibold">Fase {fase.fase} — {fase.titulo}</p>
                </div>
                <div className="space-y-1.5">
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

function LegacyStrategyResultView({ result }: { result: StrategyResult }) {
  if (!result?.maturidade) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Resultado incompleto. Tente regenerar a estratégia.</p>
      </div>
    );
  }

  const maturityColor =
    result.maturidade.score <= 25 ? "text-destructive" :
    result.maturidade.score <= 50 ? "text-orange-500" :
    result.maturidade.score <= 75 ? "text-amber-500" : "text-green-500";

  const maturityBg =
    result.maturidade.score <= 25 ? "bg-destructive/10" :
    result.maturidade.score <= 50 ? "bg-orange-500/10" :
    result.maturidade.score <= 75 ? "bg-amber-500/10" : "bg-green-500/10";

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
              <p className={`text-3xl font-bold ${maturityColor}`}>{result.maturidade.score}%</p>
              <p className={`text-sm font-semibold ${maturityColor}`}>{result.maturidade.nivel}</p>
            </div>
            <p className="text-sm flex-1">{result.maturidade.descricao}</p>
          </div>
        </CardContent>
      </Card>

      {result.radar_data && (
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" /> Análise por Área
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={result.radar_data}>
                <PolarGrid />
                <PolarAngleAxis dataKey="eixo" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar name="Score" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

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
                      <div className="flex-1">
                        <span>{a.acao}</span>
                        <span className="text-xs text-muted-foreground ml-1">({a.responsavel})</span>
                      </div>
                      <Badge variant={a.prioridade === "alta" ? "destructive" : "secondary"} className="text-[10px] shrink-0">
                        {a.prioridade}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {result.entregas_recomendadas && (
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" /> Entregas Recomendadas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {result.entregas_recomendadas.map((e, i) => (
              <div key={i} className="border rounded-md p-3 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{e.servico}</p>
                  <p className="text-xs text-muted-foreground">{e.modulo} · {e.justificativa}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
