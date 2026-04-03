import {
  Filter, X, Calendar, DollarSign, UserCircle,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

export interface CrmFilterState {
  filterSource: string;
  filterTag: string;
  filterAssigned: string;
  filterStatus: string;
  filterValueMin: string;
  filterValueMax: string;
  filterDateFrom: string;
  filterDateTo: string;
}

export interface CrmFiltersProps {
  filters: CrmFilterState;
  setFilterSource: (v: string) => void;
  setFilterTag: (v: string) => void;
  setFilterAssigned: (v: string) => void;
  setFilterStatus: (v: string) => void;
  setFilterValueMin: (v: string) => void;
  setFilterValueMax: (v: string) => void;
  setFilterDateFrom: (v: string) => void;
  setFilterDateTo: (v: string) => void;
  clearAllFilters: () => void;
  activeFilterCount: number;
  filtersOpen: boolean;
  setFiltersOpen: (v: boolean) => void;
  sources: string[];
  allTags: string[];
  team: Array<{ user_id: string; full_name: string }> | undefined;
  selectionMode: boolean;
  setSelectionMode: (v: boolean) => void;
  clearSelection: () => void;
}

export function CrmFilterBar({
  filters, setFilterSource, setFilterTag, setFilterAssigned, setFilterStatus,
  setFilterValueMin, setFilterValueMax, setFilterDateFrom, setFilterDateTo,
  clearAllFilters, activeFilterCount, filtersOpen, setFiltersOpen,
  sources, allTags, team, selectionMode, setSelectionMode, clearSelection,
}: CrmFiltersProps) {
  const hasFilters = activeFilterCount > 0;

  return (
    <>
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
              {hasFilters && <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={clearAllFilters}><X className="w-3 h-3" /> Limpar tudo</Button>}
            </div>

            {team && team.length > 0 && (
              <div>
                <Label className="text-[10px] text-muted-foreground">Responsável</Label>
                <Select value={filters.filterAssigned} onValueChange={v => setFilterAssigned(v === "all" ? "" : v)}>
                  <SelectTrigger className="h-8 text-xs"><UserCircle className="w-3 h-3 mr-1" /><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">Todos</SelectItem>
                    {team.map(m => <SelectItem key={m.user_id} value={m.user_id} className="text-xs">{m.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] text-muted-foreground">Data de</Label>
                <Input type="date" value={filters.filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className="h-8 text-xs" />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Data até</Label>
                <Input type="date" value={filters.filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className="h-8 text-xs" />
              </div>
            </div>

            <div>
              <Label className="text-[10px] text-muted-foreground">Origem</Label>
              <Select value={filters.filterSource} onValueChange={v => setFilterSource(v === "all" ? "" : v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Todas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">Todas origens</SelectItem>
                  {sources.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {allTags.length > 0 && (
              <div>
                <Label className="text-[10px] text-muted-foreground">Tag</Label>
                <Select value={filters.filterTag} onValueChange={v => setFilterTag(v === "all" ? "" : v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Todas" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">Todas tags</SelectItem>
                    {allTags.map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label className="text-[10px] text-muted-foreground">Status</Label>
              <Select value={filters.filterStatus} onValueChange={v => setFilterStatus(v === "all" ? "" : v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">Todos</SelectItem>
                  <SelectItem value="active" className="text-xs">Ativo</SelectItem>
                  <SelectItem value="won" className="text-xs">Vendido</SelectItem>
                  <SelectItem value="lost" className="text-xs">Perdido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] text-muted-foreground">Valor mín</Label>
                <Input type="number" value={filters.filterValueMin} onChange={e => setFilterValueMin(e.target.value)} className="h-8 text-xs" placeholder="0" />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Valor máx</Label>
                <Input type="number" value={filters.filterValueMax} onChange={e => setFilterValueMax(e.target.value)} className="h-8 text-xs" placeholder="∞" />
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {hasFilters && (
        <Button variant="ghost" size="sm" className="h-8 text-xs gap-1" onClick={clearAllFilters}>
          <X className="w-3 h-3" /> Limpar filtros
        </Button>
      )}

      <Button
        variant={selectionMode ? "default" : "outline"}
        size="sm"
        className="h-8 text-xs gap-1.5"
        onClick={() => {
          setSelectionMode(!selectionMode);
          if (selectionMode) clearSelection();
        }}
      >
        <Checkbox className="w-3.5 h-3.5 pointer-events-none" checked={selectionMode} />
        Selecionar
      </Button>
    </>
  );
}
