import { useState } from "react";
import { Palette, Plus, Sparkles, Image, Film, Layout, Download, Eye, Copy, Trash2, Search, Filter } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";

interface DesignPiece {
  id: string;
  title: string;
  format: string;
  size: string;
  style: string;
  status: "Rascunho" | "Finalizado" | "Aprovado";
  createdAt: string;
  category: "Post" | "Story" | "Anúncio" | "Carrossel" | "Banner" | "Apresentação";
  description?: string;
}

const FORMATS = [
  { name: "Post Feed", size: "1080x1080", icon: <Layout className="w-5 h-5" />, category: "Post" },
  { name: "Story / Reels", size: "1080x1920", icon: <Film className="w-5 h-5" />, category: "Story" },
  { name: "Carrossel", size: "1080x1080 (multi)", icon: <Copy className="w-5 h-5" />, category: "Carrossel" },
  { name: "Anúncio Meta", size: "1200x628", icon: <Image className="w-5 h-5" />, category: "Anúncio" },
  { name: "Banner Web", size: "1920x600", icon: <Layout className="w-5 h-5" />, category: "Banner" },
  { name: "Apresentação", size: "1920x1080", icon: <Layout className="w-5 h-5" />, category: "Apresentação" },
];

const STYLES = ["Moderno", "Minimalista", "Bold / Impactante", "Elegante", "Divertido", "Corporativo", "Luxo"];

const mockPieces: DesignPiece[] = [
  { id: "1", title: "Promo Fevereiro - Feed", format: "Post Feed", size: "1080x1080", style: "Bold / Impactante", status: "Finalizado", createdAt: "2026-02-17", category: "Post", description: "Post promocional com destaque em oferta exclusiva" },
  { id: "2", title: "Story Lançamento Produto", format: "Story / Reels", size: "1080x1920", style: "Moderno", status: "Aprovado", createdAt: "2026-02-18", category: "Story" },
  { id: "3", title: "Carrossel 5 Dicas Vendas", format: "Carrossel", size: "1080x1080 (multi)", style: "Elegante", status: "Finalizado", createdAt: "2026-02-19", category: "Carrossel", description: "5 slides com dicas de vendas para redes sociais" },
  { id: "4", title: "Anúncio Meta - Captação", format: "Anúncio Meta", size: "1200x628", style: "Corporativo", status: "Rascunho", createdAt: "2026-02-20", category: "Anúncio" },
  { id: "5", title: "Banner Site Institucional", format: "Banner Web", size: "1920x600", style: "Minimalista", status: "Finalizado", createdAt: "2026-02-21", category: "Banner" },
  { id: "6", title: "Apresentação Comercial", format: "Apresentação", size: "1920x1080", style: "Corporativo", status: "Rascunho", createdAt: "2026-02-22", category: "Apresentação", description: "Deck comercial para reuniões de vendas" },
  { id: "7", title: "Post Autoridade - Resultados", format: "Post Feed", size: "1080x1080", style: "Moderno", status: "Aprovado", createdAt: "2026-02-16", category: "Post" },
  { id: "8", title: "Reels Bastidores", format: "Story / Reels", size: "1080x1920", style: "Divertido", status: "Rascunho", createdAt: "2026-02-22", category: "Story" },
];

const statusColors: Record<string, string> = {
  Rascunho: "bg-muted text-muted-foreground",
  Finalizado: "bg-emerald-500/10 text-emerald-500",
  Aprovado: "bg-blue-500/10 text-blue-500",
};

const categoryColors: Record<string, string> = {
  Post: "bg-purple-500/10 text-purple-500",
  Story: "bg-pink-500/10 text-pink-500",
  Anúncio: "bg-orange-500/10 text-orange-500",
  Carrossel: "bg-indigo-500/10 text-indigo-500",
  Banner: "bg-teal-500/10 text-teal-500",
  Apresentação: "bg-amber-500/10 text-amber-500",
};

export default function ClienteRedesSociais() {
  const [activeTab, setActiveTab] = useState("biblioteca");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState("");
  const [filterCategory, setFilterCategory] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPieces = mockPieces.filter(p => {
    const matchCategory = filterCategory === "Todos" || p.category === filterCategory;
    const matchSearch = !searchTerm || p.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

  const handleCreate = () => {
    toast({ title: "Peça criada!", description: "Sua arte foi adicionada à biblioteca." });
    setCreateOpen(false);
    setSelectedFormat("");
  };

  const handleGenerateAI = () => {
    toast({ title: "IA gerando arte...", description: "Aguarde enquanto criamos sua peça publicitária." });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Redes Sociais"
        subtitle="Crie posts, artes e peças publicitárias para suas redes"
        icon={<Palette className="w-5 h-5 text-primary" />}
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Nova Peça
          </Button>
        }
      />

      {/* KPIs de produção */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold">{mockPieces.length}</p>
            <p className="text-[10px] text-muted-foreground">Total de Peças</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-emerald-500">{mockPieces.filter(p => p.status === "Finalizado").length}</p>
            <p className="text-[10px] text-muted-foreground">Finalizadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-blue-500">{mockPieces.filter(p => p.status === "Aprovado").length}</p>
            <p className="text-[10px] text-muted-foreground">Aprovadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-muted-foreground">{mockPieces.filter(p => p.status === "Rascunho").length}</p>
            <p className="text-[10px] text-muted-foreground">Rascunhos</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="biblioteca" className="text-xs">Biblioteca de Peças</TabsTrigger>
          <TabsTrigger value="gerador" className="text-xs">Gerador com IA</TabsTrigger>
        </TabsList>

        {/* Biblioteca */}
        <TabsContent value="biblioteca" className="space-y-4 mt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar peça..."
                className="pl-9 text-xs"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {["Todos", "Post", "Story", "Carrossel", "Anúncio", "Banner", "Apresentação"].map(cat => (
                <Button
                  key={cat}
                  variant={filterCategory === cat ? "default" : "outline"}
                  size="sm"
                  className="text-xs"
                  onClick={() => setFilterCategory(cat)}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPieces.map(p => (
              <Card key={p.id} className="hover:shadow-md transition-all hover:-translate-y-0.5 group">
                <CardContent className="py-4 space-y-3">
                  {/* Preview placeholder com formato visual */}
                  <div className={`rounded-lg flex items-center justify-center bg-gradient-to-br from-muted to-muted/50 ${
                    p.format.includes("Story") ? "h-44" : p.format.includes("Banner") ? "h-20" : "h-32"
                  }`}>
                    <div className="text-center">
                      <Palette className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                      <span className="text-[9px] text-muted-foreground mt-1 block">{p.size}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge className={`text-[9px] ${statusColors[p.status]}`}>{p.status}</Badge>
                    <Badge className={`text-[9px] ${categoryColors[p.category]}`}>{p.category}</Badge>
                  </div>
                  <p className="text-sm font-semibold">{p.title}</p>
                  {p.description && (
                    <p className="text-[10px] text-muted-foreground line-clamp-2">{p.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">{p.format} · {p.style}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Eye className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Download className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredPieces.length === 0 && (
            <div className="text-center py-12">
              <Palette className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma peça encontrada</p>
            </div>
          )}
        </TabsContent>

        {/* Gerador com IA */}
        <TabsContent value="gerador" className="space-y-4 mt-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="py-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">Gerador de Artes com IA</span>
              </div>
              <p className="text-xs text-muted-foreground mb-4">Selecione o formato, descreva sua peça e a IA cria a arte pronta para download.</p>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
                {FORMATS.map(f => (
                  <div
                    key={f.name}
                    className={`p-3 border rounded-lg cursor-pointer transition-all text-center ${selectedFormat === f.name ? "border-primary bg-primary/10 shadow-sm" : "hover:bg-muted/30"}`}
                    onClick={() => setSelectedFormat(f.name)}
                  >
                    <div className="flex justify-center mb-1">{f.icon}</div>
                    <p className="text-[11px] font-medium">{f.name}</p>
                    <p className="text-[9px] text-muted-foreground">{f.size}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>O que você precisa?</Label>
                  <Textarea placeholder="Ex: Post de promoção com fundo azul, logo no topo, texto 'OFERTA EXCLUSIVA' em destaque, foto de produto ao centro..." rows={3} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Cores</Label>
                    <Input placeholder="Azul, branco, dourado" />
                  </div>
                  <div className="space-y-2">
                    <Label>Estilo Visual</Label>
                    <Select defaultValue="Moderno">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STYLES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Texto Principal</Label>
                    <Input placeholder="OFERTA EXCLUSIVA" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Texto Secundário</Label>
                    <Input placeholder="Até 50% de desconto" />
                  </div>
                  <div className="space-y-2">
                    <Label>CTA (botão/chamada)</Label>
                    <Input placeholder="Saiba Mais" />
                  </div>
                </div>
                <Button className="w-full gap-2" onClick={handleGenerateAI}>
                  <Sparkles className="w-4 h-4" /> Gerar Arte com IA
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Peças geradas recentemente */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Peças Geradas Recentemente</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="aspect-square bg-gradient-to-br from-primary/10 to-muted rounded-lg flex flex-col items-center justify-center gap-2 border border-dashed border-muted-foreground/20">
                    <Palette className="w-8 h-8 text-muted-foreground/30" />
                    <span className="text-[10px] text-muted-foreground">Arte #{i}</span>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" className="text-[10px] h-6"><Download className="w-3 h-3 mr-1" /> Baixar</Button>
                      <Button variant="ghost" size="sm" className="text-[10px] h-6"><Eye className="w-3 h-3" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Criar Peça Manual */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nova Peça Publicitária</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Formato</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {FORMATS.map(f => <SelectItem key={f.name} value={f.name}>{f.name} ({f.size})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {["Post", "Story", "Carrossel", "Anúncio", "Banner", "Apresentação"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Título da Peça</Label><Input placeholder="Ex: Promo Março - Feed" /></div>
            <div className="space-y-2"><Label>Descrição / Briefing</Label><Textarea placeholder="Descreva o que essa peça precisa comunicar..." rows={3} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Estilo Visual</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {STYLES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select defaultValue="Rascunho">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Rascunho">Rascunho</SelectItem>
                    <SelectItem value="Finalizado">Finalizado</SelectItem>
                    <SelectItem value="Aprovado">Aprovado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button variant="outline" className="w-full gap-1" onClick={() => toast({ title: "IA gerando sugestão de arte..." })}>
              <Sparkles className="w-4 h-4" /> Gerar com IA
            </Button>
            <Button className="w-full" onClick={handleCreate}>Criar Peça</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
