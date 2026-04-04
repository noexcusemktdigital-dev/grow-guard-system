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
  Compass,
  Clock,
  Zap,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
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
import { motion, AnimatePresence } from "framer-motion";

// ── Diagnostic Sections (5 Etapas + Contexto + Maturidade + Financeiro) ──

const diagnosticSections: DiagSection[] = [
  {
    title: "Contexto do Negócio",
    subtitle: "Informações gerais da empresa",
    icon: <FileText className="w-5 h-5 text-primary" />,
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
    icon: <FileText className="w-5 h-5 text-primary" />,
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
    icon: <TrendingUp className="w-5 h-5 text-primary" />,
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
    icon: <Globe className="w-5 h-5 text-primary" />,
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
    icon: <ShoppingCart className="w-5 h-5 text-primary" />,
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
    icon: <LineChart className="w-5 h-5 text-primary" />,
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
    icon: <BarChart3 className="w-5 h-5 text-primary" />,
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
    icon: <Calculator className="w-5 h-5 text-primary" />,
    fields: [
      { key: "margem_lucro", label: "Margem média de lucro (%)", type: "text", placeholder: "Ex: 30" },
      { key: "ltv_medio", label: "LTV médio de um cliente (R$)", type: "text", placeholder: "Ex: 12000 ou Não sei" },
      { key: "cac_maximo", label: "CAC máximo aceitável (R$)", type: "text", placeholder: "Ex: 500 ou Não sei" },
      { key: "investimento_marketing_atual", label: "Investimento total atual em marketing/mês (R$)", type: "text", placeholder: "Ex: 5000" },
    ],
  },
];

const STEP_CARDS = [
  { num: "01", title: "Conteúdo", subtitle: "Linha editorial e produção", icon: FileText, color: "from-violet-500 to-purple-600" },
  { num: "02", title: "Tráfego", subtitle: "Distribuição e aquisição", icon: TrendingUp, color: "from-blue-500 to-cyan-500" },
  { num: "03", title: "Web", subtitle: "Conversão e presença digital", icon: Globe, color: "from-emerald-500 to-green-500" },
  { num: "04", title: "Sales", subtitle: "Vendas e fechamento", icon: ShoppingCart, color: "from-orange-500 to-amber-500" },
  { num: "05", title: "Escala", subtitle: "Validação e crescimento", icon: LineChart, color: "from-rose-500 to-red-500" },
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
    <Card className="border border-border/50 bg-card/80 backdrop-blur-none">
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

// ── Loading Animation ───────────────────────────────────────────

const LOADING_STAGES = [
  "Analisando o negócio...",
  "Calculando score de maturidade...",
  "Mapeando gargalos estratégicos...",
  "Gerando plano das 5 etapas...",
  "Criando projeções financeiras...",
  "Finalizando diagnóstico...",
];

function GeneratingAnimation() {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStageIndex((prev) => (prev < LOADING_STAGES.length - 1 ? prev + 1 : prev));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-20 space-y-8"
    >
      <div className="relative">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center"
        >
          <Compass className="w-10 h-10 text-primary" />
        </motion.div>
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.2, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 rounded-full border-2 border-primary/30"
        />
      </div>

      <div className="text-center space-y-3 max-w-md">
        <h3 className="text-lg font-bold text-foreground">Gerando Diagnóstico Estratégico</h3>
        <AnimatePresence mode="wait">
          <motion.p
            key={stageIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-sm text-muted-foreground"
          >
            {LOADING_STAGES[stageIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="flex gap-1.5">
        {LOADING_STAGES.map((_, i) => (
          <motion.div
            key={i}
            className="h-1.5 rounded-full"
            animate={{
              width: i <= stageIndex ? 24 : 8,
              backgroundColor: i <= stageIndex ? "hsl(var(--primary))" : "hsl(var(--muted))",
            }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ── Welcome Screen ──────────────────────────────────────────────

function WelcomeScreen({ onManual, onUpload }: { onManual: () => void; onUpload: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Hero */}
      <div className="text-center space-y-4 pt-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20"
        >
          <Compass className="w-10 h-10 text-primary-foreground" />
        </motion.div>

        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
            Diagnóstico Estratégico
          </h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-lg mx-auto">
            Analise o negócio do seu cliente em 5 dimensões estratégicas com a metodologia NoExcuse.
            Gere um plano completo com GPS de maturidade, ações detalhadas e projeções financeiras.
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-4 text-xs text-muted-foreground"
        >
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> ~10 min</span>
          <span className="h-3 w-px bg-border" />
          <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5" /> Framework ECE</span>
          <span className="h-3 w-px bg-border" />
          <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> IA Generativa</span>
        </motion.div>
      </div>

      {/* 5 Step Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {STEP_CARDS.map((step, i) => (
          <motion.div
            key={step.num}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 + i * 0.08 }}
          >
            <div className="rounded-xl border border-border/50 bg-card/80 p-4 text-center space-y-2 h-full">
              <div className={`w-10 h-10 mx-auto rounded-lg bg-gradient-to-br ${step.color} flex items-center justify-center`}>
                <step.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{step.num}</p>
              <p className="text-xs font-semibold text-foreground leading-tight">{step.title}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{step.subtitle}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ECE Methodology */}
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="rounded-xl border border-border/50 bg-card/80 p-5"
      >
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Metodologia ECE</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Infraestrutura", desc: "Site, landing pages, CRM, funil comercial", icon: "🏗️" },
            { label: "Coleta", desc: "Tráfego, conteúdo, captura de leads", icon: "🎯" },
            { label: "Escala", desc: "Validação, métricas, crescimento previsível", icon: "🚀" },
          ].map((item) => (
            <div key={item.label} className="text-center space-y-1">
              <span className="text-xl">{item.icon}</span>
              <p className="text-xs font-semibold text-foreground">{item.label}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{item.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
      >
        <Button size="lg" className="h-14 text-sm font-semibold" onClick={onManual}>
          <ClipboardCheck className="w-5 h-5 mr-2" />
          Preencher Diagnóstico
        </Button>
        <Button size="lg" variant="outline" className="h-14 text-sm font-semibold" onClick={onUpload}>
          <FileUp className="w-5 h-5 mr-2" />
          Upload de Briefing
        </Button>
      </motion.div>
    </motion.div>
  );
}

// ── Nova Estratégia Tab ─────────────────────────────────────────

function NovaEstrategiaTab() {
  const [result, setResult] = useState<StrategyResult | null>(null);
  const [resultTitle, setResultTitle] = useState("");
  const [resultStrategy, setResultStrategy] = useState<Strategy | null>(null);
  const [mode, setMode] = useState<"choose" | "manual" | "upload" | "review">("choose");
  const [uploadedAnswers, setUploadedAnswers] = useState<Record<string, any> | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const createStrategy = useCreateStrategy();
  const updateMut = useUpdateStrategy();
  const { data: leads } = useCrmLeads();
  const navigate = useNavigate();

  const handleSubmit = async (answers: Record<string, any>, title: string) => {
    setIsGenerating(true);
    try {
      const s = await createStrategy.mutateAsync({ title, answers });
      setResult(s.result);
      setResultTitle(title);
      setResultStrategy(s);
      toast.success("Diagnóstico e planejamento estratégico gerados!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e) || "Erro ao gerar estratégia");
    } finally {
      setIsGenerating(false);
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

  if (isGenerating) {
    return <GeneratingAnimation />;
  }

  if (result) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => { setResult(null); setMode("choose"); setUploadedAnswers(null); setResultStrategy(null); }}>
            <RefreshCw className="w-4 h-4 mr-1" /> Novo Diagnóstico
          </Button>

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
      </motion.div>
    );
  }

  if (mode === "choose") {
    return <WelcomeScreen onManual={() => setMode("manual")} onUpload={() => setMode("upload")} />;
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
                <Card key={s.id} className="border border-border/50 bg-card/80 cursor-pointer hover:ring-1 hover:ring-primary/30 transition-all" onClick={() => setSelected(s)}>
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
      <PageHeader
        title="Diagnóstico Estratégico"
        subtitle="Análise completa em 5 dimensões — Metodologia NoExcuse"
        icon={<Compass className="w-5 h-5 text-primary" />}
      />

      <Tabs defaultValue="nova">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="nova"><Target className="w-4 h-4 mr-1" /> Novo Diagnóstico Estratégico</TabsTrigger>
          <TabsTrigger value="diagnosticos"><FolderOpen className="w-4 h-4 mr-1" /> Histórico</TabsTrigger>
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
