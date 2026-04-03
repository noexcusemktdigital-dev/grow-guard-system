import { useState } from "react";
import {
  Phone, Clock, GripVertical, MoreHorizontal,
  MessageCircle, XCircle, Copy, Snowflake, Sun, Flame,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { getColorStyle } from "@/components/crm/CrmStageSystem";

/* ===== Lead Card Row Type ===== */
export interface LeadRow {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  company: string | null;
  value: number | null;
  stage: string;
  source: string | null;
  tags: string[] | null;
  created_at: string;
  won_at?: string | null;
  lost_at?: string | null;
  lost_reason?: string | null;
  whatsapp_contact_id?: string | null;
  [key: string]: unknown;
}

/* ===== Droppable Column ===== */
export function DroppableColumn({ stageKey, children }: { stageKey: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: stageKey });
  return (
    <div ref={setNodeRef} className={`min-h-[80px] space-y-2 transition-all duration-200 rounded-lg p-1.5 ${isOver ? "bg-primary/5 ring-2 ring-primary/20 ring-dashed" : ""}`}>
      {children}
    </div>
  );
}

/* ===== Draggable Lead Card ===== */
export function DraggableLeadCard({ lead, onClick, stageColor, onCopyPhone, onMarkLost, onDelete, onUpdateTemperature }: {
  lead: LeadRow;
  onClick: () => void;
  stageColor: string;
  onCopyPhone: () => void;
  onMarkLost: () => void;
  onDelete: () => void;
  onUpdateTemperature: (temp: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id });
  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 50 : undefined,
  };
  const colorStyle = getColorStyle(stageColor);
  const isWon = !!lead.won_at;
  const isLost = !!lead.lost_at;
  const statusBorder = isWon ? "border-l-emerald-500" : isLost ? "border-l-red-500" : colorStyle.border;
  const statusBg = isWon ? "bg-emerald-50/50 dark:bg-emerald-950/20" : isLost ? "bg-red-50/50 dark:bg-red-950/20" : "";

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={`group touch-none ${isDragging ? "pointer-events-none" : ""}`}>
      <Card
        className={`cursor-pointer hover:shadow-md transition-all duration-150 hover:-translate-y-0.5 border-l-[3px] ${statusBorder} ${statusBg}`}
        onClick={() => { if (!isDragging) onClick(); }}
      >
        <CardContent className="p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="cursor-grab active:cursor-grabbing pt-0.5 -ml-1 px-1">
              <GripVertical className="w-3.5 h-3.5 text-muted-foreground/50" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold truncate leading-tight">{lead.name}</p>
              {lead.phone && (
                <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3 shrink-0" /> {lead.phone}
                </p>
              )}
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => { e.stopPropagation(); e.preventDefault(); }}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" aria-label="Mais opções"><MoreHorizontal className="w-3.5 h-3.5" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-36" align="end">
                  <DropdownMenuItem className="text-xs gap-2" onClick={onCopyPhone}>
                    <Copy className="w-3 h-3" /> Copiar telefone
                  </DropdownMenuItem>
                  {lead.phone && (
                    <DropdownMenuItem className="text-xs gap-2" asChild>
                      <a href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="w-3 h-3" /> WhatsApp
                      </a>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem className="text-xs gap-2 text-destructive" onClick={onMarkLost}>
                    <XCircle className="w-3 h-3" /> Marcar perdido
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {(isWon || isLost) && (
            <Badge variant="outline" className={`text-[8px] px-1.5 py-0 font-medium ${isWon ? "border-emerald-300 text-emerald-600 dark:border-emerald-700 dark:text-emerald-400" : "border-red-300 text-red-600 dark:border-red-700 dark:text-red-400"}`}>
              {isWon ? "✓ Vendido" : "✕ Perdido"}
            </Badge>
          )}

          <div className="flex items-center justify-between">
            <span className="text-[13px] font-bold text-primary">
              {lead.value ? `R$ ${Number(lead.value).toLocaleString("pt-BR")}` : "—"}
            </span>
            <div className="flex items-center gap-1">
              <div onClick={e => e.stopPropagation()}>
                {(() => {
                  const temps = ["Frio", "Morno", "Quente"] as const;
                  const current = ((lead as Record<string, unknown>).temperature as string) || "Morno";
                  const idx = temps.indexOf(current as typeof temps[number]);
                  const next = temps[(idx + 1) % temps.length];
                  const cfg: Record<string, { bg: string; icon: React.ReactNode }> = {
                    Frio: { bg: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400", icon: <Snowflake className="w-3 h-3" /> },
                    Morno: { bg: "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400", icon: <Sun className="w-3 h-3" /> },
                    Quente: { bg: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400", icon: <Flame className="w-3 h-3" /> },
                  };
                  const c = cfg[current];
                  return (
                    <button
                      title={`${current} → ${next}`}
                      onClick={() => onUpdateTemperature(next)}
                      className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors duration-150 ${c.bg} hover:brightness-90`}
                    >
                      {c.icon}
                    </button>
                  );
                })()}
              </div>
              {lead.source && (
                <Badge variant="secondary" className="text-[8px] px-1.5 py-0 font-normal">{lead.source}</Badge>
              )}
            </div>
          </div>

          {lead.tags && lead.tags.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              {lead.tags.slice(0, 2).map(tag => (
                <Badge key={tag} variant="outline" className="text-[8px] px-1 py-0 font-normal">{tag}</Badge>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 pt-1.5 border-t border-border/40">
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(lead.created_at).toLocaleDateString("pt-BR")}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const KANBAN_INITIAL_VISIBLE = 20;
const KANBAN_LOAD_MORE = 20;

/* ===== Kanban Column with Lazy Loading ===== */
export function KanbanColumnContent({
  stageLeads, stageColor, selectionMode, selectedLeadIds, toggleLeadSelection,
  onClickLead, onCopyPhone, onMarkLost, onDelete, onUpdateTemperature,
}: {
  stageLeads: LeadRow[];
  stageColor: string;
  selectionMode: boolean;
  selectedLeadIds: Set<string>;
  toggleLeadSelection: (id: string) => void;
  onClickLead: (lead: LeadRow) => void;
  onCopyPhone: (lead: LeadRow) => void;
  onMarkLost: (lead: LeadRow) => void;
  onDelete: (lead: LeadRow) => void;
  onUpdateTemperature: (lead: LeadRow, temp: string) => void;
}) {
  const [visibleCount, setVisibleCount] = useState(KANBAN_INITIAL_VISIBLE);
  const visibleLeads = stageLeads.slice(0, visibleCount);
  const hasMore = stageLeads.length > visibleCount;

  return (
    <>
      {visibleLeads.map(lead => (
        <div key={lead.id} className="relative group/check">
          {selectionMode && (
            <div className="absolute top-2 right-2 z-10" onClick={e => e.stopPropagation()}>
              <Checkbox checked={selectedLeadIds.has(lead.id)} onCheckedChange={() => toggleLeadSelection(lead.id)} />
            </div>
          )}
          <DraggableLeadCard
            lead={lead}
            onClick={() => onClickLead(lead)}
            stageColor={stageColor}
            onCopyPhone={() => onCopyPhone(lead)}
            onMarkLost={() => onMarkLost(lead)}
            onDelete={() => onDelete(lead)}
            onUpdateTemperature={(temp) => onUpdateTemperature(lead, temp)}
          />
        </div>
      ))}
      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs text-muted-foreground h-7"
          onClick={() => setVisibleCount(c => c + KANBAN_LOAD_MORE)}
        >
          Ver mais {stageLeads.length - visibleCount} leads
        </Button>
      )}
      {stageLeads.length === 0 && (
        <div className="text-center py-8 text-[11px] text-muted-foreground/50">
          Arraste leads aqui
        </div>
      )}
    </>
  );
}
