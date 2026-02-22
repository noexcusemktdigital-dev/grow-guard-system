import { useState, useMemo, useRef } from "react";
import { Users, Plus, Search, Upload, UserPlus, Filter, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useCrmContacts, useCrmContactMutations, type CrmContact } from "@/hooks/useCrmContacts";
import { useCrmLeads } from "@/hooks/useClienteCrm";
import { useToast } from "@/hooks/use-toast";
import { CrmCsvImportDialog } from "./CrmCsvImportDialog";

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

interface Props {
  onCreateLeadFromContact?: (contact: CrmContact) => void;
}

export function CrmContactsView({ onCreateLeadFromContact }: Props) {
  const { toast } = useToast();
  const { data: contacts, isLoading } = useCrmContacts();
  const { data: leads } = useCrmLeads();
  const { createContact, updateContact, deleteContact } = useCrmContactMutations();

  const [search, setSearch] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [editContact, setEditContact] = useState<CrmContact | null>(null);
  const [csvImportOpen, setCsvImportOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterTag, setFilterTag] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [filterCompany, setFilterCompany] = useState("");

  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", position: "", notes: "", tags: "", source: "" });
  const resetForm = () => setForm({ name: "", email: "", phone: "", company: "", position: "", notes: "", tags: "", source: "" });

  const allContacts = contacts || [];

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    allContacts.forEach(c => c.tags?.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [allContacts]);

  const allSources = useMemo(() => {
    const sources = new Set<string>();
    allContacts.forEach(c => { if (c.source) sources.add(c.source); });
    return Array.from(sources).sort();
  }, [allContacts]);

  const allCompanies = useMemo(() => {
    const companies = new Set<string>();
    allContacts.forEach(c => { if (c.company) companies.add(c.company); });
    return Array.from(companies).sort();
  }, [allContacts]);

  const activeFilterCount = [filterTag, filterSource, filterCompany].filter(Boolean).length;

  const clearAllFilters = () => { setFilterTag(""); setFilterSource(""); setFilterCompany(""); };

  const filtered = useMemo(() => {
    let result = allContacts;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(c => c.name.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.phone?.includes(q) || c.company?.toLowerCase().includes(q));
    }
    if (filterTag) result = result.filter(c => c.tags?.includes(filterTag));
    if (filterSource) result = result.filter(c => c.source === filterSource);
    if (filterCompany) result = result.filter(c => c.company === filterCompany);
    return result;
  }, [allContacts, search, filterTag, filterSource, filterCompany]);

  const leadsCountByContact = useMemo(() => {
    return (leads || []).reduce((acc, l) => {
      const cid = (l as any).contact_id;
      if (cid) acc[cid] = (acc[cid] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [leads]);

  const handleCreate = () => {
    if (!form.name.trim()) { toast({ title: "Informe o nome", variant: "destructive" }); return; }
    const tags = form.tags.split(",").map(t => t.trim()).filter(Boolean);
    createContact.mutate({
      name: form.name.trim(), email: form.email || null, phone: form.phone || null,
      company: form.company || null, position: form.position || null,
      notes: form.notes || null, tags, source: form.source || null,
    });
    resetForm();
    setNewOpen(false);
    toast({ title: "Contato criado" });
  };

  const handleUpdate = () => {
    if (!editContact) return;
    const tags = form.tags.split(",").map(t => t.trim()).filter(Boolean);
    updateContact.mutate({
      id: editContact.id, name: form.name.trim(), email: form.email || null,
      phone: form.phone || null, company: form.company || null, position: form.position || null,
      notes: form.notes || null, tags, source: form.source || null,
    });
    setEditContact(null);
    toast({ title: "Contato atualizado" });
  };

  const openEdit = (c: CrmContact) => {
    setForm({ name: c.name, email: c.email || "", phone: c.phone || "", company: c.company || "", position: c.position || "", notes: c.notes || "", tags: (c.tags || []).join(", "), source: c.source || "" });
    setEditContact(c);
  };

  if (isLoading) return <Skeleton className="h-64" />;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar contato..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-8" />
        </div>

        <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
              <Filter className="w-3.5 h-3.5" /> Filtros
              {activeFilterCount > 0 && <Badge variant="secondary" className="text-[9px] h-4 px-1.5 ml-0.5">{activeFilterCount}</Badge>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-4" align="start">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold">Filtros</p>
                {activeFilterCount > 0 && <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={clearAllFilters}><X className="w-3 h-3" /> Limpar</Button>}
              </div>
              {allTags.length > 0 && (
                <div>
                  <Label className="text-[10px] text-muted-foreground">Tag</Label>
                  <Select value={filterTag} onValueChange={v => setFilterTag(v === "all" ? "" : v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Todas" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs">Todas</SelectItem>
                      {allTags.map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {allSources.length > 0 && (
                <div>
                  <Label className="text-[10px] text-muted-foreground">Origem</Label>
                  <Select value={filterSource} onValueChange={v => setFilterSource(v === "all" ? "" : v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Todas" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs">Todas</SelectItem>
                      {allSources.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {allCompanies.length > 0 && (
                <div>
                  <Label className="text-[10px] text-muted-foreground">Empresa</Label>
                  <Select value={filterCompany} onValueChange={v => setFilterCompany(v === "all" ? "" : v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Todas" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs">Todas</SelectItem>
                      {allCompanies.map(c => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" className="h-8 text-xs gap-1" onClick={clearAllFilters}>
            <X className="w-3 h-3" /> Limpar filtros
          </Button>
        )}

        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" className="gap-1 h-8" onClick={() => setCsvImportOpen(true)}>
            <Upload className="w-3.5 h-3.5" /> Importar CSV
          </Button>
          <Button size="sm" className="gap-1 h-8" onClick={() => { resetForm(); setNewOpen(true); }}>
            <Plus className="w-3.5 h-3.5" /> Novo Contato
          </Button>
        </div>
      </div>

      {/* Contacts list */}
      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="text-sm font-medium">Nenhum contato</p>
            <p className="text-xs text-muted-foreground mt-1">Adicione contatos à sua base de dados.</p>
            <Button size="sm" className="mt-4 gap-1" onClick={() => { resetForm(); setNewOpen(true); }}>
              <Plus className="w-3.5 h-3.5" /> Novo Contato
            </Button>
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
                  {c.position && <Badge variant="secondary" className="text-[9px] hidden sm:inline-flex">{c.position}</Badge>}
                  <Badge variant="outline" className="text-[9px]">{leadsCountByContact[c.id] || 0} leads</Badge>
                  {c.source && <span className="text-[10px] text-muted-foreground hidden md:inline">{c.source}</span>}
                  {onCreateLeadFromContact && (
                    <Button
                      variant="ghost" size="sm" className="h-7 text-[10px] gap-1"
                      onClick={e => { e.stopPropagation(); onCreateLeadFromContact(c); }}
                    >
                      <UserPlus className="w-3 h-3" /> Lead
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* CSV Import Dialog */}
      <CrmCsvImportDialog open={csvImportOpen} onOpenChange={setCsvImportOpen} />

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
              <Button variant="destructive" size="sm" onClick={() => { if (editContact) { deleteContact.mutate(editContact.id); setEditContact(null); toast({ title: "Contato excluído" }); } }}>Excluir</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
