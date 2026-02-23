import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  ArrowLeft, Plus, MessageSquare, Search, Inbox,
  AlertTriangle, Timer, Clock,
} from "lucide-react";
import { useSupportTickets, useSupportTicketMutations } from "@/hooks/useSupportTickets";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const STATUS_LABELS: Record<string, string> = { open: "Aberto", in_progress: "Em análise", resolved: "Resolvido", closed: "Encerrado" };
const STATUS_VARIANTS: Record<string, "destructive" | "secondary" | "outline" | "default"> = { open: "destructive", in_progress: "secondary", resolved: "default", closed: "outline" };
const CATEGORIAS = ["Financeiro", "Jurídico", "Comercial", "Marketing", "Treinamentos", "Sistema", "Dúvidas gerais"];

export default function FranqueadoSuporte() {
  const { data: tickets, isLoading } = useSupportTickets();
  const { createTicket } = useSupportTicketMutations();
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [createDialog, setCreateDialog] = useState(false);
  const [novoTitulo, setNovoTitulo] = useState("");
  const [novaCategoria, setNovaCategoria] = useState("Dúvidas gerais");
  const [novaDescricao, setNovaDescricao] = useState("");
  const [novaPrioridade, setNovaPrioridade] = useState("normal");

  const filtered = useMemo(() => {
    return (tickets ?? []).filter(t => {
      if (filterStatus !== "all" && t.status !== filterStatus) return false;
      if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [tickets, filterStatus, search]);

  const alerts = useMemo(() => {
    const abertos = (tickets ?? []).filter(t => t.status === "open").length;
    const emAnalise = (tickets ?? []).filter(t => t.status === "in_progress").length;
    const resolvidos = (tickets ?? []).filter(t => t.status === "resolved").length;
    return [
      { label: "Abertos", count: abertos, cor: "text-red-500", icon: AlertTriangle },
      { label: "Em Análise", count: emAnalise, cor: "text-amber-500", icon: Timer },
      { label: "Resolvidos", count: resolvidos, cor: "text-emerald-500", icon: Clock },
    ];
  }, [tickets]);

  function handleCreate() {
    if (!novoTitulo.trim()) { toast.error("Informe o título"); return; }
    createTicket.mutate({ title: novoTitulo, description: novaDescricao, category: novaCategoria, priority: novaPrioridade }, {
      onSuccess: () => { setCreateDialog(false); setNovoTitulo(""); setNovaDescricao(""); toast.success("Chamado criado!"); },
    });
  }

  if (isLoading) {
    return (
      <div className="w-full space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h1 className="page-header-title">Suporte Matriz</h1>
            <Badge variant="outline" className="text-[10px]">Unidade</Badge>
          </div>
          <p className="text-sm text-muted-foreground">Abra e acompanhe seus chamados</p>
        </div>
        <Button size="sm" onClick={() => setCreateDialog(true)}><Plus className="w-4 h-4 mr-1" /> Novo Chamado</Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {alerts.map(a => (
          <Card key={a.label} className="p-3 flex items-center gap-3">
            <a.icon className={`w-5 h-5 ${a.cor}`} />
            <div>
              <p className="text-lg font-bold">{a.count}</p>
              <p className="text-[11px] text-muted-foreground">{a.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="open">Aberto</SelectItem>
            <SelectItem value="in_progress">Em análise</SelectItem>
            <SelectItem value="resolved">Resolvido</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="w-[200px] h-8 text-xs pl-8" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Inbox className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground font-medium">Nenhum chamado encontrado</p>
          <p className="text-xs text-muted-foreground mt-1">Abra um novo chamado para solicitar suporte.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(t => (
            <Card key={t.id} className="glass-card hover-lift cursor-pointer">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <MessageSquare className="w-5 h-5 text-primary/60 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{t.title}</p>
                    <p className="text-xs text-muted-foreground">{t.category || "Geral"} · {format(new Date(t.created_at), "dd/MM/yyyy")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant={STATUS_VARIANTS[t.status] || "secondary"}>{STATUS_LABELS[t.status] || t.status}</Badge>
                  <Badge variant="outline" className="text-[10px] capitalize">{t.priority || "normal"}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Novo Chamado</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Título *</Label><Input value={novoTitulo} onChange={e => setNovoTitulo(e.target.value)} placeholder="Descreva brevemente o problema" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Categoria</Label>
                <Select value={novaCategoria} onValueChange={setNovaCategoria}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Prioridade</Label>
                <Select value={novaPrioridade} onValueChange={setNovaPrioridade}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Descrição</Label><Textarea value={novaDescricao} onChange={e => setNovaDescricao(e.target.value)} placeholder="Descreva o problema..." rows={4} /></div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreate} disabled={createTicket.isPending}>{createTicket.isPending ? "Criando..." : "Criar Chamado"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
