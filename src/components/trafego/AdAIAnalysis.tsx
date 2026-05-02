import { useState } from "react";
import { Sparkles, Loader2, TrendingUp, AlertTriangle, CheckCircle2, Lightbulb, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAnalyzeAds, AdAnalysis } from "@/hooks/useAdPlatforms";

export function AdAIAnalysis() {
  const analyzeMutation = useAnalyzeAds();
  const [analysis, setAnalysis] = useState<AdAnalysis | null>(null);

  const handleAnalyze = () => {
    analyzeMutation.mutate(30, {
      onSuccess: (data) => {
        setAnalysis(data.analysis);
      },
    });
  };

  if (!analysis) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-8 text-center space-y-4">
          <Sparkles className="w-10 h-10 text-primary mx-auto" />
          <div>
            <p className="text-sm font-semibold">Análise Inteligente de Campanhas</p>
            <p className="text-xs text-muted-foreground mt-1">
              A nossa IA analisa suas métricas e gera insights acionáveis para otimizar seus anúncios.
            </p>
          </div>
          <Button onClick={handleAnalyze} disabled={analyzeMutation.isPending} className="gap-2">
            {analyzeMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Analisar com a nossa IA
            <Badge variant="outline" className="text-[9px] ml-1">30 créditos</Badge>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" /> Análise IA
        </p>
        <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={handleAnalyze} disabled={analyzeMutation.isPending}>
          {analyzeMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          Reanalisar (30 créditos)
        </Button>
      </div>

      {/* Summary */}
      {analysis.resumo && (
        <Card>
          <CardContent className="py-4">
            <p className="text-xs leading-relaxed">{analysis.resumo}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* Strengths */}
        {analysis.pontos_fortes?.length > 0 && (
          <Card className="border-green-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-green-600">
                <CheckCircle2 className="w-4 h-4" /> Pontos Fortes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {analysis.pontos_fortes.map((p, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 shrink-0" />
                  <p className="text-xs">{p}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Weaknesses */}
        {analysis.pontos_fracos?.length > 0 && (
          <Card className="border-amber-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-amber-600">
                <AlertTriangle className="w-4 h-4" /> Pontos a Melhorar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {analysis.pontos_fracos.map((p, i) => (
                <div key={i} className="flex items-start gap-2">
                  <AlertTriangle className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-xs">{p}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recommendations */}
      {analysis.recomendacoes?.length > 0 && (
        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-primary" /> Recomendações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {analysis.recomendacoes.map((r, i) => (
              <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/10">
                <span className="text-[10px] font-bold text-primary shrink-0">{i + 1}.</span>
                <p className="text-xs">{r}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Featured campaigns */}
      {analysis.campanhas_destaque?.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="w-4 h-4" /> Campanhas em Destaque
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {analysis.campanhas_destaque.map((c, i) => (
              <div key={i} className="p-3 rounded-lg bg-muted/30 border">
                <p className="text-xs font-bold">{c.nome}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{c.motivo}</p>
                <Badge variant="outline" className="text-[9px] mt-1.5">{c.acao}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Projection */}
      {analysis.projecao && (
        <Card className="bg-muted/10">
          <CardContent className="py-4">
            <div className="flex items-start gap-2">
              <TrendingUp className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold">Projeção (próximos 30 dias)</p>
                <p className="text-xs text-muted-foreground mt-1">{analysis.projecao}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
