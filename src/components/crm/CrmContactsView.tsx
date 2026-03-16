import { useState, useMemo, useEffect } from "react";
import { Users, Plus, Search, Upload, UserPlus, Filter, X, MoreHorizontal, Copy, Trash2, Tag, Building2, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useCrmContacts, useCrmContactMutations, type CrmContact } from "@/hooks/useCrmContacts";
import { useCrmLeads, useCrmLeadMutations } from "@/hooks/useClienteCrm";
import { useCrmFunnels } from "@/hooks/useCrmFunnels";
import { useToast } from "@/hooks/use-toast";
import { CrmCsvImportDialog } from "./CrmCsvImportDialog";
import { DEFAULT_STAGES, type FunnelStage } from "@/components/crm/CrmStageSystem";

const CONTACTS_PER_PAGE = 25;

function ContactForm({ form, setForm }: { form: any; setForm: (f: any) => void }) {
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

const emptyForm = { name: "", email: "", phone: "", company: "", position: "", notes: "", tags: "", source: "", document: "", address: "", birth_date: "" };

interface Props {
  onCreateLeadFromContact?: (contact: CrmContact) => void;
}

export function CrmContactsView({ onCreateLeadFromContact }: Props) {
  const { toast } = useToast();
  const { data: contacts, isLoading } = useCrmContacts();
  const { data: leads } = useCrmLeads();
  const { createContact, updateContact, deleteContact, bulkUpdateContacts, bulkDeleteContacts } = useCrmContactMutations();
  const { createLead } = useCrmLeadMutations();
  const { data: funnelsData } = useCrmFunnels();

  const [search, setSearch] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [editContact, setEditContact] = useState<CrmContact | null>(null);
  const [csvImportOpen, setCsvImportOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterTag, setFilterTag] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [filterCompany, setFilterCompany] = useState("");
  const [filterPosition, setFilterPosition] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterHasLeads, setFilterHasLeads] = useState<"all" | "yes" | "no">("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkTagInput, setBulkTagInput] = useState("");
  const [bulkSourceInput, setBulkSourceInput] = useState("");
  const [bulkCompanyInput, setBulkCompanyInput] = useState("");
  const [page, setPage] = useState(0);

  // Funnel/stage dialog for creating leads
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [convertContacts, setConvertContacts] = useState<CrmContact[]>([]);
  const [selectedFunnelId, setSelectedFunnelId] = useState("");
  const [selectedStage, setSelectedStage] = useState("");

  const [form, setForm] = useState(emptyForm);
  const resetForm = () => setForm(emptyForm);

  const allContacts = contacts || [];

  const funnels = funnelsData || [];

  const selectedFunnelStages: FunnelStage[] = useMemo(() => {
    if (!selectedFunnelId) return [];
    const funnel = funnels.find(f => f.id === selectedFunnelId);
    if (!funnel) return DEFAULT_STAGES;
    const dbStages = funnel.stages as any[];
    if (Array.isArray(dbStages) && dbStages.length > 0) {
      return dbStages.map((s: any) => ({
        key: s.key || s.label?.toLowerCase().replace(/\s+/g, "_") || "stage",
        label: s.label || "Etapa",
        color: s.color || "blue",
        icon: s.icon || "circle-dot",
      }));
    }
    return DEFAULT_STAGES;
  }, [selectedFunnelId, funnels]);

  // Auto-select first funnel and stage
  useEffect(() => {
    if (convertDialogOpen && funnels.length > 0 && !selectedFunnelId) {
      const def = funnels.find(f => f.is_default) || funnels[0];
      setSelectedFunnelId(def.id);
    }
  }, [convertDialogOpen, funnels, selectedFunnelId]);

  useEffect(() => {
    if (selectedFunnelStages.length > 0 && !selectedStage) {
      setSelectedStage(selectedFunnelStages[0].key);
    }
  }, [selectedFunnelStages, selectedStage]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    allContacts.forEach(c => c.tags?.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [allContacts]);

  const allSources = useMemo(() => {
    const s = new Set<string>();
    allContacts.forEach(c => { if (c.source) s.add(c.source); });
    return Array.from(s).sort();
  }, [allContacts]);

  const allCompanies = useMemo(() => {
    const c = new Set<string>();
    allContacts.forEach(ct => { if (ct.company) c.add(ct.company); });
    return Array.from(c).sort();
  }, [allContacts]);

  const allPositions = useMemo(() => {
    const p = new Set<string>();
    allContacts.forEach(c => { if (c.position) p.add(c.position); });
    return Array.from(p).sort();
  }, [allContacts]);

  const leadsCountByContact = useMemo(() => {
    return (leads || []).reduce((acc, l) => {
      const cid = (l as any).contact_id;
      if (cid) acc[cid] = (acc[cid] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [leads]);

  const activeFilterCount = [filterTag, filterSource, filterCompany, filterPosition, filterDateFrom, filterDateTo, filterHasLeads !== "all" ? "x" : ""].filter(Boolean).length;
  const clearAllFilters = () => { setFilterTag(""); setFilterSource(""); setFilterCompany(""); setFilterPosition(""); setFilterDateFrom(""); setFilterDateTo(""); setFilterHasLeads("all"); };

  const filtered = useMemo(() => {
    let result = allContacts;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(c => c.name.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.phone?.includes(q) || c.company?.toLowerCase().includes(q));
    }
    if (filterTag) result = result.filter(c => c.tags?.includes(filterTag));
    if (filterSource) result = result.filter(c => c.source === filterSource);
    if (filterCompany) result = result.filter(c => c.company === filterCompany);
    if (filterPosition) result = result.filter(c => c.position === filterPosition);
    if (filterDateFrom) result = result.filter(c => new Date(c.created_at) >= new Date(filterDateFrom));
    if (filterDateTo) {
      const to = new Date(filterDateTo); to.setHours(23, 59, 59, 999);
      result = result.filter(c => new Date(c.created_at) <= to);
    }
    if (filterHasLeads === "yes") result = result.filter(c => (leadsCountByContact[c.id] || 0) > 0);
    if (filterHasLeads === "no") result = result.filter(c => !leadsCountByContact[c.id]);
    return result;
  }, [allContacts, search, filterTag, filterSource, filterCompany, filterPosition, filterDateFrom, filterDateTo, filterHasLeads, leadsCountByContact]);

  // Reset page when filters/search change
  useEffect(() => { setPage(0); }, [search, filterTag, filterSource, filterCompany, filterPosition, filterDateFrom, filterDateTo, filterHasLeads]);

  const totalPages = Math.ceil(filtered.length / CONTACTS_PER_PAGE);
  const paginatedContacts = filtered.slice(page * CONTACTS_PER_PAGE, (page + 1) * CONTACTS_PER_PAGE);

  const allSelected = paginatedContacts.length > 0 && paginatedContacts.every(c => selectedIds.has(c.id));
  const someSelected = selectedIds.size > 0;

  const toggleAll = () => {
    if (allSelected) {
      const next = new Set(selectedIds);
      paginatedContacts.forEach(c => next.delete(c.id));
      setSelectedIds(next);
    } else {
      const next = new Set(selectedIds);
      paginatedContacts.forEach(c => next.add(c.id));
      setSelectedIds(next);
    }
  };
  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const handleCreate = () => {
    if (!form.name.trim()) { toast({ title: "Informe o nome", variant: "destructive" }); return; }
    const tags = form.tags.split(",").map(t => t.trim()).filter(Boolean);
    createContact.mutate({
      name: form.name.trim(), email: form.email || null, phone: form.phone || null,
      company: form.company || null, position: form.position || null,
      notes: form.notes || null, tags, source: form.source || null,
      document: form.document || null, address: form.address || null,
      birth_date: form.birth_date || null,
    } as any);
    resetForm(); setNewOpen(false);
    toast({ title: "Contato criado" });
  };

  const handleUpdate = () => {
    if (!editContact) return;
    const tags = form.tags.split(",").map(t => t.trim()).filter(Boolean);
    updateContact.mutate({
      id: editContact.id, name: form.name.trim(), email: form.email || null,
      phone: form.phone || null, company: form.company || null, position: form.position || null,
      notes: form.notes || null, tags, source: form.source || null,
      document: form.document || null, address: form.address || null,
      birth_date: form.birth_date || null,
    });
    setEditContact(null);
    toast({ title: "Contato atualizado" });
  };

  const openEdit = (c: CrmContact) => {
    setForm({
      name: c.name, email: c.email || "", phone: c.phone || "", company: c.company || "",
      position: c.position || "", notes: c.notes || "", tags: (c.tags || []).join(", "),
      source: c.source || "", document: (c as any).document || "", address: (c as any).address || "",
      birth_date: (c as any).birth_date || "",
    });
    setEditContact(c);
  };

  // Open convert dialog
  const openConvertDialog = (contactsToConvert: CrmContact[]) => {
    setConvertContacts(contactsToConvert);
    setSelectedFunnelId("");
    setSelectedStage("");
    setConvertDialogOpen(true);
  };

  // Bulk actions
  const handleBulkAddTag = () => {
    if (!bulkTagInput.trim()) return;
    const ids = Array.from(selectedIds);
    const contactsToUpdate = allContacts.filter(c => selectedIds.has(c.id));
    contactsToUpdate.forEach(c => {
      const existingTags = c.tags || [];
      if (!existingTags.includes(bulkTagInput.trim())) {
        updateContact.mutate({ id: c.id, tags: [...existingTags, bulkTagInput.trim()] });
      }
    });
    setBulkTagInput("");
    setSelectedIds(new Set());
    toast({ title: `Tag adicionada a ${ids.length} contatos` });
  };

  const handleBulkUpdateSource = () => {
    if (!bulkSourceInput.trim()) return;
    bulkUpdateContacts.mutate({ ids: Array.from(selectedIds), fields: { source: bulkSourceInput.trim() } });
    setBulkSourceInput("");
    setSelectedIds(new Set());
    toast({ title: "Origem atualizada em massa" });
  };

  const handleBulkUpdateCompany = () => {
    if (!bulkCompanyInput.trim()) return;
    bulkUpdateContacts.mutate({ ids: Array.from(selectedIds), fields: { company: bulkCompanyInput.trim() } });
    setBulkCompanyInput("");
    setSelectedIds(new Set());
    toast({ title: "Empresa atualizada em massa" });
  };

  const handleBulkDelete = () => {
    bulkDeleteContacts.mutate(Array.from(selectedIds));
    setSelectedIds(new Set());
    setBulkDeleteOpen(false);
    toast({ title: "Contatos excluídos" });
  };

  const handleBulkCreateLeads = () => {
    const contactsToConvert = allContacts.filter(c => selectedIds.has(c.id));
    openConvertDialog(contactsToConvert);
  };

  const handleConfirmConvertLeads = () => {
    if (!selectedFunnelId || !selectedStage) {
      toast({ title: "Selecione funil e etapa", variant: "destructive" });
      return;
    }
    convertContacts.forEach(c => {
      createLead.mutate({
        name: c.name,
        email: c.email || undefined,
        phone: c.phone || undefined,
        company: c.company || undefined,
        source: c.source || undefined,
        funnel_id: selectedFunnelId,
        stage: selectedStage,
      });
    });
    toast({ title: `${convertContacts.length} lead(s) criado(s) no funil selecionado` });
    setConvertDialogOpen(false);
    setConvertContacts([]);
    setSelectedIds(new Set());
  };

  if (isLoading) return <Skeleton className="h-64" />;

  return (
    <div className="space-y-4">
      {/* Bulk Actions Bar */}
      {someSelected && (
        <div className="sticky top-0 z-30 bg-primary text-primary-foreground rounded-lg px-4 py-2.5 flex flex-wrap items-center gap-2 shadow-lg animate-fade-in">
          <span className="text-xs font-semibold">{selectedIds.size} contato(s) selecionado(s)</span>
          <Separator orientation="vertical" className="h-5 bg-primary-foreground/20" />

          <div className="flex items-center gap-1">
            <Input placeholder="Tag..." value={bulkTagInput} onChange={e => setBulkTagInput(e.target.value)} className="h-7 w-24 text-xs bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50" />
            <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={handleBulkAddTag} disabled={!bulkTagInput.trim()}><Tag className="w-3 h-3 mr-1" /> Tag</Button>
          </div>

          <div className="flex items-center gap-1">
            <Input placeholder="Origem..." value={bulkSourceInput} onChange={e => setBulkSourceInput(e.target.value)} className="h-7 w-24 text-xs bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50" />
            <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={handleBulkUpdateSource} disabled={!bulkSourceInput.trim()}><MapPin className="w-3 h-3 mr-1" /> Origem</Button>
          </div>

          <div className="flex items-center gap-1">
            <Input placeholder="Empresa..." value={bulkCompanyInput} onChange={e => setBulkCompanyInput(e.target.value)} className="h-7 w-24 text-xs bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50" />
            <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={handleBulkUpdateCompany} disabled={!bulkCompanyInput.trim()}><Building2 className="w-3 h-3 mr-1" /> Empresa</Button>
          </div>

          <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={handleBulkCreateLeads}>
            <UserPlus className="w-3 h-3 mr-1" /> Criar Leads
          </Button>

          <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => setBulkDeleteOpen(true)}>
            <Trash2 className="w-3 h-3 mr-1" /> Excluir
          </Button>

          <Button size="sm" variant="ghost" className="h-7 text-xs text-primary-foreground hover:text-primary-foreground/80 ml-auto" onClick={() => setSelectedIds(new Set())}>
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}

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
          <PopoverContent className="w-80 p-4" align="start">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold">Filtros</p>
                {activeFilterCount > 0 && <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={clearAllFilters}><X className="w-3 h-3" /> Limpar tudo</Button>}
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
              {allPositions.length > 0 && (
                <div>
                  <Label className="text-[10px] text-muted-foreground">Cargo</Label>
                  <Select value={filterPosition} onValueChange={v => setFilterPosition(v === "all" ? "" : v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs">Todos</SelectItem>
                      {allPositions.map(p => <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] text-muted-foreground">Criado de</Label>
                  <Input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className="h-8 text-xs" />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Criado até</Label>
                  <Input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className="h-8 text-xs" />
                </div>
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Com leads vinculados</Label>
                <Select value={filterHasLeads} onValueChange={v => setFilterHasLeads(v as any)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">Todos</SelectItem>
                    <SelectItem value="yes" className="text-xs">Com leads</SelectItem>
                    <SelectItem value="no" className="text-xs">Sem leads</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
            {/* Header with select all */}
            <div className="flex items-center gap-4 px-4 py-2 border-b bg-muted/30">
              <Checkbox checked={allSelected} onCheckedChange={toggleAll} className="shrink-0" />
              <span className="text-[10px] text-muted-foreground font-medium flex-1">
                {filtered.length} contato(s) {someSelected && `· ${selectedIds.size} selecionado(s)`}
              </span>
            </div>
            <div className="divide-y">
              {paginatedContacts.map(c => (
                <div key={c.id} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-colors group">
                  <Checkbox checked={selectedIds.has(c.id)} onCheckedChange={() => toggleOne(c.id)} onClick={e => e.stopPropagation()} className="shrink-0" />
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0 cursor-pointer" onClick={() => openEdit(c)}>
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openEdit(c)}>
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{c.email || c.phone || "—"} {c.company ? `· ${c.company}` : ""}</p>
                  </div>
                  {c.position && <Badge variant="secondary" className="text-[9px] hidden sm:inline-flex">{c.position}</Badge>}
                  <Badge variant="outline" className="text-[9px]">{leadsCountByContact[c.id] || 0} leads</Badge>
                  {c.source && <span className="text-[10px] text-muted-foreground hidden md:inline">{c.source}</span>}

                  {/* Context menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem className="text-xs gap-2" onClick={() => openEdit(c)}>
                        <Users className="w-3 h-3" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-xs gap-2" onClick={() => openConvertDialog([c])}>
                        <UserPlus className="w-3 h-3" /> Criar Lead
                      </DropdownMenuItem>
                      {c.phone && (
                        <DropdownMenuItem className="text-xs gap-2" onClick={() => { navigator.clipboard.writeText(c.phone!); toast({ title: "Telefone copiado" }); }}>
                          <Copy className="w-3 h-3" /> Copiar telefone
                        </DropdownMenuItem>
                      )}
                      {c.email && (
                        <DropdownMenuItem className="text-xs gap-2" onClick={() => { navigator.clipboard.writeText(c.email!); toast({ title: "Email copiado" }); }}>
                          <Copy className="w-3 h-3" /> Copiar email
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-xs gap-2 text-destructive" onClick={() => { deleteContact.mutate(c.id); toast({ title: "Contato excluído" }); }}>
                        <Trash2 className="w-3 h-3" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20">
                <span className="text-[11px] text-muted-foreground">
                  Página {page + 1} de {totalPages} · {filtered.length} contato(s)
                </span>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                    <ChevronLeft className="w-3 h-3" /> Anterior
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                    Próximo <ChevronRight className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {selectedIds.size} contato(s)?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CrmCsvImportDialog open={csvImportOpen} onOpenChange={setCsvImportOpen} />

      {/* New Contact Dialog */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="max-w-lg">
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
            <Button onClick={handleConfirmConvertLeads} disabled={!selectedFunnelId || !selectedStage}>
              <UserPlus className="w-4 h-4 mr-1" /> Criar {convertContacts.length} Lead(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
