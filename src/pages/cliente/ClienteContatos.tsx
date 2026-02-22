import { useState, useRef } from "react";
import { Users, Plus, Search, Upload, FileSpreadsheet, CheckCircle, AlertCircle, X, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useCrmContacts, useCrmContactMutations } from "@/hooks/useCrmContacts";
import { useCrmLeads } from "@/hooks/useCrmLeads";
import { useToast } from "@/hooks/use-toast";

export default function ClienteContatos() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const { data: contacts, isLoading } = useCrmContacts();
  const { data: leads } = useCrmLeads();
  const { createContact, updateContact, deleteContact } = useCrmContactMutations();

  const [newOpen, setNewOpen] = useState(false);
  const [editContact, setEditContact] = useState<any>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", position: "", notes: "", tags: "", source: "" });
  const fileRef = useRef<HTMLInputElement>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; errors: number } | null>(null);

  const resetForm = () => setForm({ name: "", email: "", phone: "", company: "", position: "", notes: "", tags: "", source: "" });

  const filtered = (contacts || []).filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.phone?.includes(q) || c.company?.toLowerCase().includes(q);
  });

  const leadsCountByContact = (leads || []).reduce((acc, l) => {
    const cid = (l as any).contact_id;
    if (cid) acc[cid] = (acc[cid] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleCreate = () => {
    if (!form.name.trim()) { toast({ title: "Informe o nome", variant: "destructive" }); return; }
    const tags = form.tags.split(",").map(t => t.trim()).filter(Boolean);
    createContact.mutate({
      name: form.name.trim(),
      email: form.email || null,
      phone: form.phone || null,
      company: form.company || null,
      position: form.position || null,
      notes: form.notes || null,
      tags,
      source: form.source || null,
    });
    resetForm();
    setNewOpen(false);
    toast({ title: "Contato criado" });
  };

  const handleUpdate = () => {
    if (!editContact) return;
    const tags = form.tags.split(",").map(t => t.trim()).filter(Boolean);
    updateContact.mutate({
      id: editContact.id,
      name: form.name.trim(),
      email: form.email || null,
      phone: form.phone || null,
      company: form.company || null,
      position: form.position || null,
      notes: form.notes || null,
      tags,
      source: form.source || null,
    });
    setEditContact(null);
    toast({ title: "Contato atualizado" });
  };

  const openEdit = (c: any) => {
    setForm({ name: c.name, email: c.email || "", phone: c.phone || "", company: c.company || "", position: c.position || "", notes: c.notes || "", tags: (c.tags || []).join(", "), source: c.source || "" });
    setEditContact(c);
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").filter(l => l.trim());
      if (lines.length < 2) { toast({ title: "CSV vazio", variant: "destructive" }); return; }
      const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
      const rows = lines.slice(1).map(line => {
        const values = line.split(",");
        const obj: any = {};
        headers.forEach((h, i) => { obj[h] = values[i]?.trim() || ""; });
        return obj;
      });
      setCsvData(rows);
      setImportResult(null);
    };
    reader.readAsText(file);
  };

  const handleImportCsv = async () => {
    setImporting(true);
    let success = 0, errors = 0;
    for (const row of csvData) {
      try {
        await createContact.mutateAsync({
          name: row.nome || row.name || "Sem nome",
          email: row.email || null,
          phone: row.telefone || row.phone || null,
          company: row.empresa || row.company || null,
          source: row.origem || row.source || "CSV",
        });
        success++;
      } catch { errors++; }
    }
    setImportResult({ success, errors });
    setCsvData([]);
    setImporting(false);
    toast({ title: `${success} contatos importados, ${errors} erros` });
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <PageHeader title="Contatos" subtitle="Base de dados de contatos" icon={<Users className="w-5 h-5 text-primary" />} />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <PageHeader
        title="Contatos"
        subtitle={`${contacts?.length || 0} contatos na base`}
        icon={<Users className="w-5 h-5 text-primary" />}
        actions={
          <div className="flex items-center gap-2">
            <input type="file" accept=".csv" ref={fileRef} onChange={handleCsvUpload} className="hidden" />
            <Button size="sm" variant="outline" className="gap-1" onClick={() => fileRef.current?.click()}>
              <Upload className="w-3.5 h-3.5" /> CSV
            </Button>
            <Button size="sm" className="gap-1" onClick={() => { resetForm(); setNewOpen(true); }}>
              <Plus className="w-3.5 h-3.5" /> Novo Contato
            </Button>
          </div>
        }
      />

      {/* CSV Preview */}
      {csvData.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs gap-1"><FileSpreadsheet className="w-3 h-3" /> {csvData.length} contatos no CSV</Badge>
              <Button size="sm" onClick={handleImportCsv} disabled={importing}>{importing ? "Importando..." : "Importar"}</Button>
            </div>
            <div className="max-h-32 overflow-auto text-[10px] text-muted-foreground space-y-0.5">
              {csvData.slice(0, 5).map((r, i) => <p key={i}>{r.nome || r.name} · {r.email} · {r.telefone || r.phone}</p>)}
              {csvData.length > 5 && <p>... e mais {csvData.length - 5}</p>}
            </div>
          </CardContent>
        </Card>
      )}

      {importResult && (
        <div className="flex gap-3 text-xs">
          <span className="flex items-center gap-1 text-emerald-600"><CheckCircle className="w-3 h-3" /> {importResult.success} sucesso</span>
          {importResult.errors > 0 && <span className="flex items-center gap-1 text-red-500"><AlertCircle className="w-3 h-3" /> {importResult.errors} erros</span>}
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar contato..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-8" />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="text-sm font-medium">Nenhum contato</p>
            <p className="text-xs text-muted-foreground mt-1">Adicione contatos à sua base de dados.</p>
            <Button size="sm" className="mt-4 gap-1" onClick={() => { resetForm(); setNewOpen(true); }}><Plus className="w-3.5 h-3.5" /> Novo Contato</Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filtered.map(c => (
                <div key={c.id} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => openEdit(c)}>
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{c.email || c.phone || "—"} {c.company ? `· ${c.company}` : ""}</p>
                  </div>
                  {c.position && <Badge variant="secondary" className="text-[9px]">{c.position}</Badge>}
                  <Badge variant="outline" className="text-[9px]">{leadsCountByContact[c.id] || 0} leads</Badge>
                  {c.source && <span className="text-[10px] text-muted-foreground">{c.source}</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* New Contact Dialog */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Novo Contato</DialogTitle></DialogHeader>
          <ContactForm form={form} setForm={setForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Contact Sheet */}
      <Sheet open={!!editContact} onOpenChange={o => !o && setEditContact(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader><SheetTitle>Editar Contato</SheetTitle></SheetHeader>
          <div className="mt-4 space-y-4">
            <ContactForm form={form} setForm={setForm} />
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleUpdate}>Salvar</Button>
              <Button variant="destructive" size="sm" onClick={() => { deleteContact.mutate(editContact.id); setEditContact(null); toast({ title: "Contato excluído" }); }}>Excluir</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function ContactForm({ form, setForm }: { form: any; setForm: (f: any) => void }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs">Nome *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
        <div><Label className="text-xs">Telefone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
        <div><Label className="text-xs">E-mail</Label><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
        <div><Label className="text-xs">Empresa</Label><Input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} /></div>
        <div><Label className="text-xs">Cargo</Label><Input value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} /></div>
        <div><Label className="text-xs">Origem</Label><Input value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} /></div>
      </div>
      <div><Label className="text-xs">Tags (separadas por vírgula)</Label><Input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="tag1, tag2" /></div>
      <div><Label className="text-xs">Notas</Label><Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
    </div>
  );
}
