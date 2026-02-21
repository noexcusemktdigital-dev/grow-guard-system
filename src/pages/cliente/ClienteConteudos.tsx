import { useState, useMemo } from "react";
import { FileText, Plus, Calendar as CalendarIcon, List, ChevronLeft, ChevronRight, Sparkles, Copy, Lightbulb, ScrollText, Filter } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getClienteConteudos, getPlanoMarketing360, type ConteudoMarketing } from "@/data/clienteData";
import { toast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameMonth, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusColors: Record<string, string> = {
  Rascunho: "bg-muted text-muted-foreground",
  Agendado: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  Publicado: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
};

const networkColors: Record<string, string> = {
  Instagram: "bg-pink-500/10 text-pink-500",
  Facebook: "bg-blue-600/10 text-blue-600",
  LinkedIn: "bg-sky-500/10 text-sky-500",
  TikTok: "bg-purple-500/10 text-purple-500",
};

const funnelColors: Record<string, string> = {
  Topo: "bg-primary/10 text-primary",
  Meio: "bg-chart-2/10 text-chart-2",
  Fundo: "bg-chart-3/10 text-chart-3",
};

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

// Mock AI generation
const AI_MOCK = {
  copy: "🚀 Você sabia que 80% das empresas que automatizam seu marketing crescem 3x mais rápido? Descubra como nossa plataforma pode transformar seus resultados!",
  titulo: "Transforme seus resultados com automação",
  cta: "Agende uma demo gratuita agora →",
  hashtags: ["#marketingdigital", "#automação", "#vendas", "#crescimento", "#resultados"],
};

export default function ClienteConteudos() {
  const conteudos = useMemo(() => getClienteConteudos(), []);
  const plano = useMemo(() => getPlanoMarketing360(), []);
  const [view, setView] = useState<"calendario" | "lista" | "roteiros">("calendario");
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 1, 1)); // Feb 2026
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [filter, setFilter] = useState("Todas");
  const networks = ["Todas", "Instagram", "Facebook", "LinkedIn", "TikTok"];

  // AI state
  const [aiGenerated, setAiGenerated] = useState(false);
  const [aiCopy, setAiCopy] = useState("");
  const [aiTitulo, setAiTitulo] = useState("");
  const [aiCta, setAiCta] = useState("");
  const [aiHashtags, setAiHashtags] = useState("");

  const filtered = filter === "Todas" ? conteudos : conteudos.filter(c => c.network === filter);

  // Calendar helpers
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = (getDay(monthStart) + 6) % 7; // Monday-start

  const getConteudosForDay = (day: Date) => conteudos.filter(c => {
    try { return isSameDay(parseISO(c.date), day); } catch { return false; }
  });

  const openCreateForDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    setAiGenerated(false);
    setAiCopy("");
    setAiTitulo("");
    setAiCta("");
    setAiHashtags("");
    setCreateOpen(true);
  };

  const generateAI = () => {
    setAiCopy(AI_MOCK.copy);
    setAiTitulo(AI_MOCK.titulo);
    setAiCta(AI_MOCK.cta);
    setAiHashtags(AI_MOCK.hashtags.join(" "));
    setAiGenerated(true);
    toast({ title: "IA gerou conteúdo!", description: "Copy, título, CTA e hashtags preenchidos." });
  };

  const copyAll = () => {
    navigator.clipboard.writeText(`${aiTitulo}\n\n${aiCopy}\n\n${aiCta}\n\n${aiHashtags}`);
    toast({ title: "Copiado!" });
  };

  // Plan suggestion
  const planSuggestion = plano.planoAcao.cronograma.map(c => `${c.dia} (${c.tipo})`).join(" · ");

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Conteúdos"
        subtitle="Calendário editorial e produção inteligente de conteúdo"
        icon={<FileText className="w-5 h-5 text-primary" />}
        actions={
          <div className="flex gap-2">
            <div className="flex border rounded-md overflow-hidden">
              <Button variant={view === "calendario" ? "default" : "ghost"} size="sm" className="rounded-none text-xs gap-1" onClick={() => setView("calendario")}>
                <CalendarIcon className="w-3.5 h-3.5" /> Calendário
              </Button>
              <Button variant={view === "lista" ? "default" : "ghost"} size="sm" className="rounded-none text-xs gap-1" onClick={() => setView("lista")}>
                <List className="w-3.5 h-3.5" /> Lista
              </Button>
              <Button variant={view === "roteiros" ? "default" : "ghost"} size="sm" className="rounded-none text-xs gap-1" onClick={() => setView("roteiros")}>
                <ScrollText className="w-3.5 h-3.5" /> Roteiros
              </Button>
            </div>
            <Button size="sm" onClick={() => openCreateForDate(format(new Date(), "yyyy-MM-dd"))}><Plus className="w-4 h-4 mr-1" /> Novo Conteúdo</Button>
          </div>
        }
      />

      {/* Plan banner */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-3 flex items-start gap-3">
          <Lightbulb className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-medium">Seu plano sugere {plano.planoAcao.postsSemanais} posts/semana:</p>
            <p className="text-[11px] text-muted-foreground">{planSuggestion}</p>
          </div>
        </CardContent>
      </Card>

      {view === "calendario" ? (
        /* Calendar View */
        <Card>
          <CardContent className="py-4">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft className="w-4 h-4" /></Button>
              <span className="text-sm font-semibold capitalize">{format(currentMonth, "MMMM yyyy", { locale: ptBR })}</span>
              <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight className="w-4 h-4" /></Button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {WEEKDAYS.map(d => <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1">{d}</div>)}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: startPadding }).map((_, i) => <div key={`pad-${i}`} className="h-20" />)}
              {days.map(day => {
                const dayConteudos = getConteudosForDay(day);
                const dateStr = format(day, "yyyy-MM-dd");
                const isToday = isSameDay(day, new Date());
                return (
                  <div
                    key={dateStr}
                    className={`h-20 border rounded-md p-1 cursor-pointer hover:bg-muted/30 transition-colors ${isToday ? "border-primary/50 bg-primary/5" : "border-border"}`}
                    onClick={() => openCreateForDate(dateStr)}
                  >
                    <span className={`text-[10px] font-medium ${isToday ? "text-primary" : "text-muted-foreground"}`}>{format(day, "d")}</span>
                    <div className="space-y-0.5 mt-0.5 overflow-hidden">
                      {dayConteudos.slice(0, 2).map(c => (
                        <div key={c.id} className={`text-[8px] px-1 py-0.5 rounded truncate ${statusColors[c.status]}`}>
                          {c.title.slice(0, 18)}
                        </div>
                      ))}
                      {dayConteudos.length > 2 && <span className="text-[8px] text-muted-foreground">+{dayConteudos.length - 2}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : view === "lista" ? (
        /* List View */
        <>
          <div className="flex gap-2 flex-wrap">
            {networks.map(n => <Button key={n} variant={filter === n ? "default" : "outline"} size="sm" className="text-xs" onClick={() => setFilter(n)}>{n}</Button>)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(c => (
              <Card key={c.id} className="hover:shadow-md transition-all hover:-translate-y-0.5">
                <CardContent className="py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge className={`text-[9px] ${networkColors[c.network] || ""}`}>{c.network}</Badge>
                    <Badge variant="outline" className={`text-[9px] ${statusColors[c.status]}`}>{c.status}</Badge>
                  </div>
                  <p className="text-sm font-semibold">{c.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{c.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      <Badge variant="outline" className="text-[9px]">{c.format}</Badge>
                      <Badge className={`text-[9px] ${funnelColors[c.funnelStage] || ""}`}>{c.funnelStage}</Badge>
                    </div>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <CalendarIcon className="w-3 h-3" /> {c.date}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : (
        /* Roteiros / Funil View */
        <div className="space-y-6">
          {(["Topo", "Meio", "Fundo"] as const).map(stage => {
            const stageConteudos = conteudos.filter(c => c.funnelStage === stage);
            const stageDescriptions: Record<string, { desc: string; tipos: string }> = {
              Topo: { desc: "Atrair atenção e gerar interesse", tipos: "Posts educativos, Reels virais, Blog SEO" },
              Meio: { desc: "Nutrir e qualificar leads", tipos: "Cases, Webinars, Email, Carrosséis" },
              Fundo: { desc: "Converter em vendas", tipos: "Depoimentos, Ofertas, Landing Pages, Demos" },
            };
            return (
              <Card key={stage}>
                <CardContent className="py-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Badge className={`${funnelColors[stage]}`}>{stage} de Funil</Badge>
                    <span className="text-xs text-muted-foreground">{stageDescriptions[stage].desc}</span>
                    <Badge variant="outline" className="text-[9px] ml-auto">{stageConteudos.length} conteúdos</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground mb-3">Tipos sugeridos: {stageDescriptions[stage].tipos}</p>
                  <div className="space-y-2">
                    {stageConteudos.map(c => (
                      <div key={c.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                        <ScrollText className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{c.title}</p>
                          {c.copy && <p className="text-[10px] text-muted-foreground truncate">{c.copy}</p>}
                        </div>
                        <Badge variant="outline" className="text-[9px]">{c.format}</Badge>
                        <Badge className={`text-[9px] ${networkColors[c.network] || ""}`}>{c.network}</Badge>
                        <Badge variant="outline" className={`text-[9px] ${statusColors[c.status]}`}>{c.status}</Badge>
                      </div>
                    ))}
                    {stageConteudos.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">Nenhum conteúdo nesta etapa. Crie um roteiro para {stage.toLowerCase()} de funil.</p>
                    )}
                  </div>
                  <Button variant="outline" size="sm" className="mt-3 text-xs gap-1" onClick={() => { openCreateForDate(format(new Date(), "yyyy-MM-dd")); }}>
                    <Sparkles className="w-3.5 h-3.5" /> Gerar Roteiro para {stage}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Criar Conteúdo</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Formato</Label>
                <Select defaultValue="Feed"><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Feed", "Story", "Reels", "Carrossel", "Blog", "Email"].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Rede Social</Label>
                <Select defaultValue="Instagram"><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Instagram", "Facebook", "LinkedIn", "TikTok"].map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Etapa do Funil</Label>
                <Select defaultValue="Topo"><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Topo">Topo</SelectItem>
                    <SelectItem value="Meio">Meio</SelectItem>
                    <SelectItem value="Fundo">Fundo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data de Publicação</Label>
                <Input type="date" defaultValue={selectedDate || ""} />
              </div>
            </div>
            <div className="space-y-2"><Label>Título</Label><Input placeholder="Título do conteúdo" value={aiGenerated ? aiTitulo : ""} onChange={e => setAiTitulo(e.target.value)} /></div>
            <div className="space-y-2"><Label>Descrição / Briefing</Label><Textarea placeholder="Descreva o conteúdo..." rows={2} /></div>

            {/* AI Section */}
            <Card className="border-primary/20">
              <CardContent className="py-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">Gerar com IA</span>
                  </div>
                  <Button size="sm" variant="outline" className="text-xs gap-1" onClick={generateAI}>
                    <Sparkles className="w-3.5 h-3.5" /> Gerar Copy
                  </Button>
                </div>
                {aiGenerated && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Copy Sugerida</Label>
                      <Textarea value={aiCopy} onChange={e => setAiCopy(e.target.value)} rows={3} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">CTA Sugerido</Label>
                      <Input value={aiCta} onChange={e => setAiCta(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Hashtags</Label>
                      <Input value={aiHashtags} onChange={e => setAiHashtags(e.target.value)} />
                    </div>
                    <Button variant="outline" size="sm" className="text-xs gap-1" onClick={copyAll}>
                      <Copy className="w-3 h-3" /> Copiar tudo
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Button className="w-full" onClick={() => { toast({ title: "Conteúdo criado!" }); setCreateOpen(false); }}>Criar Conteúdo</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
