import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Phone, Mail, Building2, DollarSign, Calendar, Sparkles,
  ClipboardCheck, FileText, Trophy, XCircle, StickyNote, ListTodo,
  Clock, ArrowRight, User,
} from "lucide-react";
import { useCrmLeadMutations } from "@/hooks/useCrmLeads";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const FRANQUEADO_STAGES = [
  "Novo Lead", "Primeiro Contato", "Follow-up", "Diagnóstico",
  "Apresentação de Estratégia", "Proposta", "Venda", "Oportunidade Perdida",
];

interface CrmLeadDetailSheetProps {
  lead: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activities?: any[];
  notes?: any[];
}

export function CrmLeadDetailSheet({ lead, open, onOpenChange, activities = [], notes = [] }: CrmLeadDetailSheetProps) {
  const navigate = useNavigate();
  const { updateLead, markAsWon, markAsLost } = useCrmLeadMutations();
  const [lostReason, setLostReason] = useState("");
  const [showLostDialog, setShowLostDialog] = useState(false);
  const [newNote, setNewNote] = useState("");

  if (!lead) return null;

  function handleStageChange(stage: string) {
    updateLead.mutate({ id: lead.id, stage }, {
      onSuccess: () => toast.success(`Lead movido para "${stage}"`),
    });
  }

  function handleWon() {
    markAsWon.mutate(lead.id, { onSuccess: () => toast.success("Lead marcado como ganho!") });
  }

  function handleLost() {
    markAsLost.mutate({ id: lead.id, lost_reason: lostReason }, {
      onSuccess: () => { toast.success("Lead marcado como perdido"); setShowLostDialog(false); setLostReason(""); },
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
          {lead.company && (
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <span>{lead.company}</span>
            </div>
          )}
          {lead.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span>{lead.email}</span>
            </div>
          )}
          {lead.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span>{lead.phone}</span>
            </div>
          )}
          {lead.value && Number(lead.value) > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">R$ {Number(lead.value).toLocaleString()}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            <span>Criado em {createdDate}</span>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Mover etapa */}
        <div className="space-y-2 mb-4">
          <Label className="text-xs font-medium">Mover para etapa</Label>
          <Select value={lead.stage} onValueChange={handleStageChange}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FRANQUEADO_STAGES.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Ações rápidas */}
        <div className="space-y-2 mb-4">
          <Label className="text-xs font-medium">Ações Rápidas</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline" size="sm" className="text-xs justify-start"
              onClick={() => navigate(`/franqueado/prospeccao?lead_id=${lead.id}`)}
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-blue-500" /> Prospecção IA
            </Button>
            <Button
              variant="outline" size="sm" className="text-xs justify-start"
              onClick={() => navigate(`/franqueado/estrategia?lead_id=${lead.id}`)}
            >
              <ClipboardCheck className="w-3.5 h-3.5 mr-1.5 text-purple-500" /> Criar Estratégia
            </Button>
            <Button
              variant="outline" size="sm" className="text-xs justify-start"
              onClick={() => navigate(`/franqueado/propostas?lead_id=${lead.id}`)}
            >
              <FileText className="w-3.5 h-3.5 mr-1.5 text-orange-500" /> Gerar Proposta
            </Button>
            <Button
              variant="outline" size="sm" className="text-xs justify-start"
              onClick={handleWon}
              disabled={markAsWon.isPending}
            >
              <Trophy className="w-3.5 h-3.5 mr-1.5 text-green-500" /> Marcar Ganho
            </Button>
          </div>
        </div>

        {/* Perdido */}
        {!showLostDialog ? (
          <Button
            variant="ghost" size="sm" className="text-xs text-destructive w-full mb-4"
            onClick={() => setShowLostDialog(true)}
          >
            <XCircle className="w-3.5 h-3.5 mr-1.5" /> Marcar como Perdido
          </Button>
        ) : (
          <Card className="mb-4">
            <CardContent className="p-3 space-y-2">
              <Label className="text-xs">Motivo da perda</Label>
              <Textarea
                value={lostReason}
                onChange={e => setLostReason(e.target.value)}
                placeholder="Descreva o motivo..."
                className="text-sm"
                rows={2}
              />
              <div className="flex gap-2">
                <Button size="sm" variant="destructive" className="text-xs" onClick={handleLost} disabled={markAsLost.isPending}>
                  Confirmar Perda
                </Button>
                <Button size="sm" variant="ghost" className="text-xs" onClick={() => setShowLostDialog(false)}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Separator className="my-4" />

        {/* Tabs: Timeline, Notas */}
        <Tabs defaultValue="timeline" className="mt-2">
          <TabsList className="w-full">
            <TabsTrigger value="timeline" className="flex-1 text-xs">
              <Clock className="w-3.5 h-3.5 mr-1" /> Timeline
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex-1 text-xs">
              <StickyNote className="w-3.5 h-3.5 mr-1" /> Notas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="mt-3 space-y-2">
            {activities.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">Nenhuma atividade registrada</p>
            ) : (
              activities.map((act: any) => (
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

          <TabsContent value="notes" className="mt-3 space-y-2">
            {notes.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">Nenhuma nota adicionada</p>
            ) : (
              notes.map((note: any) => (
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
