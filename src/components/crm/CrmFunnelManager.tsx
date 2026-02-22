import { useState, useEffect } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCrmFunnels, useCrmFunnelMutations } from "@/hooks/useCrmFunnels";
import { useToast } from "@/hooks/use-toast";
import { DEFAULT_STAGES, STAGE_COLORS, STAGE_ICON_OPTIONS, STAGE_ICONS, type FunnelStage } from "./CrmStageSystem";

interface CrmFunnelManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CrmFunnelManager({ open, onOpenChange }: CrmFunnelManagerProps) {
  const { toast } = useToast();
  const { data: funnelsData } = useCrmFunnels();
  const { createFunnel, updateFunnel } = useCrmFunnelMutations();
  const [localStages, setLocalStages] = useState<FunnelStage[]>([]);

  const activeFunnel = funnelsData?.find(f => f.is_default) || funnelsData?.[0];

  useEffect(() => {
    if (activeFunnel) {
      const dbStages = activeFunnel.stages as any[];
      if (Array.isArray(dbStages) && dbStages.length > 0) {
        setLocalStages(dbStages.map((s: any) => ({
          key: s.key || s.label?.toLowerCase().replace(/\s+/g, "_"),
          label: s.label || "Etapa",
          color: s.color || "blue",
          icon: s.icon || "circle-dot",
        })));
        return;
      }
    }
    setLocalStages([...DEFAULT_STAGES]);
  }, [activeFunnel]);

  const handleSave = () => {
    if (activeFunnel) {
      updateFunnel.mutate({ id: activeFunnel.id, stages: localStages });
    } else {
      createFunnel.mutate({ name: "Funil Principal", stages: localStages, is_default: true });
    }
    toast({ title: "Funil salvo com sucesso" });
    onOpenChange(false);
  };

  const addStage = () => {
    setLocalStages([...localStages, { key: `stage_${Date.now()}`, label: "Nova Etapa", color: "blue", icon: "circle-dot" }]);
  };

  const removeStage = (idx: number) => {
    setLocalStages(localStages.filter((_, i) => i !== idx));
  };

  const updateStage = (idx: number, field: keyof FunnelStage, value: string) => {
    const updated = [...localStages];
    updated[idx] = { ...updated[idx], [field]: value };
    if (field === "label") updated[idx].key = value.toLowerCase().replace(/\s+/g, "_");
    setLocalStages(updated);
  };

  const moveStage = (from: number, to: number) => {
    if (to < 0 || to >= localStages.length) return;
    const updated = [...localStages];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    setLocalStages(updated);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Configurar Funil</DialogTitle></DialogHeader>
        <div className="space-y-2">
          {localStages.map((stage, idx) => (
            <div key={idx} className="flex items-center gap-2 p-2 rounded-lg border bg-muted/20">
              <div className="flex flex-col gap-0.5">
                <button onClick={() => moveStage(idx, idx - 1)} className="text-muted-foreground hover:text-foreground text-[10px]">▲</button>
                <button onClick={() => moveStage(idx, idx + 1)} className="text-muted-foreground hover:text-foreground text-[10px]">▼</button>
              </div>
              <Input value={stage.label} onChange={e => updateStage(idx, "label", e.target.value)} className="h-8 text-xs flex-1" />
              <Select value={stage.color} onValueChange={v => updateStage(idx, "color", v)}>
                <SelectTrigger className="h-8 text-xs w-24"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STAGE_COLORS.map(c => (
                    <SelectItem key={c.name} value={c.name} className="text-xs">
                      <span className="flex items-center gap-1.5"><span className={`w-2.5 h-2.5 rounded-full ${c.dot}`} />{c.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={stage.icon} onValueChange={v => updateStage(idx, "icon", v)}>
                <SelectTrigger className="h-8 w-16 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STAGE_ICON_OPTIONS.map(i => (
                    <SelectItem key={i} value={i} className="text-xs">{STAGE_ICONS[i]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => removeStage(idx)} disabled={localStages.length <= 2}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" className="w-full text-xs gap-1" onClick={addStage}>
          <Plus className="w-3.5 h-3.5" /> Adicionar etapa
        </Button>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar funil</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
