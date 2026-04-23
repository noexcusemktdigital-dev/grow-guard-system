// @ts-nocheck
import { Filter, Search, Tag, ArrowRightLeft, UserCircle, X, XCircle, Trash2 } from "lucide-react";
import { Shuffle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { FunnelStage } from "@/components/crm/CrmStageSystem";
import { ArrowDownUp } from "lucide-react";

const SOURCES = ["WhatsApp", "Formulário", "Indicação", "Ads", "LinkedIn", "Evento", "Orgânico"];

export const ORDER_OPTIONS = [
  { value: "updated_at", label: "Última atualização" },
  { value: "task_due", label: "Prazo da tarefa" },
  { value: "created_at", label: "Data de entrada" },
  { value: "name", label: "Nome A-Z" },
] as const;

export type OrderByKey = typeof ORDER_OPTIONS[number]["value"];

interface TeamMember {
  user_id: string;
  full_name: string;
}

interface Funnel {
  id: string;
  name: string;
  is_default?: boolean;
  stages: unknown;
}

interface ClienteCRMPipelineFiltersProps {
  // Funnel selector
  accessibleFunnels: Funnel[];
  selectedFunnelId: string | null;
  setSelectedFunnelId: (id: string) => void;
  // Search
  search: string;
  setSearch: (v: string) => void;
  // Filter state
  filtersOpen: boolean;
  setFiltersOpen: (v: boolean) => void;
  activeFilterCount: number;
  hasFilters: boolean;
  clearAllFilters: () => void;
  filterSource: string;
  setFilterSource: (v: string) => void;
  filterTag: string;
  setFilterTag: (v: string) => void;
  filterAssigned: string;
  setFilterAssigned: (v: string) => void;
  filterStatus: string;
  setFilterStatus: (v: string) => void;
  filterValueMin: string;
  setFilterValueMin: (v: string) => void;
  filterValueMax: string;
  setFilterValueMax: (v: string) => void;
  filterDateFrom: string;
  setFilterDateFrom: (v: string) => void;
  filterDateTo: string;
  setFilterDateTo: (v: string) => void;
  allTags: string[];
  team: TeamMember[] | undefined;
  // Selection mode
  selectionMode: boolean;
  setSelectionMode: (v: boolean) => void;
  setSelectedLeadIds: (ids: Set<string>) => void;
  // Bulk actions
  someLeadsSelected: boolean;
  selectedLeadIds: Set<string>;
  stages: FunnelStage[];
  handleBulkMoveStage: (stage: string) => void;
  handleBulkAssign: (userId: string) => void;
  bulkTagInput: string;
  setBulkTagInput: (v: string) => void;
  handleBulkAddTag: () => void;
  handleBulkTransferFunnel: (funnelId: string) => void;
  handleBulkMarkLost: () => void;
  setBulkDeleteLeadsOpen: (v: boolean) => void;
  orderBy: OrderByKey;
  setOrderBy: (v: OrderByKey) => void;
}

export function ClienteCRMPipelineFilters({
  accessibleFunnels,
  selectedFunnelId,
  setSelectedFunnelId,
  search,
  setSearch,
  filtersOpen,
  setFiltersOpen,
  activeFilterCount,
  hasFilters,
  clearAllFilters,
  filterSource,
  setFilterSource,
  filterTag,
  setFilterTag,
  filterAssigned,
  setFilterAssigned,
  filterStatus,
  setFilterStatus,
  filterValueMin,
  setFilterValueMin,
  filterValueMax,
  setFilterValueMax,
  filterDateFrom,
  setFilterDateFrom,
  filterDateTo,
  setFilterDateTo,
  allTags,
  team,
  selectionMode,
  setSelectionMode,
  setSelectedLeadIds,
  someLeadsSelected,
  selectedLeadIds,
  stages,
  handleBulkMoveStage,
  handleBulkAssign,
  bulkTagInput,
  setBulkTagInput,
  handleBulkAddTag,
  handleBulkTransferFunnel,
  handleBulkMarkLost,
  setBulkDeleteLeadsOpen,
}: ClienteCRMPipelineFiltersProps) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {accessibleFunnels.length > 1 && (
          <Select value={selectedFunnelId || ""} onValueChange={setSelectedFunnelId}>
            <SelectTrigger className="h-8 w-40 text-xs">
              <SelectValue placeholder="Funil" />
            </SelectTrigger>
            <SelectContent>
              {accessibleFunnels.map(f => (
                <SelectItem key={f.id} value={f.id} className="text-xs">{f.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar lead..." value={search} onChange={e => setSearch(e.target.value)} aria-label="Buscar lead" className="pl-10 h-8" />
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
                {hasFilters && <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={clearAllFilters}><X className="w-3 h-3" /> Limpar tudo</Button>}
              </div>

              {team && team.length > 0 && (
                <div>
                  <Label className="text-[10px] text-muted-foreground">Responsável</Label>
                  <Select value={filterAssigned} onValueChange={v => setFilterAssigned(v === "all" ? "" : v)}>
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
                  <Input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className="h-8 text-xs" />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Data até</Label>
                  <Input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className="h-8 text-xs" />
                </div>
              </div>

              <div>
                <Label className="text-[10px] text-muted-foreground">Origem</Label>
                <Select value={filterSource} onValueChange={v => setFilterSource(v === "all" ? "" : v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Todas" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">Todas origens</SelectItem>
                    {SOURCES.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {allTags.length > 0 && (
                <div>
                  <Label className="text-[10px] text-muted-foreground">Tag</Label>
                  <Select value={filterTag} onValueChange={v => setFilterTag(v === "all" ? "" : v)}>
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
                <Select value={filterStatus} onValueChange={v => setFilterStatus(v === "all" ? "" : v)}>
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
                  <Input type="number" value={filterValueMin} onChange={e => setFilterValueMin(e.target.value)} className="h-8 text-xs" placeholder="0" />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Valor máx</Label>
                  <Input type="number" value={filterValueMax} onChange={e => setFilterValueMax(e.target.value)} className="h-8 text-xs" placeholder="∞" />
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
            if (selectionMode) setSelectedLeadIds(new Set());
          }}
        >
          <Checkbox className="w-3.5 h-3.5 pointer-events-none" checked={selectionMode} />
          Selecionar
        </Button>
      </div>

      {/* Bulk Actions Bar */}
      {someLeadsSelected && (
        <div className="sticky top-0 z-30 bg-primary text-primary-foreground rounded-lg px-4 py-2.5 flex flex-wrap items-center gap-2 shadow-lg animate-fade-in">
          <span className="text-xs font-semibold">{selectedLeadIds.size} lead(s) selecionado(s)</span>
          <Separator orientation="vertical" className="h-5 bg-primary-foreground/20" />

          <Select value="" onValueChange={handleBulkMoveStage}>
            <SelectTrigger className="h-7 w-32 text-xs bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground">
              <ArrowRightLeft className="w-3 h-3 mr-1" /><SelectValue placeholder="Mover etapa" />
            </SelectTrigger>
            <SelectContent>
              {stages.map(s => <SelectItem key={s.key} value={s.key} className="text-xs">{s.label}</SelectItem>)}
            </SelectContent>
          </Select>

          {team && team.length > 0 && (
            <Select value="" onValueChange={handleBulkAssign}>
              <SelectTrigger className="h-7 w-32 text-xs bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground">
                <UserCircle className="w-3 h-3 mr-1" /><SelectValue placeholder="Atribuir" />
              </SelectTrigger>
              <SelectContent>
                {team.map(m => <SelectItem key={m.user_id} value={m.user_id} className="text-xs">{m.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}

          <div className="flex items-center gap-1">
            <Input placeholder="Tag..." value={bulkTagInput} onChange={e => setBulkTagInput(e.target.value)} className="h-7 w-24 text-xs bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50" />
            <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={handleBulkAddTag} disabled={!bulkTagInput.trim()}><Tag className="w-3 h-3 mr-1" /> Tag</Button>
          </div>

          {accessibleFunnels.length > 1 && (
            <Select value="" onValueChange={handleBulkTransferFunnel}>
              <SelectTrigger className="h-7 w-36 text-xs bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground">
                <Shuffle className="w-3 h-3 mr-1" /><SelectValue placeholder="Transferir funil" />
              </SelectTrigger>
              <SelectContent>
                {accessibleFunnels.filter(f => f.id !== selectedFunnelId).map(f => (
                  <SelectItem key={f.id} value={f.id} className="text-xs">{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={handleBulkMarkLost}>
            <XCircle className="w-3 h-3 mr-1" /> Perdido
          </Button>

          <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => setBulkDeleteLeadsOpen(true)}>
            <Trash2 className="w-3 h-3 mr-1" /> Excluir
          </Button>

          <Button size="sm" variant="ghost" className="h-7 text-xs text-primary-foreground hover:text-primary-foreground/80 ml-auto" onClick={() => setSelectedLeadIds(new Set())}>
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}
    </>
  );
}
