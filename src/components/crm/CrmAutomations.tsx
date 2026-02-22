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
import { Zap, Plus, Trash2, Bot, Edit2, Layers } from "lucide-react";
import { useCrmAutomations, useCrmAutomationMutations } from "@/hooks/useCrmAutomations";
import { useCrmFunnels } from "@/hooks/useCrmFunnels";
import { useCrmTeams } from "@/hooks/useCrmTeams";
import { useCrmTeam } from "@/hooks/useCrmTeam";
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

export function CrmAutomations() {
  const { toast } = useToast();
  const { data: automations, isLoading } = useCrmAutomations();
  const { createAutomation, updateAutomation, deleteAutomation } = useCrmAutomationMutations();
  const { data: funnels } = useCrmFunnels();
  const { data: teams } = useCrmTeams();
  const { data: members } = useCrmTeam();

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
  const [priority, setPriority] = useState(0);
  const [filterFunnel, setFilterFunnel] = useState("");

  const reset = () => {
    setEditingId(null); setName(""); setDescription(""); setTriggerType("lead_created"); setActionType("create_task");
    setActionConfig({}); setTriggerConfig({}); setSelectedFunnels([]); setSelectedTeams([]); setPriority(0);
  };

  const openNew = () => { reset(); setDialogOpen(true); };

  const openEdit = (auto: any) => {
    setEditingId(auto.id);
    setName(auto.name);
    setDescription(auto.description || "");
    setTriggerType(auto.trigger_type);
    setActionType(auto.action_type);
    setActionConfig(auto.action_config || {});
    setTriggerConfig(auto.trigger_config || {});
    setSelectedFunnels(Array.isArray(auto.funnel_ids) ? auto.funnel_ids : []);
    setSelectedTeams(Array.isArray(auto.team_ids) ? auto.team_ids : []);
    setPriority(auto.priority || 0);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!name.trim()) { toast({ title: "Informe o nome", variant: "destructive" }); return; }
    const payload = {
      name, description, trigger_type: triggerType, action_type: actionType,
      action_config: actionConfig, trigger_config: triggerConfig,
      funnel_ids: selectedFunnels, team_ids: selectedTeams, priority,
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

  const toggleActive = (id: string, isActive: boolean) => {
    updateAutomation.mutate({ id, is_active: !isActive });
  };

  const isAiAction = (type: string) => ACTIONS.find(a => a.value === type && (a as any).ai);

  const filteredAutomations = (automations || []).filter(a => {
    if (!filterFunnel) return true;
    const fids = Array.isArray((a as any).funnel_ids) ? (a as any).funnel_ids : [];
    return fids.length === 0 || fids.includes(filterFunnel);
  });

  if (isLoading) return <Skeleton className="h-48 mt-4" />;

  return (
    <div className="space-y-4 mt-4">
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
            const fids = Array.isArray((auto as any).funnel_ids) ? (auto as any).funnel_ids as string[] : [];
            return (
              <Card key={auto.id}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Switch checked={auto.is_active} onCheckedChange={() => toggleActive(auto.id, auto.is_active)} />
                    <div>
                      <p className="text-sm font-medium flex items-center gap-1.5">
                        {auto.name}
                        {isAiAction(auto.action_type) && <Badge className="text-[8px] bg-violet-500/10 text-violet-600 border-violet-200"><Bot className="w-2.5 h-2.5 mr-0.5" />IA</Badge>}
                      </p>
                      {(auto as any).description && <p className="text-[10px] text-muted-foreground">{(auto as any).description}</p>}
                      <p className="text-[10px] text-muted-foreground">
                        Quando: {TRIGGERS.find(t => t.value === auto.trigger_type)?.label} → Então: {ACTIONS.find(a => a.value === auto.action_type)?.label}
                      </p>
                      {fids.length > 0 && (
                        <div className="flex gap-1 mt-0.5">
                          {fids.map(fid => {
                            const f = funnels?.find(fu => fu.id === fid);
                            return f ? <Badge key={fid} variant="outline" className="text-[8px]">{f.name}</Badge> : null;
                          })}
                        </div>
                      )}
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
                <SelectContent>{ACTIONS.map(a => <SelectItem key={a.value} value={a.value}>{(a as any).ai && "🤖 "}{a.label}</SelectItem>)}</SelectContent>
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
            </div>

            {/* Priority */}
            <div>
              <Label className="text-xs">Prioridade da automação</Label>
              <Select value={String(priority)} onValueChange={v => setPriority(Number(v))}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0" className="text-xs">Normal</SelectItem>
                  <SelectItem value="1" className="text-xs">Alta</SelectItem>
                  <SelectItem value="2" className="text-xs">Urgente</SelectItem>
                </SelectContent>
              </Select>
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
