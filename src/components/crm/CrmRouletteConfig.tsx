// @ts-nocheck
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Shuffle, Save } from "lucide-react";
import { useCrmSettings, useCrmSettingsMutations } from "@/hooks/useCrmSettings";
import { useCrmTeam } from "@/hooks/useCrmTeam";
import { useToast } from "@/hooks/use-toast";

export function CrmRouletteConfig() {
  const { toast } = useToast();
  const { data: settings, isLoading: settingsLoading } = useCrmSettings();
  const { data: team, isLoading: teamLoading } = useCrmTeam();
  const { upsertSettings } = useCrmSettingsMutations();

  const [enabled, setEnabled] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  useEffect(() => {
    if (settings) {
      setEnabled(settings.lead_roulette_enabled);
      setSelectedMembers((settings.roulette_members as string[]) || []);
    }
  }, [settings]);

  const isLoading = settingsLoading || teamLoading;

  const handleSave = () => {
    upsertSettings.mutate({
      lead_roulette_enabled: enabled,
      roulette_members: selectedMembers,
    });
    toast({ title: "Configuração da roleta salva" });
  };

  const toggleMember = (userId: string) => {
    setSelectedMembers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  if (isLoading) return <Skeleton className="h-48" />;

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2"><Shuffle className="w-4 h-4" /> Roleta de Leads</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm">Distribuição automática de leads</Label>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>

        <p className="text-xs text-muted-foreground">
          Quando ativa, novos leads são atribuídos automaticamente em round-robin entre os membros selecionados.
        </p>

        {enabled && (
          <div className="space-y-2">
            <Label className="text-xs font-medium">Membros na roleta:</Label>
            {(!team || team.length === 0) ? (
              <p className="text-xs text-muted-foreground">Nenhum membro disponível.</p>
            ) : (
              <div className="space-y-1">
                {team.map(m => (
                  <label key={m.user_id} className="flex items-center gap-2 p-2 rounded border hover:bg-muted/30 cursor-pointer">
                    <Checkbox
                      checked={selectedMembers.includes(m.user_id)}
                      onCheckedChange={() => toggleMember(m.user_id)}
                    />
                    <span className="text-sm">{m.full_name}</span>
                    <Badge variant="outline" className="text-[9px] ml-auto">{m.role}</Badge>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        <Button size="sm" className="gap-1" onClick={handleSave}>
          <Save className="w-3.5 h-3.5" /> Salvar
        </Button>
      </CardContent>
    </Card>
  );
}
