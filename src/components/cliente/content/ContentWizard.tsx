// @ts-nocheck
import { useState, useEffect } from "react";
import { Sparkles, Video, Smartphone, Monitor, Film, Clock, Navigation, ChevronRight, Check, Lightbulb } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { FORMATOS, OBJETIVOS, DURACOES, loadingPhrases, buildGpsSuggestions } from "./ContentTypes";
import { useStrategyData } from "@/hooks/useStrategyData";

const ICON_MAP: Record<string, React.ElementType> = { Video, Monitor, Smartphone, Film };
const STORAGE_KEY = "roteiro-wizard-prefs-v2";

function loadPrefs() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
}
function savePrefs(prefs: Record<string, unknown>) {
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
  canGeneratePermission?: boolean;
}

export function ContentWizard({
  quotaRemaining, creditBalance, costPerContent, hasStrategy,
  isGenerating, loadingIdx, quantidade,
  onGenerate, onQuantidadeChange,
  formatDist, onFormatDistChange,
  objetivos, onObjetivosChange,
  tema, onTemaChange,
  plataforma, onPlataformaChange,
  duracao, onDuracaoChange,
  canGeneratePermission = true,
}: ContentWizardProps) {
  const [step, setStep] = useState<"sugestoes" | "config" | "gerando">("sugestoes");
  const strategyData = useStrategyData();
  const gpsSuggestions = buildGpsSuggestions(strategyData);
  const [selectedSuggestion, setSelectedSuggestion] = useState<number | null>(null);

  useEffect(() => {
    const prefs = loadPrefs();
    if (prefs.plataforma) onPlataformaChange(prefs.plataforma);
    if (prefs.objetivos?.length) onObjetivosChange(prefs.objetivos);
    if (prefs.duracao) onDuracaoChange(prefs.duracao);
    if (prefs.formato) onFormatDistChange({ [prefs.formato]: quantidade });
  }, []);

  useEffect(() => {
    if (isGenerating) setStep("gerando");
  }, [isGenerating]);

  const formatTotal = Object.values(formatDist).reduce((a, b) => a + b, 0);
  const selectedFormato = Object.keys(formatDist)[0] || "";
  const canGenerate = formatTotal > 0 && objetivos.length > 0 && !!duracao && canGeneratePermission;

  const handleSelectSuggestion = (idx: number) => {
    const s = gpsSuggestions[idx];
    setSelectedSuggestion(idx);
    onTemaChange(s.tema);
    if (!objetivos.includes(s.objetivo)) onObjetivosChange([s.objetivo]);
  };

  const handleGenerate = () => {
    savePrefs({ plataforma, objetivos, duracao, formato: selectedFormato });
    onGenerate();
  };

  // Loading screen
  if (step === "gerando" || isGenerating) {
    return (
      <Card>
        <CardContent className="py-16 text-center space-y-6">
          <div className="flex items-center justify-center gap-3">
            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
            <Sparkles className="w-6 h-6 text-amber-500 animate-pulse" />
            <Navigation className="w-5 h-5 text-primary animate-bounce" />
          </div>

          <div>
            <p className="text-lg font-semibold animate-pulse">{loadingPhrases[loadingIdx]}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Gerando {quantidade} roteiro{quantidade > 1 ? "s" : ""} personalizados para o seu negócio...
            </p>
          </div>

          {hasStrategy && (
            <div className="flex items-center justify-center gap-2 text-xs text-amber-600 bg-amber-500/10 rounded-full px-4 py-2 mx-auto w-fit">
              <Navigation className="w-3.5 h-3.5" />
              Usando dados do seu GPS do Negócio
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Step 1: Sugestões do GPS
  if (step === "sugestoes") {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
        {/* Header GPS */}
        {hasStrategy && gpsSuggestions.length > 0 ? (
          <>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg font-semibold">Sugestões do seu GPS do Negócio</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Com base no diagnóstico do seu negócio, essas são as melhores ideias de conteúdo para você agora.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {gpsSuggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectSuggestion(i)}
                  className={`text-left p-4 rounded-xl border-2 transition-all space-y-2 ${
                    selectedSuggestion === i
                      ? "border-amber-500 bg-amber-500/5 ring-2 ring-amber-500/20"
                      : "border-border hover:border-amber-500/40 bg-card"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl">{s.emoji}</span>
                    {selectedSuggestion === i && (
                      <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <p className="font-medium text-sm">{s.tema}</p>
                  <div className="flex items-start gap-1.5">
                    <Navigation className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-[11px] text-muted-foreground">{s.why}</p>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">
                    {OBJETIVOS.find(o => o.value === s.objetivo)?.label || s.objetivo}
                  </Badge>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                disabled={selectedSuggestion === null}
                onClick={() => setStep("config")}
              >
                Continuar com esse tema <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
              <button
                onClick={() => setStep("config")}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Prefiro escolher meu próprio tema →
              </button>
            </div>
          </>
        ) : (
          // Sem GPS — vai direto para config
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
              <Navigation className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-sm">Faça o GPS do Negócio para roteiros personalizados</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Sem o diagnóstico, geramos roteiros genéricos. Com o GPS, cada roteiro é baseado no seu cliente ideal, suas objeções e seu tom de voz.
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => setStep("config")}>
              Criar roteiro mesmo assim →
            </Button>
          </div>
        )}
      </motion.div>
    );
  }

  // Step 2: Configuração
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      {/* Tema selecionado ou campo livre */}
      <div className="space-y-2">
        <label className="text-sm font-semibold">
          {selectedSuggestion !== null ? (
            <>🎯 Tema selecionado</>
          ) : (
            <>💡 Sobre o que será o roteiro?</>
          )}
        </label>
        <Textarea
          value={tema}
          onChange={e => onTemaChange(e.target.value)}
          placeholder="Ex: Como mulheres podem se proteger financeiramente no divórcio..."
          className="resize-none text-sm"
          rows={2}
        />
        {selectedSuggestion !== null && (
          <button
            onClick={() => { setSelectedSuggestion(null); onTemaChange(""); setStep("sugestoes"); }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Voltar para sugestões do GPS
          </button>
        )}
      </div>

      {/* Formato */}
      <div className="space-y-2">
        <label className="text-sm font-semibold">Formato do conteúdo</label>
        <div className="grid grid-cols-2 gap-2">
          {FORMATOS.map(f => {
            const Icon = ICON_MAP[f.icon];
            const selected = selectedFormato === f.value;
            return (
              <button
                key={f.value}
                onClick={() => onFormatDistChange({ [f.value]: quantidade })}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                  selected ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border hover:border-primary/40"
                }`}
              >
                {Icon && <Icon className="w-4 h-4 text-muted-foreground shrink-0" />}
                <div>
                  <p className="text-sm font-medium">{f.label}</p>
                  <p className="text-[10px] text-muted-foreground">{f.desc}</p>
                </div>
                {selected && <Check className="w-4 h-4 text-primary ml-auto shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Objetivo — mostra se não selecionou sugestão */}
      {selectedSuggestion === null && (
        <div className="space-y-2">
          <label className="text-sm font-semibold">Objetivo do conteúdo</label>
          <div className="grid grid-cols-2 gap-2">
            {OBJETIVOS.map(o => (
              <button
                key={o.value}
                onClick={() => {
                  const next = objetivos.includes(o.value)
                    ? objetivos.filter(x => x !== o.value)
                    : [...objetivos, o.value];
                  onObjetivosChange(next);
                }}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  objetivos.includes(o.value)
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <p className="text-sm font-medium">{o.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{o.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Duração + Quantidade em linha */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Duração
          </label>
          <div className="flex flex-wrap gap-2">
            {DURACOES.map(d => (
              <button
                key={d.value}
                onClick={() => onDuracaoChange(d.value)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                  duracao === d.value
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:border-primary/40"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold">Quantidade</label>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8"
              onClick={() => onQuantidadeChange(Math.max(1, quantidade - 1))}>-</Button>
            <span className="text-2xl font-bold w-8 text-center">{quantidade}</span>
            <Button variant="outline" size="icon" className="h-8 w-8"
              onClick={() => onQuantidadeChange(Math.min(quotaRemaining, quantidade + 1, 10))}>+</Button>
          </div>
          <p className="text-[10px] text-muted-foreground">{creditBalance} créditos · {costPerContent} por roteiro</p>
        </div>
      </div>

      {/* Plataforma */}
      <div className="space-y-2">
        <label className="text-sm font-semibold">Plataforma</label>
        <div className="flex flex-wrap gap-2">
          {["Instagram", "TikTok", "YouTube", "LinkedIn"].map(p => (
            <button
              key={p}
              onClick={() => onPlataformaChange(p)}
              className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                plataforma === p
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border hover:border-primary/40"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Botão gerar */}
      <Button
        className="w-full gap-2 h-11 text-base"
        disabled={!canGenerate}
        onClick={handleGenerate}
      >
        <Sparkles className="w-4 h-4" />
        Gerar {quantidade} roteiro{quantidade > 1 ? "s" : ""}
        {hasStrategy && <Badge className="ml-1 bg-amber-500/20 text-amber-700 border-0 text-[10px]">GPS ativo</Badge>}
      </Button>

      {!canGeneratePermission && (
        <p className="text-xs text-center text-destructive">
          Você não tem permissão para gerar roteiros. Fale com o administrador.
        </p>
      )}

      {canGeneratePermission && !canGenerate && (
        <p className="text-xs text-center text-muted-foreground">
          {!selectedFormato ? "Selecione um formato · " : ""}
          {objetivos.length === 0 ? "Selecione um objetivo · " : ""}
          {!duracao ? "Selecione a duração" : ""}
        </p>
      )}
    </motion.div>
  );
}
