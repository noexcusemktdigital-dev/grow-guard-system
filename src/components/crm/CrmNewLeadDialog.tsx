import { useState } from "react";
import { Shuffle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCrmLeadMutations } from "@/hooks/useCrmLeads";
import { useCrmFunnels } from "@/hooks/useCrmFunnels";
import { useCrmSettings } from "@/hooks/useCrmSettings";
import { useCrmOrgMembers } from "@/hooks/useCrmOrgMembers";
import { useAuth } from "@/contexts/AuthContext";
import { useLeadQuota } from "@/hooks/useLeadQuota";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/typed";

const SOURCES = ["WhatsApp", "Formulário", "Indicação", "Ads", "LinkedIn", "Evento", "Orgânico"];

interface CrmNewLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultStage: string;
  funnelId?: string;
  prefillContact?: { id?: string; name: string; phone?: string; email?: string; company?: string } | null;
}

export function CrmNewLeadDialog({ open, onOpenChange, defaultStage, funnelId, prefillContact }: CrmNewLeadDialogProps) {
  const { toast } = useToast();
  const { createLead } = useCrmLeadMutations();
  const { data: funnelsData } = useCrmFunnels();
  const { data: crmSettings } = useCrmSettings();
  const { data: members } = useCrmOrgMembers();
  const { user } = useAuth();
  const { maxLeads, atLimit } = useLeadQuota();

  const rouletteEnabled = !!(crmSettings as Tables<'crm_settings'> | null)?.lead_roulette_enabled;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [value, setValue] = useState("");
  const [source, setSource] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [assignedTo, setAssignedTo] = useState<string>(rouletteEnabled ? "" : (user?.id ?? ""));
  const [customFields, setCustomFields] = useState<Record<string, string | number | boolean>>({});

  const selectedFunnelData = funnelsData?.find(f => f.id === funnelId);
  type CustomField = { key: string; label: string; type: string; required?: boolean; placeholder?: string; options?: string[] };
  const rawSchema: CustomField[] = (selectedFunnelData as (typeof selectedFunnelData & { custom_fields_schema?: CustomField[] }))?.custom_fields_schema || [];
  // Deduplica chaves para suportar dados legados onde múltiplos campos compartilhavam a mesma key
  const customFieldsSchema = (() => {
    const seen = new Set<string>();
    return rawSchema.map((f, i) => {
      const baseKey = f?.key || `field_${i}`;
      let key = baseKey;
      let suffix = 2;
      while (seen.has(key)) key = `${baseKey}_${suffix++}`;
      seen.add(key);
      return { ...f, key };
    });
  })();

  // Auto-fill from prefillContact
  const [prefilled, setPrefilled] = useState(false);
  if (open && prefillContact && !prefilled) {
    setName(prefillContact.name || "");
    setPhone(prefillContact.phone || "");
    setEmail(prefillContact.email || "");
    setCompany(prefillContact.company || "");
    setPrefilled(true);
  }
  if (!open && prefilled) {
    setPrefilled(false);
  }

  const reset = () => {
    setName(""); setPhone(""); setEmail(""); setCompany(""); setValue(""); setSource(""); setTagInput(""); setCustomFields({});
    setAssignedTo(rouletteEnabled ? "" : (user?.id ?? ""));
  };

  const handleCreate = () => {
    if (!funnelsData || funnelsData.length === 0) {
      toast({ title: "Nenhum funil configurado", description: "Crie pelo menos um funil nas configurações do CRM antes de adicionar leads.", variant: "destructive" });
      return;
    }
    if (atLimit) {
      toast({ title: "Limite de leads atingido", description: "Faça upgrade do plano para adicionar mais leads.", variant: "destructive" });
      return;
    }
    if (!name.trim()) {
      toast({ title: "Informe o nome do lead", variant: "destructive" });
      return;
    }
    const tags = tagInput.split(",").map(t => t.trim()).filter(Boolean);
    createLead.mutate({
      name: name.trim(),
      phone: phone || undefined,
      email: email || undefined,
      company: company || undefined,
      value: value ? parseFloat(value) : undefined,
      source: source || undefined,
      stage: defaultStage,
      funnel_id: funnelId || undefined,
      tags: tags.length > 0 ? tags : undefined,
      assigned_to: rouletteEnabled ? undefined : (assignedTo || undefined),
      custom_fields: Object.keys(customFields).length > 0 ? customFields : undefined,
      _maxLeads: maxLeads,
    } as Parameters<typeof createLead.mutate>[0]);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Novo Lead</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Nome *</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Nome do lead" /></div>
            <div><Label className="text-xs">Telefone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(00) 00000-0000" /></div>
            <div><Label className="text-xs">E-mail</Label><Input value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" /></div>
            <div><Label className="text-xs">Empresa</Label><Input value={company} onChange={e => setCompany(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Valor potencial (R$)</Label><Input type="number" value={value} onChange={e => setValue(e.target.value)} placeholder="0" /></div>
            <div>
              <Label className="text-xs">Origem</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  {SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label className="text-xs">Tags (separadas por vírgula)</Label><Input value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="tag1, tag2" /></div>

          <div className="space-y-1.5">
            <Label className="text-xs">Responsável</Label>
            {rouletteEnabled ? (
              <div className="flex items-center gap-2 p-2.5 rounded-md border bg-muted/30 text-sm text-muted-foreground">
                <Shuffle className="w-3.5 h-3.5" />
                Será atribuído pela roleta automaticamente
              </div>
            ) : (
              <Select
                value={assignedTo || "__none__"}
                onValueChange={(v) => setAssignedTo(v === "__none__" ? "" : v)}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Selecionar responsável..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sem responsável</SelectItem>
                  {members?.map((m) => (
                    <SelectItem key={m.user_id} value={m.user_id}>
                      {m.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {customFieldsSchema.length > 0 && (
            <div className="space-y-2 p-3 rounded-lg border bg-muted/30">
              <Label className="text-xs font-semibold">Campos adicionais</Label>
              {customFieldsSchema.map((field, idx) => (
                <div key={`${field.key}__${idx}`}>
                  <Label className="text-xs">{field.label}{field.required ? " *" : ""}</Label>
                  {field.type === "select" ? (
                    <select
                      value={customFields[field.key] || ""}
                      onChange={e => setCustomFields(prev => ({ ...prev, [field.key]: e.target.value }))}
                      className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
                    >
                      <option value="">Selecionar</option>
                      {(field.options || []).map((opt: string) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      value={customFields[field.key] || ""}
                      onChange={e => setCustomFields(prev => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={field.placeholder || ""}
                      className="h-8 text-xs"
                      type={field.type === "number" ? "number" : "text"}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleCreate}>Criar Lead</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
