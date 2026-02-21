import { useState } from "react";
import {
  Ticket, TicketCategory, TicketPriority, TicketStatus,
  mockTickets, CATEGORIES, SUBCATEGORIES_MAP, RESPONSAVEIS, TICKET_STATUSES,
  getAtendimentoAlerts, calculateSlaDeadline,
} from "@/data/atendimentoData";
import { useToast } from "@/hooks/use-toast";
import { AtendimentoKanban } from "@/components/atendimento/AtendimentoKanban";
import { AtendimentoList } from "@/components/atendimento/AtendimentoList";
import { AtendimentoDetail } from "@/components/atendimento/AtendimentoDetail";
import { AtendimentoConfig } from "@/components/atendimento/AtendimentoConfig";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import {
  MessageSquare, LayoutGrid, List, Settings, Plus, ArrowLeft,
  AlertTriangle, Clock, Inbox, Timer,
} from "lucide-react";

type View = "kanban" | "list" | "detail" | "config";

const mockUnidades = [
  { id: "u1", nome: "Unidade Centro" },
  { id: "u2", nome: "Unidade Norte" },
  { id: "u3", nome: "Unidade Sul" },
  { id: "u4", nome: "Unidade Leste" },
  { id: "u5", nome: "Unidade Oeste" },
  { id: "u6", nome: "Unidade Jardins" },
  { id: "u7", nome: "Unidade Paulista" },
];

const alertIcons = [AlertTriangle, Inbox, Timer, Clock];

export default function Atendimento() {
  const { toast } = useToast();
  const [view, setView] = useState<View>("kanban");
  const [previousView, setPreviousView] = useState<View>("kanban");
  const [tickets, setTickets] = useState<Ticket[]>(mockTickets);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterUnidade, setFilterUnidade] = useState("all");
  const [filterCategoria, setFilterCategoria] = useState("all");
  const [filterPrioridade, setFilterPrioridade] = useState("all");
  const [filterResponsavel, setFilterResponsavel] = useState("all");
  const [search, setSearch] = useState("");

  // New ticket dialog
  const [showNew, setShowNew] = useState(false);
  const [newUnidade, setNewUnidade] = useState("");
  const [newCategoria, setNewCategoria] = useState<TicketCategory | "">("");
  const [newSubcategoria, setNewSubcategoria] = useState("");
  const [newPrioridade, setNewPrioridade] = useState<TicketPriority>("Normal");
  const [newDescricao, setNewDescricao] = useState("");
  const [newResponsavel, setNewResponsavel] = useState("");

  const alerts = getAtendimentoAlerts(tickets);

  const filteredTickets = tickets.filter(t => {
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (filterUnidade !== "all" && t.unidadeId !== filterUnidade) return false;
    if (filterCategoria !== "all" && t.categoria !== filterCategoria) return false;
    if (filterPrioridade !== "all" && t.prioridade !== filterPrioridade) return false;
    if (filterResponsavel !== "all" && t.responsavelId !== filterResponsavel) return false;
    if (search && !t.numero.includes(search) && !t.descricao.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleSelectTicket = (id: string) => {
    setSelectedTicketId(id);
    setPreviousView(view);
    setView("detail");
  };

  const handleBack = () => {
    setView(previousView);
    setSelectedTicketId(null);
  };

  const handleUpdateTicket = (updated: Ticket) => {
    setTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
  };

  const handleCreateTicket = () => {
    if (!newUnidade || !newCategoria || !newDescricao.trim()) {
      toast({ title: "Preencha os campos obrigatórios", variant: "destructive" });
      return;
    }
    const unidade = mockUnidades.find(u => u.id === newUnidade)!;
    const resp = RESPONSAVEIS.find(r => r.id === newResponsavel) || RESPONSAVEIS[0];
    const numero = `#${String(tickets.length + 1).padStart(3, "0")}`;
    const newTicket: Ticket = {
      id: `t_${Date.now()}`,
      numero,
      unidadeId: unidade.id,
      unidadeNome: unidade.nome,
      categoria: newCategoria as TicketCategory,
      subcategoria: newSubcategoria || "Geral",
      prioridade: newPrioridade,
      status: "Aberto",
      responsavelId: resp.id,
      responsavelNome: resp.nome,
      descricao: newDescricao.trim(),
      anexos: [],
      slaDeadline: calculateSlaDeadline(newPrioridade),
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };
    setTickets(prev => [newTicket, ...prev]);
    setShowNew(false);
    setNewUnidade(""); setNewCategoria(""); setNewSubcategoria(""); setNewPrioridade("Normal"); setNewDescricao(""); setNewResponsavel("");
    toast({ title: `Chamado ${numero} criado com sucesso` });
  };

  const selectedTicket = tickets.find(t => t.id === selectedTicketId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {view === "detail" && (
            <Button variant="ghost" size="icon" onClick={handleBack}><ArrowLeft className="w-4 h-4" /></Button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-bold">Atendimento</h1>
              <Badge variant="secondary" className="text-[10px]">Franqueadora</Badge>
            </div>
            <p className="text-sm text-muted-foreground">Central de suporte e chamados da rede</p>
          </div>
        </div>
        {view !== "detail" && view !== "config" && (
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border bg-muted/30 p-0.5">
              <Button variant={view === "kanban" ? "default" : "ghost"} size="sm" className="gap-1 h-7" onClick={() => setView("kanban")}>
                <LayoutGrid className="w-3.5 h-3.5" /> Kanban
              </Button>
              <Button variant={view === "list" ? "default" : "ghost"} size="sm" className="gap-1 h-7" onClick={() => setView("list")}>
                <List className="w-3.5 h-3.5" /> Lista
              </Button>
            </div>
            <Button variant="outline" size="sm" className="gap-1 h-7" onClick={() => { setPreviousView(view); setView("config"); }}>
              <Settings className="w-3.5 h-3.5" />
            </Button>
            <Button size="sm" className="gap-1 h-7" onClick={() => setShowNew(true)}>
              <Plus className="w-3.5 h-3.5" /> Novo Chamado
            </Button>
          </div>
        )}
        {view === "config" && (
          <Button variant="outline" size="sm" onClick={() => setView(previousView)}>
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Voltar
          </Button>
        )}
      </div>

      {/* Alerts */}
      {(view === "kanban" || view === "list") && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {alerts.map((a, i) => {
            const Icon = alertIcons[i];
            return (
              <Card key={a.tipo} className={`p-3 flex items-center gap-3 ${a.count > 0 && a.tipo === "sla" ? "border-red-500/30" : ""}`}>
                <Icon className={`w-5 h-5 ${a.cor} ${a.count > 0 && a.tipo === "sla" ? "animate-pulse" : ""}`} />
                <div>
                  <p className="text-lg font-bold">{a.count}</p>
                  <p className="text-[11px] text-muted-foreground">{a.label}</p>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Filters */}
      {(view === "kanban" || view === "list") && (
        <div className="flex flex-wrap gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              {TICKET_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterUnidade} onValueChange={setFilterUnidade}>
            <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue placeholder="Unidade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Unidades</SelectItem>
              {mockUnidades.map(u => <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterCategoria} onValueChange={setFilterCategoria}>
            <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterPrioridade} onValueChange={setFilterPrioridade}>
            <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="Prioridade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="Baixa">Baixa</SelectItem>
              <SelectItem value="Normal">Normal</SelectItem>
              <SelectItem value="Alta">Alta</SelectItem>
              <SelectItem value="Urgente">Urgente</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterResponsavel} onValueChange={setFilterResponsavel}>
            <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="Responsável" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {RESPONSAVEIS.map(r => <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input
            placeholder="Buscar nº ou descrição..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-[200px] h-8 text-xs"
          />
        </div>
      )}

      {/* Views */}
      {view === "kanban" && <AtendimentoKanban tickets={filteredTickets} onSelectTicket={handleSelectTicket} onMoveTicket={(ticketId, newStatus) => {
        const ticket = tickets.find(t => t.id === ticketId);
        if (ticket) {
          handleUpdateTicket({ ...ticket, status: newStatus, atualizadoEm: new Date().toISOString() });
          toast({ title: `Chamado ${ticket.numero} movido para "${newStatus}"` });
        }
      }} />}
      {view === "list" && <AtendimentoList tickets={filteredTickets} onSelectTicket={handleSelectTicket} />}
      {view === "detail" && selectedTicket && <AtendimentoDetail ticket={selectedTicket} onUpdateTicket={handleUpdateTicket} />}
      {view === "config" && <AtendimentoConfig />}

      {/* New Ticket Dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo Chamado</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Select value={newUnidade} onValueChange={setNewUnidade}>
              <SelectTrigger className="text-sm"><SelectValue placeholder="Selecione a unidade *" /></SelectTrigger>
              <SelectContent>
                {mockUnidades.map(u => <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <Select value={newCategoria} onValueChange={v => { setNewCategoria(v as TicketCategory); setNewSubcategoria(""); }}>
                <SelectTrigger className="text-sm"><SelectValue placeholder="Categoria *" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={newSubcategoria} onValueChange={setNewSubcategoria} disabled={!newCategoria}>
                <SelectTrigger className="text-sm"><SelectValue placeholder="Subcategoria" /></SelectTrigger>
                <SelectContent>
                  {newCategoria && SUBCATEGORIES_MAP[newCategoria as TicketCategory].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Select value={newPrioridade} onValueChange={v => setNewPrioridade(v as TicketPriority)}>
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Baixa">Baixa</SelectItem>
                  <SelectItem value="Normal">Normal</SelectItem>
                  <SelectItem value="Alta">Alta</SelectItem>
                  <SelectItem value="Urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
              <Select value={newResponsavel} onValueChange={setNewResponsavel}>
                <SelectTrigger className="text-sm"><SelectValue placeholder="Responsável" /></SelectTrigger>
                <SelectContent>
                  {RESPONSAVEIS.map(r => <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Textarea value={newDescricao} onChange={e => setNewDescricao(e.target.value)} placeholder="Descrição do chamado *" className="text-sm" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button>
            <Button onClick={handleCreateTicket}>Criar Chamado</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
