import { useState, useEffect } from "react";
import { Plus, Trash2, Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCrmFunnels, useCrmFunnelMutations } from "@/hooks/useCrmFunnels";
import { useClienteSubscription } from "@/hooks/useClienteSubscription";
import { useToast } from "@/hooks/use-toast";
import { DEFAULT_STAGES, STAGE_COLORS, STAGE_ICON_OPTIONS, STAGE_ICONS, type FunnelStage } from "./CrmStageSystem";

interface CrmFunnelManagerProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  embedded?: boolean;
}

export function CrmFunnelManager({ open, onOpenChange, embedded }: CrmFunnelManagerProps) {
  const { toast } = useToast();
  const { data: funnelsData } = useCrmFunnels();
  const { createFunnel, updateFunnel, deleteFunnel } = useCrmFunnelMutations();
  const [deletingFunnel, setDeletingFunnel] = useState<any>(null);
  const { data: subscription } = useClienteSubscription();

  const [editingFunnel, setEditingFunnel] = useState<any>(null);
  const [localStages, setLocalStages] = useState<FunnelStage[]>([]);
  const [funnelName, setFunnelName] = useState("");
  const [funnelDesc, setFunnelDesc] = useState("");
  const [stageDialogOpen, setStageDialogOpen] = useState(false);

  const plan = subscription?.plan || "basic";
  const maxFunnels = plan === "basic" ? 2 : 999;
  const canCreate = !funnelsData || funnelsData.length < maxFunnels;

  useEffect(() => {
    if (editingFunnel) {
      const dbStages = editingFunnel.stages as any[];
      if (Array.isArray(dbStages) && dbStages.length > 0) {
        setLocalStages(dbStages.map((s: any) => ({ key: s.key || s.label?.toLowerCase().replace(/\s+/g, "_"), label: s.label || "Etapa", color: s.color || "blue", icon: s.icon || "circle-dot" })));
      } else {
        setLocalStages([...DEFAULT_STAGES]);
      }
      setFunnelName(editingFunnel.name);
      setFunnelDesc(editingFunnel.description || "");
    }
  }, [editingFunnel]);

  const openNewFunnel = () => {
    if (!canCreate) { toast({ title: `Limite de ${maxFunnels} funis no plano ${plan}. Faça upgrade.`, variant: "destructive" }); return; }
    setEditingFunnel(null);
    setLocalStages([...DEFAULT_STAGES]);
    setFunnelName("");
    setFunnelDesc("");
    setStageDialogOpen(true);
  };

  const openEditFunnel = (funnel: any) => {
    setEditingFunnel(funnel);
    setStageDialogOpen(true);
  };

  const handleSave = () => {
    if (!funnelName.trim()) { toast({ title: "Informe o nome do funil", variant: "destructive" }); return; }
    if (editingFunnel) {
      updateFunnel.mutate({ id: editingFunnel.id, name: funnelName, description: funnelDesc, stages: localStages });
    } else {
      createFunnel.mutate({ name: funnelName, description: funnelDesc, stages: localStages, is_default: !funnelsData || funnelsData.length === 0 });
    }
    toast({ title: "Funil salvo" });
    setStageDialogOpen(false);
    onOpenChange?.(false);
  };

  const setAsDefault = (id: string) => {
    updateFunnel.mutate({ id, is_default: true });
    toast({ title: "Funil definido como padrão" });
  };

  const addStage = () => { setLocalStages([...localStages, { key: `stage_${Date.now()}`, label: "Nova Etapa", color: "blue", icon: "circle-dot" }]); };
  const removeStage = (idx: number) => { setLocalStages(localStages.filter((_, i) => i !== idx)); };
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

  const funnelList = (
    <div className="space-y-3 mt-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Funis</h3>
          <p className="text-[10px] text-muted-foreground">{funnelsData?.length || 0}/{maxFunnels === 999 ? "∞" : maxFunnels} funis · Plano {plan}</p>
        </div>
        <Button size="sm" className="gap-1" onClick={openNewFunnel} disabled={!canCreate}>
          <Plus className="w-3.5 h-3.5" /> Novo funil
        </Button>
      </div>

      {!canCreate && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-3 text-xs text-amber-700">Limite de funis atingido no plano {plan}. Faça upgrade para criar mais.</CardContent>
        </Card>
      )}

      {(!funnelsData || funnelsData.length === 0) ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <p className="text-xs text-muted-foreground">Nenhum funil criado.</p>
            <Button size="sm" variant="outline" className="mt-3 gap-1" onClick={openNewFunnel}><Plus className="w-3 h-3" /> Criar funil</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {funnelsData.map(funnel => (
            <Card key={funnel.id}>
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium flex items-center gap-1.5">
                    {funnel.name}
                    {funnel.is_default && <Badge variant="secondary" className="text-[8px]"><Star className="w-2.5 h-2.5 mr-0.5" />Padrão</Badge>}
                  </p>
                  {funnel.description && <p className="text-[10px] text-muted-foreground">{funnel.description}</p>}
                  <p className="text-[10px] text-muted-foreground mt-0.5">{(funnel.stages as any[])?.length || 0} etapas</p>
                </div>
                <div className="flex gap-1">
                  {!funnel.is_default && <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setAsDefault(funnel.id)}>Tornar padrão</Button>}
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openEditFunnel(funnel)}>Editar</Button>
                  {!funnel.is_default && deleteFunnel && (
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => { deleteFunnel.mutate(funnel.id); toast({ title: "Funil excluído" }); }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stage Editor Dialog */}
      <Dialog open={stageDialogOpen} onOpenChange={setStageDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingFunnel ? `Editar: ${editingFunnel.name}` : "Novo Funil"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs">Nome *</Label><Input value={funnelName} onChange={e => setFunnelName(e.target.value)} placeholder="Ex: Funil de Vendas" /></div>
              <div><Label className="text-xs">Descrição</Label><Input value={funnelDesc} onChange={e => setFunnelDesc(e.target.value)} placeholder="Opcional" /></div>
            </div>
            <Label className="text-xs font-semibold">Etapas</Label>
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
                    <SelectContent>{STAGE_COLORS.map(c => <SelectItem key={c.name} value={c.name} className="text-xs"><span className="flex items-center gap-1.5"><span className={`w-2.5 h-2.5 rounded-full ${c.dot}`} />{c.label}</span></SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={stage.icon} onValueChange={v => updateStage(idx, "icon", v)}>
                    <SelectTrigger className="h-8 w-16 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{STAGE_ICON_OPTIONS.map(i => <SelectItem key={i} value={i} className="text-xs">{STAGE_ICONS[i]}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => removeStage(idx)} disabled={localStages.length <= 2}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="w-full text-xs gap-1" onClick={addStage}><Plus className="w-3.5 h-3.5" /> Adicionar etapa</Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStageDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar funil</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  if (embedded) return funnelList;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Gerenciar Funis</DialogTitle></DialogHeader>
        {funnelList}
      </DialogContent>
    </Dialog>
  );
}
