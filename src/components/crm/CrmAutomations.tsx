// @ts-nocheck
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Zap, Plus, Trash2, Bot, Edit2, Layers, ArrowRight, Sparkles, CheckCircle2, Clock, MessageSquare } from "lucide-react";
import { useCrmAutomations, useCrmAutomationMutations } from "@/hooks/useCrmAutomations";
import { useCrmFunnels } from "@/hooks/useCrmFunnels";
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
  { value: "create_task", label: "Criar tarefa" },
  { value: "add_tag", label: "Adicionar tag" },
  { value: "remove_tag", label: "Remover tag" },
  { value: "change_stage", label: "Mudar etapa" },
  { value: "notify", label: "Notificar responsável" },
  { value: "send_whatsapp", label: "Enviar WhatsApp" },
  { value: "assign_to_person", label: "Atribuir a pessoa" },
  { value: "assign_to_team", label: "Atribuir a time" },
  { value: "move_to_funnel", label: "Mover para outro funil" },
  { value: "ai_qualify", label: "IA: Qualificar lead", ai: true },
  { value: "ai_first_contact", label: "IA: Primeiro contato", ai: true },
  { value: "ai_followup", label: "IA: Follow-up automático", ai: true },
];

interface RecommendedAutomation {
  name: string;
  description: string;
  trigger_type: string;
  action_type: string;
  trigger_config?: Record<string, any>;
  action_config?: Record<string, any>;
}

function getRecommendedAutomations(answers: Record<string, any> | null): RecommendedAutomation[] {
  const recs: RecommendedAutomation[] = [];

  // AI-powered automations - always recommend
  recs.push({
    name: "🤖 Primeiro contato IA",
    description: "Agente SDR envia mensagem de boas-vindas e inicia qualificação BANT automaticamente",
    trigger_type: "lead_created",
    action_type: "ai_first_contact",
    action_config: { initial_message: "" },
  });

  recs.push({
    name: "🔄 Follow-up automático 24h",
    description: "Se o lead não responder em 24h, o agente IA faz follow-up (até 3 tentativas)",
    trigger_type: "lead_created",
    action_type: "ai_followup",
    action_config: { delay_hours: 24, max_attempts: 3 },
  });

  recs.push({
    name: "🎯 Qualificação IA por etapa",
    description: "Quando lead entra na etapa 'Qualificação', IA inicia processo de qualificação via WhatsApp",
    trigger_type: "stage_change",
    action_type: "ai_qualify",
    trigger_config: { stage: "qualificacao" },
  });

  recs.push({
    name: "🎉 Notificar equipe em venda",
    description: "Notifica toda a equipe quando um lead é convertido em venda",
    trigger_type: "lead_won",
    action_type: "notify",
    action_config: { notification_title: "🎉 Nova venda fechada!", notification_message: "" },
  });

  recs.push({
    name: "⚠️ Alerta lead quente parado",
    description: "Alerta quando lead quente fica sem atividade por 3 dias",
    trigger_type: "lead_stuck",
    action_type: "notify",
    trigger_config: { days: 3 },
  });

  recs.push({
    name: "🏷️ Mover lead qualificado para Closer",
    description: "Quando tag 'qualificado' é adicionada, move para etapa do Closer e inicia contato IA",
    trigger_type: "tag_added",
    action_type: "ai_first_contact",
    trigger_config: { tag: "qualificado" },
    action_config: { initial_message: "Olá! Sou especialista em soluções e vi que você foi qualificado. Vamos conversar sobre como posso ajudar?" },
  });

  return recs;
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

  const recommended = getRecommendedAutomations(salesPlan?.answers || null);
  const existingNames = new Set((automations || []).map(a => a.name));

  const reset = () => {
    setEditingId(null); setName(""); setDescription(""); setTriggerType("lead_created"); setActionType("create_task");
    setActionConfig({}); setTriggerConfig({}); setSelectedFunnels([]); setSelectedTeams([]); setSelectedAgentId("");
  };

  const openNew = () => { reset(); setDialogOpen(true); };

  const openEdit = (auto: Record<string, unknown>) => {
    setEditingId(auto.id);
    setName(auto.name);
    setDescription(auto.description || "");
    setTriggerType(auto.trigger_type);
    setActionType(auto.action_type);
    setActionConfig(auto.action_config || {});
    setTriggerConfig(auto.trigger_config || {});
    setSelectedFunnels(Array.isArray(auto.funnel_ids) ? auto.funnel_ids : []);
    setSelectedTeams(Array.isArray(auto.team_ids) ? auto.team_ids : []);
    setSelectedAgentId(auto.agent_id || "");
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!name.trim()) { toast({ title: "Informe o nome", variant: "destructive" }); return; }
    if (isAiAction(actionType) && !selectedAgentId) {
      toast({ title: "Selecione um agente IA para esta automação", variant: "destructive" }); return;
    }
    const payload: Record<string, unknown> = {
      name, description, trigger_type: triggerType, action_type: actionType,
      action_config: actionConfig, trigger_config: triggerConfig,
      funnel_ids: selectedFunnels, team_ids: selectedTeams,
      agent_id: selectedAgentId || null,
    };
    if (editingId) {
      updateAutomation.mutate({ id: editingId, ...payload });
      toast({ title: "Automação atualizada" });
    } else {
      createAutomation.mutate(payload);
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

  const isAiAction = (type: string) => ACTIONS.find(a => a.value === type && (a as { value: string; label: string; ai?: boolean }).ai);

  const filteredAutomations = (automations || []).filter(a => {
    if (!filterFunnel) return true;
    const fids = Array.isArray((a as unknown as { funnel_ids?: string[] }).funnel_ids) ? (a as unknown as { funnel_ids?: string[] }).funnel_ids : [];
    return fids.length === 0 || fids.includes(filterFunnel);
  });

  if (isLoading) return <Skeleton className="h-48 mt-4" />;

  const pendingRecs = recommended.filter(r => !existingNames.has(r.name));

  return (
    <div className="space-y-4 mt-4">
      {/* Recommended Automations */}
      {pendingRecs.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold">Automações Recomendadas</span>
            <Badge variant="secondary" className="text-[9px]">Baseado no seu plano</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {pendingRecs.map((rec, i) => (
              <Card key={i} className="border-primary/10 bg-primary/[0.02]">
                <CardContent className="p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium">{rec.name}</p>
                    <p className="text-[10px] text-muted-foreground">{rec.description}</p>
                    <AutomationFlowPreview triggerType={rec.trigger_type} actionType={rec.action_type} />
                  </div>
                  <Button size="sm" variant="outline" className="shrink-0 h-7 text-[10px] gap-1" onClick={() => handleActivateRecommended(rec)}>
                    <Zap className="w-3 h-3" /> Ativar
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2"><Zap className="w-4 h-4" /> Automações</h3>
          <p className="text-xs text-muted-foreground">Configure regras automáticas para seu CRM</p>
        </div>
        <div className="flex items-center gap-2">
          {funnels && funnels.length > 1 && (
            <Select value={filterFunnel} onValueChange={v => setFilterFunnel(v === "all" ? "" : v)}>
              <SelectTrigger className="h-8 w-36 text-xs"><Layers className="w-3 h-3 mr-1" /><SelectValue placeholder="Todos os funis" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">Todos os funis</SelectItem>
                {funnels.map(f => <SelectItem key={f.id} value={f.id} className="text-xs">{f.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Button size="sm" className="gap-1" onClick={openNew}><Plus className="w-3.5 h-3.5" /> Nova automação</Button>
        </div>
      </div>

      {filteredAutomations.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <Zap className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Nenhuma automação configurada.</p>
            <Button size="sm" variant="outline" className="mt-3 gap-1" onClick={openNew}><Plus className="w-3 h-3" /> Criar primeira automação</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredAutomations.map(auto => {
            const fids = Array.isArray((auto as unknown as { funnel_ids?: string[] }).funnel_ids) ? (auto as unknown as { funnel_ids?: string[] }).funnel_ids as string[] : [];
            const execCount = (auto as unknown as { execution_count?: number }).execution_count || 0;
            return (
              <Card key={auto.id} className={auto.is_active ? "" : "opacity-60"}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Switch checked={auto.is_active} onCheckedChange={() => toggleActive(auto.id, auto.is_active)} />
                    <div>
                      <p className="text-sm font-medium flex items-center gap-1.5">
                        {auto.name}
                        {isAiAction(auto.action_type) && <Badge className="text-[8px] bg-violet-500/10 text-violet-600 border-violet-200"><Bot className="w-2.5 h-2.5 mr-0.5" />IA</Badge>}
                      </p>
                      {(auto as unknown as { description?: string }).description && <p className="text-[10px] text-muted-foreground">{(auto as unknown as { description?: string }).description}</p>}
                      <AutomationFlowPreview triggerType={auto.trigger_type} actionType={auto.action_type} />
                      <div className="flex items-center gap-2 mt-1">
                        {fids.length > 0 && fids.map(fid => {
                          const f = funnels?.find(fu => fu.id === fid);
                          return f ? <Badge key={fid} variant="outline" className="text-[8px]">{f.name}</Badge> : null;
                        })}
                        {execCount > 0 && (
                          <Badge variant="secondary" className="text-[8px] gap-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5" /> {execCount}x executada
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(auto)}><Edit2 className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => { deleteAutomation.mutate(auto.id); toast({ title: "Automação excluída" }); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

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
                <div><Label className="text-xs">Dias parado</Label><Input type="number" value={triggerConfig.days || 7} onChange={e => setTriggerConfig({ ...triggerConfig, days: Number(e.target.value) })} className="h-8 text-xs w-24" /></div>
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
                <SelectContent>{ACTIONS.map(a => <SelectItem key={a.value} value={a.value}>{(a as { value: string; label: string; ai?: boolean }).ai && "🤖 "}{a.label}</SelectItem>)}</SelectContent>
              </Select>

              {actionType === "create_task" && (
                <div className="space-y-2">
                  <div><Label className="text-xs">Título da tarefa</Label><Input value={actionConfig.task_title || ""} onChange={e => setActionConfig({ ...actionConfig, task_title: e.target.value })} placeholder="Ex: Fazer follow-up" className="h-8 text-xs" /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label className="text-xs">Prazo (dias)</Label><Input type="number" value={actionConfig.due_days || 1} onChange={e => setActionConfig({ ...actionConfig, due_days: Number(e.target.value) })} className="h-8 text-xs" /></div>
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
              {actionType === "change_stage" && (
                <div><Label className="text-xs">Para etapa</Label><Input value={actionConfig.target_stage || ""} onChange={e => setActionConfig({ ...actionConfig, target_stage: e.target.value })} placeholder="Ex: qualificacao" className="h-8 text-xs" /></div>
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
                <div>
                  <Label className="text-xs">Funil de destino</Label>
                  <Select value={actionConfig.target_funnel_id || ""} onValueChange={v => setActionConfig({ ...actionConfig, target_funnel_id: v })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                    <SelectContent>{funnels.map(f => <SelectItem key={f.id} value={f.id} className="text-xs">{f.name}</SelectItem>)}</SelectContent>
                  </Select>
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
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs flex items-center gap-1"><Clock className="w-3 h-3" /> Delay (horas)</Label>
                        <Input type="number" value={actionConfig.delay_hours || 24} onChange={e => setActionConfig({ ...actionConfig, delay_hours: Number(e.target.value) })} className="h-8 text-xs" />
                      </div>
                      <div>
                        <Label className="text-xs">Máx. tentativas</Label>
                        <Input type="number" value={actionConfig.max_attempts || 3} onChange={e => setActionConfig({ ...actionConfig, max_attempts: Number(e.target.value) })} className="h-8 text-xs" />
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
