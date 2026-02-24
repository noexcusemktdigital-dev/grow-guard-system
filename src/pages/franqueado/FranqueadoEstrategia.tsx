import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Sparkles,
  RefreshCw,
  ClipboardCheck,
  History,
  Search,
  Trash2,
  Pencil,
  CheckCircle2,
  Link2,
  Unlink,
  ChevronRight,
  ChevronLeft,
  Target,
  TrendingUp,
  BarChart3,
  FileText,
  Package,
  ArrowRight,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useStrategies,
  useCreateStrategy,
  useUpdateStrategy,
  useDeleteStrategy,
  useRegenerateStrategy,
  type StrategyResult,
  type Strategy,
} from "@/hooks/useFranqueadoStrategies";
import { useCrmLeads } from "@/hooks/useCrmLeads";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Progress } from "@/components/ui/progress";

// ── Diagnostic Questions ────────────────────────────────────────

const diagnosticSections = [
  {
    title: "Sobre o Negócio",
    fields: [
      { key: "segmento", label: "Segmento de atuação", type: "text", placeholder: "Ex: Odontologia, Estética, Gastronomia" },
      { key: "tempo_mercado", label: "Tempo de mercado", type: "select", options: ["Menos de 1 ano", "1-3 anos", "3-5 anos", "5-10 anos", "Mais de 10 anos"] },
      { key: "faturamento_mensal", label: "Faturamento mensal (R$)", type: "text", placeholder: "Ex: 50000" },
      { key: "equipe", label: "Tamanho da equipe", type: "select", options: ["1-5", "6-15", "16-30", "31-50", "50+"] },
    ],
  },
  {
    title: "Marketing Atual",
    fields: [
      { key: "presenca_digital", label: "Tem presença digital?", type: "select", options: ["Nenhuma", "Apenas redes sociais", "Site + redes sociais", "Site + redes + Google Meu Negócio", "Presença completa e ativa"] },
      { key: "investimento_marketing", label: "Investimento mensal em marketing (R$)", type: "text", placeholder: "Ex: 2000" },
      { key: "canais_atuais", label: "Canais de marketing que utiliza", type: "text", placeholder: "Ex: Instagram, Google Ads, Indicação" },
      { key: "frequencia_postagens", label: "Frequência de postagens", type: "select", options: ["Não posta", "Esporádico (sem planejamento)", "1-3x por semana", "Diário", "Múltiplas vezes ao dia"] },
    ],
  },
  {
    title: "Comercial",
    fields: [
      { key: "processo_vendas", label: "Tem processo de vendas definido?", type: "select", options: ["Não tem processo", "Processo informal", "Processo documentado mas não seguido", "Processo estruturado e seguido", "Processo otimizado com métricas"] },
      { key: "ticket_medio", label: "Ticket médio (R$)", type: "text", placeholder: "Ex: 800" },
      { key: "ciclo_venda", label: "Ciclo médio de venda", type: "select", options: ["Mesmo dia", "1-3 dias", "1-2 semanas", "2-4 semanas", "Mais de 1 mês"] },
      { key: "taxa_conversao", label: "Taxa de conversão estimada (%)", type: "text", placeholder: "Ex: 20" },
    ],
  },
  {
    title: "Receita e Objetivos",
    fields: [
      { key: "meta_faturamento", label: "Meta de faturamento mensal (R$)", type: "text", placeholder: "Ex: 100000" },
      { key: "crescimento_desejado", label: "Crescimento desejado (%)", type: "text", placeholder: "Ex: 30" },
      { key: "prazo_meta", label: "Prazo para atingir a meta", type: "select", options: ["3 meses", "6 meses", "12 meses", "18 meses"] },
    ],
  },
  {
    title: "Concorrência",
    fields: [
      { key: "principais_concorrentes", label: "Principais concorrentes", type: "text", placeholder: "Ex: Empresa A, Empresa B" },
      { key: "diferenciais", label: "Diferenciais competitivos", type: "textarea", placeholder: "O que diferencia seu negócio dos concorrentes?" },
    ],
  },
  {
    title: "Dores e Desafios",
    fields: [
      { key: "principal_dor", label: "Principal dor/desafio do negócio", type: "textarea", placeholder: "Qual o maior problema que enfrenta hoje?" },
      { key: "tentativas_anteriores", label: "Já tentou resolver? Como?", type: "textarea", placeholder: "O que já fez para tentar resolver?" },
    ],
  },
  {
    title: "Objetivos do Projeto",
    fields: [
      { key: "expectativa_projeto", label: "O que espera alcançar com o projeto?", type: "textarea", placeholder: "Descreva suas expectativas e resultados desejados" },
      { key: "urgencia", label: "Nível de urgência", type: "select", options: ["Baixa - estou pesquisando", "Média - quero começar em breve", "Alta - preciso resolver agora", "Crítica - está afetando o negócio"] },
    ],
  },
];

// ── Diagnostic Form ─────────────────────────────────────────────

function DiagnosticForm({ onSubmit, loading, initialAnswers, initialTitle }: { onSubmit: (answers: Record<string, string>, title: string) => void; loading: boolean; initialAnswers?: Record<string, string>; initialTitle?: string }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers || {});
  const [title, setTitle] = useState(initialTitle || "");

  const section = diagnosticSections[step];
  const totalSteps = diagnosticSections.length;
  const progress = ((step + 1) / totalSteps) * 100;

  const canAdvance = section.fields.every((f) => {
    const val = answers[f.key];
    return val && val.trim() !== "";
  });

  const handleSubmit = () => {
    const finalTitle = title.trim() || `Estratégia - ${answers.segmento || "Diagnóstico"}`;
    onSubmit(answers, finalTitle);
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-primary" />
            {section.title}
          </CardTitle>
          <span className="text-xs text-muted-foreground">{step + 1} de {totalSteps}</span>
        </div>
        <Progress value={progress} className="h-1.5 mt-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        {step === 0 && (
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Título da Estratégia (opcional)</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Estratégia Clínica Dr. Silva" />
          </div>
        )}

        {section.fields.map((field) => (
          <div key={field.key}>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">{field.label}</label>
            {field.type === "select" ? (
              <Select value={answers[field.key] || ""} onValueChange={(v) => setAnswers((p) => ({ ...p, [field.key]: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {field.options!.map((o) => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : field.type === "textarea" ? (
              <Textarea value={answers[field.key] || ""} onChange={(e) => setAnswers((p) => ({ ...p, [field.key]: e.target.value }))} placeholder={field.placeholder} rows={3} />
            ) : (
              <Input value={answers[field.key] || ""} onChange={(e) => setAnswers((p) => ({ ...p, [field.key]: e.target.value }))} placeholder={field.placeholder} />
            )}
          </div>
        ))}

        <div className="flex justify-between pt-2">
          <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={step === 0}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
          </Button>
          {step < totalSteps - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canAdvance}>
              Próximo <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading || !canAdvance}>
              {loading ? <RefreshCw className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
              {loading ? "Gerando estratégia..." : "Gerar Estratégia com IA"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Strategy Result ─────────────────────────────────────────────

function StrategyResultView({ result }: { result: StrategyResult }) {
  const maturityColor =
    result.maturidade.score <= 25 ? "text-destructive" :
    result.maturidade.score <= 50 ? "text-orange-500" :
    result.maturidade.score <= 75 ? "text-amber-500" : "text-green-500";

  const maturityBg =
    result.maturidade.score <= 25 ? "bg-destructive/10" :
    result.maturidade.score <= 50 ? "bg-orange-500/10" :
    result.maturidade.score <= 75 ? "bg-amber-500/10" : "bg-green-500/10";

  const prioridadeColor: Record<string, string> = {
    essencial: "bg-destructive/10 text-destructive",
    recomendado: "bg-primary/10 text-primary",
    opcional: "bg-muted text-muted-foreground",
  };

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

      {/* Termômetro de Maturidade */}
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
          <div className="mt-3">
            <Progress value={result.maturidade.score} className="h-2" />
            <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
              <span>Caótico</span><span>Reativo</span><span>Estruturado</span><span>Analítico</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Radar Chart */}
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

      {/* Plano de Ação */}
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

      {/* Projeções */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold">Projeção de Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={result.projecoes.leads}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="sem_estrategia" name="Sem Estratégia" stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" />
                <Line type="monotone" dataKey="com_estrategia" name="Com Estratégia" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold">Projeção de Receita</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={result.projecoes.receita}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="sem_estrategia" name="Sem Estratégia" stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" />
                <Line type="monotone" dataKey="com_estrategia" name="Com Estratégia" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Entregas Recomendadas */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" /> Entregas Recomendadas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {result.entregas_recomendadas.map((e, i) => (
            <div key={i} className="border rounded-md p-3 flex items-start gap-3">
              <div className={`px-2 py-0.5 rounded text-[10px] font-semibold shrink-0 ${prioridadeColor[e.prioridade] || "bg-muted text-muted-foreground"}`}>
                {e.prioridade}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{e.servico}</p>
                <p className="text-xs text-muted-foreground">{e.modulo} · {e.justificativa}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Nova Estratégia Tab ─────────────────────────────────────────

function NovaEstrategiaTab() {
  const [result, setResult] = useState<StrategyResult | null>(null);
  const createStrategy = useCreateStrategy();

  const handleSubmit = async (answers: Record<string, string>, title: string) => {
    try {
      const s = await createStrategy.mutateAsync({ title, answers });
      setResult(s.result);
      toast.success("Estratégia gerada com sucesso!");
    } catch (e: any) {
      toast.error(e.message || "Erro ao gerar estratégia");
    }
  };

  if (result) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" onClick={() => setResult(null)}>
          <RefreshCw className="w-4 h-4 mr-1" /> Novo Diagnóstico
        </Button>
        <StrategyResultView result={result} />
      </div>
    );
  }

  return <DiagnosticForm onSubmit={handleSubmit} loading={createStrategy.isPending} />;
}

// ── Histórico Tab ───────────────────────────────────────────────

function HistoricoTab() {
  const { data: strategies, isLoading } = useStrategies();
  const deleteMut = useDeleteStrategy();
  const updateMut = useUpdateStrategy();
  const regenerateMut = useRegenerateStrategy();
  const { data: leads } = useCrmLeads();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Strategy | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null);

  const filtered = (strategies ?? []).filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase())
  );

  const getLeadName = (leadId: string | null) => {
    if (!leadId) return null;
    return ((leads ?? []) as any[]).find((l) => l.id === leadId)?.name || null;
  };

  return (
    <>
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar estratégias..." className="pl-9" />
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground text-sm">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">Nenhuma estratégia encontrada</div>
        ) : (
          <div className="space-y-2">
            {filtered.map((s) => (
              <Card key={s.id} className="glass-card cursor-pointer hover:ring-1 hover:ring-primary/30 transition-all" onClick={() => setSelected(s)}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="space-y-1 flex-1 min-w-0">
                    {editingId === s.id ? (
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="h-7 text-sm" />
                        <Button size="sm" variant="ghost" className="h-7" onClick={() => { updateMut.mutate({ id: s.id, title: editTitle }); setEditingId(null); }}>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm font-medium truncate">{s.title}</p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(s.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </span>
                      <Badge variant={s.status === "completed" ? "default" : "secondary"} className="text-[10px]">
                        {s.status === "completed" ? "Concluída" : s.status === "error" ? "Erro" : "Rascunho"}
                      </Badge>
                      {s.result?.maturidade && (
                        <Badge variant="outline" className="text-[10px]">
                          {s.result.maturidade.nivel} ({s.result.maturidade.score}%)
                        </Badge>
                      )}
                      {getLeadName(s.lead_id) && (
                        <Badge variant="outline" className="text-[10px]">
                          <Link2 className="w-3 h-3 mr-1" />{getLeadName(s.lead_id)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditTitle(s.title); setEditingId(s.id); }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    {s.lead_id && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateMut.mutate({ id: s.id, lead_id: null })}>
                        <Unlink className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMut.mutate(s.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit Strategy Dialog */}
      {editingStrategy && (
        <Sheet open={!!editingStrategy} onOpenChange={() => setEditingStrategy(null)}>
          <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Editar e Regenerar Estratégia</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <DiagnosticForm
                onSubmit={async (answers, title) => {
                  try {
                    const updated = await regenerateMut.mutateAsync({ id: editingStrategy.id, title, answers });
                    setEditingStrategy(null);
                    if (updated.result) setSelected(updated);
                  } catch (e: any) {
                    toast.error(e.message || "Erro ao regenerar");
                  }
                }}
                loading={regenerateMut.isPending}
                initialAnswers={editingStrategy.diagnostic_answers}
                initialTitle={editingStrategy.title}
              />
            </div>
          </SheetContent>
        </Sheet>
      )}

      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{selected?.title}</SheetTitle>
          </SheetHeader>
          {selected && (
            <div className="mt-4 space-y-4">
              <Button variant="outline" size="sm" onClick={() => { setSelected(null); setEditingStrategy(selected); }}>
                <Pencil className="w-4 h-4 mr-1" /> Editar e Regenerar
              </Button>
              {selected.result && <StrategyResultView result={selected.result} />}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

// ── Page ─────────────────────────────────────────────────────────

export default function FranqueadoEstrategia() {
  return (
    <div className="w-full space-y-6">
      <PageHeader title="Criador de Estratégia" subtitle="Diagnóstico profundo e criação de estratégia comercial com IA" />

      <Tabs defaultValue="nova">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="nova"><ClipboardCheck className="w-4 h-4 mr-1" /> Novo Diagnóstico</TabsTrigger>
          <TabsTrigger value="historico"><History className="w-4 h-4 mr-1" /> Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="nova" className="space-y-6">
          <NovaEstrategiaTab />
        </TabsContent>

        <TabsContent value="historico" className="space-y-6">
          <HistoricoTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
