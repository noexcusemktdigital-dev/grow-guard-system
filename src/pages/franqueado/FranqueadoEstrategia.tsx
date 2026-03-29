// @ts-nocheck
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
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
  FolderOpen,
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
  AlertTriangle,
  Layers,
  Map,
  Calculator,
  Download,
  Upload,
  FileUp,
} from "lucide-react";
import { useState, useRef } from "react";
import { DiagnosticForm } from "./FranqueadoEstrategiaDiagnosticForm";
import { StrategyResultView } from "./FranqueadoEstrategiaResultViews";
import type { DiagSection } from "./FranqueadoEstrategiaData";
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
import { supabase } from "@/lib/supabase";

const diagnosticSections: DiagSection[] = [
  {
    title: "Informações do Negócio",
    subtitle: "Contexto geral",
    icon: <Package className="w-4 h-4 text-primary" />,
    fields: [
      { key: "nome_empresa", label: "Qual é o nome da empresa?", type: "text", placeholder: "Ex: Empresa XYZ" },
      { key: "segmento", label: "Qual é o segmento de atuação?", type: "text", placeholder: "Ex: Varejo, SaaS, Consultoria..." },
      { key: "tempo_mercado", label: "Há quanto tempo a empresa existe?", type: "text", placeholder: "Ex: 5 anos" },
      { key: "faturamento_atual", label: "Qual é o faturamento mensal médio atual? (R$)", type: "text", placeholder: "Ex: 80000" },
      { key: "ticket_medio", label: "Qual é o ticket médio? (R$)", type: "text", placeholder: "Ex: 2500" },
      { key: "clientes_ativos", label: "Quantos clientes ativos possui hoje?", type: "text", placeholder: "Ex: 40" },
    ],
  },
  {
    title: "Estrutura Comercial",
    subtitle: "Termômetro – Estrutura",
    icon: <Layers className="w-4 h-4 text-primary" />,
    fields: [
      { key: "processo_comercial", label: "Você possui um processo comercial definido?", type: "select", options: ["Não", "Parcial", "Sim"] },
      { key: "atendimento_leads", label: "Como os leads são atendidos hoje?", type: "select", options: ["WhatsApp manual", "CRM", "Planilha", "Equipe de vendas", "Outro"] },
      { key: "tamanho_time_comercial", label: "Quantas pessoas existem no time comercial hoje?", type: "text", placeholder: "Ex: 3" },
      { key: "script_atendimento", label: "Existe um script ou padrão de atendimento para vendas?", type: "select", options: ["Sim", "Não", "Parcial"] },
      { key: "funil_definido", label: "Existe um funil comercial definido?", type: "select", options: ["Sim", "Não", "Parcial"] },
      { key: "usa_crm", label: "Você possui CRM implementado?", type: "select", options: ["Sim", "Não"] },
      { key: "qual_crm", label: "Qual CRM utiliza?", type: "text", placeholder: "Ex: RD Station, Pipedrive...", conditionKey: "usa_crm", conditionValues: ["Sim"] },
      { key: "mede_conversao", label: "Hoje você mede taxa de conversão de vendas?", type: "select", options: ["Sim", "Não", "Parcialmente"] },
    ],
  },
  {
    title: "Geração de Demanda",
    subtitle: "Termômetro – Aquisição",
    icon: <TrendingUp className="w-4 h-4 text-primary" />,
    fields: [
      { key: "leads_mes", label: "Quantos leads sua empresa gera por mês hoje?", type: "text", placeholder: "Ex: 50" },
      { key: "custo_por_lead", label: "Você sabe qual é o custo médio por lead? (R$)", type: "text", placeholder: "Ex: 30 ou Não sei" },
      { key: "canal_mais_clientes", label: "Qual canal hoje gera mais clientes?", type: "text", placeholder: "Ex: Instagram, Indicação..." },
      { key: "investe_trafego_pago", label: "Você já investe em tráfego pago?", type: "select", options: ["Sim", "Não"] },
      { key: "plataformas_trafego", label: "Em quais plataformas?", type: "checkbox-group", options: ["Meta Ads", "Google Ads", "TikTok Ads", "Outros"], conditionKey: "investe_trafego_pago", conditionValues: ["Sim"] },
      { key: "maior_resultado_marketing", label: "Qual foi o maior resultado que já teve com marketing?", type: "textarea", placeholder: "Descreva o melhor resultado obtido..." },
      { key: "producao_conteudo", label: "Existe produção de conteúdo frequente?", type: "select", options: ["Sim", "Não", "Irregular"] },
      { key: "estrategia_posicionamento", label: "Existe estratégia de posicionamento da marca?", type: "select", options: ["Sim", "Não", "Parcial"] },
    ],
  },
  {
    title: "Problemas e Gargalos",
    subtitle: "SPIN – Problema",
    icon: <AlertTriangle className="w-4 h-4 text-primary" />,
    fields: [
      { key: "problema_geracao_clientes", label: "Qual é hoje o maior problema na geração de clientes?", type: "textarea", placeholder: "Descreva..." },
      { key: "problema_processo_vendas", label: "Qual é hoje o maior problema no processo de vendas?", type: "textarea", placeholder: "Descreva..." },
      { key: "perde_oportunidades", label: "Você sente que perde oportunidades de venda?", type: "select", options: ["Sim", "Não", "Talvez"] },
      { key: "motivo_perda_oportunidades", label: "Por que acredita que perde essas oportunidades?", type: "textarea", placeholder: "Descreva os motivos...", conditionKey: "perde_oportunidades", conditionValues: ["Sim", "Talvez"] },
      { key: "dificuldade_organizar_leads", label: "Existe dificuldade em organizar leads ou acompanhar negociações?", type: "select", options: ["Sim", "Não", "Parcialmente"] },
      { key: "marketing_gera_qualificados", label: "O marketing atual gera clientes qualificados?", type: "select", options: ["Sim", "Não", "Parcialmente"] },
      { key: "falta_previsibilidade", label: "Você sente falta de previsibilidade nas vendas?", type: "select", options: ["Sim", "Não"] },
    ],
  },
  {
    title: "Impacto dos Problemas",
    subtitle: "SPIN – Implicação",
    icon: <Target className="w-4 h-4 text-primary" />,
    fields: [
      { key: "impacto_se_continuar", label: "O que acontece com a empresa se o volume de vendas continuar como está hoje?", type: "textarea", placeholder: "Descreva o impacto..." },
      { key: "impacto_faturamento", label: "Qual impacto esses problemas geram no faturamento?", type: "textarea", placeholder: "Descreva..." },
      { key: "vendas_perdidas_mes", label: "Quantas vendas você acredita que perde por mês hoje?", type: "text", placeholder: "Ex: 5" },
      { key: "impacto_se_resolver", label: "Qual seria o impacto financeiro se esses problemas fossem resolvidos?", type: "textarea", placeholder: "Descreva..." },
      { key: "aguenta_dobrar_demanda", label: "Se o negócio dobrasse de demanda hoje, a empresa conseguiria atender?", type: "select", options: ["Sim, tranquilamente", "Sim, com dificuldade", "Não, precisaria estruturar", "Não, seria caótico"] },
    ],
  },
  {
    title: "Resultado Esperado",
    subtitle: "SPIN – Need Payoff",
    icon: <Sparkles className="w-4 h-4 text-primary" />,
    fields: [
      { key: "clientes_desejados_mes", label: "Quantos clientes novos por mês você gostaria de gerar?", type: "text", placeholder: "Ex: 30" },
      { key: "faturamento_ideal", label: "Qual faturamento mensal seria ideal para o seu negócio? (R$)", type: "text", placeholder: "Ex: 150000" },
      { key: "ticket_medio_futuro", label: "Qual ticket médio você gostaria de trabalhar no futuro? (R$)", type: "text", placeholder: "Ex: 3000" },
      { key: "cenario_ideal_12_meses", label: "Qual seria o cenário ideal para sua empresa nos próximos 12 meses?", type: "textarea", placeholder: "Descreva seu cenário ideal..." },
      { key: "o_que_precisa_mudar", label: "O que você acredita que precisa mudar para chegar nesse resultado?", type: "textarea", placeholder: "Descreva..." },
    ],
  },
  {
    title: "Termômetro de Maturidade",
    subtitle: "Autoavaliação (1 a 5)",
    icon: <BarChart3 className="w-4 h-4 text-primary" />,
    fields: [
      { key: "nota_marketing", label: "Estrutura de Marketing", type: "slider", min: 1, max: 5 },
      { key: "nota_comercial", label: "Estrutura Comercial", type: "slider", min: 1, max: 5 },
      { key: "nota_leads", label: "Organização de Leads", type: "slider", min: 1, max: 5 },
      { key: "nota_previsibilidade", label: "Previsibilidade de Vendas", type: "slider", min: 1, max: 5 },
      { key: "nota_marca", label: "Posicionamento de Marca", type: "slider", min: 1, max: 5 },
      { key: "nota_escala", label: "Escala de Aquisição de Clientes", type: "slider", min: 1, max: 5 },
    ],
  },
  {
    title: "Financeiro Estratégico",
    subtitle: "Dados para projeções",
    icon: <Calculator className="w-4 h-4 text-primary" />,
    fields: [
      { key: "margem_lucro", label: "Qual é sua margem média de lucro? (%)", type: "text", placeholder: "Ex: 30" },
      { key: "custo_maximo_cliente", label: "Qual custo máximo aceitável por cliente? (R$)", type: "text", placeholder: "Ex: 500" },
      { key: "ltv_medio", label: "Qual é o LTV médio de um cliente? (R$)", type: "text", placeholder: "Ex: 12000" },
    ],
  },
];

// ── Upload Briefing Component ───────────────────────────────────

function UploadBriefingForm({
  onExtracted,
}: {
  onExtracted: (answers: Record<string, any>) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExtract = async () => {
    let text = pastedText.trim();

    if (file && !text) {
      try {
        text = await file.text();
      } catch {
        toast.error("Não foi possível ler o arquivo. Tente colar o texto diretamente.");
        return;
      }
    }

    if (!text || text.length < 20) {
      toast.error("Texto muito curto. Cole ou envie um briefing mais completo.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("extract-strategy-answers", {
        body: { text },
      });

      if (error) throw new Error(error.message || "Erro ao processar briefing");
      if (data?.error) throw new Error(data.error);
      if (!data?.answers) throw new Error("Resposta inválida da IA");

      toast.success("Briefing processado! Revise as respostas extraídas.");
      onExtracted(data.answers);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e) || "Erro ao processar briefing");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <Upload className="w-4 h-4 text-primary" /> Upload de Briefing
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Envie um arquivo de texto ou cole o briefing abaixo. A nossa IA irá extrair as informações e preencher o formulário automaticamente.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-xs font-medium text-muted-foreground mb-1 block">Arquivo (.txt)</Label>
          <div
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setFile(f);
              }}
            />
            <FileUp className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            {file ? (
              <p className="text-sm font-medium text-primary">{file.name}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Clique para selecionar um arquivo .txt</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">ou cole o texto</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div>
          <Label className="text-xs font-medium text-muted-foreground mb-1 block">Texto do Briefing</Label>
          <Textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder="Cole aqui o texto completo do briefing com as informações do cliente..."
            rows={8}
          />
        </div>

        <Button onClick={handleExtract} disabled={loading || (!file && pastedText.trim().length < 20)} className="w-full">
          {loading ? <RefreshCw className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
          {loading ? "Processando briefing..." : "Extrair e Preencher Formulário"}
        </Button>
      </CardContent>
    </Card>
  );
}

// ── Nova Estratégia Tab ─────────────────────────────────────────

function NovaEstrategiaTab() {
  const [result, setResult] = useState<StrategyResult | null>(null);
  const [resultTitle, setResultTitle] = useState("");
  const [mode, setMode] = useState<"choose" | "manual" | "upload" | "review">("choose");
  const [uploadedAnswers, setUploadedAnswers] = useState<Record<string, any> | null>(null);
  const createStrategy = useCreateStrategy();

  const handleSubmit = async (answers: Record<string, any>, title: string) => {
    try {
      const s = await createStrategy.mutateAsync({ title, answers });
      setResult(s.result);
      setResultTitle(title);
      toast.success("Diagnóstico estratégico gerado com sucesso!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e) || "Erro ao gerar diagnóstico");
    }
  };

  if (result) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" onClick={() => { setResult(null); setMode("choose"); setUploadedAnswers(null); }}>
          <RefreshCw className="w-4 h-4 mr-1" /> Novo Diagnóstico
        </Button>
        <StrategyResultView result={result} title={resultTitle} />
      </div>
    );
  }

  if (mode === "choose") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          className="glass-card cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all group"
          onClick={() => setMode("manual")}
        >
          <CardContent className="p-6 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <ClipboardCheck className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-sm font-bold">Preenchimento Manual</h3>
            <p className="text-xs text-muted-foreground">
              Responda às 8 etapas do diagnóstico SPIN + NOEXCUSE passo a passo
            </p>
          </CardContent>
        </Card>

        <Card
          className="glass-card cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all group"
          onClick={() => setMode("upload")}
        >
          <CardContent className="p-6 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <FileUp className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-sm font-bold">Upload de Briefing</h3>
            <p className="text-xs text-muted-foreground">
              Envie um arquivo de texto ou cole o briefing e a IA extrai as respostas automaticamente
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (mode === "upload") {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" onClick={() => setMode("choose")}>
          <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
        </Button>
        <UploadBriefingForm
          onExtracted={(answers) => {
            setUploadedAnswers(answers);
            setMode("review");
          }}
        />
      </div>
    );
  }

  if (mode === "review" && uploadedAnswers) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setMode("upload")}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
          </Button>
          <Badge variant="outline" className="text-xs">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Respostas extraídas — revise e gere
          </Badge>
        </div>
        <DiagnosticForm
                diagnosticSections={diagnosticSections}
          onSubmit={handleSubmit}
          loading={createStrategy.isPending}
          initialAnswers={uploadedAnswers}
        />
      </div>
    );
  }

  // mode === "manual"
  return (
    <div className="space-y-4">
      <Button variant="outline" size="sm" onClick={() => setMode("choose")}>
        <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
      </Button>
      <DiagnosticForm diagnosticSections={diagnosticSections} onSubmit={handleSubmit} loading={createStrategy.isPending} />
    </div>
  );
}

// ── Meus Diagnósticos Tab ───────────────────────────────────────

function MeusDiagnosticosTab() {
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
    return ((leads ?? []) as { id: string; name?: string }[]).find((l) => l.id === leadId)?.name || null;
  };

  const getMaturityInfo = (s: Strategy) => {
    if (s.result?.diagnostico_negocio?.maturidade) {
      const m = s.result.diagnostico_negocio.maturidade;
      return { nivel: m.nivel, score: m.score };
    }
    if (s.result?.maturidade) {
      return { nivel: s.result.maturidade.nivel, score: s.result.maturidade.score };
    }
    return null;
  };

  return (
    <>
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar diagnósticos..." className="pl-9" aria-label="Buscar diagnósticos" />
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground text-sm">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">Nenhum diagnóstico encontrado</div>
        ) : (
          <div className="space-y-2">
            {filtered.map((s) => {
              const matInfo = getMaturityInfo(s);
              return (
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
                          {s.status === "completed" ? "Concluído" : s.status === "error" ? "Erro" : "Rascunho"}
                        </Badge>
                        {matInfo && (
                          <Badge variant="outline" className="text-[10px]">
                            {matInfo.nivel} ({matInfo.score}%)
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
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditTitle(s.title); setEditingId(s.id); }} aria-label="Editar">
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      {s.lead_id && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateMut.mutate({ id: s.id, lead_id: null })} aria-label="Desvincular">
                          <Unlink className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMut.mutate(s.id)} aria-label="Excluir">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Strategy Dialog */}
      {editingStrategy && (
        <Sheet open={!!editingStrategy} onOpenChange={() => setEditingStrategy(null)}>
          <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Editar e Regenerar Diagnóstico</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <DiagnosticForm
                diagnosticSections={diagnosticSections}
                onSubmit={async (answers, title) => {
                  try {
                    const updated = await regenerateMut.mutateAsync({ id: editingStrategy.id, title, answers });
                    setEditingStrategy(null);
                    if (updated.result) setSelected(updated);
                  } catch (e: unknown) {
                    toast.error(e instanceof Error ? e.message : String(e) || "Erro ao regenerar");
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
              <div className="flex items-center gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => { setSelected(null); setEditingStrategy(selected); }}>
                  <Pencil className="w-4 h-4 mr-1" /> Editar e Regenerar
                </Button>
              </div>
              {selected.result && <StrategyResultView result={selected.result} title={selected.title} />}
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
      <PageHeader title="Criador de Estratégia" subtitle="Diagnóstico SPIN Selling + Termômetro NOEXCUSE para estratégia comercial" />

      <Tabs defaultValue="nova">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="nova"><ClipboardCheck className="w-4 h-4 mr-1" /> Novo Diagnóstico</TabsTrigger>
          <TabsTrigger value="diagnosticos"><FolderOpen className="w-4 h-4 mr-1" /> Meus Diagnósticos</TabsTrigger>
        </TabsList>

        <TabsContent value="nova" className="space-y-6">
          <NovaEstrategiaTab />
        </TabsContent>

        <TabsContent value="diagnosticos" className="space-y-6">
          <MeusDiagnosticosTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
