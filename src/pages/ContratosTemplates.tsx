import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Copy, CheckCircle2, Clock } from "lucide-react";
import {
  ContratoTemplate, ContratoTipo, mockTemplates, PLACEHOLDERS_DISPONIVEIS,
} from "@/data/contratosData";

export default function ContratosTemplates() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<ContratoTemplate[]>(mockTemplates);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Partial<ContratoTemplate> | null>(null);

  function openCreate() {
    setEditing({ nome: "", tipo: "Assessoria", descricao: "", conteudo: "", placeholders: [], aprovado: false });
    setDialogOpen(true);
  }
  function openEdit(t: ContratoTemplate) {
    setEditing({ ...t });
    setDialogOpen(true);
  }
  function handleSave() {
    if (!editing?.nome || !editing?.conteudo) { toast({ title: "Preencha nome e conteúdo", variant: "destructive" }); return; }
    if (editing.id) {
      setTemplates(prev => prev.map(t => t.id === editing.id ? { ...t, ...editing } as ContratoTemplate : t));
      toast({ title: "Template atualizado" });
    } else {
      const novo: ContratoTemplate = {
        ...(editing as ContratoTemplate),
        id: `tpl-${Date.now()}`,
        criadoEm: new Date().toISOString().slice(0, 10),
      };
      setTemplates(prev => [...prev, novo]);
      toast({ title: "Template criado" });
    }
    setDialogOpen(false);
  }
  function handleDelete() {
    if (!deleteId) return;
    setTemplates(prev => prev.filter(t => t.id !== deleteId));
    setDeleteId(null);
    toast({ title: "Template excluído" });
  }
  function copyPlaceholder(p: string) {
    navigator.clipboard.writeText(p);
    toast({ title: `Copiado: ${p}` });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header-title">Templates de Contratos</h1>
          <Badge variant="secondary" className="mt-1">Franqueadora (acesso total)</Badge>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-1" />Novo Template</Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Template List */}
        <div className="md:col-span-2 space-y-3">
          {templates.map(t => (
            <Card key={t.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{t.nome}</h3>
                    {t.aprovado ? (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-[10px]"><CheckCircle2 className="w-3 h-3 mr-0.5" />Aprovado</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]"><Clock className="w-3 h-3 mr-0.5" />Rascunho</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{t.descricao}</p>
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    <span>Tipo: {t.tipo}</span>
                    <span>•</span>
                    <span>Criado: {t.criadoEm}</span>
                    <span>•</span>
                    <span>{t.placeholders.length} variáveis</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(t)}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(t.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            </Card>
          ))}
          {templates.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhum template cadastrado</p>}
        </div>

        {/* Placeholders Panel */}
        <Card className="p-4 h-fit sticky top-4">
          <h3 className="font-semibold mb-3 text-sm">Variáveis Disponíveis</h3>
          <p className="text-xs text-muted-foreground mb-3">Clique para copiar</p>
          <div className="space-y-1.5">
            {PLACEHOLDERS_DISPONIVEIS.map(p => (
              <button
                key={p}
                onClick={() => copyPlaceholder(p)}
                className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded text-xs font-mono hover:bg-muted transition-colors"
              >
                <Copy className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                {p}
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? "Editar Template" : "Novo Template"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Nome *</Label><Input value={editing.nome || ""} onChange={e => setEditing({ ...editing, nome: e.target.value })} /></div>
                <div><Label>Tipo</Label>
                  <Select value={editing.tipo} onValueChange={v => setEditing({ ...editing, tipo: v as ContratoTipo })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{(["Assessoria","SaaS","Sistema","Franquia"] as ContratoTipo[]).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Descrição</Label><Input value={editing.descricao || ""} onChange={e => setEditing({ ...editing, descricao: e.target.value })} /></div>
              <div><Label>Conteúdo *</Label><Textarea rows={12} className="font-mono text-xs" value={editing.conteudo || ""} onChange={e => setEditing({ ...editing, conteudo: e.target.value })} placeholder="Use variáveis como {{cliente_nome}}, {{valor_mensal}}..." /></div>
              <div className="flex items-center gap-2">
                <Switch checked={editing.aprovado || false} onCheckedChange={v => setEditing({ ...editing, aprovado: v })} />
                <Label>Aprovado para uso</Label>
              </div>
            </div>
          )}
          <DialogFooter><Button onClick={handleSave}>{editing?.id ? "Salvar" : "Criar Template"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir template?</AlertDialogTitle>
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
