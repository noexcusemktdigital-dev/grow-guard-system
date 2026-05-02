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
import { useState, useRef, useEffect, lazy, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { invokeEdge } from "@/lib/edge";
import { DiagnosticForm } from "./FranqueadoEstrategiaDiagnosticForm";

// PERF-WARN-02: recharts + pdf libs deferred — result view only renders after strategy is generated.
const StrategyResultView = lazy(() => import("./FranqueadoEstrategiaResultViewsLazy"));
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

// ── Diagnostic Sections (7 blocos reestruturados) ──

const diagnosticSections: DiagSection[] = [
  {
    title: "Contexto do Negócio",
    subtitle: "Informações gerais da empresa e metas",
    icon: <FileText className="w-5 h-5 text-primary" />,
    fields: [
      { key: "nome_empresa", label: "Nome da empresa", type: "text", placeholder: "Ex: Empresa Exemplo LTDA", tooltip: "Razão social ou nome fantasia do negócio do cliente." },
      { key: "segmento", label: "Qual é o segmento/nicho de mercado?", type: "text", placeholder: "Ex: Marketing digital, Saúde, Educação...", tooltip: "O segmento principal de atuação do negócio." },
      { key: "tempo_mercado", label: "Há quanto tempo está no mercado?", type: "select", options: ["Menos de 1 ano", "1 a 2 anos", "2 a 5 anos", "Mais de 5 anos"], tooltip: "Tempo de existência do negócio." },
      { key: "servicos_produtos", label: "Quais serviços e produtos a empresa oferece?", type: "textarea", placeholder: "Liste os principais serviços e/ou produtos oferecidos...", tooltip: "Descreva detalhadamente os serviços e produtos que a empresa comercializa." },
      { key: "localizacao", label: "Localização / Unidades", type: "text", placeholder: "Ex: São Paulo - SP (2 unidades)", optional: true, tooltip: "Cidade e estado. Se tiver mais de uma unidade, informe aqui." },
      { key: "ticket_medio_atual", label: "Ticket médio (R$)", type: "currency", placeholder: "2.000", tooltip: "Valor médio que cada cliente paga por uma compra ou contrato." },
      { key: "faturamento_atual", label: "Faturamento mensal atual (R$)", type: "currency", placeholder: "50.000", optional: true, tooltip: "Receita mensal aproximada do negócio." },
      { key: "meta_faturamento", label: "Meta de faturamento mensal (R$)", type: "currency", placeholder: "150.000", optional: true, tooltip: "Quanto a empresa deseja faturar por mês." },
      { key: "meta_clientes_mes", label: "Meta de novos clientes por mês", type: "text", placeholder: "Ex: 10", tooltip: "Quantos novos clientes a empresa deseja conquistar mensalmente." },
      { key: "metas_alternativas", label: "Metas alternativas ou objetivos a serem alcançados", type: "textarea", placeholder: "Descreva outras metas ou objetivos importantes do negócio...", optional: true, tooltip: "Outros objetivos além de faturamento e novos clientes, como posicionamento de marca, expansão territorial, etc." },
      { key: "pitch_negocio", label: "Fale sobre o seu negócio e tente me vender seus serviços", type: "audio-text", placeholder: "Escreva aqui um pitch completo sobre o negócio: o que faz, para quem, como se diferencia, por que o cliente deveria escolher essa empresa...", tooltip: "Este é o campo mais importante do diagnóstico. Quanto mais detalhes, melhor será a estratégia gerada. Imagine que está apresentando o negócio a um potencial investidor. Grave um áudio de até 2 minutos ou escreva diretamente." },
    ],
  },
  {
    title: "Público-Alvo e Persona",
    subtitle: "Entendendo o cliente ideal do negócio",
    icon: <Target className="w-5 h-5 text-primary" />,
    fields: [
      { key: "cliente_ideal", label: "Quem é o cliente ideal do negócio?", type: "textarea", placeholder: "Descreva o perfil do cliente ideal: quem é, o que faz, qual o porte...", tooltip: "Quanto mais específico for sobre o cliente ideal, melhor a IA poderá construir a persona." },
      { key: "faixa_etaria", label: "Faixa etária predominante", type: "select", options: ["18-24 anos", "25-34 anos", "35-44 anos", "45-54 anos", "55+ anos", "Variada"], tooltip: "A faixa etária mais comum entre os clientes do negócio." },
      { key: "genero_predominante", label: "Gênero predominante", type: "select", options: ["Masculino", "Feminino", "Misto/Equilibrado", "Outros"], tooltip: "O gênero predominante da base de clientes." },
      { key: "poder_aquisitivo", label: "Renda/poder aquisitivo do público", type: "select", options: ["Classe A (alta)", "Classe B (média-alta)", "Classe C (média)", "Classe D/E (baixa)", "Variado"], tooltip: "O poder aquisitivo médio do público-alvo." },
      { key: "canais_publico", label: "Onde o público está? Canais digitais", type: "checkbox-group", options: ["Instagram", "Facebook", "LinkedIn", "TikTok", "YouTube", "Google/Pesquisa", "WhatsApp", "E-mail"], tooltip: "Selecione os canais digitais onde o público-alvo está mais presente." },
      { key: "dor_principal", label: "Qual a principal dor ou necessidade do público?", type: "textarea", placeholder: "Ex: Falta de tempo, custo alto, qualidade insuficiente...", tooltip: "A principal dor ou problema que o público-alvo enfrenta e que o negócio resolve." },
      { key: "como_encontra", label: "Como o público encontra a empresa hoje?", type: "checkbox-group", options: ["Indicação", "Redes sociais", "Google/Pesquisa", "Tráfego pago", "Eventos", "Parcerias", "Outros"], tooltip: "Os principais canais através dos quais novos clientes chegam à empresa." },
      { key: "decisao_compra", label: "O que mais influencia a decisão de compra?", type: "textarea", placeholder: "Ex: Preço, qualidade, indicação, prova social, atendimento...", tooltip: "Os fatores que mais pesam na hora do público decidir comprar.", optional: true },
    ],
  },
  {
    title: "Concorrência",
    subtitle: "Análise dos principais concorrentes",
    icon: <Search className="w-5 h-5 text-primary" />,
    fields: [
      { key: "concorrentes", label: "Principais concorrentes (3 a 5)", type: "competitor-list", tooltip: "Adicione os principais concorrentes com nome, site e redes sociais (se tiver). Isso ajudará a IA a analisar o mercado e posicionamento." },
      { key: "diferencial_empresa", label: "Qual o principal diferencial da empresa sobre os concorrentes?", type: "textarea", placeholder: "O que torna essa empresa única e diferente dos concorrentes?", tooltip: "Descreva o que a empresa faz de diferente ou melhor que os concorrentes." },
    ],
  },
  {
    title: "Histórico e Problemas",
    subtitle: "O que já foi feito e o que precisa melhorar",
    icon: <AlertTriangle className="w-5 h-5 text-primary" />,
    fields: [
      { key: "problemas_marketing", label: "Quais os principais problemas no marketing hoje?", type: "textarea", placeholder: "Ex: Não gera leads, baixo engajamento, não tem presença digital...", tooltip: "Os maiores desafios e dores que o negócio enfrenta no marketing." },
      { key: "tentativas_marketing", label: "O que já tentou fazer no marketing? O que deu certo ou errado?", type: "textarea", placeholder: "Descreva ações passadas e seus resultados...", tooltip: "Saber o que já foi tentado ajuda a evitar erros repetidos e identificar oportunidades." },
      { key: "problemas_comercial", label: "Quais os principais problemas no comercial/vendas?", type: "textarea", placeholder: "Ex: Não fecha vendas, ciclo longo, sem processo definido...", tooltip: "Os maiores desafios na área de vendas e comercial." },
      { key: "tentativas_comercial", label: "O que já tentou fazer no comercial? O que deu certo ou errado?", type: "textarea", placeholder: "Descreva ações passadas e seus resultados...", tooltip: "Histórico de tentativas na área comercial." },
    ],
  },
  {
    title: "Conteúdo e Linha Editorial",
    subtitle: "Produção de conteúdo e presença nas redes",
    icon: <FileText className="w-5 h-5 text-primary" />,
    fields: [
      { key: "produz_conteudo", label: "A empresa produz conteúdo para redes sociais?", type: "select", options: ["Sim, com frequência", "Sim, mas irregular", "Não"], tooltip: "Se a empresa publica conteúdo regularmente em alguma rede social." },
      { key: "canais_conteudo", label: "Em quais redes sociais publica?", type: "checkbox-group", options: ["Instagram", "Facebook", "LinkedIn", "TikTok", "YouTube", "Blog", "Newsletter", "Outros"], conditionKey: "produz_conteudo", conditionValues: ["Sim, com frequência", "Sim, mas irregular"], optional: true, tooltip: "Selecione todas as plataformas onde o conteúdo é publicado." },
      { key: "frequencia_conteudo", label: "Qual a frequência de publicações?", type: "select", options: ["Diária", "3-5x por semana", "1-2x por semana", "Quinzenal ou menos"], conditionKey: "produz_conteudo", conditionValues: ["Sim, com frequência", "Sim, mas irregular"], optional: true, tooltip: "Com que frequência o conteúdo é publicado." },
      { key: "funil_conteudo", label: "O conteúdo segue um funil (topo/meio/fundo)?", type: "select", options: ["Sim", "Parcialmente", "Não", "Não sei o que é"], conditionKey: "produz_conteudo", conditionValues: ["Sim, com frequência", "Sim, mas irregular"], optional: true, tooltip: "Se o conteúdo é dividido em etapas do funil: atração (topo), consideração (meio) e decisão (fundo)." },
      { key: "formatos_usados", label: "Quais formatos de conteúdo utiliza?", type: "checkbox-group", options: ["Carrossel", "Reels/Vídeos curtos", "Stories", "Lives", "Blog/Artigos", "E-books", "Podcast", "YouTube longo"], conditionKey: "produz_conteudo", conditionValues: ["Sim, com frequência", "Sim, mas irregular"], optional: true, tooltip: "Os formatos de conteúdo que a empresa utiliza." },
      { key: "conteudo_funciona", label: "Sabe o que funciona melhor? O que dá mais resultado?", type: "textarea", placeholder: "Ex: Reels geram mais engajamento, carrosséis geram mais salvamentos...", conditionKey: "produz_conteudo", conditionValues: ["Sim, com frequência", "Sim, mas irregular"], optional: true, tooltip: "Se a empresa sabe quais tipos de conteúdo performam melhor." },
      { key: "redes_sociais_urls", label: "Links das redes sociais da empresa", type: "textarea", placeholder: "Instagram: @empresa\nFacebook: facebook.com/empresa\nLinkedIn: ...", optional: true, tooltip: "Informe os links ou @ das redes sociais da empresa." },
    ],
  },
  {
    title: "Tráfego e Distribuição",
    subtitle: "Investimento e resultados em tráfego pago",
    icon: <TrendingUp className="w-5 h-5 text-primary" />,
    fields: [
      { key: "investe_trafego_pago", label: "Investe em tráfego pago?", type: "select", options: ["Sim", "Não", "Já investiu mas parou"], tooltip: "Se a empresa investe atualmente em anúncios pagos (Meta Ads, Google Ads, etc.)." },
      { key: "investimento_mensal_trafego", label: "Quanto investe por mês em tráfego? (R$)", type: "currency", placeholder: "5.000", conditionKey: "investe_trafego_pago", conditionValues: ["Sim"], optional: true, tooltip: "O valor mensal investido em plataformas de anúncios." },
      { key: "plataformas_trafego", label: "Quais plataformas de tráfego usa?", type: "checkbox-group", options: ["Meta Ads", "Google Ads", "TikTok Ads", "LinkedIn Ads", "YouTube Ads", "Outros"], conditionKey: "investe_trafego_pago", conditionValues: ["Sim"], optional: true, tooltip: "As plataformas de anúncios que a empresa utiliza." },
      { key: "sabe_indicadores", label: "Sabe quais indicadores de tráfego tem hoje?", type: "select", options: ["Sim", "Não", "Parcialmente"], conditionKey: "investe_trafego_pago", conditionValues: ["Sim"], optional: true, tooltip: "Se a empresa monitora KPIs como CPL, CTR, CPC, etc." },
      { key: "cpl_atual", label: "Qual o CPL (custo por lead) atual? (R$)", type: "text", placeholder: "Ex: 30 ou Não sei", conditionKey: "sabe_indicadores", conditionValues: ["Sim", "Parcialmente"], optional: true, tooltip: "Quanto a empresa paga em média por cada lead gerado." },
      { key: "leads_mes", label: "Quantos leads gera por mês?", type: "text", placeholder: "Ex: 50", conditionKey: "sabe_indicadores", conditionValues: ["Sim", "Parcialmente"], optional: true, tooltip: "Volume mensal de leads gerados através das campanhas." },
      { key: "canal_mais_converte", label: "Qual canal gera mais clientes hoje?", type: "text", placeholder: "Ex: Instagram, Google, Indicação...", conditionKey: "investe_trafego_pago", conditionValues: ["Sim"], optional: true, tooltip: "O canal que mais converte leads em clientes." },
      { key: "objetivos_trafego", label: "Quais objetivos já testou? O que funcionou e o que não?", type: "textarea", placeholder: "Ex: Testei conversão e tráfego. Conversão gerou mais leads qualificados...", conditionKey: "investe_trafego_pago", conditionValues: ["Sim", "Já investiu mas parou"], optional: true, tooltip: "Descreva os objetivos de campanha já testados e seus resultados." },
    ],
  },
  {
    title: "Web, Sales e Validação",
    subtitle: "Presença digital, processo comercial e métricas",
    icon: <Globe className="w-5 h-5 text-primary" />,
    fields: [
      // Sub-seção Web
      { key: "tem_site", label: "A empresa possui e-commerce, site ou landing page?", type: "select", options: ["Sim", "Não"], tooltip: "Se a empresa tem alguma presença web (site, loja online, landing page)." },
      { key: "url_site", label: "URL do site/landing page", type: "text", placeholder: "Ex: www.empresa.com.br", conditionKey: "tem_site", conditionValues: ["Sim"], optional: true, tooltip: "O endereço do site principal da empresa." },
      { key: "taxa_conversao_site", label: "Qual a taxa de conversão do site/LP?", type: "select", options: ["Acima de 5%", "Entre 2% e 5%", "Abaixo de 2%", "Não mede", "Não sei"], conditionKey: "tem_site", conditionValues: ["Sim"], optional: true, tooltip: "Porcentagem de visitantes que realizam a ação desejada (contato, compra, etc.)." },
      { key: "faz_teste_ab", label: "Realiza testes A/B?", type: "select", options: ["Sim, regularmente", "Às vezes", "Não"], conditionKey: "tem_site", conditionValues: ["Sim"], optional: true, tooltip: "Se a empresa testa variações de páginas para otimizar conversão." },
      { key: "elementos_prova", label: "Possui elementos de prova social no site?", type: "select", options: ["Sim (depoimentos, cases)", "Parcial", "Não"], conditionKey: "tem_site", conditionValues: ["Sim"], optional: true, tooltip: "Se o site tem depoimentos, avaliações, cases de sucesso, selos de confiança, etc." },
      { key: "sites_concorrentes_analise", label: "Sites de concorrentes para análise", type: "text", placeholder: "Ex: www.concorrente1.com.br, www.concorrente2.com.br", conditionKey: "tem_site", conditionValues: ["Não"], optional: true, tooltip: "Informe sites de concorrentes para que possamos analisar como referência." },

      // Sub-seção Sales
      { key: "processo_comercial", label: "Possui processo comercial definido?", type: "select", options: ["Sim, documentado", "Parcial", "Não"], tooltip: "Se a empresa tem um processo estruturado de vendas com etapas definidas." },
      { key: "descricao_processo_comercial", label: "Descreva como funciona o processo comercial hoje", type: "textarea", placeholder: "Ex: Lead chega pelo WhatsApp, vendedor faz contato em 24h, agenda reunião...", conditionKey: "processo_comercial", conditionValues: ["Sim, documentado", "Parcial"], optional: true, tooltip: "Descreva o fluxo desde que o lead chega até o fechamento da venda." },
      { key: "tamanho_time_comercial", label: "Quantas pessoas no time comercial?", type: "text", placeholder: "Ex: 3", optional: true, tooltip: "Tamanho da equipe de vendas." },
      { key: "usa_crm", label: "Utiliza CRM?", type: "select", options: ["Sim", "Não", "Planilha/Manual"], optional: true, tooltip: "Se utiliza uma ferramenta de gestão de relacionamento com clientes." },
      { key: "taxa_conversao_comercial", label: "Qual a taxa de conversão de lead para cliente?", type: "select", options: ["Acima de 20%", "Entre 10% e 20%", "Abaixo de 10%", "Não mede"], optional: true, tooltip: "Porcentagem de leads que se tornam clientes pagantes." },
      { key: "followup", label: "Realiza follow-up estruturado?", type: "select", options: ["Sim, com cadência", "Às vezes", "Não"], optional: true, tooltip: "Se a empresa tem um processo de acompanhamento (follow-up) com os leads." },

      // Sub-seção Validação
      { key: "mede_metricas", label: "Acompanha métricas de marketing e vendas?", type: "select", options: ["Sim, com dashboards", "Sim, manualmente", "Parcialmente", "Não"], tooltip: "Se a empresa monitora indicadores de performance de marketing e vendas." },
      { key: "kpis_marketing", label: "Quais indicadores de marketing acompanha?", type: "checkbox-group", options: ["Leads/mês", "CPL", "Taxa de conversão", "CAC", "ROI", "Engajamento", "Alcance", "Nenhum"], conditionKey: "mede_metricas", conditionValues: ["Sim, com dashboards", "Sim, manualmente", "Parcialmente"], optional: true, tooltip: "Os KPIs de marketing que são monitorados regularmente." },
      { key: "kpis_comercial", label: "Quais indicadores comerciais acompanha?", type: "checkbox-group", options: ["Taxa de fechamento", "Tempo de fechamento", "Ticket médio", "LTV", "Churn", "Pipeline", "Nenhum"], conditionKey: "mede_metricas", conditionValues: ["Sim, com dashboards", "Sim, manualmente", "Parcialmente"], optional: true, tooltip: "Os KPIs comerciais que são monitorados regularmente." },
      { key: "capacidade_atendimento", label: "Se atingir sua meta de clientes, consegue atender ou precisará reestruturar o comercial?", type: "select", options: ["Consigo atender tranquilamente", "Consigo com ajustes pontuais", "Precisarei reestruturar o comercial", "Precisarei contratar mais gente"], optional: true, tooltip: "Avalia se a empresa tem capacidade operacional para absorver o crescimento planejado." },
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
      const { data, error } = await invokeEdge("extract-strategy-answers", {
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
            { label: "Estrutura", desc: "Site, landing pages, CRM, funil comercial", icon: "🏗️" },
            { label: "Coleta de Dados", desc: "Tráfego, conteúdo, captura de leads", icon: "🎯" },
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
        className="flex justify-center"
      >
        <Button size="lg" className="h-14 text-sm font-semibold w-full max-w-md" onClick={onManual}>
          <ClipboardCheck className="w-5 h-5 mr-2" />
          Preencher Diagnóstico
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
        <Suspense fallback={<div className="py-12 flex items-center justify-center"><span className="text-sm text-muted-foreground">Carregando resultado...</span></div>}>
          <StrategyResultView
            result={result}
            title={resultTitle}
            onSendToCalculator={result.entregaveis_calculadora?.length ? handleSendToCalculator : undefined}
          />
        </Suspense>
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
              {selected.result && (
                <Suspense fallback={<div className="py-8 flex items-center justify-center"><span className="text-sm text-muted-foreground">Carregando...</span></div>}>
                  <StrategyResultView result={selected.result} title={selected.title} />
                </Suspense>
              )}
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
