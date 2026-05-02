// @ts-nocheck
import { useState, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck, Save, Sparkles, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCrmLeads } from "@/hooks/useCrmLeads";
import { toast } from "sonner";
import { reportError } from "@/lib/error-toast";
import { lazy, Suspense } from "react";

// PERF-WARN-02: recharts deferred — chart only renders when user has answered questions.
const DiagnosticoChart = lazy(() => import("./FranqueadoDiagnosticoChart"));

const CATEGORIES = [
  {
    key: "comercial",
    label: "Comercial",
    questions: [
      { id: "c1", text: "Como está a taxa de conversão de leads em clientes?" },
      { id: "c2", text: "Existe um processo de vendas estruturado?" },
      { id: "c3", text: "O time comercial tem metas claras e mensuráveis?" },
      { id: "c4", text: "Há acompanhamento de pipeline e forecast?" },
      { id: "c5", text: "O pós-venda é ativo e gera recompra/indicação?" },
    ],
  },
  {
    key: "marketing",
    label: "Marketing",
    questions: [
      { id: "m1", text: "A marca tem posicionamento claro no mercado?" },
      { id: "m2", text: "Existe presença digital ativa (redes, site, Google)?" },
      { id: "m3", text: "Há investimento recorrente em tráfego pago?" },
      { id: "m4", text: "A empresa produz conteúdo educativo/informativo?" },
      { id: "m5", text: "Há mensuração de ROI das ações de marketing?" },
    ],
  },
  {
    key: "operacional",
    label: "Operacional",
    questions: [
      { id: "o1", text: "Os processos internos são documentados?" },
      { id: "o2", text: "Há ferramentas de gestão (CRM, ERP, etc.)?" },
      { id: "o3", text: "O atendimento ao cliente é padronizado?" },
      { id: "o4", text: "Existe gestão de qualidade ou indicadores?" },
      { id: "o5", text: "A equipe é treinada periodicamente?" },
    ],
  },
  {
    key: "financeiro",
    label: "Financeiro",
    questions: [
      { id: "f1", text: "Há controle de fluxo de caixa estruturado?" },
      { id: "f2", text: "O pricing é baseado em dados e margem?" },
      { id: "f3", text: "Existe planejamento orçamentário anual?" },
      { id: "f4", text: "Há separação clara entre PF e PJ?" },
      { id: "f5", text: "Os custos fixos e variáveis são monitorados?" },
    ],
  },
  {
    key: "digital",
    label: "Digital",
    questions: [
      { id: "d1", text: "A empresa utiliza automação de processos?" },
      { id: "d2", text: "Há integração entre ferramentas (CRM, WhatsApp, etc.)?" },
      { id: "d3", text: "Os dados de clientes são centralizados?" },
      { id: "d4", text: "Existe análise de dados para tomada de decisão?" },
      { id: "d5", text: "A empresa está preparada para escalar digitalmente?" },
    ],
  },
];

const SCORE_OPTIONS = [
  { value: "1", label: "1 — Crítico" },
  { value: "2", label: "2 — Fraco" },
  { value: "3", label: "3 — Regular" },
  { value: "4", label: "4 — Bom" },
  { value: "5", label: "5 — Excelente" },
];

export default function FranqueadoDiagnostico() {
  const navigate = useNavigate();
  const { data: orgId } = useUserOrgId();
  const queryClient = useQueryClient();
  const { data: leads } = useCrmLeads();
  const [selectedLeadId, setSelectedLeadId] = useState<string>("");
  const [scores, setScores] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");

  // Load existing diagnostics
  const { data: diagnostics } = useQuery({
    queryKey: ["client-diagnostics", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_diagnostics" as unknown as "client_diagnostics")
        .select("*")
        .eq("organization_id", orgId!)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as Record<string, unknown>[];
    },
    enabled: !!orgId,
  });

  const setScore = (questionId: string, value: number) => {
    setScores(prev => ({ ...prev, [questionId]: value }));
  };

  const categoryAverages = useMemo(() => {
    return CATEGORIES.map(cat => {
      const catScores = cat.questions.map(q => scores[q.id]).filter(Boolean);
      const avg = catScores.length > 0 ? catScores.reduce((s, v) => s + v, 0) / catScores.length : 0;
      return { category: cat.label, value: Math.round(avg * 10) / 10, fullMark: 5 };
    });
  }, [scores]);

  const totalScore = useMemo(() => {
    const all = Object.values(scores);
    if (all.length === 0) return 0;
    return Math.round((all.reduce((s, v) => s + v, 0) / all.length) * 10) / 10;
  }, [scores]);

  const totalQuestions = CATEGORIES.reduce((s, c) => s + c.questions.length, 0);
  const answeredQuestions = Object.keys(scores).length;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("client_diagnostics" as unknown as "client_diagnostics").insert({
        organization_id: orgId,
        lead_id: selectedLeadId || null,
        created_by: (await supabase.auth.getUser()).data.user?.id,
        scores,
        total_score: totalScore,
        notes: notes || null,
      } as Record<string, unknown>);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Diagnóstico salvo com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["client-diagnostics"] });
      setScores({});
      setNotes("");
      setSelectedLeadId("");
    },
    onError: (e) => reportError(e, { title: "Erro ao salvar diagnóstico", category: "diagnostico.save" }),
  });

  const getScoreColor = (score: number) => {
    if (score >= 4) return "text-emerald-600";
    if (score >= 3) return "text-amber-600";
    return "text-destructive";
  };

  return (
    <div className="w-full space-y-6">
      <PageHeader title="Diagnóstico NOE" subtitle="Avaliação estruturada do cliente para gerar estratégias personalizadas" />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 space-y-4">
          {/* Lead selector */}
          <Card className="glass-card">
            <CardContent className="pt-4">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium whitespace-nowrap">Vincular a lead:</label>
                <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecione um lead (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {(leads ?? []).map((l) => (
                      <SelectItem key={l.id} value={l.id}>{l.name} {l.company ? `— ${l.company}` : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Questions by category */}
          <Accordion type="multiple" defaultValue={CATEGORIES.map(c => c.key)} className="space-y-2">
            {CATEGORIES.map(cat => {
              const catScores = cat.questions.map(q => scores[q.id]).filter(Boolean);
              const catAvg = catScores.length > 0 ? (catScores.reduce((s, v) => s + v, 0) / catScores.length) : 0;

              return (
                <AccordionItem key={cat.key} value={cat.key} className="border rounded-lg px-1">
                  <AccordionTrigger className="hover:no-underline px-3">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-sm">{cat.label}</span>
                      <Badge variant="outline" className="text-xs">
                        {catScores.length}/{cat.questions.length}
                      </Badge>
                      {catAvg > 0 && (
                        <span className={`text-xs font-bold ${getScoreColor(catAvg)}`}>
                          Média: {catAvg.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-3 space-y-3">
                    {cat.questions.map(q => (
                      <div key={q.id} className="flex items-center justify-between gap-4 py-2 border-b border-border/50 last:border-0">
                        <span className="text-sm flex-1">{q.text}</span>
                        <Select
                          value={scores[q.id]?.toString() || ""}
                          onValueChange={v => setScore(q.id, parseInt(v))}
                        >
                          <SelectTrigger className="w-44">
                            <SelectValue placeholder="Nota" />
                          </SelectTrigger>
                          <SelectContent>
                            {SCORE_OPTIONS.map(o => (
                              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>

          {/* Notes */}
          <Card className="glass-card">
            <CardContent className="pt-4 space-y-2">
              <label className="text-sm font-medium">Observações gerais</label>
              <Textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Anotações adicionais sobre o diagnóstico..."
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={answeredQuestions === 0 || saveMutation.isPending}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              Salvar Diagnóstico
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/franqueado/estrategia", { state: { fromDiagnostico: true, scores, leadId: selectedLeadId } })}
              disabled={answeredQuestions < 5}
              className="gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Gerar Estratégia
            </Button>
          </div>
        </div>

        {/* Sidebar: Score + Chart */}
        <div className="space-y-4">
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Score Geral
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-2">
              <div className={`text-5xl font-bold ${getScoreColor(totalScore)}`}>
                {totalScore > 0 ? totalScore.toFixed(1) : "—"}
              </div>
              <p className="text-xs text-muted-foreground">{answeredQuestions}/{totalQuestions} perguntas respondidas</p>
            </CardContent>
          </Card>

          {answeredQuestions > 0 && (
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Radar por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<div className="h-64 flex items-center justify-center"><span className="text-xs text-muted-foreground">Carregando gráfico...</span></div>}>
                  <DiagnosticoChart data={categoryAverages} />
                </Suspense>
              </CardContent>
            </Card>
          )}

          {/* Recent diagnostics */}
          {(diagnostics?.length ?? 0) > 0 && (
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Últimos Diagnósticos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {diagnostics?.slice(0, 5).map((d: Record<string, unknown>) => (
                  <div key={d.id} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                    <span className="text-xs text-muted-foreground">
                      {new Date(d.created_at).toLocaleDateString("pt-BR")}
                    </span>
                    <Badge variant="outline" className={`text-xs ${getScoreColor(d.total_score || 0)}`}>
                      {(d.total_score || 0).toFixed(1)}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
