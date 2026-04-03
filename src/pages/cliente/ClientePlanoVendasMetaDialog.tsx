
import { Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { METRIC_OPTIONS, MESES_COMPLETOS } from "./ClientePlanoVendasData";

export interface MetaFormState {
  title: string;
  metric: string;
  target_value: number;
  scope: string;
  team_id: string;
  assigned_to: string;
  priority: string;
  mesRef: string;
}

export interface ClientePlanoVendasMetaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingGoal: Record<string, unknown>;
  novaMeta: MetaFormState;
  setNovaMeta: React.Dispatch<React.SetStateAction<MetaFormState>>;
  targetDisplay: string;
  setTargetDisplay: (v: string) => void;
  onAdd: () => void;
  onEdit: () => void;
  isCreating: boolean;
  isUpdating: boolean;
  isMonetaryMetric: (m: string) => boolean;
  teams: Record<string, unknown>[] | undefined;
  members: Record<string, unknown>[] | undefined;
}

export function ClientePlanoVendasMetaDialog({
  open, onOpenChange, editingGoal, novaMeta, setNovaMeta, targetDisplay, setTargetDisplay,
  onAdd, onEdit, isCreating, isUpdating, isMonetaryMetric, teams, members,
}: ClientePlanoVendasMetaDialogProps) {
  const anoAtual = new Date().getFullYear();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="text-base">{editingGoal ? "Editar Meta" : "Nova Meta"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs">Nome da meta</Label>
            <Input value={novaMeta.title} onChange={e => setNovaMeta(p => ({ ...p, title: e.target.value }))} placeholder="Ex: Faturar R$ 50 mil em março" className="text-sm" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Métrica</Label>
              <Select value={novaMeta.metric} onValueChange={v => setNovaMeta(p => ({ ...p, metric: v }))}>
                <SelectTrigger className="text-xs h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {METRIC_OPTIONS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Mês de referência</Label>
              <Select value={novaMeta.mesRef} onValueChange={v => setNovaMeta(p => ({ ...p, mesRef: v }))}>
                <SelectTrigger className="text-xs h-9"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {[anoAtual, anoAtual + 1].flatMap(yr =>
                    MESES_COMPLETOS.map((m, i) => (
                      <SelectItem key={`${yr}-${i}`} value={`${yr}-${String(i + 1).padStart(2, "0")}`}>{m} {yr}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Valor alvo {isMonetaryMetric(novaMeta.metric) && <span className="text-muted-foreground">(R$)</span>}</Label>
              {isMonetaryMetric(novaMeta.metric) ? (
                <Input
                  type="text"
                  inputMode="numeric"
                  value={targetDisplay}
                  onChange={e => {
                    const raw = e.target.value.replace(/\D/g, "");
                    if (!raw) { setTargetDisplay(""); setNovaMeta(p => ({ ...p, target_value: 0 })); return; }
                    const num = parseInt(raw, 10);
                    setTargetDisplay(num.toLocaleString("pt-BR"));
                    setNovaMeta(p => ({ ...p, target_value: num }));
                  }}
                  placeholder="Ex: 50.000"
                  className="text-sm"
                />
              ) : (
                <Input
                  type="number"
                  value={novaMeta.target_value || ""}
                  onChange={e => setNovaMeta(p => ({ ...p, target_value: Number(e.target.value) }))}
                  placeholder="Ex: 20"
                  className="text-sm"
                />
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Prioridade</Label>
              <Select value={novaMeta.priority} onValueChange={v => setNovaMeta(p => ({ ...p, priority: v }))}>
                <SelectTrigger className="text-xs h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="baixa">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Escopo</Label>
            <Select value={novaMeta.scope} onValueChange={v => setNovaMeta(p => ({ ...p, scope: v, team_id: "", assigned_to: "" }))}>
              <SelectTrigger className="text-xs h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="company">Empresa (toda a organização)</SelectItem>
                <SelectItem value="team">Equipe (time específico)</SelectItem>
                <SelectItem value="individual">Individual (pessoa específica)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {novaMeta.scope === "team" && (
            <div className="space-y-1">
              <Label className="text-xs">Time</Label>
              {teams && teams.length > 0 ? (
                <Select value={novaMeta.team_id} onValueChange={v => setNovaMeta(p => ({ ...p, team_id: v }))}>
                  <SelectTrigger className="text-xs h-9"><SelectValue placeholder="Selecione o time" /></SelectTrigger>
                  <SelectContent>
                    {teams.map(t => <SelectItem key={t.id as React.Key} value={t.id as string}>{t.name as React.ReactNode}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-xs text-muted-foreground py-2">Nenhum time cadastrado. Crie times em Configurações &gt; CRM.</p>
              )}
            </div>
          )}
          {novaMeta.scope === "individual" && (
            <div className="space-y-1">
              <Label className="text-xs">Responsável</Label>
              {members && members.length > 0 ? (
                <Select value={novaMeta.assigned_to} onValueChange={v => setNovaMeta(p => ({ ...p, assigned_to: v }))}>
                  <SelectTrigger className="text-xs h-9"><SelectValue placeholder="Selecione a pessoa" /></SelectTrigger>
                  <SelectContent>
                    {members.map(m => (
                      <SelectItem key={m.user_id as React.Key} value={m.user_id as string}>
                        {m.full_name as React.ReactNode} <span className="text-muted-foreground ml-1">({m.role as React.ReactNode})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-xs text-muted-foreground py-2">Nenhum membro encontrado na organização.</p>
              )}
            </div>
          )}
          <Button className="w-full gap-1" onClick={editingGoal ? onEdit : onAdd} disabled={isCreating || isUpdating}>
            {editingGoal ? (
              <>{isUpdating ? "Salvando..." : <><Save className="w-3 h-3" /> Salvar Alterações</>}</>
            ) : (
              <><Plus className="w-3 h-3" /> {isCreating ? "Criando..." : "Criar Meta"}</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
