import { useState } from "react";
import { Inbox, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { useContracts, useContractTemplates, useContractMutations } from "@/hooks/useContracts";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function ContratosGerador() {
  const { toast } = useToast();
  const { data: templates, isLoading } = useContractTemplates();
  const { createContract } = useContractMutations();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [signerName, setSignerName] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [templateId, setTemplateId] = useState("");

  const handleCreate = () => {
    if (!title.trim()) { toast({ title: "Informe o título", variant: "destructive" }); return; }
    createContract.mutate({ title, signer_name: signerName, signer_email: signerEmail, template_id: templateId || undefined });
    setDialogOpen(false);
    setTitle(""); setSignerName(""); setSignerEmail("");
    toast({ title: "Contrato criado com sucesso" });
  };

  if (isLoading) return <div className="space-y-6"><Skeleton className="h-12 w-full" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header-title">Criar Contratos</h1>
          <Badge variant="secondary" className="mt-1">Franqueadora</Badge>
        </div>
        <Button onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4 mr-1" /> Novo Contrato</Button>
      </div>

      {(templates ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Inbox className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-1">Nenhum template disponível</h3>
          <p className="text-sm text-muted-foreground mb-4">Crie templates antes de gerar contratos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates!.map(t => (
            <Card key={t.id} className="p-4 cursor-pointer hover:shadow-md" onClick={() => { setTemplateId(t.id); setDialogOpen(true); }}>
              <h3 className="font-semibold">{t.name}</h3>
              <Badge variant={t.is_active ? "default" : "secondary"} className="text-[10px] mt-1">{t.is_active ? "Ativo" : "Inativo"}</Badge>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Novo Contrato</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Título *</Label><Input value={title} onChange={e => setTitle(e.target.value)} /></div>
            <div><Label>Nome do Signatário</Label><Input value={signerName} onChange={e => setSignerName(e.target.value)} /></div>
            <div><Label>Email do Signatário</Label><Input value={signerEmail} onChange={e => setSignerEmail(e.target.value)} /></div>
            {(templates ?? []).length > 0 && (
              <div><Label>Template</Label>
                <Select value={templateId} onValueChange={setTemplateId}>
                  <SelectTrigger><SelectValue placeholder="Selecionar template" /></SelectTrigger>
                  <SelectContent>{templates!.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
