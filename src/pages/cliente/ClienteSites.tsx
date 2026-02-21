import { useState, useMemo } from "react";
import { Globe, Plus, ExternalLink, GripVertical, Type, Image, MessageSquare, HelpCircle, Award, ArrowDown, Sparkles, Eye, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/KpiCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getClienteSites } from "@/data/clienteData";
import { toast } from "@/hooks/use-toast";

interface LPBlock {
  id: string;
  type: "hero" | "benefits" | "social_proof" | "cta" | "form" | "faq" | "footer";
  label: string;
  icon: React.ReactNode;
}

const AVAILABLE_BLOCKS: LPBlock[] = [
  { id: "hero", type: "hero", label: "Hero / Banner", icon: <Type className="w-4 h-4" /> },
  { id: "benefits", type: "benefits", label: "Benefícios", icon: <Award className="w-4 h-4" /> },
  { id: "social_proof", type: "social_proof", label: "Prova Social", icon: <MessageSquare className="w-4 h-4" /> },
  { id: "cta", type: "cta", label: "CTA", icon: <ArrowDown className="w-4 h-4" /> },
  { id: "form", type: "form", label: "Formulário", icon: <MessageSquare className="w-4 h-4" /> },
  { id: "faq", type: "faq", label: "FAQ", icon: <HelpCircle className="w-4 h-4" /> },
  { id: "footer", type: "footer", label: "Rodapé", icon: <Type className="w-4 h-4" /> },
];

const BLOCK_PREVIEWS: Record<string, React.ReactNode> = {
  hero: (
    <div className="bg-gradient-to-r from-primary/20 to-primary/5 p-6 rounded-lg text-center space-y-2">
      <h3 className="text-lg font-bold">Título Principal</h3>
      <p className="text-xs text-muted-foreground">Subtítulo com proposta de valor</p>
      <Button size="sm" className="text-xs mt-2">CTA Principal</Button>
    </div>
  ),
  benefits: (
    <div className="grid grid-cols-3 gap-3 p-4">
      {["Benefício 1", "Benefício 2", "Benefício 3"].map(b => (
        <div key={b} className="text-center p-3 bg-muted/30 rounded-lg">
          <Award className="w-5 h-5 mx-auto mb-1 text-primary" />
          <p className="text-[10px] font-medium">{b}</p>
        </div>
      ))}
    </div>
  ),
  social_proof: (
    <div className="p-4 space-y-2">
      <p className="text-xs font-medium text-center">Depoimentos</p>
      <div className="flex gap-2">
        {[1, 2].map(i => (
          <div key={i} className="flex-1 p-2 bg-muted/30 rounded-lg">
            <p className="text-[10px] italic">"Excelente serviço!"</p>
            <p className="text-[9px] text-muted-foreground mt-1">— Cliente {i}</p>
          </div>
        ))}
      </div>
    </div>
  ),
  cta: (
    <div className="bg-primary/10 p-6 text-center rounded-lg space-y-2">
      <p className="text-sm font-bold">Pronto para começar?</p>
      <Button size="sm" className="text-xs">Fale Conosco</Button>
    </div>
  ),
  form: (
    <div className="p-4 space-y-2 max-w-xs mx-auto">
      <div className="h-7 bg-muted/50 rounded border" />
      <div className="h-7 bg-muted/50 rounded border" />
      <div className="h-7 bg-muted/50 rounded border" />
      <Button size="sm" className="w-full text-xs">Enviar</Button>
    </div>
  ),
  faq: (
    <div className="p-4 space-y-2">
      {["Pergunta 1?", "Pergunta 2?", "Pergunta 3?"].map(q => (
        <div key={q} className="p-2 bg-muted/30 rounded flex items-center justify-between">
          <span className="text-[10px]">{q}</span>
          <ArrowDown className="w-3 h-3" />
        </div>
      ))}
    </div>
  ),
  footer: (
    <div className="bg-muted/30 p-4 text-center rounded-lg">
      <p className="text-[10px] text-muted-foreground">© 2026 Empresa · Termos · Privacidade</p>
    </div>
  ),
};

export default function ClienteSites() {
  const sites = useMemo(() => getClienteSites(), []);
  const totalLeads = sites.reduce((s, site) => s + site.leads, 0);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [selectedBlocks, setSelectedBlocks] = useState<LPBlock[]>([
    AVAILABLE_BLOCKS[0], AVAILABLE_BLOCKS[1], AVAILABLE_BLOCKS[3], AVAILABLE_BLOCKS[4],
  ]);
  const [lpName, setLpName] = useState("");
  const [previewMode, setPreviewMode] = useState(false);

  const addBlock = (block: LPBlock) => {
    setSelectedBlocks(prev => [...prev, { ...block, id: `${block.type}-${Date.now()}` }]);
  };

  const removeBlock = (id: string) => {
    setSelectedBlocks(prev => prev.filter(b => b.id !== id));
  };

  const moveBlock = (idx: number, dir: -1 | 1) => {
    const newBlocks = [...selectedBlocks];
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= newBlocks.length) return;
    [newBlocks[idx], newBlocks[targetIdx]] = [newBlocks[targetIdx], newBlocks[idx]];
    setSelectedBlocks(newBlocks);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Sites & Landing Pages"
        subtitle="Crie landing pages de captura integradas ao CRM"
        icon={<Globe className="w-5 h-5 text-primary" />}
        actions={<Button size="sm" onClick={() => setBuilderOpen(true)}><Plus className="w-4 h-4 mr-1" /> Nova Landing Page</Button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total de Páginas" value={sites.length.toString()} />
        <KpiCard label="Leads Gerados" value={totalLeads.toString()} trend="up" variant="accent" />
        <KpiCard label="Ativos" value={sites.filter(s => s.status === "Ativo").length.toString()} />
        <KpiCard label="Conversão Média" value={`${(sites.reduce((s, x) => s + x.conversion, 0) / sites.length).toFixed(1)}%`} trend="up" />
      </div>

      <div className="space-y-3">
        {sites.map(s => (
          <Card key={s.id} className="hover:shadow-md transition-all">
            <CardContent className="py-4 flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold">{s.name}</span>
                  <Badge variant={s.status === "Ativo" ? "default" : "outline"} className="text-[9px]">{s.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" /> {s.url}
                </p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-primary">{s.leads}</p>
                <p className="text-[10px] text-muted-foreground">leads</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">{s.conversion}%</p>
                <p className="text-[10px] text-muted-foreground">conversão</p>
              </div>
              <Button variant="ghost" size="sm" className="text-xs"><Eye className="w-3.5 h-3.5" /></Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Builder Dialog */}
      <Dialog open={builderOpen} onOpenChange={setBuilderOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Construtor de Landing Page</DialogTitle></DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome da Página</Label>
                <Input value={lpName} onChange={e => setLpName(e.target.value)} placeholder="Ex: LP Promoção Março" />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select defaultValue="captura">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="captura">Página de Captura</SelectItem>
                    <SelectItem value="institucional">Institucional</SelectItem>
                    <SelectItem value="vendas">Página de Vendas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {/* Block palette */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Blocos Disponíveis</p>
                <div className="space-y-1">
                  {AVAILABLE_BLOCKS.map(block => (
                    <div key={block.id} className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => addBlock(block)}>
                      {block.icon}
                      <span className="text-xs">{block.label}</span>
                      <Plus className="w-3 h-3 ml-auto text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Selected blocks */}
              <div className="col-span-2 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">Estrutura da Página</p>
                  <Button variant="outline" size="sm" className="text-[10px] h-6 gap-1" onClick={() => setPreviewMode(!previewMode)}>
                    <Eye className="w-3 h-3" /> {previewMode ? "Editar" : "Preview"}
                  </Button>
                </div>

                {previewMode ? (
                  <div className="border rounded-lg overflow-hidden">
                    {selectedBlocks.map(block => (
                      <div key={block.id}>
                        {BLOCK_PREVIEWS[block.type]}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedBlocks.map((block, idx) => (
                      <div key={block.id} className="flex items-center gap-2 p-2 border rounded-lg bg-background">
                        <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                        {block.icon}
                        <span className="text-xs flex-1">{block.label}</span>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => moveBlock(idx, -1)} disabled={idx === 0}>↑</Button>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => moveBlock(idx, 1)} disabled={idx === selectedBlocks.length - 1}>↓</Button>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => removeBlock(block.id)}><Trash2 className="w-3 h-3" /></Button>
                        </div>
                      </div>
                    ))}
                    {selectedBlocks.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-8">Adicione blocos da paleta à esquerda</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/10">
              <Sparkles className="w-4 h-4 text-primary shrink-0" />
              <span className="text-xs">O formulário será integrado automaticamente ao CRM. Leads captados entrarão como "Novo Lead" com origem "Landing Page".</span>
            </div>

            <Button className="w-full" onClick={() => { toast({ title: "Landing page criada!", description: `"${lpName || 'Nova LP'}" publicada com sucesso.` }); setBuilderOpen(false); }}>
              Publicar Landing Page
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
