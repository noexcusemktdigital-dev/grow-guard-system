// @ts-nocheck
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Users, Plus, CircleDot } from "lucide-react";
import { DndContext, DragOverlay, pointerWithin, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { snapCenterToCursor } from "@dnd-kit/modifiers";
import { DroppableColumn, KanbanColumnContent, type LeadRow } from "./ClienteCRMKanban";
import { STAGE_ICONS, getColorStyle, type FunnelStage } from "@/components/crm/CrmStageSystem";
import type { SensorDescriptor, SensorOptions } from "@dnd-kit/core";

interface ClienteCRMLeadsViewProps {
  view: "kanban" | "list";
  allLeads: LeadRow[];
  filteredLeads: LeadRow[];
  stages: FunnelStage[];
  leadsByStage: Record<string, LeadRow[]>;
  stageValues: Record<string, number>;
  totalPipelineValue: number;
  selectionMode: boolean;
  selectedLeadIds: Set<string>;
  toggleLeadSelection: (id: string) => void;
  toggleAllLeads: () => void;
  setSelectedLead: (lead: LeadRow) => void;
  setNewLeadOpen: (v: boolean) => void;
  draggingId: string | null;
  setDraggingId: (id: string | null) => void;
  sensors: ReturnType<typeof import("@dnd-kit/core").useSensors>;
  handleDragStart: (e: DragStartEvent) => void;
  handleDragEnd: (e: DragEndEvent) => void;
  setSelectedLeadIds: (ids: Set<string>) => void;
  onCopyPhone: (lead: LeadRow) => void;
  onMarkLost: (lead: LeadRow) => void;
  onDelete: (lead: LeadRow) => void;
  onUpdateTemperature: (lead: LeadRow, temp: string) => void;
}

export function ClienteCRMLeadsView({
  view,
  allLeads,
  filteredLeads,
  stages,
  leadsByStage,
  stageValues,
  totalPipelineValue,
  selectionMode,
  selectedLeadIds,
  toggleLeadSelection,
  toggleAllLeads,
  setSelectedLead,
  setNewLeadOpen,
  draggingId,
  sensors,
  handleDragStart,
  handleDragEnd,
  setSelectedLeadIds,
  onCopyPhone,
  onMarkLost,
  onDelete,
  onUpdateTemperature,
}: ClienteCRMLeadsViewProps) {
  const draggingLead = draggingId ? allLeads.find(l => l.id === draggingId) : null;

  if (allLeads.length === 0 && stages.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="text-sm font-medium">Nenhum lead cadastrado</p>
          <p className="text-xs text-muted-foreground mt-1">Adicione leads para começar a gerenciar suas vendas.</p>
          <Button size="sm" className="mt-4 gap-1" onClick={() => setNewLeadOpen(true)}>
            <Plus className="w-3.5 h-3.5" /> Novo Lead
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (view === "kanban") {
    return (
      <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4" data-tour="kanban">
          {stages.map(stage => {
            const stageLeads = leadsByStage[stage.key] || [];
            const colorStyle = getColorStyle(stage.color);
            return (
              <div key={stage.key} className="min-w-[260px] max-w-[280px] flex-shrink-0 flex flex-col">
                <div className={`px-3 py-2 rounded-t-xl border-b-2 ${colorStyle.border} bg-gradient-to-r ${colorStyle.gradient}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-md ${colorStyle.light} flex items-center justify-center ${colorStyle.text}`}>
                      {STAGE_ICONS[stage.icon] || <CircleDot className="w-3.5 h-3.5" />}
                    </div>
                    <span className="text-xs font-semibold flex-1">{stage.label}</span>
                    {selectionMode && stageLeads.length > 0 && (
                      <Checkbox
                        className="w-3.5 h-3.5"
                        checked={stageLeads.every(l => selectedLeadIds.has(l.id))}
                        onCheckedChange={() => {
                          const ids = stageLeads.map(l => l.id);
                          const allSelected = ids.every(id => selectedLeadIds.has(id));
                          const next = new Set(selectedLeadIds);
                          if (allSelected) ids.forEach(id => next.delete(id));
                          else ids.forEach(id => next.add(id));
                          setSelectedLeadIds(next);
                        }}
                      />
                    )}
                    <Badge variant="outline" className="text-[9px] h-5">{stageLeads.length}</Badge>
                  </div>
                  {(stageValues[stage.key] > 0 || totalPipelineValue > 0) && (
                    <div className="mt-1.5 space-y-1">
                      <span className="text-[10px] font-bold text-primary">
                        R$ {stageValues[stage.key].toLocaleString("pt-BR")}
                      </span>
                      {totalPipelineValue > 0 && (
                        <Progress
                          value={(stageValues[stage.key] / totalPipelineValue) * 100}
                          className="h-1"
                        />
                      )}
                    </div>
                  )}
                </div>
                <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
                  <DroppableColumn stageKey={stage.key}>
                    <KanbanColumnContent
                      stageLeads={stageLeads}
                      stageColor={stage.color}
                      selectionMode={selectionMode}
                      selectedLeadIds={selectedLeadIds}
                      toggleLeadSelection={toggleLeadSelection}
                      onClickLead={(lead) => setSelectedLead(lead)}
                      onCopyPhone={onCopyPhone}
                      onMarkLost={onMarkLost}
                      onDelete={onDelete}
                      onUpdateTemperature={onUpdateTemperature}
                    />
                  </DroppableColumn>
                </div>
              </div>
            );
          })}
        </div>
        <DragOverlay dropAnimation={null} zIndex={100} modifiers={[snapCenterToCursor]}>
          {draggingLead && (
            <Card className="shadow-xl border-primary/30 w-[260px]">
              <CardContent className="p-3">
                <p className="text-sm font-semibold">{draggingLead.name}</p>
                <p className="text-xs text-muted-foreground">{draggingLead.phone}</p>
              </CardContent>
            </Card>
          )}
        </DragOverlay>
      </DndContext>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex items-center gap-4 px-4 py-2 border-b bg-muted/30">
          <Checkbox checked={filteredLeads.length > 0 && filteredLeads.every(l => selectedLeadIds.has(l.id))} onCheckedChange={toggleAllLeads} />
          <span className="text-[10px] text-muted-foreground font-medium">Selecionar todos</span>
        </div>
        <div className="divide-y">
          {filteredLeads.map(lead => {
            const stage = stages.find(s => s.key === lead.stage);
            const colorStyle = stage ? getColorStyle(stage.color) : getColorStyle("blue");
            return (
              <div
                key={lead.id}
                className="flex items-center gap-4 px-4 py-3 hover:bg-muted/30 cursor-pointer transition-colors"
                onClick={() => setSelectedLead(lead)}
              >
                <Checkbox checked={selectedLeadIds.has(lead.id)} onCheckedChange={() => toggleLeadSelection(lead.id)} onClick={e => e.stopPropagation()} />
                <div className={`w-2.5 h-2.5 rounded-full ${colorStyle.dot}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{lead.name}</p>
                  <p className="text-[11px] text-muted-foreground">{lead.email || lead.phone || "—"}</p>
                </div>
                <Badge variant="outline" className={`text-[9px] ${colorStyle.text} ${colorStyle.border}`}>
                  {stage?.label || lead.stage}
                </Badge>
                <span className="text-sm font-semibold text-primary whitespace-nowrap">
                  {lead.value ? `R$ ${Number(lead.value).toLocaleString("pt-BR")}` : "—"}
                </span>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {new Date(lead.created_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
