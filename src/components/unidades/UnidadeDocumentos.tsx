import { useState } from "react";
import { Plus, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { UnidadeDoc, DocType, DocVisibility } from "@/types/unidades";

const docTypes: DocType[] = ["Contrato de franquia", "Documentos administrativos", "Arquivos internos", "Outros"];
const visibilities: DocVisibility[] = ["Somente Franqueadora", "Ambos"];

interface Props {
  docs: UnidadeDoc[];
  unidadeId: string;
  onUpdate: (docs: UnidadeDoc[]) => void;
}

const emptyDoc = (unidadeId: string): Omit<UnidadeDoc, "id"> => ({
  unidadeId, tipo: "Contrato de franquia", nome: "", data: new Date().toISOString().slice(0, 10), visibilidade: "Ambos", observacao: "",
});

const typeColors: Record<DocType, string> = {
  "Contrato de franquia": "bg-blue-500/10 text-blue-500 border-blue-500/20",
  "Documentos administrativos": "bg-amber-500/10 text-amber-500 border-amber-500/20",
  "Arquivos internos": "bg-purple-500/10 text-purple-500 border-purple-500/20",
  "Outros": "bg-muted text-muted-foreground",
};

export function UnidadeDocumentos({ docs, unidadeId, onUpdate }: Props) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyDoc(unidadeId));
  const [fileName, setFileName] = useState("");
  const { toast } = useToast();

  const handleSave = () => {
    if (!form.nome && !fileName) {
      toast({ title: "Informe o nome do documento", variant: "destructive" });
      return;
    }
    const nome = form.nome || fileName;
    onUpdate([...docs, { ...form, nome, id: `ud${Date.now()}` }]);
    setForm(emptyDoc(unidadeId));
    setFileName("");
    setOpen(false);
    toast({ title: "Documento adicionado!" });
  };

  const handleRemove = (id: string) => {
    onUpdate(docs.filter(d => d.id !== id));
    toast({ title: "Documento removido." });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)} className="gap-2"><Plus className="w-4 h-4" /> Novo Documento</Button>
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Visibilidade</TableHead>
              <TableHead>Observação</TableHead>
              <TableHead className="text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {docs.map(d => (
              <TableRow key={d.id}>
                <TableCell><Badge variant="outline" className={typeColors[d.tipo]}>{d.tipo}</Badge></TableCell>
                <TableCell className="font-medium flex items-center gap-2"><FileText className="w-4 h-4 text-muted-foreground" />{d.nome}</TableCell>
                <TableCell>{new Date(d.data).toLocaleDateString("pt-BR")}</TableCell>
                <TableCell>{d.visibilidade}</TableCell>
                <TableCell className="max-w-[200px] truncate">{d.observacao || "—"}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleRemove(d.id)} aria-label="Excluir"><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Documento</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v as DocType }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{docTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Nome do documento</Label><Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Nome ou será usado o nome do arquivo" /></div>
            <div className="space-y-1.5"><Label>Data</Label><Input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} /></div>
            <div className="space-y-1.5">
              <Label>Upload (simulado)</Label>
              <Input type="file" onChange={e => { const file = e.target.files?.[0]; if (file) setFileName(file.name); }} />
            </div>
            <div className="space-y-1.5">
              <Label>Visibilidade</Label>
              <Select value={form.visibilidade} onValueChange={v => setForm(f => ({ ...f, visibilidade: v as DocVisibility }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{visibilities.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Observação</Label><Textarea value={form.observacao} onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
