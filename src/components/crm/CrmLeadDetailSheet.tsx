import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import {
  Phone, Mail, Building2, DollarSign, Tag, Clock, CheckCircle, XCircle,
  MessageCircle, ExternalLink, CircleDot, Plus, Trash2, CalendarDays,
  PhoneCall, Video, Send, StickyNote, AlertTriangle, FileText, Copy,
  MoreHorizontal, ArrowRight, Loader2, Package
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { WhatsAppPhoneButton } from "@/components/crm/WhatsAppPhoneButton";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/NumericInput";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCrmLeadMutations } from "@/hooks/useCrmLeads";
import { useCrmSettings } from "@/hooks/useCrmSettings";
import { useCrmActivities, useCrmActivityMutations } from "@/hooks/useCrmActivities";
import { useCrmTasks, useCrmTaskMutations } from "@/hooks/useCrmTasks";
import { useCrmLeadHistory } from "@/hooks/useCrmLeadHistory";
import { useOrgPermissions } from "@/hooks/useOrgPermissions";
import { LeadProductsTab, ProposalsTab, WhatsAppTab, LeadHistoryTimeline } from "./CrmLeadDetailHelpers";
import { useCrmOrgMembers, useCrmOrgMembersMap } from "@/hooks/useCrmOrgMembers";
import { useCrmPartners } from "@/hooks/useCrmPartners";
import { useWhatsAppMessages, useSendWhatsAppMessage } from "@/hooks/useWhatsApp";
import { ChatMessageBubble } from "@/components/cliente/ChatMessageBubble";
import { useToast } from "@/hooks/use-toast";
import { triggerCelebration } from "@/components/CelebrationEffect";
import { playSound } from "@/lib/sounds";
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
  funnel_id?: string | null;
  assigned_to?: string | null;
  custom_fields?: Record<string, string | number | boolean> | null;
}

interface FunnelOption {
  id: string;
  name: string;
  stages: Array<{ key?: string; label?: string; color?: string; icon?: string }>;
  custom_fields_schema?: Array<{ key: string; label: string; type: string; required?: boolean; placeholder?: string; options?: string[] }>;
}

interface CrmLeadDetailSheetProps {
  lead: LeadRow | null;
  onClose: () => void;
  stages: FunnelStage[];
  funnels?: FunnelOption[];
  currentFunnelId?: string;
}

const ACTIVITY_TYPES = [
  { value: "call", label: "Ligação", icon: <PhoneCall className="w-3.5 h-3.5" /> },
  { value: "whatsapp", label: "WhatsApp", icon: <MessageCircle className="w-3.5 h-3.5" /> },
  { value: "meeting", label: "Reunião", icon: <Video className="w-3.5 h-3.5" /> },
  { value: "email", label: "E-mail", icon: <Send className="w-3.5 h-3.5" /> },
  { value: "note", label: "Nota", icon: <StickyNote className="w-3.5 h-3.5" /> },
];

const TASK_TYPES = [
  { value: "follow_up", label: "📞 Follow-up" },
  { value: "proposta", label: "📄 Enviar proposta" },
  { value: "reuniao", label: "📅 Agendar reunião" },
  { value: "whatsapp", label: "💬 Enviar WhatsApp" },
  { value: "email", label: "📧 Enviar e-mail" },
  { value: "visita", label: "🏢 Visita presencial" },
  { value: "ligacao", label: "☎️ Realizar ligação" },
  { value: "outro", label: "✏️ Outro" },
];

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft: { label: "Rascunho", color: "bg-muted text-muted-foreground" },
  sent: { label: "Enviada", color: "bg-blue-500/15 text-blue-600 border-blue-500/30" },
  accepted: { label: "Aceita", color: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" },
  rejected: { label: "Rejeitada", color: "bg-red-500/15 text-red-600 border-red-500/30" },
};

export function CrmLeadDetailSheet({ lead, onClose, stages, funnels, currentFunnelId }: CrmLeadDetailSheetProps) {
  return (
    <Sheet open={!!lead} onOpenChange={open => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{lead?.name}</SheetTitle>
        </SheetHeader>
        {lead && <LeadDetailTabs lead={lead} stages={stages} funnels={funnels} currentFunnelId={currentFunnelId} />}
      </SheetContent>
    </Sheet>
  );
}

function LeadDetailTabs({ lead, stages, funnels, currentFunnelId }: { lead: LeadRow; stages: FunnelStage[]; funnels?: FunnelOption[]; currentFunnelId?: string }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { updateLead, markAsWon, markAsLost } = useCrmLeadMutations();
  const { can } = useOrgPermissions();
  const { data: crmSettings } = useCrmSettings();
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
  const [editAssignedTo, setEditAssignedTo] = useState<string>(lead.assigned_to || "");
  const [editCustomFields, setEditCustomFields] = useState<Record<string, string | number | boolean>>(
    lead.custom_fields ?? {}
  );
  const { data: members } = useCrmOrgMembers();
  const { data: membersMap } = useCrmOrgMembersMap();

  // Schema de campos adicionais do funil atual (deduplicado contra dados legados)
  const currentFunnel = funnels?.find(f => f.id === lead.funnel_id) ||
    funnels?.find(f => f.id === currentFunnelId);
  const customFieldsSchema = (() => {
    const raw = currentFunnel?.custom_fields_schema || [];
    const seen = new Set<string>();
    return raw.map((f, i) => {
      const baseKey = f?.key || `field_${i}`;
      let key = baseKey;
      let suffix = 2;
      while (seen.has(key)) key = `${baseKey}_${suffix++}`;
      seen.add(key);
      return { ...f, key };
    });
  })();

  const [lostDialog, setLostDialog] = useState(false);
  const [lostReason, setLostReason] = useState("");
  const [lostDescription, setLostDescription] = useState("");
  const configuredReasons: string[] = (crmSettings as Record<string, unknown>)?.loss_reasons as string[] || [
    "Preço", "Concorrência", "Timing inadequado", "Sem orçamento",
    "Sem resposta", "Escolheu outro fornecedor", "Desistiu do projeto",
  ];

  const [actType, setActType] = useState("note");
  const [actTitle, setActTitle] = useState("");
  const [actDesc, setActDesc] = useState("");

  const [taskType, setTaskType] = useState("follow_up");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [taskPriority, setTaskPriority] = useState("medium");

  const stage = stages.find(s => s.key === lead.stage);
  const whatsappContactId = lead.whatsapp_contact_id;

  const handleSave = () => {
    updateLead.mutate({
      id: lead.id, name: editName, phone: editPhone || null,
      email: editEmail || null, company: editCompany || null,
      value: editValue ? parseFloat(editValue) : null, stage: editStage, tags: editTags,
      assigned_to: editAssignedTo || null,
      // Preserva campos legados não exibidos no schema atual e mescla os editados
      custom_fields: { ...(lead.custom_fields ?? {}), ...editCustomFields },
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
    createTask.mutate({
      lead_id: lead.id,
      title: taskTitle,
      due_date: taskDue || undefined,
      priority: taskPriority,
      task_type: taskType,
      lead_name: lead.name,
    });
    setTaskTitle(""); setTaskDue("");
    toast({ title: "Tarefa criada" });
  };

  const handleMarkLost = () => {
    if (!lostReason) return;
    const fullReason = lostDescription ? `${lostReason}: ${lostDescription}` : lostReason;
    markAsLost.mutate({ id: lead.id, lost_reason: fullReason });
    setLostDialog(false);
    setLostReason("");
    setLostDescription("");
    toast({ title: "Lead marcado como perdido" });
  };

  return (
    <div className="space-y-4 mt-4">
      <Tabs defaultValue="info" className="w-full">
        <TabsList className="w-full grid grid-cols-3 sm:grid-cols-6">
          <TabsTrigger value="info" className="text-xs">Dados</TabsTrigger>
          <TabsTrigger value="activities" className="text-xs">Atividades</TabsTrigger>
          <TabsTrigger value="tasks" className="text-xs">Tarefas</TabsTrigger>
          <TabsTrigger value="products" className="text-xs gap-1">
            <Package className="w-3 h-3" /> Produtos
          </TabsTrigger>
          <TabsTrigger value="proposals" className="text-xs gap-1">
            <FileText className="w-3 h-3" /> Propostas
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="text-xs gap-1">
            <MessageCircle className="w-3 h-3" /> WA
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
              <div><Label className="text-xs flex items-center gap-1">Telefone {editPhone && <WhatsAppPhoneButton phone={editPhone} size="xs" />}</Label><Input value={editPhone} onChange={e => setEditPhone(e.target.value)} className="h-8 text-sm" /></div>
              <div><Label className="text-xs">E-mail</Label><Input value={editEmail} onChange={e => setEditEmail(e.target.value)} className="h-8 text-sm" /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs">Empresa</Label><Input value={editCompany} onChange={e => setEditCompany(e.target.value)} className="h-8 text-sm" /></div>
              <div><Label className="text-xs">Valor (R$)</Label><NumericInput value={editValue === "" ? null : Number(editValue)} onChange={v => setEditValue(v === null ? "" : String(v))} prefix="R$ " decimals={2} className="h-8 text-sm" /></div>
            </div>
            <div>
              <Label className="text-xs">Etapa</Label>
              <Select value={editStage} onValueChange={setEditStage}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {stages.map(s => <SelectItem key={s.key} value={s.key} className="text-sm">{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {funnels && funnels.length > 1 && (
              <div>
                <Label className="text-xs">Funil</Label>
                <Select
                  value={currentFunnelId || ""}
                  onValueChange={(funnelId) => {
                    const targetFunnel = funnels.find(f => f.id === funnelId);
                    if (!targetFunnel) return;
                    const targetStages = targetFunnel.stages as Array<{ key?: string; label?: string }>;
                    const firstStageKey = Array.isArray(targetStages) && targetStages.length > 0
                      ? (targetStages[0].key || targetStages[0].label?.toLowerCase().replace(/\s+/g, "_") || "novo")
                      : "novo";
                    updateLead.mutate({ id: lead.id, funnel_id: funnelId, stage: firstStageKey });
                    toast({ title: `Lead transferido para "${targetFunnel.name}"` });
                  }}
                >
                  <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Selecionar funil" /></SelectTrigger>
                  <SelectContent>
                    {funnels.map(f => <SelectItem key={f.id} value={f.id} className="text-sm">{f.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label className="text-xs">Responsável</Label>
              <Select
                value={editAssignedTo || "__none__"}
                onValueChange={(v) => setEditAssignedTo(v === "__none__" ? "" : v)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Selecionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sem responsável</SelectItem>
                  {members?.map((m) => (
                    <SelectItem key={m.user_id} value={m.user_id} className="text-sm">
                      {m.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editAssignedTo && membersMap?.[editAssignedTo] && (
                <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted-foreground">
                  <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center text-[9px] font-bold text-primary overflow-hidden">
                    {membersMap[editAssignedTo].avatar ? (
                      <img src={membersMap[editAssignedTo].avatar as string} alt="" className="w-full h-full object-cover" />
                    ) : (
                      membersMap[editAssignedTo].name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <span>Atribuído a {membersMap[editAssignedTo].name}</span>
                </div>
              )}
            </div>
          </div>

          {customFieldsSchema.length > 0 && (
            <div className="space-y-2 p-3 rounded-lg border bg-muted/30">
              <Label className="text-xs font-semibold">Campos adicionais</Label>
              {customFieldsSchema.map((field, idx) => (
                <div key={`${field.key}__${idx}`}>
                  <Label className="text-xs">{field.label}{field.required ? " *" : ""}</Label>
                  {field.type === "select" ? (
                    <select
                      value={editCustomFields[field.key] || ""}
                      onChange={e => setEditCustomFields(prev => ({ ...prev, [field.key]: e.target.value }))}
                      className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
                    >
                      <option value="">Selecionar</option>
                      {(field.options || []).map((opt: string) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      value={editCustomFields[field.key] || ""}
                      onChange={e => setEditCustomFields(prev => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={field.placeholder || ""}
                      className="h-8 text-xs"
                      type={field.type === "number" ? "number" : "text"}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          <div>
            <Label className="text-xs">Tags</Label>
            <div className="flex flex-wrap gap-1 mt-1">
              {editTags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs gap-1">
                  {tag}
                  <button onClick={() => setEditTags(editTags.filter(t => t !== tag))} className="hover:text-destructive"><XCircle className="w-3 h-3" /></button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-1 mt-1">
              <Input value={newTag} onChange={e => setNewTag(e.target.value)} placeholder="Nova tag..." className="h-7 text-xs" onKeyDown={e => e.key === "Enter" && handleAddTag()} />
              <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={handleAddTag} aria-label="Adicionar tag"><Plus className="w-3 h-3" /></Button>
            </div>
          </div>

          <Button size="sm" className="w-full" onClick={handleSave}>Salvar alterações</Button>
          <Separator />

          {!lead.won_at && !lead.lost_at && (can("crm.mark_won") || can("crm.mark_lost")) && (
            <div className="flex gap-2">
              {can("crm.mark_won") && (
                <Button size="sm" variant="outline" className="flex-1 text-xs gap-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => { markAsWon.mutate(lead.id); triggerCelebration(); playSound("celebration"); toast({ title: "🎉 Lead marcado como vendido!" }); }}>
                  <CheckCircle className="w-3.5 h-3.5" /> Vendido
                </Button>
              )}
              {can("crm.mark_lost") && (
                <Button size="sm" variant="outline" className="flex-1 text-xs gap-1 text-red-600 border-red-200 hover:bg-red-50" onClick={() => setLostDialog(true)}>
                  <XCircle className="w-3.5 h-3.5" /> Perdido
                </Button>
              )}
            </div>
          )}

          <div className="p-3 rounded-lg border">
            <p className="text-[10px] text-muted-foreground uppercase">Criado em</p>
            <p className="text-sm">{new Date(lead.created_at).toLocaleDateString("pt-BR")}</p>
          </div>

          <LeadHistoryTimeline leadId={lead.id} />
        </TabsContent>

        {/* === ACTIVITIES TAB === */}
        <TabsContent value="activities" className="space-y-3 mt-3">
          <div className="space-y-2 p-3 rounded-lg border bg-muted/30">
            <p className="text-xs font-semibold">Registrar atividade</p>
            <Select value={actType} onValueChange={setActType}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ACTIVITY_TYPES.map(t => <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>)}
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
                    <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0">{typeInfo.icon}</div>
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
            <div>
              <Label className="text-[10px] text-muted-foreground">Tipo de tarefa</Label>
              <Select
                value={taskType}
                onValueChange={(v) => {
                  setTaskType(v);
                  const opt = TASK_TYPES.find(t => t.value === v);
                  if (opt) setTaskTitle(opt.label);
                }}
              >
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_TYPES.map(t => <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
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
                    <Checkbox checked={!!task.completed_at} onCheckedChange={checked => updateTask.mutate({ id: task.id, completed_at: checked ? new Date().toISOString() : null })} className="mt-0.5" />
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

        {/* === PRODUCTS TAB === */}
        <TabsContent value="products" className="mt-3">
          <LeadProductsTab leadId={lead.id} />
        </TabsContent>

        {/* === PROPOSALS TAB === */}
        <TabsContent value="proposals" className="mt-3">
          <ProposalsTab leadId={lead.id} onValueSync={(val) => {
            updateLead.mutate({ id: lead.id, value: val });
          }} />
        </TabsContent>

        {/* === WHATSAPP TAB === */}
        <TabsContent value="whatsapp" className="mt-3">
          <WhatsAppTab lead={lead} />
        </TabsContent>
      </Tabs>

      {/* Lost reason dialog */}
      <Dialog open={lostDialog} onOpenChange={setLostDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Marcar como perdido</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-medium">Motivo da perda *</Label>
              <Select value={lostReason} onValueChange={setLostReason}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Selecione o motivo..." /></SelectTrigger>
                <SelectContent>
                  {configuredReasons.map(r => <SelectItem key={r} value={r} className="text-sm">{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Descrição (opcional)</Label>
              <Textarea value={lostDescription} onChange={e => setLostDescription(e.target.value)} placeholder="Detalhes adicionais..." className="text-sm" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setLostDialog(false)}>Cancelar</Button>
            <Button size="sm" variant="destructive" onClick={handleMarkLost} disabled={!lostReason}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

