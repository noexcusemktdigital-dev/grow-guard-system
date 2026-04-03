import { useState } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useCrmSettings, useCrmSettingsMutations } from "@/hooks/useCrmSettings";
import { useToast } from "@/hooks/use-toast";

const DEFAULT_REASONS = [
  "Preço", "Concorrência", "Timing inadequado", "Sem orçamento",
  "Sem resposta", "Escolheu outro fornecedor", "Desistiu do projeto",
];

export function CrmLossReasonsConfig() {
  const { data: settings } = useCrmSettings();
  const { upsertSettings } = useCrmSettingsMutations();
  const { toast } = useToast();
  const [newReason, setNewReason] = useState("");

  const reasons: string[] = (settings as Record<string, unknown>)?.loss_reasons as string[] || DEFAULT_REASONS;

  const handleAdd = () => {
    const trimmed = newReason.trim();
    if (!trimmed || reasons.includes(trimmed)) return;
    const updated = [...reasons, trimmed];
    upsertSettings.mutate({ loss_reasons: updated } as Record<string, unknown>);
    setNewReason("");
    toast({ title: "Motivo adicionado" });
  };

  const handleRemove = (reason: string) => {
    const updated = reasons.filter(r => r !== reason);
    upsertSettings.mutate({ loss_reasons: updated } as Record<string, unknown>);
    toast({ title: "Motivo removido" });
  };

  const handleReset = () => {
    upsertSettings.mutate({ loss_reasons: DEFAULT_REASONS } as Record<string, unknown>);
    toast({ title: "Motivos restaurados para o padrão" });
  };

  return (
    <div className="space-y-4 p-4">
      <div>
        <h3 className="text-sm font-semibold">Motivos de Perda</h3>
        <p className="text-xs text-muted-foreground">
          Configure os motivos padrão exibidos quando um lead é marcado como perdido. Esses dados aparecem nos relatórios.
        </p>
      </div>

      <div className="flex gap-2">
        <Input
          value={newReason}
          onChange={e => setNewReason(e.target.value)}
          placeholder="Novo motivo de perda..."
          className="h-8 text-sm"
          onKeyDown={e => e.key === "Enter" && handleAdd()}
        />
        <Button size="sm" className="h-8 text-xs gap-1" onClick={handleAdd} disabled={!newReason.trim()}>
          <Plus className="w-3 h-3" /> Adicionar
        </Button>
      </div>

      <div className="space-y-1.5">
        {reasons.map((reason, idx) => (
          <Card key={idx} className="border">
            <CardContent className="p-2 flex items-center justify-between">
              <span className="text-sm">{reason}</span>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive" onClick={() => handleRemove(reason)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {reasons.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">Nenhum motivo configurado</p>
      )}

      <Button variant="outline" size="sm" className="text-xs" onClick={handleReset}>
        Restaurar padrão
      </Button>
    </div>
  );
}
