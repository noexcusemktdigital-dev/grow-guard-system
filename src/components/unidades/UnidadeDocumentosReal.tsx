// @ts-nocheck
import { useState } from "react";
import { Plus, Trash2, FileText, Download, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useUnitDocuments, useUnitDocumentMutations } from "@/hooks/useUnitDocuments";
import { toast } from "sonner";
import { reportError } from "@/lib/error-toast";
import { useAuth } from "@/contexts/AuthContext";

const docTypes = ["Contrato de franquia", "Documentos administrativos", "Arquivos internos", "Outros"];

const typeColors: Record<string, string> = {
  "Contrato de franquia": "bg-blue-500/10 text-blue-500 border-blue-500/20",
  "Documentos administrativos": "bg-amber-500/10 text-amber-500 border-amber-500/20",
  "Arquivos internos": "bg-purple-500/10 text-purple-500 border-purple-500/20",
  "Outros": "bg-muted text-muted-foreground",
};

interface Props {
  unitId: string;
  isFranqueadoView?: boolean;
}

export function UnidadeDocumentosReal({ unitId, isFranqueadoView }: Props) {
  const { data: docs, isLoading } = useUnitDocuments(unitId);
  const { uploadAndCreate, deleteDoc } = useUnitDocumentMutations(unitId);
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({ name: "", type: "Outros", visibility: "both", notes: "" });

  const handleSave = () => {
    if (!file) {
      reportError(new Error("Selecione um arquivo para upload"), { title: "Selecione um arquivo para upload", category: "documentos.upload_missing" });
      return;
    }
    const name = form.name || file.name;
    uploadAndCreate.mutate(
      { file, name, type: form.type, visibility: form.visibility, notes: form.notes },
      {
        onSuccess: () => {
          toast.success("Documento adicionado!");
          setOpen(false);
          setFile(null);
          setForm({ name: "", type: "Outros", visibility: "both", notes: "" });
        },
        onError: (e) => reportError(e, { title: "Erro ao adicionar documento", category: "documentos.upload" }),
      }
    );
  };

  const handleDelete = (id: string) => {
    deleteDoc.mutate(id, {
      onSuccess: () => toast.success("Documento removido."),
      onError: (e) => reportError(e, { title: "Erro ao remover documento", category: "documentos.delete" }),
    });
  };

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  // For franchisee view, filter out franqueadora_only docs
  const visibleDocs = isFranqueadoView
    ? (docs || []).filter((d: { visibility?: string }) => d.visibility !== "franqueadora_only")
    : docs;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)} className="gap-2"><Plus className="w-4 h-4" /> Novo Documento</Button>
      </div>

      {(!visibleDocs || visibleDocs.length === 0) ? (
        <Card className="p-8 text-center text-muted-foreground">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>Nenhum documento cadastrado para esta unidade.</p>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Nome</TableHead>
                {!isFranqueadoView && <TableHead>Visibilidade</TableHead>}
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleDocs.map((d: { id: string; type: string; name: string; visibility?: string; created_at: string; file_url?: string; uploaded_by?: string }) => {
                // Franchisee can only delete docs they uploaded
                const canDelete = isFranqueadoView ? d.uploaded_by === user?.id : true;
                return (
                  <TableRow key={d.id}>
                    <TableCell>
                      <Badge variant="outline" className={typeColors[d.type] || typeColors["Outros"]}>{d.type}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    {!isFranqueadoView && (
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          {d.visibility === "franqueadora_only" ? <><EyeOff className="w-3 h-3" /> Franqueadora</> : <><Eye className="w-3 h-3" /> Ambos</>}
                        </Badge>
                      </TableCell>
                    )}
                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(d.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      {d.file_url && (
                        <Button variant="ghost" size="icon" asChild aria-label="Baixar">
                          <a href={d.file_url} target="_blank" rel="noopener noreferrer"><Download className="w-4 h-4" /></a>
                        </Button>
                      )}
                      {canDelete && (
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(d.id)} disabled={deleteDoc.isPending} aria-label="Excluir">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </div>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Documento</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{docTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Nome do documento</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Será usado o nome do arquivo se vazio" />
            </div>
            <div className="space-y-1.5">
              <Label>Arquivo</Label>
              <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </div>
            {!isFranqueadoView && (
              <div className="space-y-1.5">
                <Label>Visibilidade</Label>
                <Select value={form.visibility} onValueChange={(v) => setForm((f) => ({ ...f, visibility: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">Ambos (Franqueadora + Unidade)</SelectItem>
                    <SelectItem value="franqueadora_only">Somente Franqueadora</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Observação</Label>
              <Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={uploadAndCreate.isPending}>
              {uploadAndCreate.isPending ? "Enviando..." : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
