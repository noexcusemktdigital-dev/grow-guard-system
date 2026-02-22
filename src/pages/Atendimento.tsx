import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Inbox, Plus, MessageSquare, LayoutGrid, List, Settings, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { useSupportTickets, useSupportTicketMutations } from "@/hooks/useSupportTickets";
import { useToast } from "@/hooks/use-toast";

type View = "kanban" | "list" | "detail";

const STATUSES = ["Aberto", "Em Andamento", "Aguardando", "Resolvido"];

export default function Atendimento() {
  const { toast } = useToast();
  const [view, setView] = useState<View>("kanban");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPriority, setNewPriority] = useState("medium");

  const { data: tickets, isLoading } = useSupportTickets();
  const { createTicket, updateTicket } = useSupportTicketMutations();

  const selected = (tickets ?? []).find(t => t.id === selectedId);

  const handleCreate = () => {
    if (!newTitle.trim()) { toast({ title: "Informe o título", variant: "destructive" }); return; }
    createTicket.mutate({ title: newTitle, description: newDesc, priority: newPriority });
    setShowNew(false);
    setNewTitle(""); setNewDesc("");
    toast({ title: "Chamado criado com sucesso" });
  };

  if (isLoading) return <div className="space-y-6"><Skeleton className="h-12 w-full" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {view === "detail" && <Button variant="ghost" size="icon" onClick={() => { setView("kanban"); setSelectedId(null); }}><ArrowLeft className="w-4 h-4" /></Button>}
          <div>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <h1 className="page-header-title">Central de Atendimento</h1>
              <Badge variant="secondary" className="text-[10px]">Franqueadora</Badge>
            </div>
            <p className="text-sm text-muted-foreground">Central de suporte e chamados da rede</p>
          </div>
        </div>
        {view !== "detail" && (
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border bg-muted/30 p-0.5">
              <Button variant={view === "kanban" ? "default" : "ghost"} size="sm" className="gap-1 h-7" onClick={() => setView("kanban")}><LayoutGrid className="w-3.5 h-3.5" /> Kanban</Button>
              <Button variant={view === "list" ? "default" : "ghost"} size="sm" className="gap-1 h-7" onClick={() => setView("list")}><List className="w-3.5 h-3.5" /> Lista</Button>
            </div>
            <Button size="sm" className="gap-1 h-7" onClick={() => setShowNew(true)}><Plus className="w-3.5 h-3.5" /> Novo Chamado</Button>
          </div>
        )}
      </div>

      {(tickets ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Inbox className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-1">Nenhum chamado</h3>
          <p className="text-sm text-muted-foreground mb-4">Crie o primeiro chamado de suporte.</p>
          <Button onClick={() => setShowNew(true)}><Plus className="w-4 h-4 mr-1" /> Novo Chamado</Button>
        </div>
      ) : view === "detail" && selected ? (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">{selected.title}</h2>
            <Badge>{selected.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{selected.description || "Sem descrição"}</p>
          <p className="text-xs text-muted-foreground">Prioridade: {selected.priority} • Criado em {new Date(selected.created_at).toLocaleDateString("pt-BR")}</p>
        </Card>
      ) : view === "kanban" ? (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {STATUSES.map(status => {
            const statusTickets = tickets!.filter(t => t.status === status.toLowerCase().replace(/ /g, "_") || (status === "Aberto" && t.status === "open") || (status === "Em Andamento" && t.status === "in_progress") || (status === "Aguardando" && t.status === "waiting") || (status === "Resolvido" && t.status === "resolved"));
            return (
              <div key={status} className="min-w-[220px] max-w-[240px] flex-shrink-0">
                <div className="rounded-t-lg px-3 py-2 text-xs font-semibold bg-secondary">{status} ({statusTickets.length})</div>
                <div className="bg-muted/30 rounded-b-lg p-2 space-y-2 min-h-[120px] border border-t-0 border-border/50">
                  {statusTickets.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Nenhum</p>}
                  {statusTickets.map(t => (
                    <Card key={t.id} className="p-3 cursor-pointer hover:shadow-sm" onClick={() => { setSelectedId(t.id); setView("detail"); }}>
                      <p className="text-sm font-medium">{t.title}</p>
                      <p className="text-xs text-muted-foreground">{t.priority} • {new Date(t.created_at).toLocaleDateString("pt-BR")}</p>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50"><th className="text-left py-3 px-4">Título</th><th className="text-left py-3 px-4">Status</th><th className="text-left py-3 px-4">Prioridade</th><th className="text-left py-3 px-4">Data</th></tr></thead>
            <tbody>
              {tickets!.map(t => (
                <tr key={t.id} className="border-b hover:bg-muted/30 cursor-pointer" onClick={() => { setSelectedId(t.id); setView("detail"); }}>
                  <td className="py-3 px-4 font-medium">{t.title}</td>
                  <td className="py-3 px-4"><Badge variant="outline">{t.status}</Badge></td>
                  <td className="py-3 px-4">{t.priority}</td>
                  <td className="py-3 px-4 text-muted-foreground">{new Date(t.created_at).toLocaleDateString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Novo Chamado</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Input placeholder="Título do chamado *" value={newTitle} onChange={e => setNewTitle(e.target.value)} /></div>
            <Select value={newPriority} onValueChange={setNewPriority}>
              <SelectTrigger><SelectValue placeholder="Prioridade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="medium">Normal</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
              </SelectContent>
            </Select>
            <Textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Descrição do chamado" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button>
            <Button onClick={handleCreate}>Criar Chamado</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
