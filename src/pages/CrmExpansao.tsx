import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Inbox, Plus, TrendingUp, LayoutGrid, List, Settings, Upload, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useCrmLeads, useCrmLeadMutations } from "@/hooks/useCrmLeads";
import { useCrmFunnels } from "@/hooks/useCrmFunnels";
import { useCrmTasks } from "@/hooks/useCrmTasks";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type ViewType = "kanban" | "list";

const STAGES_FRANCHISE = ["Novo Lead", "Contato Feito", "Reunião Agendada", "Diagnóstico", "Proposta Enviada", "Negociação", "Venda", "Oportunidade Perdida"];
const STAGES_CLIENTS = ["Novo Lead", "Contato Feito", "Reunião Agendada", "Proposta Enviada", "Negociação", "Venda", "Oportunidade Perdida"];

export default function CrmExpansao() {
  const { toast } = useToast();
  const [view, setView] = useState<ViewType>("kanban");
  const [activeFunnel, setActiveFunnel] = useState<"franchise" | "clients">("franchise");
  const [searchQuery, setSearchQuery] = useState("");
  const [newLeadDialog, setNewLeadDialog] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newSource, setNewSource] = useState("");

  const { data: leads, isLoading } = useCrmLeads();
  const { data: tasks } = useCrmTasks();
  const { createLead, updateLead, deleteLead } = useCrmLeadMutations();

  const stages = activeFunnel === "franchise" ? STAGES_FRANCHISE : STAGES_CLIENTS;

  const filteredLeads = (leads ?? []).filter(l => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!l.name.toLowerCase().includes(q) && !(l.email || "").toLowerCase().includes(q) && !(l.phone || "").includes(q)) return false;
    }
    return true;
  });

  const handleCreateLead = () => {
    if (!newName.trim()) {
      toast({ title: "Informe o nome do lead", variant: "destructive" });
      return;
    }
    createLead.mutate({
      name: newName,
      email: newEmail || undefined,
      phone: newPhone || undefined,
      company: newCompany || undefined,
      source: newSource || undefined,
      stage: "Novo Lead",
      tags: [activeFunnel],
    });
    setNewLeadDialog(false);
    setNewName(""); setNewEmail(""); setNewPhone(""); setNewCompany(""); setNewSource("");
    toast({ title: "Lead criado com sucesso" });
  };

  const handleMoveLead = (leadId: string, newStage: string) => {
    updateLead.mutate({ id: leadId, stage: newStage });
    toast({ title: "Lead movido", description: `Movido para "${newStage}"` });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <div className="flex gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-64 w-64 flex-shrink-0" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-primary" />
            <h1 className="page-header-title">CRM Expansão</h1>
            <Badge variant="outline">Franqueadora</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Gestão de leads e oportunidades da rede</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex bg-muted rounded-lg p-0.5">
          <button className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeFunnel === "franchise" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`} onClick={() => setActiveFunnel("franchise")}>Franquia</button>
          <button className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeFunnel === "clients" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`} onClick={() => setActiveFunnel("clients")}>Clientes</button>
        </div>
        <div className="flex bg-muted rounded-lg p-0.5">
          <button className={`px-3 py-1.5 rounded-md text-sm transition-colors flex items-center gap-1.5 ${view === "kanban" ? "bg-card shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"}`} onClick={() => setView("kanban")}><LayoutGrid className="w-4 h-4" /> Kanban</button>
          <button className={`px-3 py-1.5 rounded-md text-sm transition-colors flex items-center gap-1.5 ${view === "list" ? "bg-card shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"}`} onClick={() => setView("list")}><List className="w-4 h-4" /> Lista</button>
        </div>
        <div className="flex-1" />
        <Button size="sm" onClick={() => setNewLeadDialog(true)}><Plus className="w-4 h-4 mr-1" /> Novo Lead</Button>
      </div>

      {/* Search */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar lead..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8 h-8 w-48 text-sm" />
        </div>
        {searchQuery && (
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setSearchQuery("")}><X className="w-3 h-3 mr-1" /> Limpar</Button>
        )}
      </div>

      {/* Content */}
      {filteredLeads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Inbox className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-1">Nenhum lead encontrado</h3>
          <p className="text-sm text-muted-foreground mb-4">Crie seu primeiro lead para começar a prospectar.</p>
          <Button onClick={() => setNewLeadDialog(true)}><Plus className="w-4 h-4 mr-1" /> Novo Lead</Button>
        </div>
      ) : view === "kanban" ? (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {stages.map(stage => {
            const stageLeads = filteredLeads.filter(l => l.stage === stage);
            return (
              <div key={stage} className="min-w-[220px] max-w-[240px] flex-shrink-0">
                <div className="rounded-t-lg px-3 py-2 text-xs font-semibold bg-secondary text-foreground">
                  {stage} ({stageLeads.length})
                </div>
                <div className="bg-muted/30 rounded-b-lg p-2 space-y-2 min-h-[120px] border border-t-0 border-border/50">
                  {stageLeads.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Nenhum lead</p>}
                  {stageLeads.map(l => (
                    <Card key={l.id} className="p-3 space-y-1 cursor-pointer hover:shadow-sm transition-shadow">
                      <p className="text-sm font-medium">{l.name}</p>
                      {l.company && <p className="text-xs text-muted-foreground">{l.company}</p>}
                      {l.value && l.value > 0 && <p className="text-xs text-primary font-medium">R$ {Number(l.value).toLocaleString("pt-BR")}</p>}
                      {l.source && <Badge variant="outline" className="text-[10px]">{l.source}</Badge>}
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
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left py-3 px-4 font-medium">Nome</th>
                <th className="text-left py-3 px-4 font-medium">Empresa</th>
                <th className="text-left py-3 px-4 font-medium">Estágio</th>
                <th className="text-left py-3 px-4 font-medium">Origem</th>
                <th className="text-right py-3 px-4 font-medium">Valor</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map(l => (
                <tr key={l.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="py-3 px-4 font-medium">{l.name}</td>
                  <td className="py-3 px-4 text-muted-foreground">{l.company || "—"}</td>
                  <td className="py-3 px-4"><Badge variant="outline" className="text-[10px]">{l.stage}</Badge></td>
                  <td className="py-3 px-4 text-muted-foreground">{l.source || "—"}</td>
                  <td className="py-3 px-4 text-right">{l.value && Number(l.value) > 0 ? `R$ ${Number(l.value).toLocaleString("pt-BR")}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New Lead Dialog */}
      <Dialog open={newLeadDialog} onOpenChange={setNewLeadDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Novo Lead</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Nome *</Label><Input value={newName} onChange={e => setNewName(e.target.value)} /></div>
              <div><Label>Telefone</Label><Input value={newPhone} onChange={e => setNewPhone(e.target.value)} /></div>
              <div><Label>Email</Label><Input value={newEmail} onChange={e => setNewEmail(e.target.value)} /></div>
              <div><Label>Empresa</Label><Input value={newCompany} onChange={e => setNewCompany(e.target.value)} /></div>
            </div>
            <div>
              <Label>Origem</Label>
              <Select value={newSource} onValueChange={setNewSource}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Orgânico">Orgânico</SelectItem>
                  <SelectItem value="Indicação">Indicação</SelectItem>
                  <SelectItem value="Ads">Ads</SelectItem>
                  <SelectItem value="Evento">Evento</SelectItem>
                  <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewLeadDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreateLead}>Criar Lead</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
