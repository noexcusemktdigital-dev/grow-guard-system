import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/NumericInput";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Zap, Plus, Trash2, Bot, Edit2, Layers, ArrowRight, Sparkles, CheckCircle2, Clock, MessageSquare, Users2, BookOpen, ChevronDown, Lightbulb, ScrollText, AlertCircle, CheckCircle, XCircle, SkipForward, Play } from "lucide-react";
import { useCrmAutomations, useCrmAutomationMutations } from "@/hooks/useCrmAutomations";
import { useAutomationLogs } from "@/hooks/useAutomationLogs";
import { format, formatDistanceToNow } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { invokeEdge } from "@/lib/edge";
import { ptBR } from "date-fns/locale";
import { useCrmFunnels, type CrmFunnel } from "@/hooks/useCrmFunnels";
import type { FunnelStage } from "@/components/crm/CrmStageSystem";
import { useCrmTeams } from "@/hooks/useCrmTeams";
import { useCrmTeam } from "@/hooks/useCrmTeam";
import { useSalesPlan } from "@/hooks/useSalesPlan";
import { useClienteAgents } from "@/hooks/useClienteAgents";
import { useToast } from "@/hooks/use-toast";

const TRIGGERS = [
  { value: "lead_created", label: "Lead criado" },
  { value: "stage_change", label: "Mudança de etapa" },
  { value: "no_contact_sla", label: "Sem contato (SLA)" },
  { value: "task_overdue", label: "Tarefa atrasada" },
  { value: "lead_stuck", label: "Lead parado na etapa" },
  { value: "lead_won", label: "Lead vendido" },
  { value: "lead_lost", label: "Lead perdido" },
  { value: "tag_added", label: "Tag adicionada" },
];

const ACTIONS = [
  { value: "create_task", label: "Criar tarefa", ai: false },
  { value: "add_tag", label: "Adicionar tag", ai: false },
  { value: "remove_tag", label: "Remover tag", ai: false },
  { value: "change_stage", label: "Mudar etapa", ai: false },
  { value: "notify", label: "Notificar responsável", ai: false },
  { value: "send_whatsapp", label: "Enviar WhatsApp", ai: false },
  { value: "assign_to_person", label: "Atribuir a pessoa", ai: false },
  { value: "assign_to_team", label: "Atribuir a time", ai: false },
  { value: "move_to_funnel", label: "Mover para outro funil", ai: false },
  { value: "ai_qualify", label: "IA: Qualificar lead", ai: true },
  { value: "ai_first_contact", label: "IA: Primeiro contato", ai: true },
  { value: "ai_followup", label: "IA: Follow-up automático", ai: true },
];

type AutomationRecord = NonNullable<ReturnType<typeof useCrmAutomations>["data"]>[number];

interface RecommendedAutomation {
  name: string;
  description: string;
  trigger_type: string;
  action_type: string;
  trigger_config?: Record<string, unknown>;
  action_config?: Record<string, unknown>;
  ai?: boolean;
}

function getRecommendedAutomations(): RecommendedAutomation[] {
  return [
    {
      name: "🤖 Primeiro contato IA",
      description: "Nossa IA envia mensagem de boas-vindas e inicia qualificação BANT automaticamente",
      trigger_type: "lead_created",
      action_type: "ai_first_contact",
      action_config: { initial_message: "" },
      ai: true,
    },
    {
      name: "🔄 Follow-up automático 24h",
      description: "Se o lead não responder em 24h, nossa IA faz follow-up (até 3 tentativas)",
      trigger_type: "lead_created",
      action_type: "ai_followup",
      action_config: { delay_hours: 24, max_attempts: 3 },
      ai: true,
    },
    {
      name: "🎯 Qualificação IA por etapa",
      description: "Quando lead entra na etapa 'Qualificação', nossa IA inicia processo de qualificação via WhatsApp",
      trigger_type: "stage_change",
      action_type: "ai_qualify",
      trigger_config: { stage: "qualificacao" },
      ai: true,
    },
    {
      name: "🎉 Notificar equipe em venda",
      description: "Notifica toda a equipe quando um lead é convertido em venda",
      trigger_type: "lead_won",
      action_type: "notify",
      action_config: { notification_title: "🎉 Nova venda fechada!", notification_message: "" },
      ai: false,
    },
    {
      name: "⚠️ Alerta lead quente parado",
      description: "Alerta quando lead quente fica sem atividade por 3 dias",
      trigger_type: "lead_stuck",
      action_type: "notify",
      trigger_config: { days: 3 },
      ai: false,
    },
    {
      name: "🏷️ Mover lead qualificado para Closer",
      description: "Quando tag 'qualificado' é adicionada, move para etapa do Closer",
      trigger_type: "tag_added",
      action_type: "change_stage",
      trigger_config: { tag: "qualificado" },
      action_config: { target_stage: "closer" },
      ai: false,
    },
  ];
}

function AutomationFlowPreview({ triggerType, actionType }: { triggerType: string; actionType: string }) {
  const trigger = TRIGGERS.find(t => t.value === triggerType);
  const action = ACTIONS.find(a => a.value === actionType);
  if (!trigger || !action) return null;

  return (
    <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1">
      <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-amber-500/5 border-amber-500/20 text-amber-600">
        {trigger.label}
      </Badge>
      <ArrowRight className="w-3 h-3 text-muted-foreground/50" />
      <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-emerald-500/5 border-emerald-500/20 text-emerald-600">
        {action.label}
      </Badge>
    </div>
  );
}

function EducationalBlock({ isAi }: { isAi: boolean }) {
  const [open, setOpen] = useState(false);

  if (isAi) {
    return (
      <Collapsible open={open} onOpenChange={setOpen}>
        <Card className="border-violet-200/30 bg-violet-500/[0.03]">
          <CollapsibleTrigger asChild>
            <CardContent className="p-3 cursor-pointer flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-violet-500" />
                <span className="text-xs font-medium">Saiba mais sobre Automações de IA</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
            </CardContent>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-3 pb-3 space-y-2 text-xs text-muted-foreground">
              <div>
                <p className="font-medium text-foreground">O que são?</p>
                <p>Automações que utilizam nossa IA para interagir com leads via WhatsApp de forma inteligente e personalizada, 24 horas por dia.</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Por que usar?</p>
                <p>Resposta imediata para cada lead, qualificação automática com metodologia BANT, e follow-ups persistentes sem esforço humano.</p>
              </div>
              <div className="flex items-start gap-2 p-2 rounded bg-violet-500/5 border border-violet-200/20">
                <Lightbulb className="w-3.5 h-3.5 text-violet-500 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="text-[11px]"><strong>Exemplo:</strong> "Quando lead chega, nossa IA envia mensagem de boas-vindas e inicia qualificação"</p>
                  <p className="text-[11px]"><strong>Exemplo:</strong> "Se lead não responde em 24h, nossa IA faz follow-up automático"</p>
                  <p className="text-[10px] text-violet-600 mt-1">⚠️ Cada automação de IA precisa de um Agente configurado na seção Agentes IA</p>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="border-blue-200/30 bg-blue-500/[0.03]">
        <CollapsibleTrigger asChild>
          <CardContent className="p-3 cursor-pointer flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-medium">Saiba mais sobre Automações do Time</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
          </CardContent>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-2 text-xs text-muted-foreground">
            <div>
              <p className="font-medium text-foreground">O que são?</p>
              <p>Regras automáticas que executam ações operacionais quando algo acontece no CRM — sem precisar de intervenção manual.</p>
            </div>
            <div>
              <p className="font-medium text-foreground">Por que usar?</p>
              <p>Elimina tarefas manuais repetitivas, garante que nenhum lead fique sem atenção e padroniza os processos do seu time.</p>
            </div>
            <div className="flex items-start gap-2 p-2 rounded bg-blue-500/5 border border-blue-200/20">
              <Lightbulb className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-[11px]"><strong>Exemplo:</strong> "Quando um lead é criado via Ads, atribuir automaticamente ao time de vendas"</p>
                <p className="text-[11px]"><strong>Exemplo:</strong> "Quando lead fica parado 3 dias, notificar o responsável"</p>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export function CrmAutomations() {
  const { toast } = useToast();
  const { data: automations, isLoading } = useCrmAutomations();
  const { createAutomation, updateAutomation, deleteAutomation } = useCrmAutomationMutations();
  const { data: funnels } = useCrmFunnels();
  const { data: teams } = useCrmTeams();
  const { data: members } = useCrmTeam();
  const { data: salesPlan } = useSalesPlan();
  const { data: agents } = useClienteAgents();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [triggerType, setTriggerType] = useState("lead_created");
  const [actionType, setActionType] = useState("create_task");
  const [actionConfig, setActionConfig] = useState<Record<string, any>>({});
  const [triggerConfig, setTriggerConfig] = useState<Record<string, any>>({});
  const [selectedFunnels, setSelectedFunnels] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [filterFunnel, setFilterFunnel] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [activeTab, setActiveTab] = useState("team");

  const recommended = getRecommendedAutomations();
  const existingNames = new Set((automations || []).map(a => a.name));

  const reset = () => {
    setEditingId(null); setName(""); setDescription(""); setTriggerType("lead_created"); setActionType("create_task");
    setActionConfig({}); setTriggerConfig({}); setSelectedFunnels([]); setSelectedTeams([]); setSelectedAgentId("");
  };

  const openNew = (forAi: boolean) => {
    reset();
    if (forAi) setActionType("ai_first_contact");
    setDialogOpen(true);
  };

  const openEdit = (auto: AutomationRecord) => {
    setEditingId(auto.id);
    setName(auto.name);
    setDescription(auto.description || "");
    setTriggerType(auto.trigger_type);
    setActionType(auto.action_type);
    setActionConfig((auto.action_config as Record<string, unknown>) || {});
    setTriggerConfig((auto.trigger_config as Record<string, unknown>) || {});
    setSelectedFunnels(Array.isArray(auto.funnel_ids) ? (auto.funnel_ids as string[]) : []);
    setSelectedTeams(Array.isArray(auto.team_ids) ? (auto.team_ids as string[]) : []);
    setSelectedAgentId((auto.agent_id as string) || "");
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!name.trim()) { toast({ title: "Informe o nome", variant: "destructive" }); return; }
    if (isAiAction(actionType) && !selectedAgentId) {
      toast({ title: "Selecione um agente IA para esta automação", variant: "destructive" }); return;
    }
    // Ensure move_mode is explicit (default "transfer") so the backend never has to guess
    const finalActionConfig: Record<string, unknown> = { ...actionConfig };
    if (actionType === "move_to_funnel" && !finalActionConfig.move_mode) {
      finalActionConfig.move_mode = "transfer";
    }
    const payload: Record<string, unknown> = {
      name, description, trigger_type: triggerType, action_type: actionType,
      action_config: finalActionConfig, trigger_config: triggerConfig,
      funnel_ids: selectedFunnels, team_ids: selectedTeams,
      agent_id: selectedAgentId || null,
    };
    if (editingId) {
      updateAutomation.mutate({ id: editingId, ...payload });
      toast({ title: "Automação atualizada" });
    } else {
      createAutomation.mutate(payload as { name: string; trigger_type: string; action_type: string; trigger_config?: Record<string, unknown>; action_config?: Record<string, unknown>; is_active?: boolean });
      toast({ title: "Automação criada" });
    }
    reset();
    setDialogOpen(false);
  };

  const handleActivateRecommended = (rec: RecommendedAutomation) => {
    createAutomation.mutate({
      name: rec.name,
      trigger_type: rec.trigger_type,
      action_type: rec.action_type,
      trigger_config: rec.trigger_config || {},
      action_config: rec.action_config || {},
      is_active: true,
    });
    toast({ title: `"${rec.name}" ativada!` });
  };

  const toggleActive = (id: string, isActive: boolean) => {
    updateAutomation.mutate({ id, is_active: !isActive });
  };

  const isAiAction = (type: string) => ACTIONS.find(a => a.value === type && a.ai);

  const filteredAutomations = (automations || []).filter(a => {
    if (!filterFunnel) return true;
    const fids = Array.isArray(a.funnel_ids) ? a.funnel_ids : [];
    return fids.length === 0 || fids.includes(filterFunnel);
  });

  const isAiTab = activeTab === "ai";
  const tabAutomations = filteredAutomations.filter(a => {
    const actionDef = ACTIONS.find(ac => ac.value === a.action_type);
    return isAiTab ? actionDef?.ai : !actionDef?.ai;
  });
  const tabRecommended = recommended.filter(r => !existingNames.has(r.name) && (isAiTab ? r.ai : !r.ai));
  const tabActions = ACTIONS.filter(a => isAiTab ? a.ai : !a.ai);

  if (isLoading) return <Skeleton className="h-48 mt-4" />;

  return (
    <div className="space-y-4 mt-4">
      {/* Funnel filter - global */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2"><Zap className="w-4 h-4" /> Automações</h3>
          <p className="text-xs text-muted-foreground">Configure regras automáticas para seu CRM</p>
        </div>
        {funnels && funnels.length > 1 && (
          <Select value={filterFunnel} onValueChange={v => setFilterFunnel(v === "all" ? "" : v)}>
            <SelectTrigger className="h-8 w-36 text-xs"><Layers className="w-3 h-3 mr-1" /><SelectValue placeholder="Todos os funis" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">Todos os funis</SelectItem>
              {funnels.map(f => <SelectItem key={f.id} value={f.id} className="text-xs">{f.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Sub-tabs: Time / IA */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="team" className="flex-1 gap-1.5 text-xs">
            <Users2 className="w-3.5 h-3.5" /> Do Time
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex-1 gap-1.5 text-xs">
            <Bot className="w-3.5 h-3.5" /> De IA
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex-1 gap-1.5 text-xs">
            <ScrollText className="w-3.5 h-3.5" /> Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="team">
          <AutomationTabContent
            isAi={false}
            automations={tabAutomations}
            recommended={tabRecommended}
            funnels={funnels}
            onNew={() => openNew(false)}
            onEdit={openEdit}
            onDelete={(id) => { deleteAutomation.mutate(id); toast({ title: "Automação excluída" }); }}
            onToggle={toggleActive}
            onActivateRec={handleActivateRecommended}
            isAiAction={isAiAction}
          />
        </TabsContent>

        <TabsContent value="ai">
          <AutomationTabContent
            isAi={true}
            automations={tabAutomations}
            recommended={tabRecommended}
            funnels={funnels}
            onNew={() => openNew(true)}
            onEdit={openEdit}
            onDelete={(id) => { deleteAutomation.mutate(id); toast({ title: "Automação excluída" }); }}
            onToggle={toggleActive}
            onActivateRec={handleActivateRecommended}
            isAiAction={isAiAction}
          />
        </TabsContent>

        <TabsContent value="logs">
          <AutomationLogsTab automations={automations || []} />
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Editar Automação" : "Nova Automação"}</DialogTitle></DialogHeader>

          {/* Visual preview */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border">
            <div className="flex-1 text-center">
              <Badge variant="outline" className="text-[10px] bg-amber-500/5 border-amber-500/20 text-amber-600">
                {TRIGGERS.find(t => t.value === triggerType)?.label || "Trigger"}
              </Badge>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground/40" />
            <div className="flex-1 text-center">
              <Badge variant="outline" className="text-[10px] bg-emerald-500/5 border-emerald-500/20 text-emerald-600">
                {ACTIONS.find(a => a.value === actionType)?.label || "Ação"}
              </Badge>
            </div>
          </div>

          <div className="space-y-4">
            {/* Name & Description */}
            <div className="space-y-2">
              <div><Label className="text-xs">Nome *</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Follow-up automático" /></div>
              <div><Label className="text-xs">Descrição</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descrição opcional..." className="min-h-[50px] text-xs" /></div>
            </div>

            {/* Trigger */}
            <div className="space-y-2 p-3 rounded-lg border bg-muted/30">
              <Label className="text-xs font-semibold">Quando... (Trigger)</Label>
              <Select value={triggerType} onValueChange={setTriggerType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TRIGGERS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
              {triggerType === "lead_created" && (
                <div><Label className="text-xs">Filtrar por origem (opcional)</Label><Input value={triggerConfig.source_filter || ""} onChange={e => setTriggerConfig({ ...triggerConfig, source_filter: e.target.value })} placeholder="Ex: Ads, WhatsApp" className="h-8 text-xs" /></div>
              )}
              {triggerType === "lead_stuck" && (
                <div className="space-y-2">
                  <Label className="text-xs">Lead parado há quantos dias?</Label>
                  <div className="flex items-center gap-2">
                    <NumericInput
                      value={triggerConfig.days ?? 3}
                      decimals={0}
                      onChange={v => setTriggerConfig({
                        ...triggerConfig,
                        days: Math.max(1, v ?? 3),
                      })}
                      className="h-8 text-xs w-24"
                    />
                    <span className="text-xs text-muted-foreground">dias sem movimentação</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    O CRM verificará leads parados a cada 5 minutos e disparará esta automação.
                  </p>
                </div>
              )}
              {triggerType === "no_contact_sla" && (
                <div className="space-y-2">
                  <Label className="text-xs">Sem contato há quantas horas?</Label>
                  <div className="flex items-center gap-2">
                    <NumericInput
                      value={triggerConfig.hours ?? 24}
                      decimals={0}
                      onChange={v => setTriggerConfig({
                        ...triggerConfig,
                        hours: Math.max(1, v ?? 24),
                      })}
                      className="h-8 text-xs w-24"
                    />
                    <span className="text-xs text-muted-foreground">horas sem atividade registrada</span>
                  </div>
                </div>
              )}
              {triggerType === "tag_added" && (
                <div><Label className="text-xs">Tag</Label><Input value={triggerConfig.tag || ""} onChange={e => setTriggerConfig({ ...triggerConfig, tag: e.target.value })} placeholder="Ex: qualificado" className="h-8 text-xs" /></div>
              )}
            </div>

            {/* Scope */}
            <div className="space-y-2 p-3 rounded-lg border bg-muted/30">
              <Label className="text-xs font-semibold">Escopo</Label>
              {funnels && funnels.length > 0 && (
                <div>
                  <Label className="text-[10px] text-muted-foreground mb-1 block">Funis (vazio = todos)</Label>
                  <div className="flex flex-wrap gap-2">
                    {funnels.map(f => (
                      <label key={f.id} className="flex items-center gap-1.5 text-xs cursor-pointer">
                        <Checkbox checked={selectedFunnels.includes(f.id)} onCheckedChange={() => setSelectedFunnels(prev => prev.includes(f.id) ? prev.filter(id => id !== f.id) : [...prev, f.id])} />
                        {f.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {selectedFunnels.length === 1 && funnels && (() => {
                const f = funnels.find(f => f.id === selectedFunnels[0]);
                const stages: FunnelStage[] = f?.stages || [];
                if (stages.length === 0) return null;
                return (
                  <div>
                    <Label className="text-[10px] text-muted-foreground mb-1 block">Etapa específica (opcional)</Label>
                    <Select
                      value={triggerConfig.specific_stage || "__all__"}
                      onValueChange={v => setTriggerConfig({ ...triggerConfig, specific_stage: v === "__all__" ? undefined : v })}
                    >
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Todas as etapas" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__" className="text-xs">Todas as etapas</SelectItem>
                        {stages.map((s) => <SelectItem key={s.key} value={s.key} className="text-xs">{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })()}
              {teams && teams.length > 0 && (
                <div>
                  <Label className="text-[10px] text-muted-foreground mb-1 block">Times (vazio = todos)</Label>
                  <div className="flex flex-wrap gap-2">
                    {teams.map(t => (
                      <label key={t.id} className="flex items-center gap-1.5 text-xs cursor-pointer">
                        <Checkbox checked={selectedTeams.includes(t.id)} onCheckedChange={() => setSelectedTeams(prev => prev.includes(t.id) ? prev.filter(id => id !== t.id) : [...prev, t.id])} />
                        {t.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action */}
            <div className="space-y-2 p-3 rounded-lg border bg-muted/30">
              <Label className="text-xs font-semibold">Então... (Ação)</Label>
              <Select value={actionType} onValueChange={setActionType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{tabActions.map(a => <SelectItem key={a.value} value={a.value}>{a.ai && "🤖 "}{a.label}</SelectItem>)}</SelectContent>
              </Select>

              {actionType === "create_task" && (
                <div className="space-y-2">
                  <div><Label className="text-xs">Título da tarefa</Label><Input value={actionConfig.task_title || ""} onChange={e => setActionConfig({ ...actionConfig, task_title: e.target.value })} placeholder="Ex: Fazer follow-up" className="h-8 text-xs" /></div>
                  <div className="grid grid-cols-3 gap-2">
                    <div><Label className="text-xs">Prazo</Label><NumericInput value={actionConfig.due_value ?? actionConfig.due_days ?? 1} decimals={0} onChange={v => setActionConfig({ ...actionConfig, due_value: v ?? 1, due_days: actionConfig.due_unit === "hours" ? undefined : (v ?? 1) })} className="h-8 text-xs" /></div>
                    <div>
                      <Label className="text-xs">Unidade</Label>
                      <Select value={actionConfig.due_unit || "days"} onValueChange={v => setActionConfig({ ...actionConfig, due_unit: v, due_days: v === "days" ? (actionConfig.due_value || 1) : undefined })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hours" className="text-xs">Horas</SelectItem>
                          <SelectItem value="days" className="text-xs">Dias</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Prioridade</Label>
                      <Select value={actionConfig.priority || "medium"} onValueChange={v => setActionConfig({ ...actionConfig, priority: v })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low" className="text-xs">Baixa</SelectItem>
                          <SelectItem value="medium" className="text-xs">Média</SelectItem>
                          <SelectItem value="high" className="text-xs">Alta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
              {(actionType === "add_tag" || actionType === "remove_tag") && (
                <div><Label className="text-xs">Tag</Label><Input value={actionConfig.tag || ""} onChange={e => setActionConfig({ ...actionConfig, tag: e.target.value })} placeholder="Ex: qualificado" className="h-8 text-xs" /></div>
              )}
              {actionType === "change_stage" && funnels && (
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs">Funil de destino</Label>
                    <Select
                      value={actionConfig.target_funnel_id || (selectedFunnels[0] || "__current__")}
                      onValueChange={v => setActionConfig({ ...actionConfig, target_funnel_id: v === "__current__" ? "" : v, target_stage: "" })}
                    >
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Funil atual" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__current__" className="text-xs">Funil atual</SelectItem>
                        {funnels.map(f => <SelectItem key={f.id} value={f.id} className="text-xs">{f.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Etapa de destino *</Label>
                    {(() => {
                      const targetFunnel = funnels.find(f => f.id === (actionConfig.target_funnel_id || selectedFunnels[0])) || funnels[0];
                      const stages: FunnelStage[] = targetFunnel?.stages || [];
                      return (
                        <Select
                          value={actionConfig.target_stage || ""}
                          onValueChange={v => setActionConfig({ ...actionConfig, target_stage: v })}
                        >
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecionar etapa" /></SelectTrigger>
                          <SelectContent>
                            {stages.map((s) => <SelectItem key={s.key} value={s.key} className="text-xs">{s.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      );
                    })()}
                  </div>
                </div>
              )}
              {actionType === "assign_to_person" && members && (
                <div>
                  <Label className="text-xs">Pessoa</Label>
                  <Select value={actionConfig.user_id || ""} onValueChange={v => setActionConfig({ ...actionConfig, user_id: v })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                    <SelectContent>{members.map(m => <SelectItem key={m.user_id} value={m.user_id} className="text-xs">{m.full_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              {actionType === "assign_to_team" && teams && (
                <div>
                  <Label className="text-xs">Time</Label>
                  <Select value={actionConfig.team_id || ""} onValueChange={v => setActionConfig({ ...actionConfig, team_id: v })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                    <SelectContent>{teams.map(t => <SelectItem key={t.id} value={t.id} className="text-xs">{t.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              {actionType === "move_to_funnel" && funnels && (
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs">Funil de destino</Label>
                    <Select value={actionConfig.target_funnel_id || ""} onValueChange={v => setActionConfig({ ...actionConfig, target_funnel_id: v, target_stage: "" })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                      <SelectContent>{funnels.map(f => <SelectItem key={f.id} value={f.id} className="text-xs">{f.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  {actionConfig.target_funnel_id && (() => {
                    const targetFunnel = funnels.find(f => f.id === actionConfig.target_funnel_id);
                    const stages: FunnelStage[] = targetFunnel?.stages || [];
                    return (
                      <div>
                        <Label className="text-xs">Etapa inicial no destino</Label>
                        <Select value={actionConfig.target_stage || ""} onValueChange={v => setActionConfig({ ...actionConfig, target_stage: v })}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Primeira etapa" /></SelectTrigger>
                          <SelectContent>
                            {stages.map((s) => <SelectItem key={s.key} value={s.key} className="text-xs">{s.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })()}
                  <div className="space-y-1.5">
                    <Label className="text-xs">O que fazer com o lead original?</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setActionConfig({ ...actionConfig, move_mode: "transfer" })}
                        className={`p-2.5 rounded-lg border text-xs text-left transition-all ${
                          (actionConfig.move_mode || "transfer") === "transfer"
                            ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                        }`}
                      >
                        <p className="font-medium">↗️ Transferir</p>
                        <p className="text-muted-foreground text-[10px] mt-0.5">Remove do funil atual e move para o destino</p>
                      </button>
                      <button
                        onClick={() => setActionConfig({ ...actionConfig, move_mode: "duplicate" })}
                        className={`p-2.5 rounded-lg border text-xs text-left transition-all ${
                          actionConfig.move_mode === "duplicate"
                            ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                        }`}
                      >
                        <p className="font-medium">📋 Duplicar</p>
                        <p className="text-muted-foreground text-[10px] mt-0.5">Mantém no funil atual e cria cópia no destino</p>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Agent Config */}
              {isAiAction(actionType) && (
                <div className="space-y-2 mt-2 p-2 rounded-md bg-violet-500/5 border border-violet-200/30">
                  <Label className="text-xs font-semibold flex items-center gap-1"><Bot className="w-3 h-3 text-violet-500" /> Configuração do Agente IA</Label>
                  <div>
                    <Label className="text-xs">Agente *</Label>
                    <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecionar agente IA" /></SelectTrigger>
                      <SelectContent>
                        {(agents || []).filter(a => a.status === "active").map(a => (
                          <SelectItem key={a.id} value={a.id} className="text-xs">
                            <span className="flex items-center gap-1">
                              <Bot className="w-3 h-3" />
                              {a.name} <Badge variant="outline" className="text-[8px] ml-1">{a.role}</Badge>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {actionType === "ai_first_contact" && (
                    <div>
                      <Label className="text-xs flex items-center gap-1"><MessageSquare className="w-3 h-3" /> Mensagem inicial (opcional)</Label>
                      <Textarea
                        value={actionConfig.initial_message || ""}
                        onChange={e => setActionConfig({ ...actionConfig, initial_message: e.target.value })}
                        placeholder="Deixe vazio para usar a mensagem padrão do agente..."
                        className="min-h-[60px] text-xs"
                      />
                    </div>
                  )}
                  {actionType === "ai_followup" && (
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs flex items-center gap-1"><Clock className="w-3 h-3" /> Delay</Label>
                        <NumericInput value={actionConfig.delay_value ?? actionConfig.delay_hours ?? 24} decimals={0} onChange={v => setActionConfig({ ...actionConfig, delay_value: v ?? 24, delay_hours: actionConfig.delay_unit === "days" ? (v ?? 24) * 24 : (v ?? 24) })} className="h-8 text-xs" />
                      </div>
                      <div>
                        <Label className="text-xs">Unidade</Label>
                        <Select value={actionConfig.delay_unit || "hours"} onValueChange={v => setActionConfig({ ...actionConfig, delay_unit: v, delay_hours: v === "days" ? (actionConfig.delay_value || 24) * 24 : (actionConfig.delay_value || 24) })}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hours" className="text-xs">Horas</SelectItem>
                            <SelectItem value="days" className="text-xs">Dias</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Máx. tentativas</Label>
                        <NumericInput value={actionConfig.max_attempts ?? 3} decimals={0} onChange={v => setActionConfig({ ...actionConfig, max_attempts: v ?? 3 })} className="h-8 text-xs" />
                      </div>
                    </div>
                  )}
                  {actionType === "ai_qualify" && (
                    <div>
                      <Label className="text-xs flex items-center gap-1"><MessageSquare className="w-3 h-3" /> Mensagem de qualificação (opcional)</Label>
                      <Textarea
                        value={actionConfig.initial_message || ""}
                        onChange={e => setActionConfig({ ...actionConfig, initial_message: e.target.value })}
                        placeholder="Deixe vazio para usar a mensagem padrão de qualificação BANT..."
                        className="min-h-[60px] text-xs"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editingId ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AutomationTabContent({
  isAi, automations, recommended, funnels, onNew, onEdit, onDelete, onToggle, onActivateRec, isAiAction,
}: {
  isAi: boolean;
  automations: AutomationRecord[];
  recommended: RecommendedAutomation[];
  funnels: CrmFunnel[] | undefined;
  onNew: () => void;
  onEdit: (auto: AutomationRecord) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, isActive: boolean) => void;
  onActivateRec: (rec: RecommendedAutomation) => void;
  isAiAction: (type: string) => { value: string; label: string; ai: boolean } | undefined;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [running, setRunning] = useState(false);

  const forceRun = async () => {
    setRunning(true);
    try {
      const { error } = await invokeEdge("crm-run-automations", { body: {} });
      if (error) throw error;
      toast({ title: "Automações executadas!", description: "Processando fila agora..." });
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["crm-automations"] });
        queryClient.invalidateQueries({ queryKey: ["automation-execution-logs"] });
      }, 1500);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Tente novamente";
      toast({ title: "Erro ao executar", description: msg, variant: "destructive" });
    } finally {
      setTimeout(() => setRunning(false), 1500);
    }
  };

  return (
    <div className="space-y-3 mt-3">
      <EducationalBlock isAi={isAi} />

      {/* Recommended */}
      {recommended.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold">Recomendadas</span>
            <Badge variant="secondary" className="text-[9px]">Sugeridas para você</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {recommended.map((rec, i) => (
              <Card key={i} className="border-primary/10 bg-primary/[0.02]">
                <CardContent className="p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium">{rec.name}</p>
                    <p className="text-[10px] text-muted-foreground">{rec.description}</p>
                    <AutomationFlowPreview triggerType={rec.trigger_type} actionType={rec.action_type} />
                  </div>
                  <Button size="sm" variant="outline" className="shrink-0 h-7 text-[10px] gap-1" onClick={() => onActivateRec(rec)}>
                    <Zap className="w-3 h-3" /> Ativar
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* List + actions */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold">Suas automações</span>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="gap-1" onClick={forceRun} disabled={running}>
            <Play className="w-3.5 h-3.5" /> {running ? "Executando..." : "Executar agora"}
          </Button>
          <Button size="sm" className="gap-1" onClick={onNew}>
            <Plus className="w-3.5 h-3.5" /> Nova automação
          </Button>
        </div>
      </div>

      {automations.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            {isAi ? <Bot className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" /> : <Zap className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />}
            <p className="text-xs text-muted-foreground">
              {isAi ? "Nenhuma automação de IA configurada." : "Nenhuma automação do time configurada."}
            </p>
            <Button size="sm" variant="outline" className="mt-3 gap-1" onClick={onNew}>
              <Plus className="w-3 h-3" /> Criar primeira automação
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {automations.map(auto => {
            const fids = Array.isArray(auto.funnel_ids) ? auto.funnel_ids as string[] : [];
            const execCount = auto.execution_count || 0;
            const lastExec = auto.last_executed_at ? new Date(auto.last_executed_at) : null;
            return (
              <Card key={auto.id} className={auto.is_active ? "" : "opacity-60"}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Switch checked={auto.is_active} onCheckedChange={() => onToggle(auto.id, auto.is_active)} />
                    <div>
                      <p className="text-sm font-medium flex items-center gap-1.5">
                        {auto.name}
                        {isAiAction(auto.action_type) && <Badge className="text-[8px] bg-violet-500/10 text-violet-600 border-violet-200"><Bot className="w-2.5 h-2.5 mr-0.5" />IA</Badge>}
                      </p>
                      {auto.description && <p className="text-[10px] text-muted-foreground">{auto.description}</p>}
                      <AutomationFlowPreview triggerType={auto.trigger_type} actionType={auto.action_type} />
                      <div className="flex items-center gap-2 mt-1">
                        {fids.length > 0 && fids.map(fid => {
                          const f = funnels?.find(fu => fu.id === fid);
                          return f ? <Badge key={fid} variant="outline" className="text-[8px]">{f.name}</Badge> : null;
                        })}
                        {execCount > 0 && (
                          <Badge variant="secondary" className="text-[8px] gap-0.5 bg-emerald-500/10 text-emerald-700 border-emerald-200">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Executada {execCount}x
                          </Badge>
                        )}
                        {lastExec && (
                          <Badge variant="outline" className="text-[8px] gap-0.5 text-muted-foreground">
                            <Clock className="w-2.5 h-2.5" /> {formatDistanceToNow(lastExec, { addSuffix: true, locale: ptBR })}
                          </Badge>
                        )}
                        {auto.is_active && execCount === 0 && (
                          <Badge variant="outline" className="text-[8px] gap-0.5 bg-amber-500/5 border-amber-500/20 text-amber-700">
                            <AlertCircle className="w-2.5 h-2.5" /> Pronta — executa assim que o gatilho ocorrer
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onEdit(auto)}><Edit2 className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => onDelete(auto.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AutomationLogsTab({ automations }: { automations: AutomationRecord[] }) {
  const [statusFilter, setStatusFilter] = useState("");
  const [automationFilter, setAutomationFilter] = useState("");
  const { data: logs, isLoading } = useAutomationLogs({
    status: statusFilter || undefined,
    automationId: automationFilter || undefined,
  });

  const statusConfig: Record<string, { icon: React.ReactNode; label: string; className: string }> = {
    success: { icon: <CheckCircle className="w-3 h-3" />, label: "Sucesso", className: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
    error: { icon: <XCircle className="w-3 h-3" />, label: "Erro", className: "bg-destructive/10 text-destructive border-destructive/20" },
    skipped: { icon: <SkipForward className="w-3 h-3" />, label: "Ignorado", className: "bg-amber-500/10 text-amber-600 border-amber-200" },
  };

  if (isLoading) return <Skeleton className="h-32 mt-2" />;

  return (
    <div className="space-y-3 mt-2">
      <div className="flex gap-2">
        <Select value={statusFilter} onValueChange={v => setStatusFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="h-8 w-32 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">Todos</SelectItem>
            <SelectItem value="success" className="text-xs">Sucesso</SelectItem>
            <SelectItem value="error" className="text-xs">Erro</SelectItem>
            <SelectItem value="skipped" className="text-xs">Ignorado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={automationFilter} onValueChange={v => setAutomationFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="h-8 w-44 text-xs"><SelectValue placeholder="Automação" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">Todas</SelectItem>
            {automations.map(a => (
              <SelectItem key={a.id} value={a.id} className="text-xs">{a.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!logs || logs.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            <ScrollText className="w-8 h-8 mx-auto mb-2 opacity-30" />
            Nenhum log de execução encontrado
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
          {logs.map(log => {
            const sc = statusConfig[log.status] || statusConfig.error;
            return (
              <Card key={log.id} className="border-border/40">
                <CardContent className="p-3 flex items-start gap-3">
                  <div className="mt-0.5">{sc.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${sc.className}`}>
                        {sc.label}
                      </Badge>
                      {log.automation_name && (
                        <span className="text-xs font-medium truncate">{log.automation_name}</span>
                      )}
                      {log.action_type && (
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                          {ACTIONS.find(a => a.value === log.action_type)?.label || log.action_type}
                        </Badge>
                      )}
                    </div>
                    {log.lead_name && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">Lead: {log.lead_name}</p>
                    )}
                    {log.error_message && (
                      <p className="text-[11px] text-destructive mt-0.5 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" /> {log.error_message}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
