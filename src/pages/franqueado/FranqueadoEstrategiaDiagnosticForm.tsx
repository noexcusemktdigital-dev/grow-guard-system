// @ts-nocheck
import { useState } from "react";
import { ChevronLeft, ChevronRight, Sparkles, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Progress } from "@/components/ui/progress";
import type { DiagField, DiagSection } from "./FranqueadoEstrategiaData";

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
    nota_marketing: 3, nota_comercial: 3, nota_leads: 3,
    nota_previsibilidade: 3, nota_marca: 3, nota_escala: 3,
  });
  const [title, setTitle] = useState(initialTitle || "");

  const section = diagnosticSections[step];
  const totalSteps = diagnosticSections.length;
  const progress = ((step + 1) / totalSteps) * 100;

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
    const finalTitle = title.trim() || `Diagnóstico - ${answers.produto_servico || "Estratégia"}`;
    onSubmit(answers, finalTitle);
  };

  const sliderLabels: Record<number, string> = { 1: "Muito fraco", 2: "Fraco", 3: "Médio", 4: "Bom", 5: "Excelente" };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            {section.icon}
            {section.title}
          </CardTitle>
          <span className="text-xs text-muted-foreground">{step + 1} de {totalSteps}</span>
        </div>
        <p className="text-xs text-muted-foreground">{section.subtitle}</p>
        <Progress value={progress} className="h-1.5 mt-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        {step === 0 && (
          <div>
            <Label className="text-xs font-medium text-muted-foreground mb-1 block">Título do Diagnóstico (opcional)</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Diagnóstico Clínica Dr. Silva" />
          </div>
        )}

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
              <div className="grid grid-cols-2 gap-2 mt-1">
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

        <div className="flex justify-between pt-2">
          <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={step === 0}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
          </Button>
          {step < totalSteps - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canAdvance}>
              Próximo <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading || !canAdvance}>
              {loading ? <RefreshCw className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
              {loading ? "Gerando diagnóstico..." : "Gerar Diagnóstico Estratégico"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
