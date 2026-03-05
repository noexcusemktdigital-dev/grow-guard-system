import { useState, useCallback } from "react";
import {
  Globe, Sparkles, ArrowLeft, ArrowRight, Loader2,
  Link2, Briefcase, Target, Users, Package, Award,
  MessageSquareQuote, MousePointerClick, Layout, Palette,
  Check, Info,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { UsageQuotaBanner } from "@/components/quota/UsageQuotaBanner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useClienteSubscription } from "@/hooks/useClienteSubscription";
import { getPlanBySlug } from "@/constants/plans";
import { SitePreview } from "@/components/sites/SitePreview";
import { SiteHistory, type SavedSite } from "@/components/sites/SiteHistory";
import { useClienteSitesDB, useCreateClientSite } from "@/hooks/useClienteSitesDB";
import { useActiveStrategy } from "@/hooks/useMarketingStrategy";
import { useContentHistory } from "@/hooks/useClienteContentV2";
import { useVisualIdentity } from "@/hooks/useVisualIdentity";
import { useUserOrgId } from "@/hooks/useUserOrgId";

/* ═══ WIZARD CONFIG ═══ */

const STEPS = [
  { id: "referencia", label: "Referência", icon: Link2 },
  { id: "tipo_negocio", label: "Tipo de Negócio", icon: Briefcase },
  { id: "objetivo", label: "Objetivo", icon: Target },
  { id: "publico", label: "Público", icon: Users },
  { id: "servicos", label: "Serviços", icon: Package },
  { id: "diferenciais", label: "Diferenciais", icon: Award },
  { id: "provas", label: "Prova Social", icon: MessageSquareQuote },
  { id: "cta", label: "CTA", icon: MousePointerClick },
  { id: "paginas", label: "Páginas", icon: Layout },
  { id: "estilo", label: "Estilo Visual", icon: Palette },
] as const;

const TIPO_NEGOCIO_OPTIONS = [
  { value: "consultoria", label: "Consultoria" },
  { value: "servicos", label: "Empresa de Serviços" },
  { value: "clinica", label: "Clínica / Saúde" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "franquia", label: "Franquia" },
  { value: "educacao", label: "Educação" },
  { value: "tecnologia", label: "Tecnologia" },
];

const OBJETIVO_OPTIONS = [
  { value: "gerar_leads", label: "Gerar Leads" },
  { value: "apresentar_servicos", label: "Apresentar Serviços" },
  { value: "vender_produtos", label: "Vender Produtos" },
  { value: "captar_franqueados", label: "Captar Franqueados" },
];

const PUBLICO_CHIPS = [
  "Empresários", "Médicos", "Produtores Rurais", "Consumidores Finais",
  "Profissionais Liberais", "Gestores", "Estudantes", "Executivos",
];

const PROVA_OPTIONS = [
  { value: "depoimentos", label: "Depoimentos de Clientes" },
  { value: "numeros", label: "Números da Empresa" },
  { value: "experiencia", label: "Anos de Experiência" },
  { value: "cases", label: "Cases de Sucesso" },
];

const CTA_OPTIONS = [
  { value: "orcamento", label: "Pedir Orçamento" },
  { value: "whatsapp", label: "Falar no WhatsApp" },
  { value: "reuniao", label: "Agendar Reunião" },
  { value: "comprar", label: "Comprar Produto" },
];

const PAGINA_OPTIONS = [
  { value: "home", label: "Home" },
  { value: "sobre", label: "Sobre" },
  { value: "servicos", label: "Serviços" },
  { value: "portfolio", label: "Portfólio" },
  { value: "blog", label: "Blog" },
  { value: "depoimentos", label: "Depoimentos" },
  { value: "faq", label: "FAQ" },
  { value: "contato", label: "Contato" },
];

const ESTILO_OPTIONS = [
  { value: "moderno", label: "Moderno" },
  { value: "minimalista", label: "Minimalista" },
  { value: "corporativo", label: "Corporativo" },
  { value: "sofisticado", label: "Sofisticado" },
  { value: "tecnologico", label: "Tecnológico" },
];

/* ═══ CHIP SELECT ═══ */

function ChipSelect({ options, selected, onToggle, multi = true }: {
  options: { value: string; label: string }[] | string[];
  selected: string[];
  onToggle: (v: string) => void;
  multi?: boolean;
}) {
  const items = typeof options[0] === "string"
    ? (options as string[]).map(s => ({ value: s, label: s }))
    : options as { value: string; label: string }[];

  return (
    <div className="flex flex-wrap gap-2">
      {items.map(o => {
        const active = selected.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onToggle(o.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              active
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-foreground border-border hover:border-primary/50"
            }`}
          >
            {active && <Check className="w-3 h-3 inline mr-1" />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ═══ AUTO-INJECTED DATA BADGE ═══ */

function AutoBadge({ label, value }: { label: string; value: string | undefined }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground bg-muted/50 rounded-md px-2 py-1">
      <Info className="w-3 h-3 text-primary shrink-0" />
      <span className="font-medium text-foreground">{label}:</span>
      <span className="truncate max-w-[200px]">{value}</span>
    </div>
  );
}

/* ═══ MAIN COMPONENT ═══ */

export default function ClienteSites() {
  const { data: subscription } = useClienteSubscription();
  const plan = getPlanBySlug(subscription?.plan);
  const maxSites = plan?.maxSites || 1;
  const { data: orgId } = useUserOrgId();

  const { data: dbSites } = useClienteSitesDB();
  const createSiteMutation = useCreateClientSite();
  const { data: activeStrategy } = useActiveStrategy();
  const { data: contents } = useContentHistory();
  const { data: visualIdentity } = useVisualIdentity();

  const sites: SavedSite[] = (dbSites || []).map(s => ({
    id: s.id,
    name: s.name,
    type: s.type || "lp",
    status: (s.status === "Publicado" ? "Publicado" : "Rascunho") as "Publicado" | "Rascunho",
    createdAt: s.created_at.split("T")[0],
    html: (s.content as any)?.html || "",
  }));

  // Wizard state
  const [creating, setCreating] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [genProgress, setGenProgress] = useState(0);

  // Form data
  const [form, setForm] = useState<Record<string, any>>({
    referencia: "",
    descricao_manual: "",
    tipo_negocio: "",
    objetivo: "",
    publico_chips: [] as string[],
    publico_custom: "",
    servicos: "",
    diferenciais: "",
    provas: [] as string[],
    provas_depoimentos: "",
    provas_numeros: "",
    provas_cases: "",
    cta: "",
    cta_custom: "",
    paginas: ["home", "contato"] as string[],
    estilo: "",
  });

  const updateForm = (key: string, value: any) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const toggleArray = (key: string, value: string) =>
    setForm(prev => {
      const arr = prev[key] as string[];
      return { ...prev, [key]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] };
    });

  // Auto-injected data
  const strategyAnswers = activeStrategy?.answers || {};
  const viPalette = visualIdentity?.palette?.map(c => c.hex).join(", ");
  const viFonts = visualIdentity?.fonts?.join(", ");
  const viStyle = visualIdentity?.style;
  const approvedContents = (contents || []).filter(c => c.status === "approved");

  // ── GENERATE
  const handleGenerate = useCallback(async () => {
    if (!orgId) return;
    setGenerating(true);
    setGenProgress(10);

    const interval = setInterval(() => {
      setGenProgress(p => Math.min(p + Math.random() * 15, 90));
    }, 800);

    try {
      const paginasSelecionadas = (form.paginas as string[]).join(", ");
      const tipoSite = (form.paginas as string[]).length <= 1 ? "lp"
        : (form.paginas as string[]).length <= 3 ? "3pages"
        : (form.paginas as string[]).length <= 5 ? "5pages" : "8pages";

      const body = {
        tipo: tipoSite,
        objetivo: form.objetivo,
        estilo: form.estilo,
        cta_principal: form.cta === "outro" ? form.cta_custom : form.cta,
        nome_empresa: strategyAnswers.empresa || "",
        slogan: "",
        descricao_negocio: form.descricao_manual || strategyAnswers.empresa || "",
        segmento: form.tipo_negocio,
        servicos: form.servicos,
        diferencial: form.diferenciais,
        faixa_preco: "",
        publico_alvo: [...(form.publico_chips as string[]), form.publico_custom].filter(Boolean).join(", "),
        faixa_etaria: "",
        dores: strategyAnswers.problema || "",
        depoimentos: form.provas_depoimentos,
        numeros_impacto: form.provas_numeros,
        logos_clientes: "",
        cores_principais: viPalette || "",
        fontes_preferidas: viFonts || "",
        tom_comunicacao: visualIdentity?.tone || "",
        referencia_visual: form.referencia || "",
        telefone: "",
        email_contato: "",
        endereco: "",
        redes_sociais: "",
        link_whatsapp: "",
        instrucoes_adicionais: `Páginas: ${paginasSelecionadas}. Cases: ${form.provas_cases || "N/A"}`,
        persona: null,
        identidade_visual: visualIdentity ? { paleta: viPalette, fontes: viFonts, estilo: viStyle, tom_visual: visualIdentity.tone } : null,
        estrategia: strategyAnswers,
        organization_id: orgId,
      };

      const { data, error } = await supabase.functions.invoke("generate-site", { body });
      clearInterval(interval);

      if (error || data?.error) {
        toast({ title: "Erro ao gerar site", description: data?.error || "Tente novamente.", variant: "destructive" });
        setGenerating(false);
        setGenProgress(0);
        return;
      }

      setGenProgress(100);
      setGeneratedHtml(data.html);
      setShowPreview(true);

      createSiteMutation.mutate({
        name: `Site ${form.objetivo || "Novo"} — ${new Date().toLocaleDateString("pt-BR")}`,
        type: (form.paginas as string[]).length <= 1 ? "lp" : "site",
        html: data.html,
        strategy_id: activeStrategy?.id,
      });

      toast({ title: "Site gerado com sucesso!" });
    } catch (err) {
      console.error(err);
      clearInterval(interval);
      toast({ title: "Erro inesperado", variant: "destructive" });
    } finally {
      setGenerating(false);
      setGenProgress(0);
    }
  }, [form, orgId, strategyAnswers, viPalette, viFonts, viStyle, visualIdentity, createSiteMutation]);

  const resetWizard = () => {
    setShowPreview(false);
    setGeneratedHtml("");
    setCreating(false);
    setStepIdx(0);
    setForm({
      referencia: "", descricao_manual: "", tipo_negocio: "", objetivo: "",
      publico_chips: [], publico_custom: "", servicos: "", diferenciais: "",
      provas: [], provas_depoimentos: "", provas_numeros: "", provas_cases: "",
      cta: "", cta_custom: "", paginas: ["home", "contato"], estilo: "",
    });
  };

  // ── PREVIEW VIEW
  if (showPreview && generatedHtml) {
    return (
      <div className="w-full space-y-6">
        <PageHeader title="Preview do Site" subtitle="Revise, aprove e baixe o código" icon={<Globe className="w-5 h-5 text-primary" />} />
        <SitePreview
          html={generatedHtml}
          onRegenerate={handleGenerate}
          onEditBriefing={() => { setShowPreview(false); }}
          generating={generating}
        />
        <Button variant="ghost" className="text-xs" onClick={resetWizard}>
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Voltar ao início
        </Button>
      </div>
    );
  }

  // ── WIZARD VIEW
  if (creating) {
    const currentStep = STEPS[stepIdx];
    const isLast = stepIdx === STEPS.length - 1;
    const StepIcon = currentStep.icon;

    return (
      <div className="w-full space-y-6">
        <PageHeader title="Criar Novo Site" subtitle={`Etapa ${stepIdx + 1} de ${STEPS.length} — ${currentStep.label}`} icon={<Globe className="w-5 h-5 text-primary" />} />

        {/* Progress */}
        <Progress value={((stepIdx + 1) / STEPS.length) * 100} className="h-2" />

        {/* Step indicators */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {STEPS.map((s, i) => (
            <button key={s.id} onClick={() => i <= stepIdx && setStepIdx(i)}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-all ${
                i === stepIdx ? "bg-primary text-primary-foreground" :
                i < stepIdx ? "bg-primary/20 text-primary cursor-pointer" :
                "bg-muted text-muted-foreground"
              }`}>
              <s.icon className="w-3 h-3" /> {s.label}
            </button>
          ))}
        </div>

        {/* Generating overlay */}
        {generating && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="py-5 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
              <p className="text-sm font-bold">Gerando seu site com IA...</p>
              <p className="text-[11px] text-muted-foreground">Isso pode levar até 30 segundos</p>
              <Progress value={genProgress} className="h-2" />
            </CardContent>
          </Card>
        )}

        {!generating && (
          <Card>
            <CardContent className="py-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <StepIcon className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-sm font-bold">{currentStep.label}</h3>
              </div>

              {/* ── Step Content ── */}
              {currentStep.id === "referencia" && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">Cole o link do seu site atual ou Instagram para a IA entender sua identidade.</p>
                  <Input placeholder="https://instagram.com/suaempresa ou https://seusite.com.br" value={form.referencia} onChange={e => updateForm("referencia", e.target.value)} />
                  <p className="text-xs text-muted-foreground">Ou descreva manualmente:</p>
                  <Textarea placeholder="Descreva o visual, estilo e posicionamento da sua empresa..." value={form.descricao_manual} onChange={e => updateForm("descricao_manual", e.target.value)} rows={3} />
                  {viStyle && <AutoBadge label="Estilo da Identidade Visual" value={viStyle} />}
                  {viPalette && <AutoBadge label="Cores" value={viPalette} />}
                </div>
              )}

              {currentStep.id === "tipo_negocio" && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">Qual é o tipo de negócio da empresa?</p>
                  <div className="grid grid-cols-2 gap-2">
                    {TIPO_NEGOCIO_OPTIONS.map(o => (
                      <button key={o.value} onClick={() => updateForm("tipo_negocio", o.value)}
                        className={`p-3 rounded-xl border-2 text-left text-xs font-medium transition-all ${
                          form.tipo_negocio === o.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                        }`}>{o.label}</button>
                    ))}
                  </div>
                  {strategyAnswers.segmento && <AutoBadge label="Da Estratégia" value={strategyAnswers.segmento} />}
                </div>
              )}

              {currentStep.id === "objetivo" && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">Qual é o principal objetivo deste site?</p>
                  <div className="grid grid-cols-2 gap-2">
                    {OBJETIVO_OPTIONS.map(o => (
                      <button key={o.value} onClick={() => updateForm("objetivo", o.value)}
                        className={`p-3 rounded-xl border-2 text-left text-xs font-medium transition-all ${
                          form.objetivo === o.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                        }`}>{o.label}</button>
                    ))}
                  </div>
                  {strategyAnswers.objetivo && <AutoBadge label="Objetivo da Estratégia" value={strategyAnswers.objetivo} />}
                </div>
              )}

              {currentStep.id === "publico" && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">Para quem o site é direcionado?</p>
                  <ChipSelect options={PUBLICO_CHIPS} selected={form.publico_chips} onToggle={v => toggleArray("publico_chips", v)} />
                  <Input placeholder="Outro público..." value={form.publico_custom} onChange={e => updateForm("publico_custom", e.target.value)} />
                  {strategyAnswers.publico && <AutoBadge label="Da Estratégia" value={strategyAnswers.publico} />}
                </div>
              )}

              {currentStep.id === "servicos" && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">Quais são os principais serviços ou produtos da empresa?</p>
                  <Textarea placeholder="Liste seus serviços ou produtos principais..." value={form.servicos} onChange={e => updateForm("servicos", e.target.value)} rows={4} />
                  {strategyAnswers.produto && <AutoBadge label="Da Estratégia" value={strategyAnswers.produto} />}
                </div>
              )}

              {currentStep.id === "diferenciais" && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">O que torna sua empresa diferente dos concorrentes?</p>
                  <Textarea placeholder="Ex: Metodologia própria, tecnologia exclusiva, experiência no mercado..." value={form.diferenciais} onChange={e => updateForm("diferenciais", e.target.value)} rows={4} />
                  {strategyAnswers.diferencial && <AutoBadge label="Da Estratégia" value={strategyAnswers.diferencial} />}
                </div>
              )}

              {currentStep.id === "provas" && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">Você possui algum desses elementos de prova social?</p>
                  <ChipSelect options={PROVA_OPTIONS} selected={form.provas} onToggle={v => toggleArray("provas", v)} />
                  {(form.provas as string[]).includes("depoimentos") && (
                    <Textarea placeholder="Cole os depoimentos de clientes..." value={form.provas_depoimentos} onChange={e => updateForm("provas_depoimentos", e.target.value)} rows={3} />
                  )}
                  {(form.provas as string[]).includes("numeros") && (
                    <Input placeholder="Ex: 500+ clientes, 98% satisfação, 10 anos no mercado" value={form.provas_numeros} onChange={e => updateForm("provas_numeros", e.target.value)} />
                  )}
                  {(form.provas as string[]).includes("cases") && (
                    <Textarea placeholder="Descreva brevemente seus cases de sucesso..." value={form.provas_cases} onChange={e => updateForm("provas_cases", e.target.value)} rows={3} />
                  )}
                </div>
              )}

              {currentStep.id === "cta" && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">O que você quer que o visitante faça no site?</p>
                  <ChipSelect options={CTA_OPTIONS} selected={form.cta ? [form.cta] : []}
                    onToggle={v => updateForm("cta", form.cta === v ? "" : v)} multi={false} />
                  <button onClick={() => updateForm("cta", "outro")}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      form.cta === "outro" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:border-primary/50"
                    }`}>Personalizado...</button>
                  {form.cta === "outro" && (
                    <Input placeholder="Ex: Agende uma demonstração" value={form.cta_custom} onChange={e => updateForm("cta_custom", e.target.value)} />
                  )}
                </div>
              )}

              {currentStep.id === "paginas" && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">Quais páginas o site deve ter?</p>
                  <ChipSelect options={PAGINA_OPTIONS} selected={form.paginas} onToggle={v => toggleArray("paginas", v)} />
                  <p className="text-[10px] text-muted-foreground">
                    {(form.paginas as string[]).length} página(s) selecionada(s)
                  </p>
                </div>
              )}

              {currentStep.id === "estilo" && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">Como você gostaria que o visual do site fosse?</p>
                  <div className="grid grid-cols-2 gap-2">
                    {ESTILO_OPTIONS.map(o => (
                      <button key={o.value} onClick={() => updateForm("estilo", o.value)}
                        className={`p-3 rounded-xl border-2 text-left text-xs font-medium transition-all ${
                          form.estilo === o.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                        }`}>{o.label}</button>
                    ))}
                  </div>
                  {viStyle && <AutoBadge label="Da Identidade Visual" value={viStyle} />}
                  {viFonts && <AutoBadge label="Fontes" value={viFonts} />}
                </div>
              )}

              {/* Auto-injected content summary */}
              {approvedContents.length > 0 && (currentStep.id === "servicos" || currentStep.id === "diferenciais") && (
                <div className="border-t pt-3 mt-2">
                  <p className="text-[10px] text-muted-foreground font-medium mb-1">📝 Conteúdos aprovados disponíveis ({approvedContents.length})</p>
                  <div className="flex gap-1 flex-wrap">
                    {approvedContents.slice(0, 3).map(c => (
                      <Badge key={c.id} variant="outline" className="text-[9px]">{c.title}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        {!generating && (
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => stepIdx > 0 ? setStepIdx(s => s - 1) : resetWizard()} className="flex-1 gap-1">
              <ArrowLeft className="w-4 h-4" /> {stepIdx > 0 ? "Anterior" : "Cancelar"}
            </Button>
            {isLast ? (
              <Button onClick={handleGenerate} className="flex-1 gap-1" disabled={!form.estilo}>
                <Sparkles className="w-4 h-4" /> Gerar Site
              </Button>
            ) : (
              <Button onClick={() => setStepIdx(s => s + 1)} className="flex-1 gap-1">
                Próximo <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── MAIN VIEW
  return (
    <div className="w-full space-y-6">
      <PageHeader title="Sites & Landing Pages" subtitle="Gere sites profissionais com IA e publique no seu domínio" icon={<Globe className="w-5 h-5 text-primary" />} />
      <UsageQuotaBanner used={sites.length} limit={maxSites} label="sites ativos" planName={plan?.name ?? "Starter"} />
      <Button className="w-full gap-2" size="lg" onClick={() => setCreating(true)} disabled={sites.length >= maxSites}>
        <Sparkles className="w-4 h-4" /> Criar Novo Site
      </Button>
      <div>
        <p className="section-label mb-3">HISTÓRICO DE SITES</p>
        <SiteHistory sites={sites} onPreview={(site) => {
          if (site.html) { setGeneratedHtml(site.html); setShowPreview(true); setCreating(true); }
        }} />
      </div>
    </div>
  );
}
