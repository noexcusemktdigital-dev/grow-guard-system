// @ts-nocheck

import { lazy, Suspense, useMemo, useState } from "react";
import { Activity, ChevronRight, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Answers } from "./ClientePlanoVendasData";

// PERF-WARN-01: recharts deferred — evolution chart needs >= 2 history items,
// dialog charts only load on user interaction.
const EvolutionChart = lazy(() => import("./ClientePlanoVendasHistoricoEvolution"));
const HistoricoCharts = lazy(() => import("./ClientePlanoVendasHistoricoCharts"));
import { getNivel } from "./ClientePlanoVendasData";
import { computeScores, generateInsights, generateActionPlan } from "./ClientePlanoVendasScoring";

export interface ClientePlanoVendasHistoricoProps {
  planHistory: Record<string, unknown>[] | undefined;
  historyLoading: boolean;
}

export function ClientePlanoVendasHistorico({ planHistory, historyLoading }: ClientePlanoVendasHistoricoProps) {
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<Record<string, unknown> | null>(null);

  const selectedHistoryScores = useMemo(() => {
    if (!selectedHistoryItem) return null;
    return computeScores(selectedHistoryItem.answers as Answers);
  }, [selectedHistoryItem]);

  const selectedHistoryInsights = useMemo(() => {
    if (!selectedHistoryScores || !selectedHistoryItem) return [];
    return generateInsights(selectedHistoryItem.answers as Answers, selectedHistoryScores.scoreMap, selectedHistoryScores.maxMap);
  }, [selectedHistoryItem, selectedHistoryScores]);

  const selectedHistoryActionPlan = useMemo(() => {
    if (!selectedHistoryScores || !selectedHistoryItem) return [];
    return generateActionPlan(selectedHistoryScores.scoreMap, selectedHistoryScores.maxMap, selectedHistoryItem.answers as Answers);
  }, [selectedHistoryItem, selectedHistoryScores]);

  return (
    <>
      <div>
        <p className="text-sm font-semibold">Histórico de Diagnósticos</p>
        <p className="text-xs text-muted-foreground">Cada vez que você refaz o diagnóstico, o anterior é salvo aqui. Clique para ver o diagnóstico completo.</p>
      </div>

      {/* Evolution Chart */}
      {planHistory && planHistory.length >= 2 && (
        <Suspense fallback={<div className="h-52 animate-pulse bg-muted rounded-xl" />}>
          <EvolutionChart
            data={[...planHistory].reverse().map(h => ({
              data: new Date(h.created_at as string).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
              score: h.score as number,
            }))}
          />
        </Suspense>
      )}

      {historyLoading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <Card key={i}><CardContent className="h-16 animate-pulse bg-muted rounded" /></Card>)}
        </div>
      ) : !planHistory || planHistory.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="w-8 h-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm font-medium">Nenhum diagnóstico salvo no histórico</p>
            <p className="text-xs text-muted-foreground mt-1">Ao refazer o diagnóstico, o anterior será salvo automaticamente aqui.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {planHistory.map((h) => {
            const nv = getNivel(h.score as number);
            return (
              <Card key={h.id as React.Key} className="glass-card cursor-pointer hover:border-primary/40 transition-colors" onClick={() => { setSelectedHistoryItem(h); setHistoryDialogOpen(true); }}>
                <CardContent className="py-3 px-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground" style={{ backgroundColor: nv.cor }}>
                      {h.score as React.ReactNode}%
                    </div>
                    <div>
                      <p className="text-xs font-semibold">{nv.label}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(h.created_at as string).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[9px]" style={{ borderColor: nv.cor, color: nv.cor }}>
                      {nv.label}
                    </Badge>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* History Detail Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={(o) => { setHistoryDialogOpen(o); if (!o) setSelectedHistoryItem(null); }}>
        <DialogContent className="w-full max-w-[95vw] sm:max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Diagnóstico de {selectedHistoryItem && new Date(selectedHistoryItem.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
            </DialogTitle>
          </DialogHeader>
          {selectedHistoryScores && selectedHistoryItem && (() => {
            const hNivel = getNivel(selectedHistoryScores.percentage);
            return (
              <div className="space-y-6 mt-2">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-primary-foreground" style={{ backgroundColor: hNivel.cor }}>
                    {selectedHistoryScores.percentage}%
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: hNivel.cor }}>{hNivel.label}</p>
                    <p className="text-xs text-muted-foreground">{hNivel.desc}</p>
                  </div>
                </div>

                <Suspense fallback={<div className="space-y-4"><div className="h-56 animate-pulse bg-muted rounded" /><div className="h-48 animate-pulse bg-muted rounded" /></div>}>
                  <HistoricoCharts radarData={selectedHistoryScores.radarData} />
                </Suspense>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3">INSIGHTS</p>
                  <div className="grid grid-cols-1 gap-2">
                    {selectedHistoryInsights.map((ins, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm p-2 rounded-lg bg-muted/50">
                        <ins.icon className={`w-4 h-4 mt-0.5 shrink-0 ${ins.type === "success" ? "text-emerald-500" : ins.type === "warning" ? "text-destructive" : "text-primary"}`} />
                        <span>{ins.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3">PLANO DE AÇÃO</p>
                  <div className="space-y-3">
                    {selectedHistoryActionPlan.map(fase => (
                      <div key={fase.fase} className="p-3 rounded-lg border" style={{ borderColor: fase.cor + "40" }}>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-bold">{fase.fase}</p>
                          <Badge variant="outline" className="text-[9px]">{fase.periodo}</Badge>
                        </div>
                        <ul className="space-y-1">
                          {fase.items.map((item, i) => (
                            <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                              <ChevronRight className="w-3 h-3 mt-0.5 shrink-0 text-primary" /> {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </>
  );
}
