import { useState, useCallback, useMemo } from "react";
import { FeatureTutorialButton } from "@/components/cliente/FeatureTutorialButton";
import {
  Globe, Sparkles, ArrowLeft, ArrowRight, Loader2,
  Briefcase, Target, Users, Package, Award,
  MessageSquareQuote, MousePointerClick, Layout, Palette,
  Building2, Phone, Eye,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { UsageQuotaBanner } from "@/components/quota/UsageQuotaBanner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useClienteSubscription } from "@/hooks/useClienteSubscription";
import { getEffectiveLimits } from "@/constants/plans";
import { SitePreview } from "@/components/sites/SitePreview";
import { SiteHistory, type SavedSite } from "@/components/sites/SiteHistory";
import { useStrategyData } from "@/hooks/useStrategyData";
import { useClienteSitesDB, useCreateClientSite, useApproveSite } from "@/hooks/useClienteSitesDB";
import { useActiveStrategy } from "@/hooks/useMarketingStrategy";
import { useContentHistory } from "@/hooks/useClienteContentV2";
import { useVisualIdentity } from "@/hooks/useVisualIdentity";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { useClienteWallet } from "@/hooks/useClienteWallet";
import { InsufficientCreditsDialog } from "@/components/cliente/InsufficientCreditsDialog";
import { WizardStepContent } from "./ClienteSitesWizardSteps";

/* ═══ WIZARD CONFIG ═══ */

const STEPS = [
  { id: "empresa", label: "Empresa", icon: Building2 },
  { id: "objetivo", label: "Objetivo", icon: Target },
  { id: "publico", label: "Público-alvo", icon: Users },
  { id: "servicos", label: "Serviços & Diferenciais", icon: Package },
  { id: "provas", label: "Prova Social", icon: MessageSquareQuote },
  { id: "contato", label: "Contato", icon: Phone },
  { id: "cta", label: "CTA", icon: MousePointerClick },
  { id: "paginas", label: "Páginas", icon: Layout },
  { id: "estilo", label: "Estilo & Tom", icon: Palette },
  { id: "revisao", label: "Revisão", icon: Eye },
] as const;

/* ═══ MAIN COMPONENT ═══ */

export default function ClienteSites() {
  const { data: subscription } = useClienteSubscription();
  const limits = getEffectiveLimits(subscription?.plan, subscription?.status === "trial");
  const maxSites = limits.maxSites;
  const { data: orgId } = useUserOrgId();

  const { data: dbSites } = useClienteSitesDB();
  const createSiteMutation = useCreateClientSite();
  const approveSiteMutation = useApproveSite();
  const { data: activeStrategy } = useActiveStrategy();
  const { data: contents } = useContentHistory();
  const { data: visualIdentity } = useVisualIdentity();
  const { data: wallet } = useClienteWallet();
  const strategy = useStrategyData();

  const [showCreditsDialog, setShowCreditsDialog] = useState(false);
  const SITE_CREDIT_COST = 100;

  const sites: SavedSite[] = (dbSites || []).map(s => ({
    id: s.id,
    name: s.name,
    type: s.type || "lp",
    status: s.status as "Rascunho" | "Aprovado" | "Publicado",
    createdAt: s.created_at.split("T")[0],
    html: (s.content as unknown as { html?: string } | null)?.html || "",
  }));

  // Wizard state
  const [creating, setCreating] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [currentSiteId, setCurrentSiteId] = useState<string | null>(null);
  const [currentSiteStatus, setCurrentSiteStatus] = useState<string>("Rascunho");

  // Form data
  const [form, setForm] = useState<Record<string, any>>({
    // Step 1 — Empresa
    nome_empresa: "",
    slogan: "",
    descricao_negocio: "",
    segmento: "",
    // Step 2 — Objetivo
    objetivo: "",
    // Step 3 — Público
    publico_chips: [] as string[],
    publico_custom: "",
    dores: "",
    // Step 4 — Serviços & Diferenciais
    servicos: "",
    diferenciais: "",
    // Step 5 — Prova Social
    provas: [] as string[],
    provas_depoimentos: "",
    provas_numeros: "",
    provas_cases: "",
    // Step 6 — Contato
    telefone: "",
    email_contato: "",
    whatsapp: "",
    endereco: "",
    instagram: "",
    facebook: "",
    linkedin: "",
    // Step 7 — CTA
    cta: "",
    cta_custom: "",
    // Step 8 — Páginas
    paginas: ["home", "contato"] as string[],
    // Step 9 — Estilo & Tom
    estilo: "",
    tom: "",
    referencia_url: "",
  });

  const updateForm = (key: string, value: string | boolean | number) =>
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

  // Auto-fill on first open with rich strategy + visual identity data
  const autoFilled = useState(false);
  if (creating && !autoFilled[0]) {
    autoFilled[1](true);
    setForm(prev => ({
      ...prev,
      nome_empresa: prev.nome_empresa || strategyAnswers.empresa || "",
      segmento: prev.segmento || strategyAnswers.segmento || strategy.salesPlanSegmento || "",
      descricao_negocio: prev.descricao_negocio || strategyAnswers.descricao || "",
      tom: prev.tom || visualIdentity?.tone || strategy.tomPrincipal || "",
      estilo: prev.estilo || viStyle || "",
      servicos: prev.servicos || strategy.salesPlanProducts || strategyAnswers.produto || "",
      diferenciais: prev.diferenciais || strategy.salesPlanDiferenciais || strategyAnswers.diferencial || "",
      dores: prev.dores || strategy.salesPlanDorPrincipal || strategyAnswers.problema || "",
      publico_custom: prev.publico_custom || strategy.publicoAlvo || strategyAnswers.publico || "",
      slogan: prev.slogan || (strategy.propostaValor ? String(strategy.propostaValor) : "") || "",
    }));
  }

  // Quality calculation for review
  const qualityFields = useMemo(() => {
    const fields = [
      { label: "Nome da empresa", value: form.nome_empresa },
      { label: "Slogan", value: form.slogan },
      { label: "Descrição do negócio", value: form.descricao_negocio },
      { label: "Segmento", value: form.segmento },
      { label: "Objetivo", value: form.objetivo },
      { label: "Público-alvo", value: [...(form.publico_chips as string[]), form.publico_custom].filter(Boolean).join(", ") },
      { label: "Dores do público", value: form.dores },
      { label: "Serviços", value: form.servicos },
      { label: "Diferenciais", value: form.diferenciais },
      { label: "Prova Social", value: (form.provas as string[]).length > 0 ? "Sim" : "" },
      { label: "Telefone/WhatsApp", value: form.telefone || form.whatsapp },
      { label: "Email", value: form.email_contato },
      { label: "CTA", value: form.cta },
      { label: "Estilo visual", value: form.estilo },
      { label: "Tom de comunicação", value: form.tom },
    ];
    const filled = fields.filter(f => !!f.value).length;
    return { fields, filled, total: fields.length };
  }, [form]);

  // Link WhatsApp builder
  const whatsappLink = useMemo(() => {
    const num = (form.whatsapp || form.telefone || "").replace(/\D/g, "");
    return num ? `https://wa.me/55${num}` : "";
  }, [form.whatsapp, form.telefone]);

  // ── GENERATE
  const handleGenerate = useCallback(async () => {
    if (!orgId) return;
    if (!form.nome_empresa) {
      toast({ title: "Nome da empresa é obrigatório", variant: "destructive" });
      return;
    }

    // Pre-check credits
    if (wallet && wallet.balance < SITE_CREDIT_COST) {
      setShowCreditsDialog(true);
      return;
    }

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

      const redesSociais = [
        form.instagram && `Instagram: ${form.instagram}`,
        form.facebook && `Facebook: ${form.facebook}`,
        form.linkedin && `LinkedIn: ${form.linkedin}`,
      ].filter(Boolean).join(", ");

      const body = {
        tipo: tipoSite,
        objetivo: form.objetivo,
        estilo: form.estilo,
        cta_principal: form.cta === "outro" ? form.cta_custom : form.cta,
        nome_empresa: form.nome_empresa,
        slogan: form.slogan,
        descricao_negocio: form.descricao_negocio,
        segmento: form.segmento,
        servicos: form.servicos,
        diferencial: form.diferenciais,
        faixa_preco: strategy.salesPlanTicketMedio || "",
        publico_alvo: [...(form.publico_chips as string[]), form.publico_custom].filter(Boolean).join(", "),
        faixa_etaria: "",
        dores: form.dores || strategyAnswers.problema || strategy.salesPlanDorPrincipal || "",
        depoimentos: form.provas_depoimentos,
        numeros_impacto: form.provas_numeros,
        logos_clientes: "",
        cores_principais: viPalette || "",
        fontes_preferidas: viFonts || "",
        tom_comunicacao: form.tom,
        referencia_visual: form.referencia_url || "",
        telefone: form.telefone,
        email_contato: form.email_contato,
        endereco: form.endereco,
        redes_sociais: redesSociais,
        link_whatsapp: whatsappLink,
        instrucoes_adicionais: `Páginas: ${paginasSelecionadas}. Cases: ${form.provas_cases || "N/A"}`,
        persona: strategy.icp ? { nome: strategy.personaName, descricao: strategy.publicoAlvo } : null,
        identidade_visual: visualIdentity ? { paleta: viPalette, fontes: viFonts, estilo: viStyle, tom_visual: visualIdentity.tone } : null,
        estrategia: strategyAnswers,
        organization_id: orgId,
        logo_url: visualIdentity?.logo_url || "",
      };

      const { data, error } = await supabase.functions.invoke("generate-site", { body });
      clearInterval(interval);

      if (error || data?.error) {
        const isCredits = data?.code === "INSUFFICIENT_CREDITS" || data?.error?.includes("Créditos insuficientes");
        if (isCredits) {
          setShowCreditsDialog(true);
        } else {
          toast({ title: "Erro ao gerar site", description: data?.error || "Tente novamente.", variant: "destructive" });
        }
        setGenerating(false);
        setGenProgress(0);
        return;
      }

      setGenProgress(100);
      setGeneratedHtml(data.html);
      setShowPreview(true);
      setCurrentSiteStatus("Rascunho");

      createSiteMutation.mutate({
        name: `${form.nome_empresa} — ${form.objetivo || "Site"} — ${new Date().toLocaleDateString("pt-BR")}`,
        type: (form.paginas as string[]).length <= 1 ? "lp" : "site",
        html: data.html,
        strategy_id: activeStrategy?.id,
      }, {
        onSuccess: (created: Record<string, unknown>) => {
          if (created?.id) setCurrentSiteId(created.id);
        },
      });

      toast({ title: "Site gerado com sucesso!", description: `${SITE_CREDIT_COST} créditos foram utilizados.` });
    } catch (err) {
      logger.error("Erro inesperado ao gerar site:", err);
      clearInterval(interval);
      toast({ title: "Erro inesperado", variant: "destructive" });
    } finally {
      setGenerating(false);
      setGenProgress(0);
    }
  }, [form, orgId, strategyAnswers, viPalette, viFonts, viStyle, visualIdentity, whatsappLink, createSiteMutation, activeStrategy, wallet]);

  const resetWizard = () => {
    setShowPreview(false);
    setGeneratedHtml("");
    setCreating(false);
    setStepIdx(0);
    setCurrentSiteId(null);
    setCurrentSiteStatus("Rascunho");
    autoFilled[1](false);
    setForm({
      nome_empresa: "", slogan: "", descricao_negocio: "", segmento: "",
      objetivo: "",
      publico_chips: [], publico_custom: "", dores: "",
      servicos: "", diferenciais: "",
      provas: [], provas_depoimentos: "", provas_numeros: "", provas_cases: "",
      telefone: "", email_contato: "", whatsapp: "", endereco: "", instagram: "", facebook: "", linkedin: "",
      cta: "", cta_custom: "",
      paginas: ["home", "contato"],
      estilo: "", tom: "", referencia_url: "",
    });
  };

  // ── PREVIEW VIEW
  if (showPreview && generatedHtml) {
    return (
      <div className="w-full space-y-6">
        <PageHeader title="Preview do Site" subtitle="Revise, aprove e baixe o código" icon={<Globe className="w-5 h-5 text-primary" />} />
        <SitePreview
          html={generatedHtml}
          siteId={currentSiteId || undefined}
          siteStatus={currentSiteStatus}
          onRegenerate={handleGenerate}
          onEditBriefing={() => { setShowPreview(false); }}
          onApprove={() => {
            if (currentSiteId) {
              approveSiteMutation.mutate(currentSiteId);
              setCurrentSiteStatus("Aprovado");
            }
          }}
          generating={generating}
        />
        <Button variant="ghost" className="text-xs" onClick={resetWizard}>
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Voltar ao início
        </Button>
        <InsufficientCreditsDialog
          open={showCreditsDialog}
          onOpenChange={setShowCreditsDialog}
          actionLabel="gerar este site"
          creditCost={SITE_CREDIT_COST}
        />
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

              <WizardStepContent
                stepId={currentStep.id}
                form={form}
                updateForm={updateForm}
                toggleArray={toggleArray}
                strategyAnswers={strategyAnswers}
                approvedContents={approvedContents}
                viPalette={viPalette}
                viFonts={viFonts}
                viStyle={viStyle}
                whatsappLink={whatsappLink}
                qualityFields={qualityFields}
              />


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
              <Button onClick={handleGenerate} className="flex-1 gap-1" disabled={!form.nome_empresa}>
                <Sparkles className="w-4 h-4" /> Gerar Site ({SITE_CREDIT_COST} créditos)
              </Button>
            ) : (
              <Button onClick={() => setStepIdx(s => s + 1)} className="flex-1 gap-1">
                Próximo <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
        <InsufficientCreditsDialog
          open={showCreditsDialog}
          onOpenChange={setShowCreditsDialog}
          actionLabel="gerar este site"
          creditCost={SITE_CREDIT_COST}
        />
      </div>
    );
  }

  // ── MAIN VIEW
  return (
    <div className="w-full space-y-6">
      <PageHeader title="Sites & Landing Pages" subtitle="Gere sites profissionais com IA e publique no seu domínio" icon={<Globe className="w-5 h-5 text-primary" />} actions={<FeatureTutorialButton slug="sites" />} />


      <UsageQuotaBanner used={sites.length} limit={maxSites} label="sites ativos" planName="Atual" />
      <Button className="w-full gap-2" size="lg" onClick={() => setCreating(true)} disabled={sites.length >= maxSites}>
        <Sparkles className="w-4 h-4" /> Criar Novo Site
      </Button>
      <div>
        <p className="section-label mb-3">HISTÓRICO DE SITES</p>
        <SiteHistory
          sites={sites}
          onPreview={(site) => {
            if (site.html) {
              setGeneratedHtml(site.html);
              setCurrentSiteId(site.id);
              setCurrentSiteStatus(site.status);
              setShowPreview(true);
              setCreating(true);
            }
          }}
          onApprove={(site) => {
            approveSiteMutation.mutate(site.id);
          }}
        />
      </div>
    </div>
  );
}
