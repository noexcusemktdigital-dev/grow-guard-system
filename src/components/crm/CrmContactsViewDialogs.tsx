import { UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { CrmContact } from "@/hooks/useCrmContacts";
import type { FunnelStage } from "@/components/crm/CrmStageSystem";

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  notes: string;
  tags: string;
  source: string;
  document: string;
  address: string;
  birth_date: string;
}

function ContactForm({ form, setForm }: { form: ContactFormData; setForm: (f: ContactFormData) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2">Dados Pessoais</p>
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs">Nome *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label className="text-xs">Telefone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
          <div><Label className="text-xs">E-mail</Label><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
          <div><Label className="text-xs">CPF/CNPJ</Label><Input value={form.document} onChange={e => setForm({ ...form, document: e.target.value })} placeholder="000.000.000-00" /></div>
          <div><Label className="text-xs">Data de Nascimento</Label><Input type="date" value={form.birth_date} onChange={e => setForm({ ...form, birth_date: e.target.value })} /></div>
          <div><Label className="text-xs">Endereço</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
        </div>
      </div>
      <Separator />
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2">Dados Profissionais</p>
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs">Empresa</Label><Input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} /></div>
          <div><Label className="text-xs">Cargo</Label><Input value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} /></div>
          <div><Label className="text-xs">Origem</Label><Input value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} /></div>
        </div>
      </div>
      <Separator />
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2">Informações Adicionais</p>
        <div><Label className="text-xs">Tags (separadas por vírgula)</Label><Input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="tag1, tag2" /></div>
        <div className="mt-3"><Label className="text-xs">Notas</Label><Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
      </div>
    </div>
  );
}

interface Funnel {
  id: string;
  name: string;
  is_default?: boolean;
}

interface CrmContactsViewDialogsProps {
  // New contact dialog
  newOpen: boolean;
  setNewOpen: (v: boolean) => void;
  form: ContactFormData;
  setForm: (f: ContactFormData) => void;
  onCreateContact: () => void;

  // Edit sheet
  editContact: CrmContact | null;
  setEditContact: (c: CrmContact | null) => void;
  onUpdateContact: () => void;
  onDeleteEditContact: () => void;

  // Bulk delete
  bulkDeleteOpen: boolean;
  setBulkDeleteOpen: (v: boolean) => void;
  selectedCount: number;
  onBulkDelete: () => void;

  // Convert to lead dialog
  convertDialogOpen: boolean;
  setConvertDialogOpen: (v: boolean) => void;
  convertContacts: CrmContact[];
  funnels: Funnel[];
  selectedFunnelId: string;
  setSelectedFunnelId: (v: string) => void;
  selectedStage: string;
  setSelectedStage: (v: string) => void;
  selectedFunnelStages: FunnelStage[];
  onConfirmConvertLeads: () => void;
}

export function CrmContactsViewDialogs({
  newOpen, setNewOpen, form, setForm, onCreateContact,
  editContact, setEditContact, onUpdateContact, onDeleteEditContact,
  bulkDeleteOpen, setBulkDeleteOpen, selectedCount, onBulkDelete,
  convertDialogOpen, setConvertDialogOpen, convertContacts,
  funnels, selectedFunnelId, setSelectedFunnelId,
  selectedStage, setSelectedStage, selectedFunnelStages, onConfirmConvertLeads,
}: CrmContactsViewDialogsProps) {
  return (
    <>
      {/* Bulk Delete Confirmation */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {selectedCount} contato(s)?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={onBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* New Contact Dialog */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Novo Contato</DialogTitle></DialogHeader>
          <ContactForm form={form} setForm={setForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewOpen(false)}>Cancelar</Button>
            <Button onClick={onCreateContact}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Contact Sheet */}
      <Sheet open={!!editContact} onOpenChange={o => !o && setEditContact(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <div className="flex items-center justify-between">
              <SheetTitle>Editar Contato</SheetTitle>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditContact(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <ContactForm form={form} setForm={setForm} />
            <div className="flex gap-2">
              <Button className="flex-1" onClick={onUpdateContact}>Salvar</Button>
              <Button variant="destructive" size="sm" onClick={onDeleteEditContact}>Excluir</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Convert to Lead Dialog - Funnel & Stage selection */}
      <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Criar Lead(s) no CRM</DialogTitle>
            <DialogDescription>
              {convertContacts.length} contato(s) serão convertidos em leads. Selecione o funil e a etapa de destino.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {funnels.length === 0 ? (
              <div className="text-center py-4 text-sm text-muted-foreground">
                Nenhum funil criado. Crie um funil nas configurações do CRM antes de converter contatos.
              </div>
            ) : (
              <div>
                <Label className="text-xs font-semibold">Funil</Label>
                <Select value={selectedFunnelId} onValueChange={v => { setSelectedFunnelId(v); setSelectedStage(""); }}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Selecione o funil" /></SelectTrigger>
                  <SelectContent>
                    {funnels.map(f => (
                      <SelectItem key={f.id} value={f.id} className="text-sm">{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {selectedFunnelStages.length > 0 && (
              <div>
                <Label className="text-xs font-semibold">Etapa inicial</Label>
                <Select value={selectedStage} onValueChange={setSelectedStage}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Selecione a etapa" /></SelectTrigger>
                  <SelectContent>
                    {selectedFunnelStages.map(s => (
                      <SelectItem key={s.key} value={s.key} className="text-sm">{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {convertContacts.length <= 5 && (
              <div className="text-xs text-muted-foreground space-y-0.5">
                {convertContacts.map(c => (
                  <p key={c.id}>• {c.name} {c.email ? `(${c.email})` : ""}</p>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConvertDialogOpen(false)}>Cancelar</Button>
            <Button onClick={onConfirmConvertLeads} disabled={!selectedFunnelId || !selectedStage}>
              <UserPlus className="w-4 h-4 mr-1" /> Criar {convertContacts.length} Lead(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
