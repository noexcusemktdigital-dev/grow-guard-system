import { useState } from "react";
import { MapPin, User, Calendar, DollarSign, AlertTriangle, Eye, ArrowRight, XCircle, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { Lead, Task, FunnelType } from "@/types/crm";
import { getStagesForFunnel } from "@/types/crm";

const tempColors: Record<string, string> = {
  Frio: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  Morno: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  Quente: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const originColors: Record<string, string> = {
  "Meta Leads": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  "Formulário": "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200",
  "WhatsApp": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  "Indicação": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  "Orgânico": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  "Eventos": "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
};

function stageHeaderColor(stage: string) {
  if (stage === "Venda") return "bg-emerald-500 text-white";
  if (stage === "Oportunidade Perdida") return "bg-red-500 text-white";
  return "bg-muted text-foreground";
}

interface CrmKanbanProps {
  leads: Lead[];
  funnel: FunnelType;
  tasks: Task[];
  onOpenLead: (id: string) => void;
  onMoveLead: (leadId: string, newStage: string) => void;
  onMarkLost: (leadId: string) => void;
  onConvert: (leadId: string) => void;
}

export function CrmKanban({ leads, funnel, tasks, onOpenLead, onMoveLead, onMarkLost, onConvert }: CrmKanbanProps) {
  const stages = getStagesForFunnel(funnel);

  return (
    <ScrollArea className="w-full">
      <div className="flex gap-4 pb-4 min-w-max">
        {stages.map((stage) => {
          const stageLeads = leads.filter((l) => l.stage === stage);
          return (
            <div key={stage} className="w-72 flex-shrink-0">
              <div className={`flex items-center justify-between px-3 py-2 rounded-t-lg text-sm font-medium ${stageHeaderColor(stage)}`}>
                <span className="truncate">{stage}</span>
                <Badge variant="secondary" className="ml-2 text-xs">{stageLeads.length}</Badge>
              </div>
              <div className="bg-muted/30 rounded-b-lg p-2 min-h-[200px] space-y-2 border border-t-0 border-border">
                {stageLeads.map((lead) => {
                  const leadTasks = tasks.filter((t) => t.leadId === lead.id);
                  const hasOverdue = leadTasks.some((t) => t.status === "Atrasada");
                  const nextTask = leadTasks.find((t) => t.status === "Aberta");
                  return (
                    <KanbanCard
                      key={lead.id}
                      lead={lead}
                      hasOverdue={hasOverdue}
                      nextTask={nextTask}
                      stages={stages}
                      onOpen={() => onOpenLead(lead.id)}
                      onMove={(s) => onMoveLead(lead.id, s)}
                      onLost={() => onMarkLost(lead.id)}
                      onConvert={() => onConvert(lead.id)}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

function KanbanCard({
  lead, hasOverdue, nextTask, stages, onOpen, onMove, onLost, onConvert,
}: {
  lead: Lead; hasOverdue: boolean; nextTask?: Task; stages: readonly string[];
  onOpen: () => void; onMove: (s: string) => void; onLost: () => void; onConvert: () => void;
}) {
  const [showMove, setShowMove] = useState(false);

  return (
    <div
      className="bg-card border border-border rounded-lg p-3 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
      onClick={onOpen}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="font-medium text-sm leading-tight">{lead.nome}</span>
        <Badge className={`text-[10px] px-1.5 py-0 ${tempColors[lead.temperature]}`}>{lead.temperature}</Badge>
      </div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1.5">
        <MapPin className="w-3 h-3" />
        <span>{lead.cidade}/{lead.uf}</span>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${originColors[lead.origin] || ""}`}>{lead.origin}</Badge>
      </div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
        <User className="w-3 h-3" /> {lead.responsavel}
      </div>
      {lead.valorPotencial && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
          <DollarSign className="w-3 h-3" /> R$ {lead.valorPotencial.toLocaleString("pt-BR")}
        </div>
      )}
      {nextTask && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
          <Calendar className="w-3 h-3" /> {new Date(nextTask.dataHora).toLocaleDateString("pt-BR")}
        </div>
      )}
      {hasOverdue && (
        <Badge className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200 text-[10px] mt-1">
          <AlertTriangle className="w-3 h-3 mr-1" /> Atrasado
        </Badge>
      )}

      {/* Actions on hover */}
      <div className="hidden group-hover:flex items-center gap-1 mt-2 pt-2 border-t border-border" onClick={(e) => e.stopPropagation()}>
        <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={onOpen}>
          <Eye className="w-3 h-3 mr-1" /> Abrir
        </Button>
        <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => setShowMove(!showMove)}>
          <ArrowRight className="w-3 h-3 mr-1" /> Mover
        </Button>
        {lead.leadStatus === "Ativo" && lead.stage !== "Oportunidade Perdida" && (
          <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-red-600" onClick={onLost}>
            <XCircle className="w-3 h-3" />
          </Button>
        )}
        {lead.leadStatus === "Ativo" && lead.stage !== "Venda" && lead.stage !== "Oportunidade Perdida" && (
          <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-emerald-600" onClick={onConvert}>
            <Trophy className="w-3 h-3" />
          </Button>
        )}
      </div>
      {showMove && (
        <div className="mt-2" onClick={(e) => e.stopPropagation()}>
          <Select onValueChange={(v) => { onMove(v); setShowMove(false); }}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder="Mover para..." />
            </SelectTrigger>
            <SelectContent>
              {stages.filter((s) => s !== lead.stage).map((s) => (
                <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
