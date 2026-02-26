import { useState, useCallback } from "react";
import {
  Globe, Sparkles, ArrowLeft, Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { UsageQuotaBanner } from "@/components/quota/UsageQuotaBanner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useClienteSubscription } from "@/hooks/useClienteSubscription";
import { getPlanBySlug } from "@/constants/plans";
import { SitePreview } from "@/components/sites/SitePreview";
import { SiteHistory, type SavedSite } from "@/components/sites/SiteHistory";
import { ChatBriefing } from "@/components/cliente/ChatBriefing";
import { AGENTS, ALEX_STEPS } from "@/components/cliente/briefingAgents";

const STORAGE_KEY = "client-sites";

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
  const maxSites = plan?.maxSites || 1;

  const [creating, setCreating] = useState(false);
  const [sites, setSites] = useState<SavedSite[]>(loadSites);
  const [generating, setGenerating] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState("");
  const [genProgress, setGenProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  // Store answers from ChatBriefing for regeneration
  const [lastAnswers, setLastAnswers] = useState<Record<string, any>>({});

  const handleGenerate = useCallback(async (answers: Record<string, any>) => {
    setGenerating(true);
    setGenProgress(10);

    const interval = setInterval(() => {
      setGenProgress((p) => Math.min(p + Math.random() * 15, 90));
    }, 800);

    try {
      const estrategia = loadStrategy();
      const body = {
        tipo: answers.siteType || "lp",
        objetivo: answers.objetivo || "",
        estilo: answers.estilo || "",
        cta_principal: answers.cta || "",
        nome_empresa: answers.nomeEmpresa || "",
        slogan: answers.slogan || "",
        descricao_negocio: answers.descricaoNegocio || "",
        segmento: answers.segmento || "",
        servicos: answers.servicos || "",
        diferencial: answers.diferencial || "",
        faixa_preco: answers.faixaPreco || "",
        publico_alvo: answers.publicoAlvo || "",
        faixa_etaria: answers.faixaEtaria || "",
        dores: answers.dores || "",
        depoimentos: answers.depoimentos || "",
        numeros_impacto: answers.numerosImpacto || "",
        logos_clientes: "",
        cores_principais: answers.coresPrincipais || "",
        fontes_preferidas: answers.fontesPreferidas || "",
        tom_comunicacao: answers.tomComunicacao || "",
        referencia_visual: answers.referenciaVisual || "",
        telefone: answers.telefone || "",
        email_contato: answers.email || "",
        endereco: answers.endereco || "",
        redes_sociais: answers.redesSociais || "",
        link_whatsapp: answers.linkWhatsapp || "",
        instrucoes_adicionais: answers.instrucoes || "",
        persona: null,
        identidade_visual: null,
        estrategia,
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
      setShowPreview(true);

      // Save to history
      const newSite: SavedSite = {
        id: crypto.randomUUID(),
        name: `Site ${answers.objetivo || "Novo"} — ${new Date().toLocaleDateString("pt-BR")}`,
        type: answers.siteType || "lp",
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
  }, [sites]);

  const handleChatComplete = (answers: Record<string, any>) => {
    setLastAnswers(answers);
    handleGenerate(answers);
  };

  const handlePreviewHistory = (site: SavedSite) => {
    if (site.html) {
      setGeneratedHtml(site.html);
      setShowPreview(true);
      setCreating(true);
    }
  };

  const resetWizard = () => {
    setShowPreview(false);
    setGeneratedHtml("");
    setCreating(false);
    setLastAnswers({});
  };

  // ── PREVIEW VIEW
  if (showPreview && generatedHtml) {
    return (
      <div className="w-full space-y-6">
        <PageHeader
          title="Preview do Site"
          subtitle="Revise, aprove e baixe o código para publicar"
          icon={<Globe className="w-5 h-5 text-primary" />}
        />
        <SitePreview
          html={generatedHtml}
          onRegenerate={() => handleGenerate(lastAnswers)}
          onEditBriefing={() => { setShowPreview(false); setCreating(true); }}
          generating={generating}
        />
        <Button variant="ghost" className="text-xs" onClick={resetWizard}>
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Voltar ao início
        </Button>
      </div>
    );
  }

  // ── CREATING VIEW (ChatBriefing)
  if (creating) {
    return (
      <div className="w-full space-y-6">
        <PageHeader
          title="Criar Novo Site"
          subtitle="Converse com Alex, seu arquiteto web"
          icon={<Globe className="w-5 h-5 text-primary" />}
        />

        {/* Generating state overlay */}
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
          <ChatBriefing
            agent={AGENTS.alex}
            steps={ALEX_STEPS}
            onComplete={handleChatComplete}
            onCancel={resetWizard}
          />
        )}
      </div>
    );
  }

  // ── MAIN VIEW (history + create button)
  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="Sites & Landing Pages"
        subtitle="Gere sites profissionais com IA e publique no seu domínio"
        icon={<Globe className="w-5 h-5 text-primary" />}
      />

      <UsageQuotaBanner
        used={sites.length}
        limit={maxSites}
        label="sites ativos"
        planName={plan?.name ?? "Starter"}
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
