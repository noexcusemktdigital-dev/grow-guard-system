import { useState } from "react";
import {
  FileText, Save, Edit3, Check, Plus, X, Sparkles, Copy,
  CheckCircle2, Calendar as CalendarIcon, ChevronLeft, ChevronRight,
  BookOpen, Users, Eye, Shield, Lightbulb, Target,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

/* ── Base de Conhecimento sections ── */
interface KBSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  fields: { key: string; label: string; type: "text" | "textarea" | "list"; value: string }[];
}

const initialSections: KBSection[] = [
  {
    id: "negocio", title: "Sobre o Negócio", icon: <Target className="w-4 h-4" />,
    fields: [
      { key: "nicho", label: "Nicho de Atuação", type: "text", value: "Marketing Digital para Franquias" },
      { key: "publico", label: "Público-alvo", type: "textarea", value: "Empreendedores e gestores de franquias, 30-55 anos, buscando crescimento acelerado" },
      { key: "persona", label: "Persona", type: "textarea", value: "Carlos, 42 anos, dono de 3 unidades de franquia, quer escalar vendas com marketing digital" },
      { key: "tom", label: "Tom de Voz", type: "text", value: "Profissional, direto, inspirador" },
      { key: "proposta", label: "Proposta de Valor", type: "textarea", value: "Plataforma completa de gestão comercial e marketing para redes de franquias" },
    ],
  },
  {
    id: "concorrencia", title: "Concorrência", icon: <Users className="w-4 h-4" />,
    fields: [
      { key: "conc1", label: "Concorrente 1", type: "text", value: "FranquiaTech — foco em gestão operacional" },
      { key: "conc2", label: "Concorrente 2", type: "text", value: "RedeGrow — automação de marketing" },
      { key: "obs", label: "Observações", type: "textarea", value: "Nenhum concorrente integra vendas + marketing + IA em uma plataforma" },
    ],
  },
  {
    id: "referencias", title: "Referências", icon: <Eye className="w-4 h-4" />,
    fields: [
      { key: "perfis", label: "Perfis de Referência", type: "textarea", value: "@rockcontent, @resultadosdigitais, @neilpatel" },
      { key: "links", label: "Links de Referência", type: "textarea", value: "https://rockcontent.com/blog\nhttps://resultadosdigitais.com.br" },
    ],
  },
  {
    id: "pilares", title: "Pilares de Conteúdo", icon: <BookOpen className="w-4 h-4" />,
    fields: [
      { key: "pilares", label: "Temas e Categorias", type: "textarea", value: "1. Gestão de Franquias\n2. Marketing Digital\n3. Vendas e CRM\n4. Tecnologia e IA\n5. Cases de Sucesso" },
    ],
  },
  {
    id: "regras", title: "Regras e Restrições", icon: <Shield className="w-4 h-4" />,
    fields: [
      { key: "proibido", label: "O que NÃO pode ser dito", type: "textarea", value: "Não fazer promessas de resultado garantido\nNão citar concorrentes pelo nome em conteúdos" },
      { key: "obrigatorio", label: "Termos Obrigatórios", type: "text", value: "Sempre mencionar 'gestão integrada' e 'resultados mensuráveis'" },
    ],
  },
];

/* ── Generated content mock ── */
interface GeneratedContent {
  id: string;
  title: string;
  description: string;
  format: string;
  network: string;
  funnel: string;
  week: number;
  approved: boolean;
  date: string;
}

const mockGenerated: GeneratedContent[] = [
  { id: "1", title: "5 Erros que Todo Franqueado Comete no Marketing", description: "Carrossel educativo sobre erros comuns e como evitá-los", format: "Carrossel", network: "Instagram", funnel: "Topo", week: 1, approved: true, date: "2026-02-03" },
  { id: "2", title: "Como Definir Metas de Vendas para Sua Franquia", description: "Post com dicas práticas sobre definição de metas SMART", format: "Feed", network: "LinkedIn", funnel: "Meio", week: 1, approved: false, date: "2026-02-05" },
  { id: "3", title: "Case: Franquia que Triplicou Leads com IA", description: "Storytelling sobre caso de sucesso real com dados", format: "Reels", network: "Instagram", funnel: "Fundo", week: 2, approved: true, date: "2026-02-10" },
  { id: "4", title: "O Poder do CRM para Redes de Franquias", description: "Post educativo sobre gestão de leads e pipeline", format: "Feed", network: "Instagram", funnel: "Meio", week: 2, approved: false, date: "2026-02-12" },
  { id: "5", title: "Checklist: Marketing para Franquias", description: "Infográfico com checklist de ações essenciais de marketing", format: "Carrossel", network: "Instagram", funnel: "Topo", week: 3, approved: false, date: "2026-02-17" },
  { id: "6", title: "Depoimento: Como a NoExcuse Mudou Minha Gestão", description: "Vídeo depoimento com cliente satisfeito", format: "Reels", network: "Instagram", funnel: "Fundo", week: 3, approved: true, date: "2026-02-19" },
  { id: "7", title: "3 Tendências de Marketing para Franquias em 2026", description: "Post com insights sobre tendências do mercado", format: "Feed", network: "LinkedIn", funnel: "Topo", week: 4, approved: false, date: "2026-02-24" },
  { id: "8", title: "Agende Sua Demo Gratuita", description: "CTA direto para agendamento com benefícios listados", format: "Story", network: "Instagram", funnel: "Fundo", week: 4, approved: false, date: "2026-02-26" },
];

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

const funnelColors: Record<string, string> = {
  Topo: "bg-primary/10 text-primary",
  Meio: "bg-chart-blue/10 text-chart-blue",
  Fundo: "bg-chart-green/10 text-chart-green",
};

const networkColors: Record<string, string> = {
  Instagram: "bg-pink-500/10 text-pink-500",
  LinkedIn: "bg-sky-500/10 text-sky-500",
  Facebook: "bg-blue-600/10 text-blue-600",
  TikTok: "bg-purple-500/10 text-purple-500",
};

export default function ClienteConteudos() {
  const [sections, setSections] = useState(initialSections);
  const [editing, setEditing] = useState<string | null>(null);
  const [generated, setGenerated] = useState(mockGenerated);
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 1, 1));

  // Briefing
  const [tema, setTema] = useState("Mês do Crescimento");
  const [promocoes, setPromocoes] = useState("20% off no plano anual");
  const [datas, setDatas] = useState("Dia do Empreendedor (05/02)");
  const [destaques, setDestaques] = useState("Lançamento módulo IA");

  const filledFields = sections.reduce((total, s) => total + s.fields.filter(f => f.value.trim()).length, 0);
  const totalFields = sections.reduce((total, s) => total + s.fields.length, 0);
  const kbProgress = Math.round((filledFields / totalFields) * 100);

  const approvedCount = generated.filter(g => g.approved).length;

  const updateField = (sectionId: string, fieldKey: string, value: string) => {
    setSections(prev => prev.map(s => s.id === sectionId ? { ...s, fields: s.fields.map(f => f.key === fieldKey ? { ...f, value } : f) } : s));
  };

  const toggleApprove = (id: string) => {
    setGenerated(prev => prev.map(g => g.id === id ? { ...g, approved: !g.approved } : g));
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = (getDay(monthStart) + 6) % 7;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Conteúdos"
        subtitle="Base de conhecimento e geração mensal de roteiros"
        icon={<FileText className="w-5 h-5 text-primary" />}
      />

      <Tabs defaultValue="base">
        <TabsList>
          <TabsTrigger value="base" className="text-xs gap-1.5"><BookOpen className="w-3.5 h-3.5" /> Base de Conhecimento</TabsTrigger>
          <TabsTrigger value="geracao" className="text-xs gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Geração Mensal</TabsTrigger>
        </TabsList>

        {/* ═══ BASE DE CONHECIMENTO ═══ */}
        <TabsContent value="base" className="space-y-5 mt-4">
          <Card className="glass-card">
            <CardContent className="py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Preenchimento da Base</span>
                <span className="text-xs text-muted-foreground">{filledFields}/{totalFields} campos preenchidos</span>
              </div>
              <Progress value={kbProgress} className="h-2" />
            </CardContent>
          </Card>

          {sections.map(section => {
            const isEditing = editing === section.id;
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
                        if (isEditing) toast({ title: "Salvo com sucesso!" });
                        setEditing(isEditing ? null : section.id);
                      }}
                    >
                      {isEditing ? <><Check className="w-3.5 h-3.5" /> Salvar</> : <><Edit3 className="w-3.5 h-3.5" /> Editar</>}
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {section.fields.map(field => (
                      <div key={field.key}>
                        <Label className="text-[11px] text-muted-foreground">{field.label}</Label>
                        {isEditing ? (
                          field.type === "textarea" ? (
                            <Textarea
                              value={field.value}
                              onChange={e => updateField(section.id, field.key, e.target.value)}
                              rows={3}
                              className="mt-1"
                            />
                          ) : (
                            <Input
                              value={field.value}
                              onChange={e => updateField(section.id, field.key, e.target.value)}
                              className="mt-1"
                            />
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

        {/* ═══ GERAÇÃO MENSAL ═══ */}
        <TabsContent value="geracao" className="space-y-5 mt-4">
          {/* Briefing */}
          <Card className="glass-card border-primary/20 bg-primary/5">
            <CardContent className="py-5">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-4 h-4 text-primary" />
                <p className="text-sm font-bold">Briefing do Mês</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Tema do Mês</Label>
                  <Input value={tema} onChange={e => setTema(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Promoções</Label>
                  <Input value={promocoes} onChange={e => setPromocoes(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Datas Comemorativas</Label>
                  <Input value={datas} onChange={e => setDatas(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Destaques</Label>
                  <Input value={destaques} onChange={e => setDestaques(e.target.value)} />
                </div>
              </div>
              <Button className="w-full mt-4 gap-2" onClick={() => toast({ title: "Conteúdos gerados!", description: "8 roteiros criados para o mês." })}>
                <Sparkles className="w-4 h-4" /> Gerar Conteúdos do Mês
              </Button>
            </CardContent>
          </Card>

          {/* Counter */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-xs gap-1">
                <CheckCircle2 className="w-3 h-3 text-chart-green" /> {approvedCount} aprovados
              </Badge>
              <Badge variant="outline" className="text-xs">{generated.length} gerados</Badge>
            </div>
            <span className="text-xs text-muted-foreground">{approvedCount}/{generated.length} conteúdos aprovados</span>
          </div>

          {/* Content by week */}
          {[1, 2, 3, 4].map(week => {
            const weekContent = generated.filter(g => g.week === week);
            if (weekContent.length === 0) return null;
            return (
              <div key={week}>
                <p className="section-label mb-3">SEMANA {week}</p>
                <div className="space-y-3">
                  {weekContent.map(c => (
                    <Card key={c.id} className={`glass-card transition-all ${c.approved ? "border-chart-green/30 bg-chart-green/5" : ""}`}>
                      <CardContent className="py-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <p className="text-sm font-semibold">{c.title}</p>
                              {c.approved && <CheckCircle2 className="w-4 h-4 text-chart-green shrink-0" />}
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">{c.description}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="text-[9px]">{c.format}</Badge>
                              <Badge className={`text-[9px] ${networkColors[c.network] || ""}`}>{c.network}</Badge>
                              <Badge className={`text-[9px] ${funnelColors[c.funnel] || ""}`}>{c.funnel}</Badge>
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <CalendarIcon className="w-3 h-3" /> {c.date}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => { navigator.clipboard.writeText(c.title + "\n" + c.description); toast({ title: "Copiado!" }); }}>
                              <Copy className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Edit3 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant={c.approved ? "default" : "outline"}
                              size="sm"
                              className="h-8 text-xs gap-1"
                              onClick={() => toggleApprove(c.id)}
                            >
                              <Check className="w-3.5 h-3.5" /> {c.approved ? "Aprovado" : "Aprovar"}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Calendar */}
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
                {Array.from({ length: startPadding }).map((_, i) => <div key={`p-${i}`} className="h-16" />)}
                {days.map(day => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  const dayContent = generated.filter(g => g.date === dateStr);
                  return (
                    <div key={dateStr} className={`h-16 border rounded-md p-1 ${isSameDay(day, new Date()) ? "border-primary/50 bg-primary/5" : "border-border"}`}>
                      <span className="text-[10px] font-medium text-muted-foreground">{format(day, "d")}</span>
                      <div className="space-y-0.5 mt-0.5 overflow-hidden">
                        {dayContent.slice(0, 2).map(c => (
                          <div key={c.id} className={`text-[7px] px-1 py-0.5 rounded truncate ${c.approved ? "bg-chart-green/10 text-chart-green" : "bg-muted text-muted-foreground"}`}>
                            {c.title.slice(0, 16)}
                          </div>
                        ))}
                      </div>
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
