import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { AgendaEvent } from "@/types/agenda";
import {
  mockEvents, getEventColor, getStatusColor, getInviteStatusColor, getLevelLabel,
  getRecurrenceLabel, mockCalendars
} from "@/data/agendaData";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, Calendar, Clock, Edit, MapPin, Repeat, Trash2, Users, Video, XCircle, Check, X, Cloud } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  eventId: string;
  onBack: () => void;
  onEdit: (event: AgendaEvent) => void;
}

export function AgendaEventDetail({ eventId, onBack, onEdit }: Props) {
  const { toast } = useToast();
  const event = mockEvents.find(e => e.id === eventId);
  if (!event) return <div className="p-6 text-muted-foreground">Evento não encontrado.</div>;

  const calendar = mockCalendars.find(c => c.id === event.calendarId);
  const pendingForMe = event.participantes.find(p => p.userId === "u-davi" && p.status === "Pendente");

  const handleInvite = (action: "Aceito" | "Recusado") => {
    toast({ title: action === "Aceito" ? "Convite aceito!" : "Convite recusado", description: `Você ${action === "Aceito" ? "aceitou" : "recusou"} o evento "${event.titulo}".` });
  };

  return (
    <div className="p-6 overflow-auto h-full space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 mb-2">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Button>

      {/* Convite pendente */}
      {pendingForMe && (
        <Card className="border-amber-300 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">Você tem um convite pendente para este evento</div>
              <div className="text-xs text-muted-foreground mt-0.5">Responda para confirmar sua participação.</div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleInvite("Aceito")}><Check className="w-4 h-4 mr-1" /> Aceitar</Button>
              <Button size="sm" variant="outline" className="text-red-600 border-red-300" onClick={() => handleInvite("Recusado")}><X className="w-4 h-4 mr-1" /> Recusar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conteúdo */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">{event.titulo}</CardTitle>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <Badge className="text-[10px]" style={{ backgroundColor: getEventColor(event.calendarId), color: "white" }}>
                  {calendar?.nome}
                </Badge>
                <Badge variant="secondary" className="text-[10px]">{event.tipo}</Badge>
                <Badge className={`text-[10px] ${getStatusColor(event.status)}`}>{event.status}</Badge>
                <Badge variant="outline" className="text-[10px]">{event.visibilidade}</Badge>
                <Badge variant="outline" className="text-[10px]">{getLevelLabel(event.nivel)}</Badge>
              </div>
            </div>
            <div className="flex gap-1.5">
              <Button size="sm" variant="outline" onClick={() => onEdit(event)}><Edit className="w-3.5 h-3.5 mr-1" /> Editar</Button>
              <Button size="sm" variant="outline" className="text-amber-600" onClick={() => toast({ title: "Evento cancelado" })}>
                <XCircle className="w-3.5 h-3.5 mr-1" /> Cancelar
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="outline" className="text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir evento?</AlertDialogTitle>
                    <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => { toast({ title: "Evento excluído" }); onBack(); }}>Excluir</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              {event.allDay ? "Dia inteiro" : `${format(parseISO(event.inicio), "dd/MM/yyyy HH:mm", { locale: ptBR })} — ${format(parseISO(event.fim), "HH:mm")}`}
            </div>
            {event.recorrencia !== "none" && (
              <div className="flex items-center gap-2">
                <Repeat className="w-4 h-4 text-muted-foreground" />
                {getRecurrenceLabel(event.recorrencia)}
              </div>
            )}
            {event.local && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" /> {event.local}
              </div>
            )}
            {event.linkMeet && (
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-muted-foreground" />
                <a href={event.linkMeet} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">{event.linkMeet}</a>
              </div>
            )}
          </div>

          {event.descricao && (
            <>
              <Separator />
              <div className="text-sm whitespace-pre-wrap">{event.descricao}</div>
            </>
          )}

          <div className="text-xs text-muted-foreground">
            Criado por {event.criadoPorNome} em {format(parseISO(event.criadoEm), "dd/MM/yyyy", { locale: ptBR })}
          </div>
        </CardContent>
      </Card>

      {/* Participantes */}
      {event.participantes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4" /> Participantes e Convites</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Respondido em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {event.participantes.map(p => (
                  <TableRow key={p.userId}>
                    <TableCell className="font-medium">{p.nome}</TableCell>
                    <TableCell>{p.unidadeNome || "—"}</TableCell>
                    <TableCell><Badge className={`text-[10px] ${getInviteStatusColor(p.status)}`}>{p.status}</Badge></TableCell>
                    <TableCell className="text-sm">{p.respondidoEm ? format(parseISO(p.respondidoEm), "dd/MM/yyyy HH:mm") : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Google Calendar placeholder */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-2">
            <Cloud className="w-4 h-4" /> Google Calendar
          </div>
          <div className="grid grid-cols-3 gap-3 text-xs text-muted-foreground">
            <div>Status: <span className="text-muted-foreground/50">Não sincronizado</span></div>
            <div>google_event_id: <span className="text-muted-foreground/50">—</span></div>
            <div>last_synced_at: <span className="text-muted-foreground/50">—</span></div>
          </div>
          <Button size="sm" variant="outline" disabled className="mt-2 text-xs">Sincronizar</Button>
        </CardContent>
      </Card>
    </div>
  );
}
