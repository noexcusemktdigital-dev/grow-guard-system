import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Zap, Plus, Trash2, Bot } from "lucide-react";
import { useCrmAutomations, useCrmAutomationMutations } from "@/hooks/useCrmAutomations";
import { useToast } from "@/hooks/use-toast";

const TRIGGERS = [
  { value: "stage_change", label: "Mudança de etapa" },
  { value: "lead_created", label: "Lead criado" },
  { value: "no_contact_sla", label: "Sem contato (SLA)" },
  { value: "task_overdue", label: "Tarefa atrasada" },
];

const ACTIONS = [
  { value: "create_task", label: "Criar tarefa" },
  { value: "add_tag", label: "Adicionar tag" },
  { value: "change_stage", label: "Mudar etapa" },
  { value: "notify", label: "Notificar responsável" },
  { value: "send_whatsapp", label: "Enviar WhatsApp" },
  { value: "ai_qualify", label: "IA: Qualificar lead", ai: true },
  { value: "ai_first_contact", label: "IA: Primeiro contato", ai: true },
  { value: "ai_followup", label: "IA: Follow-up automático", ai: true },
];

export function CrmAutomations() {
  const { toast } = useToast();
  const { data: automations, isLoading } = useCrmAutomations();
  const { createAutomation, updateAutomation, deleteAutomation } = useCrmAutomationMutations();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [triggerType, setTriggerType] = useState("stage_change");
  const [actionType, setActionType] = useState("create_task");
  const [actionConfig, setActionConfig] = useState<Record<string, any>>({});

  const reset = () => {
    setName("");
    setTriggerType("stage_change");
    setActionType("create_task");
    setActionConfig({});
  };

  const handleCreate = () => {
    if (!name.trim()) {
      toast({ title: "Informe o nome da automação", variant: "destructive" });
      return;
    }
    createAutomation.mutate({
      name,
      trigger_type: triggerType,
      action_type: actionType,
      action_config: actionConfig,
    });
    reset();
    setDialogOpen(false);
    toast({ title: "Automação criada" });
  };

  const toggleActive = (id: string, isActive: boolean) => {
    updateAutomation.mutate({ id, is_active: !isActive });
  };

  if (isLoading) return <Skeleton className="h-48 mt-4" />;

  const isAiAction = (type: string) => ACTIONS.find(a => a.value === type && (a as any).ai);

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2"><Zap className="w-4 h-4" /> Automações</h3>
          <p className="text-xs text-muted-foreground">Configure regras automáticas para seu CRM</p>
        </div>
        <Button size="sm" className="gap-1" onClick={() => setDialogOpen(true)}>
          <Plus className="w-3.5 h-3.5" /> Nova automação
        </Button>
      </div>

      {(!automations || automations.length === 0) ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <Zap className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Nenhuma automação configurada.</p>
            <Button size="sm" variant="outline" className="mt-3 gap-1" onClick={() => setDialogOpen(true)}>
              <Plus className="w-3 h-3" /> Criar primeira automação
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {automations.map(auto => (
            <Card key={auto.id}>
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Switch checked={auto.is_active} onCheckedChange={() => toggleActive(auto.id, auto.is_active)} />
                  <div>
                    <p className="text-sm font-medium flex items-center gap-1.5">
                      {auto.name}
                      {isAiAction(auto.action_type) && <Badge className="text-[8px] bg-violet-500/10 text-violet-600 border-violet-200"><Bot className="w-2.5 h-2.5 mr-0.5" />IA</Badge>}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Quando: {TRIGGERS.find(t => t.value === auto.trigger_type)?.label} → Então: {ACTIONS.find(a => a.value === auto.action_type)?.label}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => { deleteAutomation.mutate(auto.id); toast({ title: "Automação excluída" }); }}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nova Automação</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Nome</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Follow-up automático" /></div>
            <div>
              <Label className="text-xs">Quando... (Trigger)</Label>
              <Select value={triggerType} onValueChange={setTriggerType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TRIGGERS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Então... (Ação)</Label>
              <Select value={actionType} onValueChange={setActionType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACTIONS.map(a => (
                    <SelectItem key={a.value} value={a.value}>
                      {(a as any).ai && "🤖 "}{a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {actionType === "create_task" && (
              <div>
                <Label className="text-xs">Título da tarefa</Label>
                <Input value={actionConfig.task_title || ""} onChange={e => setActionConfig({ ...actionConfig, task_title: e.target.value })} placeholder="Ex: Fazer follow-up" />
              </div>
            )}
            {actionType === "add_tag" && (
              <div>
                <Label className="text-xs">Tag</Label>
                <Input value={actionConfig.tag || ""} onChange={e => setActionConfig({ ...actionConfig, tag: e.target.value })} placeholder="Ex: qualificado" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate}>Criar Automação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
