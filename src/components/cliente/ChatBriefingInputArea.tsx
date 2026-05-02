import { ArrowRight, Send, CheckCircle2, HelpCircle, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { BriefingStep } from "./ChatBriefing";
import type React from "react";

interface ChatBriefingInputAreaProps {
  currentStep: BriefingStep;
  displayOptions: { value: string; label: string; desc?: string; icon?: string }[];
  hasCategories: boolean;
  customTextMode: boolean;
  setCustomTextMode: (v: boolean) => void;
  textValue: string;
  setTextValue: (v: string) => void;
  multiSelectValues: string[];
  setMultiSelectValues: React.Dispatch<React.SetStateAction<string[]>>;
  currentStepIdx: number;
  inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement>;
  handleSelect: (value: string) => void;
  handleMultiConfirm: () => void;
  handleTextSubmit: () => void;
  handleInfoAdvance: () => void;
  handleUndo: () => void;
  advanceStep: (answer?: unknown) => void;
  addCustomMultiValue: () => void;
  toggleMulti: (value: string) => void;
}

export function ChatBriefingInputArea({
  currentStep,
  displayOptions,
  hasCategories,
  customTextMode, setCustomTextMode,
  textValue, setTextValue,
  multiSelectValues, setMultiSelectValues,
  currentStepIdx,
  inputRef,
  handleSelect,
  handleMultiConfirm,
  handleTextSubmit,
  handleInfoAdvance,
  handleUndo,
  advanceStep,
  addCustomMultiValue,
  toggleMulti,
}: ChatBriefingInputAreaProps) {
  return (
    <div className="border-t bg-muted/10 px-4 py-3 space-y-2">
      {/* Help tooltip */}
      {currentStep.helpText && (
        <div className="flex items-center gap-1.5 mb-1">
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground/60 hover:text-muted-foreground transition-colors">
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
                {currentStep.helpText}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <span className="text-[10px] text-muted-foreground">Dica</span>
        </div>
      )}

      {/* Info — just a "Continuar" button */}
      {currentStep.inputType === "info" && (
        <Button size="sm" className="w-full gap-1.5 text-xs" onClick={handleInfoAdvance}>
          Continuar <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      )}

      {/* Select — button grid or custom text input */}
      {currentStep.inputType === "select" && !hasCategories && displayOptions.length > 0 && !customTextMode && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto">
          {displayOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className="flex items-center gap-2 p-2.5 rounded-xl border-2 border-border text-left transition-all duration-150 hover:border-primary/40 hover:bg-primary/5 active:scale-[0.98]"
            >
              {opt.icon && <span className="text-sm">{opt.icon}</span>}
              <div className="min-w-0">
                <span className="text-xs font-medium text-foreground">{opt.label}</span>
                {opt.desc && <p className="text-[9px] text-muted-foreground leading-tight mt-0.5">{opt.desc}</p>}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Custom text input when "Outro" is selected */}
      {currentStep.inputType === "select" && customTextMode && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Digite seu segmento ou opção personalizada:</p>
          <div className="flex gap-2">
            <Input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              value={textValue}
              onChange={e => setTextValue(e.target.value)}
              placeholder="Ex: Odontologia, Pet shop, Advocacia..."
              className="flex-1 text-sm"
              onKeyDown={e => e.key === "Enter" && textValue.trim() && advanceStep(textValue.trim())}
              autoFocus
            />
            <Button size="sm" onClick={() => textValue.trim() && advanceStep(textValue.trim())} disabled={!textValue.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <Button variant="ghost" size="sm" className="text-[10px] text-muted-foreground h-6" onClick={() => setCustomTextMode(false)}>
            ← Voltar às opções
          </Button>
        </div>
      )}

      {/* Select with categories */}
      {currentStep.inputType === "select" && hasCategories && (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {currentStep.categories?.map(cat => (
            <div key={cat.title}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-sm">{cat.icon}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{cat.title}</span>
              </div>
              {cat.description && <p className="text-[9px] text-muted-foreground mb-1.5">{cat.description}</p>}
              <div className="grid grid-cols-2 gap-1.5">
                {cat.options.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => handleSelect(opt.value)}
                    className="flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 border-border text-center transition-all duration-150 hover:border-primary/40 hover:bg-primary/5"
                  >
                    {opt.icon && <span className="text-lg">{opt.icon}</span>}
                    <span className="text-[11px] font-semibold">{opt.label}</span>
                    {opt.desc && <span className="text-[9px] text-muted-foreground leading-tight">{opt.desc}</span>}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Multi-select */}
      {currentStep.inputType === "multi-select" && (
        <div className="space-y-2">
          {/* Custom values as badges */}
          {multiSelectValues.filter(v => !displayOptions.some(o => o.value === v)).length > 0 && (
            <div className="flex flex-wrap gap-1">
              {multiSelectValues.filter(v => !displayOptions.some(o => o.value === v)).map(v => (
                <Badge key={v} variant="secondary" className="text-xs gap-1 cursor-pointer" onClick={() => setMultiSelectValues(prev => prev.filter(x => x !== v))}>
                  {v} ✕
                </Badge>
              ))}
            </div>
          )}

          {!customTextMode && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto">
              {displayOptions.map(opt => {
                const selected = multiSelectValues.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    onClick={() => toggleMulti(opt.value)}
                    className={cn(
                      "flex items-center gap-2 p-2.5 rounded-xl border-2 text-left transition-all duration-150",
                      selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                    )}
                  >
                    <div className={cn(
                      "w-3.5 h-3.5 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                      selected ? "border-primary bg-primary" : "border-muted-foreground/30"
                    )}>
                      {selected && <CheckCircle2 className="w-2.5 h-2.5 text-primary-foreground" />}
                    </div>
                    <span className={cn("text-xs", selected ? "font-medium text-foreground" : "text-muted-foreground")}>
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Custom text input for multi-select "Outro" */}
          {customTextMode && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Digite sua opção personalizada:</p>
              <div className="flex gap-2">
                <Input
                  ref={inputRef as React.RefObject<HTMLInputElement>}
                  value={textValue}
                  onChange={e => setTextValue(e.target.value)}
                  placeholder="Ex: Meu segmento personalizado..."
                  className="flex-1 text-sm"
                  onKeyDown={e => e.key === "Enter" && addCustomMultiValue()}
                  autoFocus
                />
                <Button size="sm" onClick={addCustomMultiValue} disabled={!textValue.trim()} aria-label="Enviar">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <Button variant="ghost" size="sm" className="text-[10px] text-muted-foreground h-6" onClick={() => setCustomTextMode(false)}>
                ← Voltar às opções
              </Button>
            </div>
          )}

          <Button
            size="sm"
            className="w-full gap-1.5 text-xs"
            onClick={handleMultiConfirm}
            disabled={multiSelectValues.length === 0 && !currentStep.optional}
          >
            Confirmar {multiSelectValues.length > 0 && `(${multiSelectValues.length})`} <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      {/* Text input */}
      {currentStep.inputType === "text" && (
        <div className="flex gap-2">
          <Input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            value={textValue}
            onChange={e => setTextValue(e.target.value)}
            placeholder={currentStep.placeholder || "Digite aqui..."}
            className="flex-1 text-sm"
            onKeyDown={e => e.key === "Enter" && handleTextSubmit()}
          />
          <Button size="sm" onClick={handleTextSubmit} disabled={!textValue.trim() && !currentStep.optional} aria-label="Enviar">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Textarea input */}
      {currentStep.inputType === "textarea" && (
        <div className="space-y-2">
          <Textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={textValue}
            onChange={e => setTextValue(e.target.value)}
            placeholder={currentStep.placeholder || "Descreva aqui..."}
            className="min-h-[60px] text-sm resize-none"
            rows={3}
          />
          <Button size="sm" className="w-full gap-1.5 text-xs" onClick={handleTextSubmit} disabled={!textValue.trim() && !currentStep.optional}>
            Enviar <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      {/* Bottom bar with undo + optional skip */}
      <div className="flex items-center justify-between pt-1">
        <Button
          variant="ghost"
          size="sm"
          className="text-[10px] text-muted-foreground gap-1 h-6"
          onClick={handleUndo}
          disabled={currentStepIdx <= 0}
        >
          <Undo2 className="w-3 h-3" /> Voltar
        </Button>
        {currentStep.optional && currentStep.inputType !== "info" && (
          <Button
            variant="ghost"
            size="sm"
            className="text-[10px] text-muted-foreground h-6"
            onClick={() => advanceStep("")}
          >
            Pular →
          </Button>
        )}
      </div>
    </div>
  );
}
