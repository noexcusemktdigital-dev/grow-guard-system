import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { KpiCard } from "@/components/KpiCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Users, DollarSign, Target, TrendingUp, ArrowLeft, Plus, Phone, Mail,
  Building2, FileSignature, FileCheck2, ClipboardCheck, CheckCircle2,
  Circle, Calendar, StickyNote, LayoutGrid, List, Eye, ArrowRight,
  XCircle, Trophy, MapPin, User, AlertTriangle, Clock, Flame,
  Search, X, MessageSquare, Video,
} from "lucide-react";
import { getFranqueadoLeads, getFranqueadoPropostas, getDiagnosticosNOE, etapasCRM, FranqueadoLead, FranqueadoProposta } from "@/data/franqueadoData";
import { toast } from "sonner";

// ── TYPES ──
type ViewType = "kanban" | "list" | "detail";
type ActivityType = "ligacao" | "whatsapp" | "reuniao" | "email";

interface FranqueadoActivity {
  id: string;
  leadId: string;
  tipo: ActivityType;
  dataHora: string;
  resultado: string;
  proximoPasso: string;
}

interface FranqueadoTask {
  id: string;
  leadId: string;
  descricao: string;
  data: string;
  concluida: boolean;
}

// ── COLORS ──
const etapaColors: Record<string, string> = {
  "Novo Lead": "bg-blue-500/20 text-blue-700 dark:text-blue-400",
  "Primeiro Contato": "bg-cyan-500/20 text-cyan-700 dark:text-cyan-400",
  "Follow-up": "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
  "Diagnóstico": "bg-purple-500/20 text-purple-700 dark:text-purple-400",
  "Estratégia": "bg-indigo-500/20 text-indigo-700 dark:text-indigo-400",
  "Proposta": "bg-orange-500/20 text-orange-700 dark:text-orange-400",
  "Venda": "bg-green-500/20 text-green-700 dark:text-green-400",
  "Perdido": "bg-red-500/20 text-red-700 dark:text-red-400",
};

const tempColors: Record<string, string> = {
  Frio: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  Morno: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  Quente: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const ORIGENS = ["Indicação", "Site", "Evento", "LinkedIn", "Google Ads", "WhatsApp", "Orgânico"];

function stageHeaderColor(stage: string) {
  if (stage === "Venda") return "bg-emerald-500 text-white";
  if (stage === "Perdido") return "bg-red-500 text-white";
  return "bg-muted text-foreground";
}

const activityIcons: Record<ActivityType, React.ElementType> = {
  ligacao: Phone, whatsapp: MessageSquare, reuniao: Video, email: Mail,
};

// ── ALERTS ──
interface CrmAlert {
  type: string;
  label: string;
  count: number;
  color: string;
  icon: React.ElementType;
  bgClass: string;
}

function getAlerts(leads: FranqueadoLead[], tasks: FranqueadoTask[]): CrmAlert[] {
  const noContact = leads.filter(l => l.etapa !== "Perdido" && l.etapa !== "Venda" && !l.ultimoContato);
  const overdue = tasks.filter(t => !t.concluida && new Date(t.data) < new Date());
  const totalActive = leads.filter(l => l.etapa !== "Perdido").length;
  const vendas = leads.filter(l => l.etapa === "Venda").length;
  const rate = totalActive > 0 ? Math.round((vendas / totalActive) * 100) : 0;

  return [
    { type: "no-contact", label: "Sem 1º contato", count: noContact.length, color: "text-red-600", icon: AlertTriangle, bgClass: "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800" },
    { type: "overdue", label: "Tarefas vencidas", count: overdue.length, color: "text-orange-600", icon: Clock, bgClass: "bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-800" },
    { type: "pipeline", label: "Pipeline ativo", count: totalActive, color: "text-blue-600", icon: TrendingUp, bgClass: "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800" },
    { type: "rate", label: "Taxa conversão", count: rate, color: "text-emerald-600", icon: Target, bgClass: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800" },
  ];
}

// ── MAIN COMPONENT ──
export default function FranqueadoCRM() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState(() => getFranqueadoLeads());
  const [propostas, setPropostas] = useState(() => getFranqueadoPropostas());
  const diagnosticos = getDiagnosticosNOE();

  const [view, setView] = useState<ViewType>("kanban");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterEtapa, setFilterEtapa] = useState("");
  const [filterOrigem, setFilterOrigem] = useState("");

  // Activity & task state
  const [activities, setActivities] = useState<FranqueadoActivity[]>([]);
  const [allTasks, setAllTasks] = useState<FranqueadoTask[]>(() =>
    leads.flatMap(l => (l.tarefas || []).map(t => ({ id: t.id, leadId: l.id, descricao: t.titulo, data: t.data, concluida: t.concluida })))
  );
  const [notasEdit, setNotasEdit] = useState<Record<string, string>>({});

  // Dialogs
  const [newLeadDialog, setNewLeadDialog] = useState(false);
  const [newLead, setNewLead] = useState<Partial<FranqueadoLead>>({});
  const [actDialog, setActDialog] = useState(false);
  const [taskDialog, setTaskDialog] = useState(false);
  const [actType, setActType] = useState<ActivityType>("ligacao");
  const [actResult, setActResult] = useState("");
  const [actNext, setActNext] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskDate, setTaskDate] = useState("");

  // Convert dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogProposta, setDialogProposta] = useState<FranqueadoProposta | null>(null);

  // Drawer for proposal
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLeadId, setDrawerLeadId] = useState<string | null>(null);

  const hasFilters = searchQuery || filterEtapa || filterOrigem;

  const filtrados = useMemo(() => {
    return leads.filter(l => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!l.nome.toLowerCase().includes(q) && !l.empresa?.toLowerCase().includes(q) && !l.email.toLowerCase().includes(q)) return false;
      }
      if (filterEtapa && l.etapa !== filterEtapa) return false;
      if (filterOrigem && l.origem !== filterOrigem) return false;
      return true;
    });
  }, [leads, searchQuery, filterEtapa, filterOrigem]);

  const clearFilters = () => { setSearchQuery(""); setFilterEtapa(""); setFilterOrigem(""); };

  const alerts = useMemo(() => getAlerts(leads, allTasks), [leads, allTasks]);

  const totalValor = leads.filter(l => l.etapa !== "Perdido").reduce((s, l) => s + (l.valor || 0), 0);
  const vendas = leads.filter(l => l.etapa === "Venda").length;

  const selected = leads.find(l => l.id === selectedId);

  function handleOpenLead(id: string) { setSelectedId(id); setView("detail"); }

  function handleMoveLead(leadId: string, newStage: string) {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, etapa: newStage } : l));
    toast.success(`Lead movido para "${newStage}"`);
  }

  function handleMarkLost(leadId: string) {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, etapa: "Perdido" } : l));
    toast.success("Lead marcado como perdido");
  }

  function getPropostaForLead(leadId: string) {
    return propostas.find(p => p.leadId === leadId);
  }

  function openConvertDialog(proposta: FranqueadoProposta) {
    setDialogProposta(proposta);
    setDialogOpen(true);
  }

  function handleConverterContrato() {
    if (!dialogProposta) return;
    setDialogOpen(false);
    toast.success("Contrato ativado com sucesso!");
    navigate("/franqueado/contratos?novo=CT-novo");
  }

  function handleCreateLead() {
    const nl: FranqueadoLead = {
      id: `L-${Date.now()}`,
      nome: newLead.nome || "Novo Lead",
      email: newLead.email || "",
      telefone: newLead.telefone || "",
      empresa: newLead.empresa || "",
      etapa: "Novo Lead",
      valor: newLead.valor,
      origem: newLead.origem || "Orgânico",
      criadoEm: new Date().toISOString().split("T")[0],
      ultimoContato: new Date().toISOString().split("T")[0],
      notas: newLead.notas,
    };
    setLeads(prev => [nl, ...prev]);
    setNewLeadDialog(false);
    setNewLead({});
    toast.success(`Lead "${nl.nome}" criado`);
  }

  function handleAddActivity() {
    if (!selectedId) return;
    setActivities(prev => [...prev, {
      id: `act-${Date.now()}`, leadId: selectedId, tipo: actType,
      dataHora: new Date().toISOString(), resultado: actResult, proximoPasso: actNext,
    }]);
    setActDialog(false);
    setActResult(""); setActNext("");
    toast.success("Atividade registrada");
  }

  function handleAddTask() {
    if (!selectedId) return;
    setAllTasks(prev => [...prev, {
      id: `task-${Date.now()}`, leadId: selectedId, descricao: taskDesc,
      data: taskDate || new Date().toISOString().split("T")[0], concluida: false,
    }]);
    setTaskDialog(false);
    setTaskDesc(""); setTaskDate("");
    toast.success("Tarefa criada");
  }

  function toggleTask(taskId: string) {
    setAllTasks(prev => prev.map(t => t.id === taskId ? { ...t, concluida: !t.concluida } : t));
  }

  // ── DETAIL VIEW ──
  if (view === "detail" && selected) {
    const proposta = getPropostaForLead(selected.id);
    const diagnostico = diagnosticos.find(d => d.id === selected.diagnosticoId);
    const notas = notasEdit[selected.id] ?? selected.notas ?? "";
    const leadActivities = activities.filter(a => a.leadId === selected.id).sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime());
    const leadTasks = allTasks.filter(t => t.leadId === selected.id);

    return (
      <div className="animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <Button variant="ghost" size="sm" onClick={() => setView("kanban")} className="mb-2">
              <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
            </Button>
            <h2 className="text-2xl font-bold">{selected.nome}</h2>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge className={etapaColors[selected.etapa]}>{selected.etapa}</Badge>
              {selected.empresa && <Badge variant="outline">{selected.empresa}</Badge>}
              {selected.valor && <Badge variant="secondary">R$ {selected.valor.toLocaleString()}</Badge>}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {!selected.diagnosticoId && (
              <Button size="sm" variant="outline" onClick={() => navigate(`/franqueado/diagnostico?leadId=${selected.id}`)}>
                <ClipboardCheck className="w-4 h-4 mr-1" /> Diagnóstico NOE
              </Button>
            )}
            {(selected.etapa === "Proposta" || selected.etapa === "Estratégia") && !proposta && (
              <Button size="sm" onClick={() => navigate(`/franqueado/propostas?leadId=${selected.id}${selected.diagnosticoId ? `&diagnosticoId=${selected.diagnosticoId}` : ""}`)}>
                <FileSignature className="w-4 h-4 mr-1" /> Gerar Proposta
              </Button>
            )}
            {proposta && proposta.status === "aceita" && !selected.contratoId && (
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => openConvertDialog(proposta)}>
                <FileCheck2 className="w-4 h-4 mr-1" /> Converter em Contrato
              </Button>
            )}
          </div>
        </div>

        {/* Integration badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className={`flex items-center gap-2 p-3 rounded-lg border ${selected.diagnosticoId ? "border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800" : "border-border"}`}>
            {selected.diagnosticoId ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Circle className="w-4 h-4 text-muted-foreground/40" />}
            <span className="text-sm">Diagnóstico NOE</span>
          </div>
          <div className={`flex items-center gap-2 p-3 rounded-lg border ${selected.propostaId ? "border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800" : "border-border"}`}>
            {selected.propostaId ? <CheckCircle2 className="w-4 h-4 text-blue-500" /> : <Circle className="w-4 h-4 text-muted-foreground/40" />}
            <span className="text-sm">Proposta gerada</span>
          </div>
          <div className={`flex items-center gap-2 p-3 rounded-lg border ${proposta?.status === "aceita" ? "border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800" : "border-border"}`}>
            {proposta?.status === "aceita" ? <CheckCircle2 className="w-4 h-4 text-orange-500" /> : <Circle className="w-4 h-4 text-muted-foreground/40" />}
            <span className="text-sm">Proposta aceita</span>
          </div>
          <div className={`flex items-center gap-2 p-3 rounded-lg border ${selected.contratoId ? "border-purple-200 bg-purple-50 dark:bg-purple-950/20 dark:border-purple-800" : "border-border"}`}>
            {selected.contratoId ? <CheckCircle2 className="w-4 h-4 text-purple-500" /> : <Circle className="w-4 h-4 text-muted-foreground/40" />}
            <span className="text-sm">Contrato ativo</span>
          </div>
        </div>

        <Tabs defaultValue="dados">
          <TabsList className="mb-4">
            <TabsTrigger value="dados">Dados</TabsTrigger>
            <TabsTrigger value="atividades">Atividades</TabsTrigger>
            <TabsTrigger value="tarefas">Tarefas</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
            <TabsTrigger value="notas">Notas</TabsTrigger>
          </TabsList>

          {/* Tab Dados */}
          <TabsContent value="dados">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
              <div><Label>Nome</Label><Input value={selected.nome} readOnly /></div>
              <div><Label>Email</Label><Input value={selected.email} readOnly /></div>
              <div><Label>Telefone</Label><Input value={selected.telefone} readOnly /></div>
              <div><Label>Empresa</Label><Input value={selected.empresa || ""} readOnly /></div>
              <div>
                <Label>Etapa</Label>
                <Select value={selected.etapa} onValueChange={(v) => handleMoveLead(selected.id, v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{etapasCRM.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Origem</Label><Input value={selected.origem} readOnly /></div>
              <div><Label>Valor Potencial</Label><Input value={selected.valor ? `R$ ${selected.valor.toLocaleString()}` : "—"} readOnly /></div>
              <div><Label>Criado em</Label><Input value={selected.criadoEm} readOnly /></div>
            </div>
            <div className="flex gap-3 mt-4 flex-wrap">
              <Button variant="outline" size="sm"><Phone className="w-4 h-4 mr-1" /> {selected.telefone}</Button>
              <Button variant="outline" size="sm"><Mail className="w-4 h-4 mr-1" /> {selected.email}</Button>
            </div>
          </TabsContent>

          {/* Tab Atividades */}
          <TabsContent value="atividades">
            <Button size="sm" className="mb-4" onClick={() => setActDialog(true)}>
              <Plus className="w-4 h-4 mr-1" /> Registrar Atividade
            </Button>
            <div className="relative space-y-0">
              {leadActivities.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma atividade registrada.</p>}
              {leadActivities.map((act, i) => {
                const Icon = activityIcons[act.tipo];
                return (
                  <div key={act.id} className="flex gap-3 pb-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      {i < leadActivities.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
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
              {leadTasks.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma tarefa.</p>}
              {leadTasks.map(t => {
                const isOverdue = !t.concluida && new Date(t.data) < new Date();
                return (
                  <div key={t.id} className={`flex items-center gap-3 p-3 rounded-lg border ${isOverdue ? "border-red-300 bg-red-50/50 dark:bg-red-950/20" : "border-border"}`}>
                    <Checkbox checked={t.concluida} onCheckedChange={() => toggleTask(t.id)} />
                    <div className="flex-1">
                      <div className={`text-sm ${t.concluida ? "line-through text-muted-foreground" : ""}`}>{t.descricao}</div>
                      <div className="text-xs text-muted-foreground">{t.data}</div>
                    </div>
                    <Badge variant={isOverdue ? "destructive" : t.concluida ? "secondary" : "outline"} className="text-xs">
                      {isOverdue ? "Atrasada" : t.concluida ? "Concluída" : "Aberta"}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* Tab Histórico */}
          <TabsContent value="historico">
            <div className="relative pl-6 space-y-4">
              <div className="absolute left-2 top-1 bottom-1 w-px bg-border" />
              <div className="relative">
                <div className="absolute -left-4 top-1 w-2 h-2 rounded-full bg-primary" />
                <p className="text-xs text-muted-foreground">{selected.criadoEm}</p>
                <p className="text-sm font-medium">Lead criado — {selected.origem}</p>
              </div>
              {diagnostico && (
                <div className="relative">
                  <div className="absolute -left-4 top-1 w-2 h-2 rounded-full bg-green-500" />
                  <p className="text-xs text-muted-foreground">{diagnostico.criadoEm}</p>
                  <p className="text-sm font-medium">Diagnóstico NOE — {diagnostico.nivel} ({diagnostico.pontuacao}%)</p>
                </div>
              )}
              {proposta && (
                <div className="relative">
                  <div className="absolute -left-4 top-1 w-2 h-2 rounded-full bg-blue-500" />
                  <p className="text-xs text-muted-foreground">{proposta.criadaEm}</p>
                  <p className="text-sm font-medium">Proposta {proposta.id} — R$ {proposta.valor.toLocaleString()} ({proposta.status})</p>
                </div>
              )}
              {selected.contratoId && (
                <div className="relative">
                  <div className="absolute -left-4 top-1 w-2 h-2 rounded-full bg-purple-500" />
                  <p className="text-xs text-muted-foreground">{selected.ultimoContato}</p>
                  <p className="text-sm font-medium">Contrato {selected.contratoId} ativado</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tab Notas */}
          <TabsContent value="notas">
            <Textarea
              value={notas}
              onChange={e => setNotasEdit(prev => ({ ...prev, [selected.id]: e.target.value }))}
              placeholder="Adicione notas sobre este lead..."
              rows={6}
            />
            <Button size="sm" className="mt-3" onClick={() => toast.success("Notas salvas")}>Salvar Notas</Button>
          </TabsContent>
        </Tabs>

        {/* Activity Dialog */}
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

        {/* Task Dialog */}
        <Dialog open={taskDialog} onOpenChange={setTaskDialog}>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Tarefa</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Descrição</Label><Input value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} /></div>
              <div><Label>Data</Label><Input type="date" value={taskDate} onChange={(e) => setTaskDate(e.target.value)} /></div>
            </div>
            <DialogFooter><Button onClick={handleAddTask}>Criar</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Convert Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Converter em Contrato</DialogTitle>
              <DialogDescription>Confirme os dados para criar o contrato.</DialogDescription>
            </DialogHeader>
            {dialogProposta && (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-muted-foreground">Cliente</p><p className="font-semibold">{dialogProposta.clienteNome}</p></div>
                <div><p className="text-xs text-muted-foreground">Valor</p><p className="font-semibold">R$ {dialogProposta.valor.toLocaleString()}</p></div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button className="bg-green-600 hover:bg-green-700" onClick={handleConverterContrato}><FileCheck2 className="w-4 h-4 mr-1" /> Criar Contrato</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ── MAIN VIEW ──
  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">CRM de Vendas</h1>
            <Badge variant="outline">Unidade</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Gerencie seus leads e oportunidades</p>
        </div>
      </div>

      {/* Alerts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {alerts.map(alert => {
          const Icon = alert.icon;
          return (
            <div key={alert.type} className={`flex items-center gap-3 p-3 rounded-lg border ${alert.bgClass} transition-all`}>
              <Icon className={`w-5 h-5 ${alert.color} flex-shrink-0`} />
              <div className="min-w-0">
                <div className={`text-lg font-bold ${alert.color}`}>
                  {alert.type === "rate" ? `${alert.count}%` : alert.count}
                </div>
                <div className="text-xs text-muted-foreground truncate">{alert.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex bg-muted rounded-lg p-0.5">
          <button
            className={`px-3 py-1.5 rounded-md text-sm transition-colors flex items-center gap-1.5 ${view === "kanban" ? "bg-card shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => setView("kanban")}
          >
            <LayoutGrid className="w-4 h-4" /> Kanban
          </button>
          <button
            className={`px-3 py-1.5 rounded-md text-sm transition-colors flex items-center gap-1.5 ${view === "list" ? "bg-card shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => setView("list")}
          >
            <List className="w-4 h-4" /> Lista
          </button>
        </div>
        <div className="flex-1" />
        <Button size="sm" onClick={() => { setNewLead({}); setNewLeadDialog(true); }}>
          <Plus className="w-4 h-4 mr-1" /> Novo Lead
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar lead..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-8 h-8 w-48 text-sm" />
        </div>
        <Select value={filterEtapa} onValueChange={setFilterEtapa}>
          <SelectTrigger className="h-8 w-36 text-sm"><SelectValue placeholder="Etapa" /></SelectTrigger>
          <SelectContent>{etapasCRM.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filterOrigem} onValueChange={setFilterOrigem}>
          <SelectTrigger className="h-8 w-36 text-sm"><SelectValue placeholder="Origem" /></SelectTrigger>
          <SelectContent>{ORIGENS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={clearFilters}>
            <X className="w-3 h-3 mr-1" /> Limpar
          </Button>
        )}
      </div>

      {/* Kanban View */}
      {view === "kanban" && (
        <ScrollArea className="w-full">
          <div className="flex gap-4 pb-4 min-w-max">
            {etapasCRM.map(etapa => {
              const leadsEtapa = filtrados.filter(l => l.etapa === etapa);
              return (
                <div key={etapa} className="w-72 flex-shrink-0">
                  <div className={`flex items-center justify-between px-3 py-2 rounded-t-lg text-sm font-medium ${stageHeaderColor(etapa)}`}>
                    <span className="truncate">{etapa}</span>
                    <Badge variant="secondary" className="ml-2 text-xs">{leadsEtapa.length}</Badge>
                  </div>
                  <div className="bg-muted/30 rounded-b-lg p-2 min-h-[200px] space-y-2 border border-t-0 border-border">
                    {leadsEtapa.map(l => (
                      <KanbanLeadCard
                        key={l.id}
                        lead={l}
                        proposta={getPropostaForLead(l.id)}
                        hasOverdue={allTasks.filter(t => t.leadId === l.id).some(t => !t.concluida && new Date(t.data) < new Date())}
                        onOpen={() => handleOpenLead(l.id)}
                        onMove={(v) => handleMoveLead(l.id, v)}
                        onLost={() => handleMarkLost(l.id)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}

      {/* List View */}
      {view === "list" && (
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Etapa</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Vínculos</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.map(l => (
                <TableRow key={l.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => handleOpenLead(l.id)}>
                  <TableCell className="font-medium">{l.nome}</TableCell>
                  <TableCell className="text-sm">{l.empresa || "—"}</TableCell>
                  <TableCell><Badge className={`text-xs ${etapaColors[l.etapa]}`}>{l.etapa}</Badge></TableCell>
                  <TableCell className="text-sm">{l.origem}</TableCell>
                  <TableCell className="text-sm font-semibold">{l.valor ? `R$ ${l.valor.toLocaleString()}` : "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {l.diagnosticoId && <ClipboardCheck className="w-3.5 h-3.5 text-green-500" />}
                      {l.propostaId && <FileSignature className="w-3.5 h-3.5 text-blue-500" />}
                      {l.contratoId && <FileCheck2 className="w-3.5 h-3.5 text-purple-500" />}
                    </div>
                  </TableCell>
                  <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                    <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => handleOpenLead(l.id)}>
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* New Lead Dialog */}
      <Dialog open={newLeadDialog} onOpenChange={setNewLeadDialog}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Novo Lead</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Nome</Label><Input value={newLead.nome || ""} onChange={e => setNewLead({ ...newLead, nome: e.target.value })} /></div>
              <div><Label>Telefone</Label><Input value={newLead.telefone || ""} onChange={e => setNewLead({ ...newLead, telefone: e.target.value })} /></div>
              <div><Label>Email</Label><Input value={newLead.email || ""} onChange={e => setNewLead({ ...newLead, email: e.target.value })} /></div>
              <div><Label>Empresa</Label><Input value={newLead.empresa || ""} onChange={e => setNewLead({ ...newLead, empresa: e.target.value })} /></div>
              <div>
                <Label>Origem</Label>
                <Select value={newLead.origem || ""} onValueChange={v => setNewLead({ ...newLead, origem: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>{ORIGENS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Valor Potencial</Label><Input type="number" value={newLead.valor || ""} onChange={e => setNewLead({ ...newLead, valor: Number(e.target.value) })} /></div>
            </div>
            <div><Label>Observações</Label><Textarea value={newLead.notas || ""} onChange={e => setNewLead({ ...newLead, notas: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={handleCreateLead}>Criar Lead</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Convert Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Converter em Contrato</DialogTitle>
            <DialogDescription>Confirme os dados para criar o contrato.</DialogDescription>
          </DialogHeader>
          {dialogProposta && (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-muted-foreground">Cliente</p><p className="font-semibold">{dialogProposta.clienteNome}</p></div>
              <div><p className="text-xs text-muted-foreground">Valor</p><p className="font-semibold">R$ {dialogProposta.valor.toLocaleString()}</p></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleConverterContrato}><FileCheck2 className="w-4 h-4 mr-1" /> Criar Contrato</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
