import { Tag, MapPin, Building2, UserPlus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

interface CrmContactsViewBulkBarProps {
  selectedCount: number;
  bulkTagInput: string;
  setBulkTagInput: (v: string) => void;
  bulkSourceInput: string;
  setBulkSourceInput: (v: string) => void;
  bulkCompanyInput: string;
  setBulkCompanyInput: (v: string) => void;
  onBulkAddTag: () => void;
  onBulkUpdateSource: () => void;
  onBulkUpdateCompany: () => void;
  onBulkCreateLeads: () => void;
  onBulkDeleteOpen: () => void;
  onClearSelection: () => void;
}

export function CrmContactsViewBulkBar({
  selectedCount,
  bulkTagInput,
  setBulkTagInput,
  bulkSourceInput,
  setBulkSourceInput,
  bulkCompanyInput,
  setBulkCompanyInput,
  onBulkAddTag,
  onBulkUpdateSource,
  onBulkUpdateCompany,
  onBulkCreateLeads,
  onBulkDeleteOpen,
  onClearSelection,
}: CrmContactsViewBulkBarProps) {
  return (
    <div className="sticky top-0 z-30 bg-primary text-primary-foreground rounded-lg px-4 py-2.5 flex flex-wrap items-center gap-2 shadow-lg animate-fade-in">
      <span className="text-xs font-semibold">{selectedCount} contato(s) selecionado(s)</span>
      <Separator orientation="vertical" className="h-5 bg-primary-foreground/20" />

      <div className="flex items-center gap-1">
        <Input placeholder="Tag..." value={bulkTagInput} onChange={e => setBulkTagInput(e.target.value)} className="h-7 w-24 text-xs bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50" />
        <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={onBulkAddTag} disabled={!bulkTagInput.trim()}><Tag className="w-3 h-3 mr-1" /> Tag</Button>
      </div>

      <div className="flex items-center gap-1">
        <Input placeholder="Origem..." value={bulkSourceInput} onChange={e => setBulkSourceInput(e.target.value)} className="h-7 w-24 text-xs bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50" />
        <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={onBulkUpdateSource} disabled={!bulkSourceInput.trim()}><MapPin className="w-3 h-3 mr-1" /> Origem</Button>
      </div>

      <div className="flex items-center gap-1">
        <Input placeholder="Empresa..." value={bulkCompanyInput} onChange={e => setBulkCompanyInput(e.target.value)} className="h-7 w-24 text-xs bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50" />
        <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={onBulkUpdateCompany} disabled={!bulkCompanyInput.trim()}><Building2 className="w-3 h-3 mr-1" /> Empresa</Button>
      </div>

      <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={onBulkCreateLeads}>
        <UserPlus className="w-3 h-3 mr-1" /> Criar Leads
      </Button>

      <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={onBulkDeleteOpen}>
        <Trash2 className="w-3 h-3 mr-1" /> Excluir
      </Button>

      <Button size="sm" variant="ghost" className="h-7 text-xs text-primary-foreground hover:text-primary-foreground/80 ml-auto" onClick={onClearSelection}>
        <X className="w-3 h-3" />
      </Button>
    </div>
  );
}
