import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Bot, Brain, BookOpen, Cog, Play, Activity, Plus, X, Sparkles } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import type { AiAgent } from "@/types/cliente";

interface AgentFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: Partial<AiAgent> | null;
  onSave: (agent: Partial<AiAgent>) => void;
  isSaving: boolean;
}

const defaultAgent: Partial<AiAgent> = {
  name: "",
  description: "",
  status: "draft",
  channel: "whatsapp",
  tags: [],
  persona: { tom: "", estilo: "", personalidade: "" },
  knowledge_base: [],
  prompt_config: { system_prompt: "", temperatura: 0.7, modelo: "gemini-2.5-flash" },
};

export function AgentFormSheet({ open, onOpenChange, agent, onSave, isSaving }: AgentFormSheetProps) {
  const [form, setForm] = useState<Partial<AiAgent>>(defaultAgent);
  const [tagInput, setTagInput] = useState("");
  const [kbInput, setKbInput] = useState("");

  useEffect(() => {
    if (agent) {
      setForm({
        ...defaultAgent,
        ...agent,
        persona: { ...defaultAgent.persona as any, ...(agent.persona as any ?? {}) },
        prompt_config: { ...defaultAgent.prompt_config as any, ...(agent.prompt_config as any ?? {}) },
      });
    } else {
      setForm(defaultAgent);
    }
  }, [agent, open]);

  const persona = (form.persona ?? {}) as Record<string, string>;
  const promptConfig = (form.prompt_config ?? {}) as Record<string, any>;
  const knowledgeBase = (form.knowledge_base ?? []) as string[];

  const updatePersona = (key: string, value: string) =>
    setForm((f) => ({ ...f, persona: { ...persona, [key]: value } }));
  const updatePrompt = (key: string, value: any) =>
    setForm((f) => ({ ...f, prompt_config: { ...promptConfig, [key]: value } }));

  const addTag = () => {
    if (tagInput.trim() && !(form.tags ?? []).includes(tagInput.trim())) {
      setForm((f) => ({ ...f, tags: [...(f.tags ?? []), tagInput.trim()] }));
      setTagInput("");
    }
  };

  const removeTag = (tag: string) =>
    setForm((f) => ({ ...f, tags: (f.tags ?? []).filter((t) => t !== tag) }));

  const addKbEntry = () => {
    if (kbInput.trim()) {
      setForm((f) => ({ ...f, knowledge_base: [...knowledgeBase, kbInput.trim()] }));
      setKbInput("");
    }
  };

  const removeKbEntry = (idx: number) =>
    setForm((f) => ({ ...f, knowledge_base: knowledgeBase.filter((_, i) => i !== idx) }));

  const handleSave = () => onSave(form);

  const isEditing = !!agent?.id;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl w-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            {isEditing ? "Editar Agente" : "Novo Agente"}
          </SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="identidade" className="mt-4">
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="identidade" className="text-xs gap-1"><Bot className="w-3 h-3" /> Identidade</TabsTrigger>
            <TabsTrigger value="persona" className="text-xs gap-1"><Brain className="w-3 h-3" /> Persona</TabsTrigger>
            <TabsTrigger value="knowledge" className="text-xs gap-1"><BookOpen className="w-3 h-3" /> Base</TabsTrigger>
            <TabsTrigger value="prompt" className="text-xs gap-1"><Cog className="w-3 h-3" /> Prompt</TabsTrigger>
            <TabsTrigger value="simulator" className="text-xs gap-1"><Play className="w-3 h-3" /> Simulador</TabsTrigger>
            <TabsTrigger value="diagnostico" className="text-xs gap-1"><Activity className="w-3 h-3" /> Diagnóstico</TabsTrigger>
          </TabsList>

          {/* Identidade */}
          <TabsContent value="identidade" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Nome do Agente *</Label>
              <Input value={form.name ?? ""} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ex: Assistente de Vendas" />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Descreva o propósito deste agente..." rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Canal</Label>
                <Select value={form.channel ?? "whatsapp"} onValueChange={(v) => setForm((f) => ({ ...f, channel: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="email">E-mail</SelectItem>
                    <SelectItem value="website">Website</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status ?? "draft"} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="paused">Pausado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="Adicionar tag..." onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())} />
                <Button type="button" size="icon" variant="outline" onClick={addTag}><Plus className="w-4 h-4" /></Button>
              </div>
              {(form.tags ?? []).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.tags!.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => removeTag(tag)} />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Persona */}
          <TabsContent value="persona" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Tom de Voz</Label>
              <Textarea value={persona.tom ?? ""} onChange={(e) => updatePersona("tom", e.target.value)} placeholder="Ex: Profissional mas amigável, objetivo e empático..." rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Estilo de Comunicação</Label>
              <Textarea value={persona.estilo ?? ""} onChange={(e) => updatePersona("estilo", e.target.value)} placeholder="Ex: Mensagens curtas, uso de emojis moderado, linguagem acessível..." rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Personalidade</Label>
              <Textarea value={persona.personalidade ?? ""} onChange={(e) => updatePersona("personalidade", e.target.value)} placeholder="Ex: Consultivo, proativo na identificação de necessidades..." rows={3} />
            </div>
          </TabsContent>

          {/* Base de Conhecimento */}
          <TabsContent value="knowledge" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">Adicione URLs ou textos de referência que o agente deve usar como base de conhecimento.</p>
            <div className="flex gap-2">
              <Input value={kbInput} onChange={(e) => setKbInput(e.target.value)} placeholder="URL ou texto de referência..." onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKbEntry())} />
              <Button type="button" size="icon" variant="outline" onClick={addKbEntry}><Plus className="w-4 h-4" /></Button>
            </div>
            {knowledgeBase.length > 0 ? (
              <div className="space-y-2">
                {knowledgeBase.map((entry, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2.5 rounded-md border bg-muted/30 text-sm">
                    <span className="flex-1 truncate">{entry}</span>
                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => removeKbEntry(idx)}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">Nenhuma referência adicionada ainda.</div>
            )}
          </TabsContent>

          {/* Engenharia de Prompt */}
          <TabsContent value="prompt" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>System Prompt</Label>
              <Textarea value={promptConfig.system_prompt ?? ""} onChange={(e) => updatePrompt("system_prompt", e.target.value)} placeholder="Você é um assistente especializado em..." rows={8} className="font-mono text-xs" />
            </div>
            <div className="space-y-2">
              <Label>Temperatura: {promptConfig.temperatura ?? 0.7}</Label>
              <Slider value={[promptConfig.temperatura ?? 0.7]} onValueChange={([v]) => updatePrompt("temperatura", v)} min={0} max={1} step={0.1} />
              <p className="text-xs text-muted-foreground">Menor = mais determinístico, maior = mais criativo</p>
            </div>
            <div className="space-y-2">
              <Label>Modelo</Label>
              <Select value={promptConfig.modelo ?? "gemini-2.5-flash"} onValueChange={(v) => updatePrompt("modelo", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                  <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
                  <SelectItem value="gpt-5-mini">GPT-5 Mini</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          {/* Simulador */}
          <TabsContent value="simulator" className="mt-4">
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                <Play className="w-6 h-6 text-muted-foreground/40" />
              </div>
              <Badge variant="outline" className="gap-1.5 mb-3 text-purple-400 border-purple-500/30">
                <Sparkles className="w-3 h-3" /> Em breve
              </Badge>
              <p className="text-sm font-medium">Simulador de conversas</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Em breve você poderá testar seu agente em tempo real antes de ativá-lo.
              </p>
            </div>
          </TabsContent>

          {/* Diagnóstico */}
          <TabsContent value="diagnostico" className="mt-4">
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                <Activity className="w-6 h-6 text-muted-foreground/40" />
              </div>
              <Badge variant="outline" className="gap-1.5 mb-3 text-purple-400 border-purple-500/30">
                <Sparkles className="w-3 h-3" /> Em breve
              </Badge>
              <p className="text-sm font-medium">Diagnóstico do agente</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Métricas de desempenho, taxa de resolução e logs de conversas estarão disponíveis aqui.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!form.name?.trim() || isSaving}>
            {isSaving ? "Salvando..." : isEditing ? "Salvar alterações" : "Criar agente"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
