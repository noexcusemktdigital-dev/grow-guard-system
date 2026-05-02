import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, Save } from "lucide-react";
import { useCrmSettings, useCrmSettingsMutations } from "@/hooks/useCrmSettings";
import { useToast } from "@/hooks/use-toast";

export function CrmSlaConfig() {
  const { toast } = useToast();
  const { data: settings, isLoading } = useCrmSettings();
  const { upsertSettings } = useCrmSettingsMutations();

  // SLA 1st contact
  const [contactValue, setContactValue] = useState(24);
  const [contactUnit, setContactUnit] = useState<"minutes" | "hours">("hours");

  // SLA no response
  const [noResponseValue, setNoResponseValue] = useState(72);
  const [noResponseUnit, setNoResponseUnit] = useState<"minutes" | "hours">("hours");
  const [noResponseEnabled, setNoResponseEnabled] = useState(true);

  // SLA stage stuck
  const [stageStuckDays, setStageStuckDays] = useState(7);
  const [stageStuckEnabled, setStageStuckEnabled] = useState(true);

  // General
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [autoTasks, setAutoTasks] = useState(true);

  useEffect(() => {
    if (settings) {
      // First contact
      const fcMin = (settings as Record<string, unknown>).sla_first_contact_minutes as number || settings.sla_first_contact_hours * 60;
      if (fcMin >= 60 && fcMin % 60 === 0) {
        setContactValue(fcMin / 60);
        setContactUnit("hours");
      } else {
        setContactValue(fcMin);
        setContactUnit("minutes");
      }

      // No response
      const nrMin = (settings as Record<string, unknown>).sla_no_response_minutes as number || 4320;
      if (nrMin >= 60 && nrMin % 60 === 0) {
        setNoResponseValue(nrMin / 60);
        setNoResponseUnit("hours");
      } else {
        setNoResponseValue(nrMin);
        setNoResponseUnit("minutes");
      }

      setStageStuckDays((settings as Record<string, unknown>).sla_stage_stuck_days as number || 7);
      setAlertsEnabled(settings.alerts_enabled);
      setAutoTasks(settings.auto_tasks_on_stage_move);
    }
  }, [settings]);

  const handleSave = () => {
    const firstContactMinutes = contactUnit === "hours" ? contactValue * 60 : contactValue;
    const noResponseMinutes = noResponseUnit === "hours" ? noResponseValue * 60 : noResponseValue;

    upsertSettings.mutate({
      sla_first_contact_hours: Math.round(firstContactMinutes / 60), // keep legacy
      sla_first_contact_minutes: firstContactMinutes,
      sla_no_response_minutes: noResponseMinutes,
      sla_stage_stuck_days: stageStuckDays,
      sla_task_open_days: settings?.sla_task_open_days || 3,
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
      <CardContent className="space-y-5">
        {/* SLA 1st Contact */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold">Tempo máximo para 1º contato</Label>
          </div>
          <div className="flex gap-2">
            <Input type="number" value={contactValue} onChange={e => setContactValue(Number(e.target.value))} className="h-8 w-24" min={1} />
            <Select value={contactUnit} onValueChange={(v: string) => setContactUnit(v as "minutes" | "hours")}>
              <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="minutes" className="text-xs">Minutos</SelectItem>
                <SelectItem value="hours" className="text-xs">Horas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* SLA No Response */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold">Tempo máximo sem resposta do lead</Label>
            <Switch checked={noResponseEnabled} onCheckedChange={setNoResponseEnabled} />
          </div>
          {noResponseEnabled && (
            <div className="flex gap-2">
              <Input type="number" value={noResponseValue} onChange={e => setNoResponseValue(Number(e.target.value))} className="h-8 w-24" min={1} />
              <Select value={noResponseUnit} onValueChange={(v: string) => setNoResponseUnit(v as "minutes" | "hours")}>
                <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="minutes" className="text-xs">Minutos</SelectItem>
                  <SelectItem value="hours" className="text-xs">Horas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* SLA Stage Stuck */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold">Lead parado na mesma etapa (dias)</Label>
            <Switch checked={stageStuckEnabled} onCheckedChange={setStageStuckEnabled} />
          </div>
          {stageStuckEnabled && (
            <Input type="number" value={stageStuckDays} onChange={e => setStageStuckDays(Number(e.target.value))} className="h-8 w-24" min={1} />
          )}
        </div>

        <div className="border-t pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Alertas habilitados</Label>
            <Switch checked={alertsEnabled} onCheckedChange={setAlertsEnabled} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm">Criar tarefas automáticas ao mover etapa</Label>
            <Switch checked={autoTasks} onCheckedChange={setAutoTasks} />
          </div>
        </div>

        <Button size="sm" className="gap-1" onClick={handleSave}>
          <Save className="w-3.5 h-3.5" /> Salvar
        </Button>
      </CardContent>
    </Card>
  );
}
