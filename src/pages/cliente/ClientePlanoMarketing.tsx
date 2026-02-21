import { useState, useMemo } from "react";
import { Megaphone, Save, Sparkles, Target, BarChart3, DollarSign, Filter, Rocket, ChevronDown, ChevronRight, Instagram, Facebook, Search, Youtube, Music, MessageCircle, Globe } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { getPlanoMarketing360 } from "@/data/clienteData";
import { toast } from "@/hooks/use-toast";

const iconMap: Record<string, React.ReactNode> = {
  instagram: <Instagram className="w-4 h-4" />,
  facebook: <Facebook className="w-4 h-4" />,
  search: <Search className="w-4 h-4" />,
  youtube: <Youtube className="w-4 h-4" />,
  music: <Music className="w-4 h-4" />,
  "message-circle": <MessageCircle className="w-4 h-4" />,
  globe: <Globe className="w-4 h-4" />,
};

const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))"];

export default function ClientePlanoMarketing() {
  const initial = useMemo(() => getPlanoMarketing360(), []);
  const [plano, setPlano] = useState(initial);
  const [openSections, setOpenSections] = useState<Record<number, boolean>>({ 0: true });

  const sections = [
    { title: "Posicionamento", icon: <Target className="w-4 h-4" />, filled: !!plano.posicionamento.publicoAlvo && !!plano.posicionamento.persona },
    { title: "Objetivo", icon: <Rocket className="w-4 h-4" />, filled: plano.objetivo.metaLeads > 0 },
    { title: "Canais", icon: <BarChart3 className="w-4 h-4" />, filled: plano.canais.some(c => c.active) },
    { title: "Orçamento", icon: <DollarSign className="w-4 h-4" />, filled: (plano.orcamento.organico + plano.orcamento.pago + plano.orcamento.producao) > 0 },
    { title: "Funil de Marketing", icon: <Filter className="w-4 h-4" />, filled: !!plano.funil.topo.descricao },
    { title: "Plano de Ação", icon: <Sparkles className="w-4 h-4" />, filled: plano.planoAcao.postsSemanais > 0 },
  ];

  const filledCount = sections.filter(s => s.filled).length;
  const progress = Math.round((filledCount / 6) * 100);

  const toggle = (idx: number) => setOpenSections(prev => ({ ...prev, [idx]: !prev[idx] }));

  const orcTotal = plano.orcamento.organico + plano.orcamento.pago + plano.orcamento.producao;
  const pieData = [
    { name: "Orgânico", value: plano.orcamento.organico },
    { name: "Pago", value: plano.orcamento.pago },
    { name: "Produção", value: plano.orcamento.producao },
  ];

  const updatePos = (field: string, value: any) => setPlano(p => ({ ...p, posicionamento: { ...p.posicionamento, [field]: value } }));
  const updateObj = (field: string, value: any) => setPlano(p => ({ ...p, objetivo: { ...p.objetivo, [field]: value } }));
  const updateOrc = (field: string, value: number) => setPlano(p => ({ ...p, orcamento: { ...p.orcamento, [field]: value } }));
  const toggleCanal = (idx: number) => {
    const canais = [...plano.canais];
    canais[idx] = { ...canais[idx], active: !canais[idx].active };
    setPlano(p => ({ ...p, canais }));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Plano de Marketing"
        subtitle="Estratégia completa — preencha as 6 seções para gerar seu plano de ação"
        icon={<Megaphone className="w-5 h-5 text-primary" />}
        actions={<Button size="sm" onClick={() => toast({ title: "Plano salvo com sucesso!" })}><Save className="w-4 h-4 mr-1" /> Salvar</Button>}
      />

      {/* Progress */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progresso do plano</span>
            <span className="text-sm text-muted-foreground">{filledCount}/6 seções preenchidas</span>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Sections */}
      <div className="space-y-3">
        {sections.map((sec, idx) => (
          <Collapsible key={idx} open={!!openSections[idx]} onOpenChange={() => toggle(idx)}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-md ${sec.filled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{sec.icon}</div>
                      <CardTitle className="text-sm">{sec.title}</CardTitle>
                      {sec.filled && <Badge variant="secondary" className="text-[9px]">Preenchido</Badge>}
                    </div>
                    {openSections[idx] ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0 pb-4 space-y-4">

                  {/* Section 0: Posicionamento */}
                  {idx === 0 && (
                    <>
                      <div className="space-y-2">
                        <Label>Público-alvo</Label>
                        <Textarea value={plano.posicionamento.publicoAlvo} onChange={e => updatePos("publicoAlvo", e.target.value)} rows={2} />
                      </div>
                      <div className="space-y-2">
                        <Label>Persona</Label>
                        <Textarea value={plano.posicionamento.persona} onChange={e => updatePos("persona", e.target.value)} rows={2} placeholder="Nome, idade, dor, desejo..." />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Ticket Médio (R$)</Label>
                          <Input type="number" value={plano.posicionamento.ticketMedio} onChange={e => updatePos("ticketMedio", Number(e.target.value))} />
                        </div>
                        <div className="space-y-2">
                          <Label>Mercado de Atuação</Label>
                          <Input value={plano.posicionamento.mercado} onChange={e => updatePos("mercado", e.target.value)} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Diferenciais</Label>
                        <Textarea value={plano.posicionamento.diferenciais} onChange={e => updatePos("diferenciais", e.target.value)} rows={2} />
                      </div>
                      <div className="space-y-2">
                        <Label>Concorrentes</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {plano.posicionamento.concorrentes.map((c, i) => (
                            <Input key={i} value={c} onChange={e => {
                              const conc = [...plano.posicionamento.concorrentes];
                              conc[i] = e.target.value;
                              updatePos("concorrentes", conc);
                            }} placeholder={`Concorrente ${i + 1}`} />
                          ))}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="gap-1" onClick={() => toast({ title: "IA analisando posicionamento..." })}>
                        <Sparkles className="w-3.5 h-3.5" /> Sugestão de Posicionamento com IA
                      </Button>
                    </>
                  )}

                  {/* Section 1: Objetivo */}
                  {idx === 1 && (
                    <>
                      <div className="space-y-2">
                        <Label>Tipo de Objetivo</Label>
                        <Select value={plano.objetivo.tipo} onValueChange={v => updateObj("tipo", v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="reconhecimento">Reconhecimento</SelectItem>
                            <SelectItem value="leads">Geração de Leads</SelectItem>
                            <SelectItem value="vendas">Vendas Diretas</SelectItem>
                            <SelectItem value="autoridade">Autoridade</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Meta de Leads/mês</Label>
                          <Input type="number" value={plano.objetivo.metaLeads} onChange={e => updateObj("metaLeads", Number(e.target.value))} />
                        </div>
                        <div className="space-y-2">
                          <Label>Meta de Vendas/mês</Label>
                          <Input type="number" value={plano.objetivo.metaVendas} onChange={e => updateObj("metaVendas", Number(e.target.value))} />
                        </div>
                        <div className="space-y-2">
                          <Label>ROI Esperado (%)</Label>
                          <Input type="number" value={plano.objetivo.roiEsperado} onChange={e => updateObj("roiEsperado", Number(e.target.value))} />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Section 2: Canais */}
                  {idx === 2 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {plano.canais.map((canal, i) => (
                        <div key={canal.name} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${canal.active ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"}`} onClick={() => toggleCanal(i)}>
                          <Checkbox checked={canal.active} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              {iconMap[canal.icon]}
                              <span className="text-sm font-medium">{canal.name}</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground">{canal.frequenciaSugerida}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Section 3: Orçamento */}
                  {idx === 3 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Orgânico (R$)</Label>
                          <Input type="number" value={plano.orcamento.organico} onChange={e => updateOrc("organico", Number(e.target.value))} />
                        </div>
                        <div className="space-y-2">
                          <Label>Pago / Tráfego (R$)</Label>
                          <Input type="number" value={plano.orcamento.pago} onChange={e => updateOrc("pago", Number(e.target.value))} />
                        </div>
                        <div className="space-y-2">
                          <Label>Produção / Criativos (R$)</Label>
                          <Input type="number" value={plano.orcamento.producao} onChange={e => updateOrc("producao", Number(e.target.value))} />
                        </div>
                        <Card>
                          <CardContent className="py-3">
                            <p className="text-xs text-muted-foreground">Total do Orçamento</p>
                            <p className="text-2xl font-bold text-primary">R$ {orcTotal.toLocaleString()}</p>
                          </CardContent>
                        </Card>
                      </div>
                      <div className="flex items-center justify-center">
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                              {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                            </Pie>
                            <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString()}`} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* Section 4: Funil */}
                  {idx === 4 && (
                    <div className="space-y-0">
                      {(["topo", "meio", "fundo"] as const).map((stage, i) => {
                        const data = plano.funil[stage];
                        const widths = ["w-full", "w-[85%]", "w-[65%]"];
                        const colors = ["bg-primary/10 border-primary/20", "bg-chart-2/10 border-chart-2/20", "bg-chart-3/10 border-chart-3/20"];
                        const labels = ["Topo", "Meio", "Fundo"];
                        return (
                          <div key={stage} className={`${widths[i]} mx-auto`}>
                            <div className={`p-4 border rounded-lg ${colors[i]} ${i < 2 ? "rounded-b-none border-b-0" : ""} ${i > 0 ? "rounded-t-none" : ""}`}>
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="text-[9px]">{labels[i]}</Badge>
                                <span className="text-sm font-semibold">{data.descricao}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                                <div><span className="font-medium text-foreground">Conteúdo:</span> {data.conteudo}</div>
                                <div><span className="font-medium text-foreground">Métrica:</span> {data.metrica}</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Section 5: Plano de Ação */}
                  {idx === 5 && (
                    <>
                      <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 space-y-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Sparkles className="w-4 h-4 text-primary" />
                          <span className="text-sm font-semibold">Plano gerado automaticamente</span>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2">Cronograma Semanal ({plano.planoAcao.postsSemanais} posts/semana)</p>
                          <div className="flex flex-wrap gap-2">
                            {plano.planoAcao.cronograma.map(c => (
                              <Badge key={c.dia} variant="secondary" className="text-[10px]">{c.dia}: {c.tipo}</Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Estratégia de Tráfego</p>
                          <p className="text-sm">{plano.planoAcao.estrategiaTrafego}</p>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2">Campanhas Sugeridas</p>
                          <div className="space-y-1">
                            {plano.planoAcao.campanhasSugeridas.map((c, i) => (
                              <div key={i} className="flex items-center gap-2 text-sm">
                                <Rocket className="w-3.5 h-3.5 text-primary" />
                                {c}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Landing Page Sugerida</p>
                          <p className="text-sm">{plano.planoAcao.landingPageSugerida}</p>
                        </div>
                      </div>

                      <Button className="w-full" onClick={() => toast({ title: "Plano aplicado!", description: "Os módulos de Conteúdos, Campanhas e Tráfego foram atualizados." })}>
                        <Rocket className="w-4 h-4 mr-2" /> Aplicar Plano
                      </Button>
                    </>
                  )}

                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))}
      </div>
    </div>
  );
}
