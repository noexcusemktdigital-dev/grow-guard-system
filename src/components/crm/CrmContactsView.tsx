import { useState, useMemo, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCrmContacts, useCrmContactMutations, type CrmContact } from "@/hooks/useCrmContacts";
import { useCrmLeads, useCrmLeadMutations } from "@/hooks/useClienteCrm";
import { useCrmFunnels } from "@/hooks/useCrmFunnels";
import { useToast } from "@/hooks/use-toast";
import { CrmCsvImportDialog } from "./CrmCsvImportDialog";
import { DEFAULT_STAGES, type FunnelStage } from "@/components/crm/CrmStageSystem";
import { CrmContactsViewBulkBar } from "./CrmContactsViewBulkBar";
import { CrmContactsViewFilters } from "./CrmContactsViewFilters";
import { CrmContactsViewList } from "./CrmContactsViewList";
import { CrmContactsViewDialogs } from "./CrmContactsViewDialogs";

const CONTACTS_PER_PAGE = 25;
const emptyForm = { name: "", email: "", phone: "", company: "", position: "", notes: "", tags: "", source: "", document: "", address: "", birth_date: "" };

interface Props {
  onCreateLeadFromContact?: (contact: CrmContact) => void;
  onBackToPipeline?: () => void;
}

export function CrmContactsView({ onCreateLeadFromContact, onBackToPipeline }: Props) {
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
    const dbStages = funnel.stages as Array<{ key?: string; label?: string; color?: string; icon?: string }>;
    if (Array.isArray(dbStages) && dbStages.length > 0) {
      return dbStages.map((s) => ({
        key: s.key || s.label?.toLowerCase().replace(/\s+/g, "_") || "stage",
        label: s.label || "Etapa",
        color: s.color || "blue",
        icon: s.icon || "circle-dot",
      }));
    }
    return DEFAULT_STAGES;
  }, [selectedFunnelId, funnels]);

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
      const cid = (l as unknown as { contact_id?: string }).contact_id;
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
    });
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
      source: c.source || "", document: (c as unknown as { document?: string }).document || "", address: (c as unknown as { address?: string }).address || "",
      birth_date: (c as unknown as { birth_date?: string }).birth_date || "",
    });
    setEditContact(c);
  };

  const openConvertDialog = (contactsToConvert: CrmContact[]) => {
    setConvertContacts(contactsToConvert);
    setSelectedFunnelId("");
    setSelectedStage("");
    setConvertDialogOpen(true);
  };

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
    let created = 0;
    let skipped = 0;
    const existingLeads = leads || [];
    convertContacts.forEach(c => {
      const isDuplicate = existingLeads.some(l =>
        (c.phone && l.phone && c.phone === l.phone) ||
        (c.email && l.email && c.email === l.email)
      );
      if (isDuplicate) {
        skipped++;
        return;
      }
      createLead.mutate({
        name: c.name,
        email: c.email || undefined,
        phone: c.phone || undefined,
        company: c.company || undefined,
        source: c.source || undefined,
        funnel_id: selectedFunnelId,
        stage: selectedStage,
      });
      created++;
    });
    toast({
      title: `${created} lead(s) criado(s)${skipped > 0 ? `, ${skipped} duplicado(s) ignorado(s)` : ""}`,
    });
    setConvertDialogOpen(false);
    setConvertContacts([]);
    setSelectedIds(new Set());
  };

  if (isLoading) return <Skeleton className="h-64" />;

  return (
    <div className="space-y-4">
      {onBackToPipeline && (
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs -mb-2" onClick={onBackToPipeline}>
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao Pipeline
        </Button>
      )}

      {someSelected && (
        <CrmContactsViewBulkBar
          selectedCount={selectedIds.size}
          bulkTagInput={bulkTagInput}
          setBulkTagInput={setBulkTagInput}
          bulkSourceInput={bulkSourceInput}
          setBulkSourceInput={setBulkSourceInput}
          bulkCompanyInput={bulkCompanyInput}
          setBulkCompanyInput={setBulkCompanyInput}
          onBulkAddTag={handleBulkAddTag}
          onBulkUpdateSource={handleBulkUpdateSource}
          onBulkUpdateCompany={handleBulkUpdateCompany}
          onBulkCreateLeads={handleBulkCreateLeads}
          onBulkDeleteOpen={() => setBulkDeleteOpen(true)}
          onClearSelection={() => setSelectedIds(new Set())}
        />
      )}

      <CrmContactsViewFilters
        search={search} setSearch={setSearch}
        filtersOpen={filtersOpen} setFiltersOpen={setFiltersOpen}
        filterTag={filterTag} setFilterTag={setFilterTag}
        filterSource={filterSource} setFilterSource={setFilterSource}
        filterCompany={filterCompany} setFilterCompany={setFilterCompany}
        filterPosition={filterPosition} setFilterPosition={setFilterPosition}
        filterDateFrom={filterDateFrom} setFilterDateFrom={setFilterDateFrom}
        filterDateTo={filterDateTo} setFilterDateTo={setFilterDateTo}
        filterHasLeads={filterHasLeads} setFilterHasLeads={setFilterHasLeads}
        activeFilterCount={activeFilterCount}
        clearAllFilters={clearAllFilters}
        allTags={allTags}
        allSources={allSources}
        allCompanies={allCompanies}
        allPositions={allPositions}
        onNewContact={() => { resetForm(); setNewOpen(true); }}
        onImportCsv={() => setCsvImportOpen(true)}
      />

      <CrmContactsViewList
        filtered={filtered}
        paginatedContacts={paginatedContacts}
        page={page}
        totalPages={totalPages}
        selectedIds={selectedIds}
        allSelected={allSelected}
        someSelected={someSelected}
        leadsCountByContact={leadsCountByContact}
        onToggleAll={toggleAll}
        onToggleOne={toggleOne}
        onOpenEdit={openEdit}
        onOpenConvertDialog={openConvertDialog}
        onDeleteContact={(id) => { deleteContact.mutate(id); toast({ title: "Contato excluído" }); }}
        onCopyPhone={(phone) => { navigator.clipboard.writeText(phone); toast({ title: "Telefone copiado" }); }}
        onCopyEmail={(email) => { navigator.clipboard.writeText(email); toast({ title: "Email copiado" }); }}
        onNewContact={() => { resetForm(); setNewOpen(true); }}
        onPrevPage={() => setPage(p => p - 1)}
        onNextPage={() => setPage(p => p + 1)}
      />

      <CrmCsvImportDialog open={csvImportOpen} onOpenChange={setCsvImportOpen} />

      <CrmContactsViewDialogs
        newOpen={newOpen} setNewOpen={setNewOpen}
        form={form} setForm={setForm}
        onCreateContact={handleCreate}
        editContact={editContact} setEditContact={setEditContact}
        onUpdateContact={handleUpdate}
        onDeleteEditContact={() => { if (editContact) { deleteContact.mutate(editContact.id); setEditContact(null); toast({ title: "Contato excluído" }); } }}
        bulkDeleteOpen={bulkDeleteOpen} setBulkDeleteOpen={setBulkDeleteOpen}
        selectedCount={selectedIds.size}
        onBulkDelete={handleBulkDelete}
        convertDialogOpen={convertDialogOpen} setConvertDialogOpen={setConvertDialogOpen}
        convertContacts={convertContacts}
        funnels={funnels}
        selectedFunnelId={selectedFunnelId} setSelectedFunnelId={setSelectedFunnelId}
        selectedStage={selectedStage} setSelectedStage={setSelectedStage}
        selectedFunnelStages={selectedFunnelStages}
        onConfirmConvertLeads={handleConfirmConvertLeads}
      />
    </div>
  );
}
