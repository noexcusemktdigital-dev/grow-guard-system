import { useState } from "react";
import { ChevronLeft, ChevronRight, Sparkles, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DiagField, DiagSection } from "./FranqueadoEstrategiaData";
import { motion, AnimatePresence } from "framer-motion";

const STEP_COLORS = [
  "from-slate-500 to-slate-600",
  "from-violet-500 to-purple-600",
  "from-blue-500 to-cyan-500",
  "from-emerald-500 to-green-500",
  "from-orange-500 to-amber-500",
  "from-rose-500 to-red-500",
  "from-indigo-500 to-blue-600",
  "from-pink-500 to-rose-500",
];

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
  const [answers, setAnswers] = useState<Record<string, any>>(initialAnswers || {
    nota_conteudo: 3, nota_trafego: 3, nota_web: 3,
    nota_sales: 3, nota_escala: 3, nota_marketing_geral: 3, nota_posicionamento: 3,
  });
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
    if (f.type === "slider") return true;
    if (f.type === "checkbox-group") {
      const val = answers[f.key];
      return Array.isArray(val) && val.length > 0;
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
    const finalTitle = title.trim() || `Diagnóstico - ${answers.produto_servico || answers.nome_empresa || "Estratégia"}`;
    onSubmit(answers, finalTitle);
  };

  const sliderLabels: Record<number, string> = { 1: "Muito fraco", 2: "Fraco", 3: "Médio", 4: "Bom", 5: "Excelente" };

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
            <Label className="text-xs font-medium text-muted-foreground mb-1 block">Título do Diagnóstico (opcional)</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Diagnóstico Clínica Dr. Silva" />
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
                <Label className="text-xs font-medium text-muted-foreground mb-1 block">{field.label}</Label>

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

                {field.type === "slider" && (
                  <div className="space-y-2 pt-1">
                    <Slider
                      value={[answers[field.key] ?? 3]}
                      onValueChange={([v]) => setAnswers((p) => ({ ...p, [field.key]: v }))}
                      min={1}
                      max={5}
                      step={1}
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <span key={n} className={answers[field.key] === n ? "font-bold text-primary" : ""}>{n}</span>
                      ))}
                    </div>
                    <p className="text-xs text-center text-primary font-medium">
                      {sliderLabels[answers[field.key] ?? 3]}
                    </p>
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
