// @ts-nocheck
import { useState, useCallback, useMemo } from "react";
import { FeatureTutorialButton } from "@/components/cliente/FeatureTutorialButton";
import { AssessoriaPopup } from "@/components/shared/AssessoriaPopup";
import {
  Globe, Sparkles, ArrowLeft, ArrowRight, Loader2,
  Building2, Target, Users, Package,
  MessageSquareQuote, MousePointerClick, Palette,
  Phone, Eye, FileText, ShoppingCart, Briefcase, Link2,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { UsageQuotaBanner } from "@/components/quota/UsageQuotaBanner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { invokeEdge } from "@/lib/edge";
import { logger } from "@/lib/logger";
import { useClienteSubscription } from "@/hooks/useClienteSubscription";
import { getEffectiveLimits } from "@/constants/plans";
import { SitePreview } from "@/components/sites/SitePreview";
import { SiteHistory, type SavedSite } from "@/components/sites/SiteHistory";
import { SiteSectionEditor } from "@/components/sites/SiteSectionEditor";
import { useStrategyData } from "@/hooks/useStrategyData";
import { useClienteSitesDB, useCreateClientSite, useApproveSite, useUpdateSiteUrl } from "@/hooks/useClienteSitesDB";
import { useActiveStrategy } from "@/hooks/useMarketingStrategy";
import { useContentHistory } from "@/hooks/useClienteContentV2";
import { useVisualIdentity } from "@/hooks/useVisualIdentity";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { useClienteWallet } from "@/hooks/useClienteWallet";
import { InsufficientCreditsDialog } from "@/components/cliente/InsufficientCreditsDialog";
import { WizardStepContent, getStepsForType, SITE_TYPES } from "./ClienteSitesWizardSteps";
import { WizardProgress } from "@/components/ui/wizard-progress";

const STEP_ICONS: Record<string, any> = {
  tipo_site: Globe,
  empresa: Building2,
  publico: Users,
  servicos: Package,
  provas: MessageSquareQuote,
  contato: Phone,
  cta: MousePointerClick,
  estilo: Palette,
  revisao: Eye,
  oferta: FileText,
  equipe: Briefcase,
  produto_vendas: ShoppingCart,
  projetos: Globe,
  links_bio: Link2,
};

export default function ClienteSites() {
  const { data: subscription } = useClienteSubscription();
  const limits = getEffectiveLimits(subscription?.plan, subscription?.status === "trial");
  const maxSites = limits.maxSites;
  const { data: orgId } = useUserOrgId();

  const { data: dbSites } = useClienteSitesDB();
  const createSiteMutation = useCreateClientSite();
  const approveSiteMutation = useApproveSite();
  const updateSiteUrlMutation = useUpdateSiteUrl();
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
    url: s.url || undefined,
  }));

  // Wizard state
  const [creating, setCreating] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [showSectionEditor, setShowSectionEditor] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [currentSiteId, setCurrentSiteId] = useState<string | null>(null);
  const [currentSiteStatus, setCurrentSiteStatus] = useState<string>("Rascunho");
  const [currentSiteUrl, setCurrentSiteUrl] = useState<string>("");
  const [sectionEdits, setSectionEdits] = useState<Record<string, any>>({});

  // Form data
  const [form, setForm] = useState<Record<string, any>>({
    tipo_site: "",
    nome_empresa: "", slogan: "", descricao_negocio: "", segmento: "",
    objetivo: "",
    publico_chips: [] as string[], publico_custom: "", dores: "",
    servicos: "", diferenciais: "",
    provas: [] as string[], provas_depoimentos: "", provas_numeros: "", provas_cases: "",
    telefone: "", email_contato: "", whatsapp: "", endereco: "", instagram: "", facebook: "", linkedin: "",
    cta: "", cta_custom: "",
    estilo: "", tom: "", referencia_url: "",
    // Specific fields
    oferta_principal: "", lead_magnet: "", campos_formulario: "",
    historia_empresa: "", membros_equipe: "", missao_visao: "",
    produto_nome: "", produto_preco: "", produto_garantia: "", produto_urgencia: "",
    num_projetos: "", categorias_projetos: "", descricao_projetos: "",
    links_lista: "", redes_lista: "",
  });

  const updateForm = (key: string, value: string | boolean | number) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const toggleArray = (key: string, value: string) =>
    setForm(prev => {
      const arr = prev[key] as string[];
      return { ...prev, [key]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] };
    });

  // Dynamic steps based on site type
  const STEPS = useMemo(() => getStepsForType(form.tipo_site), [form.tipo_site]);

  // Auto-injected data
  const strategyAnswers = activeStrategy?.answers || {};
  const viPalette = visualIdentity?.palette?.map(c => c.hex).join(", ");
  const viFonts = visualIdentity?.fonts?.join(", ");
  const viStyle = visualIdentity?.style;
  const approvedContents = (contents || []).filter(c => c.status === "approved");

  // Auto-fill on first open
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

  // Quality calculation
  const qualityFields = useMemo(() => {
    const fields = [
      { label: "Tipo de site", value: form.tipo_site },
      { label: "Nome da empresa", value: form.nome_empresa },
      { label: "Slogan", value: form.slogan },
      { label: "Descrição do negócio", value: form.descricao_negocio },
      { label: "Segmento", value: form.segmento },
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

  const whatsappLink = useMemo(() => {
    const num = (form.whatsapp || form.telefone || "").replace(/\D/g, "");
    return num ? `https://wa.me/55${num}` : "";
  }, [form.whatsapp, form.telefone]);

  // ── GENERATE
  const handleGenerate = useCallback(async (editMode = false, editInstructions?: Record<string, any>) => {
    if (!orgId) return;
    if (!form.nome_empresa) {
      toast({ title: "Nome da empresa é obrigatório", variant: "destructive" });
      return;
    }

    if (!editMode && wallet && wallet.balance < SITE_CREDIT_COST) {
      setShowCreditsDialog(true);
      return;
    }

    setGenerating(true);
    setGenProgress(10);

    const interval = setInterval(() => {
      setGenProgress(p => Math.min(p + Math.random() * 15, 90));
    }, 800);

    try {
      const siteType = SITE_TYPES.find(t => t.id === form.tipo_site);
      const redesSociais = [
        form.instagram && `Instagram: ${form.instagram}`,
        form.facebook && `Facebook: ${form.facebook}`,
        form.linkedin && `LinkedIn: ${form.linkedin}`,
      ].filter(Boolean).join(", ");

      const body: Record<string, any> = {
        tipo: form.tipo_site || "lp",
        objetivo: form.tipo_site === "landing_page" ? "gerar_leads" : form.tipo_site === "vendas" ? "vender_produtos" : form.tipo_site === "institucional" ? "institucional" : form.tipo_site === "portfolio" ? "portfolio" : "gerar_leads",
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
        sections: siteType?.sections || ["hero", "sobre", "servicos", "contato", "footer"],
        instrucoes_adicionais: buildInstrucoesAdicionais(),
        persona: strategy.icp ? { nome: strategy.personaName, descricao: strategy.publicoAlvo } : null,
        identidade_visual: visualIdentity ? { paleta: viPalette, fontes: viFonts, estilo: viStyle, tom_visual: visualIdentity.tone } : null,
        estrategia: strategyAnswers,
        organization_id: orgId,
        logo_url: visualIdentity?.logo_url || "",
      };

      // Edit mode
      if (editMode && editInstructions) {
        body.edit_mode = true;
        body.current_html = generatedHtml;
        body.edit_instructions = editInstructions;
      }

      const { data, error } = await invokeEdge("generate-site", { body });
      clearInterval(interval);

      if (error) {
        // Extract real error from edge function response
        let errorMsg = "Tente novamente.";
        let errorCode = "";
        try {
          const ctx = (error as { context?: unknown })?.context;
          if (ctx instanceof Response) {
            const body = await ctx.json().catch(() => null);
            errorMsg = body?.error || error.message || errorMsg;
            errorCode = body?.code || "";
          } else {
            errorMsg = error.message || errorMsg;
          }
        } catch { /* ignore */ }
        
        const isCredits = errorCode === "INSUFFICIENT_CREDITS" || errorMsg.includes("Créditos insuficientes");
        if (isCredits) {
          setShowCreditsDialog(true);
        } else {
          toast({ title: "Erro ao gerar site", description: errorMsg, variant: "destructive" });
        }
        setGenerating(false);
        setGenProgress(0);
        return;
      }

      if (data?.error) {
        const isCredits = data.code === "INSUFFICIENT_CREDITS" || data.error?.includes("Créditos insuficientes");
        if (isCredits) {
          setShowCreditsDialog(true);
        } else {
          toast({ title: "Erro ao gerar site", description: data.error, variant: "destructive" });
        }
        setGenerating(false);
        setGenProgress(0);
        return;
      }

      setGenProgress(100);
      setGeneratedHtml(data.html);
      setShowPreview(true);
      setShowSectionEditor(true);
      setCurrentSiteStatus("Rascunho");
      setSectionEdits({});

      if (!editMode) {
        createSiteMutation.mutate({
          name: `${form.nome_empresa} — ${siteType?.label || "Site"} — ${new Date().toLocaleDateString("pt-BR")}`,
          type: form.tipo_site || "lp",
          html: data.html,
          strategy_id: activeStrategy?.id,
        }, {
          onSuccess: (created: Record<string, unknown>) => {
            if (created?.id) setCurrentSiteId(created.id as string);
          },
        });
        toast({ title: "Site gerado com sucesso!", description: `${SITE_CREDIT_COST} créditos foram utilizados.` });
      } else {
        toast({ title: "Site atualizado!", description: "As alterações foram aplicadas sem custo." });
      }
    } catch (err) {
      console.error("Erro ao gerar site:", err);
      clearInterval(interval);
      toast({ title: "Erro inesperado", variant: "destructive" });
    } finally {
      setGenerating(false);
      setGenProgress(0);
    }
  }, [form, orgId, strategyAnswers, viPalette, viFonts, viStyle, visualIdentity, whatsappLink, createSiteMutation, activeStrategy, wallet, generatedHtml]);

  function buildInstrucoesAdicionais() {
    const parts: string[] = [];
    if (form.oferta_principal) parts.push(`Oferta principal: ${form.oferta_principal}`);
    if (form.lead_magnet) parts.push(`Lead magnet: ${form.lead_magnet}`);
    if (form.campos_formulario) parts.push(`Campos do formulário: ${form.campos_formulario}`);
    if (form.historia_empresa) parts.push(`História: ${form.historia_empresa}`);
    if (form.membros_equipe) parts.push(`Equipe: ${form.membros_equipe}`);
    if (form.missao_visao) parts.push(`Missão/Visão/Valores: ${form.missao_visao}`);
    if (form.produto_nome) parts.push(`Produto: ${form.produto_nome}`);
    if (form.produto_preco) parts.push(`Preço: ${form.produto_preco}`);
    if (form.produto_garantia) parts.push(`Garantia: ${form.produto_garantia}`);
    if (form.produto_urgencia) parts.push(`Urgência: ${form.produto_urgencia}`);
    if (form.num_projetos) parts.push(`Projetos para destacar: ${form.num_projetos}`);
    if (form.categorias_projetos) parts.push(`Categorias: ${form.categorias_projetos}`);
    if (form.descricao_projetos) parts.push(`Projetos: ${form.descricao_projetos}`);
    if (form.links_lista) parts.push(`Links: ${form.links_lista}`);
    if (form.redes_lista) parts.push(`Redes: ${form.redes_lista}`);
    if (form.provas_cases) parts.push(`Cases: ${form.provas_cases}`);
    return parts.join(". ");
  }

  // ── PUBLISH (upload to Storage)
  const handlePublish = useCallback(async () => {
    if (!orgId || !currentSiteId || !generatedHtml) return;
    try {
      const filePath = `sites/${orgId}/${currentSiteId}/index.html`;
      const blob = new Blob([generatedHtml], { type: "text/html" });
      const file = new File([blob], "index.html", { type: "text/html" });

      const { error: uploadError } = await supabase.storage
        .from("marketing-assets")
        .upload(filePath, file, { upsert: true, contentType: "text/html" });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("marketing-assets")
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      setCurrentSiteUrl(publicUrl);

      updateSiteUrlMutation.mutate({ siteId: currentSiteId, url: publicUrl });
      setCurrentSiteStatus("Publicado");

      toast({ title: "Site publicado!", description: "Link público gerado com sucesso." });
    } catch (err) {
      console.error("Erro ao publicar:", err);
      toast({ title: "Erro ao publicar", description: "Tente novamente.", variant: "destructive" });
    }
  }, [orgId, currentSiteId, generatedHtml, updateSiteUrlMutation]);

  const resetWizard = () => {
    setShowPreview(false);
    setShowSectionEditor(false);
    setGeneratedHtml("");
    setCreating(false);
    setStepIdx(0);
    setCurrentSiteId(null);
    setCurrentSiteStatus("Rascunho");
    setCurrentSiteUrl("");
    setSectionEdits({});
    autoFilled[1](false);
    setForm({
      tipo_site: "", nome_empresa: "", slogan: "", descricao_negocio: "", segmento: "",
      objetivo: "",
      publico_chips: [], publico_custom: "", dores: "",
      servicos: "", diferenciais: "",
      provas: [], provas_depoimentos: "", provas_numeros: "", provas_cases: "",
      telefone: "", email_contato: "", whatsapp: "", endereco: "", instagram: "", facebook: "", linkedin: "",
      cta: "", cta_custom: "",
      estilo: "", tom: "", referencia_url: "",
      oferta_principal: "", lead_magnet: "", campos_formulario: "",
      historia_empresa: "", membros_equipe: "", missao_visao: "",
      produto_nome: "", produto_preco: "", produto_garantia: "", produto_urgencia: "",
      num_projetos: "", categorias_projetos: "", descricao_projetos: "",
      links_lista: "", redes_lista: "",
    });
  };

  // ── PREVIEW VIEW (with section editor)
  if (showPreview && generatedHtml) {
    return (
      <div className="w-full space-y-6">
        <PageHeader title="Preview do Site" subtitle="Revise por seção, edite e aprove" icon={<Globe className="w-5 h-5 text-primary" />} />

        <SitePreview
          html={generatedHtml}
          siteId={currentSiteId || undefined}
          siteStatus={currentSiteStatus}
          siteUrl={currentSiteUrl}
          onRegenerate={() => handleGenerate(false)}
          onEditBriefing={() => { setShowPreview(false); setShowSectionEditor(false); }}
          onApprove={() => {
            if (currentSiteId) {
              approveSiteMutation.mutate(currentSiteId);
              setCurrentSiteStatus("Aprovado");
            }
          }}
          onPublish={handlePublish}
          generating={generating}
        />

        {/* Section editor - shown before approval */}
        {showSectionEditor && currentSiteStatus === "Rascunho" && (
          <SiteSectionEditor
            html={generatedHtml}
            edits={sectionEdits}
            onEditsChange={setSectionEdits}
            onRegenerate={() => handleGenerate(true, sectionEdits)}
            onApprove={() => {
              if (currentSiteId) {
                approveSiteMutation.mutate(currentSiteId);
                setCurrentSiteStatus("Aprovado");
                setShowSectionEditor(false);
                toast({ title: "Site aprovado!", description: "Agora você pode publicar e compartilhar o link." });
              }
            }}
            regenerating={generating}
          />
        )}

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
    const StepIcon = STEP_ICONS[currentStep?.id] || Globe;

    // Block advancing from type selection without choosing
    const canAdvance = currentStep?.id !== "tipo_site" || !!form.tipo_site;

    return (
      <div className="w-full space-y-6">
        <PageHeader title="Criar Novo Site" subtitle={`Etapa ${stepIdx + 1} de ${STEPS.length} — ${currentStep?.label}`} icon={<Globe className="w-5 h-5 text-primary" />} />

        <Progress value={((stepIdx + 1) / STEPS.length) * 100} className="h-2" />

        <WizardProgress
          steps={STEPS.map(s => s.label)}
          currentStep={stepIdx}
          className="mb-2"
        />

        <div className="flex gap-1 overflow-x-auto pb-1">
          {STEPS.map((s, i) => {
            const SIcon = STEP_ICONS[s.id] || Globe;
            return (
              <button key={s.id} onClick={() => i <= stepIdx && setStepIdx(i)}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-all ${
                  i === stepIdx ? "bg-primary text-primary-foreground" :
                  i < stepIdx ? "bg-primary/20 text-primary cursor-pointer" :
                  "bg-muted text-muted-foreground"
                }`}>
                <SIcon className="w-3 h-3" /> {s.label}
              </button>
            );
          })}
        </div>

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
                <h3 className="text-sm font-bold">{currentStep?.label}</h3>
              </div>

              <WizardStepContent
                stepId={currentStep?.id}
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

        {!generating && (
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => stepIdx > 0 ? setStepIdx(s => s - 1) : resetWizard()} className="flex-1 gap-1">
              <ArrowLeft className="w-4 h-4" /> {stepIdx > 0 ? "Anterior" : "Cancelar"}
            </Button>
            {isLast ? (
              <Button onClick={() => handleGenerate(false)} className="flex-1 gap-1" disabled={!form.nome_empresa}>
                <Sparkles className="w-4 h-4" /> Gerar Site ({SITE_CREDIT_COST} créditos)
              </Button>
            ) : (
              <Button onClick={() => setStepIdx(s => s + 1)} className="flex-1 gap-1" disabled={!canAdvance}>
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
      <AssessoriaPopup storageKey="noexcuse_popup_sites_v1" servico="Criação de Sites" />
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
              setCurrentSiteUrl(site.url || "");
              setShowPreview(true);
              setCreating(true);
              setShowSectionEditor(site.status === "Rascunho");
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
