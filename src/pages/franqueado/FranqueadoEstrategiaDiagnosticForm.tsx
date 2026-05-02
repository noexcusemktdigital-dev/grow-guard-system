// @ts-nocheck
import { useState, useRef, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, Sparkles, RefreshCw, HelpCircle, Mic, MicOff, Plus, Trash2, Upload, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { DiagField, DiagSection } from "./FranqueadoEstrategiaData";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { reportError } from "@/lib/error-toast";
import { supabase } from "@/integrations/supabase/client";
import { invokeEdge } from "@/lib/edge";

const STEP_COLORS = [
  "from-slate-500 to-slate-600",
  "from-violet-500 to-purple-600",
  "from-blue-500 to-cyan-500",
  "from-emerald-500 to-green-500",
  "from-orange-500 to-amber-500",
  "from-rose-500 to-red-500",
  "from-indigo-500 to-blue-600",
];

const MAX_RECORDING_SECONDS = 120;

// ── Currency Mask ─────────────────────────────────────────────

function formatCurrencyInput(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  const num = parseInt(digits, 10);
  return num.toLocaleString("pt-BR");
}

function parseCurrencyToNumber(formatted: string): number {
  const digits = formatted.replace(/\D/g, "");
  return parseInt(digits, 10) || 0;
}

// ── Currency Field ────────────────────────────────────────────

function CurrencyInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrencyInput(e.target.value);
    onChange(formatted);
  };

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
      <Input
        value={value || ""}
        onChange={handleChange}
        placeholder={placeholder || "0"}
        className="pl-9"
      />
    </div>
  );
}

// ── Audio Text Field ──────────────────────────────────────────

function AudioTextField({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      setElapsed(0);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        transcribeAudio(blob);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);

      timerRef.current = setInterval(() => {
        setElapsed(prev => {
          const next = prev + 1;
          if (next >= MAX_RECORDING_SECONDS) {
            recorder.stop();
            setRecording(false);
            toast.info("Limite de 2 minutos atingido. Transcrevendo...");
          }
          return next;
        });
      }, 1000);

      toast.info("Gravando áudio... Clique em parar quando terminar.");
    } catch (err) {
      reportError(err, { title: "Não foi possível acessar o microfone. Verifique as permissões.", category: "audio.mic_access" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
    setRecording(false);
  };

  const transcribeAudio = async (blob: Blob) => {
    setTranscribing(true);
    try {
      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");

      const { data, error } = await invokeEdge("transcribe-audio", {
        body: formData,
      });

      if (error) throw error;

      const text = data?.text?.trim();
      if (text) {
        onChange(value ? `${value}\n\n${text}` : text);
        toast.success("Áudio transcrito com sucesso!");
      } else {
        toast.warning("Não foi possível identificar fala no áudio. Tente novamente ou escreva manualmente.");
      }
    } catch (err) {
      reportError(err, { title: "Erro ao transcrever áudio. Tente novamente ou escreva manualmente.", category: "audio.transcription" });
    } finally {
      setTranscribing(false);
      setElapsed(0);
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="space-y-2">
      <Textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "Escreva aqui..."}
        rows={6}
        className="min-h-[140px]"
        disabled={transcribing}
      />

      {recording && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
          </span>
          <span className="text-sm font-medium text-destructive">
            Gravando {formatTime(elapsed)} / {formatTime(MAX_RECORDING_SECONDS)}
          </span>
          <div className="flex-1 h-1.5 rounded-full bg-destructive/20 overflow-hidden">
            <div
              className="h-full bg-destructive rounded-full transition-all duration-1000"
              style={{ width: `${(elapsed / MAX_RECORDING_SECONDS) * 100}%` }}
            />
          </div>
        </div>
      )}

      {transcribing && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 border border-primary/20">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span className="text-sm font-medium text-primary">Transcrevendo áudio...</span>
        </div>
      )}

      <div className="flex items-center gap-2">
        {recording ? (
          <Button type="button" variant="destructive" size="sm" onClick={stopRecording}>
            <MicOff className="w-4 h-4 mr-1" /> Parar Gravação
          </Button>
        ) : (
          <Button type="button" variant="outline" size="sm" onClick={startRecording} disabled={transcribing}>
            <Mic className="w-4 h-4 mr-1" /> Gravar Áudio
          </Button>
        )}
        <span className="text-[10px] text-muted-foreground">
          ⚠️ Áudio de até 2 minutos · Grave um áudio ou escreva diretamente
        </span>
      </div>
    </div>
  );
}

// ── Competitor List Field ─────────────────────────────────────

interface Competitor {
  nome: string;
  site?: string;
  instagram?: string;
  diferencial?: string;
}

function CompetitorListField({ value, onChange }: { value: Competitor[]; onChange: (v: Competitor[]) => void }) {
  const competitors = Array.isArray(value) && value.length > 0 ? value : [{ nome: "" }];

  const update = (index: number, field: keyof Competitor, val: string) => {
    const updated = [...competitors];
    updated[index] = { ...updated[index], [field]: val };
    onChange(updated);
  };

  const add = () => {
    if (competitors.length >= 5) return;
    onChange([...competitors, { nome: "" }]);
  };

  const remove = (index: number) => {
    if (competitors.length <= 1) return;
    onChange(competitors.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {competitors.map((comp, i) => (
        <div key={i} className="border border-border/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">Concorrente {i + 1}</span>
            {competitors.length > 1 && (
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6" aria-label="Remover concorrente" onClick={() => remove(i)}>
                <Trash2 className="w-3 h-3 text-destructive" />
              </Button>
            )}
          </div>
          <Input
            value={comp.nome || ""}
            onChange={(e) => update(i, "nome", e.target.value)}
            placeholder="Nome do concorrente *"
            className="h-8 text-sm"
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              value={comp.site || ""}
              onChange={(e) => update(i, "site", e.target.value)}
              placeholder="Site (opcional)"
              className="h-8 text-sm"
            />
            <Input
              value={comp.instagram || ""}
              onChange={(e) => update(i, "instagram", e.target.value)}
              placeholder="Instagram (opcional)"
              className="h-8 text-sm"
            />
          </div>
          <Input
            value={comp.diferencial || ""}
            onChange={(e) => update(i, "diferencial", e.target.value)}
            placeholder="Diferencial percebido (opcional)"
            className="h-8 text-sm"
          />
        </div>
      ))}
      {competitors.length < 5 && (
        <Button type="button" variant="outline" size="sm" onClick={add} className="w-full">
          <Plus className="w-4 h-4 mr-1" /> Adicionar Concorrente
        </Button>
      )}
    </div>
  );
}

// ── Tooltip Label ─────────────────────────────────────────────

function FieldLabel({ label, tooltip, optional }: { label: string; tooltip?: string; optional?: boolean }) {
  return (
    <div className="flex items-center gap-1.5 mb-1">
      <Label className="text-xs font-medium text-muted-foreground">
        {label}
        {optional && <span className="text-muted-foreground/50 ml-1">(opcional)</span>}
      </Label>
      {tooltip && (
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="text-muted-foreground/60 hover:text-primary transition-colors">
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" className="text-xs max-w-[280px] p-3">
            {tooltip}
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

// ── Main Form ─────────────────────────────────────────────────

export function DiagnosticForm({
  diagnosticSections,
  onSubmit,
  loading,
  initialAnswers,
  initialTitle,
}: {
  diagnosticSections: DiagSection[];
  onSubmit: (answers: Record<string, any>, title: string) => void;
  loading: boolean;
  initialAnswers?: Record<string, any>;
  initialTitle?: string;
}) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>(initialAnswers || {});
  const [title, setTitle] = useState(initialTitle || "");

  const section = diagnosticSections[step];
  const totalSteps = diagnosticSections.length;
  const progress = ((step + 1) / totalSteps) * 100;
  const stepColor = STEP_COLORS[step % STEP_COLORS.length];

  const isFieldVisible = (field: DiagField) => {
    if (!field.conditionKey) return true;
    const condVal = answers[field.conditionKey];
    return field.conditionValues?.includes(condVal);
  };

  const visibleFields = section.fields.filter(isFieldVisible);

  const canAdvance = visibleFields.every((f) => {
    if (f.optional) return true;
    if (f.type === "slider") return true;
    if (f.type === "checkbox-group") {
      const val = answers[f.key];
      return Array.isArray(val) && val.length > 0;
    }
    if (f.type === "competitor-list") {
      const val = answers[f.key];
      return Array.isArray(val) && val.length > 0 && val[0]?.nome?.trim();
    }
    const val = answers[f.key];
    return val && String(val).trim() !== "";
  });

  const handleCheckbox = (key: string, option: string, checked: boolean) => {
    setAnswers((p) => {
      const arr: string[] = Array.isArray(p[key]) ? [...p[key]] : [];
      if (checked) {
        return { ...p, [key]: [...arr, option] };
      }
      return { ...p, [key]: arr.filter((v) => v !== option) };
    });
  };

  const handleSubmit = () => {
    const finalTitle = title.trim() || `Diagnóstico - ${answers.nome_empresa || "Estratégia"}`;
    onSubmit(answers, finalTitle);
  };

  return (
    <Card className="border border-border/50 bg-card/80 overflow-hidden">
      {/* Header with step number */}
      <div className="p-5 pb-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stepColor} flex items-center justify-center shadow-sm`}>
              <span className="text-white text-sm font-extrabold">
                {String(step + 1).padStart(2, "0")}
              </span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                {section.icon}
                {section.title}
              </h3>
              <p className="text-xs text-muted-foreground">{section.subtitle}</p>
            </div>
          </div>
          <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
            {step + 1}/{totalSteps}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <motion.div
            className={`h-full rounded-full bg-gradient-to-r ${stepColor}`}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>
      </div>

      <CardContent className="space-y-4 pt-0">
        {step === 0 && (
          <div>
            <FieldLabel label="Título do Diagnóstico" optional tooltip="Opcional. Se não preencher, será gerado automaticamente." />
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Diagnóstico Clínica Dr. Silva, Estratégia Restaurante Sabor & Arte, Análise Loja Virtual TechStore" />
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {visibleFields.map((field) => (
              <div key={field.key}>
                <FieldLabel label={field.label} tooltip={field.tooltip} optional={field.optional} />

                {field.type === "select" && (
                  <Select value={answers[field.key] || ""} onValueChange={(v) => setAnswers((p) => ({ ...p, [field.key]: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {field.options?.map((o) => (
                        <SelectItem key={o} value={o}>{o}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {field.type === "textarea" && (
                  <Textarea
                    value={answers[field.key] || ""}
                    onChange={(e) => setAnswers((p) => ({ ...p, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    rows={3}
                  />
                )}

                {field.type === "text" && (
                  <Input
                    value={answers[field.key] || ""}
                    onChange={(e) => setAnswers((p) => ({ ...p, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                  />
                )}

                {field.type === "currency" && (
                  <CurrencyInput
                    value={answers[field.key] || ""}
                    onChange={(v) => setAnswers((p) => ({ ...p, [field.key]: v }))}
                    placeholder={field.placeholder}
                  />
                )}

                {field.type === "audio-text" && (
                  <AudioTextField
                    value={answers[field.key] || ""}
                    onChange={(v) => setAnswers((p) => ({ ...p, [field.key]: v }))}
                    placeholder={field.placeholder}
                  />
                )}

                {field.type === "competitor-list" && (
                  <CompetitorListField
                    value={answers[field.key] || [{ nome: "" }]}
                    onChange={(v) => setAnswers((p) => ({ ...p, [field.key]: v }))}
                  />
                )}

                {field.type === "checkbox-group" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                    {field.options?.map((option) => {
                      const checked = Array.isArray(answers[field.key]) && answers[field.key].includes(option);
                      return (
                        <label key={option} className="flex items-center gap-2 text-sm cursor-pointer">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(c) => handleCheckbox(field.key, option, !!c)}
                          />
                          {option}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between pt-3 border-t border-border/50">
          <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={step === 0}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
          </Button>
          {step < totalSteps - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canAdvance}>
              Próximo <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading || !canAdvance} className="min-w-[200px]">
              {loading ? <RefreshCw className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
              {loading ? "Gerando diagnóstico..." : "Gerar Diagnóstico Estratégico"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
