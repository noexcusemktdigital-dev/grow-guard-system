import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Pencil, Trash2, Eye, LayoutGrid, List, X, Upload, FolderOpen, Paperclip, ChevronDown, Folder,
} from "lucide-react";
import ContratosRepositorio from "@/components/ContratosRepositorio";
import {
  Contrato, ContratoStatus, ContratoTipo, ContratoDono, ContratoRecorrencia,
  mockContratos, CONTRATO_STATUS_LIST, CONTRATO_STATUS_COLORS,
  FRANQUEADOS_LIST, getNextContratoNumero,
} from "@/data/contratosData";

const FOLDER_COLORS: Record<string, string> = {
  "Assessoria": "text-blue-600 dark:text-blue-400",
  "SaaS": "text-purple-600 dark:text-purple-400",
  "Sistema": "text-amber-600 dark:text-amber-400",
  "Franquia": "text-emerald-600 dark:text-emerald-400",
  "Ativos": "text-green-600 dark:text-green-400",
  "Em andamento": "text-yellow-600 dark:text-yellow-400",
  "Inativos": "text-red-600 dark:text-red-400",
  "Internos": "text-muted-foreground",
};

type GroupBy = "franqueado" | "tipo" | "status";

function groupContratos(contratos: Contrato[], groupBy: GroupBy): Record<string, Contrato[]> {
  const groups: Record<string, Contrato[]> = {};
  contratos.forEach(c => {
    let key: string;
    if (groupBy === "franqueado") {
      key = c.franqueadoNome || "Internos";
    } else if (groupBy === "tipo") {
      key = c.tipo;
    } else {
      if (c.status === "Assinado") key = "Ativos";
      else if (["Vencido", "Cancelado"].includes(c.status)) key = "Inativos";
      else key = "Em andamento";
    }
    if (!groups[key]) groups[key] = [];
    groups[key].push(c);
  });
  return groups;
}

function PastasView({ contratos, onView, onEdit, onDelete }: {
  contratos: Contrato[];
  onView: (c: Contrato) => void;
  onEdit: (c: Contrato) => void;
  onDelete: (id: string) => void;
}) {
  const [groupBy, setGroupBy] = useState<GroupBy>("franqueado");
  const groups = groupContratos(contratos, groupBy);
  const sortedKeys = Object.keys(groups).sort((a, b) => a === "Internos" ? 1 : b === "Internos" ? -1 : a.localeCompare(b));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Label className="text-sm whitespace-nowrap">Agrupar por:</Label>
        <Select value={groupBy} onValueChange={v => setGroupBy(v as GroupBy)}>
          <SelectTrigger className="w-[180px] h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="franqueado">Franqueado</SelectItem>
            <SelectItem value="tipo">Tipo</SelectItem>
            <SelectItem value="status">Status</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {sortedKeys.map(key => (
          <Collapsible key={key} defaultOpen>
            <CollapsibleTrigger className="flex items-center gap-2 w-full p-3 rounded-lg border border-border/50 bg-card hover:bg-accent/50 transition-colors">
              <ChevronDown className="w-4 h-4 transition-transform data-[state=closed]:-rotate-90" />
              <Folder className={`w-4 h-4 ${FOLDER_COLORS[key] || "text-muted-foreground"}`} />
              <span className="font-medium text-sm">{key}</span>
              <Badge variant="secondary" className="ml-auto text-[10px]">{groups[key].length}</Badge>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-2 pl-6">
                {groups[key].map(c => (
                  <div key={c.id} className="bg-card border border-border/50 rounded-lg p-3 space-y-1.5 hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-primary">{c.numero}</span>
                      <Badge className={`text-[10px] ${CONTRATO_STATUS_COLORS[c.status]}`}>{c.status}</Badge>
                    </div>
                    <p className="text-sm font-medium truncate">{c.clienteNome}</p>
                    <p className="text-xs text-muted-foreground">{c.tipo} • R$ {(c.valorMensal || c.valorTotal).toLocaleString("pt-BR")}</p>
                    <div className="flex gap-1 pt-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onView(c)}><Eye className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit(c)}><Pencil className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => onDelete(c.id)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
        {sortedKeys.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhum contrato encontrado</p>}
      </div>
    </div>
  );
}

const emptyContrato = (): Partial<Contrato> => ({
  tipo: "Assessoria", dono: "Interno", produto: "Assessoria", recorrencia: "Mensal",
  status: "Rascunho", valorMensal: 0, valorTotal: 0, observacoes: "",
  clienteNome: "", clienteDocumento: "", clienteEmail: "",
  dataInicio: "", dataFim: "",
});

export default function ContratosGerenciamento() {
  const { toast } = useToast();
  const [contratos, setContratos] = useState<Contrato[]>(mockContratos);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingContrato, setEditingContrato] = useState<Partial<Contrato> | null>(null);
  const [viewContrato, setViewContrato] = useState<Contrato | null>(null);
  const [arquivoNome, setArquivoNome] = useState("");

  // Filters
  const [fStatus, setFStatus] = useState<ContratoStatus | "">("");
  const [fDono, setFDono] = useState<ContratoDono | "">("");
  const [fProduto, setFProduto] = useState<ContratoTipo | "">("");
  const [fRecorrencia, setFRecorrencia] = useState<ContratoRecorrencia | "">("");
  const [fCliente, setFCliente] = useState("");
  const [fFranqueado, setFFranqueado] = useState("");

  const filtered = contratos.filter(c => {
    if (fStatus && c.status !== fStatus) return false;
    if (fDono && c.dono !== fDono) return false;
    if (fProduto && c.produto !== fProduto) return false;
    if (fRecorrencia && c.recorrencia !== fRecorrencia) return false;
    if (fCliente && !c.clienteNome.toLowerCase().includes(fCliente.toLowerCase())) return false;
    if (fFranqueado && c.franqueadoId !== fFranqueado) return false;
    return true;
  });

  const hasFilters = !!(fStatus || fDono || fProduto || fRecorrencia || fCliente || fFranqueado);

  function openCreate() {
    setEditingContrato(emptyContrato());
    setArquivoNome("");
    setDialogOpen(true);
  }
  function openEdit(c: Contrato) {
    setEditingContrato({ ...c });
    setArquivoNome(c.arquivoUrl || "");
    setDialogOpen(true);
  }
  function handleSave() {
    if (!editingContrato) return;
    if (!editingContrato.clienteNome || !editingContrato.dataInicio) {
      toast({ title: "Preencha os campos obrigatórios", variant: "destructive" });
      return;
    }
    if (editingContrato.id) {
      setContratos(prev => prev.map(c => c.id === editingContrato.id ? { ...c, ...editingContrato, arquivoUrl: arquivoNome || undefined, atualizadoEm: new Date().toISOString().slice(0, 10) } as Contrato : c));
      toast({ title: "Contrato atualizado" });
    } else {
      const novo: Contrato = {
        ...(editingContrato as Contrato),
        id: `ctr-${Date.now()}`,
        numero: getNextContratoNumero(contratos),
        arquivoUrl: arquivoNome || undefined,
        criadoEm: new Date().toISOString().slice(0, 10),
        atualizadoEm: new Date().toISOString().slice(0, 10),
      };
      setContratos(prev => [...prev, novo]);
      toast({ title: "Contrato criado" });
    }
    setDialogOpen(false);
  }
  function handleDelete() {
    if (!deleteId) return;
    setContratos(prev => prev.filter(c => c.id !== deleteId));
    setDeleteId(null);
    toast({ title: "Contrato excluído" });
  }

  const clearFilters = () => { setFStatus(""); setFDono(""); setFProduto(""); setFRecorrencia(""); setFCliente(""); setFFranqueado(""); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gerenciamento de Contratos</h1>
          <Badge variant="secondary" className="mt-1">Franqueadora (acesso total)</Badge>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-1" />Novo Contrato</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <Select value={fStatus} onValueChange={v => setFStatus(v as ContratoStatus)}>
          <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>{CONTRATO_STATUS_LIST.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={fDono} onValueChange={v => setFDono(v as ContratoDono)}>
          <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="Dono" /></SelectTrigger>
          <SelectContent>{(["Interno","Franqueado","Parceiro"] as ContratoDono[]).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={fProduto} onValueChange={v => setFProduto(v as ContratoTipo)}>
          <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="Produto" /></SelectTrigger>
          <SelectContent>{(["Assessoria","SaaS","Sistema","Franquia"] as ContratoTipo[]).map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={fRecorrencia} onValueChange={v => setFRecorrencia(v as ContratoRecorrencia)}>
          <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="Recorrência" /></SelectTrigger>
          <SelectContent>{(["Mensal","Anual","Unitária"] as ContratoRecorrencia[]).map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
        </Select>
        <Input placeholder="Cliente..." value={fCliente} onChange={e => setFCliente(e.target.value)} className="w-[150px] h-8 text-xs" />
        <Select value={fFranqueado} onValueChange={setFFranqueado}>
          <SelectTrigger className="w-[180px] h-8 text-xs"><SelectValue placeholder="Franqueado" /></SelectTrigger>
          <SelectContent>{FRANQUEADOS_LIST.map(f => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}</SelectContent>
        </Select>
        {hasFilters && <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs"><X className="w-3 h-3 mr-1" />Limpar</Button>}
      </div>

      <Tabs defaultValue="kanban">
        <TabsList>
          <TabsTrigger value="kanban"><LayoutGrid className="w-4 h-4 mr-1" />Kanban</TabsTrigger>
          <TabsTrigger value="lista"><List className="w-4 h-4 mr-1" />Lista</TabsTrigger>
          <TabsTrigger value="repositorio"><FolderOpen className="w-4 h-4 mr-1" />Repositório</TabsTrigger>
          <TabsTrigger value="pastas"><Folder className="w-4 h-4 mr-1" />Pastas</TabsTrigger>
        </TabsList>

        <TabsContent value="kanban">
          <div className="flex gap-3 overflow-x-auto pb-4">
            {CONTRATO_STATUS_LIST.map(status => {
              const cards = filtered.filter(c => c.status === status);
              return (
                <div key={status} className="min-w-[220px] max-w-[240px] flex-shrink-0">
                  <div className={`rounded-t-lg px-3 py-2 text-xs font-semibold ${CONTRATO_STATUS_COLORS[status]}`}>
                    {status} ({cards.length})
                  </div>
                  <div className="bg-muted/30 rounded-b-lg p-2 space-y-2 min-h-[120px] border border-t-0 border-border/50">
                    {cards.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Nenhum</p>}
                    {cards.map(c => (
                      <div key={c.id} className="bg-card border border-border/50 rounded-lg p-3 space-y-1 cursor-pointer hover:shadow-sm transition-shadow" onClick={() => { setViewContrato(c); setDetailOpen(true); }}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-primary">{c.numero}</span>
                          <Badge variant="outline" className="text-[10px] h-5">{c.produto}</Badge>
                        </div>
                        <p className="text-sm font-medium truncate">{c.clienteNome}</p>
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span>R$ {c.valorMensal > 0 ? c.valorMensal.toLocaleString("pt-BR") + "/m" : c.valorTotal.toLocaleString("pt-BR")}</span>
                          <div className="flex items-center gap-1">
                            {c.arquivoUrl && <Paperclip className="w-3 h-3" />}
                            <span>{c.dataInicio}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="lista">
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Fim</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs">{c.numero}</TableCell>
                    <TableCell className="font-medium">{c.clienteNome}</TableCell>
                    <TableCell className="text-xs">{c.tipo}</TableCell>
                    <TableCell className="text-xs">{c.produto}</TableCell>
                    <TableCell className="text-right text-xs">R$ {(c.valorMensal || c.valorTotal).toLocaleString("pt-BR")}</TableCell>
                    <TableCell><Badge className={`text-[10px] ${CONTRATO_STATUS_COLORS[c.status]}`}>{c.status}</Badge></TableCell>
                    <TableCell className="text-xs">{c.dataInicio}</TableCell>
                    <TableCell className="text-xs">{c.dataFim}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setViewContrato(c); setDetailOpen(true); }}><Eye className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(c.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Nenhum contrato encontrado</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="repositorio">
          <ContratosRepositorio
            contratos={filtered}
            onView={(c) => { setViewContrato(c); setDetailOpen(true); }}
            onEdit={openEdit}
            onDelete={setDeleteId}
          />
        </TabsContent>

        <TabsContent value="pastas">
          <PastasView
            contratos={filtered}
            onView={(c) => { setViewContrato(c); setDetailOpen(true); }}
            onEdit={openEdit}
            onDelete={setDeleteId}
          />
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Detalhes — {viewContrato?.numero}</DialogTitle></DialogHeader>
          {viewContrato && (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">Cliente:</span> {viewContrato.clienteNome}</div>
              <div><span className="text-muted-foreground">Documento:</span> {viewContrato.clienteDocumento}</div>
              <div><span className="text-muted-foreground">Tipo:</span> {viewContrato.tipo}</div>
              <div><span className="text-muted-foreground">Produto:</span> {viewContrato.produto}</div>
              <div><span className="text-muted-foreground">Dono:</span> {viewContrato.dono}</div>
              <div><span className="text-muted-foreground">Recorrência:</span> {viewContrato.recorrencia}</div>
              <div><span className="text-muted-foreground">Valor Mensal:</span> R$ {viewContrato.valorMensal.toLocaleString("pt-BR")}</div>
              <div><span className="text-muted-foreground">Valor Total:</span> R$ {viewContrato.valorTotal.toLocaleString("pt-BR")}</div>
              <div><span className="text-muted-foreground">Início:</span> {viewContrato.dataInicio}</div>
              <div><span className="text-muted-foreground">Fim:</span> {viewContrato.dataFim}</div>
              <div><span className="text-muted-foreground">Status:</span> <Badge className={`${CONTRATO_STATUS_COLORS[viewContrato.status]}`}>{viewContrato.status}</Badge></div>
              {viewContrato.franqueadoNome && <div><span className="text-muted-foreground">Franqueado:</span> {viewContrato.franqueadoNome}</div>}
              {viewContrato.arquivoUrl && <div className="col-span-2"><span className="text-muted-foreground">Anexo:</span> {viewContrato.arquivoUrl}</div>}
              {viewContrato.observacoes && <div className="col-span-2"><span className="text-muted-foreground">Obs:</span> {viewContrato.observacoes}</div>}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingContrato?.id ? "Editar Contrato" : "Novo Contrato"}</DialogTitle></DialogHeader>
          {editingContrato && (
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Cliente *</Label><Input value={editingContrato.clienteNome || ""} onChange={e => setEditingContrato({ ...editingContrato, clienteNome: e.target.value })} /></div>
              <div><Label>Documento</Label><Input value={editingContrato.clienteDocumento || ""} onChange={e => setEditingContrato({ ...editingContrato, clienteDocumento: e.target.value })} /></div>
              <div><Label>Email</Label><Input value={editingContrato.clienteEmail || ""} onChange={e => setEditingContrato({ ...editingContrato, clienteEmail: e.target.value })} /></div>
              <div><Label>Tipo</Label>
                <Select value={editingContrato.tipo} onValueChange={v => setEditingContrato({ ...editingContrato, tipo: v as ContratoTipo, produto: v as ContratoTipo })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{(["Assessoria","SaaS","Sistema","Franquia"] as ContratoTipo[]).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Dono</Label>
                <Select value={editingContrato.dono} onValueChange={v => setEditingContrato({ ...editingContrato, dono: v as ContratoDono })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{(["Interno","Franqueado","Parceiro"] as ContratoDono[]).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Recorrência</Label>
                <Select value={editingContrato.recorrencia} onValueChange={v => setEditingContrato({ ...editingContrato, recorrencia: v as ContratoRecorrencia })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{(["Mensal","Anual","Unitária"] as ContratoRecorrencia[]).map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {(editingContrato.dono === "Franqueado" || editingContrato.dono === "Parceiro") && (
                <div><Label>Franqueado</Label>
                  <Select value={editingContrato.franqueadoId || ""} onValueChange={v => { const f = FRANQUEADOS_LIST.find(x => x.id === v); setEditingContrato({ ...editingContrato, franqueadoId: v, franqueadoNome: f?.nome }); }}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{FRANQUEADOS_LIST.map(f => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              <div><Label>Status</Label>
                <Select value={editingContrato.status} onValueChange={v => setEditingContrato({ ...editingContrato, status: v as ContratoStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CONTRATO_STATUS_LIST.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Valor Mensal</Label><Input type="number" value={editingContrato.valorMensal || 0} onChange={e => setEditingContrato({ ...editingContrato, valorMensal: Number(e.target.value) })} /></div>
              <div><Label>Valor Total</Label><Input type="number" value={editingContrato.valorTotal || 0} onChange={e => setEditingContrato({ ...editingContrato, valorTotal: Number(e.target.value) })} /></div>
              <div><Label>Data Início *</Label><Input type="date" value={editingContrato.dataInicio || ""} onChange={e => setEditingContrato({ ...editingContrato, dataInicio: e.target.value })} /></div>
              <div><Label>Data Fim</Label><Input type="date" value={editingContrato.dataFim || ""} onChange={e => setEditingContrato({ ...editingContrato, dataFim: e.target.value })} /></div>
              <div><Label>Proposta Vinculada</Label><Input placeholder="ID ou referência da proposta" value={editingContrato.propostaVinculada || ""} onChange={e => setEditingContrato({ ...editingContrato, propostaVinculada: e.target.value })} /></div>
              <div>
                <Label>Anexo (contrato assinado)</Label>
                <div className="flex items-center gap-2">
                  <Input type="file" className="text-xs" onChange={e => { const f = e.target.files?.[0]; setArquivoNome(f ? f.name : ""); }} />
                  {arquivoNome && <span className="text-xs text-muted-foreground truncate max-w-[120px]">{arquivoNome}</span>}
                </div>
              </div>
              <div className="col-span-2"><Label>Observações</Label><Textarea value={editingContrato.observacoes || ""} onChange={e => setEditingContrato({ ...editingContrato, observacoes: e.target.value })} /></div>
            </div>
          )}
          <DialogFooter><Button onClick={handleSave}>{editingContrato?.id ? "Salvar" : "Criar Contrato"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir contrato?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
