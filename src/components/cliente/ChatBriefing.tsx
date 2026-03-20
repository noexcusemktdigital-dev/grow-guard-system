import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { sanitizeHtml } from "@/lib/sanitize";
import { ArrowLeft, ArrowRight, Send, CheckCircle2, HelpCircle, Undo2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/* ══════════════════════════════════════════════
   TYPES
   ══════════════════════════════════════════════ */

export interface BriefingStepOption {
  value: string;
  label: string;
  desc?: string;
  icon?: string;
}

export interface BriefingStepCategory {
  title: string;
  icon: string;
  description?: string;
  options: BriefingStepOption[];
}

export interface BriefingStep {
  id: string;
  agentMessage: string;
  inputType: "select" | "multi-select" | "text" | "textarea" | "info";
  options?: BriefingStepOption[];
  categories?: BriefingStepCategory[];
  placeholder?: string;
  helpText?: string;
  optional?: boolean;
  skipIf?: (answers: Record<string, any>) => boolean;
  section?: string;
  /** Dynamic options based on plan context and current answers */
  dynamicOptions?: (ctx: Record<string, any>, answers: Record<string, any>) => BriefingStepOption[];
}

export interface BriefingAgent {
  name: string;
  role: string;
  avatar: string;
  color: string;
}

interface ChatMessage {
  id: string;
  sender: "agent" | "user";
  text: string;
  stepId?: string;
}

interface ChatBriefingProps {
  agent: BriefingAgent;
  steps: BriefingStep[];
  onComplete: (answers: Record<string, any>) => void;
  onCancel: () => void;
  className?: string;
  /** Plan context for dynamic limits: { maxContents, usedContents, maxArts, usedArts, maxSites, usedSites, planName } */
  context?: Record<string, any>;
}

/* ══════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════ */

/** Interpolate {varName} in agent messages using context */
function interpolateMessage(msg: string, ctx: Record<string, any>, answers: Record<string, any>): string {
  // Build plan limit message
  let planLimitMessage = "";
  if (ctx.maxContents !== undefined) {
    const saldo = Math.max(0, (ctx.maxContents ?? 0) - (ctx.usedContents ?? 0));
    planLimitMessage = `Seu plano ${ctx.planName || ""} permite até ${ctx.maxContents} conteúdos/mês. Você já usou ${ctx.usedContents ?? 0}, então pode criar até ${saldo}.`;
  } else if (ctx.maxArts !== undefined) {
    const saldo = Math.max(0, (ctx.maxArts ?? 0) - (ctx.usedArts ?? 0));
    planLimitMessage = `Seu plano ${ctx.planName || ""} permite até ${ctx.maxArts} artes/mês. Saldo disponível: ${saldo}.`;
  } else if (ctx.maxSites !== undefined) {
    const saldo = Math.max(0, (ctx.maxSites ?? 0) - (ctx.usedSites ?? 0));
    planLimitMessage = saldo > 0
      ? `Seu plano ${ctx.planName || ""} permite até ${ctx.maxSites} sites. Você já tem ${ctx.usedSites ?? 0}.`
      : `⚠️ Seu plano ${ctx.planName || ""} já atingiu o limite de ${ctx.maxSites} sites.`;
  }

  return msg
    .replace(/\{planLimitMessage\}/g, planLimitMessage)
    .replace(/\{planName\}/g, ctx.planName || "")
    .replace(/\{maxContents\}/g, String(ctx.maxContents ?? ""))
    .replace(/\{usedContents\}/g, String(ctx.usedContents ?? ""))
    .replace(/\{maxArts\}/g, String(ctx.maxArts ?? ""))
    .replace(/\{usedArts\}/g, String(ctx.usedArts ?? ""))
    .replace(/\{maxSites\}/g, String(ctx.maxSites ?? ""))
    .replace(/\{usedSites\}/g, String(ctx.usedSites ?? ""))
    .replace(/\{saldo\}/g, String(
      ctx.maxContents !== undefined ? Math.max(0, (ctx.maxContents ?? 0) - (ctx.usedContents ?? 0)) :
      ctx.maxArts !== undefined ? Math.max(0, (ctx.maxArts ?? 0) - (ctx.usedArts ?? 0)) :
      ctx.maxSites !== undefined ? Math.max(0, (ctx.maxSites ?? 0) - (ctx.usedSites ?? 0)) : ""
    ));
}

/* ══════════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════════ */

export function ChatBriefing({ agent, steps, onComplete, onCancel, className, context = {} }: ChatBriefingProps) {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [textValue, setTextValue] = useState("");
  const [multiSelectValues, setMultiSelectValues] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Filter steps based on skipIf
  const activeSteps = useMemo(() => {
    return steps.filter(s => !s.skipIf || !s.skipIf(answers));
  }, [steps, answers]);

  const currentStep = activeSteps[currentStepIdx];
  const progressPct = activeSteps.length > 0 ? Math.round(((currentStepIdx) / activeSteps.length) * 100) : 0;

  // Resolve options for current step (static or dynamic)
  const resolvedOptions = useMemo(() => {
    if (!currentStep) return [];
    if (currentStep.dynamicOptions) {
      return currentStep.dynamicOptions(context, answers);
    }
    return currentStep.options || [];
  }, [currentStep, context, answers]);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 50);
  }, []);

  // Show typing then add agent message
  const addAgentMessage = useCallback((text: string, stepId?: string) => {
    setIsTyping(true);
    scrollToBottom();
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { id: `agent-${Date.now()}-${Math.random()}`, sender: "agent", text, stepId }]);
      scrollToBottom();
    }, 400 + Math.random() * 300);
  }, [scrollToBottom]);

  // Initialize with intro message
  useEffect(() => {
    if (messages.length === 0 && activeSteps.length > 0) {
      const firstStep = activeSteps[0];
      const msg = interpolateMessage(firstStep.agentMessage, context, answers);
      addAgentMessage(msg, firstStep.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Format user answer for display
  const formatAnswer = (step: BriefingStep, value: any): string => {
    if (step.inputType === "multi-select") {
      const allOpts = step.dynamicOptions
        ? step.dynamicOptions(context, answers)
        : step.categories
          ? step.categories.flatMap(c => c.options)
          : (step.options || []);
      const labels = (value as string[]).map(v => allOpts.find(o => o.value === v)?.label || v);
      return labels.join(", ");
    }
    if (step.inputType === "select") {
      const allOpts = step.dynamicOptions
        ? step.dynamicOptions(context, answers)
        : step.categories
          ? step.categories.flatMap(c => c.options)
          : (step.options || []);
      return allOpts.find(o => o.value === value)?.label || value;
    }
    return String(value);
  };

  // Advance to next step
  const advanceStep = useCallback((answer?: any) => {
    if (!currentStep) return;

    // Save answer
    const newAnswers = { ...answers };
    if (currentStep.inputType !== "info" && answer !== undefined) {
      newAnswers[currentStep.id] = answer;
      setAnswers(newAnswers);

      // Add user message
      const displayText = formatAnswer(currentStep, answer);
      setMessages(prev => [...prev, { id: `user-${Date.now()}`, sender: "user", text: displayText, stepId: currentStep.id }]);
    }

    // Reset input state
    setTextValue("");
    setMultiSelectValues([]);

    // Find next step (considering skipIf with updated answers)
    let nextIdx = currentStepIdx + 1;
    while (nextIdx < steps.length) {
      const nextStep = steps[nextIdx];
      if (!nextStep.skipIf || !nextStep.skipIf(newAnswers)) {
        break;
      }
      nextIdx++;
    }

    // Re-calculate active steps with new answers
    const newActiveSteps = steps.filter(s => !s.skipIf || !s.skipIf(newAnswers));
    const nextActiveIdx = newActiveSteps.findIndex((s, i) => i > currentStepIdx && !messages.find(m => m.stepId === s.id && m.sender === "agent"));

    if (nextActiveIdx === -1 || currentStepIdx >= newActiveSteps.length - 1) {
      // We're done
      addAgentMessage("Perfeito! Tenho tudo que preciso. Vamos lá! 🚀");
      setTimeout(() => onComplete(newAnswers), 1200);
      return;
    }

    setCurrentStepIdx(currentStepIdx + 1);
    const nextStep = newActiveSteps[currentStepIdx + 1];

    if (nextStep) {
      const prevSection = currentStep.section;
      const nextSection = nextStep.section;
      const msg = interpolateMessage(nextStep.agentMessage, context, newAnswers);

      if (nextSection && nextSection !== prevSection && currentStep.inputType !== "info") {
        addAgentMessage(`Ótimo! Agora vamos falar sobre **${nextSection}**...`);
        setTimeout(() => {
          addAgentMessage(msg, nextStep.id);
        }, 900);
      } else {
        addAgentMessage(msg, nextStep.id);
      }
    }
  }, [currentStep, currentStepIdx, answers, steps, messages, addAgentMessage, onComplete, context]);

  // Handle undo
  const handleUndo = () => {
    if (currentStepIdx <= 0) return;

    let lastUserMsgIdx = -1;
    for (let i = messages.length - 1; i >= 0; i--) { if (messages[i].sender === "user") { lastUserMsgIdx = i; break; } }
    if (lastUserMsgIdx === -1) return;

    const lastUserMsg = messages[lastUserMsgIdx];
    const stepId = lastUserMsg.stepId;

    if (stepId) {
      setAnswers(prev => {
        const next = { ...prev };
        delete next[stepId];
        return next;
      });
    }

    let prevAgentIdx = -1;
    for (let i = lastUserMsgIdx - 1; i >= 0; i--) { if (messages[i].sender === "agent") { prevAgentIdx = i; break; } }
    setMessages(prev => prev.slice(0, prevAgentIdx === -1 ? 0 : prevAgentIdx + 1));
    setCurrentStepIdx(currentStepIdx - 1);
    setTextValue("");
    setMultiSelectValues([]);
  };

  const handleSelect = (value: string) => { advanceStep(value); };

  const handleMultiConfirm = () => {
    if (multiSelectValues.length === 0 && !currentStep?.optional) return;
    advanceStep(multiSelectValues);
  };

  const handleTextSubmit = () => {
    const val = textValue.trim();
    if (!val && !currentStep?.optional) return;
    advanceStep(val || "");
  };

  const handleInfoAdvance = () => { advanceStep(); };

  const toggleMulti = (value: string) => {
    setMultiSelectValues(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  useEffect(() => { scrollToBottom(); }, [messages, isTyping, scrollToBottom]);

  useEffect(() => {
    if (currentStep && (currentStep.inputType === "text" || currentStep.inputType === "textarea")) {
      setTimeout(() => inputRef.current?.focus(), 500);
    }
  }, [currentStepIdx, currentStep]);

  // Determine which options to show for select/multi-select
  const displayOptions = resolvedOptions;
  const hasCategories = currentStep?.categories && !currentStep?.dynamicOptions;

  return (
    <div className={cn("flex flex-col h-[calc(100vh-12rem)] min-h-[500px] max-h-[700px] border rounded-2xl overflow-hidden bg-background", className)}>
      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-muted/30">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
          style={{ backgroundColor: agent.color }}
        >
          {agent.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold leading-tight">{agent.name}</p>
          <p className="text-[10px] text-muted-foreground">{agent.role}</p>
        </div>
        <div className="flex items-center gap-2">
          {currentStep?.section && (
            <Badge variant="outline" className="text-[9px]">
              {currentStep.section}
            </Badge>
          )}
          <Button variant="ghost" size="sm" className="h-7 text-[10px] text-muted-foreground" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </div>

      {/* ── Progress Bar ── */}
      <Progress value={progressPct} className="h-1 rounded-none" />

      {/* ── Messages Area ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={cn("flex gap-2", msg.sender === "user" ? "justify-end" : "justify-start")}
            >
              {msg.sender === "agent" && (
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5"
                  style={{ backgroundColor: agent.color }}
                >
                  {agent.avatar}
                </div>
              )}
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                  msg.sender === "agent"
                    ? "bg-muted text-foreground rounded-tl-md"
                    : "bg-primary/10 text-foreground rounded-tr-md"
                )}
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(msg.text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'))
                }}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-2 items-center"
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
              style={{ backgroundColor: agent.color }}
            >
              {agent.avatar}
            </div>
            <div className="bg-muted rounded-2xl rounded-tl-md px-4 py-3 flex gap-1">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Input Area ── */}
      {currentStep && !isTyping && messages.some(m => m.stepId === currentStep.id) && (
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

          {/* Select — button grid (static options or dynamic) */}
          {currentStep.inputType === "select" && !hasCategories && displayOptions.length > 0 && (
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
                ref={inputRef as any}
                value={textValue}
                onChange={e => setTextValue(e.target.value)}
                placeholder={currentStep.placeholder || "Digite aqui..."}
                className="flex-1 text-sm"
                onKeyDown={e => e.key === "Enter" && handleTextSubmit()}
              />
              <Button size="sm" onClick={handleTextSubmit} disabled={!textValue.trim() && !currentStep.optional}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Textarea input */}
          {currentStep.inputType === "textarea" && (
            <div className="space-y-2">
              <Textarea
                ref={inputRef as any}
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
      )}
    </div>
  );
}
