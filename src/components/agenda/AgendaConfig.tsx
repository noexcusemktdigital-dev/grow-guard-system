import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Calendar, Cloud, Lock, Plus, Trash2, Unlock, Users } from "lucide-react";
import type { CalendarConfig } from "@/types/agenda";
import { mockCalendars, mockTimeBlocks, mockAgendaUsers } from "@/data/agendaData";
import { format, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Props {
  onBack: () => void;
}

const COLORS = ["#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#14B8A6", "#EF4444", "#EC4899", "#6366F1"];

export function AgendaConfig({ onBack }: Props) {
  const { toast } = useToast();
  const [showNewColab, setShowNewColab] = useState(false);
  const [showNewBlock, setShowNewBlock] = useState(false);

  return (
    <div className="p-6 overflow-auto h-full space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 mb-2">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Button>

      {/* Meus Calendários */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Calendar className="w-4 h-4" /> Meus Calendários</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {mockCalendars.filter(c => c.nivel === "usuario" || c.nivel === "unidade").map(cal => (
            <div key={cal.id} className="flex items-center gap-4 p-3 bg-secondary/20 rounded-lg">
              <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: cal.cor }} />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{cal.nome}</div>
                <div className="text-xs text-muted-foreground capitalize">{cal.nivel}</div>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <label className="flex items-center gap-1.5"><Switch defaultChecked={cal.compartilharComUnidade} /><span>Unidade</span></label>
                <label className="flex items-center gap-1.5"><Switch defaultChecked={cal.compartilharComFranqueadora} /><span>Franqueadora</span></label>
                <label className="flex items-center gap-1.5"><Switch defaultChecked={cal.mostrarDetalhes} /><span>Detalhes</span></label>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Agendas Colaborativas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4" /> Agendas Colaborativas</CardTitle>
            <Button size="sm" variant="outline" onClick={() => setShowNewColab(!showNewColab)}><Plus className="w-3.5 h-3.5 mr-1" /> Criar</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {showNewColab && (
            <div className="p-4 border border-dashed border-border rounded-lg space-y-3">
              <div><Label>Nome</Label><Input placeholder="Nome da agenda colaborativa" /></div>
              <div>
                <Label>Cor</Label>
                <div className="flex gap-2 mt-1">{COLORS.map(c => (
                  <button key={c} className="w-6 h-6 rounded-full border-2 border-transparent hover:border-foreground transition-colors" style={{ backgroundColor: c }} />
                ))}</div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => { setShowNewColab(false); toast({ title: "Agenda criada" }); }}>Salvar</Button>
                <Button size="sm" variant="ghost" onClick={() => setShowNewColab(false)}>Cancelar</Button>
              </div>
            </div>
          )}
          {mockCalendars.filter(c => c.nivel === "colaborativa").map(cal => (
            <div key={cal.id} className="flex items-center gap-3 p-3 bg-secondary/20 rounded-lg">
              <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: cal.cor }} />
              <div className="flex-1">
                <div className="font-medium text-sm">{cal.nome}</div>
                <div className="flex gap-1 mt-1">
                  {cal.participantes?.map(p => (
                    <Badge key={p.userId} variant="secondary" className="text-[10px]">{p.nome} ({p.permissao})</Badge>
                  ))}
                </div>
              </div>
              <Button size="sm" variant="ghost" className="text-xs">Editar</Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Bloqueios de Horário */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><Lock className="w-4 h-4" /> Bloqueios de Horário</CardTitle>
            <Button size="sm" variant="outline" onClick={() => setShowNewBlock(!showNewBlock)}><Plus className="w-3.5 h-3.5 mr-1" /> Criar</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">Use bloqueios para definir sua disponibilidade para reuniões de onboarding e CS.</p>
          {showNewBlock && (
            <div className="p-4 border border-dashed border-border rounded-lg space-y-3">
              <div><Label>Título</Label><Input placeholder="Ex: Disponível para CS" /></div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Tipo</Label>
                  <Select defaultValue="disponivel">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="disponivel">Disponível</SelectItem>
                      <SelectItem value="bloqueado">Bloqueado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Início</Label><Input type="time" defaultValue="09:00" /></div>
                <div><Label>Fim</Label><Input type="time" defaultValue="12:00" /></div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => { setShowNewBlock(false); toast({ title: "Bloqueio criado" }); }}>Salvar</Button>
                <Button size="sm" variant="ghost" onClick={() => setShowNewBlock(false)}>Cancelar</Button>
              </div>
            </div>
          )}
          {mockTimeBlocks.map(block => (
            <div key={block.id} className={`flex items-center gap-3 p-3 rounded-lg border border-dashed ${
              block.tipo === "disponivel" ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300" : "bg-red-50/50 dark:bg-red-950/20 border-red-300"
            }`}>
              {block.tipo === "disponivel" ? <Unlock className="w-4 h-4 text-emerald-600" /> : <Lock className="w-4 h-4 text-red-600" />}
              <div className="flex-1">
                <div className="font-medium text-sm">{block.titulo}</div>
                <div className="text-xs text-muted-foreground">{format(parseISO(block.inicio), "HH:mm")} - {format(parseISO(block.fim), "HH:mm")} • {block.recorrencia !== "none" ? block.recorrencia : "Único"}</div>
              </div>
              <Button size="sm" variant="ghost" className="text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Google Calendar */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Cloud className="w-4 h-4" /> Google Calendar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Em breve: sincronize sua agenda com o Google Calendar.</p>
          <Button disabled className="gap-2"><Cloud className="w-4 h-4" /> Conectar Google Calendar</Button>
          <Separator />
          <div className="space-y-2 opacity-50">
            <div className="text-xs font-medium">Modo de sincronização</div>
            <div className="flex gap-3 text-xs">
              <label className="flex items-center gap-1.5"><input type="radio" disabled /> Exportar</label>
              <label className="flex items-center gap-1.5"><input type="radio" disabled /> Importar</label>
              <label className="flex items-center gap-1.5"><input type="radio" disabled checked /> 2 vias</label>
            </div>
            <div className="text-xs text-muted-foreground mt-2">Último sync: nunca</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
