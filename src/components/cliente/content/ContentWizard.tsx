import { useState, useEffect } from "react";
import {
  ArrowLeft, ArrowRight, Sparkles, Video, Smartphone, Monitor, Film,
  Target, Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { motion, AnimatePresence } from "framer-motion";
import { FORMATOS, OBJETIVOS, PLATAFORMAS, DURACOES, loadingPhrases } from "./ContentTypes";

const ICON_MAP: Record<string, React.ElementType> = {
  Video, Monitor, Smartphone, Film,
};

const TOTAL_STEPS = 4;

const STORAGE_KEY = "roteiro-wizard-prefs";

interface WizardPrefs {
  plataforma?: string;
  objetivos?: string[];
}

function loadPrefs(): WizardPrefs {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch { return {}; }
}

function savePrefs(prefs: WizardPrefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

interface ContentWizardProps {
  quotaRemaining: number;
  quotaMax: number;
  creditBalance: number;
  costPerContent: number;
  hasStrategy: boolean;
  strategy: Record<string, unknown>;
  isGenerating: boolean;
  loadingIdx: number;
  quantidade: number;
  onGenerate: () => void;
  onQuantidadeChange: (v: number) => void;
  formatDist: Record<string, number>;
  onFormatDistChange: (dist: Record<string, number>) => void;
  objetivos: string[];
  onObjetivosChange: (obj: string[]) => void;
  tema: string;
  onTemaChange: (t: string) => void;
  plataforma: string;
  onPlataformaChange: (p: string) => void;
  duracao: string;
  onDuracaoChange: (d: string) => void;
}

export function ContentWizard({
  quotaRemaining, quotaMax, creditBalance, costPerContent, hasStrategy, strategy,
  isGenerating, loadingIdx, quantidade,
  onGenerate, onQuantidadeChange,
  formatDist, onFormatDistChange,
  objetivos, onObjetivosChange,
  tema, onTemaChange,
  plataforma, onPlataformaChange,
  duracao, onDuracaoChange,
}: ContentWizardProps) {
  const [step, setStep] = useState(1);

  useEffect(() => {
    const prefs = loadPrefs();
    if (prefs.plataforma && !hasStrategy) onPlataformaChange(prefs.plataforma);
    if (prefs.objetivos?.length) onObjetivosChange(prefs.objetivos);
  }, []);

  const formatTotal = Object.values(formatDist).reduce((a, b) => a + b, 0);

  const updateFormatDist = (fmt: string, val: number) => {
    const next = { ...formatDist };
    if (val <= 0) delete next[fmt]; else next[fmt] = val;
    onFormatDistChange(next);
  };

  const toggleObjetivo = (v: string) => {
    const next = objetivos.includes(v) ? objetivos.filter(x => x !== v) : [...objetivos, v];
    onObjetivosChange(next);
  };

  const canAdvance = () => {
    if (step === 1) return quantidade > 0 && quantidade <= quotaRemaining && formatTotal === quantidade;
    if (step === 2) return objetivos.length > 0;
    if (step === 3) return !!duracao;
    if (step === 4) return !!plataforma;
    return false;
  };

  const handleGenerate = () => {
    savePrefs({ plataforma, objetivos });
    onGenerate();
  };

  if (quotaRemaining <= 0) {
    return (
      <Card className="border-destructive">
        <CardContent className="py-6 text-center space-y-2">
          <p className="font-semibold text-destructive">Créditos insuficientes</p>
          <p className="text-sm text-muted-foreground">Você tem {creditBalance} créditos. Cada roteiro custa {costPerContent} créditos. Recarregue para continuar gerando.</p>
        </CardContent>
      </Card>
    );
  }

  if (isGenerating) {
    return (
      <Card>
        <CardContent className="py-16 text-center space-y-4">
          <div className="animate-spin mx-auto w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
          <p className="text-lg font-medium animate-pulse">{loadingPhrases[loadingIdx]}</p>
          <p className="text-sm text-muted-foreground">Gerando {quantidade} roteiros estratégicos...</p>
        </CardContent>
      </Card>
    );
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-1">Quantos roteiros e em quais formatos?</h3>
        <p className="text-sm text-muted-foreground">
          Você tem <strong className="text-primary">{creditBalance}</strong> créditos · Cada roteiro custa <strong>{costPerContent}</strong> créditos · Máximo neste lote: <strong className="text-primary">{quotaRemaining}</strong>
        </p>
      </div>
      <div className="space-y-3">
        <Slider value={[quantidade]} onValueChange={([v]) => { onQuantidadeChange(v); onFormatDistChange({}); }} min={1} max={Math.min(quotaRemaining, 30)} step={1} />
        <div className="text-center text-4xl font-bold text-primary">{quantidade}</div>
      </div>
      <div>
        <p className="text-sm font-medium mb-1">
          Distribuição de formatos: <strong className={formatTotal === quantidade ? "text-primary" : "text-destructive"}>{formatTotal}/{quantidade}</strong>
        </p>
        {formatTotal === 0 && (
          <p className="text-xs text-muted-foreground mb-3">Escolha como distribuir seus {quantidade} roteiros entre os formatos abaixo.</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FORMATOS.map(f => {
            const Icon = ICON_MAP[f.icon];
            const val = formatDist[f.value] || 0;
            return (
              <div key={f.value} className="flex items-center gap-3 p-3 rounded-xl border bg-card">
                {Icon && <Icon className="w-5 h-5 text-muted-foreground shrink-0" />}
                <span className="text-sm font-medium flex-1">{f.label}</span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateFormatDist(f.value, Math.max(0, val - 1))} disabled={val <= 0} aria-label="Diminuir">-</Button>
                  <span className="w-6 text-center font-bold">{val}</span>
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateFormatDist(f.value, val + 1)} disabled={formatTotal >= quantidade} aria-label="Aumentar">+</Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-1">Qual é o objetivo desses roteiros?</h3>
        <p className="text-sm text-muted-foreground">A IA distribui os objetivos proporcionalmente entre os roteiros.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {OBJETIVOS.map(o => (
          <button key={o.value} onClick={() => toggleObjetivo(o.value)}
            className={`p-4 rounded-xl border-2 text-left text-sm font-medium transition-all ${objetivos.includes(o.value) ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border hover:border-primary/40"}`}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-5">
      <div>
        <h3 className="text-xl font-semibold mb-1">Duração e tema do vídeo</h3>
        <p className="text-sm text-muted-foreground">
          A IA ajusta o roteiro (hook, desenvolvimento e CTA) para caber no tempo selecionado.
        </p>
      </div>

      <div>
        <p className="text-sm font-medium mb-2 flex items-center gap-1.5"><Clock className="w-4 h-4" /> Duração do vídeo</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {DURACOES.map(d => (
            <button key={d.value} onClick={() => onDuracaoChange(d.value)}
              className={`p-3 rounded-xl border-2 text-center transition-all ${duracao === d.value ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border hover:border-primary/40"}`}>
              <p className="font-bold text-sm">{d.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{d.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium mb-1">Tema ou assunto específico (opcional)</p>
        {hasStrategy && strategy.pilares?.length > 0 && (
          <div className="mb-2">
            <p className="text-xs text-muted-foreground mb-1.5">Seus pilares estratégicos:</p>
            <div className="flex flex-wrap gap-2">
              {(strategy.pilares as Array<Record<string, unknown>>).map((p, i: number) => {
                const name = typeof p === "string" ? p : p.nome || p.pilar || p.name || JSON.stringify(p);
                return (
                  <button key={i} onClick={() => onTemaChange(name)}
                    className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${tema === name ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/40"}`}>
                    {name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <Textarea placeholder="Ex: como investir em imóveis, marketing para médicos..." value={tema} onChange={e => onTemaChange(e.target.value)} rows={3} />
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-1">Onde esses vídeos serão publicados?</h3>
        <p className="text-sm text-muted-foreground">Ajusta o estilo, linguagem e estrutura do roteiro.</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {PLATAFORMAS.map(p => (
          <button key={p} onClick={() => onPlataformaChange(p)}
            className={`p-4 rounded-xl border-2 text-center font-medium transition-all ${plataforma === p ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border hover:border-primary/40"}`}>
            {p}
          </button>
        ))}
      </div>

      {/* Review summary */}
      <div className="p-4 rounded-xl bg-muted/30 border space-y-2">
        <p className="text-sm font-semibold">Resumo do lote</p>
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <span>🎬 {quantidade} roteiros</span>
          <span>📱 {plataforma}</span>
          <span>⏱️ {DURACOES.find(d => d.value === duracao)?.label || duracao}</span>
          <span>🎯 {objetivos.map(o => OBJETIVOS.find(x => x.value === o)?.label).join(", ")}</span>
          {tema && <span className="col-span-2">📝 {tema}</span>}
        </div>
        {hasStrategy && (
          <div className="pt-2 border-t mt-2 grid grid-cols-2 gap-1 text-xs text-muted-foreground">
            <span className="text-primary font-medium col-span-2">✓ Dados importados da estratégia:</span>
            {strategy.personaName && <span>👤 {strategy.personaName}</span>}
            {strategy.tomPrincipal && <span>🎯 Tom: {strategy.tomPrincipal}</span>}
            {strategy.pilares?.length > 0 && <span>📐 {strategy.pilares.length} pilares</span>}
            {strategy.dores?.length > 0 && <span>💢 {strategy.dores.length} dores</span>}
          </div>
        )}
      </div>
    </div>
  );

  const renderSteps = [renderStep1, renderStep2, renderStep3, renderStep4];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Passo {step} de {TOTAL_STEPS}</CardTitle>
          <div className="flex gap-1">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div key={i} className={`h-2 w-8 rounded-full transition-colors ${i < step ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            {renderSteps[step - 1]()}
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between mt-8">
          <Button variant="ghost" onClick={() => setStep(s => s - 1)} disabled={step === 1}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
          </Button>
          {step < TOTAL_STEPS ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={!canAdvance()}>
              Próximo <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleGenerate} disabled={!canAdvance()}>
              <Sparkles className="w-4 h-4 mr-1" /> Gerar {quantidade} Roteiros ({quantidade * costPerContent} créditos)
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
