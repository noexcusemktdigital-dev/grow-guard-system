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
  AlertTriangle,
  Layers,
  Calculator,
  Download,
  Upload,
  FileUp,
  Globe,
  ShoppingCart,
  LineChart,
} from "lucide-react";
import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
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
import { useNavigate } from "react-router-dom";

// ── Diagnostic Sections (5 Etapas + Contexto + Maturidade + Financeiro) ──

const diagnosticSections: DiagSection[] = [
  {
    title: "Contexto do Negócio",
    subtitle: "Informações gerais da empresa",
    icon: <FileText className="w-4 h-4 text-primary" />,
    fields: [
      { key: "nome_empresa", label: "Nome da empresa", type: "text", placeholder: "Ex: Empresa Exemplo LTDA" },
      { key: "segmento", label: "Qual é o segmento/nicho de mercado?", type: "text", placeholder: "Ex: Marketing digital, Saúde, Educação..." },
      { key: "tempo_mercado", label: "Há quanto tempo está no mercado?", type: "select", options: ["Menos de 1 ano", "1 a 2 anos", "2 a 5 anos", "Mais de 5 anos"] },
      { key: "faturamento_atual", label: "Faturamento mensal atual (R$)", type: "text", placeholder: "Ex: 50000" },
      { key: "ticket_medio_atual", label: "Ticket médio atual (R$)", type: "text", placeholder: "Ex: 2000" },
      { key: "clientes_ativos", label: "Quantos clientes ativos possui?", type: "text", placeholder: "Ex: 20" },
      { key: "modelo_negocio", label: "Modelo de negócio principal", type: "select", options: ["Prestação de serviços", "Produto físico", "SaaS/Digital", "Recorrência/Assinatura", "Consultoria", "Outro"] },
      { key: "meta_faturamento", label: "Meta de faturamento mensal (R$)", type: "text", placeholder: "Ex: 150000" },
      { key: "meta_clientes_mes", label: "Meta de novos clientes por mês", type: "text", placeholder: "Ex: 10" },
    ],
  },
  {
    title: "01 — Conteúdo e Linha Editorial",
    subtitle: "Como está a produção de conteúdo hoje",
    icon: <FileText className="w-4 h-4 text-primary" />,
    fields: [
      { key: "produz_conteudo", label: "A empresa produz conteúdo para redes sociais?", type: "select", options: ["Sim, com frequência", "Sim, mas irregular", "Não"] },
      { key: "frequencia_conteudo", label: "Qual a frequência de publicações?", type: "select", options: ["Diária", "3-5x por semana", "1-2x por semana", "Quinzenal ou menos", "Não publica"], conditionKey: "produz_conteudo", conditionValues: ["Sim, com frequência", "Sim, mas irregular"] },
      { key: "canais_conteudo", label: "Em quais canais publica?", type: "checkbox-group", options: ["Instagram", "Facebook", "LinkedIn", "TikTok", "YouTube", "Blog", "Newsletter", "Outros"] },
      { key: "linha_editorial", label: "Existe uma linha editorial definida?", type: "select", options: ["Sim, estruturada", "Parcial", "Não"] },
      { key: "funil_conteudo", label: "O conteúdo segue um funil (topo/meio/fundo)?", type: "select", options: ["Sim", "Parcialmente", "Não", "Não sei o que é"] },
      { key: "formatos_usados", label: "Quais formatos de conteúdo utiliza?", type: "checkbox-group", options: ["Carrossel", "Reels/Vídeos curtos", "Stories", "Lives", "Blog/Artigos", "E-books", "Podcast", "YouTube longo"] },
    ],
  },
  {
    title: "02 — Tráfego e Distribuição",
    subtitle: "Como os leads chegam até a empresa",
    icon: <TrendingUp className="w-4 h-4 text-primary" />,
    fields: [
      { key: "investe_trafego_pago", label: "Investe em tráfego pago?", type: "select", options: ["Sim", "Não", "Já investiu mas parou"] },
      { key: "investimento_mensal_trafego", label: "Quanto investe por mês em tráfego? (R$)", type: "text", placeholder: "Ex: 5000", conditionKey: "investe_trafego_pago", conditionValues: ["Sim"] },
      { key: "plataformas_trafego", label: "Quais plataformas de tráfego usa?", type: "checkbox-group", options: ["Meta Ads", "Google Ads", "TikTok Ads", "LinkedIn Ads", "YouTube Ads", "Outros"], conditionKey: "investe_trafego_pago", conditionValues: ["Sim"] },
      { key: "cpl_atual", label: "Qual o CPL (custo por lead) atual? (R$)", type: "text", placeholder: "Ex: 30 ou Não sei" },
      { key: "leads_mes", label: "Quantos leads gera por mês?", type: "text", placeholder: "Ex: 50" },
      { key: "canal_mais_converte", label: "Qual canal gera mais clientes hoje?", type: "text", placeholder: "Ex: Instagram, Google, Indicação..." },
    ],
  },
  {
    title: "03 — Web e Conversão",
    subtitle: "Presença web e conversão de visitantes",
    icon: <Globe className="w-4 h-4 text-primary" />,
    fields: [
      { key: "tem_site", label: "A empresa possui site/landing page?", type: "select", options: ["Sim, site completo", "Sim, apenas LPs", "Não"] },
      { key: "quantidade_lps", label: "Quantas landing pages ativas possui?", type: "text", placeholder: "Ex: 3", conditionKey: "tem_site", conditionValues: ["Sim, site completo", "Sim, apenas LPs"] },
      { key: "taxa_conversao_site", label: "Qual a taxa de conversão do site/LP?", type: "select", options: ["Acima de 5%", "Entre 2% e 5%", "Abaixo de 2%", "Não mede", "Não sei"] },
      { key: "faz_teste_ab", label: "Realiza testes A/B?", type: "select", options: ["Sim, regularmente", "Às vezes", "Não"] },
      { key: "elementos_prova", label: "Possui elementos de prova social no site?", type: "select", options: ["Sim (depoimentos, cases)", "Parcial", "Não"] },
      { key: "cta_principal", label: "Qual o CTA principal do site?", type: "text", placeholder: "Ex: Agendar reunião, Solicitar orçamento..." },
    ],
  },
  {
    title: "04 — Sales e Fechamento",
    subtitle: "Processo comercial e vendas",
    icon: <ShoppingCart className="w-4 h-4 text-primary" />,
    fields: [
      { key: "processo_comercial", label: "Possui um processo comercial definido?", type: "select", options: ["Sim, documentado", "Parcial", "Não"] },
      { key: "tamanho_time_comercial", label: "Quantas pessoas no time comercial?", type: "text", placeholder: "Ex: 3" },
      { key: "usa_crm", label: "Utiliza CRM?", type: "select", options: ["Sim", "Não", "Planilha/Manual"] },
      { key: "script_atendimento", label: "Possui script ou padrão de atendimento?", type: "select", options: ["Sim", "Não", "Parcial"] },
      { key: "funil_definido", label: "Possui funil comercial definido com etapas?", type: "select", options: ["Sim", "Não", "Parcial"] },
      { key: "taxa_conversao_comercial", label: "Qual a taxa de conversão de lead para cliente?", type: "select", options: ["Acima de 20%", "Entre 10% e 20%", "Abaixo de 10%", "Não mede"] },
      { key: "followup", label: "Realiza follow-up estruturado?", type: "select", options: ["Sim, com cadência", "Às vezes", "Não"] },
    ],
  },
  {
    title: "05 — Validação e Escala",
    subtitle: "Métricas, validação e capacidade de escala",
    icon: <LineChart className="w-4 h-4 text-primary" />,
    fields: [
      { key: "mede_metricas", label: "Acompanha métricas de marketing e vendas?", type: "select", options: ["Sim, com dashboards", "Sim, manualmente", "Parcialmente", "Não"] },
      { key: "kpis_acompanha", label: "Quais KPIs acompanha?", type: "checkbox-group", options: ["Leads/mês", "CPL", "Taxa de conversão", "CAC", "LTV", "ROI", "Faturamento", "Nenhum"] },
      { key: "ja_escalou", label: "Já escalou algum canal de aquisição?", type: "select", options: ["Sim, com sucesso", "Sim, mas sem resultado", "Não"] },
      { key: "capacidade_atendimento", label: "Se dobrar a demanda hoje, consegue atender?", type: "select", options: ["Sim, tranquilamente", "Sim, com dificuldade", "Não, precisaria estruturar", "Não, seria caótico"] },
      { key: "maior_resultado", label: "Qual foi o maior resultado que já obteve com marketing?", type: "textarea", placeholder: "Descreva brevemente..." },
    ],
  },
  {
    title: "Termômetro de Maturidade",
    subtitle: "Autoavaliação (1 a 5) para cada etapa",
    icon: <BarChart3 className="w-4 h-4 text-primary" />,
    fields: [
      { key: "nota_conteudo", label: "Conteúdo e Linha Editorial", type: "slider", min: 1, max: 5 },
      { key: "nota_trafego", label: "Tráfego e Distribuição", type: "slider", min: 1, max: 5 },
      { key: "nota_web", label: "Web e Conversão", type: "slider", min: 1, max: 5 },
      { key: "nota_sales", label: "Sales e Fechamento", type: "slider", min: 1, max: 5 },
      { key: "nota_escala", label: "Validação e Escala", type: "slider", min: 1, max: 5 },
      { key: "nota_marketing_geral", label: "Marketing Geral", type: "slider", min: 1, max: 5 },
      { key: "nota_posicionamento", label: "Posicionamento de Marca", type: "slider", min: 1, max: 5 },
    ],
  },
  {
    title: "Financeiro e Projeções",
    subtitle: "Dados para cálculos e projeções",
    icon: <Calculator className="w-4 h-4 text-primary" />,
    fields: [
      { key: "margem_lucro", label: "Margem média de lucro (%)", type: "text", placeholder: "Ex: 30" },
      { key: "ltv_medio", label: "LTV médio de um cliente (R$)", type: "text", placeholder: "Ex: 12000 ou Não sei" },
      { key: "cac_maximo", label: "CAC máximo aceitável (R$)", type: "text", placeholder: "Ex: 500 ou Não sei" },
      { key: "investimento_marketing_atual", label: "Investimento total atual em marketing/mês (R$)", type: "text", placeholder: "Ex: 5000" },
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
          Envie um arquivo de texto ou cole o briefing. A IA irá extrair as informações e preencher o formulário.
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
  const [resultStrategy, setResultStrategy] = useState<Strategy | null>(null);
  const [mode, setMode] = useState<"choose" | "manual" | "upload" | "review">("choose");
  const [uploadedAnswers, setUploadedAnswers] = useState<Record<string, any> | null>(null);
  const createStrategy = useCreateStrategy();
  const updateMut = useUpdateStrategy();
  const { data: leads } = useCrmLeads();
  const navigate = useNavigate();

  const handleSubmit = async (answers: Record<string, any>, title: string) => {
    try {
      const s = await createStrategy.mutateAsync({ title, answers });
      setResult(s.result);
      setResultTitle(title);
      setResultStrategy(s);
      toast.success("Diagnóstico e planejamento estratégico gerados!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e) || "Erro ao gerar estratégia");
    }
  };

  const handleSendToCalculator = () => {
    if (!result?.entregaveis_calculadora?.length) return;
    const items = result.entregaveis_calculadora.map((e) => ({
      serviceId: e.service_id,
      quantity: e.quantity,
    }));
    navigate("/franqueado/propostas", { state: { preSelectedItems: items } });
    toast.success("Entregáveis enviados para a Calculadora!");
  };

  const handleLinkLead = async (leadId: string) => {
    if (!resultStrategy) return;
    try {
      await updateMut.mutateAsync({ id: resultStrategy.id, lead_id: leadId });
      toast.success("Estratégia vinculada ao lead!");
    } catch {
      toast.error("Erro ao vincular lead");
    }
  };

  if (result) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => { setResult(null); setMode("choose"); setUploadedAnswers(null); setResultStrategy(null); }}>
            <RefreshCw className="w-4 h-4 mr-1" /> Novo Diagnóstico
          </Button>

          {/* CRM Link */}
          {leads && (leads as any[]).length > 0 && (
            <Select onValueChange={handleLinkLead}>
              <SelectTrigger className="w-[200px] h-9 text-xs">
                <SelectValue placeholder="Vincular ao CRM..." />
              </SelectTrigger>
              <SelectContent>
                {(leads as any[]).map((lead) => (
                  <SelectItem key={lead.id} value={lead.id} className="text-xs">
                    {lead.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <StrategyResultView
          result={result}
          title={resultTitle}
          onSendToCalculator={result.entregaveis_calculadora?.length ? handleSendToCalculator : undefined}
        />
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
              Responda às 8 etapas do diagnóstico: contexto, 5 etapas estratégicas, maturidade e financeiro
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
              Envie um texto ou briefing e a IA extrai as respostas automaticamente
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
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Strategy | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null);

  const filtered = (strategies ?? []).filter((s) => {
    const matchSearch = s.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getLeadName = (leadId: string | null) => {
    if (!leadId) return null;
    return ((leads ?? []) as { id: string; name?: string }[]).find((l) => l.id === leadId)?.name || null;
  };

  const getScoreInfo = (s: Strategy) => {
    if (s.result?.diagnostico_gps) {
      return { nivel: s.result.diagnostico_gps.nivel, score: s.result.diagnostico_gps.score_geral };
    }
    if (s.result?.diagnostico_negocio?.maturidade) {
      const m = s.result.diagnostico_negocio.maturidade;
      return { nivel: m.nivel, score: m.score };
    }
    if (s.result?.maturidade) {
      return { nivel: s.result.maturidade.nivel, score: s.result.maturidade.score };
    }
    return null;
  };

  const handleSendToCalculator = (s: Strategy) => {
    if (!s.result?.entregaveis_calculadora?.length) {
      toast.error("Esta estratégia não possui entregáveis mapeados");
      return;
    }
    const items = s.result.entregaveis_calculadora.map((e) => ({
      serviceId: e.service_id,
      quantity: e.quantity,
    }));
    navigate("/franqueado/propostas", { state: { preSelectedItems: items } });
    toast.success("Entregáveis enviados para a Calculadora!");
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar diagnósticos..." className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="completed">Concluídos</SelectItem>
              <SelectItem value="draft">Rascunhos</SelectItem>
              <SelectItem value="error">Com erro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground text-sm">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">Nenhum diagnóstico encontrado</div>
        ) : (
          <div className="space-y-2">
            {filtered.map((s) => {
              const scoreInfo = getScoreInfo(s);
              const scoreColor = scoreInfo
                ? scoreInfo.score <= 25 ? "text-destructive"
                  : scoreInfo.score <= 50 ? "text-orange-500"
                  : scoreInfo.score <= 75 ? "text-amber-500" : "text-green-500"
                : "";
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
                        {scoreInfo && (
                          <Badge variant="outline" className={`text-[10px] font-bold ${scoreColor}`}>
                            {scoreInfo.score}% — {scoreInfo.nivel}
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
                      {s.result?.entregaveis_calculadora?.length ? (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleSendToCalculator(s)} aria-label="Calculadora">
                          <Calculator className="w-3.5 h-3.5" />
                        </Button>
                      ) : null}
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
                {selected.result?.entregaveis_calculadora?.length ? (
                  <Button variant="default" size="sm" onClick={() => { setSelected(null); handleSendToCalculator(selected); }}>
                    <Calculator className="w-4 h-4 mr-1" /> Enviar para Calculadora
                  </Button>
                ) : null}
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
      <PageHeader title="Criador de Estratégia" subtitle="GPS do Negócio + Planejamento Estratégico 5 Etapas — Metodologia NoExcuse" />

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
