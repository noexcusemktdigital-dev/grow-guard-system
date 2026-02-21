import { useState } from "react";
import {
  Palette, Edit3, Check, Plus, Sparkles, Copy, Download,
  Eye, Image, Upload, Calendar as CalendarIcon, ChevronLeft,
  ChevronRight, CheckCircle2, Layout, BookOpen, Clock,
  FolderOpen, ChevronDown, ChevronUp, Hash,
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

/* ── Art piece (always Feed + Story) ── */
interface ArtPiece {
  id: string;
  title: string;
  caption: string;
  hashtags: string;
  approved: boolean;
}

interface MonthlyPackage {
  id: string;
  month: string;
  label: string;
  createdAt: string;
  items: ArtPiece[];
}

const mockPackages: MonthlyPackage[] = [
  {
    id: "feb-2026",
    month: "2026-02",
    label: "Fevereiro 2026",
    createdAt: "05/02/2026",
    items: [
      { id: "1", title: "Promo Fevereiro — 20% Off", caption: "Aproveite a promoção exclusiva de fevereiro! 20% de desconto no plano anual. Transforme a gestão da sua franquia com nossa plataforma completa.\n\nCondições especiais para novas assinaturas até 28/02.", hashtags: "#franquia #gestao #marketing #desconto #promocao", approved: true },
      { id: "2", title: "5 Dicas de Marketing para Franquias", caption: "Descubra 5 estratégias comprovadas para impulsionar o marketing da sua rede de franquias.\n\n1. Defina personas locais\n2. Invista em conteúdo educativo\n3. Use automação de leads\n4. Meça tudo com KPIs\n5. Teste e otimize constantemente", hashtags: "#marketing #franquias #dicas #crescimento #estrategia", approved: true },
      { id: "3", title: "Bastidores da Equipe", caption: "Conheça quem está por trás das soluções que transformam franquias! Nossa equipe respira inovação e resultados.\n\nVem conhecer a cultura que move a NoExcuse.", hashtags: "#equipe #bastidores #cultura #time #inovacao", approved: false },
      { id: "4", title: "Case de Sucesso — Rede FastFood", caption: "A Rede FastFood triplicou seus leads em 3 meses usando nossa plataforma. De 50 para 150 leads/mês por unidade.\n\nTaxa de conversão: 40%\nROI: 8x o investimento\n\nQuer o mesmo resultado? Link na bio.", hashtags: "#case #sucesso #resultados #franquia #roi", approved: false },
      { id: "5", title: "Checklist Marketing Digital", caption: "Seu marketing está completo? Confira nosso checklist:\n\n[ ] Persona definida\n[ ] Calendário editorial ativo\n[ ] Pixel de tracking instalado\n[ ] CRM configurado\n[ ] Métricas sendo acompanhadas\n\nSalve este post!", hashtags: "#checklist #marketing #organizacao #digital #franquias", approved: true },
      { id: "6", title: "Depoimento de Cliente", caption: "'A NoExcuse mudou completamente nossa gestão comercial. Antes perdíamos 60% dos leads. Hoje convertemos 45%.' — João, franqueado.\n\nResultados reais, sem promessas vazias.", hashtags: "#depoimento #cliente #satisfacao #resultados #prova", approved: false },
      { id: "7", title: "Tendências 2026", caption: "As 3 maiores tendências de marketing para franquias em 2026:\n\n1. IA Generativa para conteúdo e campanhas\n2. Hiperlocalização de anúncios por unidade\n3. Automação completa do funil de vendas\n\nQuem adotar primeiro, domina.", hashtags: "#tendencias #2026 #marketing #ia #futuro", approved: false },
      { id: "8", title: "CTA — Agende Sua Demo", caption: "Pronto para transformar a gestão da sua franquia?\n\nAgende uma demonstração gratuita de 30 minutos e descubra como podemos triplicar seus resultados.\n\nLink na bio — vagas limitadas este mês!", hashtags: "#demo #gratuita #franquia #gestao #resultados", approved: false },
    ],
  },
  {
    id: "jan-2026",
    month: "2026-01",
    label: "Janeiro 2026",
    createdAt: "03/01/2026",
    items: [
      { id: "j1", title: "Ano Novo, Franquia Nova", caption: "Começo de ano é o momento ideal para reestruturar o marketing da sua franquia. Defina metas, organize o calendário e comece forte.\n\n2026 é o ano da transformação digital.", hashtags: "#planejamento2026 #franquias #marketing #anonovo", approved: true },
      { id: "j2", title: "Por que Franquias Precisam de Marketing Digital", caption: "92% dos consumidores pesquisam online antes de comprar. Se sua franquia não tem presença digital forte, está perdendo vendas todos os dias.", hashtags: "#marketingdigital #franquias #presencaonline #vendas", approved: true },
    ],
  },
];

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export default function ClienteRedesSociais() {
  const [sections, setSections] = useState(initialSections);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [packages, setPackages] = useState(mockPackages);
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 1, 1));
  const [expandedArt, setExpandedArt] = useState<string | null>(null);
  const [briefOpen, setBriefOpen] = useState(false);

  // Briefing fields
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

  const toggleApprove = (packageId: string, artId: string) => {
    setPackages(prev => prev.map(p => p.id === packageId ? { ...p, items: p.items.map(a => a.id === artId ? { ...a, approved: !a.approved } : a) } : p));
  };

  const handleGenerate = () => {
    setBriefOpen(false);
    toast({ title: "Pacote gerado com sucesso!", description: `${Number(bQtd) * 2} artes criadas (Feed + Story) para ${bMes}.` });
  };

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
          <TabsTrigger value="entregas" className="text-xs gap-1.5"><FolderOpen className="w-3.5 h-3.5" /> Entregas</TabsTrigger>
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

        {/* ═══ ENTREGAS ═══ */}
        <TabsContent value="entregas" className="space-y-5 mt-4">
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
                <p className="text-xs text-muted-foreground">Cada arte será gerada nos formatos Feed (1080x1080) e Story (1080x1920). Preencha o briefing completo para resultados profissionais.</p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Mês de Referência</Label>
                    <Input value={bMes} onChange={e => setBMes(e.target.value)} placeholder="Ex: Março 2026" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Quantidade de Posts</Label>
                    <Input type="number" value={bQtd} onChange={e => setBQtd(e.target.value)} placeholder="10" />
                    <p className="text-[10px] text-muted-foreground">Cada post gera 1 arte Feed + 1 arte Story</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium">Objetivo Principal do Mês</Label>
                  <Textarea value={bObjetivo} onChange={e => setBObjetivo(e.target.value)} placeholder="Ex: Aumentar awareness da marca e gerar leads qualificados" rows={2} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Promoções e Ofertas</Label>
                    <Textarea value={bPromocoes} onChange={e => setBPromocoes(e.target.value)} placeholder="Ex: 30% off, frete grátis, bônus de indicação..." rows={2} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Destaques e Novidades</Label>
                    <Textarea value={bDestaques} onChange={e => setBDestaques(e.target.value)} placeholder="Ex: Novo produto, case de sucesso, premiação..." rows={2} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Eventos e Datas Importantes</Label>
                    <Textarea value={bEventos} onChange={e => setBEventos(e.target.value)} placeholder="Ex: Dia da Mulher, aniversário da empresa..." rows={2} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Temas Visuais</Label>
                    <Textarea value={bTemas} onChange={e => setBTemas(e.target.value)} placeholder="Ex: Tecnologia, crescimento, resultados, humano..." rows={2} />
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
                    <Input value={bCores} onChange={e => setBCores(e.target.value)} placeholder="Ex: Azul marinho, branco, dourado" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium">Referências Visuais</Label>
                  <Input value={bReferencias} onChange={e => setBReferencias(e.target.value)} placeholder="Ex: Links de posts ou perfis que gosta" />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium">Observações Adicionais</Label>
                  <Textarea value={bObs} onChange={e => setBObs(e.target.value)} placeholder="Informações extras sobre a marca, restrições visuais, textos obrigatórios..." rows={3} />
                </div>

                <Button className="w-full gap-2 h-11" onClick={handleGenerate}>
                  <Sparkles className="w-4 h-4" /> Gerar Artes do Mês
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Packages month by month */}
          {packages.map(pkg => {
            const approvedCount = pkg.items.filter(a => a.approved).length;
            return (
              <div key={pkg.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CalendarIcon className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold">{pkg.label}</h3>
                    <Badge variant="outline" className="text-[10px]">{pkg.items.length} posts ({pkg.items.length * 2} artes)</Badge>
                    <Badge variant="outline" className="text-[10px] gap-1">
                      <CheckCircle2 className="w-3 h-3 text-chart-green" /> {approvedCount} aprovados
                    </Badge>
                  </div>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Criado em {pkg.createdAt}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pkg.items.map(art => {
                    const isExpanded = expandedArt === art.id;
                    return (
                      <Card key={art.id} className={`glass-card hover-lift ${art.approved ? "border-chart-green/30 bg-chart-green/5" : ""}`}>
                        <CardContent className="py-4 space-y-3">
                          {/* Visual placeholders: Feed + Story side by side */}
                          <div className="flex gap-2">
                            <div className="flex-1 rounded-xl flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-muted border border-dashed border-muted-foreground/20 h-28">
                              <Palette className="w-6 h-6 text-muted-foreground/30" />
                              <span className="text-[8px] text-muted-foreground mt-1">Feed 1080x1080</span>
                            </div>
                            <div className="w-16 rounded-xl flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-muted border border-dashed border-muted-foreground/20 h-28">
                              <Palette className="w-4 h-4 text-muted-foreground/30" />
                              <span className="text-[7px] text-muted-foreground mt-1">Story</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold">{art.title}</p>
                            {art.approved && <Badge className="text-[9px] bg-chart-green/10 text-chart-green">Aprovado</Badge>}
                          </div>

                          {/* Caption expandable */}
                          <div className={`text-[11px] text-muted-foreground whitespace-pre-line ${isExpanded ? "" : "line-clamp-3"}`}>
                            {art.caption}
                          </div>
                          {art.caption.length > 100 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-[10px] h-5 p-0 gap-1 text-primary"
                              onClick={() => setExpandedArt(isExpanded ? null : art.id)}
                            >
                              {isExpanded ? <><ChevronUp className="w-3 h-3" /> Menos</> : <><ChevronDown className="w-3 h-3" /> Ver tudo</>}
                            </Button>
                          )}

                          <p className="text-[9px] text-primary flex items-center gap-1"><Hash className="w-3 h-3" /> {art.hashtags}</p>

                          <div className="flex gap-1.5">
                            <Button variant="outline" size="sm" className="flex-1 text-[10px] h-8 gap-1" onClick={() => toast({ title: "Download iniciado!" })}>
                              <Download className="w-3 h-3" /> Baixar
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1 text-[10px] h-8 gap-1" onClick={() => { navigator.clipboard.writeText(art.caption + "\n\n" + art.hashtags); toast({ title: "Legenda copiada!" }); }}>
                              <Copy className="w-3 h-3" /> Legenda
                            </Button>
                            <Button
                              variant={art.approved ? "default" : "outline"}
                              size="sm"
                              className="text-[10px] h-8 gap-1"
                              onClick={() => toggleApprove(pkg.id, art.id)}
                            >
                              <Check className="w-3 h-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
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
