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
import { toast } from "sonner";
import { DiagnosticForm } from "./FranqueadoEstrategiaDiagnosticForm";
import { StrategyResultView } from "./FranqueadoEstrategiaResultViews";
import type { DiagSection } from "./FranqueadoEstrategiaData";
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
} from "recharts";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/lib/supabase";

// DiagField and DiagSection types imported from ./FranqueadoEstrategiaData

// ── 8-Block SPIN + NOEXCUSE Diagnostic ──────────────────────────

const diagnosticSections: DiagSection[] = [
  {
    title: "Situação",
    subtitle: "Contexto do Negócio",
    icon: <ClipboardCheck className="w-4 h-4 text-primary" />,
    fields: [
      { key: "produto_servico", label: "Qual é o principal produto ou serviço que sua empresa vende hoje?", type: "text", placeholder: "Ex: Consultoria de marketing, Tratamento estético..." },
      { key: "ticket_medio", label: "Qual é o ticket médio desse produto ou serviço? (R$)", type: "text", placeholder: "Ex: 2000" },
      { key: "faturamento_mensal", label: "Qual é o faturamento médio mensal atual? (R$)", type: "text", placeholder: "Ex: 50000" },
      { key: "clientes_novos_mes", label: "Quantos clientes novos entram por mês hoje?", type: "text", placeholder: "Ex: 10" },
      { key: "meta_faturamento", label: "Qual é a meta de faturamento mensal que deseja atingir? (R$)", type: "text", placeholder: "Ex: 100000" },
      { key: "prazo_meta", label: "Em quanto tempo deseja alcançar essa meta?", type: "select", options: ["3 meses", "6 meses", "12 meses", "Outro"] },
      { key: "canais_atuais", label: "Quais canais hoje geram clientes para o seu negócio?", type: "checkbox-group", options: ["Indicação", "Instagram", "Tráfego pago", "Google", "WhatsApp", "Prospecção ativa", "Outros"] },
      { key: "investe_marketing", label: "Hoje você possui algum investimento em marketing mensal?", type: "select", options: ["Sim", "Não"] },
      { key: "valor_investimento_marketing", label: "Quanto investe por mês? (R$)", type: "text", placeholder: "Ex: 3000", conditionKey: "investe_marketing", conditionValues: ["Sim"] },
      { key: "canais_investimento", label: "Em quais canais investe?", type: "text", placeholder: "Ex: Meta Ads, Google Ads", conditionKey: "investe_marketing", conditionValues: ["Sim"] },
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

// ── Diagnostic Form ─────────────────────────────────────────────

function DiagnosticForm({
  onSubmit,
  loading,
  initialAnswers,
  initialTitle,
}: {
  onSubmit: (answers: Record<string, any>, title: string) => void;
  loading: boolean;
  initialAnswers?: Record<string, any>;
  initialTitle?: string;
}) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>(initialAnswers || {
    nota_marketing: 3, nota_comercial: 3, nota_leads: 3,
    nota_previsibilidade: 3, nota_marca: 3, nota_escala: 3,
  });
  const [title, setTitle] = useState(initialTitle || "");

  const section = diagnosticSections[step];
  const totalSteps = diagnosticSections.length;
  const progress = ((step + 1) / totalSteps) * 100;

  const isFieldVisible = (field: DiagField) => {
    if (!field.conditionKey) return true;
    const condVal = answers[field.conditionKey];
    return field.conditionValues?.includes(condVal);
  };

  const visibleFields = section.fields.filter(isFieldVisible);

  const canAdvance = visibleFields.every((f) => {
    if (f.type === "slider") return true;
    if (f.type === "checkbox-group") {
      const val = answers[f.key];
      return Array.isArray(val) && val.length > 0;
    }
    const val = answers[f.key];
    return val && String(val).trim() !== "";
  });

  const handleCheckbox = (key: string, option: string, checked: boolean) => {
    setAnswers((p) => {
      const arr: string[] = Array.isArray(p[key]) ? [...p[key]] : [];
      if (checked) {
        return { ...p, [key]: [...arr, option] };
      }
      return { ...p, [key]: arr.filter((v) => v !== option) };
    });
  };

  const handleSubmit = () => {
    const finalTitle = title.trim() || `Diagnóstico - ${answers.produto_servico || "Estratégia"}`;
    onSubmit(answers, finalTitle);
  };

  const sliderLabels: Record<number, string> = { 1: "Muito fraco", 2: "Fraco", 3: "Médio", 4: "Bom", 5: "Excelente" };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            {section.icon}
            {section.title}
          </CardTitle>
          <span className="text-xs text-muted-foreground">{step + 1} de {totalSteps}</span>
        </div>
        <p className="text-xs text-muted-foreground">{section.subtitle}</p>
        <Progress value={progress} className="h-1.5 mt-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        {step === 0 && (
          <div>
            <Label className="text-xs font-medium text-muted-foreground mb-1 block">Título do Diagnóstico (opcional)</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Diagnóstico Clínica Dr. Silva" />
          </div>
        )}

        {visibleFields.map((field) => (
          <div key={field.key}>
            <Label className="text-xs font-medium text-muted-foreground mb-1 block">{field.label}</Label>

            {field.type === "select" && (
              <Select value={answers[field.key] || ""} onValueChange={(v) => setAnswers((p) => ({ ...p, [field.key]: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {field.options?.map((o) => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {field.type === "textarea" && (
              <Textarea
                value={answers[field.key] || ""}
                onChange={(e) => setAnswers((p) => ({ ...p, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                rows={3}
              />
            )}

            {field.type === "text" && (
              <Input
                value={answers[field.key] || ""}
                onChange={(e) => setAnswers((p) => ({ ...p, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
              />
            )}

            {field.type === "checkbox-group" && (
              <div className="grid grid-cols-2 gap-2 mt-1">
                {field.options?.map((option) => {
                  const checked = Array.isArray(answers[field.key]) && answers[field.key].includes(option);
                  return (
                    <label key={option} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(c) => handleCheckbox(field.key, option, !!c)}
                      />
                      {option}
                    </label>
                  );
                })}
              </div>
            )}

            {field.type === "slider" && (
              <div className="space-y-2 pt-1">
                <Slider
                  value={[answers[field.key] ?? 3]}
                  onValueChange={([v]) => setAnswers((p) => ({ ...p, [field.key]: v }))}
                  min={1}
                  max={5}
                  step={1}
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span key={n} className={answers[field.key] === n ? "font-bold text-primary" : ""}>{n}</span>
                  ))}
                </div>
                <p className="text-xs text-center text-primary font-medium">
                  {sliderLabels[answers[field.key] ?? 3]}
                </p>
              </div>
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
              {loading ? "Gerando diagnóstico..." : "Gerar Diagnóstico Estratégico"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

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

function StrategyResultView({ result, title, showExport = true }: { result: StrategyResult; title?: string; showExport?: boolean }) {
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

      {/* Diagnóstico do Negócio */}
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

      {/* Radar Chart */}
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

      {/* Problemas Identificados */}
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

      {/* Gargalos Estratégicos */}
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

      {/* Projeção de Crescimento */}
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

      {/* Estratégia Recomendada */}
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

      {/* Serviços Indicados */}
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

      {/* Roadmap */}
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
          Envie um arquivo de texto ou cole o briefing abaixo. A IA irá extrair as informações e preencher o formulário automaticamente.
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
      <DiagnosticForm onSubmit={handleSubmit} loading={createStrategy.isPending} />
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
