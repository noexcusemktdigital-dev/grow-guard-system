import { useState, useEffect, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Brain, BookOpen, Cog, Play, Plus, X, Sparkles, Upload, FileText, Link, MessageSquare, Send, Loader2, User, Camera, Trash2, Lock, ChevronRight, Clock, Shield, RotateCcw, History } from "lucide-react";
import { useAgentStats } from "@/hooks/useClienteAgents";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supabase";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { useWhatsAppInstances } from "@/hooks/useWhatsApp";
import { useQueryClient } from "@tanstack/react-query";
import type { AiAgent, AgentRole } from "@/types/cliente";
import { agentRoleConfig } from "@/types/cliente";

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
  role: "sdr",
  gender: null,
  objectives: [],
  crm_actions: { can_move_stage: false, can_update_value: false, can_add_tags: false, can_handoff: true, can_create_tasks: false },
  whatsapp_instance_ids: [],
  persona: { greeting: "informal", formality: "profissional", emojis: "pouco", message_length: "medias", traits: [], restrictions: "" },
  knowledge_base: [],
  prompt_config: { system_prompt: "", temperatura: 0.7, modelo: "gemini-2.5-flash" },
};

interface KBEntry {
  type: "url" | "file" | "text";
  content: string;
  name?: string;
  url?: string;
  size?: number;
}

type TabKey = "identidade" | "persona" | "knowledge" | "prompt" | "simulator" | "historico";

export function AgentFormSheet({ open, onOpenChange, agent, onSave, isSaving }: AgentFormSheetProps) {
  const [form, setForm] = useState<Partial<AiAgent>>(defaultAgent);
  const [activeTab, setActiveTab] = useState<TabKey>("identidade");
  const [urlInput, setUrlInput] = useState("");
  const [textInput, setTextInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [simMessages, setSimMessages] = useState<{ role: string; content: string }[]>([]);
  const [simInput, setSimInput] = useState("");
  const [simLoading, setSimLoading] = useState(false);
  const [syncingPhone, setSyncingPhone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const { data: orgId } = useUserOrgId();
  const { data: whatsappInstances } = useWhatsAppInstances();
  const queryClient = useQueryClient();
  const isEditing = !!agent?.id;
  const { data: agentStats } = useAgentStats(isEditing ? agent?.id ?? null : null);

  useEffect(() => {
    if (agent) {
      setForm({
        ...defaultAgent,
        ...agent,
        persona: { ...(defaultAgent.persona as Record<string, unknown>), ...((agent.persona as Record<string, unknown>) ?? {}) },
        prompt_config: { ...(defaultAgent.prompt_config as Record<string, unknown>), ...((agent.prompt_config as Record<string, unknown>) ?? {}) },
        crm_actions: { ...(defaultAgent.crm_actions as Record<string, unknown>), ...((agent.crm_actions as Record<string, unknown>) ?? {}) },
        objectives: agent.objectives ?? [],
        whatsapp_instance_ids: agent.whatsapp_instance_ids ?? [],
      });
    } else {
      setForm(defaultAgent);
      setActiveTab("identidade");
    }
    setSimMessages([]);
  }, [agent, open]);

  // Auto-sync: fetch phone number for connected instances missing it
  useEffect(() => {
    if (!open || !whatsappInstances || whatsappInstances.length === 0) return;
    const needsSync = whatsappInstances.some(
      (inst) => inst.status === "connected" && !inst.phone_number
    );
    if (needsSync && !syncingPhone) {
      setSyncingPhone(true);
      supabase.functions.invoke("whatsapp-setup", { body: { action: "check-status" } })
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["whatsapp-instances"] });
        })
        .finally(() => setSyncingPhone(false));
    }
  }, [open, whatsappInstances]);

  const persona = (form.persona ?? {}) as Record<string, any>;
  const promptConfig = (form.prompt_config ?? {}) as Record<string, any>;
  const crmActions = (form.crm_actions ?? {}) as Record<string, any>;
  const knowledgeBase = ((form.knowledge_base ?? []) as KBEntry[]);

  // ─── Step completion logic ───
  const isStep1Complete = !!(form.name?.trim() && form.role && form.gender);
  const isStep2Complete = !!(persona.greeting && (persona.traits ?? []).length >= 1);
  const isStep3Complete = knowledgeBase.length > 0;
  const isStep4Complete = !!(promptConfig.system_prompt?.trim());

  const canAccessTab = (tab: TabKey): boolean => {
    if (isEditing) return true;
    switch (tab) {
      case "identidade": return true;
      case "persona": return isStep1Complete;
      case "knowledge": return isStep1Complete && isStep2Complete;
      case "prompt": return isStep1Complete && isStep2Complete && isStep3Complete;
      case "simulator": return isStep1Complete && isStep2Complete && isStep3Complete && isStep4Complete;
      default: return false;
    }
  };

  const nextTab: Record<TabKey, TabKey | null> = {
    identidade: "persona",
    persona: "knowledge",
    knowledge: "prompt",
    prompt: "simulator",
    simulator: isEditing ? "historico" : null,
    historico: null,
  };

  const goNext = () => {
    const next = nextTab[activeTab];
    if (next && canAccessTab(next)) setActiveTab(next);
  };

  const updatePersona = (key: string, value: unknown) => setForm((f) => ({ ...f, persona: { ...persona, [key]: value } }));
  const updatePrompt = (key: string, value: unknown) => setForm((f) => ({ ...f, prompt_config: { ...promptConfig, [key]: value } }));
  const updateCrmAction = (key: string, value: boolean) => setForm((f) => ({ ...f, crm_actions: { ...crmActions, [key]: value } }));

  const engagementRules = promptConfig.engagement_rules || { max_messages: 10, inactivity_timeout_hours: 48, timeout_action: "handoff", limit_action: "handoff", working_hours: { enabled: false, start: "08:00", end: "18:00" } };
  const followupConfig = promptConfig.followup || { enabled: false, delay_hours: 24, max_attempts: 3, style: "ai_generated" };
  const objectionsConfig = promptConfig.objections || [];

  const updateEngagement = (key: string, value: unknown) => {
    updatePrompt("engagement_rules", { ...engagementRules, [key]: value });
  };
  const updateWorkingHours = (key: string, value: unknown) => {
    updateEngagement("working_hours", { ...engagementRules.working_hours, [key]: value });
  };
  const updateFollowup = (key: string, value: unknown) => {
    updatePrompt("followup", { ...followupConfig, [key]: value });
  };
  const addObjection = () => {
    updatePrompt("objections", [...objectionsConfig, { objection: "", response: "" }]);
  };
  const updateObjection = (idx: number, field: string, value: string) => {
    const updated = [...objectionsConfig];
    updated[idx] = { ...updated[idx], [field]: value };
    updatePrompt("objections", updated);
  };
  const removeObjection = (idx: number) => {
    updatePrompt("objections", objectionsConfig.filter((_: Record<string, unknown>, i: number) => i !== idx));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !orgId) return;
    setUploading(true);
    try {
      const path = `${orgId}/avatars/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from("agent-knowledge").upload(path, file);
      if (error) { console.error("Avatar upload error:", error); return; }
      const { data: urlData } = supabase.storage.from("agent-knowledge").getPublicUrl(path);
      setForm((f) => ({ ...f, avatar_url: urlData.publicUrl }));
    } finally {
      setUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const addKbUrl = () => {
    if (urlInput.trim()) {
      setForm((f) => ({ ...f, knowledge_base: [...knowledgeBase, { type: "url" as const, content: urlInput.trim() }] }));
      setUrlInput("");
    }
  };

  const addKbText = () => {
    if (textInput.trim()) {
      setForm((f) => ({ ...f, knowledge_base: [...knowledgeBase, { type: "text" as const, content: textInput.trim() }] }));
      setTextInput("");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !orgId) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const agentId = agent?.id || "new";
        const path = `${orgId}/${agentId}/${Date.now()}_${file.name}`;
        const { data, error } = await supabase.storage.from("agent-knowledge").upload(path, file);
        if (error) { console.error("Upload error:", error); continue; }
        const { data: urlData } = supabase.storage.from("agent-knowledge").getPublicUrl(path);
        const entry: KBEntry = { type: "file", content: urlData.publicUrl, name: file.name, url: urlData.publicUrl, size: file.size };
        setForm((f) => ({ ...f, knowledge_base: [...(f.knowledge_base as KBEntry[] ?? []), entry] }));
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeKbEntry = (idx: number) => setForm((f) => ({ ...f, knowledge_base: knowledgeBase.filter((_, i) => i !== idx) }));

  const toggleObjective = (obj: string) => {
    const current = form.objectives ?? [];
    const exists = current.includes(obj);
    setForm((f) => ({ ...f, objectives: exists ? current.filter((o: string) => o !== obj) : [...current, obj] }));
  };

  const handleGeneratePersona = async () => {
    setGenerating("persona");
    try {
      const { data } = await supabase.functions.invoke("ai-generate-agent-config", {
        body: { type: "persona", role: form.role, persona, name: form.name },
      });
      if (data?.result) updatePersona("generated_description", data.result);
    } finally { setGenerating(null); }
  };

  const handleGenerateGreeting = async () => {
    setGenerating("greeting");
    try {
      const { data } = await supabase.functions.invoke("ai-generate-agent-config", {
        body: { type: "greeting", role: form.role, persona, name: form.name },
      });
      if (data?.result) updatePersona("custom_greeting", data.result);
    } finally { setGenerating(null); }
  };

  const handleGeneratePrompt = async () => {
    setGenerating("prompt");
    try {
      const { data } = await supabase.functions.invoke("ai-generate-agent-config", {
        body: { type: "prompt", role: form.role, persona, knowledge_base: knowledgeBase, objectives: form.objectives, name: form.name },
      });
      if (data?.result) updatePrompt("system_prompt", data.result);
    } finally { setGenerating(null); }
  };

  const handleSimulate = async () => {
    if (!simInput.trim()) return;
    const userMsg = { role: "user", content: simInput };
    setSimMessages((m) => [...m, userMsg]);
    setSimInput("");
    setSimLoading(true);
    try {
      const { data } = await supabase.functions.invoke("ai-agent-simulate", {
        body: { agent_config: form, message: simInput, history: simMessages },
      });
      if (data?.reply) {
        setSimMessages((m) => [...m, { role: "assistant", content: data.reply }]);
      }
    } finally { setSimLoading(false); }
  };

  const handleSave = () => onSave(form);
  const roleInfo = agentRoleConfig[(form.role as AgentRole) ?? "sdr"];

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: "identidade", label: "Identidade", icon: <Bot className="w-3 h-3" /> },
    { key: "persona", label: "Persona", icon: <Brain className="w-3 h-3" /> },
    { key: "knowledge", label: "Base", icon: <BookOpen className="w-3 h-3" /> },
    { key: "prompt", label: "Prompt", icon: <Cog className="w-3 h-3" /> },
    { key: "simulator", label: "Simulador", icon: <Play className="w-3 h-3" /> },
    ...(isEditing ? [{ key: "historico" as TabKey, label: "Histórico", icon: <History className="w-3 h-3" /> }] : []),
  ];

  const NextButton = ({ disabled }: { disabled?: boolean }) => {
    const next = nextTab[activeTab];
    if (!next) return null;
    return (
      <div className="pt-4 flex justify-end">
        <Button type="button" onClick={goNext} disabled={disabled || !canAccessTab(next)} className="gap-1.5">
          Próximo <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl w-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            {isEditing ? "Editar Agente" : "Novo Agente"}
          </SheetTitle>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={(v) => canAccessTab(v as TabKey) && setActiveTab(v as TabKey)} className="mt-4">
          <TabsList className={`grid w-full ${isEditing ? "grid-cols-6" : "grid-cols-5"}`}>
            {tabs.map((tab) => {
              const accessible = canAccessTab(tab.key);
              return (
                <TabsTrigger
                  key={tab.key}
                  value={tab.key}
                  disabled={!accessible}
                  className={`text-xs gap-1 ${!accessible ? "opacity-40 cursor-not-allowed" : ""}`}
                >
                  {!accessible ? <Lock className="w-3 h-3" /> : tab.icon}
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* ─── Aba 1: Identidade ─── */}
          <TabsContent value="identidade" className="space-y-4 mt-4">
            {/* Avatar Upload */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0 border-2 border-dashed border-muted-foreground/30 relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                {form.avatar_url ? (
                  <img src={form.avatar_url} alt="Avatar" className="w-16 h-16 rounded-full object-cover" />
                ) : (
                  <Camera className="w-6 h-6 text-muted-foreground/40" />
                )}
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-5 h-5 text-white" />
                </div>
              </div>
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Foto do agente</Label>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => avatarInputRef.current?.click()} disabled={uploading}>
                    {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                    {form.avatar_url ? "Alterar foto" : "Enviar foto"}
                  </Button>
                  {form.avatar_url && (
                    <Button type="button" variant="ghost" size="sm" className="h-7 text-xs gap-1 text-destructive" onClick={() => setForm((f) => ({ ...f, avatar_url: null }))}>
                      <Trash2 className="w-3 h-3" /> Remover
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nome do Agente *</Label>
              <Input value={form.name ?? ""} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ex: Ana — SDR de Vendas" />
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Descreva brevemente o propósito deste agente..." rows={2} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Função *</Label>
                <Select value={form.role ?? "sdr"} onValueChange={(v) => setForm((f) => ({ ...f, role: v as AgentRole }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(agentRoleConfig).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{cfg.label} — {cfg.description}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sexo *</Label>
                <RadioGroup value={form.gender ?? ""} onValueChange={(v) => setForm((f) => ({ ...f, gender: v }))} className="flex gap-4 pt-2">
                  <div className="flex items-center gap-1.5"><RadioGroupItem value="masculino" id="m" /><Label htmlFor="m" className="text-xs font-normal">Masculino</Label></div>
                  <div className="flex items-center gap-1.5"><RadioGroupItem value="feminino" id="f" /><Label htmlFor="f" className="text-xs font-normal">Feminino</Label></div>
                </RadioGroup>
              </div>
            </div>

            {/* ─── Role Explainer Card ─── */}
            {form.role && (
              <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Badge className={`text-xs ${roleInfo.color}`}>{roleInfo.label}</Badge>
                  <span className="text-xs font-medium">{roleInfo.description}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{roleInfo.longDescription}</p>
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Fluxo de trabalho</p>
                  <div className="space-y-1.5">
                    {roleInfo.workflow.map((step, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0 mt-0.5">{i + 1}</div>
                        <p className="text-xs">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Objetivos padrão</p>
                  <div className="flex flex-wrap gap-1">
                    {roleInfo.objectives.map((obj) => (
                      <Badge key={obj} variant="outline" className="text-[9px]">{obj}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Número de WhatsApp</Label>
              {whatsappInstances && whatsappInstances.length > 0 ? (
                <div className="space-y-2 pt-1">
                  {whatsappInstances.filter((inst) => inst.status === "connected").map((inst) => (
                    <div key={inst.id} className="flex items-center gap-2">
                      <Checkbox
                        checked={(form.whatsapp_instance_ids ?? []).includes(inst.id)}
                        onCheckedChange={(checked) => {
                          const ids = form.whatsapp_instance_ids ?? [];
                          setForm((f) => ({
                            ...f,
                            whatsapp_instance_ids: checked ? [...ids, inst.id] : ids.filter((i: string) => i !== inst.id),
                          }));
                        }}
                      />
                      <span className="text-xs">
                        {inst.phone_number
                          ? `${inst.label ? inst.label + " — " : ""}${inst.phone_number}`
                          : inst.label || `Instância ${inst.instance_id.slice(0, 8)}...`}
                      </span>
                    </div>
                  ))}
                  {syncingPhone && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Loader2 className="w-3 h-3 animate-spin" /> Sincronizando números...
                    </div>
                  )}
                  {whatsappInstances.filter((inst) => inst.status === "connected").length === 0 && (
                    <p className="text-xs text-muted-foreground">Nenhum número conectado</p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground pt-2">Nenhum WhatsApp configurado</p>
              )}
            </div>

            {!isEditing && (
              <div className="text-xs text-muted-foreground bg-muted/30 rounded-md p-3">
                Preencha <strong>Nome</strong>, <strong>Função</strong> e <strong>Sexo</strong> para desbloquear a próxima etapa.
              </div>
            )}

            <NextButton disabled={!isStep1Complete} />
          </TabsContent>

          {/* ─── Aba 2: Persona (Guiada) ─── */}
          <TabsContent value="persona" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Como o agente deve cumprimentar?</Label>
              <Select value={persona.greeting ?? "informal"} onValueChange={(v) => updatePersona("greeting", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="formal">Formal — "Prezado(a), bom dia..."</SelectItem>
                  <SelectItem value="informal">Informal — "Oi! Tudo bem?"</SelectItem>
                  <SelectItem value="personalizado">Personalizado</SelectItem>
                </SelectContent>
              </Select>
              {persona.greeting === "personalizado" && (
                <div className="space-y-2">
                  <Textarea placeholder="Digite a saudação personalizada..." value={persona.custom_greeting ?? ""} onChange={(e) => updatePersona("custom_greeting", e.target.value)} rows={2} />
                  <Button type="button" variant="outline" size="sm" className="gap-1.5 h-7 text-xs" onClick={handleGenerateGreeting} disabled={generating === "greeting"}>
                    {generating === "greeting" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    Gerar saudação com IA
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Nível de formalidade</Label>
              <Select value={persona.formality ?? "profissional"} onValueChange={(v) => updatePersona("formality", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="muito_formal">Muito formal</SelectItem>
                  <SelectItem value="profissional">Profissional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="descontraido">Descontraído</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Uso de emojis</Label>
              <Select value={persona.emojis ?? "pouco"} onValueChange={(v) => updatePersona("emojis", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nunca">Nunca</SelectItem>
                  <SelectItem value="pouco">Pouco</SelectItem>
                  <SelectItem value="moderado">Moderado</SelectItem>
                  <SelectItem value="bastante">Bastante</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Comprimento das mensagens</Label>
              <Select value={persona.message_length ?? "medias"} onValueChange={(v) => updatePersona("message_length", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="curtas">Curtas e diretas</SelectItem>
                  <SelectItem value="medias">Médias</SelectItem>
                  <SelectItem value="detalhadas">Detalhadas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Personalidade (selecione pelo menos 1) *</Label>
              <div className="flex flex-wrap gap-2">
                {["Empático", "Consultivo", "Proativo", "Objetivo", "Paciente", "Persuasivo"].map((trait) => {
                  const selected = (persona.traits ?? []).includes(trait);
                  return (
                    <Badge
                      key={trait}
                      variant={selected ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        const traits = persona.traits ?? [];
                        updatePersona("traits", selected ? traits.filter((t: string) => t !== trait) : [...traits, trait]);
                      }}
                    >
                      {trait}
                    </Badge>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Restrições — O que o agente NÃO deve fazer</Label>
              <Textarea value={persona.restrictions ?? ""} onChange={(e) => updatePersona("restrictions", e.target.value)} placeholder="Ex: Não falar de preços, não prometer prazos, não mencionar concorrentes..." rows={3} />
            </div>

            {persona.generated_description && (
              <div className="space-y-2">
                <Label>Persona gerada pela IA (editável)</Label>
                <Textarea value={persona.generated_description} onChange={(e) => updatePersona("generated_description", e.target.value)} rows={4} />
              </div>
            )}

            <Button variant="outline" className="gap-2 w-full" onClick={handleGeneratePersona} disabled={generating === "persona"}>
              {generating === "persona" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Gerar descrição da persona com IA
            </Button>

            {!isEditing && (
              <div className="text-xs text-muted-foreground bg-muted/30 rounded-md p-3">
                Selecione uma <strong>saudação</strong> e pelo menos <strong>1 personalidade</strong> para avançar.
              </div>
            )}

            <NextButton disabled={!isStep2Complete} />
          </TabsContent>

          {/* ─── Aba 3: Base de Conhecimento ─── */}
          <TabsContent value="knowledge" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">Adicione links, arquivos ou textos para treinar a base de conhecimento do agente.</p>

            {/* URLs */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Link className="w-3.5 h-3.5" /> Links / URLs</Label>
              <div className="flex gap-2">
                <Input value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="https://exemplo.com/pagina" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKbUrl())} />
                <Button type="button" size="icon" variant="outline" onClick={addKbUrl} aria-label="Adicionar"><Plus className="w-4 h-4" /></Button>
              </div>
            </div>

            {/* Files */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Arquivos</Label>
              <input ref={fileInputRef} type="file" multiple accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg" className="hidden" onChange={handleFileUpload} />
              <Button variant="outline" className="w-full gap-2" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading ? "Enviando..." : "Fazer upload de arquivos"}
              </Button>
            </div>

            {/* Text */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" /> Texto manual</Label>
              <Textarea value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder="Cole aqui informações, FAQ, regras do negócio..." rows={3} />
              <Button variant="outline" size="sm" onClick={addKbText} disabled={!textInput.trim()}>Adicionar texto</Button>
            </div>

            {/* List */}
            {knowledgeBase.length > 0 ? (
              <div className="space-y-2 pt-2 border-t">
                <Label className="text-xs text-muted-foreground">{knowledgeBase.length} item(ns) adicionado(s)</Label>
                {knowledgeBase.map((entry, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2.5 rounded-md border bg-muted/30 text-sm">
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {typeof entry === "string" ? "texto" : entry.type}
                    </Badge>
                    <span className="flex-1 truncate text-xs">
                      {typeof entry === "string" ? entry : entry.name || entry.content}
                    </span>
                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => removeKbEntry(idx)} aria-label="Fechar">
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground text-sm border rounded-md border-dashed">Nenhuma referência adicionada ainda.</div>
            )}

            {!isEditing && (
              <div className="text-xs text-muted-foreground bg-muted/30 rounded-md p-3">
                Adicione pelo menos <strong>1 item</strong> à base de conhecimento para avançar.
              </div>
            )}

            <NextButton disabled={!isStep3Complete} />
          </TabsContent>

          {/* ─── Aba 4: Prompt e Objetivos ─── */}
          <TabsContent value="prompt" className="space-y-4 mt-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>System Prompt</Label>
                <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs" onClick={handleGeneratePrompt} disabled={generating === "prompt"}>
                  {generating === "prompt" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  Gerar com IA
                </Button>
              </div>
              <Textarea value={promptConfig.system_prompt ?? ""} onChange={(e) => updatePrompt("system_prompt", e.target.value)} placeholder="Você é um assistente especializado em..." rows={8} className="font-mono text-xs" />
            </div>

            {/* Objectives by role */}
            <div className="space-y-2 pt-4 border-t">
              <Label>Objetivos do Agente ({roleInfo.label})</Label>
              <p className="text-xs text-muted-foreground">Selecione os objetivos que este agente deve perseguir:</p>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {roleInfo.objectives.map((obj) => {
                  const selected = (form.objectives ?? []).includes(obj);
                  return (
                    <div key={obj} className="flex items-center gap-2">
                      <Checkbox checked={selected} onCheckedChange={() => toggleObjective(obj)} />
                      <span className="text-sm">{obj}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CRM Actions */}
            <div className="space-y-2 pt-4 border-t">
              <Label>Ações permitidas no CRM</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: "can_move_stage", label: "Mover lead de etapa" },
                  { key: "can_update_value", label: "Atualizar valor" },
                  { key: "can_add_tags", label: "Adicionar tags" },
                  { key: "can_handoff", label: "Transferir para atendente humano" },
                  { key: "can_create_tasks", label: "Criar tarefas" },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-2">
                    <Checkbox checked={crmActions[key] ?? false} onCheckedChange={(v) => updateCrmAction(key, !!v)} />
                    <span className="text-sm">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Engagement Rules */}
            <div className="space-y-3 pt-4 border-t">
              <Label className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Regras de Engajamento</Label>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Limite de mensagens por conversa</Label>
                  <Input type="number" min={5} max={200} value={engagementRules.max_messages} onChange={(e) => updateEngagement("max_messages", parseInt(e.target.value) || 10)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Ação ao atingir limite</Label>
                  <Select value={engagementRules.limit_action || "handoff"} onValueChange={(v) => updateEngagement("limit_action", v)}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="handoff">Transferir para humano</SelectItem>
                      <SelectItem value="ignore">Parar de responder</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Timeout de inatividade (horas)</Label>
                  <Input type="number" min={1} max={720} value={engagementRules.inactivity_timeout_hours} onChange={(e) => updateEngagement("inactivity_timeout_hours", parseInt(e.target.value) || 48)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Ação após timeout</Label>
                  <Select value={engagementRules.timeout_action || "handoff"} onValueChange={(v) => updateEngagement("timeout_action", v)}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="handoff">Transferir para humano</SelectItem>
                      <SelectItem value="restart">Reiniciar conversa</SelectItem>
                      <SelectItem value="ignore">Ignorar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2 bg-muted/30 rounded-md p-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs flex items-center gap-1.5"><Clock className="w-3 h-3" /> Horário de funcionamento</Label>
                  <Switch checked={engagementRules.working_hours?.enabled ?? false} onCheckedChange={(v) => updateWorkingHours("enabled", v)} />
                </div>
                {engagementRules.working_hours?.enabled && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <Label className="text-xs">Início</Label>
                      <Input type="time" value={engagementRules.working_hours.start || "08:00"} onChange={(e) => updateWorkingHours("start", e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Fim</Label>
                      <Input type="time" value={engagementRules.working_hours.end || "18:00"} onChange={(e) => updateWorkingHours("end", e.target.value)} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Follow-up Config */}
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5"><RotateCcw className="w-3.5 h-3.5" /> Follow-ups Automáticos</Label>
                <Switch checked={followupConfig.enabled} onCheckedChange={(v) => updateFollowup("enabled", v)} />
              </div>
              {followupConfig.enabled && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Tempo sem resposta (horas)</Label>
                    <Input type="number" min={1} max={168} value={followupConfig.delay_hours} onChange={(e) => updateFollowup("delay_hours", parseInt(e.target.value) || 24)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Máximo de tentativas</Label>
                    <Input type="number" min={1} max={10} value={followupConfig.max_attempts} onChange={(e) => updateFollowup("max_attempts", parseInt(e.target.value) || 3)} />
                  </div>
                </div>
              )}
            </div>

            {/* Objections */}
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Objeções Comuns</Label>
                <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={addObjection}>
                  <Plus className="w-3 h-3" /> Adicionar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Ensine o agente a contra-argumentar objeções frequentes.</p>
              {objectionsConfig.map((obj: Record<string, unknown>, idx: number) => (
                <div key={idx} className="space-y-1.5 bg-muted/30 rounded-md p-3 relative">
                  <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => removeObjection(idx)} aria-label="Fechar">
                    <X className="w-3 h-3" />
                  </Button>
                  <Input placeholder='Ex: "Está caro demais"' value={obj.objection} onChange={(e) => updateObjection(idx, "objection", e.target.value)} className="text-xs" />
                  <Textarea placeholder="Resposta sugerida para o agente..." value={obj.response} onChange={(e) => updateObjection(idx, "response", e.target.value)} rows={2} className="text-xs" />
                </div>
              ))}
            </div>

            {!isEditing && (
              <div className="text-xs text-muted-foreground bg-muted/30 rounded-md p-3">
                Preencha o <strong>System Prompt</strong> para desbloquear o Simulador.
              </div>
            )}

            <NextButton disabled={!isStep4Complete} />
          </TabsContent>

          {/* ─── Aba 5: Simulador ─── */}
          <TabsContent value="simulator" className="mt-4">
            <div className="flex flex-col h-[420px] border rounded-lg overflow-hidden">
              <div className="bg-muted/30 px-4 py-2 border-b flex items-center gap-2">
                <Bot className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Simulador — {form.name || "Agente"}</span>
                <Badge className={`text-[10px] ml-auto ${roleInfo.color}`}>{roleInfo.label}</Badge>
              </div>

              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {simMessages.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-8">Envie uma mensagem para testar seu agente.</p>
                  )}
                  {simMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {simLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg px-3 py-2"><Loader2 className="w-4 h-4 animate-spin" /></div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="flex gap-2 p-3 border-t">
                <Input value={simInput} onChange={(e) => setSimInput(e.target.value)} placeholder="Digite uma mensagem de teste..." onKeyDown={(e) => e.key === "Enter" && handleSimulate()} disabled={simLoading} />
                <Button size="icon" onClick={handleSimulate} disabled={simLoading || !simInput.trim()} aria-label="Enviar">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* ─── Aba 6: Histórico (only for editing) ─── */}
          {isEditing && (
            <TabsContent value="historico" className="space-y-4 mt-4">
              <div className="space-y-1">
                <p className="text-sm font-semibold">Histórico de Atividades</p>
                <p className="text-xs text-muted-foreground">Últimas interações realizadas por este agente</p>
              </div>

              {agentStats && agentStats.activeContacts > 0 && (
                <div className="flex gap-3">
                  <div className="p-3 rounded-lg bg-primary/5 border flex-1 text-center">
                    <p className="text-lg font-bold">{agentStats.activeContacts}</p>
                    <p className="text-[10px] text-muted-foreground">Contatos ativos</p>
                  </div>
                  <div className="p-3 rounded-lg bg-primary/5 border flex-1 text-center">
                    <p className="text-lg font-bold">{agentStats.messagesToday}</p>
                    <p className="text-[10px] text-muted-foreground">Mensagens hoje</p>
                  </div>
                </div>
              )}

              {agentStats?.recentLogs && agentStats.recentLogs.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {agentStats.recentLogs.map((log: Record<string, unknown>) => (
                      <div key={log.id} className="p-3 rounded-lg border space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-[9px]">
                            {new Date(log.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                          </Badge>
                          <span className="text-[9px] text-muted-foreground">{log.contact_id?.slice(0, 8)}...</span>
                        </div>
                        {log.input_message && (
                          <div className="text-xs">
                            <span className="text-muted-foreground font-medium">Cliente:</span>{" "}
                            <span className="text-foreground">{log.input_message.slice(0, 120)}{log.input_message.length > 120 ? "..." : ""}</span>
                          </div>
                        )}
                        {log.output_message && (
                          <div className="text-xs">
                            <span className="text-primary font-medium">Agente:</span>{" "}
                            <span className="text-foreground">{log.output_message.slice(0, 120)}{log.output_message.length > 120 ? "..." : ""}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <History className="w-8 h-8 text-muted-foreground/30 mb-2" />
                  <p className="text-sm font-medium">Nenhuma interação registrada</p>
                  <p className="text-xs text-muted-foreground mt-1">O histórico aparecerá quando o agente começar a responder contatos.</p>
                </div>
              )}
            </TabsContent>
          )}
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
