import { useState } from "react";
import {
  Palette, Edit3, Check, Plus, Sparkles, Copy, Download,
  Eye, Image, Upload, Calendar as CalendarIcon, ChevronLeft,
  ChevronRight, BookOpen, Clock, FolderOpen, Folder,
  ArrowLeft, File, Hash, Layout,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

/* ── Base de Conhecimento ── */
interface KBSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  fields: { key: string; label: string; type: "text" | "textarea" | "upload"; value: string }[];
}

const initialSections: KBSection[] = [
  {
    id: "identidade", title: "Identidade Visual", icon: <Palette className="w-4 h-4" />,
    fields: [
      { key: "paleta", label: "Paleta de Cores", type: "text", value: "#E63946, #1D3557, #F1FAEE, #A8DADC" },
      { key: "fontes", label: "Fontes", type: "text", value: "Inter (títulos), DM Sans (corpo)" },
      { key: "estilo", label: "Estilo Visual Preferido", type: "text", value: "Moderno, Minimalista, Bold" },
      { key: "logo", label: "Logo", type: "upload", value: "" },
    ],
  },
  {
    id: "referencias", title: "Referências Visuais", icon: <Eye className="w-4 h-4" />,
    fields: [
      { key: "refs", label: "Links e Perfis de Referência", type: "textarea", value: "@rockcontent — identidade clean\n@resultadosdigitais — infográficos\n@hubspot — carrosséis educativos" },
    ],
  },
  {
    id: "concorrencia", title: "Concorrência Visual", icon: <Layout className="w-4 h-4" />,
    fields: [
      { key: "conc", label: "Exemplos Visuais de Concorrentes", type: "textarea", value: "FranquiaTech: visual corporativo azul\nRedeGrow: visual jovem e colorido" },
    ],
  },
  {
    id: "tom", title: "Tom e Linguagem Visual", icon: <BookOpen className="w-4 h-4" />,
    fields: [
      { key: "tom", label: "Como a marca se comunica visualmente", type: "textarea", value: "Profissional mas acessível. Uso de ícones e dados visuais. Evitar excesso de texto nos criativos." },
    ],
  },
  {
    id: "banco", title: "Banco de Imagens", icon: <Image className="w-4 h-4" />,
    fields: [
      { key: "fotos", label: "Fotos de produtos, equipe, espaço", type: "upload", value: "" },
    ],
  },
];

/* ── Art files ── */
interface ArtFile {
  id: string;
  name: string;
  caption: string;
  hashtags: string;
  type: "Feed" | "Story";
}

interface MonthFolder {
  id: string;
  month: string;
  label: string;
  createdAt: string;
  files: ArtFile[];
}

const mockFolders: MonthFolder[] = [
  {
    id: "feb-2026", month: "2026-02", label: "Fevereiro 2026", createdAt: "05/02/2026",
    files: [
      { id: "1a", name: "Promo Fevereiro 20 Off — Feed.png", type: "Feed", caption: "Aproveite a promoção exclusiva de fevereiro! 20% de desconto no plano anual. Transforme a gestão da sua franquia com nossa plataforma completa.\n\nCondições especiais para novas assinaturas até 28/02.", hashtags: "#franquia #gestao #marketing #desconto #promocao" },
      { id: "1b", name: "Promo Fevereiro 20 Off — Story.png", type: "Story", caption: "Aproveite a promoção exclusiva de fevereiro! 20% de desconto no plano anual. Transforme a gestão da sua franquia com nossa plataforma completa.\n\nCondições especiais para novas assinaturas até 28/02.", hashtags: "#franquia #gestao #marketing #desconto #promocao" },
      { id: "2a", name: "5 Dicas de Marketing para Franquias — Feed.png", type: "Feed", caption: "Descubra 5 estratégias comprovadas para impulsionar o marketing da sua rede de franquias.\n\n1. Defina personas locais\n2. Invista em conteúdo educativo\n3. Use automação de leads\n4. Meça tudo com KPIs\n5. Teste e otimize constantemente", hashtags: "#marketing #franquias #dicas #crescimento #estrategia" },
      { id: "2b", name: "5 Dicas de Marketing para Franquias — Story.png", type: "Story", caption: "Descubra 5 estratégias comprovadas para impulsionar o marketing da sua rede de franquias.\n\n1. Defina personas locais\n2. Invista em conteúdo educativo\n3. Use automação de leads\n4. Meça tudo com KPIs\n5. Teste e otimize constantemente", hashtags: "#marketing #franquias #dicas #crescimento #estrategia" },
      { id: "3a", name: "Bastidores da Equipe — Feed.png", type: "Feed", caption: "Conheça quem está por trás das soluções que transformam franquias! Nossa equipe respira inovação e resultados.", hashtags: "#equipe #bastidores #cultura #time #inovacao" },
      { id: "3b", name: "Bastidores da Equipe — Story.png", type: "Story", caption: "Conheça quem está por trás das soluções que transformam franquias! Nossa equipe respira inovação e resultados.", hashtags: "#equipe #bastidores #cultura #time #inovacao" },
      { id: "4a", name: "Case de Sucesso Rede FastFood — Feed.png", type: "Feed", caption: "A Rede FastFood triplicou seus leads em 3 meses usando nossa plataforma. De 50 para 150 leads/mês por unidade.\n\nTaxa de conversão: 40% | ROI: 8x", hashtags: "#case #sucesso #resultados #franquia #roi" },
      { id: "4b", name: "Case de Sucesso Rede FastFood — Story.png", type: "Story", caption: "A Rede FastFood triplicou seus leads em 3 meses usando nossa plataforma. De 50 para 150 leads/mês por unidade.\n\nTaxa de conversão: 40% | ROI: 8x", hashtags: "#case #sucesso #resultados #franquia #roi" },
      { id: "5a", name: "Checklist Marketing Digital — Feed.png", type: "Feed", caption: "Seu marketing está completo? Confira nosso checklist essencial para franquias que querem crescer com consistência.", hashtags: "#checklist #marketing #organizacao #digital #franquias" },
      { id: "5b", name: "Checklist Marketing Digital — Story.png", type: "Story", caption: "Seu marketing está completo? Confira nosso checklist essencial para franquias que querem crescer com consistência.", hashtags: "#checklist #marketing #organizacao #digital #franquias" },
      { id: "6a", name: "Depoimento de Cliente — Feed.png", type: "Feed", caption: "'A NoExcuse mudou completamente nossa gestão comercial. Antes perdíamos 60% dos leads. Hoje convertemos 45%.' — João, franqueado.", hashtags: "#depoimento #cliente #satisfacao #resultados" },
      { id: "6b", name: "Depoimento de Cliente — Story.png", type: "Story", caption: "'A NoExcuse mudou completamente nossa gestão comercial. Antes perdíamos 60% dos leads. Hoje convertemos 45%.' — João, franqueado.", hashtags: "#depoimento #cliente #satisfacao #resultados" },
      { id: "7a", name: "Tendências 2026 — Feed.png", type: "Feed", caption: "As 3 maiores tendências de marketing para franquias em 2026:\n\n1. IA Generativa para conteúdo\n2. Hiperlocalização de anúncios\n3. Automação do funil completo", hashtags: "#tendencias #2026 #marketing #ia #futuro" },
      { id: "7b", name: "Tendências 2026 — Story.png", type: "Story", caption: "As 3 maiores tendências de marketing para franquias em 2026:\n\n1. IA Generativa para conteúdo\n2. Hiperlocalização de anúncios\n3. Automação do funil completo", hashtags: "#tendencias #2026 #marketing #ia #futuro" },
      { id: "8a", name: "Agende Sua Demo — Feed.png", type: "Feed", caption: "Pronto para transformar a gestão da sua franquia? Agende uma demo gratuita de 30 minutos.", hashtags: "#demo #gratuita #franquia #gestao #resultados" },
      { id: "8b", name: "Agende Sua Demo — Story.png", type: "Story", caption: "Pronto para transformar a gestão da sua franquia? Agende uma demo gratuita de 30 minutos.", hashtags: "#demo #gratuita #franquia #gestao #resultados" },
    ],
  },
  {
    id: "jan-2026", month: "2026-01", label: "Janeiro 2026", createdAt: "03/01/2026",
    files: [
      { id: "j1a", name: "Ano Novo Franquia Nova — Feed.png", type: "Feed", caption: "Começo de ano é o momento ideal para reestruturar o marketing da sua franquia. 2026 é o ano da transformação digital.", hashtags: "#planejamento2026 #franquias #marketing" },
      { id: "j1b", name: "Ano Novo Franquia Nova — Story.png", type: "Story", caption: "Começo de ano é o momento ideal para reestruturar o marketing da sua franquia. 2026 é o ano da transformação digital.", hashtags: "#planejamento2026 #franquias #marketing" },
      { id: "j2a", name: "Marketing Digital para Franquias — Feed.png", type: "Feed", caption: "92% dos consumidores pesquisam online antes de comprar. Sua franquia está preparada?", hashtags: "#marketingdigital #franquias #presencaonline" },
      { id: "j2b", name: "Marketing Digital para Franquias — Story.png", type: "Story", caption: "92% dos consumidores pesquisam online antes de comprar. Sua franquia está preparada?", hashtags: "#marketingdigital #franquias #presencaonline" },
    ],
  },
];

const typeIcons: Record<string, string> = {
  Feed: "1:1",
  Story: "9:16",
};

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export default function ClienteRedesSociais() {
  const [sections, setSections] = useState(initialSections);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [folders] = useState(mockFolders);
  const [openFolder, setOpenFolder] = useState<string | null>(null);
  const [openFile, setOpenFile] = useState<ArtFile | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 1, 1));
  const [briefOpen, setBriefOpen] = useState(false);

  // Briefing
  const [bMes, setBMes] = useState("Março 2026");
  const [bObjetivo, setBObjetivo] = useState("");
  const [bPromocoes, setBPromocoes] = useState("");
  const [bDestaques, setBDestaques] = useState("");
  const [bEventos, setBEventos] = useState("");
  const [bTemas, setBTemas] = useState("");
  const [bEstilo, setBEstilo] = useState("");
  const [bQtd, setBQtd] = useState("10");
  const [bCores, setBCores] = useState("");
  const [bReferencias, setBReferencias] = useState("");
  const [bObs, setBObs] = useState("");

  const updateField = (sectionId: string, fieldKey: string, value: string) => {
    setSections(prev => prev.map(s => s.id === sectionId ? { ...s, fields: s.fields.map(f => f.key === fieldKey ? { ...f, value } : f) } : s));
  };

  const handleGenerate = () => {
    setBriefOpen(false);
    toast({ title: "Pacote gerado!", description: `${Number(bQtd) * 2} artes (Feed + Story) criadas para ${bMes}.` });
  };

  const currentFolderData = folders.find(f => f.id === openFolder);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = (getDay(monthStart) + 6) % 7;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Redes Sociais"
        subtitle="Base visual, artes mensais e calendário de publicações"
        icon={<Palette className="w-5 h-5 text-primary" />}
      />

      <Tabs defaultValue="base">
        <TabsList>
          <TabsTrigger value="base" className="text-xs gap-1.5"><BookOpen className="w-3.5 h-3.5" /> Base de Conhecimento</TabsTrigger>
          <TabsTrigger value="arquivos" className="text-xs gap-1.5"><FolderOpen className="w-3.5 h-3.5" /> Arquivos</TabsTrigger>
          <TabsTrigger value="calendario" className="text-xs gap-1.5"><CalendarIcon className="w-3.5 h-3.5" /> Calendário</TabsTrigger>
        </TabsList>

        {/* ═══ BASE ═══ */}
        <TabsContent value="base" className="space-y-5 mt-4">
          {sections.map(section => {
            const isEditing = editingSection === section.id;
            return (
              <Card key={section.id} className="glass-card">
                <CardContent className="py-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-primary/10 text-primary">{section.icon}</div>
                      <p className="text-sm font-bold">{section.title}</p>
                    </div>
                    <Button
                      variant={isEditing ? "default" : "outline"}
                      size="sm"
                      className="text-xs gap-1"
                      onClick={() => {
                        if (isEditing) toast({ title: "Salvo!" });
                        setEditingSection(isEditing ? null : section.id);
                      }}
                    >
                      {isEditing ? <><Check className="w-3.5 h-3.5" /> Salvar</> : <><Edit3 className="w-3.5 h-3.5" /> Editar</>}
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {section.fields.map(field => (
                      <div key={field.key}>
                        <Label className="text-[11px] text-muted-foreground">{field.label}</Label>
                        {field.type === "upload" ? (
                          <div className="mt-1 border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:bg-muted/30 transition-colors">
                            <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                            <p className="text-xs text-muted-foreground">Arraste ou clique para fazer upload</p>
                          </div>
                        ) : isEditing ? (
                          field.type === "textarea" ? (
                            <Textarea value={field.value} onChange={e => updateField(section.id, field.key, e.target.value)} rows={3} className="mt-1" />
                          ) : (
                            <Input value={field.value} onChange={e => updateField(section.id, field.key, e.target.value)} className="mt-1" />
                          )
                        ) : (
                          <p className="text-sm mt-1 whitespace-pre-line">{field.value || <span className="text-muted-foreground italic">Não preenchido</span>}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* ═══ ARQUIVOS ═══ */}
        <TabsContent value="arquivos" className="space-y-4 mt-4">
          {/* Create button */}
          <Dialog open={briefOpen} onOpenChange={setBriefOpen}>
            <DialogTrigger asChild>
              <Button className="w-full gap-2 h-12 text-sm font-semibold">
                <Plus className="w-4 h-4" /> Nova Criação Mensal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" /> Briefing para Artes e Posts
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <p className="text-xs text-muted-foreground">Cada arte será gerada nos formatos Feed (1080x1080) e Story (1080x1920). Uma pasta será criada para o mês.</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Mês de Referência</Label>
                    <Input value={bMes} onChange={e => setBMes(e.target.value)} placeholder="Ex: Março 2026" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Quantidade de Posts</Label>
                    <Input type="number" value={bQtd} onChange={e => setBQtd(e.target.value)} placeholder="10" />
                    <p className="text-[10px] text-muted-foreground">Gera 1 Feed + 1 Story por post</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Objetivo Principal</Label>
                  <Textarea value={bObjetivo} onChange={e => setBObjetivo(e.target.value)} placeholder="Ex: Aumentar awareness e gerar leads" rows={2} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Promoções e Ofertas</Label>
                    <Textarea value={bPromocoes} onChange={e => setBPromocoes(e.target.value)} placeholder="Ex: 30% off, frete grátis..." rows={2} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Destaques e Novidades</Label>
                    <Textarea value={bDestaques} onChange={e => setBDestaques(e.target.value)} placeholder="Ex: Novo produto, case..." rows={2} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Eventos e Datas</Label>
                    <Textarea value={bEventos} onChange={e => setBEventos(e.target.value)} placeholder="Ex: Dia da Mulher, aniversário..." rows={2} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Temas Visuais</Label>
                    <Textarea value={bTemas} onChange={e => setBTemas(e.target.value)} placeholder="Ex: Tecnologia, crescimento..." rows={2} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Estilo Visual</Label>
                    <Select value={bEstilo} onValueChange={setBEstilo}>
                      <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minimalista">Minimalista</SelectItem>
                        <SelectItem value="bold">Bold e Impactante</SelectItem>
                        <SelectItem value="corporativo">Corporativo</SelectItem>
                        <SelectItem value="criativo">Criativo e Colorido</SelectItem>
                        <SelectItem value="elegante">Elegante e Sofisticado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Cores Predominantes</Label>
                    <Input value={bCores} onChange={e => setBCores(e.target.value)} placeholder="Ex: Azul marinho, branco" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Referências Visuais</Label>
                  <Input value={bReferencias} onChange={e => setBReferencias(e.target.value)} placeholder="Links ou perfis de referência" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Observações Adicionais</Label>
                  <Textarea value={bObs} onChange={e => setBObs(e.target.value)} placeholder="Restrições visuais, textos obrigatórios..." rows={3} />
                </div>
                <Button className="w-full gap-2 h-11" onClick={handleGenerate}>
                  <Sparkles className="w-4 h-4" /> Gerar Artes do Mês
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Breadcrumb */}
          {openFolder && !openFile && (
            <div className="flex items-center gap-2 text-sm">
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground" onClick={() => setOpenFolder(null)}>
                <ArrowLeft className="w-3 h-3" /> Voltar
              </Button>
              <span className="text-muted-foreground">/</span>
              <span className="font-medium">{currentFolderData?.label}</span>
            </div>
          )}

          {openFile && (
            <div className="flex items-center gap-2 text-sm">
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground" onClick={() => setOpenFile(null)}>
                <ArrowLeft className="w-3 h-3" /> Voltar
              </Button>
              <span className="text-muted-foreground">/</span>
              <button className="text-xs text-muted-foreground hover:text-foreground transition-colors" onClick={() => setOpenFile(null)}>{currentFolderData?.label}</button>
              <span className="text-muted-foreground">/</span>
              <span className="font-medium text-xs truncate max-w-xs">{openFile.name}</span>
            </div>
          )}

          {/* File viewer */}
          {openFile ? (
            <Card className="glass-card">
              <CardContent className="py-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold">{openFile.name}</p>
                    <Badge variant="outline" className="text-[9px] mt-2">{openFile.type} ({typeIcons[openFile.type]})</Badge>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => { navigator.clipboard.writeText(openFile.caption + "\n\n" + openFile.hashtags); toast({ title: "Legenda copiada!" }); }}>
                      <Copy className="w-3.5 h-3.5" /> Legenda
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => toast({ title: "Download iniciado!" })}>
                      <Download className="w-3.5 h-3.5" /> Baixar
                    </Button>
                  </div>
                </div>

                {/* Art preview placeholder */}
                <div className={`rounded-xl bg-gradient-to-br from-primary/10 to-muted border border-dashed border-muted-foreground/20 flex items-center justify-center mx-auto ${
                  openFile.type === "Story" ? "w-48 h-80" : "w-72 h-72"
                }`}>
                  <div className="text-center">
                    <Palette className="w-10 h-10 text-muted-foreground/30 mx-auto" />
                    <span className="text-[10px] text-muted-foreground mt-2 block">Preview — {openFile.type}</span>
                    <span className="text-[9px] text-muted-foreground">{openFile.type === "Story" ? "1080x1920" : "1080x1080"}</span>
                  </div>
                </div>

                <div className="bg-muted/30 rounded-xl p-4 border border-border/50 space-y-2">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Legenda</p>
                  <p className="text-xs text-foreground whitespace-pre-line">{openFile.caption}</p>
                  <p className="text-[10px] text-primary flex items-center gap-1"><Hash className="w-3 h-3" /> {openFile.hashtags}</p>
                </div>
              </CardContent>
            </Card>
          ) : openFolder && currentFolderData ? (
            /* Files inside folder */
            <div className="space-y-1">
              {currentFolderData.files.map(file => (
                <Card
                  key={file.id}
                  className="glass-card cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setOpenFile(file)}
                >
                  <CardContent className="py-3 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-primary/10 to-muted border border-dashed border-muted-foreground/20 shrink-0 ${
                      file.type === "Story" ? "w-8 h-12" : ""
                    }`}>
                      <Palette className="w-3.5 h-3.5 text-muted-foreground/40" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[8px] h-4">{file.type}</Badge>
                        <span className="text-[10px] text-muted-foreground truncate">{file.caption.slice(0, 60)}...</span>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { navigator.clipboard.writeText(file.caption + "\n\n" + file.hashtags); toast({ title: "Legenda copiada!" }); }}>
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => toast({ title: "Download iniciado!" })}>
                        <Download className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            /* Folder list */
            <div className="space-y-2">
              {folders.map(folder => (
                <Card
                  key={folder.id}
                  className="glass-card cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setOpenFolder(folder.id)}
                >
                  <CardContent className="py-4 flex items-center gap-4">
                    <div className="p-2.5 rounded-xl bg-primary/10">
                      <Folder className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{folder.label}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{folder.files.length} arquivos — Criado em {folder.createdAt}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">{folder.files.length / 2} posts</Badge>
                  </CardContent>
                </Card>
              ))}

              {folders.length === 0 && (
                <div className="text-center py-16">
                  <FolderOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Nenhuma criação mensal ainda</p>
                  <p className="text-xs text-muted-foreground mt-1">Clique em "Nova Criação Mensal" para gerar suas primeiras artes</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* ═══ CALENDÁRIO ═══ */}
        <TabsContent value="calendario" className="space-y-5 mt-4">
          <Card className="glass-card">
            <CardContent className="py-5">
              <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft className="w-4 h-4" /></Button>
                <span className="text-sm font-semibold capitalize">{format(currentMonth, "MMMM yyyy", { locale: ptBR })}</span>
                <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight className="w-4 h-4" /></Button>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-1">
                {WEEKDAYS.map(d => <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1">{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: startPadding }).map((_, i) => <div key={`p-${i}`} className="h-20" />)}
                {days.map(day => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  return (
                    <div key={dateStr} className={`h-20 border rounded-md p-1 ${isSameDay(day, new Date()) ? "border-primary/50 bg-primary/5" : "border-border"}`}>
                      <span className="text-[10px] font-medium text-muted-foreground">{format(day, "d")}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground text-center mt-4">Arraste os posts das entregas para organizar no calendário</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
