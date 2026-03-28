import { Search, Filter, X, Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CrmContactsViewFiltersProps {
  search: string;
  setSearch: (v: string) => void;
  filtersOpen: boolean;
  setFiltersOpen: (v: boolean) => void;
  filterTag: string;
  setFilterTag: (v: string) => void;
  filterSource: string;
  setFilterSource: (v: string) => void;
  filterCompany: string;
  setFilterCompany: (v: string) => void;
  filterPosition: string;
  setFilterPosition: (v: string) => void;
  filterDateFrom: string;
  setFilterDateFrom: (v: string) => void;
  filterDateTo: string;
  setFilterDateTo: (v: string) => void;
  filterHasLeads: "all" | "yes" | "no";
  setFilterHasLeads: (v: "all" | "yes" | "no") => void;
  activeFilterCount: number;
  clearAllFilters: () => void;
  allTags: string[];
  allSources: string[];
  allCompanies: string[];
  allPositions: string[];
  onNewContact: () => void;
  onImportCsv: () => void;
}

export function CrmContactsViewFilters({
  search, setSearch,
  filtersOpen, setFiltersOpen,
  filterTag, setFilterTag,
  filterSource, setFilterSource,
  filterCompany, setFilterCompany,
  filterPosition, setFilterPosition,
  filterDateFrom, setFilterDateFrom,
  filterDateTo, setFilterDateTo,
  filterHasLeads, setFilterHasLeads,
  activeFilterCount, clearAllFilters,
  allTags, allSources, allCompanies, allPositions,
  onNewContact, onImportCsv,
}: CrmContactsViewFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar contato..." value={search} onChange={e => setSearch(e.target.value)} aria-label="Buscar contato" className="pl-10 h-8" />
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
              <Select value={filterHasLeads} onValueChange={v => setFilterHasLeads(v as "all" | "yes" | "no")}>
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
        <Button variant="outline" size="sm" className="gap-1 h-8" onClick={onImportCsv}>
          <Upload className="w-3.5 h-3.5" /> Importar CSV
        </Button>
        <Button size="sm" className="gap-1 h-8" onClick={onNewContact}>
          <Plus className="w-3.5 h-3.5" /> Novo Contato
        </Button>
      </div>
    </div>
  );
}
