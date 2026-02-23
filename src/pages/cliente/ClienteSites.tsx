import { useState, useEffect, useCallback } from "react";
import {
  Globe, Sparkles, ArrowRight, ArrowLeft, Loader2,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useClienteSubscription } from "@/hooks/useClienteSubscription";
import { getPlanBySlug } from "@/constants/plans";
import { SiteWizardStep1 } from "@/components/sites/SiteWizardStep1";
import { SiteWizardStep2 } from "@/components/sites/SiteWizardStep2";
import { SiteWizardStep3 } from "@/components/sites/SiteWizardStep3";
import { SitePreview } from "@/components/sites/SitePreview";
import { SiteHistory, type SavedSite } from "@/components/sites/SiteHistory";

const STORAGE_KEY = "client-sites";
const STEP_LABELS = ["Tipo de Site", "Objetivo e Estilo", "Briefing", "Gerar Site"];

function loadSites(): SavedSite[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch { return []; }
}

function loadStrategy(): Record<string, any> | null {
  try {
    const raw = localStorage.getItem("estrategia_data");
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export default function ClienteSites() {
  const { data: subscription } = useClienteSubscription();
  const plan = getPlanBySlug(subscription?.plan);
  const allowedTypes = plan?.siteTypes || ["lp"];
  const maxSites = plan?.maxSites || 1;

  const [step, setStep] = useState(0);
  const [creating, setCreating] = useState(false);
  const [sites, setSites] = useState<SavedSite[]>(loadSites);
  const [generating, setGenerating] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState("");
  const [genProgress, setGenProgress] = useState(0);

  // Step 1
  const [siteType, setSiteType] = useState("");
  // Step 2
  const [objetivo, setObjetivo] = useState("");
  const [estilo, setEstilo] = useState("");
  const [cta, setCta] = useState("");
  // Step 3 briefing
  const [briefing, setBriefing] = useState({
    servicos: "",
    diferencial: "",
    depoimentos: "",
    contato: "",
    instrucoes: "",
    estrategia: null as Record<string, any> | null,
    persona: null as { nome: string; descricao: string } | null,
    identidade: null as { paleta: string; fontes: string; estilo: string; tom_visual: string } | null,
  });

  // Load auto data when entering step 3
  useEffect(() => {
    if (step === 2) {
      const estrategia = loadStrategy();
      setBriefing((prev) => ({
        ...prev,
        estrategia,
        servicos: prev.servicos || "",
        diferencial: prev.diferencial || (estrategia?.diferencial as string) || "",
      }));
    }
  }, [step]);

  const canProceed = useCallback(() => {
    if (step === 0) return !!siteType;
    if (step === 1) return !!objetivo && !!estilo;
    if (step === 2) return true;
    return false;
  }, [step, siteType, objetivo, estilo]);

  const handleGenerate = async () => {
    setGenerating(true);
    setGenProgress(10);

    const interval = setInterval(() => {
      setGenProgress((p) => Math.min(p + Math.random() * 15, 90));
    }, 800);

    try {
      const body = {
        tipo: siteType,
        objetivo,
        estilo,
        cta_principal: cta,
        persona: briefing.persona,
        identidade_visual: briefing.identidade,
        servicos: briefing.servicos,
        diferencial: briefing.diferencial,
        depoimentos: briefing.depoimentos,
        contato: briefing.contato,
        instrucoes_adicionais: briefing.instrucoes,
        estrategia: briefing.estrategia,
      };

      const { data, error } = await supabase.functions.invoke("generate-site", { body });

      clearInterval(interval);

      if (error) {
        console.error("generate-site error:", error);
        toast({ title: "Erro ao gerar site", description: "Tente novamente em alguns instantes.", variant: "destructive" });
        setGenerating(false);
        setGenProgress(0);
        return;
      }

      if (data?.error) {
        toast({ title: "Erro", description: data.error, variant: "destructive" });
        setGenerating(false);
        setGenProgress(0);
        return;
      }

      setGenProgress(100);
      setGeneratedHtml(data.html);
      setStep(3);

      // Save to history
      const newSite: SavedSite = {
        id: crypto.randomUUID(),
        name: `Site ${objetivo} — ${new Date().toLocaleDateString("pt-BR")}`,
        type: siteType,
        status: "Rascunho",
        createdAt: new Date().toISOString().split("T")[0],
        html: data.html,
      };
      const updated = [newSite, ...sites];
      setSites(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      toast({ title: "Site gerado com sucesso!", description: "Revise o preview e baixe quando estiver pronto." });
    } catch (err) {
      console.error(err);
      clearInterval(interval);
      toast({ title: "Erro inesperado", description: "Tente novamente.", variant: "destructive" });
    } finally {
      setGenerating(false);
      setGenProgress(0);
    }
  };

  const handlePreviewHistory = (site: SavedSite) => {
    if (site.html) {
      setGeneratedHtml(site.html);
      setStep(3);
      setCreating(true);
    }
  };

  const resetWizard = () => {
    setStep(0);
    setSiteType("");
    setObjetivo("");
    setEstilo("");
    setCta("");
    setGeneratedHtml("");
    setCreating(false);
  };

  // ── MAIN VIEW (history + create button)
  if (!creating && step !== 3) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <PageHeader
          title="Sites & Landing Pages"
          subtitle="Gere sites profissionais com IA e publique no seu domínio"
          icon={<Globe className="w-5 h-5 text-primary" />}
        />

        <Button className="w-full gap-2" size="lg" onClick={() => setCreating(true)} disabled={sites.length >= maxSites}>
          <Sparkles className="w-4 h-4" /> Criar Novo Site
        </Button>

        <div>
          <p className="section-label mb-3">HISTÓRICO DE SITES</p>
          <SiteHistory sites={sites} onPreview={handlePreviewHistory} />
        </div>
      </div>
    );
  }

  // ── PREVIEW VIEW (step 3)
  if (step === 3 && generatedHtml) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <PageHeader
          title="Preview do Site"
          subtitle="Revise, aprove e baixe o código para publicar"
          icon={<Globe className="w-5 h-5 text-primary" />}
        />
        <SitePreview
          html={generatedHtml}
          onRegenerate={handleGenerate}
          onEditBriefing={() => setStep(2)}
          generating={generating}
        />
        <Button variant="ghost" className="text-xs" onClick={resetWizard}>
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Voltar ao início
        </Button>
      </div>
    );
  }

  // ── WIZARD VIEW (steps 0-2)
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Criar Novo Site"
        subtitle={STEP_LABELS[step]}
        icon={<Globe className="w-5 h-5 text-primary" />}
      />

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEP_LABELS.slice(0, 3).map((label, i) => (
          <div key={i} className="flex-1">
            <div className={`h-1.5 rounded-full transition-all ${i <= step ? "bg-primary" : "bg-muted"}`} />
            <p className={`text-[9px] mt-1 ${i <= step ? "text-foreground font-medium" : "text-muted-foreground"}`}>{label}</p>
          </div>
        ))}
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {step === 0 && (
            <SiteWizardStep1
              selected={siteType}
              onSelect={setSiteType}
              allowedTypes={allowedTypes}
              activeSites={sites.length}
              maxSites={maxSites}
            />
          )}
          {step === 1 && (
            <SiteWizardStep2
              objetivo={objetivo}
              estilo={estilo}
              cta={cta}
              onObjetivo={setObjetivo}
              onEstilo={setEstilo}
              onCta={setCta}
            />
          )}
          {step === 2 && (
            <SiteWizardStep3
              data={briefing}
              onChange={(field, value) => setBriefing((prev) => ({ ...prev, [field]: value }))}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Generating state */}
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

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs gap-1"
          onClick={() => step === 0 ? resetWizard() : setStep(step - 1)}
        >
          <ArrowLeft className="w-3.5 h-3.5" /> {step === 0 ? "Cancelar" : "Voltar"}
        </Button>

        {step < 2 ? (
          <Button size="sm" className="gap-1 text-xs" onClick={() => setStep(step + 1)} disabled={!canProceed()}>
            Próximo <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        ) : (
          <Button size="sm" className="gap-1 text-xs" onClick={handleGenerate} disabled={generating}>
            <Sparkles className="w-3.5 h-3.5" /> Gerar Site com IA
          </Button>
        )}
      </div>
    </div>
  );
}
