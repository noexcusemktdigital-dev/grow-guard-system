import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Cloud } from "lucide-react";
import type { AgendaEvent, EventParticipant, CalendarConfig } from "@/types/agenda";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onClose: () => void;
  editingEvent?: AgendaEvent | null;
  defaultDate?: Date;
  calendars: CalendarConfig[];
}

const EVENT_TYPES = ["Reunião", "CS", "Comercial", "Treinamento", "Evento", "Prazo", "Bloqueio"] as const;
const STATUSES = ["Confirmado", "Pendente", "Cancelado"] as const;
const VISIBILITIES = ["Privado", "Interno unidade", "Rede", "Colaborativo"] as const;
const RECURRENCES = [
  { value: "none", label: "Nenhuma" },
  { value: "daily", label: "Diária" },
  { value: "weekly", label: "Semanal" },
  { value: "biweekly", label: "Quinzenal" },
  { value: "monthly", label: "Mensal" },
];

export function AgendaEventForm({ open, onClose, editingEvent, defaultDate, calendars }: Props) {
  const { toast } = useToast();
  const isEditing = !!editingEvent;

  const defaultDateStr = defaultDate ? defaultDate.toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16);

  const [titulo, setTitulo] = useState(editingEvent?.titulo ?? "");
  const [descricao, setDescricao] = useState(editingEvent?.descricao ?? "");
  const [allDay, setAllDay] = useState(editingEvent?.allDay ?? false);
  const [inicio, setInicio] = useState(editingEvent?.inicio?.slice(0, 16) ?? defaultDateStr);
  const [fim, setFim] = useState(editingEvent?.fim?.slice(0, 16) ?? defaultDateStr);
  const [recorrencia, setRecorrencia] = useState(editingEvent?.recorrencia ?? "none");
  const [calendarId, setCalendarId] = useState(editingEvent?.calendarId ?? calendars[0]?.id ?? "");
  const [tipo, setTipo] = useState(editingEvent?.tipo ?? "Reunião");
  const [status, setStatus] = useState(editingEvent?.status ?? "Confirmado");
  const [visibilidade, setVisibilidade] = useState(editingEvent?.visibilidade ?? "Privado");
  const [participantes, setParticipantes] = useState<EventParticipant[]>(editingEvent?.participantes ?? []);
  const [local, setLocal] = useState(editingEvent?.local ?? "");
  const [linkMeet, setLinkMeet] = useState(editingEvent?.linkMeet ?? "");
  const [emailExterno, setEmailExterno] = useState("");

  const removeParticipant = (userId: string) => {
    setParticipantes(participantes.filter(p => p.userId !== userId));
  };

  const handleSave = () => {
    if (!titulo.trim()) {
      toast({ title: "Erro", description: "O título é obrigatório.", variant: "destructive" });
      return;
    }
    toast({ title: isEditing ? "Evento atualizado" : "Evento criado", description: `"${titulo}" salvo com sucesso.` });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Evento" : "Novo Evento"}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="text-sm font-semibold text-muted-foreground">Informações Básicas</div>
              <div>
                <Label>Título *</Label>
                <Input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Nome do evento" />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={3} placeholder="Detalhes do evento..." />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={allDay} onCheckedChange={setAllDay} />
                <Label>Dia inteiro</Label>
              </div>
              {!allDay && (
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Início</Label><Input type="datetime-local" value={inicio} onChange={e => setInicio(e.target.value)} /></div>
                  <div><Label>Fim</Label><Input type="datetime-local" value={fim} onChange={e => setFim(e.target.value)} /></div>
                </div>
              )}
              {allDay && (
                <div><Label>Data</Label><Input type="date" value={inicio.slice(0, 10)} onChange={e => { setInicio(e.target.value + "T00:00"); setFim(e.target.value + "T23:59"); }} /></div>
              )}
              <div>
                <Label>Recorrência</Label>
                <Select value={recorrencia} onValueChange={v => setRecorrencia(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{RECURRENCES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="text-sm font-semibold text-muted-foreground">Classificação</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Calendário</Label>
                  <Select value={calendarId} onValueChange={setCalendarId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{calendars.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tipo</Label>
                  <Select value={tipo} onValueChange={v => setTipo(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{EVENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={status} onValueChange={v => setStatus(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Visibilidade</Label>
                  <Select value={visibilidade} onValueChange={v => setVisibilidade(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{VISIBILITIES.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="text-sm font-semibold text-muted-foreground">Participantes</div>
              <div>
                <Label>E-mail externo (Google Calendar)</Label>
                <div className="flex gap-2">
                  <Input value={emailExterno} onChange={e => setEmailExterno(e.target.value)} placeholder="email@exemplo.com" />
                  <Button variant="outline" size="sm" disabled>Adicionar</Button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Disponível quando Google Calendar for conectado</p>
              </div>
              {participantes.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {participantes.map(p => (
                    <Badge key={p.userId} variant="secondary" className="gap-1 pr-1">
                      {p.nome}{p.unidadeNome && ` (${p.unidadeNome})`}
                      <button onClick={() => removeParticipant(p.userId)} className="ml-1 hover:text-destructive"><X className="w-3 h-3" /></button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="text-sm font-semibold text-muted-foreground">Local e Links</div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Local</Label><Input value={local} onChange={e => setLocal(e.target.value)} placeholder="Endereço ou 'Online'" /></div>
                <div><Label>Link videoconferência</Label><Input value={linkMeet} onChange={e => setLinkMeet(e.target.value)} placeholder="https://meet.google.com/..." /></div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2 bg-muted/30 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Cloud className="w-4 h-4" /> Google Calendar
              </div>
              <p className="text-xs text-muted-foreground">Conecte o Google Calendar nas configurações para sincronizar este evento.</p>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>{isEditing ? "Atualizar" : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
