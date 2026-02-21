import { useState } from "react";
import {
  Palette, Save, Edit3, Check, Plus, Sparkles, Copy, Download,
  Eye, Image, Upload, Calendar as CalendarIcon, ChevronLeft,
  ChevronRight, CheckCircle2, Instagram, Facebook, Layout,
  Film, BookOpen, Hash,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

/* ── Generated arts ── */
interface ArtPiece {
  id: string;
  title: string;
  type: "Feed" | "Story" | "Carrossel";
  caption: string;
  hashtags: string;
  approved: boolean;
  date: string;
}

const mockArts: ArtPiece[] = [
  { id: "1", title: "Promo Fevereiro — 20% Off", type: "Feed", caption: "Aproveite a promoção exclusiva de fevereiro! 20% de desconto no plano anual. Transforme a gestão da sua franquia.", hashtags: "#franquia #gestao #marketing #desconto", approved: true, date: "2026-02-03" },
  { id: "2", title: "5 Dicas de Marketing para Franquias", type: "Carrossel", caption: "Descubra 5 estratégias comprovadas para impulsionar o marketing da sua rede de franquias.", hashtags: "#marketing #franquias #dicas #crescimento", approved: true, date: "2026-02-05" },
  { id: "3", title: "Bastidores da Equipe", type: "Story", caption: "Conheça quem está por trás das soluções que transformam franquias!", hashtags: "#equipe #bastidores #cultura", approved: false, date: "2026-02-07" },
  { id: "4", title: "Case de Sucesso — Rede FastFood", type: "Feed", caption: "A Rede FastFood triplicou seus leads em 3 meses usando nossa plataforma. Veja como!", hashtags: "#case #sucesso #resultados #franquia", approved: false, date: "2026-02-10" },
  { id: "5", title: "Checklist Marketing Digital", type: "Carrossel", caption: "Baixe nosso checklist gratuito e organize o marketing da sua franquia.", hashtags: "#checklist #marketing #organizacao", approved: true, date: "2026-02-12" },
  { id: "6", title: "Depoimento de Cliente", type: "Story", caption: "'A NoExcuse mudou completamente nossa gestão comercial' — João, franqueado.", hashtags: "#depoimento #cliente #satisfacao", approved: false, date: "2026-02-14" },
  { id: "7", title: "Tendências 2026", type: "Feed", caption: "As 3 maiores tendências de marketing para franquias em 2026. Você está preparado?", hashtags: "#tendencias #2026 #marketing #futuro", approved: false, date: "2026-02-17" },
  { id: "8", title: "CTA — Agende Sua Demo", type: "Story", caption: "Pronto para transformar sua franquia? Agende uma demo gratuita agora!", hashtags: "#demo #gratuita #franquia #gestao", approved: false, date: "2026-02-20" },
];

const typeColors: Record<string, string> = {
  Feed: "bg-purple-500/10 text-purple-500",
  Story: "bg-pink-500/10 text-pink-500",
  Carrossel: "bg-indigo-500/10 text-indigo-500",
};

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export default function ClienteRedesSociais() {
  const [sections, setSections] = useState(initialSections);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [arts, setArts] = useState(mockArts);
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 1, 1));

  // Briefing
  const [briefPromocoes, setBriefPromocoes] = useState("20% off plano anual");
  const [briefDestaques, setBriefDestaques] = useState("Lançamento módulo IA");
  const [briefEventos, setBriefEventos] = useState("Dia do Empreendedor");
  const [briefTemas, setBriefTemas] = useState("Crescimento, Resultados, Tecnologia");

  // Package config
  const [feedQty, setFeedQty] = useState(10);
  const [storyQty, setStoryQty] = useState(12);
  const [carrosselQty, setCarrosselQty] = useState(8);
  const totalPackage = feedQty + storyQty + carrosselQty;

  const approvedCount = arts.filter(a => a.approved).length;

  const updateField = (sectionId: string, fieldKey: string, value: string) => {
    setSections(prev => prev.map(s => s.id === sectionId ? { ...s, fields: s.fields.map(f => f.key === fieldKey ? { ...f, value } : f) } : s));
  };

  const toggleApprove = (id: string) => {
    setArts(prev => prev.map(a => a.id === id ? { ...a, approved: !a.approved } : a));
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = (getDay(monthStart) + 6) % 7;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Redes Sociais"
        subtitle="Base visual, pacote mensal de artes e calendário"
        icon={<Palette className="w-5 h-5 text-primary" />}
      />

      <Tabs defaultValue="base">
        <TabsList>
          <TabsTrigger value="base" className="text-xs gap-1.5"><BookOpen className="w-3.5 h-3.5" /> Base de Conhecimento</TabsTrigger>
          <TabsTrigger value="pacote" className="text-xs gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Pacote Mensal</TabsTrigger>
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

        {/* ═══ PACOTE MENSAL ═══ */}
        <TabsContent value="pacote" className="space-y-5 mt-4">
          {/* Briefing */}
          <Card className="glass-card border-primary/20 bg-primary/5">
            <CardContent className="py-5">
              <p className="section-label mb-3">BRIEFING MENSAL</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2"><Label className="text-xs">Promoções</Label><Input value={briefPromocoes} onChange={e => setBriefPromocoes(e.target.value)} /></div>
                <div className="space-y-2"><Label className="text-xs">Destaques</Label><Input value={briefDestaques} onChange={e => setBriefDestaques(e.target.value)} /></div>
                <div className="space-y-2"><Label className="text-xs">Eventos</Label><Input value={briefEventos} onChange={e => setBriefEventos(e.target.value)} /></div>
                <div className="space-y-2"><Label className="text-xs">Temas Visuais</Label><Input value={briefTemas} onChange={e => setBriefTemas(e.target.value)} /></div>
              </div>

              <p className="section-label mb-3">CONFIGURAÇÃO DO PACOTE</p>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="space-y-2">
                  <Label className="text-xs">Posts Feed</Label>
                  <Input type="number" value={feedQty} onChange={e => setFeedQty(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Stories</Label>
                  <Input type="number" value={storyQty} onChange={e => setStoryQty(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Carrosséis</Label>
                  <Input type="number" value={carrosselQty} onChange={e => setCarrosselQty(Number(e.target.value))} />
                </div>
              </div>

              <Button className="w-full gap-2" onClick={() => toast({ title: "Pacote gerado!", description: `${totalPackage} artes criadas para o mês.` })}>
                <Sparkles className="w-4 h-4" /> Gerar Pacote do Mês
              </Button>
            </CardContent>
          </Card>

          {/* Progress */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-xs gap-1">
                <CheckCircle2 className="w-3 h-3 text-chart-green" /> {approvedCount} aprovadas
              </Badge>
              <Badge variant="outline" className="text-xs">{arts.length}/{totalPackage} geradas</Badge>
            </div>
            <Progress value={(arts.length / totalPackage) * 100} className="w-32 h-2" />
          </div>

          {/* Arts grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {arts.map(art => (
              <Card key={art.id} className={`glass-card hover-lift group ${art.approved ? "border-chart-green/30" : ""}`}>
                <CardContent className="py-4 space-y-3">
                  {/* Visual placeholder */}
                  <div className={`rounded-xl flex items-center justify-center bg-gradient-to-br from-primary/10 to-muted border border-dashed border-muted-foreground/20 ${
                    art.type === "Story" ? "h-44" : "h-32"
                  }`}>
                    <div className="text-center">
                      <Palette className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                      <span className="text-[9px] text-muted-foreground mt-1 block">{art.type}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Badge className={`text-[9px] ${typeColors[art.type]}`}>{art.type}</Badge>
                    {art.approved && <Badge className="text-[9px] bg-chart-green/10 text-chart-green">Aprovada</Badge>}
                  </div>

                  <p className="text-sm font-semibold">{art.title}</p>
                  <p className="text-[10px] text-muted-foreground line-clamp-2">{art.caption}</p>
                  <p className="text-[9px] text-primary">{art.hashtags}</p>

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
                      onClick={() => toggleApprove(art.id)}
                    >
                      <Check className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ═══ CALENDÁRIO ═══ */}
        <TabsContent value="calendario" className="space-y-5 mt-4">
          {/* Legend */}
          <div className="flex items-center gap-3">
            {Object.entries(typeColors).map(([type, cls]) => (
              <Badge key={type} className={`text-[9px] ${cls}`}>{type}</Badge>
            ))}
          </div>

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
                  const dayArts = arts.filter(a => a.date === dateStr);
                  return (
                    <div key={dateStr} className={`h-20 border rounded-md p-1 ${isSameDay(day, new Date()) ? "border-primary/50 bg-primary/5" : "border-border"}`}>
                      <span className="text-[10px] font-medium text-muted-foreground">{format(day, "d")}</span>
                      <div className="space-y-0.5 mt-0.5 overflow-hidden">
                        {dayArts.slice(0, 2).map(a => (
                          <div key={a.id} className={`text-[7px] px-1 py-0.5 rounded truncate ${typeColors[a.type]}`}>
                            {a.title.slice(0, 16)}
                          </div>
                        ))}
                        {dayArts.length > 2 && <span className="text-[7px] text-muted-foreground">+{dayArts.length - 2}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Compact week view */}
          <Card className="glass-card">
            <CardContent className="py-5">
              <p className="section-label mb-3">VISÃO SEMANAL COMPACTA</p>
              <div className="space-y-2">
                {[1, 2, 3, 4].map(week => {
                  const weekArts = arts.filter(a => {
                    const d = new Date(a.date);
                    return Math.ceil(d.getDate() / 7) === week;
                  });
                  return (
                    <div key={week} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border">
                      <Badge variant="outline" className="text-[9px] shrink-0">Sem {week}</Badge>
                      <div className="flex gap-1.5 flex-wrap flex-1">
                        {weekArts.map(a => (
                          <Badge key={a.id} className={`text-[8px] ${typeColors[a.type]}`}>{a.title.slice(0, 20)}</Badge>
                        ))}
                        {weekArts.length === 0 && <span className="text-[10px] text-muted-foreground">Nenhuma arte</span>}
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">{weekArts.length} peças</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
