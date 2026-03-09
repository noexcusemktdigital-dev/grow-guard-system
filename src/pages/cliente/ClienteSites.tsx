import { useState, useCallback, useMemo } from "react";
import {
  Globe, Sparkles, ArrowLeft, ArrowRight, Loader2,
  Briefcase, Target, Users, Package, Award,
  MessageSquareQuote, MousePointerClick, Layout, Palette,
  Check, Info, Building2, Phone, Eye,
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
import { getEffectiveLimits } from "@/constants/plans";
import { SitePreview } from "@/components/sites/SitePreview";
import { SiteHistory, type SavedSite } from "@/components/sites/SiteHistory";
import { useClienteSitesDB, useCreateClientSite } from "@/hooks/useClienteSitesDB";
import { useActiveStrategy } from "@/hooks/useMarketingStrategy";
import { useContentHistory } from "@/hooks/useClienteContentV2";
import { useVisualIdentity } from "@/hooks/useVisualIdentity";
import { useUserOrgId } from "@/hooks/useUserOrgId";

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

const SEGMENTO_OPTIONS = [
  { value: "consultoria", label: "Consultoria" },
  { value: "servicos", label: "Empresa de Serviços" },
  { value: "clinica", label: "Clínica / Saúde" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "franquia", label: "Franquia" },
  { value: "educacao", label: "Educação" },
  { value: "tecnologia", label: "Tecnologia" },
];

const OBJETIVO_OPTIONS = [
  { value: "gerar_leads", label: "Gerar Leads", desc: "Formulários e captação de contatos" },
  { value: "institucional", label: "Institucional", desc: "Apresentar a empresa e equipe" },
  { value: "vender_produtos", label: "Vendas", desc: "Foco em conversão e compra" },
  { value: "portfolio", label: "Portfólio", desc: "Mostrar trabalhos e cases" },
];

const PUBLICO_CHIPS = [
  "Empresários", "Executivos C-Level", "Gestores de Marketing",
  "Profissionais de Saúde", "Profissionais Liberais", "Consumidores Finais",
  "PMEs", "Startups", "Produtores Rurais", "Estudantes",
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
  { value: "moderno", label: "Moderno e Clean", desc: "Minimalismo sofisticado, espaço em branco, tipografia sans-serif" },
  { value: "corporativo", label: "Corporativo", desc: "Tons sóbrios, layout clássico, tipografia serifada" },
  { value: "ousado", label: "Ousado e Colorido", desc: "Cores vibrantes, gradientes, impactante" },
  { value: "minimalista", label: "Minimalista", desc: "Essencial, poucos elementos, elegante" },
  { value: "sofisticado", label: "Sofisticado / Premium", desc: "Dark mode, dourado, luxuoso" },
  { value: "tecnologico", label: "Tecnológico", desc: "Futurista, neon, grids geométricos" },
];

const TOM_OPTIONS = [
  { value: "formal", label: "Formal", desc: "Linguagem profissional e vocabulário técnico" },
  { value: "descontraido", label: "Descontraído", desc: "Linguagem leve e próxima do leitor" },
  { value: "tecnico", label: "Técnico", desc: "Foco em dados, especificações e autoridade" },
  { value: "inspiracional", label: "Inspiracional", desc: "Frases de impacto e storytelling emocional" },
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

/* ═══ REVIEW QUALITY BAR ═══ */

function QualityBar({ filled, total }: { filled: number; total: number }) {
  const pct = Math.round((filled / total) * 100);
  const color = pct >= 80 ? "text-green-500" : pct >= 50 ? "text-yellow-500" : "text-destructive";
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-[11px] font-medium text-muted-foreground">Qualidade do briefing</span>
        <span className={`text-xs font-bold ${color}`}>{pct}%</span>
      </div>
      <Progress value={pct} className="h-2" />
      <p className="text-[10px] text-muted-foreground">
        {pct >= 80 ? "Excelente! O site será bem direcionado." : pct >= 50 ? "Bom, mas campos adicionais melhoram o resultado." : "Preencha mais campos para um site de qualidade."}
      </p>
    </div>
  );
}

/* ═══ MAIN COMPONENT ═══ */

export default function ClienteSites() {
  const { data: subscription } = useClienteSubscription();
  const limits = getEffectiveLimits(subscription?.plan, subscription?.status === "trial");
  const maxSites = limits.maxSites || 9999;
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

  // Auto-fill on first open
  const autoFilled = useState(false);
  if (creating && !autoFilled[0]) {
    autoFilled[1](true);
    setForm(prev => ({
      ...prev,
      nome_empresa: prev.nome_empresa || strategyAnswers.empresa || "",
      segmento: prev.segmento || strategyAnswers.segmento || "",
      descricao_negocio: prev.descricao_negocio || strategyAnswers.descricao || "",
      tom: prev.tom || visualIdentity?.tone || "",
      estilo: prev.estilo || viStyle || "",
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
        faixa_preco: "",
        publico_alvo: [...(form.publico_chips as string[]), form.publico_custom].filter(Boolean).join(", "),
        faixa_etaria: "",
        dores: form.dores || strategyAnswers.problema || "",
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
        name: `${form.nome_empresa} — ${form.objetivo || "Site"} — ${new Date().toLocaleDateString("pt-BR")}`,
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
  }, [form, orgId, strategyAnswers, viPalette, viFonts, viStyle, visualIdentity, whatsappLink, createSiteMutation, activeStrategy]);

  const resetWizard = () => {
    setShowPreview(false);
    setGeneratedHtml("");
    setCreating(false);
    setStepIdx(0);
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

              {/* ── Step 1: Empresa ── */}
              {currentStep.id === "empresa" && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">Informações básicas da sua empresa para personalizar o site.</p>
                  <div>
                    <label className="text-[11px] font-medium text-foreground">Nome da empresa *</label>
                    <Input placeholder="Ex: Agência NoExcuse" value={form.nome_empresa} onChange={e => updateForm("nome_empresa", e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-foreground">Slogan / Tagline</label>
                    <Input placeholder="Ex: Transformando negócios com marketing inteligente" value={form.slogan} onChange={e => updateForm("slogan", e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-foreground">Descrição do negócio</label>
                    <Textarea placeholder="Descreva o que sua empresa faz. Esse texto será usado na seção 'Sobre' do site." value={form.descricao_negocio} onChange={e => updateForm("descricao_negocio", e.target.value)} rows={3} className="mt-1" />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-foreground">Segmento</label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      {SEGMENTO_OPTIONS.map(o => (
                        <button key={o.value} onClick={() => updateForm("segmento", o.value)}
                          className={`p-2.5 rounded-xl border-2 text-left text-xs font-medium transition-all ${
                            form.segmento === o.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                          }`}>{o.label}</button>
                      ))}
                    </div>
                  </div>
                  {strategyAnswers.empresa && <AutoBadge label="Da Estratégia" value={strategyAnswers.empresa} />}
                </div>
              )}

              {/* ── Step 2: Objetivo ── */}
              {currentStep.id === "objetivo" && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">Qual é o principal objetivo deste site?</p>
                  <div className="grid grid-cols-2 gap-2">
                    {OBJETIVO_OPTIONS.map(o => (
                      <button key={o.value} onClick={() => updateForm("objetivo", o.value)}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                          form.objetivo === o.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                        }`}>
                        <p className="text-xs font-bold">{o.label}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{o.desc}</p>
                      </button>
                    ))}
                  </div>
                  {strategyAnswers.objetivo && <AutoBadge label="Objetivo da Estratégia" value={strategyAnswers.objetivo} />}
                </div>
              )}

              {/* ── Step 3: Público ── */}
              {currentStep.id === "publico" && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">Para quem o site é direcionado?</p>
                  <ChipSelect options={PUBLICO_CHIPS} selected={form.publico_chips} onToggle={v => toggleArray("publico_chips", v)} />
                  <Input placeholder="Outro público..." value={form.publico_custom} onChange={e => updateForm("publico_custom", e.target.value)} />
                  <div>
                    <label className="text-[11px] font-medium text-foreground">Principais dores / problemas do público</label>
                    <Textarea placeholder="Ex: Dificuldade em gerar leads qualificados, processos desorganizados, falta de presença digital..." value={form.dores} onChange={e => updateForm("dores", e.target.value)} rows={3} className="mt-1" />
                  </div>
                  {strategyAnswers.publico && <AutoBadge label="Da Estratégia" value={strategyAnswers.publico} />}
                  {strategyAnswers.problema && <AutoBadge label="Problema da Estratégia" value={strategyAnswers.problema} />}
                </div>
              )}

              {/* ── Step 4: Serviços & Diferenciais ── */}
              {currentStep.id === "servicos" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Quais são os principais serviços ou produtos?</p>
                    <Textarea placeholder="Liste seus serviços ou produtos principais..." value={form.servicos} onChange={e => updateForm("servicos", e.target.value)} rows={3} />
                    {strategyAnswers.produto && <AutoBadge label="Da Estratégia" value={strategyAnswers.produto} />}
                  </div>
                  <div className="border-t pt-3 space-y-2">
                    <p className="text-xs text-muted-foreground">O que torna sua empresa diferente?</p>
                    <Textarea placeholder="Ex: Metodologia própria, tecnologia exclusiva, experiência de 15 anos..." value={form.diferenciais} onChange={e => updateForm("diferenciais", e.target.value)} rows={3} />
                    {strategyAnswers.diferencial && <AutoBadge label="Da Estratégia" value={strategyAnswers.diferencial} />}
                  </div>
                  {approvedContents.length > 0 && (
                    <div className="border-t pt-3">
                      <p className="text-[10px] text-muted-foreground font-medium mb-1">📝 Conteúdos aprovados disponíveis ({approvedContents.length})</p>
                      <div className="flex gap-1 flex-wrap">
                        {approvedContents.slice(0, 3).map(c => (
                          <Badge key={c.id} variant="outline" className="text-[9px]">{c.title}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Step 5: Prova Social ── */}
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

              {/* ── Step 6: Contato ── */}
              {currentStep.id === "contato" && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">Dados de contato reais para o site. Sem isso, o site fica com formulário genérico.</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-medium text-foreground">Telefone</label>
                      <Input placeholder="(11) 99999-9999" value={form.telefone} onChange={e => updateForm("telefone", e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-foreground">WhatsApp</label>
                      <Input placeholder="(11) 99999-9999" value={form.whatsapp} onChange={e => updateForm("whatsapp", e.target.value)} className="mt-1" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-foreground">Email</label>
                    <Input placeholder="contato@empresa.com.br" value={form.email_contato} onChange={e => updateForm("email_contato", e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-foreground">Endereço</label>
                    <Input placeholder="Rua, número — Cidade/UF" value={form.endereco} onChange={e => updateForm("endereco", e.target.value)} className="mt-1" />
                  </div>
                  <div className="border-t pt-3">
                    <p className="text-[11px] font-medium text-foreground mb-2">Redes Sociais</p>
                    <div className="space-y-2">
                      <Input placeholder="@seuinstagram" value={form.instagram} onChange={e => updateForm("instagram", e.target.value)} />
                      <Input placeholder="facebook.com/suaempresa" value={form.facebook} onChange={e => updateForm("facebook", e.target.value)} />
                      <Input placeholder="linkedin.com/company/suaempresa" value={form.linkedin} onChange={e => updateForm("linkedin", e.target.value)} />
                    </div>
                  </div>
                  {whatsappLink && (
                    <div className="bg-primary/10 rounded-lg p-2 text-[11px] text-primary">
                      ✅ Link WhatsApp gerado: <span className="font-mono">{whatsappLink}</span>
                    </div>
                  )}
                </div>
              )}

              {/* ── Step 7: CTA ── */}
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
                  {whatsappLink && form.cta === "whatsapp" && (
                    <div className="bg-primary/10 rounded-lg p-2 text-[11px] text-primary">
                      ✅ O CTA usará o WhatsApp configurado no passo anterior
                    </div>
                  )}
                </div>
              )}

              {/* ── Step 8: Páginas ── */}
              {currentStep.id === "paginas" && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">Quais páginas o site deve ter?</p>
                  <ChipSelect options={PAGINA_OPTIONS} selected={form.paginas} onToggle={v => toggleArray("paginas", v)} />
                  <p className="text-[10px] text-muted-foreground">
                    {(form.paginas as string[]).length} página(s) selecionada(s) → Tipo: {
                      (form.paginas as string[]).length <= 1 ? "Landing Page" :
                      (form.paginas as string[]).length <= 3 ? "Site 3 Páginas" :
                      (form.paginas as string[]).length <= 5 ? "Site 5 Páginas" : "Site 8 Páginas"
                    }
                  </p>
                </div>
              )}

              {/* ── Step 9: Estilo & Tom ── */}
              {currentStep.id === "estilo" && (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Estilo visual do site</p>
                    <div className="grid grid-cols-2 gap-2">
                      {ESTILO_OPTIONS.map(o => (
                        <button key={o.value} onClick={() => updateForm("estilo", o.value)}
                          className={`p-3 rounded-xl border-2 text-left transition-all ${
                            form.estilo === o.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                          }`}>
                          <p className="text-xs font-bold">{o.label}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{o.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="border-t pt-3">
                    <p className="text-xs text-muted-foreground mb-2">Tom de comunicação</p>
                    <div className="grid grid-cols-2 gap-2">
                      {TOM_OPTIONS.map(o => (
                        <button key={o.value} onClick={() => updateForm("tom", o.value)}
                          className={`p-3 rounded-xl border-2 text-left transition-all ${
                            form.tom === o.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                          }`}>
                          <p className="text-xs font-bold">{o.label}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{o.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="border-t pt-3">
                    <label className="text-[11px] font-medium text-foreground">URL de referência visual (opcional)</label>
                    <Input placeholder="https://sitequeadmiro.com.br" value={form.referencia_url} onChange={e => updateForm("referencia_url", e.target.value)} className="mt-1" />
                  </div>
                  {viStyle && <AutoBadge label="Da Identidade Visual" value={viStyle} />}
                  {viPalette && <AutoBadge label="Cores" value={viPalette} />}
                  {viFonts && <AutoBadge label="Fontes" value={viFonts} />}
                </div>
              )}

              {/* ── Step 10: Revisão ── */}
              {currentStep.id === "revisao" && (
                <div className="space-y-4">
                  <QualityBar filled={qualityFields.filled} total={qualityFields.total} />
                  <div className="space-y-2">
                    {qualityFields.fields.map(f => (
                      <div key={f.label} className="flex items-center justify-between text-[11px] border-b border-border/50 pb-1">
                        <span className="text-muted-foreground">{f.label}</span>
                        {f.value ? (
                          <span className="text-foreground font-medium truncate max-w-[180px] text-right">{f.value}</span>
                        ) : (
                          <span className="text-destructive/60 italic">Não preenchido</span>
                        )}
                      </div>
                    ))}
                  </div>
                  {viPalette && <AutoBadge label="Cores da Identidade Visual" value={viPalette} />}
                  {viFonts && <AutoBadge label="Fontes" value={viFonts} />}
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
              <Button onClick={handleGenerate} className="flex-1 gap-1" disabled={!form.nome_empresa}>
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
      <UsageQuotaBanner used={sites.length} limit={maxSites} label="sites ativos" planName="Atual" />
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
