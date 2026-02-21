import { useState } from "react";
import {
  Megaphone, Sparkles, FileText, Share2, Globe, DollarSign,
  TrendingUp, Eye, Users, BarChart3, Clock, ArrowRight,
  CheckCircle2, AlertCircle, Lightbulb, Activity,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { DiagnosticoTermometro } from "@/components/diagnostico/DiagnosticoTermometro";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";

/* ── Mock KPI data ── */
const kpis = [
  { label: "Conteúdos Gerados", value: "32", icon: FileText, trend: "+12 este mês", color: "text-primary" },
  { label: "Artes Criadas", value: "18", icon: Share2, trend: "+6 este mês", color: "text-chart-blue" },
  { label: "Campanhas Ativas", value: "4", icon: DollarSign, trend: "Meta & Google", color: "text-chart-orange" },
  { label: "Leads do Site", value: "156", icon: Users, trend: "+23% vs mês anterior", color: "text-chart-green" },
];

const moduleStatus = [
  { name: "Conteúdos", icon: FileText, progress: 75, lastDelivery: "Roteiro Semana 3 gerado", items: "24/32 roteiros", path: "/cliente/conteudos" },
  { name: "Redes Sociais", icon: Share2, progress: 60, lastDelivery: "Pacote Feed — 12 artes", items: "18/30 artes", path: "/cliente/redes-sociais" },
  { name: "Sites", icon: Globe, progress: 100, lastDelivery: "LP Promo Março publicada", items: "3 páginas ativas", path: "/cliente/sites" },
  { name: "Tráfego Pago", icon: DollarSign, progress: 45, lastDelivery: "Campanha Meta Leads ativa", items: "R$ 3.200 investidos", path: "/cliente/trafego-pago" },
];

const insights = [
  { text: "Seus posts de carrossel têm 3x mais engajamento que posts estáticos. Considere aumentar a produção.", type: "success" },
  { text: "O investimento em tráfego pago está abaixo da meta mensal. Aumente o orçamento em 20% para atingir os resultados.", type: "warning" },
  { text: "Seu site de captura converteu 4.2% este mês — acima da média do segmento (2.8%).", type: "success" },
];

const timeline = [
  { time: "Há 2h", action: "Roteiro de conteúdo gerado para Instagram", module: "Conteúdos" },
  { time: "Há 5h", action: "3 artes do pacote mensal aprovadas", module: "Redes Sociais" },
  { time: "Ontem", action: "Campanha Meta Leads atingiu 50 conversões", module: "Tráfego Pago" },
  { time: "2 dias", action: "Landing Page 'Promo Março' publicada", module: "Sites" },
  { time: "3 dias", action: "Base de conhecimento atualizada", module: "Conteúdos" },
];

const evolutionData = [
  { mes: "Set", leads: 80, conteudos: 18, investimento: 2000 },
  { mes: "Out", leads: 95, conteudos: 22, investimento: 2400 },
  { mes: "Nov", leads: 110, conteudos: 26, investimento: 2800 },
  { mes: "Dez", leads: 130, conteudos: 28, investimento: 3000 },
  { mes: "Jan", leads: 145, conteudos: 30, investimento: 3100 },
  { mes: "Fev", leads: 156, conteudos: 32, investimento: 3200 },
];

/* ── Diagnóstico ── */
interface DiagQuestion {
  id: string;
  category: string;
  question: string;
  options: { label: string; value: number }[];
}

const diagnosticoQuestions: DiagQuestion[] = [
  { id: "pd1", category: "Presença Digital", question: "Sua empresa possui um site atualizado?", options: [{ label: "Não possui", value: 0 }, { label: "Possui mas desatualizado", value: 1 }, { label: "Possui e atualizado", value: 2 }, { label: "Otimizado para SEO", value: 3 }] },
  { id: "pd2", category: "Presença Digital", question: "Com que frequência publica nas redes sociais?", options: [{ label: "Não publica", value: 0 }, { label: "Esporadicamente", value: 1 }, { label: "Semanalmente", value: 2 }, { label: "Diariamente", value: 3 }] },
  { id: "pd3", category: "Presença Digital", question: "Utiliza Google Meu Negócio ou plataformas de avaliação?", options: [{ label: "Não", value: 0 }, { label: "Cadastrado mas inativo", value: 1 }, { label: "Ativo com avaliações", value: 2 }, { label: "Gerencia ativamente", value: 3 }] },
  { id: "es1", category: "Estratégia", question: "Possui persona / público-alvo definido?", options: [{ label: "Não", value: 0 }, { label: "Ideia vaga", value: 1 }, { label: "Documentado", value: 2 }, { label: "Validado com dados", value: 3 }] },
  { id: "es2", category: "Estratégia", question: "Possui funil de marketing estruturado?", options: [{ label: "Não sabe o que é", value: 0 }, { label: "Conhece mas não usa", value: 1 }, { label: "Parcialmente implementado", value: 2 }, { label: "Funil completo ativo", value: 3 }] },
  { id: "es3", category: "Estratégia", question: "Acompanha métricas e KPIs de marketing?", options: [{ label: "Não acompanha", value: 0 }, { label: "Olha de vez em quando", value: 1 }, { label: "Acompanha semanalmente", value: 2 }, { label: "Dashboard com metas", value: 3 }] },
  { id: "tp1", category: "Tráfego Pago", question: "Investe em tráfego pago (Google/Meta Ads)?", options: [{ label: "Nunca investiu", value: 0 }, { label: "Já testou sem resultado", value: 1 }, { label: "Investe mensalmente", value: 2 }, { label: "Campanha otimizada com ROI positivo", value: 3 }] },
  { id: "tp2", category: "Tráfego Pago", question: "Possui pixel e tags de conversão instalados?", options: [{ label: "Não", value: 0 }, { label: "Não sabe", value: 1 }, { label: "Parcialmente", value: 2 }, { label: "Tudo configurado", value: 3 }] },
  { id: "ct1", category: "Conteúdo", question: "Produz conteúdo regularmente?", options: [{ label: "Não produz", value: 0 }, { label: "Esporadicamente", value: 1 }, { label: "Planejamento mensal", value: 2 }, { label: "Calendário editorial completo", value: 3 }] },
  { id: "ct2", category: "Conteúdo", question: "Utiliza diferentes formatos (vídeo, carrossel, blog)?", options: [{ label: "Apenas imagens", value: 0 }, { label: "1-2 formatos", value: 1 }, { label: "3+ formatos", value: 2 }, { label: "Multicanal integrado", value: 3 }] },
  { id: "br1", category: "Branding", question: "Possui identidade visual definida (logo, cores, fontes)?", options: [{ label: "Não", value: 0 }, { label: "Apenas logo", value: 1 }, { label: "Logo + cores", value: 2 }, { label: "Manual de marca completo", value: 3 }] },
  { id: "br2", category: "Branding", question: "A comunicação visual é consistente entre canais?", options: [{ label: "Inconsistente", value: 0 }, { label: "Parcialmente", value: 1 }, { label: "Na maioria dos canais", value: 2 }, { label: "100% padronizado", value: 3 }] },
];

const categories = ["Presença Digital", "Estratégia", "Tráfego Pago", "Conteúdo", "Branding"];

const niveis = [
  { id: 1, label: "Iniciante", cor: "#dc2626", desc: "O marketing precisa de atenção urgente. Comece pelo básico: presença digital e identidade visual." },
  { id: 2, label: "Básico", cor: "#ea580c", desc: "Você tem alguma estrutura, mas faltam consistência e estratégia. Foque em planejamento." },
  { id: 3, label: "Intermediário", cor: "#eab308", desc: "Marketing organizado com boas práticas. Hora de otimizar e escalar resultados." },
  { id: 4, label: "Avançado", cor: "#16a34a", desc: "Marketing maduro e integrado. Foque em otimização contínua e inovação." },
];

const actionPlans: Record<number, string[]> = {
  1: ["Criar perfis nas principais redes sociais", "Definir persona e público-alvo", "Criar identidade visual básica", "Começar a publicar conteúdo semanalmente"],
  2: ["Estruturar calendário editorial mensal", "Implementar pixel e tags de conversão", "Testar primeiras campanhas de tráfego pago", "Documentar manual de marca"],
  3: ["Automatizar funil de marketing", "Diversificar formatos de conteúdo", "Otimizar campanhas com A/B testing", "Implementar dashboard de métricas"],
  4: ["Explorar novos canais e formatos", "Integrar marketing com vendas (CRM)", "Investir em conteúdo premium", "Implementar attribution modeling"],
};

export default function ClientePlanoMarketing() {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);

  const totalMaxScore = diagnosticoQuestions.length * 3;
  const totalScore = Object.values(answers).reduce((s, v) => s + v, 0);
  const percentage = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0;
  const answeredCount = Object.keys(answers).length;

  const getNivel = () => {
    if (percentage <= 25) return niveis[0];
    if (percentage <= 50) return niveis[1];
    if (percentage <= 75) return niveis[2];
    return niveis[3];
  };

  const radarData = categories.map(cat => {
    const qs = diagnosticoQuestions.filter(q => q.category === cat);
    const max = qs.length * 3;
    const score = qs.reduce((s, q) => s + (answers[q.id] || 0), 0);
    return { category: cat, value: max > 0 ? Math.round((score / max) * 100) : 0 };
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Plano de Marketing"
        subtitle="Dashboard consolidado e diagnóstico de maturidade"
        icon={<Megaphone className="w-5 h-5 text-primary" />}
      />

      <Tabs defaultValue="dashboard">
        <TabsList>
          <TabsTrigger value="dashboard" className="text-xs gap-1.5"><BarChart3 className="w-3.5 h-3.5" /> Dashboard</TabsTrigger>
          <TabsTrigger value="diagnostico" className="text-xs gap-1.5"><Activity className="w-3.5 h-3.5" /> Diagnóstico</TabsTrigger>
        </TabsList>

        {/* ═══ DASHBOARD ═══ */}
        <TabsContent value="dashboard" className="space-y-6 mt-4">
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
            {kpis.map(k => (
              <Card key={k.label} className="glass-card hover-lift">
                <CardContent className="py-5 relative overflow-hidden">
                  <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-muted/50" />
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 rounded-lg bg-muted">
                        <k.icon className={`w-4 h-4 ${k.color}`} />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">{k.label}</span>
                    </div>
                    <p className="text-3xl font-black tracking-tighter">{k.value}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-chart-green" /> {k.trend}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Module status cards */}
          <div>
            <p className="section-label mb-3">STATUS POR MÓDULO</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {moduleStatus.map(m => (
                <Card key={m.name} className="glass-card hover-lift group cursor-pointer">
                  <CardContent className="py-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-primary/10">
                          <m.icon className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-bold">{m.name}</p>
                          <p className="text-[10px] text-muted-foreground">{m.items}</p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <Progress value={m.progress} className="h-1.5 mb-2" />
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-muted-foreground">{m.lastDelivery}</p>
                      <Badge variant="outline" className="text-[9px]">{m.progress}%</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Insights */}
          <div>
            <p className="section-label mb-3">INSIGHTS E RECOMENDAÇÕES</p>
            <div className="space-y-3">
              {insights.map((ins, i) => (
                <Card key={i} className={`border-l-4 ${ins.type === "success" ? "border-l-chart-green" : "border-l-chart-orange"}`}>
                  <CardContent className="py-3 flex items-start gap-3">
                    {ins.type === "success" ? (
                      <Sparkles className="w-4 h-4 text-chart-green mt-0.5 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-chart-orange mt-0.5 shrink-0" />
                    )}
                    <p className="text-sm">{ins.text}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Evolution chart */}
            <Card className="glass-card">
              <CardContent className="py-5">
                <p className="section-label mb-4">EVOLUÇÃO MENSAL</p>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={evolutionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="mes" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip />
                      <Area type="monotone" dataKey="leads" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.1)" strokeWidth={2} name="Leads" />
                      <Area type="monotone" dataKey="conteudos" stroke="hsl(var(--chart-blue))" fill="hsl(var(--chart-blue) / 0.1)" strokeWidth={2} name="Conteúdos" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card className="glass-card">
              <CardContent className="py-5">
                <p className="section-label mb-4">ATIVIDADES RECENTES</p>
                <div className="space-y-4">
                  {timeline.map((t, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                        {i < timeline.length - 1 && <div className="w-0.5 flex-1 bg-border mt-1" />}
                      </div>
                      <div className="pb-4">
                        <p className="text-sm">{t.action}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[9px]">{t.module}</Badge>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {t.time}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══ DIAGNÓSTICO ═══ */}
        <TabsContent value="diagnostico" className="space-y-6 mt-4">
          {!showResults ? (
            <>
              <Card className="glass-card border-primary/20 bg-primary/5">
                <CardContent className="py-4 flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">Diagnóstico de Maturidade de Marketing</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Responda as {diagnosticoQuestions.length} perguntas abaixo para descobrir o nível de maturidade do seu marketing
                      e receber um plano de ação personalizado.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center justify-between">
                <Progress value={(answeredCount / diagnosticoQuestions.length) * 100} className="flex-1 h-2 mr-4" />
                <span className="text-xs text-muted-foreground shrink-0">{answeredCount}/{diagnosticoQuestions.length}</span>
              </div>

              {categories.map(cat => {
                const qs = diagnosticoQuestions.filter(q => q.category === cat);
                return (
                  <div key={cat}>
                    <p className="section-label mb-3">{cat.toUpperCase()}</p>
                    <div className="space-y-4">
                      {qs.map(q => (
                        <Card key={q.id} className="glass-card">
                          <CardContent className="py-4">
                            <p className="text-sm font-medium mb-3">{q.question}</p>
                            <RadioGroup
                              value={answers[q.id]?.toString()}
                              onValueChange={v => setAnswers(prev => ({ ...prev, [q.id]: Number(v) }))}
                              className="grid grid-cols-2 gap-2"
                            >
                              {q.options.map(opt => (
                                <div key={opt.value} className="flex items-center space-x-2">
                                  <RadioGroupItem value={opt.value.toString()} id={`${q.id}-${opt.value}`} />
                                  <Label htmlFor={`${q.id}-${opt.value}`} className="text-xs cursor-pointer">{opt.label}</Label>
                                </div>
                              ))}
                            </RadioGroup>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}

              <Button
                className="w-full"
                size="lg"
                disabled={answeredCount < diagnosticoQuestions.length}
                onClick={() => setShowResults(true)}
              >
                <Activity className="w-4 h-4 mr-2" />
                Ver Resultado ({answeredCount}/{diagnosticoQuestions.length})
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => setShowResults(false)}>
                Refazer Diagnóstico
              </Button>

              <DiagnosticoTermometro pontuacao={percentage} nivel={getNivel()} />

              {/* Radar */}
              <Card className="glass-card">
                <CardContent className="py-5">
                  <p className="section-label mb-4">RADAR POR ÁREA</p>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="hsl(var(--border))" />
                        <PolarAngleAxis dataKey="category" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                        <Radar name="Score" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Scores per category */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {radarData.map(r => (
                  <Card key={r.category} className="glass-card">
                    <CardContent className="py-4 text-center">
                      <p className="text-2xl font-black">{r.value}%</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{r.category}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Action plan */}
              <Card className="glass-card">
                <CardContent className="py-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <p className="text-sm font-bold">Plano de Ação Recomendado</p>
                    <Badge className="text-[9px] ml-auto" style={{ backgroundColor: getNivel().cor, color: "#fff" }}>
                      {getNivel().label}
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {actionPlans[getNivel().id]?.map((action, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                          {i + 1}
                        </div>
                        <p className="text-sm">{action}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
