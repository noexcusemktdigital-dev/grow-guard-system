// @ts-nocheck
import { useState } from "react";
import {
  Phone, Clock, GripVertical, MoreHorizontal,
  MessageCircle, XCircle, Copy, Snowflake, Sun, Flame,
  AlertCircle, CalendarClock, UserRound,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { getColorStyle } from "@/components/crm/CrmStageSystem";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCrmTaskMutations } from "@/hooks/useCrmTasks";
import { useCrmOrgMembersMap } from "@/hooks/useCrmOrgMembers";
import { toast } from "sonner";

/* ===== Quick Task Popover ===== */
function QuickTaskPopover({ lead, children }: { lead: LeadRow; children: React.ReactNode }) {
  const { updateTask } = useCrmTaskMutations();
  const [open, setOpen] = useState(false);
  const pendingTasks = (lead.crm_tasks || []).filter(t => !t.completed_at && t.due_date);
  const sorted = [...pendingTasks].sort((a, b) =>
    new Date(a.due_date as string).getTime() - new Date(b.due_date as string).getTime()
  );
  const task = sorted[0];
  const initialDate = task?.due_date ? String(task.due_date).slice(0, 10) : "";
  const [dueDate, setDueDate] = useState(initialDate);

  if (!task) return <>{children}</>;
  const isSynthetic = typeof task.id === "string" && task.id.startsWith("syn-");
  if (isSynthetic) {
    // Task counts are derived from a lightweight aggregate query (performance);
    // detailed editing is available from the lead detail drawer.
    return <>{children}</>;
  }

  const handleSave = async () => {
    if (!dueDate) return;
    try {
      await updateTask.mutateAsync({ id: task.id, due_date: new Date(dueDate).toISOString() });
      toast.success("Prazo atualizado");
      setOpen(false);
    } catch {
      toast.error("Erro ao atualizar prazo");
    }
  };

  const handleComplete = async () => {
    try {
      await updateTask.mutateAsync({ id: task.id, completed_at: new Date().toISOString() });
      toast.success("Tarefa concluída");
      setOpen(false);
    } catch {
      toast.error("Erro ao concluir tarefa");
    }
  };

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (v) setDueDate(initialDate); }}>
      <PopoverTrigger asChild onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}>
        <button type="button" className="text-left w-full" onClick={(e) => { e.stopPropagation(); }}>
          {children}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 p-3 space-y-2"
        align="start"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div>
          <p className="text-[11px] font-semibold leading-tight">Tarefa rápida</p>
          <p className="text-[10px] text-muted-foreground line-clamp-2">
            {pendingTasks.length} tarefa{pendingTasks.length > 1 ? "s" : ""} pendente{pendingTasks.length > 1 ? "s" : ""}
          </p>
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Prazo</Label>
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="h-8 text-xs"
          />
        </div>
        <div className="flex gap-1.5 pt-1">
          <Button size="sm" className="h-7 text-[11px] flex-1" onClick={handleSave} disabled={updateTask.isPending || !dueDate}>
            Salvar
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-[11px] flex-1" onClick={handleComplete} disabled={updateTask.isPending}>
            Concluir
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

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
  assigned_to?: string | null;
  updated_at?: string;
  funnel_id?: string | null;
  crm_tasks?: Array<{ id: string; due_date: string | null; completed_at: string | null }> | null;
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
  const { data: membersMap } = useCrmOrgMembersMap();
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
              {(() => {
                const tasks = (lead.crm_tasks || []).filter(t => !t.completed_at && t.due_date);
                if (tasks.length === 0) return null;
                const today = new Date(); today.setHours(23, 59, 59, 999);
                const overdue = tasks.filter(t => new Date(t.due_date as string) <= today).length;
                const pending = tasks.length - overdue;
                let indicator: React.ReactNode = null;
                if (overdue > 0) {
                  indicator = (
                    <p className="text-[10px] mt-0.5 flex items-center gap-1 font-medium text-red-600 dark:text-red-400 hover:underline">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      {overdue} tarefa{overdue > 1 ? "s" : ""} atrasada{overdue > 1 ? "s" : ""}
                    </p>
                  );
                } else if (pending > 0) {
                  indicator = (
                    <p className="text-[10px] mt-0.5 flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400 hover:underline">
                      <CalendarClock className="w-3 h-3 shrink-0" />
                      {pending} tarefa{pending > 1 ? "s" : ""} pendente{pending > 1 ? "s" : ""}
                    </p>
                  );
                }
                if (!indicator) return null;
                return (
                  <div onClick={(e) => { e.stopPropagation(); e.preventDefault(); }} onPointerDown={(e) => e.stopPropagation()}>
                    <QuickTaskPopover lead={lead}>{indicator}</QuickTaskPopover>
                  </div>
                );
              })()}
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

          <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-border/40">
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(lead.created_at).toLocaleDateString("pt-BR")}
            </span>
            {lead.assigned_to && membersMap?.[lead.assigned_to] ? (
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[10px] text-muted-foreground truncate max-w-[90px]">
                  {membersMap[lead.assigned_to].name}
                </span>
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold text-primary shrink-0 overflow-hidden">
                  {membersMap[lead.assigned_to].avatar ? (
                    <img
                      src={membersMap[lead.assigned_to].avatar as string}
                      className="w-full h-full object-cover"
                      alt=""
                    />
                  ) : (
                    membersMap[lead.assigned_to].name.charAt(0).toUpperCase()
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[10px] text-muted-foreground/50">Sem responsável</span>
                <div className="w-5 h-5 rounded-full bg-muted border border-dashed border-muted-foreground/30 flex items-center justify-center shrink-0">
                  <UserRound className="w-3 h-3 text-muted-foreground/40" />
                </div>
              </div>
            )}
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
