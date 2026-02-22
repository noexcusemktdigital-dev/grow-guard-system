import { useState } from "react";
import {
  Phone, Mail, Building2, DollarSign, Tag, Clock, CheckCircle, XCircle,
  MessageCircle, ExternalLink, CircleDot, Plus, Trash2, CalendarDays,
  PhoneCall, Video, Send, StickyNote, AlertTriangle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useCrmLeadMutations } from "@/hooks/useCrmLeads";
import { useCrmActivities, useCrmActivityMutations } from "@/hooks/useCrmActivities";
import { useCrmTasks, useCrmTaskMutations } from "@/hooks/useCrmTasks";
import { useToast } from "@/hooks/use-toast";
import type { FunnelStage } from "./CrmStageSystem";
import { STAGE_ICONS, getColorStyle } from "./CrmStageSystem";

interface LeadRow {
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
}

interface CrmLeadDetailSheetProps {
  lead: LeadRow | null;
  onClose: () => void;
  stages: FunnelStage[];
}

const ACTIVITY_TYPES = [
  { value: "call", label: "Ligação", icon: <PhoneCall className="w-3.5 h-3.5" /> },
  { value: "whatsapp", label: "WhatsApp", icon: <MessageCircle className="w-3.5 h-3.5" /> },
  { value: "meeting", label: "Reunião", icon: <Video className="w-3.5 h-3.5" /> },
  { value: "email", label: "E-mail", icon: <Send className="w-3.5 h-3.5" /> },
  { value: "note", label: "Nota", icon: <StickyNote className="w-3.5 h-3.5" /> },
];

export function CrmLeadDetailSheet({ lead, onClose, stages }: CrmLeadDetailSheetProps) {
  return (
    <Sheet open={!!lead} onOpenChange={open => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{lead?.name}</SheetTitle>
        </SheetHeader>
        {lead && <LeadDetailTabs lead={lead} stages={stages} />}
      </SheetContent>
    </Sheet>
  );
}

function LeadDetailTabs({ lead, stages }: { lead: LeadRow; stages: FunnelStage[] }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { updateLead, markAsWon, markAsLost } = useCrmLeadMutations();
  const { data: activities } = useCrmActivities(lead.id);
  const { createActivity } = useCrmActivityMutations();
  const { data: tasks } = useCrmTasks(lead.id);
  const { createTask, updateTask, deleteTask } = useCrmTaskMutations();

  const [editName, setEditName] = useState(lead.name);
  const [editPhone, setEditPhone] = useState(lead.phone || "");
  const [editEmail, setEditEmail] = useState(lead.email || "");
  const [editCompany, setEditCompany] = useState(lead.company || "");
  const [editValue, setEditValue] = useState(lead.value?.toString() || "");
  const [editStage, setEditStage] = useState(lead.stage);
  const [newTag, setNewTag] = useState("");
  const [editTags, setEditTags] = useState<string[]>(lead.tags || []);

  const [lostDialog, setLostDialog] = useState(false);
  const [lostReason, setLostReason] = useState("");

  // Activity form
  const [actType, setActType] = useState("note");
  const [actTitle, setActTitle] = useState("");
  const [actDesc, setActDesc] = useState("");

  // Task form
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [taskPriority, setTaskPriority] = useState("medium");

  const stage = stages.find(s => s.key === lead.stage);
  const whatsappContactId = (lead as any).whatsapp_contact_id;

  const handleSave = () => {
    updateLead.mutate({
      id: lead.id,
      name: editName,
      phone: editPhone || null,
      email: editEmail || null,
      company: editCompany || null,
      value: editValue ? parseFloat(editValue) : null,
      stage: editStage,
      tags: editTags,
    });
    toast({ title: "Lead atualizado" });
  };

  const handleAddTag = () => {
    if (newTag.trim() && !editTags.includes(newTag.trim())) {
      setEditTags([...editTags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleCreateActivity = () => {
    if (!actTitle.trim()) return;
    createActivity.mutate({ lead_id: lead.id, type: actType, title: actTitle, description: actDesc || undefined });
    setActTitle(""); setActDesc("");
    toast({ title: "Atividade registrada" });
  };

  const handleCreateTask = () => {
    if (!taskTitle.trim()) return;
    createTask.mutate({ lead_id: lead.id, title: taskTitle, due_date: taskDue || undefined, priority: taskPriority });
    setTaskTitle(""); setTaskDue("");
    toast({ title: "Tarefa criada" });
  };

  const handleMarkLost = () => {
    markAsLost.mutate({ id: lead.id, lost_reason: lostReason || undefined });
    setLostDialog(false);
    toast({ title: "Lead marcado como perdido" });
  };

  return (
    <div className="space-y-4 mt-4">
      <Tabs defaultValue="info" className="w-full">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="info" className="text-xs">Dados</TabsTrigger>
          <TabsTrigger value="activities" className="text-xs">Atividades</TabsTrigger>
          <TabsTrigger value="tasks" className="text-xs">Tarefas</TabsTrigger>
          <TabsTrigger value="whatsapp" className="text-xs gap-1">
            <MessageCircle className="w-3 h-3" /> WhatsApp
          </TabsTrigger>
        </TabsList>

        {/* === INFO TAB === */}
        <TabsContent value="info" className="space-y-3 mt-3">
          {stage && (
            <Badge variant="outline" className={`text-xs ${getColorStyle(stage.color).text} ${getColorStyle(stage.color).border}`}>
              {STAGE_ICONS[stage.icon] || <CircleDot className="w-3 h-3" />}
              <span className="ml-1">{stage.label}</span>
            </Badge>
          )}

          {(lead.won_at || lead.lost_at) && (
            <div className={`p-3 rounded-lg border ${lead.won_at ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20"}`}>
              <p className="text-xs font-medium flex items-center gap-1.5">
                {lead.won_at ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <XCircle className="w-3.5 h-3.5 text-red-500" />}
                {lead.won_at ? "Venda realizada" : "Oportunidade perdida"}
              </p>
              {lead.lost_reason && <p className="text-[11px] text-muted-foreground mt-1">Motivo: {lead.lost_reason}</p>}
            </div>
          )}

          <div className="space-y-2">
            <div><Label className="text-xs">Nome</Label><Input value={editName} onChange={e => setEditName(e.target.value)} className="h-8 text-sm" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs">Telefone</Label><Input value={editPhone} onChange={e => setEditPhone(e.target.value)} className="h-8 text-sm" /></div>
              <div><Label className="text-xs">E-mail</Label><Input value={editEmail} onChange={e => setEditEmail(e.target.value)} className="h-8 text-sm" /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs">Empresa</Label><Input value={editCompany} onChange={e => setEditCompany(e.target.value)} className="h-8 text-sm" /></div>
              <div><Label className="text-xs">Valor (R$)</Label><Input type="number" value={editValue} onChange={e => setEditValue(e.target.value)} className="h-8 text-sm" /></div>
            </div>
            <div>
              <Label className="text-xs">Etapa</Label>
              <Select value={editStage} onValueChange={setEditStage}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {stages.map(s => (
                    <SelectItem key={s.key} value={s.key} className="text-sm">{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <Label className="text-xs">Tags</Label>
            <div className="flex flex-wrap gap-1 mt-1">
              {editTags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs gap-1">
                  {tag}
                  <button onClick={() => setEditTags(editTags.filter(t => t !== tag))} className="hover:text-destructive">
                    <XCircle className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-1 mt-1">
              <Input value={newTag} onChange={e => setNewTag(e.target.value)} placeholder="Nova tag..." className="h-7 text-xs" onKeyDown={e => e.key === "Enter" && handleAddTag()} />
              <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={handleAddTag}><Plus className="w-3 h-3" /></Button>
            </div>
          </div>

          <Button size="sm" className="w-full" onClick={handleSave}>Salvar alterações</Button>

          <Separator />

          {!lead.won_at && !lead.lost_at && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1 text-xs gap-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => { markAsWon.mutate(lead.id); toast({ title: "Lead marcado como vendido!" }); }}>
                <CheckCircle className="w-3.5 h-3.5" /> Vendido
              </Button>
              <Button size="sm" variant="outline" className="flex-1 text-xs gap-1 text-red-600 border-red-200 hover:bg-red-50" onClick={() => setLostDialog(true)}>
                <XCircle className="w-3.5 h-3.5" /> Perdido
              </Button>
            </div>
          )}

          <div className="p-3 rounded-lg border">
            <p className="text-[10px] text-muted-foreground uppercase">Criado em</p>
            <p className="text-sm">{new Date(lead.created_at).toLocaleDateString("pt-BR")}</p>
          </div>
        </TabsContent>

        {/* === ACTIVITIES TAB === */}
        <TabsContent value="activities" className="space-y-3 mt-3">
          <div className="space-y-2 p-3 rounded-lg border bg-muted/30">
            <p className="text-xs font-semibold">Registrar atividade</p>
            <Select value={actType} onValueChange={setActType}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ACTIVITY_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input value={actTitle} onChange={e => setActTitle(e.target.value)} placeholder="Título..." className="h-8 text-xs" />
            <Textarea value={actDesc} onChange={e => setActDesc(e.target.value)} placeholder="Descrição (opcional)..." className="text-xs min-h-[60px]" />
            <Button size="sm" className="w-full text-xs" onClick={handleCreateActivity} disabled={!actTitle.trim()}>
              <Plus className="w-3 h-3 mr-1" /> Registrar
            </Button>
          </div>

          <Separator />

          {(!activities || activities.length === 0) ? (
            <div className="text-center py-6">
              <Clock className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Nenhuma atividade registrada</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activities.map(act => {
                const typeInfo = ACTIVITY_TYPES.find(t => t.value === act.type) || ACTIVITY_TYPES[4];
                return (
                  <div key={act.id} className="p-3 rounded-lg border flex gap-3">
                    <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      {typeInfo.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium">{act.title}</p>
                      {act.description && <p className="text-[11px] text-muted-foreground mt-0.5">{act.description}</p>}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(act.created_at).toLocaleDateString("pt-BR")} · {new Date(act.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* === TASKS TAB === */}
        <TabsContent value="tasks" className="space-y-3 mt-3">
          <div className="space-y-2 p-3 rounded-lg border bg-muted/30">
            <p className="text-xs font-semibold">Nova tarefa</p>
            <Input value={taskTitle} onChange={e => setTaskTitle(e.target.value)} placeholder="Título da tarefa..." className="h-8 text-xs" />
            <div className="grid grid-cols-2 gap-2">
              <Input type="date" value={taskDue} onChange={e => setTaskDue(e.target.value)} className="h-8 text-xs" />
              <Select value={taskPriority} onValueChange={setTaskPriority}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low" className="text-xs">Baixa</SelectItem>
                  <SelectItem value="medium" className="text-xs">Média</SelectItem>
                  <SelectItem value="high" className="text-xs">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" className="w-full text-xs" onClick={handleCreateTask} disabled={!taskTitle.trim()}>
              <Plus className="w-3 h-3 mr-1" /> Criar tarefa
            </Button>
          </div>

          <Separator />

          {(!tasks || tasks.length === 0) ? (
            <div className="text-center py-6">
              <CalendarDays className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Nenhuma tarefa</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map(task => {
                const isOverdue = task.due_date && !task.completed_at && new Date(task.due_date) < new Date();
                const priorityColor = task.priority === "high" ? "text-red-500" : task.priority === "medium" ? "text-amber-500" : "text-blue-500";
                return (
                  <div key={task.id} className={`p-3 rounded-lg border flex items-start gap-3 ${isOverdue ? "border-red-300 bg-red-500/5" : ""}`}>
                    <Checkbox
                      checked={!!task.completed_at}
                      onCheckedChange={checked => {
                        updateTask.mutate({ id: task.id, completed_at: checked ? new Date().toISOString() : null });
                      }}
                      className="mt-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-medium ${task.completed_at ? "line-through text-muted-foreground" : ""}`}>{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {task.due_date && (
                          <span className={`text-[10px] flex items-center gap-0.5 ${isOverdue ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
                            {isOverdue && <AlertTriangle className="w-3 h-3" />}
                            <CalendarDays className="w-3 h-3" />
                            {new Date(task.due_date).toLocaleDateString("pt-BR")}
                          </span>
                        )}
                        <Badge variant="outline" className={`text-[8px] ${priorityColor}`}>
                          {task.priority === "high" ? "Alta" : task.priority === "medium" ? "Média" : "Baixa"}
                        </Badge>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive" onClick={() => deleteTask.mutate(task.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* === WHATSAPP TAB === */}
        <TabsContent value="whatsapp" className="mt-3">
          {whatsappContactId ? (
            <Card>
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-emerald-500" />
                  <div>
                    <p className="text-sm font-medium">Conversa vinculada</p>
                    <p className="text-xs text-muted-foreground">{lead.phone}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => navigate("/cliente/chat")}>
                  <ExternalLink className="w-3 h-3" /> Abrir chat
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-8">
              <MessageCircle className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma conversa vinculada</p>
              <p className="text-xs text-muted-foreground mt-1">
                {lead.phone ? "Quando este número enviar uma mensagem, será vinculado automaticamente." : "Adicione um telefone ao lead para vincular ao WhatsApp."}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Lost reason dialog */}
      <Dialog open={lostDialog} onOpenChange={setLostDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Marcar como perdido</DialogTitle></DialogHeader>
          <div>
            <Label className="text-xs">Motivo (opcional)</Label>
            <Textarea value={lostReason} onChange={e => setLostReason(e.target.value)} placeholder="Por que este lead foi perdido?" className="text-sm" />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setLostDialog(false)}>Cancelar</Button>
            <Button size="sm" variant="destructive" onClick={handleMarkLost}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
