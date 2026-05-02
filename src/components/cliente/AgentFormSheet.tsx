import { useState, useEffect, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Bot, Brain, BookOpen, Cog, Play, History, Lock } from "lucide-react";
import { useAgentStats } from "@/hooks/useClienteAgents";
import { supabase } from "@/lib/supabase";
import { invokeEdge } from "@/lib/edge";
import { logger } from "@/lib/logger";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { useWhatsAppInstances } from "@/hooks/useWhatsApp";
import { useQueryClient } from "@tanstack/react-query";
import type { AiAgent, AgentRole } from "@/types/cliente";
import { AgentFormSheetIdentidade } from "./AgentFormSheetIdentidade";
import { AgentFormSheetPersona } from "./AgentFormSheetPersona";
import { AgentFormSheetKnowledge } from "./AgentFormSheetKnowledge";
import { AgentFormSheetPrompt } from "./AgentFormSheetPrompt";
import { AgentFormSheetSimulator, AgentFormSheetHistorico } from "./AgentFormSheetSimulator";

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
  [key: string]: unknown;
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
      invokeEdge("whatsapp-setup", { body: { action: "check-status" } })
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["whatsapp-instances"] });
        })
        .finally(() => setSyncingPhone(false));
    }
  }, [open, whatsappInstances]);

  const persona = (form.persona ?? {}) as Record<string, any>;
  const promptConfig = (form.prompt_config ?? {}) as Record<string, any>;
  const crmActions = (form.crm_actions ?? {}) as Record<string, any>;
  const knowledgeBase = ((form.knowledge_base ?? []) as unknown as KBEntry[]);

  // Step completion logic
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
      if (error) { logger.error("Avatar upload error:", error, "AgentFormSheet"); return; }
      const { data: urlData } = supabase.storage.from("agent-knowledge").getPublicUrl(path);
      setForm((f) => ({ ...f, avatar_url: urlData.publicUrl }));
    } finally {
      setUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const addKbUrl = () => {
    if (urlInput.trim()) {
      setForm((f) => ({ ...f, knowledge_base: [...knowledgeBase, { type: "url" as const, content: urlInput.trim() }] as unknown as typeof f.knowledge_base }));
      setUrlInput("");
    }
  };

  const addKbText = () => {
    if (textInput.trim()) {
      setForm((f) => ({ ...f, knowledge_base: [...knowledgeBase, { type: "text" as const, content: textInput.trim() }] as unknown as typeof f.knowledge_base }));
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
        if (error) { logger.error("Upload error:", error, "AgentFormSheet"); continue; }
        const { data: urlData } = supabase.storage.from("agent-knowledge").getPublicUrl(path);
        const entry: KBEntry = { type: "file", content: urlData.publicUrl, name: file.name, url: urlData.publicUrl, size: file.size };
        setForm((f) => ({ ...f, knowledge_base: [...(f.knowledge_base as KBEntry[] ?? []), entry] }));
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeKbEntry = (idx: number) => setForm((f) => ({ ...f, knowledge_base: knowledgeBase.filter((_, i) => i !== idx) as unknown as typeof f.knowledge_base }));

  const toggleObjective = (obj: string) => {
    const current = (form.objectives ?? []) as string[];
    const exists = current.includes(obj);
    setForm((f) => ({ ...f, objectives: (exists ? current.filter((o) => o !== obj) : [...current, obj]) as unknown as typeof f.objectives }));
  };

  const handleGeneratePersona = async () => {
    setGenerating("persona");
    try {
      const { data } = await invokeEdge("ai-generate-agent-config", {
        body: { type: "persona", role: form.role, persona, name: form.name },
      });
      if (data?.result) updatePersona("generated_description", data.result);
    } finally { setGenerating(null); }
  };

  const handleGenerateGreeting = async () => {
    setGenerating("greeting");
    try {
      const { data } = await invokeEdge("ai-generate-agent-config", {
        body: { type: "greeting", role: form.role, persona, name: form.name },
      });
      if (data?.result) updatePersona("custom_greeting", data.result);
    } finally { setGenerating(null); }
  };

  const handleGeneratePrompt = async () => {
    setGenerating("prompt");
    try {
      const { data } = await invokeEdge("ai-generate-agent-config", {
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
      const { data } = await invokeEdge("ai-agent-simulate", {
        body: { agent_config: form, message: simInput, history: simMessages },
      });
      if (data?.reply) {
        setSimMessages((m) => [...m, { role: "assistant", content: data.reply }]);
      }
    } finally { setSimLoading(false); }
  };

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: "identidade", label: "Identidade", icon: <Bot className="w-3 h-3" /> },
    { key: "persona", label: "Persona", icon: <Brain className="w-3 h-3" /> },
    { key: "knowledge", label: "Base", icon: <BookOpen className="w-3 h-3" /> },
    { key: "prompt", label: "Prompt", icon: <Cog className="w-3 h-3" /> },
    { key: "simulator", label: "Simulador", icon: <Play className="w-3 h-3" /> },
    ...(isEditing ? [{ key: "historico" as TabKey, label: "Histórico", icon: <History className="w-3 h-3" /> }] : []),
  ];

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

          <AgentFormSheetIdentidade
            form={form}
            setForm={setForm}
            uploading={uploading}
            syncingPhone={syncingPhone}
            whatsappInstances={whatsappInstances}
            avatarInputRef={avatarInputRef}
            handleAvatarUpload={handleAvatarUpload}
            isEditing={isEditing}
            isStep1Complete={isStep1Complete}
            goNext={goNext}
            canGoNext={canAccessTab("persona")}
          />

          <AgentFormSheetPersona
            persona={persona}
            updatePersona={updatePersona}
            generating={generating}
            handleGeneratePersona={handleGeneratePersona}
            handleGenerateGreeting={handleGenerateGreeting}
            isEditing={isEditing}
            isStep2Complete={isStep2Complete}
            goNext={goNext}
            canGoNext={canAccessTab("knowledge")}
          />

          <AgentFormSheetKnowledge
            knowledgeBase={knowledgeBase}
            urlInput={urlInput}
            setUrlInput={setUrlInput}
            textInput={textInput}
            setTextInput={setTextInput}
            uploading={uploading}
            addKbUrl={addKbUrl}
            addKbText={addKbText}
            handleFileUpload={handleFileUpload}
            removeKbEntry={removeKbEntry}
            fileInputRef={fileInputRef}
            isEditing={isEditing}
            isStep3Complete={isStep3Complete}
            goNext={goNext}
            canGoNext={canAccessTab("prompt")}
          />

          <AgentFormSheetPrompt
            form={{ role: form.role, objectives: form.objectives as string[] | undefined }}
            promptConfig={promptConfig}
            crmActions={crmActions}
            engagementRules={engagementRules}
            followupConfig={followupConfig}
            objectionsConfig={objectionsConfig}
            generating={generating}
            handleGeneratePrompt={handleGeneratePrompt}
            updatePrompt={updatePrompt}
            updateCrmAction={updateCrmAction}
            updateEngagement={updateEngagement}
            updateWorkingHours={updateWorkingHours}
            updateFollowup={updateFollowup}
            addObjection={addObjection}
            updateObjection={updateObjection}
            removeObjection={removeObjection}
            toggleObjective={toggleObjective}
            isEditing={isEditing}
            isStep4Complete={isStep4Complete}
            goNext={goNext}
            canGoNext={canAccessTab("simulator")}
          />

          <AgentFormSheetSimulator
            agentName={form.name || ""}
            agentRole={form.role || "sdr"}
            simMessages={simMessages}
            simInput={simInput}
            setSimInput={setSimInput}
            simLoading={simLoading}
            handleSimulate={handleSimulate}
          />

          {isEditing && <AgentFormSheetHistorico agentStats={agentStats} />}
        </Tabs>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => onSave(form)} disabled={!form.name?.trim() || isSaving}>
            {isSaving ? "Salvando..." : isEditing ? "Salvar alterações" : "Criar agente"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
