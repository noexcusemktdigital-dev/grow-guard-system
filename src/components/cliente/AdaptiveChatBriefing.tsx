// @ts-nocheck
/**
 * AdaptiveChatBriefing
 * Briefing 100% adaptativo: cada pergunta é gerada pela edge function
 * `get-next-gps-question` com base nas respostas anteriores.
 *
 * Mantém o look-and-feel do ChatBriefing (avatar do agente, balões, typing indicator)
 * porém com perguntas dinâmicas — não recebe `steps` estáticos.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Send, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { invokeEdge } from "@/lib/edge";
import type { BriefingAgent } from "./ChatBriefing";

const MAX_QUESTIONS = 15;

type AIQuestion = {
  question: string;
  type: "text" | "select" | "multiselect" | "number" | "textarea";
  options?: string[];
  placeholder?: string;
};

type ChatMessage = {
  id: string;
  sender: "agent" | "user";
  text: string;
  questionKey?: string;
};

interface Props {
  agent: BriefingAgent;
  section: "marketing" | "comercial";
  /** Respostas iniciais (ex: respostas da seção anterior já coletadas) */
  initialAnswers?: Record<string, any>;
  onComplete: (answers: Record<string, any>) => void;
  onCancel: () => void;
  className?: string;
}

function uid() {
  return Math.random().toString(36).slice(2);
}

/** Converte a pergunta da IA em uma chave estável para uso como key no objeto answers */
function questionToKey(q: string, idx: number): string {
  const slug = q
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
  return `q${idx + 1}_${slug || "item"}`;
}

export function AdaptiveChatBriefing({
  agent,
  section,
  initialAnswers = {},
  onComplete,
  onCancel,
  className,
}: Props) {
  const [answers, setAnswers] = useState<Record<string, any>>(initialAnswers);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<AIQuestion | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [questionKeys, setQuestionKeys] = useState<string[]>([]); // ordem das chaves p/ undo
  const [loadingNext, setLoadingNext] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [textValue, setTextValue] = useState("");
  const [multiValues, setMultiValues] = useState<string[]>([]);
  const completedRef = useRef(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  }, []);

  const addAgentMessage = useCallback((text: string, questionKey?: string) => {
    setMessages((prev) => [...prev, { id: uid(), sender: "agent", text, questionKey }]);
  }, []);

  const addUserMessage = useCallback((text: string, questionKey?: string) => {
    setMessages((prev) => [...prev, { id: uid(), sender: "user", text, questionKey }]);
  }, []);

  // Busca a próxima pergunta da edge function
  const fetchNextQuestion = useCallback(
    async (answersSoFar: Record<string, any>, idx: number) => {
      setLoadingNext(true);
      setErrorMsg(null);
      try {
        const { data, error } = await invokeEdge("get-next-gps-question", {
          body: {
            answers_so_far: answersSoFar,
            question_index: idx,
            section,
          },
        });
        if (error) throw error;

        if (data?.error) throw new Error(data.error);

        if (data?.done || idx >= MAX_QUESTIONS) {
          if (!completedRef.current) {
            completedRef.current = true;
            // Pequeno delay para finalizar a animação
            setTimeout(() => onComplete(answersSoFar), 600);
          }
          return;
        }

        if (!data?.question || !data?.type) {
          throw new Error("Resposta inválida da IA");
        }

        const q: AIQuestion = {
          question: data.question,
          type: data.type,
          options: data.options,
          placeholder: data.placeholder,
        };
        setCurrentQuestion(q);
        const key = questionToKey(q.question, idx);
        setQuestionKeys((prev) => [...prev, key]);
        addAgentMessage(q.question, key);
      } catch (e: any) {
        const msg = e?.message || String(e) || "Falha ao buscar próxima pergunta";
        setErrorMsg(msg);
      } finally {
        setLoadingNext(false);
      }
    },
    [section, onComplete, addAgentMessage]
  );

  // Inicializa
  useEffect(() => {
    if (messages.length === 0 && !currentQuestion && !loadingNext) {
      fetchNextQuestion(initialAnswers, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loadingNext, scrollToBottom]);

  useEffect(() => {
    if (currentQuestion && (currentQuestion.type === "text" || currentQuestion.type === "textarea" || currentQuestion.type === "number")) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [currentQuestion]);

  const submitAnswer = useCallback(
    async (rawValue: any, displayText?: string) => {
      if (!currentQuestion) return;
      const key = questionKeys[questionKeys.length - 1] || questionToKey(currentQuestion.question, questionIndex);

      const display =
        displayText ??
        (Array.isArray(rawValue) ? rawValue.join(", ") : String(rawValue ?? ""));

      addUserMessage(display, key);
      const newAnswers = { ...answers, [key]: rawValue };
      setAnswers(newAnswers);
      setCurrentQuestion(null);
      setTextValue("");
      setMultiValues([]);

      const nextIdx = questionIndex + 1;
      setQuestionIndex(nextIdx);
      await fetchNextQuestion(newAnswers, nextIdx);
    },
    [currentQuestion, questionKeys, questionIndex, answers, addUserMessage, fetchNextQuestion]
  );

  const handleUndo = useCallback(() => {
    if (questionKeys.length === 0 || loadingNext) return;
    const lastKey = questionKeys[questionKeys.length - 1];
    // Remove última pergunta (agent) e a resposta (user) dos messages
    setMessages((prev) => {
      // Encontrar último user msg com lastKey
      let lastUserIdx = -1;
      for (let i = prev.length - 1; i >= 0; i--) {
        if (prev[i].sender === "user" && prev[i].questionKey === lastKey) {
          lastUserIdx = i;
          break;
        }
      }
      if (lastUserIdx === -1) return prev;
      // Encontrar agent message imediatamente antes
      let agentIdx = -1;
      for (let i = lastUserIdx - 1; i >= 0; i--) {
        if (prev[i].sender === "agent" && prev[i].questionKey === lastKey) {
          agentIdx = i;
          break;
        }
      }
      return prev.slice(0, agentIdx === -1 ? lastUserIdx : agentIdx);
    });

    setAnswers((prev) => {
      const next = { ...prev };
      delete next[lastKey];
      return next;
    });
    setQuestionKeys((prev) => prev.slice(0, -1));
    const newIdx = Math.max(0, questionIndex - 1);
    setQuestionIndex(newIdx);
    setCurrentQuestion(null);
    setTextValue("");
    setMultiValues([]);
    // Re-buscar a pergunta naquele índice com answers atualizadas
    setTimeout(() => {
      const updatedAnswers = { ...answers };
      delete updatedAnswers[lastKey];
      fetchNextQuestion(updatedAnswers, newIdx);
    }, 100);
  }, [questionKeys, loadingNext, questionIndex, answers, fetchNextQuestion]);

  const handleRetry = useCallback(() => {
    fetchNextQuestion(answers, questionIndex);
  }, [answers, questionIndex, fetchNextQuestion]);

  const toggleMulti = (val: string) => {
    setMultiValues((prev) => (prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]));
  };

  const progressPct = useMemo(() => Math.min(100, Math.round((questionIndex / MAX_QUESTIONS) * 100)), [questionIndex]);

  return (
    <div className={cn("flex flex-col h-[calc(100vh-12rem)] min-h-[500px] max-h-[700px] border rounded-2xl overflow-hidden bg-background", className)}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-muted/30">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
          style={{ backgroundColor: agent.color }}
        >
          {agent.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold leading-tight">{agent.name}</p>
          <p className="text-[10px] text-muted-foreground">{agent.role} · perguntas adaptativas</p>
        </div>
        <Badge variant="outline" className="text-[9px]">
          {section === "comercial" ? "comercial" : "marketing"}
        </Badge>
        <Badge variant="outline" className="text-[9px]">
          {Math.min(questionIndex + (currentQuestion ? 1 : 0), MAX_QUESTIONS)}/{MAX_QUESTIONS}
        </Badge>
        <Button variant="ghost" size="sm" className="h-7 text-[10px] text-muted-foreground" onClick={onCancel}>
          Cancelar
        </Button>
      </div>

      {/* Progress */}
      <Progress value={progressPct} className="h-1 rounded-none" />

      {/* Messages */}
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
                  "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
                  msg.sender === "agent"
                    ? "bg-muted text-foreground rounded-tl-md"
                    : "bg-primary/10 text-foreground rounded-tr-md"
                )}
              >
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loadingNext && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 items-center">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
              style={{ backgroundColor: agent.color }}
            >
              {agent.avatar}
            </div>
            <div className="bg-muted rounded-2xl rounded-tl-md px-4 py-3 flex gap-1 items-center">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
              <span className="text-[10px] text-muted-foreground ml-2">pensando…</span>
            </div>
          </motion.div>
        )}

        {errorMsg && (
          <div className="bg-destructive/10 text-destructive rounded-xl p-3 text-xs space-y-2">
            <p>{errorMsg}</p>
            <Button size="sm" variant="outline" onClick={handleRetry}>
              Tentar novamente
            </Button>
          </div>
        )}
      </div>

      {/* Input area */}
      {currentQuestion && !loadingNext && (
        <div className="border-t bg-muted/20 p-3 space-y-2">
          {currentQuestion.type === "select" && currentQuestion.options && (
            <div className="flex flex-wrap gap-2">
              {currentQuestion.options.map((opt) => (
                <Button
                  key={opt}
                  variant="outline"
                  size="sm"
                  className="rounded-full text-xs"
                  onClick={() => submitAnswer(opt)}
                >
                  {opt}
                </Button>
              ))}
            </div>
          )}

          {currentQuestion.type === "multiselect" && currentQuestion.options && (
            <>
              <div className="flex flex-wrap gap-2">
                {currentQuestion.options.map((opt) => {
                  const active = multiValues.includes(opt);
                  return (
                    <Button
                      key={opt}
                      variant={active ? "default" : "outline"}
                      size="sm"
                      className="rounded-full text-xs"
                      onClick={() => toggleMulti(opt)}
                    >
                      {opt}
                    </Button>
                  );
                })}
              </div>
              <div className="flex justify-end gap-2">
                <Button size="sm" disabled={multiValues.length === 0} onClick={() => submitAnswer(multiValues, multiValues.join(", "))}>
                  Confirmar ({multiValues.length})
                </Button>
              </div>
            </>
          )}

          {(currentQuestion.type === "text" || currentQuestion.type === "number") && (
            <div className="flex gap-2">
              <Input
                ref={inputRef as any}
                type={currentQuestion.type === "number" ? "number" : "text"}
                placeholder={currentQuestion.placeholder || "Digite sua resposta…"}
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && textValue.trim()) {
                    e.preventDefault();
                    submitAnswer(currentQuestion.type === "number" ? Number(textValue) : textValue.trim());
                  }
                }}
              />
              <Button size="icon" disabled={!textValue.trim()} aria-label="Enviar resposta" onClick={() => submitAnswer(currentQuestion.type === "number" ? Number(textValue) : textValue.trim())}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          )}

          {currentQuestion.type === "textarea" && (
            <div className="flex gap-2 items-end">
              <Textarea
                ref={inputRef as any}
                placeholder={currentQuestion.placeholder || "Descreva com detalhes…"}
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <Button size="icon" disabled={!textValue.trim()} aria-label="Enviar resposta" onClick={() => submitAnswer(textValue.trim())}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          )}

          <div className="flex justify-between items-center pt-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[10px] text-muted-foreground gap-1"
              onClick={handleUndo}
              disabled={questionKeys.length <= 1 || loadingNext}
            >
              <Undo2 className="w-3 h-3" /> Voltar
            </Button>
            {currentQuestion.type !== "multiselect" && currentQuestion.type !== "select" && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[10px] text-muted-foreground"
                onClick={() => submitAnswer("não sei", "Não sei / pular")}
              >
                Pular
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Loading inicial sem currentQuestion ainda */}
      {!currentQuestion && loadingNext && messages.length === 0 && (
        <div className="border-t p-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Preparando primeira pergunta…
        </div>
      )}
    </div>
  );
}
