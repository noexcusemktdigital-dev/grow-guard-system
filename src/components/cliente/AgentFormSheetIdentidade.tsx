import { Camera, Trash2, Upload, Loader2, Lock, ChevronRight } from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import type { AiAgent, AgentRole } from "@/types/cliente";
import { agentRoleConfig } from "@/types/cliente";

interface WhatsAppInstance {
  id: string;
  status: string;
  phone_number?: string | null;
  label?: string | null;
  instance_id: string;
}

interface AgentFormSheetIdentidadeProps {
  form: Partial<AiAgent>;
  setForm: React.Dispatch<React.SetStateAction<Partial<AiAgent>>>;
  uploading: boolean;
  syncingPhone: boolean;
  whatsappInstances: WhatsAppInstance[] | undefined;
  avatarInputRef: React.RefObject<HTMLInputElement>;
  handleAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isEditing: boolean;
  isStep1Complete: boolean;
  goNext: () => void;
  canGoNext: boolean;
}

function NextButton({ disabled, goNext }: { disabled: boolean; goNext: () => void }) {
  return (
    <div className="pt-4 flex justify-end">
      <Button type="button" onClick={goNext} disabled={disabled} className="gap-1.5">
        Próximo <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

export function AgentFormSheetIdentidade({
  form,
  setForm,
  uploading,
  syncingPhone,
  whatsappInstances,
  avatarInputRef,
  handleAvatarUpload,
  isEditing,
  isStep1Complete,
  goNext,
  canGoNext,
}: AgentFormSheetIdentidadeProps) {
  const roleInfo = agentRoleConfig[(form.role as AgentRole) ?? "sdr"];

  return (
    <TabsContent value="identidade" className="space-y-4 mt-4">
      {/* Avatar Upload */}
      <div className="flex items-center gap-4">
        <div
          className="w-16 h-16 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0 border-2 border-dashed border-muted-foreground/30 relative group cursor-pointer"
          onClick={() => avatarInputRef.current?.click()}
        >
          {form.avatar_url ? (
            <img src={form.avatar_url} alt="Avatar" className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <Camera className="w-6 h-6 text-muted-foreground/40" />
          )}
          <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="w-5 h-5 text-white" />
          </div>
        </div>
        <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Foto do agente</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
              {form.avatar_url ? "Alterar foto" : "Enviar foto"}
            </Button>
            {form.avatar_url && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1 text-destructive"
                onClick={() => setForm((f) => ({ ...f, avatar_url: null }))}
              >
                <Trash2 className="w-3 h-3" /> Remover
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Nome do Agente *</Label>
        <Input
          value={form.name ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Ex: Ana — SDR de Vendas"
        />
      </div>

      <div className="space-y-2">
        <Label>Descrição</Label>
        <Textarea
          value={form.description ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Descreva brevemente o propósito deste agente..."
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Função *</Label>
          <Select value={form.role ?? "sdr"} onValueChange={(v) => setForm((f) => ({ ...f, role: v as AgentRole }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(agentRoleConfig).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>{cfg.label} — {cfg.description}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Sexo *</Label>
          <RadioGroup value={form.gender ?? ""} onValueChange={(v) => setForm((f) => ({ ...f, gender: v }))} className="flex gap-4 pt-2">
            <div className="flex items-center gap-1.5"><RadioGroupItem value="masculino" id="m" /><Label htmlFor="m" className="text-xs font-normal">Masculino</Label></div>
            <div className="flex items-center gap-1.5"><RadioGroupItem value="feminino" id="f" /><Label htmlFor="f" className="text-xs font-normal">Feminino</Label></div>
          </RadioGroup>
        </div>
      </div>

      {/* Role Explainer Card */}
      {form.role && (
        <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Badge className={`text-xs ${roleInfo.color}`}>{roleInfo.label}</Badge>
            <span className="text-xs font-medium">{roleInfo.description}</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{roleInfo.longDescription}</p>
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Fluxo de trabalho</p>
            <div className="space-y-1.5">
              {roleInfo.workflow.map((step, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0 mt-0.5">{i + 1}</div>
                  <p className="text-xs">{step}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Objetivos padrão</p>
            <div className="flex flex-wrap gap-1">
              {roleInfo.objectives.map((obj) => (
                <Badge key={obj} variant="outline" className="text-[9px]">{obj}</Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label>Número de WhatsApp</Label>
        {whatsappInstances && whatsappInstances.length > 0 ? (
          <div className="space-y-2 pt-1">
            {whatsappInstances.filter((inst) => inst.status === "connected").map((inst) => (
              <div key={inst.id} className="flex items-center gap-2">
                <Checkbox
                  checked={(form.whatsapp_instance_ids ?? []).includes(inst.id)}
                  onCheckedChange={(checked) => {
                    const ids = form.whatsapp_instance_ids ?? [];
                    setForm((f) => ({
                      ...f,
                      whatsapp_instance_ids: checked
                        ? [...ids, inst.id]
                        : ids.filter((i: string) => i !== inst.id),
                    }));
                  }}
                />
                <span className="text-xs">
                  {inst.phone_number
                    ? `${inst.label ? inst.label + " — " : ""}${inst.phone_number}`
                    : inst.label || `Instância ${inst.instance_id.slice(0, 8)}...`}
                </span>
              </div>
            ))}
            {syncingPhone && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" /> Sincronizando números...
              </div>
            )}
            {whatsappInstances.filter((inst) => inst.status === "connected").length === 0 && (
              <p className="text-xs text-muted-foreground">Nenhum número conectado</p>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground pt-2">Nenhum WhatsApp configurado</p>
        )}
      </div>

      {!isEditing && (
        <div className="text-xs text-muted-foreground bg-muted/30 rounded-md p-3">
          Preencha <strong>Nome</strong>, <strong>Função</strong> e <strong>Sexo</strong> para desbloquear a próxima etapa.
        </div>
      )}

      <NextButton disabled={!isStep1Complete || !canGoNext} goNext={goNext} />
    </TabsContent>
  );
}
