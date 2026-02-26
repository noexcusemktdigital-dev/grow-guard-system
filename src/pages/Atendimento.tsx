import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Inbox, Plus, MessageSquare, LayoutGrid, List, Settings, ArrowLeft, Clock, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useSupportTickets, useSupportTicketMutations } from "@/hooks/useSupportTickets";
import { AtendimentoConfig } from "@/components/atendimento/AtendimentoConfig";
import { useToast } from "@/hooks/use-toast";

type View = "kanban" | "list" | "detail";

const STATUSES = [
  { key: "open", label: "Aberto", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  { key: "in_progress", label: "Em Andamento", color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" },
  { key: "waiting", label: "Aguardando", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
  { key: "resolved", label: "Resolvido", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
];

const PRIORITIES = [
  { key: "low", label: "Baixa" },
  { key: "medium", label: "Normal" },
  { key: "high", label: "Alta" },
  { key: "urgent", label: "Urgente" },
];

export default function Atendimento() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"chamados" | "config">("chamados");
  const [view, setView] = useState<View>("kanban");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [newCategory, setNewCategory] = useState("");
  const [replyText, setReplyText] = useState("");

  const { data: tickets, isLoading } = useSupportTickets();
  const { createTicket, updateTicket } = useSupportTicketMutations();

  const selected = (tickets ?? []).find(t => t.id === selectedId);

  const handleCreate = () => {
    if (!newTitle.trim()) { toast({ title: "Informe o título", variant: "destructive" }); return; }
    createTicket.mutate({ title: newTitle, description: newDesc, priority: newPriority, category: newCategory || undefined });
    setShowNew(false);
    setNewTitle(""); setNewDesc(""); setNewCategory("");
    toast({ title: "Chamado criado com sucesso" });
  };

  const handleStatusChange = (id: string, status: string) => {
    updateTicket.mutate({ id, status });
    toast({ title: `Status atualizado para ${STATUSES.find(s => s.key === status)?.label || status}` });
  };

  if (isLoading) return <div className="space-y-6"><Skeleton className="h-12 w-full" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {view === "detail" && activeTab === "chamados" && (
            <Button variant="ghost" size="icon" onClick={() => { setView("kanban"); setSelectedId(null); }}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <h1 className="page-header-title">Central de Atendimento</h1>
              <Badge variant="secondary" className="text-[10px]">Franqueadora</Badge>
            </div>
            <p className="text-sm text-muted-foreground">Central de suporte e chamados da rede</p>
          </div>
        </div>
        {activeTab === "chamados" && view !== "detail" && (
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border bg-muted/30 p-0.5">
              <Button variant={view === "kanban" ? "default" : "ghost"} size="sm" className="gap-1 h-7" onClick={() => setView("kanban")}>
                <LayoutGrid className="w-3.5 h-3.5" /> Kanban
              </Button>
              <Button variant={view === "list" ? "default" : "ghost"} size="sm" className="gap-1 h-7" onClick={() => setView("list")}>
                <List className="w-3.5 h-3.5" /> Lista
              </Button>
            </div>
            <Button size="sm" className="gap-1 h-7" onClick={() => setShowNew(true)}>
              <Plus className="w-3.5 h-3.5" /> Novo Chamado
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="chamados" className="gap-1.5"><MessageSquare className="w-3.5 h-3.5" /> Chamados</TabsTrigger>
          <TabsTrigger value="config" className="gap-1.5"><Settings className="w-3.5 h-3.5" /> Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="chamados" className="mt-4">
          {(tickets ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Inbox className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-1">Nenhum chamado</h3>
              <p className="text-sm text-muted-foreground mb-4">Crie o primeiro chamado de suporte.</p>
              <Button onClick={() => setShowNew(true)}><Plus className="w-4 h-4 mr-1" /> Novo Chamado</Button>
            </div>
          ) : view === "detail" && selected ? (
            <Card className="p-6 space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-lg font-bold">{selected.title}</h2>
                <div className="flex items-center gap-2">
                  <Select value={selected.status} onValueChange={(v) => handleStatusChange(selected.id, v)}>
                    <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map(s => <SelectItem key={s.key} value={s.key} className="text-xs">{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Badge variant="outline" className="text-xs">{PRIORITIES.find(p => p.key === selected.priority)?.label || selected.priority}</Badge>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">{selected.description || "Sem descrição"}</div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Criado em {new Date(selected.created_at).toLocaleDateString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                {selected.category && <span>Categoria: {selected.category}</span>}
              </div>

              <Separator />

              {/* Timeline */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Timeline</h3>
                <div className="border-l-2 border-border pl-4 space-y-4">
                  <div className="relative">
                    <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                    <p className="text-xs text-muted-foreground">{new Date(selected.created_at).toLocaleDateString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
                    <p className="text-sm">Chamado aberto</p>
                  </div>
                  {selected.closed_at && (
                    <div className="relative">
                      <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-green-500 border-2 border-background" />
                      <p className="text-xs text-muted-foreground">{new Date(selected.closed_at).toLocaleDateString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
                      <p className="text-sm">Chamado resolvido</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ) : view === "kanban" ? (
            <div className="flex gap-3 overflow-x-auto pb-4">
              {STATUSES.map(status => {
                const statusTickets = tickets!.filter(t => t.status === status.key);
                return (
                  <div key={status.key} className="min-w-[220px] max-w-[260px] flex-shrink-0">
                    <div className={`rounded-t-lg px-3 py-2 text-xs font-semibold ${status.color}`}>{status.label} ({statusTickets.length})</div>
                    <div className="bg-muted/30 rounded-b-lg p-2 space-y-2 min-h-[120px] border border-t-0 border-border/50">
                      {statusTickets.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Nenhum</p>}
                      {statusTickets.map(t => (
                        <Card key={t.id} className="p-3 cursor-pointer hover:shadow-sm" onClick={() => { setSelectedId(t.id); setView("detail"); }}>
                          <p className="text-sm font-medium">{t.title}</p>
                          <div className="flex items-center justify-between mt-1">
                            <Badge variant="outline" className="text-[9px]">{PRIORITIES.find(p => p.key === t.priority)?.label || t.priority}</Badge>
                            <span className="text-[10px] text-muted-foreground">{new Date(t.created_at).toLocaleDateString("pt-BR")}</span>
                          </div>
                          {t.category && <p className="text-[10px] text-muted-foreground mt-1">{t.category}</p>}
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
                <thead><tr className="border-b bg-muted/50">
                  <th className="text-left py-3 px-4">Título</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Prioridade</th>
                  <th className="text-left py-3 px-4">Categoria</th>
                  <th className="text-left py-3 px-4">Data</th>
                </tr></thead>
                <tbody>
                  {tickets!.map(t => (
                    <tr key={t.id} className="border-b hover:bg-muted/30 cursor-pointer" onClick={() => { setSelectedId(t.id); setView("detail"); }}>
                      <td className="py-3 px-4 font-medium">{t.title}</td>
                      <td className="py-3 px-4"><Badge className={`${STATUSES.find(s => s.key === t.status)?.color || ""} border-0 text-[10px]`}>{STATUSES.find(s => s.key === t.status)?.label || t.status}</Badge></td>
                      <td className="py-3 px-4">{PRIORITIES.find(p => p.key === t.priority)?.label || t.priority}</td>
                      <td className="py-3 px-4 text-muted-foreground">{t.category || "—"}</td>
                      <td className="py-3 px-4 text-muted-foreground">{new Date(t.created_at).toLocaleDateString("pt-BR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="config" className="mt-4">
          <AtendimentoConfig />
        </TabsContent>
      </Tabs>

      {/* New Ticket Dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Novo Chamado</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Título *</Label><Input placeholder="Título do chamado" value={newTitle} onChange={e => setNewTitle(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Prioridade</Label>
                <Select value={newPriority} onValueChange={setNewPriority}>
                  <SelectTrigger><SelectValue placeholder="Prioridade" /></SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map(p => <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Categoria</Label>
                <Input value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="Ex: Financeiro" />
              </div>
            </div>
            <div><Label>Descrição</Label><Textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Descrição do chamado" /></div>
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
