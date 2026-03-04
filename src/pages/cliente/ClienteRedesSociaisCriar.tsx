import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Check, Sparkles, Image, Layers, PenTool,
  Link2, LayoutTemplate, Target, TrendingUp, Users, BookOpen, Award,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useVisualIdentity } from "@/hooks/useVisualIdentity";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { TemplateSelector, ART_TEMPLATES } from "@/components/cliente/ArtTemplates";
import { InstagramMockup } from "@/components/cliente/InstagramMockup";

/* ── Constants ── */
const FORMATS = [
  { id: "feed", label: "Feed", ratio: "1:1", desc: "1080×1080px", icon: "⬜", w: 1080, h: 1080 },
  { id: "story", label: "Story", ratio: "9:16", desc: "1080×1920px", icon: "📱", w: 1080, h: 1920 },
  { id: "carrossel", label: "Carrossel", ratio: "1:1", desc: "Até 10 slides", icon: "📑", w: 1080, h: 1080 },
  { id: "portrait", label: "Portrait", ratio: "4:5", desc: "1080×1350px", icon: "🖼️", w: 1080, h: 1350 },
];

const SOCIAL_FILTERS = ["Todos", "Instagram", "Facebook", "LinkedIn"];

const MODES = [
  { id: "zero", label: "Criar do Zero", desc: "A IA gera tudo com base no seu briefing", icon: PenTool },
  { id: "link", label: "A partir de Link", desc: "Cole uma URL e a IA extrai o conteúdo", icon: Link2 },
  { id: "template", label: "A partir de Template", desc: "Escolha um dos 6 padrões de design", icon: LayoutTemplate },
];

const OBJECTIVES = [
  { id: "alcance", label: "Alcance", icon: TrendingUp },
  { id: "vender", label: "Vender", icon: Target },
  { id: "engajar", label: "Engajar", icon: Users },
  { id: "educar", label: "Educar", icon: BookOpen },
  { id: "autoridade", label: "Autoridade", icon: Award },
];

const STEPS = [
  { num: 1, label: "Formato" },
  { num: 2, label: "Modo" },
  { num: 3, label: "Criar" },
];

const loadingPhrases = [
  "Analisando briefing...",
  "Criando conceitos visuais...",
  "Gerando prompts otimizados...",
  "Aplicando identidade visual...",
  "Renderizando arte...",
  "Finalizando composição...",
];

/* ── Stepper ── */
function Stepper({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 w-full max-w-md mx-auto">
      {STEPS.map((s, i) => (
        <div key={s.num} className="flex items-center flex-1">
          <div className="flex flex-col items-center gap-1.5">
            <div className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 border-2",
              current > s.num
                ? "bg-primary border-primary text-primary-foreground"
                : current === s.num
                ? "bg-primary/10 border-primary text-primary"
                : "bg-muted border-border text-muted-foreground"
            )}>
              {current > s.num ? <Check className="w-4 h-4" /> : s.num}
            </div>
            <span className={cn("text-[11px] font-medium", current >= s.num ? "text-foreground" : "text-muted-foreground")}>{s.label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={cn("flex-1 h-0.5 mx-2 mb-5 transition-colors", current > s.num ? "bg-primary" : "bg-border")} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Main Page ── */
export default function ClienteRedesSociaisCriar() {
  const navigate = useNavigate();
  const { data: orgId } = useUserOrgId();
  const { data: visualIdentity } = useVisualIdentity();

  const [step, setStep] = useState(1);

  // Step 1
  const [selectedFormat, setSelectedFormat] = useState("");
  const [socialFilter, setSocialFilter] = useState("Todos");

  // Step 2
  const [selectedMode, setSelectedMode] = useState("");
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // Step 3
  const [titulo, setTitulo] = useState("");
  const [subtitulo, setSubtitulo] = useState("");
  const [cta, setCta] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [briefingExtra, setBriefingExtra] = useState("");

  // Generation
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingPhrase, setLoadingPhrase] = useState(0);
  const [result, setResult] = useState<{ imageUrl: string; caption: string; hashtags: string[] } | null>(null);
  const [resultCaption, setResultCaption] = useState("");

  useEffect(() => {
    if (!isGenerating) return;
    const interval = setInterval(() => setLoadingPhrase(p => (p + 1) % loadingPhrases.length), 2500);
    return () => clearInterval(interval);
  }, [isGenerating]);

  const canNext = () => {
    if (step === 1) return !!selectedFormat;
    if (step === 2) {
      if (!selectedMode) return false;
      if (selectedMode === "template" && !selectedTemplateId) return false;
      return true;
    }
    return true;
  };

  const getIdentidadeVisual = () => ({
    paleta: visualIdentity?.palette?.map(c => c.hex).join(", ") || "",
    estilo: visualIdentity?.style || "",
    tom_visual: visualIdentity?.tone || "",
    fontes: (visualIdentity?.fonts || []).join(", "),
    referencias: (visualIdentity?.reference_links || []).join(", "),
  });

  const handleGenerate = async () => {
    if (!orgId) return;
    setIsGenerating(true);

    const identidade_visual = getIdentidadeVisual();
    const fmt = FORMATS.find(f => f.id === selectedFormat);
    const objectives = selectedObjectives.join(", ");

    try {
      if (selectedMode === "template" && selectedTemplateId) {
        // Template-based generation — use generate-template-layout
        const template = ART_TEMPLATES.find(t => t.id === selectedTemplateId);
        if (!template) throw new Error("Template não encontrado");

        const brandColors = visualIdentity?.palette?.map(c => c.hex) || ["#E63946"];

        // First generate a background image
        const bgPrompt = `Professional ${template.name} style background for social media. ${briefingExtra || titulo}. Style: ${identidade_visual.estilo || "modern professional"}`;
        const { data: bgData } = await supabase.functions.invoke("generate-social-image", {
          body: {
            prompt: bgPrompt,
            format: selectedFormat === "story" ? "story" : "feed",
            file_path: `${Date.now()}/template-bg.png`,
            nivel: "elaborado",
            identidade_visual,
            organization_id: orgId,
            reference_images: visualIdentity?.image_bank_urls?.slice(0, 2),
          },
        });

        // Now generate with the template layout
        const { data: layoutData } = await supabase.functions.invoke("generate-template-layout", {
          body: {
            template_style: selectedTemplateId,
            titulo: titulo || "Título do Post",
            subtitulo: subtitulo || "",
            cta: cta || "Saiba Mais",
            format: selectedFormat === "story" ? "story" : "feed",
            brand_colors: brandColors,
            logo_url: visualIdentity?.logo_url || undefined,
            identidade_visual,
            organization_id: orgId,
            background_image_url: bgData?.url,
          },
        });

        const imageUrl = layoutData?.url || bgData?.url;
        const generatedCaption = layoutData?.caption || `${titulo}\n\n${subtitulo}`;
        const generatedHashtags = layoutData?.hashtags || objectives.split(", ").filter(Boolean);

        setResult({ imageUrl: imageUrl || "/placeholder.svg", caption: generatedCaption, hashtags: generatedHashtags });
        setResultCaption(generatedCaption);
      } else {
        // Zero / Link mode — use standard concepts + image
        let prompt = titulo || briefingExtra || "Post profissional para redes sociais";
        if (selectedMode === "link" && linkUrl) {
          prompt = `Extraia o conteúdo da URL ${linkUrl} e crie um post visual profissional. ${briefingExtra}`;
        }
        if (subtitulo) prompt += `. ${subtitulo}`;
        if (objectives) prompt += `. Objetivo: ${objectives}`;

        const { data: imgData } = await supabase.functions.invoke("generate-social-image", {
          body: {
            prompt,
            format: selectedFormat === "story" ? "story" : "feed",
            file_path: `${Date.now()}/art-${selectedFormat}.png`,
            nivel: "elaborado",
            identidade_visual,
            organization_id: orgId,
            art_style: "grafica_moderna",
            reference_images: visualIdentity?.image_bank_urls?.slice(0, 3),
          },
        });

        const generatedCaption = `${titulo || "Novo post"}\n\n${subtitulo || ""}${cta ? `\n\n${cta}` : ""}`;
        const generatedHashtags = selectedObjectives.length ? selectedObjectives : ["marketing", "design"];

        setResult({ imageUrl: imgData?.url || "/placeholder.svg", caption: generatedCaption, hashtags: generatedHashtags });
        setResultCaption(generatedCaption);
      }

      toast({ title: "Arte gerada com sucesso!" });
    } catch (err: any) {
      console.error("Generation error:", err);
      toast({ title: "Erro ao gerar", description: err?.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = () => {
    if (!result?.imageUrl) return;
    const link = document.createElement("a");
    link.href = result.imageUrl;
    link.download = `arte-${selectedFormat}.png`;
    link.target = "_blank";
    link.click();
  };

  // ── Render ──
  return (
    <div className="w-full space-y-6 animate-[page-enter_0.4s_cubic-bezier(0.4,0,0.2,1)]">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/cliente/redes-sociais")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Nova Criação</h1>
          <p className="text-sm text-muted-foreground">Crie artes profissionais em 3 passos</p>
        </div>
      </div>

      <Stepper current={step} />

      <AnimatePresence mode="wait">
        {/* ═══ STEP 1: FORMATO ═══ */}
        {step === 1 && !result && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
            <div className="text-center">
              <h2 className="text-lg font-bold">Escolha o Formato</h2>
              <p className="text-sm text-muted-foreground">Selecione o formato da sua arte</p>
            </div>

            {/* Social filter chips */}
            <div className="flex justify-center gap-2 flex-wrap">
              {SOCIAL_FILTERS.map(f => (
                <button
                  key={f}
                  onClick={() => setSocialFilter(f)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                    socialFilter === f ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Format grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
              {FORMATS.map(f => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFormat(f.id)}
                  className={cn(
                    "relative rounded-xl border-2 p-4 text-center transition-all duration-200 group",
                    selectedFormat === f.id
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border hover:border-primary/40 hover:shadow-md"
                  )}
                >
                  <div className={cn(
                    "mx-auto mb-3 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-2xl",
                    f.id === "story" ? "w-10 h-16" : f.id === "portrait" ? "w-12 h-14" : "w-14 h-14"
                  )}>
                    {f.icon}
                  </div>
                  <p className="text-sm font-semibold">{f.label}</p>
                  <p className="text-[11px] text-muted-foreground">{f.ratio} • {f.desc}</p>
                  {selectedFormat === f.id && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ═══ STEP 2: MODO ═══ */}
        {step === 2 && !result && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
            <div className="text-center">
              <h2 className="text-lg font-bold">Escolha o Modo</h2>
              <p className="text-sm text-muted-foreground">Como você quer criar sua arte?</p>
            </div>

            {/* Mode cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-3xl mx-auto">
              {MODES.map(m => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => { setSelectedMode(m.id); if (m.id !== "template") setSelectedTemplateId(null); }}
                    className={cn(
                      "relative rounded-xl border-2 p-5 text-left transition-all duration-200",
                      selectedMode === m.id
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border hover:border-primary/40 hover:shadow-md"
                    )}
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <p className="text-sm font-bold">{m.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{m.desc}</p>
                    {selectedMode === m.id && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Template selector (only when mode=template) */}
            {selectedMode === "template" && (
              <div className="max-w-3xl mx-auto space-y-3">
                <h3 className="text-sm font-semibold">Selecione um Template</h3>
                <TemplateSelector selectedId={selectedTemplateId} onSelect={setSelectedTemplateId} />
              </div>
            )}

            {/* Objective chips */}
            <div className="max-w-3xl mx-auto space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Objetivo do post (opcional)</p>
              <div className="flex flex-wrap gap-2">
                {OBJECTIVES.map(o => {
                  const Icon = o.icon;
                  const active = selectedObjectives.includes(o.id);
                  return (
                    <button
                      key={o.id}
                      onClick={() => setSelectedObjectives(prev => active ? prev.filter(x => x !== o.id) : [...prev, o.id])}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                        active ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"
                      )}
                    >
                      <Icon className="w-3 h-3" /> {o.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══ STEP 3: CRIAR ═══ */}
        {step === 3 && !result && (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5 max-w-2xl mx-auto">
            <div className="text-center">
              <h2 className="text-lg font-bold">Preencha o Briefing</h2>
              <p className="text-sm text-muted-foreground">
                {selectedMode === "link" ? "Cole a URL e a IA faz o resto" : selectedMode === "template" ? "Personalize o template escolhido" : "Diga à IA o que você quer criar"}
              </p>
            </div>

            {selectedMode === "link" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">URL do conteúdo</Label>
                <Input
                  value={linkUrl}
                  onChange={e => setLinkUrl(e.target.value)}
                  placeholder="https://exemplo.com/artigo"
                  type="url"
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Título principal</Label>
                <Input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: 20% OFF em Março" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Subtítulo</Label>
                <Input value={subtitulo} onChange={e => setSubtitulo(e.target.value)} placeholder="Ex: Aproveite esta oferta exclusiva" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">CTA (Call to Action)</Label>
              <Input value={cta} onChange={e => setCta(e.target.value)} placeholder="Ex: Saiba Mais, Compre Agora" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Contexto adicional (opcional)</Label>
              <Textarea
                value={briefingExtra}
                onChange={e => setBriefingExtra(e.target.value)}
                rows={3}
                placeholder="Descreva detalhes como produto, público-alvo, estilo desejado..."
              />
            </div>

            {selectedMode === "template" && selectedTemplateId && (
              <Card className="border-primary/20 bg-primary/[0.03]">
                <CardContent className="py-3 flex items-center gap-3">
                  <LayoutTemplate className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <p className="text-xs font-semibold">Template: {ART_TEMPLATES.find(t => t.id === selectedTemplateId)?.name}</p>
                    <p className="text-[11px] text-muted-foreground">{ART_TEMPLATES.find(t => t.id === selectedTemplateId)?.description}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button className="w-full h-12 gap-2 text-sm font-bold" onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {loadingPhrases[loadingPhrase]}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Gerar Arte com IA
                </>
              )}
            </Button>
          </motion.div>
        )}

        {/* ═══ RESULT: Instagram Mockup ═══ */}
        {result && (
          <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <div className="text-center">
              <h2 className="text-lg font-bold flex items-center justify-center gap-2">
                <Check className="w-5 h-5 text-green-500" /> Arte Gerada!
              </h2>
              <p className="text-sm text-muted-foreground">Revise, edite a legenda e publique</p>
            </div>

            <InstagramMockup
              imageUrl={result.imageUrl}
              caption={resultCaption}
              hashtags={result.hashtags}
              profileName={visualIdentity?.style ? visualIdentity.style.toLowerCase().replace(/\s+/g, "_") : "sua_marca"}
              profileImage={visualIdentity?.logo_url || undefined}
              onCaptionChange={setResultCaption}
              onDownload={downloadImage}
              onRefine={() => {
                setResult(null);
                toast({ title: "Ajuste o briefing e gere novamente" });
              }}
              onSchedule={() => toast({ title: "Agendamento", description: "Funcionalidade em breve!" })}
              onNewPost={() => {
                setResult(null);
                setStep(1);
                setSelectedFormat("");
                setSelectedMode("");
                setTitulo("");
                setSubtitulo("");
                setCta("");
                setLinkUrl("");
                setBriefingExtra("");
                setSelectedTemplateId(null);
                setSelectedObjectives([]);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Navigation ── */}
      {!result && (
        <div className="flex items-center justify-between max-w-2xl mx-auto pt-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={() => step === 1 ? navigate("/cliente/redes-sociais") : setStep(s => s - 1)}
          >
            <ArrowLeft className="w-4 h-4" /> {step === 1 ? "Voltar" : "Anterior"}
          </Button>

          {step < 3 ? (
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => setStep(s => s + 1)}
              disabled={!canNext()}
            >
              Próximo <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <div /> // Generate button is inline in step 3
          )}
        </div>
      )}
    </div>
  );
}
