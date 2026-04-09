// @ts-nocheck
import { Loader2, Sparkles, Shield, Clock, RotateCcw, Plus, X, ChevronRight } from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import type { AgentRole } from "@/types/cliente";
import { agentRoleConfig } from "@/types/cliente";

interface AgentFormSheetPromptProps {
  form: { role?: string; objectives?: string[] };
  promptConfig: Record<string, any>;
  crmActions: Record<string, any>;
  engagementRules: Record<string, any>;
  followupConfig: Record<string, any>;
  objectionsConfig: Array<Record<string, unknown>>;
  generating: string | null;
  handleGeneratePrompt: () => void;
  updatePrompt: (key: string, value: unknown) => void;
  updateCrmAction: (key: string, value: boolean) => void;
  updateEngagement: (key: string, value: unknown) => void;
  updateWorkingHours: (key: string, value: unknown) => void;
  updateFollowup: (key: string, value: unknown) => void;
  addObjection: () => void;
  updateObjection: (idx: number, field: string, value: string) => void;
  removeObjection: (idx: number) => void;
  toggleObjective: (obj: string) => void;
  isEditing: boolean;
  isStep4Complete: boolean;
  goNext: () => void;
  canGoNext: boolean;
}

function NextButton({ disabled, goNext }: { disabled: boolean; goNext: () => void }) {
  return (
    <div className="pt-4 flex justify-end">
      <Button type="button" onClick={goNext} disabled={disabled} className="gap-1.5">
        Próximo <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

export function AgentFormSheetPrompt({
  form,
  promptConfig,
  crmActions,
  engagementRules,
  followupConfig,
  objectionsConfig,
  generating,
  handleGeneratePrompt,
  updatePrompt,
  updateCrmAction,
  updateEngagement,
  updateWorkingHours,
  updateFollowup,
  addObjection,
  updateObjection,
  removeObjection,
  toggleObjective,
  isEditing,
  isStep4Complete,
  goNext,
  canGoNext,
}: AgentFormSheetPromptProps) {
  const roleInfo = agentRoleConfig[(form.role as AgentRole) ?? "sdr"];

  return (
    <TabsContent value="prompt" className="space-y-4 mt-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>System Prompt</Label>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-7 text-xs"
            onClick={handleGeneratePrompt}
            disabled={generating === "prompt"}
          >
            {generating === "prompt" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            Gerar com a nossa IA
          </Button>
        </div>
        <Textarea
          value={promptConfig.system_prompt ?? ""}
          onChange={(e) => updatePrompt("system_prompt", e.target.value)}
          placeholder="Você é um assistente especializado em..."
          rows={8}
          className="font-mono text-xs"
        />
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
            <Input
              type="number"
              min={5}
              max={200}
              value={engagementRules.max_messages}
              onChange={(e) => updateEngagement("max_messages", parseInt(e.target.value) || 10)}
            />
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
            <Input
              type="number"
              min={1}
              max={720}
              value={engagementRules.inactivity_timeout_hours}
              onChange={(e) => updateEngagement("inactivity_timeout_hours", parseInt(e.target.value) || 48)}
            />
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
            <Label className="text-xs flex items-center gap-1.5">
              <Clock className="w-3 h-3" /> Horário de funcionamento
            </Label>
            <Switch
              checked={engagementRules.working_hours?.enabled ?? false}
              onCheckedChange={(v) => updateWorkingHours("enabled", v)}
            />
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
              <Input
                type="number"
                min={1}
                max={168}
                value={followupConfig.delay_hours}
                onChange={(e) => updateFollowup("delay_hours", parseInt(e.target.value) || 24)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Máximo de tentativas</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={followupConfig.max_attempts}
                onChange={(e) => updateFollowup("max_attempts", parseInt(e.target.value) || 3)}
              />
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
        {objectionsConfig.map((obj, idx) => (
          <div key={idx} className="space-y-1.5 bg-muted/30 rounded-md p-3 relative">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6"
              onClick={() => removeObjection(idx)}
              aria-label="Remover"
            >
              <X className="w-3 h-3" />
            </Button>
            <Input
              placeholder='Ex: "Está caro demais"'
              value={obj.objection as string}
              onChange={(e) => updateObjection(idx, "objection", e.target.value)}
              className="text-xs"
            />
            <Textarea
              placeholder="Resposta sugerida para o agente..."
              value={obj.response as string}
              onChange={(e) => updateObjection(idx, "response", e.target.value)}
              rows={2}
              className="text-xs"
            />
          </div>
        ))}
      </div>

      {!isEditing && (
        <div className="text-xs text-muted-foreground bg-muted/30 rounded-md p-3">
          Preencha o <strong>System Prompt</strong> para desbloquear o Simulador.
        </div>
      )}

      <NextButton disabled={!isStep4Complete || !canGoNext} goNext={goNext} />
    </TabsContent>
  );
}
