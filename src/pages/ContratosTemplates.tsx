import { useState } from "react";
import { Inbox, Plus, Pencil, Trash2, CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useContractTemplates, useContractMutations } from "@/hooks/useContracts";
import { useToast } from "@/hooks/use-toast";

export default function ContratosTemplates() {
  const { toast } = useToast();
  const { data: templates, isLoading } = useContractTemplates();
  const { createTemplate } = useContractMutations();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");

  const handleSave = () => {
    if (!name.trim() || !content.trim()) { toast({ title: "Preencha nome e conteúdo", variant: "destructive" }); return; }
    createTemplate.mutate({ name, content });
    setDialogOpen(false);
    setName(""); setContent("");
    toast({ title: "Template criado" });
  };

  if (isLoading) return <div className="space-y-6"><Skeleton className="h-12 w-full" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header-title">Templates de Contratos</h1>
          <Badge variant="secondary" className="mt-1">Franqueadora</Badge>
        </div>
        <Button onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4 mr-1" /> Novo Template</Button>
      </div>

      {(templates ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Inbox className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-1">Nenhum template cadastrado</h3>
          <p className="text-sm text-muted-foreground mb-4">Crie o primeiro template de contrato.</p>
          <Button onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4 mr-1" /> Novo Template</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {templates!.map(t => (
            <Card key={t.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{t.name}</h3>
                    {t.is_active ? (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-[10px]"><CheckCircle2 className="w-3 h-3 mr-0.5" />Ativo</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]"><Clock className="w-3 h-3 mr-0.5" />Inativo</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Criado em {new Date(t.created_at).toLocaleDateString("pt-BR")}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Novo Template</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome *</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
            <div><Label>Conteúdo *</Label><Textarea rows={12} className="font-mono text-xs" value={content} onChange={e => setContent(e.target.value)} placeholder="Use variáveis como {{cliente_nome}}, {{valor_mensal}}..." /></div>
          </div>
          <DialogFooter><Button onClick={handleSave}>Criar Template</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
