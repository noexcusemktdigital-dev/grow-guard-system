import { useState } from "react";
import { ArrowLeft, Phone, MessageSquare, Video, Mail, Plus, Check, AlertTriangle, FileText, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/NumericInput";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import type { Lead, Activity, Task, LeadFile, LeadProposal, ActivityType, TaskStatus, FunnelType } from "@/types/crm";
import { getStagesForFunnel, LEAD_ORIGINS, RESPONSAVEIS, TEMPERATURES, CONTACT_STATUSES } from "@/types/crm";


const activityIcons: Record<ActivityType, React.ElementType> = {
  ligacao: Phone, whatsapp: MessageSquare, reuniao: Video, email: Mail,
};

const tempBadge: Record<string, string> = {
  Frio: "bg-blue-100 text-blue-800", Morno: "bg-amber-100 text-amber-800", Quente: "bg-red-100 text-red-800",
};

const statusBadge: Record<string, string> = {
  Ativo: "bg-green-100 text-green-800", Perdido: "bg-red-100 text-red-800", Vendido: "bg-emerald-100 text-emerald-800",
};

interface Props {
  lead: Lead;
  onBack: () => void;
  onUpdateLead: (updated: Lead) => void;
  onConvert: (leadId: string) => void;
  allActivities: Activity[];
  allTasks: Task[];
  allFiles: LeadFile[];
  allProposals: LeadProposal[];
  onAddActivity: (a: Activity) => void;
  onAddTask: (t: Task) => void;
  onToggleTask: (taskId: string) => void;
  onAddFile: (f: LeadFile) => void;
  onAddProposal: (p: LeadProposal) => void;
}

export function CrmLeadDetail({
  lead, onBack, onUpdateLead, onConvert,
  allActivities, allTasks, allFiles, allProposals,
  onAddActivity, onAddTask, onToggleTask, onAddFile, onAddProposal,
}: Props) {
  const { toast } = useToast();
  const [editData, setEditData] = useState<Lead>({ ...lead });
  const [actDialog, setActDialog] = useState(false);
  const [taskDialog, setTaskDialog] = useState(false);
  const [fileDialog, setFileDialog] = useState(false);
  const [propDialog, setPropDialog] = useState(false);

  // Activity form
  const [actType, setActType] = useState<ActivityType>("ligacao");
  const [actResult, setActResult] = useState("");
  const [actNext, setActNext] = useState("");

  // Task form
  const [taskDesc, setTaskDesc] = useState("");
  const [taskDate, setTaskDate] = useState("");
  const [taskResp, setTaskResp] = useState(RESPONSAVEIS[0]);

  // File form
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState("PDF");

  // Proposal form
  const [propValue, setPropValue] = useState("");
  const [propStatus, setPropStatus] = useState<"rascunho" | "enviada" | "aceita">("rascunho");

  const activities = allActivities.filter((a) => a.leadId === lead.id).sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime());
  const tasks = allTasks.filter((t) => t.leadId === lead.id);
  const files = allFiles.filter((f) => f.leadId === lead.id);
  const proposals = allProposals.filter((p) => p.leadId === lead.id);
  const stages = getStagesForFunnel(lead.funnel);

  const handleSave = () => {
    onUpdateLead(editData);
    toast({ title: "Lead atualizado", description: "Dados salvos com sucesso." });
  };

  const handleAddActivity = () => {
    onAddActivity({
      id: `act-${Date.now()}`, leadId: lead.id, tipo: actType,
      dataHora: new Date().toISOString(), resultado: actResult, proximoPasso: actNext,
    });
    setActDialog(false);
    setActResult(""); setActNext("");
    toast({ title: "Atividade registrada" });
  };

  const handleAddTask = () => {
    onAddTask({
      id: `task-${Date.now()}`, leadId: lead.id, descricao: taskDesc,
      dataHora: taskDate || new Date().toISOString(), status: "Aberta", responsavel: taskResp,
    });
    setTaskDialog(false);
    setTaskDesc(""); setTaskDate("");
    toast({ title: "Tarefa criada" });
  };

  const handleAddFile = () => {
    onAddFile({
      id: `file-${Date.now()}`, leadId: lead.id, nome: fileName,
      tipo: fileType, data: new Date().toISOString().split("T")[0],
    });
    setFileDialog(false);
    setFileName("");
    toast({ title: "Arquivo anexado" });
  };

  const handleAddProposal = () => {
    onAddProposal({
      id: `prop-${Date.now()}`, leadId: lead.id,
      valor: Number(propValue) || 0, status: propStatus,
    });
    setPropDialog(false);
    setPropValue("");
    toast({ title: "Proposta adicionada" });
  };

  return (
    <div className="animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Button variant="ghost" size="sm" onClick={onBack} className="mb-2">
            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
          </Button>
          <h2 className="text-2xl font-bold">{lead.nome}</h2>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge variant="outline">{lead.funnel === "franchise" ? "Franquia" : "Clientes"}</Badge>
            <Badge variant="secondary">{lead.stage}</Badge>
            <Badge className={tempBadge[lead.temperature]}>{lead.temperature}</Badge>
            <Badge className={statusBadge[lead.leadStatus]}>{lead.leadStatus}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          {lead.leadStatus === "Ativo" && lead.stage !== "Venda" && lead.stage !== "Oportunidade Perdida" && (
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => onConvert(lead.id)}>
              Converter (Venda)
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="dados">
        <TabsList className="mb-4">
          <TabsTrigger value="dados">Dados</TabsTrigger>
          <TabsTrigger value="atividades">Atividades</TabsTrigger>
          <TabsTrigger value="tarefas">Tarefas</TabsTrigger>
          <TabsTrigger value="arquivos">Arquivos</TabsTrigger>
          <TabsTrigger value="propostas">Propostas</TabsTrigger>
        </TabsList>

        {/* Tab Dados */}
        <TabsContent value="dados">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
            <div><Label>Nome</Label><Input value={editData.nome} onChange={(e) => setEditData({ ...editData, nome: e.target.value })} /></div>
            <div><Label>Telefone</Label><Input value={editData.telefone} onChange={(e) => setEditData({ ...editData, telefone: e.target.value })} /></div>
            <div><Label>WhatsApp</Label><Input value={editData.whatsapp} onChange={(e) => setEditData({ ...editData, whatsapp: e.target.value })} /></div>
            <div><Label>Email</Label><Input value={editData.email} onChange={(e) => setEditData({ ...editData, email: e.target.value })} /></div>
            <div><Label>Cidade</Label><Input value={editData.cidade} onChange={(e) => setEditData({ ...editData, cidade: e.target.value })} /></div>
            <div><Label>UF</Label><Input value={editData.uf} onChange={(e) => setEditData({ ...editData, uf: e.target.value })} /></div>
            <div>
              <Label>Etapa</Label>
              <Select value={editData.stage} onValueChange={(v) => setEditData({ ...editData, stage: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{stages.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Origem</Label>
              <Select value={editData.origin} onValueChange={(v) => setEditData({ ...editData, origin: v as Lead["origin"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{LEAD_ORIGINS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Responsável</Label>
              <Select value={editData.responsavel} onValueChange={(v) => setEditData({ ...editData, responsavel: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{RESPONSAVEIS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Temperatura</Label>
              <Select value={editData.temperature} onValueChange={(v) => setEditData({ ...editData, temperature: v as Lead["temperature"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TEMPERATURES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-full"><Label>Observações</Label><Textarea value={editData.observacoes} onChange={(e) => setEditData({ ...editData, observacoes: e.target.value })} /></div>

            {/* Conditional fields */}
            {editData.funnel === "franchise" && (
              <>
                <div>
                  <Label>Perfil</Label>
                  <Select value={editData.perfil || ""} onValueChange={(v) => setEditData({ ...editData, perfil: v as Lead["perfil"] })}>
                    <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="investidor">Investidor</SelectItem>
                      <SelectItem value="operador">Operador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Capital Disponível</Label><Input value={editData.capitalDisponivel || ""} onChange={(e) => setEditData({ ...editData, capitalDisponivel: e.target.value })} /></div>
                <div><Label>Prazo de Decisão</Label><Input value={editData.prazoDecisao || ""} onChange={(e) => setEditData({ ...editData, prazoDecisao: e.target.value })} /></div>
                <div><Label>Cidade de Interesse</Label><Input value={editData.cidadeInteresse || ""} onChange={(e) => setEditData({ ...editData, cidadeInteresse: e.target.value })} /></div>
              </>
            )}
            {editData.funnel === "clients" && (
              <>
                <div><Label>Empresa</Label><Input value={editData.empresa || ""} onChange={(e) => setEditData({ ...editData, empresa: e.target.value })} /></div>
                <div><Label>Segmento</Label><Input value={editData.segmento || ""} onChange={(e) => setEditData({ ...editData, segmento: e.target.value })} /></div>
                <div><Label>Ticket Potencial</Label><NumericInput value={editData.ticketPotencial ?? null} onChange={v => setEditData({ ...editData, ticketPotencial: v ?? 0 })} prefix="R$ " decimals={2} /></div>
                <div className="col-span-full"><Label>Dor Principal</Label><Textarea value={editData.dorPrincipal || ""} onChange={(e) => setEditData({ ...editData, dorPrincipal: e.target.value })} /></div>
              </>
            )}
          </div>
          <Button className="mt-4" onClick={handleSave}>Salvar</Button>
        </TabsContent>

        {/* Tab Atividades */}
        <TabsContent value="atividades">
          <Button size="sm" className="mb-4" onClick={() => setActDialog(true)}>
            <Plus className="w-4 h-4 mr-1" /> Registrar Atividade
          </Button>
          <div className="relative space-y-0">
            {activities.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma atividade registrada.</p>}
            {activities.map((act, i) => {
              const Icon = activityIcons[act.tipo];
              return (
                <div key={act.id} className="flex gap-3 pb-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    {i < activities.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                  </div>
                  <div className="flex-1 pb-2">
                    <div className="text-xs text-muted-foreground">{new Date(act.dataHora).toLocaleString("pt-BR")}</div>
                    <div className="text-sm font-medium capitalize">{act.tipo}</div>
                    <div className="text-sm">{act.resultado}</div>
                    {act.proximoPasso && <div className="text-xs text-muted-foreground mt-1">Próx: {act.proximoPasso}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* Tab Tarefas */}
        <TabsContent value="tarefas">
          <Button size="sm" className="mb-4" onClick={() => setTaskDialog(true)}>
            <Plus className="w-4 h-4 mr-1" /> Nova Tarefa
          </Button>
          <div className="space-y-2">
            {tasks.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma tarefa.</p>}
            {tasks.map((t) => (
              <div key={t.id} className={`flex items-center gap-3 p-3 rounded-lg border ${t.status === "Atrasada" ? "border-red-300 bg-red-50/50 dark:bg-red-950/20" : "border-border"}`}>
                <Checkbox checked={t.status === "Concluída"} onCheckedChange={() => onToggleTask(t.id)} />
                <div className="flex-1">
                  <div className={`text-sm ${t.status === "Concluída" ? "line-through text-muted-foreground" : ""}`}>{t.descricao}</div>
                  <div className="text-xs text-muted-foreground">{new Date(t.dataHora).toLocaleString("pt-BR")} · {t.responsavel}</div>
                </div>
                <Badge variant={t.status === "Atrasada" ? "destructive" : t.status === "Concluída" ? "secondary" : "outline"} className="text-xs">
                  {t.status}
                </Badge>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Tab Arquivos */}
        <TabsContent value="arquivos">
          <Button size="sm" className="mb-4" onClick={() => setFileDialog(true)}>
            <Plus className="w-4 h-4 mr-1" /> Anexar Arquivo
          </Button>
          <div className="space-y-2">
            {files.length === 0 && <p className="text-sm text-muted-foreground">Nenhum arquivo.</p>}
            {files.map((f) => (
              <div key={f.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{f.nome}</div>
                  <div className="text-xs text-muted-foreground">{f.tipo} · {f.data}</div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Tab Propostas */}
        <TabsContent value="propostas">
          <Button size="sm" className="mb-4" onClick={() => setPropDialog(true)}>
            <Plus className="w-4 h-4 mr-1" /> Nova Proposta
          </Button>
          <div className="space-y-2">
            {proposals.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma proposta.</p>}
            {proposals.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-sm font-medium">R$ {p.valor.toLocaleString("pt-BR")}</div>
                </div>
                <Badge variant={p.status === "aceita" ? "default" : "outline"} className="text-xs capitalize">{p.status}</Badge>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <Dialog open={actDialog} onOpenChange={setActDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar Atividade</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Tipo</Label>
              <Select value={actType} onValueChange={(v) => setActType(v as ActivityType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ligacao">Ligação</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="reuniao">Reunião</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Resultado</Label><Textarea value={actResult} onChange={(e) => setActResult(e.target.value)} /></div>
            <div><Label>Próximo Passo</Label><Input value={actNext} onChange={(e) => setActNext(e.target.value)} /></div>
          </div>
          <DialogFooter><Button onClick={handleAddActivity}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={taskDialog} onOpenChange={setTaskDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Tarefa</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Descrição</Label><Input value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} /></div>
            <div><Label>Data/Hora</Label><Input type="datetime-local" value={taskDate} onChange={(e) => setTaskDate(e.target.value)} /></div>
            <div><Label>Responsável</Label>
              <Select value={taskResp} onValueChange={setTaskResp}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{RESPONSAVEIS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button onClick={handleAddTask}>Criar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={fileDialog} onOpenChange={setFileDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Anexar Arquivo</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome do Arquivo</Label><Input value={fileName} onChange={(e) => setFileName(e.target.value)} /></div>
            <div><Label>Tipo</Label><Input value={fileType} onChange={(e) => setFileType(e.target.value)} placeholder="PDF, DOC, etc." /></div>
          </div>
          <DialogFooter><Button onClick={handleAddFile}>Anexar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={propDialog} onOpenChange={setPropDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Proposta</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Valor (R$)</Label><NumericInput value={propValue === "" ? null : Number(propValue)} onChange={v => setPropValue(v === null ? "" : String(v))} prefix="R$ " decimals={2} /></div>
            <div><Label>Status</Label>
              <Select value={propStatus} onValueChange={(v) => setPropStatus(v as "rascunho" | "enviada" | "aceita")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="rascunho">Rascunho</SelectItem>
                  <SelectItem value="enviada">Enviada</SelectItem>
                  <SelectItem value="aceita">Aceita</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button onClick={handleAddProposal}>Adicionar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
