import { useState } from "react";
import {
  Sparkles, Pencil, ArrowRight, ArrowLeft, Loader2, RefreshCw, Save,
  Crosshair, ShieldQuestion, Handshake, Target, Ban, Info, Link, Plus, X,
  GraduationCap, BookOpen, ChevronDown, ChevronUp, FileText
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useCrmProducts } from "@/hooks/useCrmProducts";
import { useCrmFunnels } from "@/hooks/useCrmFunnels";
import { useSalesPlan } from "@/hooks/useSalesPlan";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { InsufficientCreditsDialog, isInsufficientCreditsError } from "@/components/cliente/InsufficientCreditsDialog";

const funnelStages = [
  { key: "prospeccao", label: "Prospecção", icon: Crosshair, color: "text-blue-400" },
  { key: "diagnostico", label: "Diagnóstico", icon: ShieldQuestion, color: "text-cyan-400" },
  { key: "negociacao", label: "Negociação", icon: Handshake, color: "text-purple-400" },
  { key: "fechamento", label: "Fechamento", icon: Target, color: "text-emerald-400" },
  { key: "objecoes", label: "Quebra de Objeções", icon: Ban, color: "text-amber-400" },
];

const stageTutorials: Record<string, { title: string; objetivo: string; dicas: string[]; exemplos: string[] }> = {
  prospeccao: {
    title: "📞 Prospecção — Primeiro Contato",
    objetivo: "Abrir a conversa, gerar interesse e qualificar rapidamente se o lead tem potencial.",
    dicas: [
      "Comece com uma saudação personalizada (nome + contexto)",
      "Use um gancho de valor nos primeiros 10 segundos",
      "Faça 1-2 perguntas de qualificação rápida (BANT)",
      "Tenha uma CTA clara (agendar reunião, enviar material)",
      "Prepare variações: prospect receptivo, ocupado e resistente",
    ],
    exemplos: [
      "Oi [Nome], vi que a [Empresa] atua em [segmento]. Nós ajudamos empresas como a sua a [resultado]. Faz sentido conversar 15 min?",
      "[Nome], bom dia! Uma empresa parecida com a sua conseguiu [resultado] em [prazo]. Quero te mostrar como — posso te mandar um resumo?",
    ],
  },
  diagnostico: {
    title: "🔍 Diagnóstico — Entendendo o Cliente",
    objetivo: "Mapear a situação atual, desafios e necessidades para construir a proposta ideal.",
    dicas: [
      "Organize perguntas em blocos: Situação, Desafios, Impacto, Solução Ideal",
      "Use perguntas abertas para gerar conversa (nunca sim/não)",
      "Anote tudo — cada detalhe vira argumento de venda",
      "Demonstre expertise com dados e benchmarks do mercado",
      "Faça transições suaves entre os blocos",
    ],
    exemplos: [
      "Me conta como funciona o processo de [área] na empresa hoje?",
      "Se pudesse resolver UM problema agora, qual seria?",
      "Quanto isso está custando por mês em retrabalho / oportunidades perdidas?",
    ],
  },
  negociacao: {
    title: "💼 Negociação — Apresentando Valor",
    objetivo: "Conectar a solução com as dores descobertas e apresentar condições que fazem sentido.",
    dicas: [
      "Sempre apresente VALOR antes de PREÇO",
      "Use ancoragem: mostre o custo do problema antes da solução",
      "Prepare concessões estratégicas (nunca ceda grátis)",
      "Demonstre ROI com números concretos",
      "Tenha respostas prontas para objeções de preço",
    ],
    exemplos: [
      "Baseado no que você me contou, o custo de NÃO resolver isso é de R$[X]/mês. Nossa solução é R$[Y] — o payback é em [prazo].",
      "Temos 3 opções que se encaixam no que discutimos. Deixa eu te mostrar a que mais faz sentido pro seu cenário.",
    ],
  },
  fechamento: {
    title: "🎯 Fechamento — Concretizando a Venda",
    objetivo: "Identificar sinais de compra e conduzir naturalmente para o aceite.",
    dicas: [
      "Resuma os benefícios acordados antes de pedir o fechamento",
      "Use a técnica da 'alternativa de escolha' (não se, mas qual)",
      "Crie urgência legítima (vagas, preço, condição especial)",
      "Tenha o contrato/proposta pronto para envio imediato",
      "Defina próximos passos claros após o aceite",
    ],
    exemplos: [
      "Então, das opções que conversamos, qual faz mais sentido pra começar: o plano [A] ou o [B]?",
      "Perfeito! Vou enviar o contrato agora. Assim que assinar, já agendamos o onboarding pra [data].",
    ],
  },
  objecoes: {
    title: "🛡️ Quebra de Objeções — Contornando Resistências",
    objetivo: "Transformar objeções em oportunidades usando o framework Empatia → Pergunta → Reframe → Evidência.",
    dicas: [
      "Nunca discuta com o cliente — use empatia primeiro",
      "Faça uma pergunta para entender a objeção real",
      "Reframe: mude a perspectiva com dados ou exemplos",
      "Use cases de sucesso como evidência social",
      "Retome a negociação com naturalidade após contornar",
    ],
    exemplos: [
      "'Está caro' → 'Entendo! Me conta: comparado com o quê? Porque quando olhamos o ROI de [X]%...'",
      "'Preciso pensar' → 'Claro! O que especificamente você precisa avaliar? Posso te ajudar com algum dado?'",
      "'Já uso outro' → 'Legal! E como tem sido a experiência? O que faria diferença pra você?'",
    ],
  },
};

const briefingQuestions: Record<string, { key: string; label: string; placeholder: string }[]> = {
  prospeccao: [
    { key: "Canal principal", label: "Qual o canal principal de prospecção?", placeholder: "Ex: WhatsApp, ligação, email, LinkedIn" },
    { key: "Dor do cliente", label: "Qual a principal dor do cliente?", placeholder: "Ex: Perda de clientes, baixa conversão, processo manual" },
    { key: "Tipo de contato", label: "Como é o primeiro contato?", placeholder: "Ex: Cold call, indicação, inbound" },
  ],
  diagnostico: [
    { key: "Perguntas de qualificação", label: "Quais perguntas você faz para qualificar?", placeholder: "Ex: Orçamento, necessidade, prazo, decisor" },
    { key: "Critérios de qualificação", label: "Qual framework de qualificação?", placeholder: "Ex: BANT, SPIN, GPCT, MEDDIC" },
    { key: "Tempo médio", label: "Quanto tempo dura uma reunião de diagnóstico?", placeholder: "Ex: 30min, 1h" },
  ],
  negociacao: [
    { key: "Diferencial competitivo", label: "Qual o diferencial competitivo?", placeholder: "Ex: Atendimento, tecnologia, preço, exclusividade" },
    { key: "Faixa de preço", label: "Qual a faixa de preço?", placeholder: "Ex: R$500-2000/mês, ticket médio de R$5000" },
    { key: "Política de desconto", label: "Existe política de desconto?", placeholder: "Ex: Até 10% para pagamento anual" },
  ],
  fechamento: [
    { key: "Urgência", label: "Qual a urgência típica de fechamento?", placeholder: "Ex: 7 dias, 30 dias, sem prazo definido" },
    { key: "Período de teste", label: "Oferece período de teste?", placeholder: "Ex: 7 dias grátis, demonstração, POC" },
    { key: "Formalização", label: "Como é a formalização?", placeholder: "Ex: Contrato digital, proposta + aceite, pedido de compra" },
  ],
  objecoes: [
    { key: "Objeções comuns", label: "Quais as 3 objeções mais comuns?", placeholder: "Ex: Preço alto, já uso outro, preciso pensar" },
    { key: "Concorrente principal", label: "Quem é o concorrente principal?", placeholder: "Ex: Empresa X, solução Y, fazer internamente" },
    { key: "Argumento matador", label: "Qual seu melhor argumento contra objeções?", placeholder: "Ex: ROI comprovado, cases de sucesso, garantia" },
  ],
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (script: { title: string; content: string; category: string; tags: string[] }) => void;
  initialStage?: string;
}

export default function ScriptGeneratorDialog({ open, onOpenChange, onSave, initialStage }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [mode, setMode] = useState<"ai" | "manual">("ai");
  const [stage, setStage] = useState(initialStage || "prospeccao");
  const [briefing, setBriefing] = useState<Record<string, string>>({});
  const [generatedContent, setGeneratedContent] = useState("");
  const [generatedTitle, setGeneratedTitle] = useState("");
  const [generatedTags, setGeneratedTags] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);
  const [showCreditsDialog, setShowCreditsDialog] = useState(false);

  // Links & documents context
  const [referenceLinks, setReferenceLinks] = useState<string[]>([]);
  const [newLink, setNewLink] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");

  // Manual mode fields
  const [manualTitle, setManualTitle] = useState("");
  const [manualContent, setManualContent] = useState("");

  // Auto context from CRM + Sales Plan
  const { data: products } = useCrmProducts();
  const { data: funnels } = useCrmFunnels();
  const { data: salesPlan } = useSalesPlan();
  const { data: orgId } = useUserOrgId();

  const salesPlanAnswers = salesPlan?.answers || {};
  const autoContext = {
    products: products?.map(p => ({ name: p.name, price: p.price })) || [],
    segment: salesPlanAnswers.segmento || "",
    channels: Array.isArray(salesPlanAnswers.canais_aquisicao) ? salesPlanAnswers.canais_aquisicao : [],
    teamSize: salesPlanAnswers.tamanho_equipe || "",
    ticketMedio: salesPlanAnswers.ticket_medio || "",
    modeloNegocio: salesPlanAnswers.modelo_negocio || "",
    diferenciais: salesPlanAnswers.diferenciais || "",
    produtosServicos: salesPlanAnswers.produtos_servicos || "",
    dorPrincipal: salesPlanAnswers.dor_principal || "",
    tempoFechamento: salesPlanAnswers.tempo_fechamento || "",
    usaScripts: salesPlanAnswers.usa_scripts || "",
    etapasFunil: Array.isArray(salesPlanAnswers.etapas_funil) ? salesPlanAnswers.etapas_funil : [],
  };

  const hasContext = autoContext.products.length > 0 || autoContext.segment || autoContext.channels.length > 0 || autoContext.diferenciais;

  const reset = () => {
    setStep(1);
    setMode("ai");
    setStage(initialStage || "prospeccao");
    setBriefing({});
    setGeneratedContent("");
    setGeneratedTitle("");
    setGeneratedTags([]);
    setManualTitle("");
    setManualContent("");
    setReferenceLinks([]);
    setNewLink("");
    setAdditionalContext("");
    setShowTutorial(true);
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const addLink = () => {
    const trimmed = newLink.trim();
    if (trimmed && !referenceLinks.includes(trimmed)) {
      setReferenceLinks(prev => [...prev, trimmed]);
      setNewLink("");
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-script", {
        body: {
          stage,
          briefing,
          context: autoContext,
          mode: "generate",
          referenceLinks,
          additionalContext,
          organization_id: orgId,
        },
      });

      if (error) throw error;
      if (data?.error) {
        if (data.error.includes("INSUFFICIENT_CREDITS") || data.error.includes("Créditos insuficientes")) {
          setShowCreditsDialog(true);
          return;
        }
        toast({ title: "Erro", description: data.error, variant: "destructive" });
        return;
      }

      setGeneratedContent(data.content);
      setGeneratedTitle(data.title || "");
      setGeneratedTags(data.tags || []);
      setStep(3);
    } catch (e: any) {
      if (isInsufficientCreditsError(e)) {
        setShowCreditsDialog(true);
      } else {
        toast({ title: "Erro ao gerar script", description: e.message, variant: "destructive" });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (mode === "manual") {
      if (!manualTitle.trim()) return;
      onSave({ title: manualTitle, content: manualContent, category: stage, tags: [] });
    } else {
      onSave({
        title: generatedTitle,
        content: generatedContent,
        category: stage,
        tags: generatedTags,
      });
    }
    handleOpenChange(false);
  };

  const selectedStage = funnelStages.find(s => s.key === stage)!;
  const tutorial = stageTutorials[stage];

  return (
    <>
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 1 && "Novo Script"}
            {step === 2 && (
              <>
                <selectedStage.icon className={`w-5 h-5 ${selectedStage.color}`} />
                {selectedStage.label} — Briefing
              </>
            )}
            {step === 3 && (
              <>
                <Sparkles className="w-5 h-5 text-primary" />
                Script Gerado
              </>
            )}
          </DialogTitle>

          {mode === "ai" && (
            <div className="flex items-center gap-2 mt-2">
              {[1, 2, 3].map(s => (
                <div
                  key={s}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    s <= step ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>
          )}
        </DialogHeader>

        {/* STEP 1: Choose stage + mode */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <Label className="text-xs font-medium">Etapa do Funil</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                {funnelStages.map(s => (
                  <button
                    key={s.key}
                    onClick={() => setStage(s.key)}
                    className={`flex items-center gap-2 p-3 rounded-lg border text-left text-sm transition-all ${
                      stage === s.key
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <s.icon className={`w-4 h-4 ${s.color}`} />
                    <span className="font-medium">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tutorial section for selected stage */}
            <Collapsible open={showTutorial} onOpenChange={setShowTutorial}>
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-2 w-full p-3 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors text-left">
                  <GraduationCap className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sm font-medium flex-1">{tutorial.title}</span>
                  {showTutorial ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 p-4 rounded-lg border bg-muted/30 space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-primary mb-1">🎯 Objetivo</p>
                    <p className="text-xs text-muted-foreground">{tutorial.objetivo}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-primary mb-1">💡 Dicas Essenciais</p>
                    <ul className="space-y-1">
                      {tutorial.dicas.map((d, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <span className="text-primary mt-0.5">•</span> {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-primary mb-1">📝 Exemplos de Abertura</p>
                    {tutorial.exemplos.map((ex, i) => (
                      <div key={i} className="p-2 bg-background/50 rounded border text-[10px] font-mono mb-1.5 leading-relaxed">
                        {ex}
                      </div>
                    ))}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <div>
              <Label className="text-xs font-medium">Como deseja criar?</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <button
                  onClick={() => setMode("ai")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border text-center transition-all ${
                    mode === "ai"
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <Sparkles className="w-6 h-6 text-primary" />
                  <span className="text-sm font-semibold">Gerar com IA</span>
                  <span className="text-[10px] text-muted-foreground">
                    Responda perguntas e a IA cria o script com base no seu negócio
                  </span>
                </button>
                <button
                  onClick={() => setMode("manual")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border text-center transition-all ${
                    mode === "manual"
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <Pencil className="w-6 h-6 text-muted-foreground" />
                  <span className="text-sm font-semibold">Criar manual</span>
                  <span className="text-[10px] text-muted-foreground">
                    Escreva o conteúdo do script
                  </span>
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setStep(mode === "ai" ? 2 : 3)} className="gap-1">
                {mode === "ai" ? "Próximo" : "Criar"}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Briefing (AI mode only) */}
        {step === 2 && mode === "ai" && (
          <div className="space-y-5">
            {/* Auto context from Sales Plan */}
            {hasContext && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
                  <BookOpen className="w-3.5 h-3.5" />
                  Contexto automático do Plano de Vendas
                </div>
                {autoContext.segment && (
                  <p className="text-xs text-muted-foreground">Segmento: <span className="font-medium text-foreground">{autoContext.segment}</span></p>
                )}
                {autoContext.produtosServicos && (
                  <p className="text-xs text-muted-foreground">Produtos: <span className="font-medium text-foreground">{autoContext.produtosServicos.substring(0, 100)}</span></p>
                )}
                {autoContext.diferenciais && (
                  <p className="text-xs text-muted-foreground">Diferenciais: <span className="font-medium text-foreground">{autoContext.diferenciais.substring(0, 100)}</span></p>
                )}
                {autoContext.dorPrincipal && (
                  <p className="text-xs text-muted-foreground">Dor do cliente: <span className="font-medium text-foreground">{autoContext.dorPrincipal.substring(0, 100)}</span></p>
                )}
                {autoContext.products.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    CRM: {autoContext.products.map(p => p.name).join(", ")}
                  </p>
                )}
                {autoContext.channels.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Canais: {autoContext.channels.join(", ")}
                  </p>
                )}
              </div>
            )}

            {/* Briefing questions */}
            <div className="space-y-3">
              {briefingQuestions[stage]?.map(q => (
                <div key={q.key}>
                  <Label className="text-xs">{q.label}</Label>
                  <Input
                    className="mt-1"
                    placeholder={q.placeholder}
                    value={briefing[q.key] || ""}
                    onChange={e => setBriefing(prev => ({ ...prev, [q.key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>

            {/* Reference links & documents */}
            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center gap-1.5">
                <Link className="w-3.5 h-3.5 text-primary" />
                <Label className="text-xs font-medium">Links de Referência</Label>
                <span className="text-[10px] text-muted-foreground">(opcional)</span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Adicione links de concorrentes, artigos ou materiais que a IA deve considerar ao gerar o script.
              </p>
              <div className="flex gap-2">
                <Input
                  className="flex-1"
                  placeholder="https://exemplo.com/material-referencia"
                  value={newLink}
                  onChange={e => setNewLink(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addLink()}
                />
                <Button size="sm" variant="outline" onClick={addLink} disabled={!newLink.trim()}>
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
              {referenceLinks.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {referenceLinks.map((link, i) => (
                    <Badge key={i} variant="secondary" className="text-[10px] gap-1 max-w-[200px]">
                      <Link className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate">{link.replace(/^https?:\/\//, "").substring(0, 30)}</span>
                      <button onClick={() => setReferenceLinks(prev => prev.filter((_, j) => j !== i))}>
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Additional context */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-primary" />
                <Label className="text-xs font-medium">Contexto Adicional</Label>
                <span className="text-[10px] text-muted-foreground">(opcional)</span>
              </div>
              <Textarea
                rows={3}
                className="text-xs"
                placeholder="Cole aqui trechos de documentos, dados de pesquisa, informações sobre o mercado ou qualquer contexto adicional que a IA deve usar para personalizar o script..."
                value={additionalContext}
                onChange={e => setAdditionalContext(e.target.value)}
              />
            </div>

            {/* Extra context fields if no auto-context */}
            {!hasContext && (
              <div className="space-y-3 pt-2 border-t">
                <p className="text-[10px] text-muted-foreground">
                  💡 Preencha o Plano de Vendas para contexto automático, ou informe abaixo:
                </p>
                <div>
                  <Label className="text-xs">Segmento do negócio</Label>
                  <Input
                    className="mt-1"
                    placeholder="Ex: Tecnologia SaaS, Consultoria, E-commerce"
                    value={briefing["Segmento"] || ""}
                    onChange={e => setBriefing(prev => ({ ...prev, Segmento: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="text-xs">Produto/Serviço principal</Label>
                  <Input
                    className="mt-1"
                    placeholder="Ex: Software de gestão, consultoria financeira"
                    value={briefing["Produto"] || ""}
                    onChange={e => setBriefing(prev => ({ ...prev, Produto: e.target.value }))}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)} className="gap-1">
                <ArrowLeft className="w-4 h-4" /> Voltar
              </Button>
              <Button onClick={handleGenerate} disabled={isGenerating} className="gap-1">
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Gerando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Gerar Script
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Preview / Manual edit */}
        {step === 3 && (
          <div className="space-y-4">
            {mode === "manual" ? (
              <>
                <div>
                  <Label className="text-xs">Título *</Label>
                  <Input
                    value={manualTitle}
                    onChange={e => setManualTitle(e.target.value)}
                    placeholder="Ex: Script de prospecção WhatsApp"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Conteúdo</Label>
                  <Textarea
                    value={manualContent}
                    onChange={e => setManualContent(e.target.value)}
                    rows={10}
                    className="mt-1 font-mono text-sm"
                    placeholder="Digite o script..."
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label className="text-xs">Título</Label>
                  <Input
                    value={generatedTitle}
                    onChange={e => setGeneratedTitle(e.target.value)}
                    className="mt-1"
                  />
                </div>
                {generatedTags.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap">
                    {generatedTags.map(t => (
                      <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                    ))}
                  </div>
                )}
                <div>
                  <Label className="text-xs">Conteúdo</Label>
                  <Textarea
                    value={generatedContent}
                    onChange={e => setGeneratedContent(e.target.value)}
                    rows={14}
                    className="mt-1 font-mono text-xs leading-relaxed"
                  />
                </div>
              </>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(mode === "ai" ? 2 : 1)} className="gap-1">
                <ArrowLeft className="w-4 h-4" /> Voltar
              </Button>
              <div className="flex gap-2">
                {mode === "ai" && (
                  <Button variant="outline" onClick={handleGenerate} disabled={isGenerating} className="gap-1">
                    <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`} />
                    Regenerar
                  </Button>
                )}
                <Button
                  onClick={handleSave}
                  disabled={mode === "manual" ? !manualTitle.trim() : !generatedContent.trim()}
                  className="gap-1"
                >
                  <Save className="w-4 h-4" /> Salvar Script
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
    <InsufficientCreditsDialog
      open={showCreditsDialog}
      onOpenChange={setShowCreditsDialog}
      actionLabel="gerar este script"
      creditCost={150}
    />
    </>
  );
}
