import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCrmLeadMutations } from "@/hooks/useCrmLeads";
import { useCrmFunnels } from "@/hooks/useCrmFunnels";
import { useLeadQuota } from "@/hooks/useLeadQuota";
import { useToast } from "@/hooks/use-toast";

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
  const { maxLeads, atLimit } = useLeadQuota();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [value, setValue] = useState("");
  const [source, setSource] = useState("");
  const [tagInput, setTagInput] = useState("");

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
    setName(""); setPhone(""); setEmail(""); setCompany(""); setValue(""); setSource(""); setTagInput("");
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
      _maxLeads: maxLeads,
    } as any);
    reset();
    onOpenChange(false);
    toast({ title: "Lead criado com sucesso" });
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleCreate}>Criar Lead</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
