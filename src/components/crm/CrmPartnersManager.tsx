import { useState } from "react";
import { Plus, Search, Building2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { useCrmPartners, useCrmPartnerMutations, type CrmPartner } from "@/hooks/useCrmPartners";
import { useToast } from "@/hooks/use-toast";

export function CrmPartnersManager() {
  const { toast } = useToast();
  const { data: partners, isLoading } = useCrmPartners();
  const { createPartner, updatePartner, deletePartner } = useCrmPartnerMutations();

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CrmPartner | null>(null);

  const [name, setName] = useState("");
  const [document, setDocument] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [notes, setNotes] = useState("");

  const filtered = (partners || []).filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.document || "").includes(search)
  );

  const resetForm = () => { setName(""); setDocument(""); setContactName(""); setContactEmail(""); setContactPhone(""); setNotes(""); setEditing(null); };

  const openNew = () => { resetForm(); setShowForm(true); };
  const openEdit = (p: CrmPartner) => {
    setEditing(p); setName(p.name); setDocument(p.document || "");
    setContactName(p.contact_name || ""); setContactEmail(p.contact_email || "");
    setContactPhone(p.contact_phone || ""); setNotes(p.notes || ""); setShowForm(true);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const payload = {
      name, document: document || null, contact_name: contactName || null,
      contact_email: contactEmail || null, contact_phone: contactPhone || null, notes: notes || null,
    };
    if (editing) {
      updatePartner.mutate({ id: editing.id, ...payload });
      toast({ title: "Parceiro atualizado" });
    } else {
      createPartner.mutate(payload as Omit<CrmPartner, 'id' | 'organization_id' | 'created_at'>);
      toast({ title: "Parceiro criado" });
    }
    setShowForm(false); resetForm();
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar parceiro..." className="pl-8 h-8 text-sm" aria-label="Buscar parceiro" />
        </div>
        <Button size="sm" className="h-8 text-xs gap-1" onClick={openNew}><Plus className="w-3 h-3" /> Parceiro</Button>
      </div>

      {isLoading && <p className="text-xs text-muted-foreground text-center py-4">Carregando...</p>}

      {filtered.length === 0 && !isLoading && (
        <div className="text-center py-8">
          <Building2 className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum parceiro cadastrado</p>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(p => (
          <Card key={p.id}>
            <CardContent className="p-3 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{p.name}</p>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                  {p.document && <span>{p.document}</span>}
                  {p.contact_name && <span>{p.contact_name}</span>}
                  {p.contact_phone && <span>{p.contact_phone}</span>}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-7 w-7 p-0" aria-label="Mais opções"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="text-xs">
                  <DropdownMenuItem onClick={() => openEdit(p)}><Pencil className="w-3 h-3 mr-2" />Editar</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={() => { deletePartner.mutate(p.id); toast({ title: "Parceiro excluído" }); }}><Trash2 className="w-3 h-3 mr-2" />Excluir</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showForm} onOpenChange={o => { if (!o) { setShowForm(false); resetForm(); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Editar Parceiro" : "Novo Parceiro"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Nome da empresa</Label><Input value={name} onChange={e => setName(e.target.value)} className="h-8 text-sm" /></div>
            <div><Label className="text-xs">CNPJ</Label><Input value={document} onChange={e => setDocument(e.target.value)} placeholder="00.000.000/0000-00" className="h-8 text-sm" /></div>
            <div><Label className="text-xs">Nome do contato</Label><Input value={contactName} onChange={e => setContactName(e.target.value)} className="h-8 text-sm" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">E-mail</Label><Input value={contactEmail} onChange={e => setContactEmail(e.target.value)} className="h-8 text-sm" /></div>
              <div><Label className="text-xs">Telefone</Label><Input value={contactPhone} onChange={e => setContactPhone(e.target.value)} className="h-8 text-sm" /></div>
            </div>
            <div><Label className="text-xs">Observações</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} className="text-xs min-h-[60px]" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => { setShowForm(false); resetForm(); }}>Cancelar</Button>
            <Button size="sm" onClick={handleSave} disabled={!name.trim()}>{editing ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
