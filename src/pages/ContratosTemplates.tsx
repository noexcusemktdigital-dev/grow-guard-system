import { useState, useRef } from "react";
import { Inbox, Plus, Pencil, CheckCircle2, Clock, Download, Eye, Code } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useContractTemplates, useContractMutations } from "@/hooks/useContracts";
import { useToast } from "@/hooks/use-toast";
import { DEFAULT_CONTRACT_TEMPLATES, getPlaceholdersForType, renderPreview } from "@/constants/contractTemplates";

const TEMPLATE_TYPES = [
  { value: "assessoria", label: "Assessoria" },
  { value: "saas", label: "SaaS" },
  { value: "sistema", label: "Sistema" },
  { value: "franquia", label: "Franquia" },
];

export default function ContratosTemplates() {
  const { toast } = useToast();
  const { data: templates, isLoading } = useContractTemplates();
  const { createTemplate, updateTemplate, seedDefaultTemplates } = useContractMutations();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [templateType, setTemplateType] = useState("assessoria");
  const [content, setContent] = useState("");
  const [editorTab, setEditorTab] = useState("editor");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const openNew = () => {
    setEditingId(null); setName(""); setDescription(""); setTemplateType("assessoria"); setContent("");
    setEditorTab("editor");
    setDialogOpen(true);
  };

  const openEdit = (t: any) => {
    setEditingId(t.id); setName(t.name); setDescription(t.description || ""); setTemplateType(t.template_type || "assessoria"); setContent(t.content || "");
    setEditorTab("editor");
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!name.trim()) { toast({ title: "Preencha o nome", variant: "destructive" }); return; }
    if (editingId) {
      updateTemplate.mutate({ id: editingId, name, description, template_type: templateType, content });
      toast({ title: "Template atualizado" });
    } else {
      createTemplate.mutate({ name, description, template_type: templateType, content });
      toast({ title: "Template criado" });
    }
    setDialogOpen(false);
  };

  const handleSeedDefaults = () => {
    seedDefaultTemplates.mutate(
      DEFAULT_CONTRACT_TEMPLATES.map(t => ({
        name: t.name,
        template_type: t.template_type,
        description: t.description,
        content: t.content,
      })),
      {
        onSuccess: (data) => {
          if (data.inserted === 0) {
            toast({ title: "Templates padrão já existem" });
          } else {
            toast({ title: `${data.inserted} template(s) padrão carregado(s)` });
          }
        },
        onError: () => {
          toast({ title: "Erro ao carregar templates", variant: "destructive" });
        },
      }
    );
  };

  const insertPlaceholder = (key: string) => {
    const ta = textareaRef.current;
    if (!ta) {
      setContent(prev => prev + key);
      return;
    }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const newContent = content.substring(0, start) + key + content.substring(end);
    setContent(newContent);
    setTimeout(() => {
      ta.focus();
      const newPos = start + key.length;
      ta.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const placeholders = getPlaceholdersForType(templateType);
  const groupedPlaceholders = placeholders.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {} as Record<string, typeof placeholders>);

  const previewContent = renderPreview(content, placeholders);

  if (isLoading) return <div className="space-y-6"><Skeleton className="h-12 w-full" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header-title">Templates de Contratos</h1>
          <p className="text-sm text-muted-foreground mt-1">Modelos base para os franqueados utilizarem</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSeedDefaults} disabled={seedDefaultTemplates.isPending}>
            <Download className="w-4 h-4 mr-1" />
            {seedDefaultTemplates.isPending ? "Carregando..." : "Carregar Templates Padrão"}
          </Button>
          <Button onClick={openNew}><Plus className="w-4 h-4 mr-1" /> Novo Template</Button>
        </div>
      </div>

      {(templates ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Inbox className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-1">Nenhum template cadastrado</h3>
          <p className="text-sm text-muted-foreground mb-4">Crie o primeiro modelo de contrato ou carregue os templates padrão.</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSeedDefaults} disabled={seedDefaultTemplates.isPending}>
              <Download className="w-4 h-4 mr-1" /> Carregar Templates Padrão
            </Button>
            <Button onClick={openNew}><Plus className="w-4 h-4 mr-1" /> Novo Template</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {templates!.map(t => (
            <Card key={t.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{t.name}</h3>
                    <Badge variant="outline" className="text-[10px] capitalize">{(t as any).template_type || "assessoria"}</Badge>
                    {t.is_active ? (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-[10px]"><CheckCircle2 className="w-3 h-3 mr-0.5" />Ativo</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]"><Clock className="w-3 h-3 mr-0.5" />Inativo</Badge>
                    )}
                  </div>
                  {(t as any).description && <p className="text-xs text-muted-foreground">{(t as any).description}</p>}
                  <p className="text-xs text-muted-foreground">Criado em {new Date(t.created_at).toLocaleDateString("pt-BR")}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => openEdit(t)}><Pencil className="w-4 h-4" /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Editar Template" : "Novo Template"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Nome *</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
              <div><Label>Tipo</Label>
                <Select value={templateType} onValueChange={setTemplateType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TEMPLATE_TYPES.map(tt => <SelectItem key={tt.value} value={tt.value}>{tt.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Descrição</Label><Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Descrição curta do template" /></div>

            <Tabs value={editorTab} onValueChange={setEditorTab}>
              <TabsList>
                <TabsTrigger value="editor"><Code className="w-3.5 h-3.5 mr-1" />Editor</TabsTrigger>
                <TabsTrigger value="preview"><Eye className="w-3.5 h-3.5 mr-1" />Preview</TabsTrigger>
              </TabsList>

              <TabsContent value="editor">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Textarea
                      ref={textareaRef}
                      rows={20}
                      className="font-mono text-xs"
                      value={content}
                      onChange={e => setContent(e.target.value)}
                      placeholder="Use variáveis como {{cliente_nome}}, {{valor_mensal}}..."
                    />
                  </div>
                  {Object.keys(groupedPlaceholders).length > 0 && (
                    <div className="w-56 shrink-0">
                      <Label className="text-xs font-semibold mb-2 block">Variáveis disponíveis</Label>
                      <ScrollArea className="h-[420px] border rounded-md p-2">
                        {Object.entries(groupedPlaceholders).map(([cat, items]) => (
                          <div key={cat} className="mb-3">
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">{cat}</p>
                            <div className="flex flex-col gap-1">
                              {items.map(p => (
                                <button
                                  key={p.key}
                                  type="button"
                                  onClick={() => insertPlaceholder(p.key)}
                                  className="text-left text-[11px] px-2 py-1 rounded hover:bg-accent transition-colors truncate"
                                  title={`${p.key} — Ex: ${p.example}`}
                                >
                                  <span className="font-mono text-primary">{p.key}</span>
                                  <br />
                                  <span className="text-muted-foreground text-[10px]">{p.label}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </ScrollArea>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="preview">
                <ScrollArea className="h-[500px] border rounded-md p-6">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed font-serif max-w-3xl mx-auto">
                    {previewContent || <span className="text-muted-foreground italic">Nenhum conteúdo para visualizar</span>}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
          <DialogFooter><Button onClick={handleSave}>{editingId ? "Salvar" : "Criar Template"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
