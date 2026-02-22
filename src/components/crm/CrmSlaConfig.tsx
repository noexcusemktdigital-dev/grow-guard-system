import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, Save } from "lucide-react";
import { useCrmSettings, useCrmSettingsMutations } from "@/hooks/useCrmSettings";
import { useToast } from "@/hooks/use-toast";

export function CrmSlaConfig() {
  const { toast } = useToast();
  const { data: settings, isLoading } = useCrmSettings();
  const { upsertSettings } = useCrmSettingsMutations();

  const [slaContact, setSlaContact] = useState(24);
  const [slaTask, setSlaTask] = useState(3);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [autoTasks, setAutoTasks] = useState(true);

  useEffect(() => {
    if (settings) {
      setSlaContact(settings.sla_first_contact_hours);
      setSlaTask(settings.sla_task_open_days);
      setAlertsEnabled(settings.alerts_enabled);
      setAutoTasks(settings.auto_tasks_on_stage_move);
    }
  }, [settings]);

  const handleSave = () => {
    upsertSettings.mutate({
      sla_first_contact_hours: slaContact,
      sla_task_open_days: slaTask,
      alerts_enabled: alertsEnabled,
      auto_tasks_on_stage_move: autoTasks,
    });
    toast({ title: "Configurações de SLA salvas" });
  };

  if (isLoading) return <Skeleton className="h-48" />;

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2"><Bell className="w-4 h-4" /> SLA e Alertas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs">Tempo máximo para 1º contato (horas)</Label>
            <Input type="number" value={slaContact} onChange={e => setSlaContact(Number(e.target.value))} className="h-8 mt-1" />
          </div>
          <div>
            <Label className="text-xs">Tempo máximo de tarefa aberta (dias)</Label>
            <Input type="number" value={slaTask} onChange={e => setSlaTask(Number(e.target.value))} className="h-8 mt-1" />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Label className="text-sm">Alertas habilitados</Label>
          <Switch checked={alertsEnabled} onCheckedChange={setAlertsEnabled} />
        </div>

        <div className="flex items-center justify-between">
          <Label className="text-sm">Criar tarefas automáticas ao mover etapa</Label>
          <Switch checked={autoTasks} onCheckedChange={setAutoTasks} />
        </div>

        <Button size="sm" className="gap-1" onClick={handleSave}>
          <Save className="w-3.5 h-3.5" /> Salvar
        </Button>
      </CardContent>
    </Card>
  );
}
