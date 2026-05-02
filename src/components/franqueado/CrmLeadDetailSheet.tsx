// @ts-nocheck
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Phone, Mail, Building2, DollarSign, Calendar, Sparkles,
  ClipboardCheck, FileText, Trophy, XCircle, StickyNote,
  Clock, User, Eye, Plus,
} from "lucide-react";
import { WhatsAppPhoneButton } from "@/components/crm/WhatsAppPhoneButton";
import { useCrmLeadMutations } from "@/hooks/useCrmLeads";
import { useCrmSettings } from "@/hooks/useCrmSettings";
import { useCrmActivities } from "@/hooks/useCrmActivities";
import { useProspections } from "@/hooks/useFranqueadoProspections";
import { useStrategies } from "@/hooks/useFranqueadoStrategies";
import { useCrmProposals, type CrmProposal } from "@/hooks/useCrmProposals";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const FRANQUEADO_STAGES = [
  "Novo Lead", "Primeiro Contato", "Follow-up", "Diagnóstico",
  "Apresentação de Estratégia", "Proposta", "Venda", "Oportunidade Perdida",
];

interface LeadData {
  id: string;
  name: string;
  stage: string;
  company?: string;
  email?: string;
  phone?: string;
  value?: number;
  created_at: string;
  tags?: string[];
  [key: string]: unknown;
}

interface CrmLeadDetailSheetProps {
  lead: LeadData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activities?: Array<{ id: string; title: string; description?: string; created_at: string }>;
  notes?: Array<{ id: string; content: string; created_at: string }>;
}

export function CrmLeadDetailSheet({ lead, open, onOpenChange, activities: propActivities, notes = [] }: CrmLeadDetailSheetProps) {
  const navigate = useNavigate();
  const { updateLead, markAsWon, markAsLost } = useCrmLeadMutations();
  const { data: fetchedActivities } = useCrmActivities(lead?.id);
  const { data: prospections } = useProspections();
  const { data: strategies } = useStrategies();
  const { data: proposals } = useCrmProposals();
  const { data: crmSettings } = useCrmSettings();
  const [lostReason, setLostReason] = useState("");
  const [lostDescription, setLostDescription] = useState("");
  const [showLostDialog, setShowLostDialog] = useState(false);
  const configuredReasons: string[] = (crmSettings as Record<string, unknown>)?.loss_reasons as string[] || [
    "Preço", "Concorrência", "Timing inadequado", "Sem orçamento",
    "Sem resposta", "Escolheu outro fornecedor", "Desistiu do projeto",
  ];

  const activities = propActivities ?? fetchedActivities ?? [];
  const leadProspections = (prospections ?? []).filter(p => p.lead_id === lead?.id);
  const leadStrategies = (strategies ?? []).filter(s => s.lead_id === lead?.id);
  const leadProposals = (proposals ?? []).filter((p: { lead_id?: string }) => p.lead_id === lead?.id);

  if (!lead) return null;

  function handleStageChange(stage: string) {
    updateLead.mutate({ id: lead.id, stage }, { onSuccess: () => toast.success(`Lead movido para "${stage}"`) });
  }

  function handleWon() {
    markAsWon.mutate(lead.id, { onSuccess: () => toast.success("Lead marcado como ganho!") });
  }

  function handleLost() {
    if (!lostReason) return;
    const fullReason = lostDescription ? `${lostReason}: ${lostDescription}` : lostReason;
    markAsLost.mutate({ id: lead.id, lost_reason: fullReason }, {
      onSuccess: () => { toast.success("Lead marcado como perdido"); setShowLostDialog(false); setLostReason(""); setLostDescription(""); },
    });
  }

  const createdDate = new Date(lead.created_at).toLocaleDateString("pt-BR");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-lg">{lead.name}</SheetTitle>
          <Badge variant="outline" className="w-fit">{lead.stage}</Badge>
        </SheetHeader>

        {/* Info do Lead */}
        <div className="space-y-3 mb-4">
          {lead.company && <div className="flex items-center gap-2 text-sm"><Building2 className="w-4 h-4 text-muted-foreground" /><span>{lead.company}</span></div>}
          {lead.email && <div className="flex items-center gap-2 text-sm"><Mail className="w-4 h-4 text-muted-foreground" /><span>{lead.email}</span></div>}
          {lead.phone && <div className="flex items-center gap-2 text-sm"><Phone className="w-4 h-4 text-muted-foreground" /><span>{lead.phone}</span><WhatsAppPhoneButton phone={lead.phone} /></div>}
          {lead.value && Number(lead.value) > 0 && <div className="flex items-center gap-2 text-sm"><DollarSign className="w-4 h-4 text-muted-foreground" /><span className="font-medium">R$ {Number(lead.value).toLocaleString()}</span></div>}
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><Calendar className="w-3.5 h-3.5" /><span>Criado em {createdDate}</span></div>
        </div>

        <Separator className="my-4" />

        {/* Mover etapa */}
        <div className="space-y-2 mb-4">
          <Label className="text-xs font-medium">Mover para etapa</Label>
          <Select value={lead.stage} onValueChange={handleStageChange}>
            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>{FRANQUEADO_STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        {/* Ferramentas Integradas */}
        <div className="space-y-2 mb-4">
          <Label className="text-xs font-medium">Ferramentas</Label>
          <div className="grid grid-cols-1 gap-2">
            <Button variant="outline" size="sm" className="text-xs justify-between" onClick={() => navigate(`/franqueado/prospeccao?lead_id=${lead.id}`)}>
              <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-blue-500" /> Prospecção IA</span>
              {leadProspections.length > 0 ? <span className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-1.5 py-0.5 rounded-full">{leadProspections.length} feita(s)</span> : <span className="text-[10px] text-muted-foreground">Pendente</span>}
            </Button>
            <Button variant="outline" size="sm" className="text-xs justify-between" onClick={() => navigate(`/franqueado/estrategia?lead_id=${lead.id}`)}>
              <span className="flex items-center gap-1.5"><ClipboardCheck className="w-3.5 h-3.5 text-purple-500" /> Estratégia</span>
              {leadStrategies.length > 0 ? <span className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-1.5 py-0.5 rounded-full">{leadStrategies.length} criada(s)</span> : <span className="text-[10px] text-muted-foreground">Abrir</span>}
            </Button>
            <Button variant="outline" size="sm" className="text-xs justify-between" onClick={() => navigate(`/franqueado/propostas?lead_id=${lead.id}`)}>
              <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-orange-500" /> Proposta</span>
              {leadProposals.length > 0 ? <span className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-1.5 py-0.5 rounded-full">{leadProposals.length} proposta(s)</span> : <span className="text-[10px] text-muted-foreground">Pendente</span>}
            </Button>
          </div>
        </div>

        {/* Ações rápidas */}
        <div className="space-y-2 mb-4">
          <Label className="text-xs font-medium">Ações Rápidas</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="text-xs justify-start" onClick={handleWon} disabled={markAsWon.isPending}>
              <Trophy className="w-3.5 h-3.5 mr-1.5 text-green-500" /> Marcar Ganho
            </Button>
          </div>
        </div>

        {/* Perdido */}
        {!showLostDialog ? (
          <Button variant="ghost" size="sm" className="text-xs text-destructive w-full mb-4" onClick={() => setShowLostDialog(true)}>
            <XCircle className="w-3.5 h-3.5 mr-1.5" /> Marcar como Perdido
          </Button>
        ) : (
          <Card className="mb-4">
            <CardContent className="p-3 space-y-2">
              <Label className="text-xs font-medium">Motivo da perda *</Label>
              <Select value={lostReason} onValueChange={setLostReason}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Selecione o motivo..." /></SelectTrigger>
                <SelectContent>
                  {configuredReasons.map(r => <SelectItem key={r} value={r} className="text-sm">{r}</SelectItem>)}
                </SelectContent>
              </Select>
              <Label className="text-xs">Descrição (opcional)</Label>
              <Textarea value={lostDescription} onChange={e => setLostDescription(e.target.value)} placeholder="Detalhes adicionais..." className="text-sm" rows={2} />
              <div className="flex gap-2">
                <Button size="sm" variant="destructive" className="text-xs" onClick={handleLost} disabled={markAsLost.isPending || !lostReason}>Confirmar Perda</Button>
                <Button size="sm" variant="ghost" className="text-xs" onClick={() => setShowLostDialog(false)}>Cancelar</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Separator className="my-4" />

        {/* Tabs: Timeline, Estratégias, Propostas, Notas */}
        <Tabs defaultValue="timeline" className="mt-2">
          <TabsList className="w-full">
            <TabsTrigger value="timeline" className="flex-1 text-xs"><Clock className="w-3.5 h-3.5 mr-1" /> Timeline</TabsTrigger>
            <TabsTrigger value="estrategias" className="flex-1 text-xs"><ClipboardCheck className="w-3.5 h-3.5 mr-1" /> Estratégias</TabsTrigger>
            <TabsTrigger value="propostas" className="flex-1 text-xs"><FileText className="w-3.5 h-3.5 mr-1" /> Propostas</TabsTrigger>
            <TabsTrigger value="notes" className="flex-1 text-xs"><StickyNote className="w-3.5 h-3.5 mr-1" /> Notas</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="mt-3 space-y-2">
            {activities.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">Nenhuma atividade registrada</p>
            ) : (
              activities.map((act) => (
                <div key={act.id} className="flex items-start gap-2 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">{act.title}</p>
                    {act.description && <p className="text-muted-foreground">{act.description}</p>}
                    <p className="text-muted-foreground/60">{new Date(act.created_at).toLocaleString("pt-BR")}</p>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="estrategias" className="mt-3 space-y-2">
            {leadStrategies.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-xs text-muted-foreground mb-2">Nenhuma estratégia vinculada</p>
                <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => navigate(`/franqueado/estrategia?lead_id=${lead.id}`)}>
                  <Plus className="w-3 h-3" /> Criar Estratégia
                </Button>
              </div>
            ) : (
              leadStrategies.map(s => (
                <Card key={s.id} className="glass-card">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium">{s.title}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(s.created_at).toLocaleDateString("pt-BR")} · {s.status === "completed" ? "✓ Concluída" : s.status}</p>
                    </div>
                    <Button size="sm" variant="ghost" className="text-xs gap-1" onClick={() => navigate(`/franqueado/estrategia?strategy_id=${s.id}`)}>
                      <Eye className="w-3 h-3" /> Ver
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="propostas" className="mt-3 space-y-2">
            {leadProposals.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-xs text-muted-foreground mb-2">Nenhuma proposta vinculada</p>
                <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => navigate(`/franqueado/propostas?lead_id=${lead.id}`)}>
                  <Plus className="w-3 h-3" /> Criar Proposta
                </Button>
              </div>
            ) : (
              leadProposals.map((p: CrmProposal) => {
                const statusColors: Record<string, string> = {
                  draft: "bg-muted text-muted-foreground",
                  sent: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                  accepted: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                };
                const statusLabels: Record<string, string> = { draft: "Rascunho", sent: "Enviada", accepted: "Aceita", rejected: "Recusada" };
                return (
                  <Card key={p.id} className="glass-card">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium">{p.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-muted-foreground">{new Date(p.created_at).toLocaleDateString("pt-BR")}</span>
                          <Badge className={`text-[9px] ${statusColors[p.status] || ""}`}>{statusLabels[p.status] || p.status}</Badge>
                          {p.value && <span className="text-[10px] font-semibold text-primary">R$ {Number(p.value).toLocaleString()}</span>}
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" className="text-xs gap-1" onClick={() => navigate(`/franqueado/propostas?proposal_id=${p.id}`)}>
                        <Eye className="w-3 h-3" /> Ver
                      </Button>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="notes" className="mt-3 space-y-2">
            {notes.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">Nenhuma nota adicionada</p>
            ) : (
              notes.map((note) => (
                <Card key={note.id} className="glass-card">
                  <CardContent className="p-2">
                    <p className="text-xs">{note.content}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{new Date(note.created_at).toLocaleString("pt-BR")}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
