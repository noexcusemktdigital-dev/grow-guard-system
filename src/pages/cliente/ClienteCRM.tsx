import { useState, useMemo } from "react";
import { Users, Plus, Phone, Mail, ThermometerSun, Search, LayoutGrid, List } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getCrmLeads, type CrmLead } from "@/data/clienteData";
import { DndContext, DragOverlay, closestCorners, type DragEndEvent, type DragStartEvent, useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const stages = [
  { key: "novo", label: "Novo Lead", color: "bg-blue-500" },
  { key: "contato", label: "Contato", color: "bg-yellow-500" },
  { key: "proposta", label: "Proposta", color: "bg-purple-500" },
  { key: "fechado", label: "Fechado", color: "bg-emerald-500" },
  { key: "perdido", label: "Perdido", color: "bg-destructive" },
] as const;

const tempColors: Record<string, string> = {
  Quente: "text-destructive bg-destructive/10",
  Morno: "text-yellow-500 bg-yellow-500/10",
  Frio: "text-blue-400 bg-blue-400/10",
};

function DroppableColumn({ stageKey, children }: { stageKey: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: stageKey });
  return (
    <div ref={setNodeRef} className={`min-h-[100px] space-y-2 pr-1 transition-colors rounded-lg ${isOver ? "bg-primary/5" : ""}`}>
      {children}
    </div>
  );
}

function DraggableLeadCard({ lead, onClick }: { lead: CrmLead; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lead.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="cursor-grab active:cursor-grabbing hover:shadow-md transition-all hover:-translate-y-0.5" onClick={onClick}>
        <CardContent className="p-3">
          <p className="text-sm font-medium">{lead.name}</p>
          <p className="text-xs text-muted-foreground">{lead.phone}</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs font-bold text-primary">R$ {lead.value.toLocaleString()}</span>
            <Badge className={`text-[9px] ${tempColors[lead.temperature]}`}>{lead.temperature}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ClienteCRM() {
  const [leads, setLeads] = useState<CrmLead[]>(() => getCrmLeads());
  const [selected, setSelected] = useState<CrmLead | null>(null);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [activeId, setActiveId] = useState<string | null>(null);

  const filteredLeads = useMemo(() => {
    if (!search.trim()) return leads;
    const q = search.toLowerCase();
    return leads.filter(l => l.name.toLowerCase().includes(q) || l.phone.includes(q) || l.email.toLowerCase().includes(q));
  }, [leads, search]);

  const activeLead = activeId ? leads.find(l => l.id === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const targetStage = stages.find(s => s.key === over.id)?.key;
    if (targetStage) {
      setLeads(prev => prev.map(l => l.id === active.id ? { ...l, stage: targetStage } : l));
    }
  };

  if (selected) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader title="CRM" subtitle="Funil de vendas da empresa" icon={<Users className="w-5 h-5 text-primary" />} />
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{selected.name}</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setSelected(null)}>Voltar ao funil</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><p className="text-xs text-muted-foreground">Telefone</p><p className="text-sm font-medium flex items-center gap-1"><Phone className="w-3 h-3" /> {selected.phone}</p></div>
              <div><p className="text-xs text-muted-foreground">E-mail</p><p className="text-sm font-medium flex items-center gap-1"><Mail className="w-3 h-3" /> {selected.email}</p></div>
              <div><p className="text-xs text-muted-foreground">Valor</p><p className="text-sm font-bold text-primary">R$ {selected.value.toLocaleString()}</p></div>
              <div><p className="text-xs text-muted-foreground">Temperatura</p><Badge className={`text-[10px] ${tempColors[selected.temperature]}`}><ThermometerSun className="w-3 h-3 mr-1" />{selected.temperature}</Badge></div>
            </div>
            <div><p className="text-xs text-muted-foreground mb-1">Observações</p><p className="text-sm bg-muted/30 p-3 rounded-lg">{selected.notes}</p></div>
            <div><p className="text-xs text-muted-foreground">Responsável: {selected.responsible} · Criado em {selected.createdAt}</p></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="CRM"
        subtitle="Funil de vendas da empresa"
        icon={<Users className="w-5 h-5 text-primary" />}
        actions={<Button size="sm"><Plus className="w-4 h-4 mr-1" /> Novo Lead</Button>}
      />

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar lead..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex border rounded-lg overflow-hidden">
          <Button variant={viewMode === "kanban" ? "default" : "ghost"} size="sm" className="rounded-none" onClick={() => setViewMode("kanban")}>
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button variant={viewMode === "list" ? "default" : "ghost"} size="sm" className="rounded-none" onClick={() => setViewMode("list")}>
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {viewMode === "kanban" ? (
        <DndContext collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {stages.map(stage => {
              const stageLeads = filteredLeads.filter(l => l.stage === stage.key);
              const total = stageLeads.reduce((s, l) => s + l.value, 0);
              return (
                <div key={stage.key} className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-2 h-2 rounded-full ${stage.color}`} />
                    <span className="text-xs font-semibold uppercase tracking-wider">{stage.label}</span>
                    <Badge variant="outline" className="text-[9px] ml-auto">{stageLeads.length}</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-medium">R$ {total.toLocaleString()}</p>
                  <ScrollArea className="h-[calc(100vh-340px)]">
                    <DroppableColumn stageKey={stage.key}>
                      {stageLeads.length === 0 ? (
                        <div className="border-2 border-dashed border-muted rounded-lg p-4 text-center">
                          <p className="text-[10px] text-muted-foreground">Arraste leads aqui</p>
                        </div>
                      ) : (
                        stageLeads.map(lead => (
                          <DraggableLeadCard key={lead.id} lead={lead} onClick={() => setSelected(lead)} />
                        ))
                      )}
                    </DroppableColumn>
                  </ScrollArea>
                </div>
              );
            })}
          </div>
          <DragOverlay>
            {activeLead && (
              <Card className="rotate-3 scale-105 shadow-xl">
                <CardContent className="p-3">
                  <p className="text-sm font-medium">{activeLead.name}</p>
                  <p className="text-xs text-muted-foreground">{activeLead.phone}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs font-bold text-primary">R$ {activeLead.value.toLocaleString()}</span>
                    <Badge className={`text-[9px] ${tempColors[activeLead.temperature]}`}>{activeLead.temperature}</Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </DragOverlay>
        </DndContext>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left text-xs font-semibold p-3 text-muted-foreground">Nome</th>
                  <th className="text-left text-xs font-semibold p-3 text-muted-foreground">Telefone</th>
                  <th className="text-left text-xs font-semibold p-3 text-muted-foreground">Etapa</th>
                  <th className="text-left text-xs font-semibold p-3 text-muted-foreground">Valor</th>
                  <th className="text-left text-xs font-semibold p-3 text-muted-foreground">Temp.</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map(lead => (
                  <tr key={lead.id} className="border-b hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => setSelected(lead)}>
                    <td className="p-3 text-sm font-medium">{lead.name}</td>
                    <td className="p-3 text-sm text-muted-foreground">{lead.phone}</td>
                    <td className="p-3"><Badge variant="outline" className="text-[10px]">{stages.find(s => s.key === lead.stage)?.label}</Badge></td>
                    <td className="p-3 text-sm font-bold text-primary">R$ {lead.value.toLocaleString()}</td>
                    <td className="p-3"><Badge className={`text-[9px] ${tempColors[lead.temperature]}`}>{lead.temperature}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
