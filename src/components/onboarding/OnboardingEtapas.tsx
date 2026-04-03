import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, CheckCircle2 } from "lucide-react";
import type { ChecklistItem, OnboardingPhase } from "@/types/onboarding";

const PHASES: OnboardingPhase[] = ["Pré-Implantação", "Estruturação", "Primeiros Movimentos", "Consolidação"];

interface OnboardingEtapasProps {
  checklist: ChecklistItem[];
  onChange: (updated: ChecklistItem[]) => void;
}

export function OnboardingEtapas({ checklist, onChange }: OnboardingEtapasProps) {
  const [openPhases, setOpenPhases] = useState<Record<string, boolean>>(
    Object.fromEntries(PHASES.map((p) => [p, true]))
  );

  const togglePhase = (phase: string) => {
    setOpenPhases((prev) => ({ ...prev, [phase]: !prev[phase] }));
  };

  const handleToggle = (id: string) => {
    onChange(
      checklist.map((item) =>
        item.id === id
          ? { ...item, concluido: !item.concluido, data: !item.concluido ? new Date().toISOString().split("T")[0] : undefined }
          : item
      )
    );
  };

  const handleField = (id: string, field: "responsavel" | "observacao", value: string) => {
    onChange(checklist.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  return (
    <div className="space-y-4">
      {PHASES.map((phase) => {
        const items = checklist.filter((c) => c.phase === phase);
        const done = items.filter((c) => c.concluido).length;
        const allDone = done === items.length;

        return (
          <Collapsible key={phase} open={openPhases[phase]} onOpenChange={() => togglePhase(phase)}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <ChevronDown className={`w-4 h-4 transition-transform ${openPhases[phase] ? "" : "-rotate-90"}`} />
                <span className="font-medium text-sm">{phase}</span>
                <span className="text-xs text-muted-foreground">{done}/{items.length}</span>
              </div>
              {allDone && (
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Completa
                </Badge>
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-1 space-y-1 pl-4 border-l-2 border-border ml-5">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`flex flex-wrap items-start gap-3 p-3 rounded-md text-sm ${
                    item.concluido ? "bg-muted/30" : ""
                  }`}
                >
                  <Checkbox
                    checked={item.concluido}
                    onCheckedChange={() => handleToggle(item.id)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-[200px] space-y-1.5">
                    <p className={item.concluido ? "line-through text-muted-foreground" : ""}>{item.descricao}</p>
                    <div className="flex flex-wrap gap-2">
                      <Input
                        placeholder="Responsável"
                        value={item.responsavel || ""}
                        onChange={(e) => handleField(item.id, "responsavel", e.target.value)}
                        className="h-7 text-xs w-32"
                      />
                      <Input
                        placeholder="Observação"
                        value={item.observacao || ""}
                        onChange={(e) => handleField(item.id, "observacao", e.target.value)}
                        className="h-7 text-xs flex-1 min-w-[150px]"
                      />
                    </div>
                  </div>
                  {item.data && (
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(item.data).toLocaleDateString("pt-BR")}
                    </span>
                  )}
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
}
