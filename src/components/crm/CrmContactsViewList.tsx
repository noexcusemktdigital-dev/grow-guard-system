// @ts-nocheck
import { Users, Plus, MoreHorizontal, Copy, Trash2, UserPlus, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { CrmContact } from "@/hooks/useCrmContacts";

interface CrmContactsViewListProps {
  filtered: CrmContact[];
  paginatedContacts: CrmContact[];
  page: number;
  totalPages: number;
  selectedIds: Set<string>;
  allSelected: boolean;
  someSelected: boolean;
  leadsCountByContact: Record<string, number>;
  onToggleAll: () => void;
  onToggleOne: (id: string) => void;
  onOpenEdit: (c: CrmContact) => void;
  onOpenConvertDialog: (contacts: CrmContact[]) => void;
  onDeleteContact: (id: string) => void;
  onCopyPhone: (phone: string) => void;
  onCopyEmail: (email: string) => void;
  onNewContact: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
}

export function CrmContactsViewList({
  filtered,
  paginatedContacts,
  page,
  totalPages,
  selectedIds,
  allSelected,
  someSelected,
  leadsCountByContact,
  onToggleAll,
  onToggleOne,
  onOpenEdit,
  onOpenConvertDialog,
  onDeleteContact,
  onCopyPhone,
  onCopyEmail,
  onNewContact,
  onPrevPage,
  onNextPage,
}: CrmContactsViewListProps) {
  if (filtered.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="text-sm font-medium">Nenhum contato</p>
          <p className="text-xs text-muted-foreground mt-1">Adicione contatos à sua base de dados.</p>
          <Button size="sm" className="mt-4 gap-1" onClick={onNewContact}>
            <Plus className="w-3.5 h-3.5" /> Novo Contato
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        {/* Header with select all */}
        <div className="flex items-center gap-4 px-4 py-2 border-b bg-muted/30">
          <Checkbox checked={allSelected} onCheckedChange={onToggleAll} className="shrink-0" />
          <span className="text-[10px] text-muted-foreground font-medium flex-1">
            {filtered.length} contato(s) {someSelected && `· ${selectedIds.size} selecionado(s)`}
          </span>
        </div>
        <div className="divide-y">
          {paginatedContacts.map(c => (
            <div key={c.id} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-colors group">
              <Checkbox checked={selectedIds.has(c.id)} onCheckedChange={() => onToggleOne(c.id)} onClick={e => e.stopPropagation()} className="shrink-0" />
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0 cursor-pointer" onClick={() => onOpenEdit(c)}>
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onOpenEdit(c)}>
                <p className="text-sm font-medium truncate">{c.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">{c.email || c.phone || "—"} {c.company ? `· ${c.company}` : ""}</p>
              </div>
              {c.position && <Badge variant="secondary" className="text-[9px] hidden sm:inline-flex">{c.position}</Badge>}
              {(leadsCountByContact[c.id] || 0) > 0 ? (
                <Badge className="text-[9px] bg-emerald-500/15 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20">Em negociação</Badge>
              ) : (
                <Badge variant="outline" className="text-[9px] text-muted-foreground">Sem negociação</Badge>
              )}
              {c.source && <span className="text-[10px] text-muted-foreground hidden md:inline">{c.source}</span>}

              {/* Context menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem className="text-xs gap-2" onClick={() => onOpenEdit(c)}>
                    <Users className="w-3 h-3" /> Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-xs gap-2" onClick={() => onOpenConvertDialog([c])}>
                    <UserPlus className="w-3 h-3" /> Criar Lead
                  </DropdownMenuItem>
                  {c.phone && (
                    <DropdownMenuItem className="text-xs gap-2" onClick={() => onCopyPhone(c.phone!)}>
                      <Copy className="w-3 h-3" /> Copiar telefone
                    </DropdownMenuItem>
                  )}
                  {c.email && (
                    <DropdownMenuItem className="text-xs gap-2" onClick={() => onCopyEmail(c.email!)}>
                      <Copy className="w-3 h-3" /> Copiar email
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-xs gap-2 text-destructive" onClick={() => onDeleteContact(c.id)}>
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
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1" disabled={page === 0} onClick={onPrevPage}>
                <ChevronLeft className="w-3 h-3" /> Anterior
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1" disabled={page >= totalPages - 1} onClick={onNextPage}>
                Próximo <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
