import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shuffle, Save } from "lucide-react";
import { useCrmSettings, useCrmSettingsMutations } from "@/hooks/useCrmSettings";
import { useCrmTeam } from "@/hooks/useCrmTeam";
import { useCrmFunnels, useCrmFunnelMutations } from "@/hooks/useCrmFunnels";
import { useToast } from "@/hooks/use-toast";

export function CrmRouletteConfig() {
  const { toast } = useToast();
  const { data: settings, isLoading: settingsLoading } = useCrmSettings();
  const { data: team, isLoading: teamLoading } = useCrmTeam();
  const { data: funnels, isLoading: funnelsLoading } = useCrmFunnels();
  const { upsertSettings } = useCrmSettingsMutations();
  const { updateFunnel } = useCrmFunnelMutations();

  const [globalEnabled, setGlobalEnabled] = useState(false);
  const [globalMembers, setGlobalMembers] = useState<string[]>([]);
  const [funnelConfigs, setFunnelConfigs] = useState<Record<string, { enabled: boolean; stage: string; members: string[] }>>({});

  useEffect(() => {
    if (settings) {
      setGlobalEnabled(settings.lead_roulette_enabled);
      setGlobalMembers((settings.roulette_members as string[]) || []);
    }
  }, [settings]);

  useEffect(() => {
    if (funnels) {
      const configs: typeof funnelConfigs = {};
      funnels.forEach(f => {
        const ff = f as typeof f & { roulette_enabled?: boolean; roulette_stage?: string; roulette_members?: string[] };
        configs[f.id] = {
          enabled: ff.roulette_enabled || false,
          stage: ff.roulette_stage || "",
          members: ff.roulette_members || [],
        };
      });
      setFunnelConfigs(configs);
    }
  }, [funnels]);

  const isLoading = settingsLoading || teamLoading || funnelsLoading;

  const handleSaveGlobal = () => {
    upsertSettings.mutate({
      lead_roulette_enabled: globalEnabled,
      roulette_members: globalMembers,
    });
    toast({ title: "Roleta global salva" });
  };

  const handleSaveFunnel = (funnelId: string) => {
    const config = funnelConfigs[funnelId];
    updateFunnel.mutate({
      id: funnelId,
      roulette_enabled: config.enabled,
      roulette_stage: config.stage || null,
      roulette_members: config.members,
    } as Parameters<typeof updateFunnel.mutate>[0]);
    toast({ title: "Roleta do funil salva" });
  };

  const updateFunnelConfig = (funnelId: string, key: keyof (typeof funnelConfigs)[string], value: boolean | string | string[]) => {
    setFunnelConfigs(prev => ({
      ...prev,
      [funnelId]: { ...prev[funnelId], [key]: value },
    }));
  };

  const toggleFunnelMember = (funnelId: string, userId: string) => {
    const current = funnelConfigs[funnelId]?.members || [];
    const updated = current.includes(userId)
      ? current.filter(id => id !== userId)
      : [...current, userId];
    updateFunnelConfig(funnelId, "members", updated);
  };

  if (isLoading) return <Skeleton className="h-48" />;

  return (
    <div className="space-y-4 mt-4">
      {/* Global Roulette */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Shuffle className="w-4 h-4" /> Roleta Global
            <Badge variant="outline" className="text-[9px] ml-auto">Todos os funis</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">Distribuição automática global</Label>
              <p className="text-[10px] text-muted-foreground">
                Aplica a todos os funis sem configuração específica
              </p>
            </div>
            <Switch checked={globalEnabled} onCheckedChange={setGlobalEnabled} />
          </div>

          {globalEnabled && team && team.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs font-medium">Membros na roleta global:</Label>
              <div className="space-y-1">
                {team.map(m => (
                  <label key={m.user_id} className="flex items-center gap-2 p-2 rounded border hover:bg-muted/30 cursor-pointer">
                    <Checkbox
                      checked={globalMembers.includes(m.user_id)}
                      onCheckedChange={() => setGlobalMembers(prev =>
                        prev.includes(m.user_id) ? prev.filter(id => id !== m.user_id) : [...prev, m.user_id]
                      )}
                    />
                    <span className="text-sm">{m.full_name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          <Button size="sm" className="gap-1" onClick={handleSaveGlobal}>
            <Save className="w-3.5 h-3.5" /> Salvar roleta global
          </Button>
        </CardContent>
      </Card>

      {/* Per-Funnel Roulette */}
      {funnels && funnels.map(funnel => {
        const config = funnelConfigs[funnel.id] || { enabled: false, stage: "", members: [] };
        const stages = funnel.stages || [];

        return (
          <Card key={funnel.id}>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Shuffle className="w-4 h-4" />
                {funnel.name}
                {config.enabled && <Badge variant="secondary" className="text-[9px]">Ativa</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Roleta específica para este funil</Label>
                <Switch
                  checked={config.enabled}
                  onCheckedChange={v => updateFunnelConfig(funnel.id, "enabled", v)}
                />
              </div>

              {config.enabled && (
                <>
                  <div className="space-y-2">
                    <Label className="text-xs">Ativar roleta ao entrar na etapa (opcional)</Label>
                    <Select
                      value={config.stage || "any"}
                      onValueChange={v => updateFunnelConfig(funnel.id, "stage", v === "any" ? "" : v)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any" className="text-xs">Qualquer etapa (lead criado)</SelectItem>
                        {stages.map((s) => (
                          <SelectItem key={s.key} value={s.key} className="text-xs">
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-muted-foreground">
                      Quando um lead entrar nessa etapa, será atribuído automaticamente
                    </p>
                  </div>

                  {team && team.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Membros nesta roleta:</Label>
                      <div className="space-y-1">
                        {team.map(m => (
                          <label key={m.user_id} className="flex items-center gap-2 p-2 rounded border hover:bg-muted/30 cursor-pointer">
                            <Checkbox
                              checked={config.members.includes(m.user_id)}
                              onCheckedChange={() => toggleFunnelMember(funnel.id, m.user_id)}
                            />
                            <span className="text-sm">{m.full_name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              <Button size="sm" className="gap-1" onClick={() => handleSaveFunnel(funnel.id)}>
                <Save className="w-3.5 h-3.5" /> Salvar roleta do {funnel.name}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
