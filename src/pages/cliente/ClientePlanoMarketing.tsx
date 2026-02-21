import { useState, useMemo } from "react";
import { Megaphone, Save, Sparkles, Target, BarChart3, DollarSign, Filter, Rocket, CheckCircle2, Circle, Instagram, Facebook, Search, Youtube, Music, MessageCircle, Globe } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

const STEPS = [
  { key: "posicionamento", title: "Posicionamento", icon: <Target className="w-4 h-4" /> },
  { key: "objetivo", title: "Objetivo", icon: <Rocket className="w-4 h-4" /> },
  { key: "canais", title: "Canais", icon: <BarChart3 className="w-4 h-4" /> },
  { key: "orcamento", title: "Orçamento", icon: <DollarSign className="w-4 h-4" /> },
  { key: "funil", title: "Funil de Marketing", icon: <Filter className="w-4 h-4" /> },
  { key: "plano_acao", title: "Plano de Ação", icon: <Sparkles className="w-4 h-4" /> },
];

export default function ClientePlanoMarketing() {
  const initial = useMemo(() => getPlanoMarketing360(), []);
  const [plano, setPlano] = useState(initial);
  const [activeStep, setActiveStep] = useState(0);

  const filledSteps = [
    !!plano.posicionamento.publicoAlvo && !!plano.posicionamento.persona,
    plano.objetivo.metaLeads > 0,
    plano.canais.some(c => c.active),
    (plano.orcamento.organico + plano.orcamento.pago + plano.orcamento.producao) > 0,
    !!plano.funil.topo.descricao,
    plano.planoAcao.postsSemanais > 0,
  ];

  const filledCount = filledSteps.filter(Boolean).length;
  const progress = Math.round((filledCount / 6) * 100);

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

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <div className="space-y-4">
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
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
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
          </div>
        );
      case 2:
        return (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
        );
      case 3:
        return (
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
        );
      case 4:
        return (
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
        );
      case 5:
        return (
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
        );
      default:
        return null;
    }
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

      {/* Stepper Layout */}
      <div className="flex gap-6">
        {/* Vertical Stepper Sidebar */}
        <div className="w-56 shrink-0">
          <div className="sticky top-4 space-y-1">
            {STEPS.map((step, idx) => {
              const isActive = activeStep === idx;
              const isFilled = filledSteps[idx];
              return (
                <button
                  key={step.key}
                  onClick={() => setActiveStep(idx)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all ${
                    isActive
                      ? "bg-primary/10 border border-primary/30 shadow-sm"
                      : "hover:bg-muted/50 border border-transparent"
                  }`}
                >
                  {/* Step indicator */}
                  <div className="relative flex items-center justify-center">
                    {isFilled ? (
                      <CheckCircle2 className={`w-5 h-5 ${isActive ? "text-primary" : "text-emerald-500"}`} />
                    ) : (
                      <Circle className={`w-5 h-5 ${isActive ? "text-primary" : "text-muted-foreground/40"}`} />
                    )}
                  </div>
                  {/* Connector line */}
                  {idx < STEPS.length - 1 && (
                    <div className={`absolute left-[1.65rem] top-[3.25rem] w-0.5 h-4 ${
                      filledSteps[idx] ? "bg-emerald-500/30" : "bg-muted-foreground/10"
                    }`} />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`${isActive ? "text-primary" : "text-muted-foreground"}`}>{step.icon}</span>
                      <span className={`text-xs font-medium truncate ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                        {step.title}
                      </span>
                    </div>
                  </div>
                  {isFilled && !isActive && (
                    <Badge variant="secondary" className="text-[8px] h-4 px-1.5">OK</Badge>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 min-w-0">
          <Card>
            <CardContent className="py-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  {STEPS[activeStep].icon}
                </div>
                <div>
                  <h3 className="text-sm font-semibold">{STEPS[activeStep].title}</h3>
                  <p className="text-[11px] text-muted-foreground">Etapa {activeStep + 1} de {STEPS.length}</p>
                </div>
              </div>
              {renderStepContent()}

              {/* Navigation */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                  disabled={activeStep === 0}
                >
                  Anterior
                </Button>
                <span className="text-xs text-muted-foreground">{activeStep + 1} / {STEPS.length}</span>
                <Button
                  size="sm"
                  onClick={() => setActiveStep(Math.min(STEPS.length - 1, activeStep + 1))}
                  disabled={activeStep === STEPS.length - 1}
                >
                  Próximo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
