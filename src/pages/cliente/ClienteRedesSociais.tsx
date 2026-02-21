import { useState } from "react";
import { Share2, Plus, Sparkles, Image, Film, Layout, Download, Eye, Instagram, Facebook, Palette } from "lucide-react";
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
import { toast } from "@/hooks/use-toast";

interface SocialPost {
  id: string;
  title: string;
  network: string;
  type: "Post" | "Story" | "Reels" | "Carrossel" | "Anúncio";
  status: "Rascunho" | "Aprovado" | "Publicado";
  createdAt: string;
  copy?: string;
}

const networks = [
  { name: "Instagram", icon: "📸", followers: "12.5k", engagement: "4.2%", reach: "8.3k", impressions: "23.1k", clicks: "1.2k", growth: "+340" },
  { name: "Facebook", icon: "👤", followers: "8.2k", engagement: "2.1%", reach: "5.1k", impressions: "14.5k", clicks: "680", growth: "+120" },
  { name: "LinkedIn", icon: "💼", followers: "3.8k", engagement: "5.7%", reach: "2.9k", impressions: "8.7k", clicks: "450", growth: "+89" },
  { name: "TikTok", icon: "🎵", followers: "2.1k", engagement: "7.8%", reach: "15.2k", impressions: "42.0k", clicks: "890", growth: "+580" },
];

const mockPosts: SocialPost[] = [
  { id: "1", title: "5 Dicas de Produtividade", network: "Instagram", type: "Carrossel", status: "Publicado", createdAt: "2026-02-17", copy: "Sua equipe poderia render 2x mais..." },
  { id: "2", title: "Case de Sucesso - Empresa X", network: "LinkedIn", type: "Post", status: "Publicado", createdAt: "2026-02-19" },
  { id: "3", title: "Promo Relâmpago Fevereiro", network: "Facebook", type: "Anúncio", status: "Aprovado", createdAt: "2026-02-20" },
  { id: "4", title: "Tutorial CRM Rápido", network: "Instagram", type: "Reels", status: "Rascunho", createdAt: "2026-02-21" },
  { id: "5", title: "Bastidores da equipe", network: "Instagram", type: "Story", status: "Publicado", createdAt: "2026-02-18" },
  { id: "6", title: "Checklist Comercial", network: "TikTok", type: "Reels", status: "Rascunho", createdAt: "2026-02-22" },
];

const AI_ART_TEMPLATES = [
  { name: "Post Feed Quadrado", size: "1080x1080", icon: <Layout className="w-5 h-5" /> },
  { name: "Story / Reels", size: "1080x1920", icon: <Film className="w-5 h-5" /> },
  { name: "Anúncio Meta", size: "1200x628", icon: <Image className="w-5 h-5" /> },
  { name: "Banner LinkedIn", size: "1200x627", icon: <Layout className="w-5 h-5" /> },
];

const statusColors: Record<string, string> = {
  Rascunho: "bg-muted text-muted-foreground",
  Aprovado: "bg-blue-500/10 text-blue-500",
  Publicado: "bg-emerald-500/10 text-emerald-500",
};

export default function ClienteRedesSociais() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [createOpen, setCreateOpen] = useState(false);
  const [artType, setArtType] = useState("");

  const handleGenerate = () => {
    toast({ title: "Arte gerada!", description: "Sua peça publicitária foi criada com sucesso." });
    setCreateOpen(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Redes Sociais"
        subtitle="Dashboard de performance, biblioteca de posts e gerador de artes"
        icon={<Share2 className="w-5 h-5 text-primary" />}
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Criar Post / Arte
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="dashboard" className="text-xs">Dashboard</TabsTrigger>
          <TabsTrigger value="biblioteca" className="text-xs">Biblioteca</TabsTrigger>
          <TabsTrigger value="gerador" className="text-xs">Gerador de Artes</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {networks.map(n => (
              <Card key={n.name} className="hover:shadow-md transition-all">
                <CardContent className="py-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">{n.icon}</span>
                    <div>
                      <p className="text-sm font-bold">{n.name}</p>
                      <p className="text-[10px] text-emerald-500">{n.growth} este mês</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><p className="text-lg font-bold">{n.followers}</p><p className="text-[10px] text-muted-foreground">Seguidores</p></div>
                    <div><p className="text-lg font-bold text-primary">{n.engagement}</p><p className="text-[10px] text-muted-foreground">Engajamento</p></div>
                    <div><p className="text-sm font-semibold">{n.impressions}</p><p className="text-[10px] text-muted-foreground">Impressões</p></div>
                    <div><p className="text-sm font-semibold">{n.clicks}</p><p className="text-[10px] text-muted-foreground">Cliques</p></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Alcance Total" value="31.5k" trend="up" variant="accent" />
            <KpiCard label="Engajamento Médio" value="4.95%" trend="up" />
            <KpiCard label="Posts este Mês" value="18" sublabel="de 20 planejados" />
            <KpiCard label="Melhor Rede" value="TikTok" sublabel="7.8% engajamento" />
          </div>
        </TabsContent>

        {/* Biblioteca Tab */}
        <TabsContent value="biblioteca" className="space-y-4 mt-4">
          <div className="flex gap-2 flex-wrap">
            {["Todos", "Instagram", "Facebook", "LinkedIn", "TikTok"].map(n => (
              <Button key={n} variant="outline" size="sm" className="text-xs">{n}</Button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockPosts.map(p => (
              <Card key={p.id} className="hover:shadow-md transition-all hover:-translate-y-0.5">
                <CardContent className="py-4 space-y-3">
                  {/* Preview placeholder */}
                  <div className="h-32 bg-gradient-to-br from-muted to-muted/50 rounded-lg flex items-center justify-center">
                    <Palette className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge className={`text-[9px] ${statusColors[p.status]}`}>{p.status}</Badge>
                    <Badge variant="outline" className="text-[9px]">{p.type}</Badge>
                  </div>
                  <p className="text-sm font-semibold">{p.title}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">{p.network}</span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Eye className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Download className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Gerador de Artes Tab */}
        <TabsContent value="gerador" className="space-y-4 mt-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="py-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">Gerador de Artes com IA</span>
              </div>
              <p className="text-xs text-muted-foreground mb-4">Selecione um formato, descreva sua peça e a IA irá gerar a arte pronta para publicação.</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {AI_ART_TEMPLATES.map(t => (
                  <div
                    key={t.name}
                    className={`p-3 border rounded-lg cursor-pointer transition-all text-center ${artType === t.name ? "border-primary bg-primary/10" : "hover:bg-muted/30"}`}
                    onClick={() => setArtType(t.name)}
                  >
                    <div className="flex justify-center mb-1">{t.icon}</div>
                    <p className="text-xs font-medium">{t.name}</p>
                    <p className="text-[10px] text-muted-foreground">{t.size}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Descrição da Arte</Label>
                  <Textarea placeholder="Ex: Post de promoção com fundo azul, logo no topo, texto 'OFERTA EXCLUSIVA' em destaque..." rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Cores Predominantes</Label>
                    <Input placeholder="Azul, branco, dourado" />
                  </div>
                  <div className="space-y-2">
                    <Label>Estilo Visual</Label>
                    <Select defaultValue="moderno">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="moderno">Moderno</SelectItem>
                        <SelectItem value="minimalista">Minimalista</SelectItem>
                        <SelectItem value="bold">Bold / Impactante</SelectItem>
                        <SelectItem value="elegante">Elegante</SelectItem>
                        <SelectItem value="divertido">Divertido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button className="w-full gap-2" onClick={() => toast({ title: "Arte sendo gerada...", description: "Aguarde enquanto a IA cria sua peça." })}>
                  <Sparkles className="w-4 h-4" /> Gerar Arte
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Generated pieces preview */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Peças Recentes</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="aspect-square bg-gradient-to-br from-primary/10 to-muted rounded-lg flex flex-col items-center justify-center gap-2 border border-dashed border-muted-foreground/20">
                    <Palette className="w-8 h-8 text-muted-foreground/30" />
                    <span className="text-[10px] text-muted-foreground">Arte #{i}</span>
                    <Button variant="outline" size="sm" className="text-[10px] h-6"><Download className="w-3 h-3 mr-1" /> Baixar</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Post Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Criar Novo Post</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rede Social</Label>
                <Select defaultValue="Instagram"><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Instagram", "Facebook", "LinkedIn", "TikTok"].map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select defaultValue="Post"><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Post", "Story", "Reels", "Carrossel", "Anúncio"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Título</Label><Input placeholder="Nome do post" /></div>
            <div className="space-y-2"><Label>Legenda / Copy</Label><Textarea placeholder="Escreva a legenda..." rows={3} /></div>
            <div className="space-y-2"><Label>Hashtags</Label><Input placeholder="#marketing #vendas" /></div>
            <Button variant="outline" className="w-full gap-1" onClick={() => toast({ title: "IA gerando copy..." })}>
              <Sparkles className="w-4 h-4" /> Gerar Legenda com IA
            </Button>
            <Button className="w-full" onClick={handleGenerate}>Criar Post</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
