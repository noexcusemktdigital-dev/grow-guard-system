import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCrmLeadMutations } from "@/hooks/useCrmLeads";
import { useCrmContacts } from "@/hooks/useCrmContacts";
import { useCrmFunnels } from "@/hooks/useCrmFunnels";
import { useLeadQuota } from "@/hooks/useLeadQuota";
import { useToast } from "@/hooks/use-toast";
import { Search, UserCircle } from "lucide-react";

const SOURCES = ["WhatsApp", "Formulário", "Indicação", "Ads", "LinkedIn", "Evento", "Orgânico"];

interface CrmNewLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultStage: string;
  prefillContact?: { id?: string; name: string; phone?: string; email?: string; company?: string } | null;
}

export function CrmNewLeadDialog({ open, onOpenChange, defaultStage, prefillContact }: CrmNewLeadDialogProps) {
  const { toast } = useToast();
  const { createLead } = useCrmLeadMutations();
  const { data: contacts } = useCrmContacts();
  const { data: funnelsData } = useCrmFunnels();
  const { maxLeads, atLimit } = useLeadQuota();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [value, setValue] = useState("");
  const [source, setSource] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [contactSearch, setContactSearch] = useState("");
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [showContactList, setShowContactList] = useState(false);

  // Auto-fill from prefillContact
  const [prefilled, setPrefilled] = useState(false);
  if (open && prefillContact && !prefilled) {
    setName(prefillContact.name || "");
    setPhone(prefillContact.phone || "");
    setEmail(prefillContact.email || "");
    setCompany(prefillContact.company || "");
    setSelectedContactId(prefillContact.id || null);
    setContactSearch(prefillContact.name || "");
    setPrefilled(true);
  }
  if (!open && prefilled) {
    setPrefilled(false);
  }

  const filteredContacts = useMemo(() => {
    if (!contactSearch || !contacts) return [];
    const q = contactSearch.toLowerCase();
    return contacts.filter(c =>
      c.name.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.phone?.includes(q)
    ).slice(0, 8);
  }, [contactSearch, contacts]);

  const reset = () => {
    setName(""); setPhone(""); setEmail(""); setCompany(""); setValue(""); setSource(""); setTagInput("");
    setContactSearch(""); setSelectedContactId(null); setShowContactList(false);
  };

  const selectContact = (contact: any) => {
    setSelectedContactId(contact.id);
    setName(contact.name);
    setPhone(contact.phone || "");
    setEmail(contact.email || "");
    setCompany(contact.company || "");
    setContactSearch(contact.name);
    setShowContactList(false);
  };

  const handleCreate = () => {
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
          {/* Contact lookup */}
          <div className="relative">
            <Label className="text-xs flex items-center gap-1"><UserCircle className="w-3 h-3" /> Vincular a contato (opcional)</Label>
            <div className="relative mt-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={contactSearch}
                onChange={e => { setContactSearch(e.target.value); setShowContactList(true); setSelectedContactId(null); }}
                onFocus={() => contactSearch && setShowContactList(true)}
                placeholder="Buscar contato pelo nome..."
                className="pl-8 h-8 text-xs"
              />
            </div>
            {showContactList && filteredContacts.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-lg max-h-40 overflow-auto">
                {filteredContacts.map(c => (
                  <button key={c.id} className="w-full text-left px-3 py-2 text-xs hover:bg-muted/50 flex items-center gap-2" onClick={() => selectContact(c)}>
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold shrink-0">{c.name.charAt(0)}</div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{c.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{c.email || c.phone || ""}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

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
