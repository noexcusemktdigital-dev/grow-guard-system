import { useState, useEffect } from "react";
import { Plus, Trash2, Star, FormInput } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCrmFunnels, useCrmFunnelMutations, type CrmFunnel } from "@/hooks/useCrmFunnels";
import { useClienteSubscription } from "@/hooks/useClienteSubscription";
import { getEffectiveLimits } from "@/constants/plans";
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
  const [deletingFunnel, setDeletingFunnel] = useState<CrmFunnel | null>(null);
  const { data: subscription } = useClienteSubscription();

  const [editingFunnel, setEditingFunnel] = useState<CrmFunnel | null>(null);
  const [localStages, setLocalStages] = useState<FunnelStage[]>([]);
  const [funnelName, setFunnelName] = useState("");
  const [funnelDesc, setFunnelDesc] = useState("");
  const [goalType, setGoalType] = useState("revenue");
  const [winLabel, setWinLabel] = useState("Ganho");
  const [lossLabel, setLossLabel] = useState("Perdido");
  const [stageDialogOpen, setStageDialogOpen] = useState(false);
  type CustomField = { key: string; label: string; type: string; required?: boolean; placeholder?: string; options?: string[] };
  const [customFieldsSchema, setCustomFieldsSchema] = useState<CustomField[]>([]);
  const [backtrackMode, setBacktrackMode] = useState<"allow" | "warn" | "block">("allow");

  const isTrial = subscription?.status === "trial";
  const planId = subscription?.plan as string | null;
  const limits = getEffectiveLimits(planId, isTrial);
  const maxFunnels = limits.maxPipelines;
  const planLabel = isTrial ? "Trial" : (planId ? planId.charAt(0).toUpperCase() + planId.slice(1) : "Starter");
  const canCreate = !funnelsData || funnelsData.length < maxFunnels;

  useEffect(() => {
    if (editingFunnel) {
      const dbStages = editingFunnel.stages as Array<{ key?: string; label?: string; color?: string; icon?: string }>;
      if (Array.isArray(dbStages) && dbStages.length > 0) {
        setLocalStages(dbStages.map((s) => ({ key: s.key || s.label?.toLowerCase().replace(/\s+/g, "_"), label: s.label || "Etapa", color: s.color || "blue", icon: s.icon || "circle-dot" })));
      } else {
        setLocalStages([...DEFAULT_STAGES]);
      }
      setFunnelName(editingFunnel.name);
      setFunnelDesc(editingFunnel.description || "");
      setGoalType(editingFunnel.goal_type || "revenue");
      setWinLabel(editingFunnel.win_label || "Ganho");
      setLossLabel(editingFunnel.loss_label || "Perdido");
      // Hidrata schema garantindo que toda chave seja única (corrige dados legados onde
      // múltiplos campos com o mesmo label compartilhavam a mesma key e duplicavam valores).
      const rawSchema = ((editingFunnel as CrmFunnel & { custom_fields_schema?: CustomField[] }).custom_fields_schema || []);
      const seen = new Set<string>();
      const dedupedSchema = rawSchema.map((f, i) => {
        const baseKey = f?.key || `field_${i}`;
        let key = baseKey;
        let suffix = 2;
        while (seen.has(key)) {
          key = `${baseKey}_${suffix++}`;
        }
        seen.add(key);
        return { ...f, key };
      });
      setCustomFieldsSchema(dedupedSchema);
      const mode: "allow" | "warn" | "block" =
        editingFunnel.backtrack_mode || (editingFunnel.allow_backtrack === false ? "block" : "allow");
      setBacktrackMode(mode);
    }
  }, [editingFunnel]);

  const openNewFunnel = () => {
    if (!canCreate) { toast({ title: `Limite de ${maxFunnels} funis no plano ${planLabel}. Faça upgrade.`, variant: "destructive" }); return; }
    setEditingFunnel(null);
    setLocalStages([...DEFAULT_STAGES]);
    setFunnelName("");
    setFunnelDesc("");
    setBacktrackMode("allow");
    setStageDialogOpen(true);
  };

  const openEditFunnel = (funnel: CrmFunnel) => {
    setEditingFunnel(funnel);
    setStageDialogOpen(true);
  };

  const handleSave = () => {
    if (!funnelName.trim()) { toast({ title: "Informe o nome do funil", variant: "destructive" }); return; }
    const backtrackPayload = {
      allow_backtrack: backtrackMode !== "block",
      backtrack_mode: backtrackMode,
    };
    if (editingFunnel) {
      updateFunnel.mutate({ id: editingFunnel.id, name: funnelName, description: funnelDesc, stages: localStages, goal_type: goalType, win_label: winLabel, loss_label: lossLabel, custom_fields_schema: customFieldsSchema, ...backtrackPayload });
    } else {
      createFunnel.mutate({ name: funnelName, description: funnelDesc, stages: localStages, is_default: !funnelsData || funnelsData.length === 0, goal_type: goalType, win_label: winLabel, loss_label: lossLabel, custom_fields_schema: customFieldsSchema, ...backtrackPayload });
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
          <p className="text-[10px] text-muted-foreground">{funnelsData?.length || 0}/{maxFunnels} funis · Plano {planLabel}</p>
        </div>
        <Button size="sm" className="gap-1" onClick={openNewFunnel} disabled={!canCreate}>
          <Plus className="w-3.5 h-3.5" /> Novo funil
        </Button>
      </div>

      {!canCreate && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-3 text-xs text-amber-700">Limite de funis atingido no plano {planLabel}. Faça upgrade para criar mais.</CardContent>
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
                  <p className="text-[10px] text-muted-foreground mt-0.5">{(funnel.stages as unknown[])?.length || 0} etapas</p>
                </div>
                <div className="flex gap-1">
                  {!funnel.is_default && <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setAsDefault(funnel.id)}>Tornar padrão</Button>}
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openEditFunnel(funnel)}>Editar</Button>
                  {!funnel.is_default && deleteFunnel && (
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => setDeletingFunnel(funnel)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Funnel Confirmation */}
      <AlertDialog open={!!deletingFunnel} onOpenChange={(o) => !o && setDeletingFunnel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir funil "{deletingFunnel?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Os leads vinculados a este funil ficarão sem funil associado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => { deleteFunnel.mutate(deletingFunnel.id); setDeletingFunnel(null); toast({ title: "Funil excluído" }); }}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Stage Editor Dialog */}
      <Dialog open={stageDialogOpen} onOpenChange={setStageDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingFunnel ? `Editar: ${editingFunnel.name}` : "Novo Funil"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs">Nome *</Label><Input value={funnelName} onChange={e => setFunnelName(e.target.value)} placeholder="Ex: Funil de Vendas" /></div>
              <div><Label className="text-xs">Descrição</Label><Input value={funnelDesc} onChange={e => setFunnelDesc(e.target.value)} placeholder="Opcional" /></div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Objetivo do funil</Label>
              <Select value={goalType} onValueChange={setGoalType}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue" className="text-xs">💰 Faturamento (vendas)</SelectItem>
                  <SelectItem value="leads" className="text-xs">🎯 Captação de leads</SelectItem>
                  <SelectItem value="appointments" className="text-xs">📅 Agendamentos</SelectItem>
                  <SelectItem value="contracts" className="text-xs">📄 Contratos assinados</SelectItem>
                  <SelectItem value="other" className="text-xs">⚙️ Outro objetivo</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">
                Define o que representa uma conversão neste funil
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Label "Ganho"</Label>
                <Input value={winLabel} onChange={e => setWinLabel(e.target.value)}
                  placeholder="Ex: Venda fechada, Matriculado..." className="h-8 text-xs" />
              </div>
              <div>
                <Label className="text-xs">Label "Perdido"</Label>
                <Input value={lossLabel} onChange={e => setLossLabel(e.target.value)}
                  placeholder="Ex: Desistiu, Sem perfil..." className="h-8 text-xs" />
              </div>
            </div>
            {/* Formulário do Lead — Campos personalizados (destacado, antes das etapas) */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FormInput className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-sm font-semibold">Formulário do Lead</p>
                    <p className="text-xs text-muted-foreground">
                      Campos extras que aparecerão ao criar e editar leads neste funil
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => {
                  const newField = { key: `field_${Date.now()}_${customFieldsSchema.length}`, label: "Novo campo", type: "text", required: false, placeholder: "" };
                  setCustomFieldsSchema([...customFieldsSchema, newField]);
                }}>
                  <Plus className="w-3 h-3" /> Adicionar campo
                </Button>
              </div>
              {customFieldsSchema.length === 0 && (
                <p className="text-[10px] text-muted-foreground">Nenhum campo adicional. Clique em "+ Adicionar campo" para criar.</p>
              )}
              <div className="space-y-2">
                {customFieldsSchema.map((field, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 rounded-lg border bg-background/60">
                    <Input
                      value={field.label}
                      onChange={e => {
                        const updated = [...customFieldsSchema];
                        // IMPORTANTE: não regerar a `key` a partir do label — isso fazia campos
                        // com o mesmo nome compartilharem a mesma chave e duplicarem valores.
                        updated[idx] = { ...field, label: e.target.value };
                        setCustomFieldsSchema(updated);
                      }}
                      className="h-7 text-xs flex-1"
                      placeholder="Nome do campo"
                    />
                    <Select value={field.type} onValueChange={v => {
                      const updated = [...customFieldsSchema];
                      updated[idx] = { ...field, type: v };
                      setCustomFieldsSchema(updated);
                    }}>
                      <SelectTrigger className="h-7 text-xs w-24"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text" className="text-xs">Texto</SelectItem>
                        <SelectItem value="number" className="text-xs">Número</SelectItem>
                        <SelectItem value="select" className="text-xs">Seleção</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => setCustomFieldsSchema(customFieldsSchema.filter((_, i) => i !== idx))}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
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

            {/* Backtrack control */}
            <div className="space-y-2 mt-4 p-3 rounded-lg border border-border/50 bg-muted/20">
              <Label className="text-xs font-semibold">Controle de retrocesso de cards</Label>
              <p className="text-[10px] text-muted-foreground">
                Define o que acontece quando alguém arrasta um lead para uma etapa anterior do funil.
              </p>
              <RadioGroup value={backtrackMode} onValueChange={(v) => setBacktrackMode(v as "allow" | "warn" | "block")} className="gap-2">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="allow" id="bt-allow" />
                  <Label htmlFor="bt-allow" className="text-xs font-normal cursor-pointer">✅ Permitir livremente</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="warn" id="bt-warn" />
                  <Label htmlFor="bt-warn" className="text-xs font-normal cursor-pointer">⚠️ Permitir, mas avisar administrador</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="block" id="bt-block" />
                  <Label htmlFor="bt-block" className="text-xs font-normal cursor-pointer">🚫 Não permitir retrocesso</Label>
                </div>
              </RadioGroup>
            </div>

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
