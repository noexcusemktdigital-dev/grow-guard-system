import { useState, useMemo } from "react";
import {
  Send, Plus, MessageSquare, Zap, Clock, Filter,
  ChevronDown, ChevronUp, Play, Pause, Settings2,
  ArrowRight, Check, Users, FileText, Target
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { KpiCard } from "@/components/KpiCard";
import { Progress } from "@/components/ui/progress";
import {
  getWhatsAppDisparos, getFollowUpRules, getDisparosKpis,
  getChatAccounts, type WhatsAppDisparo,
} from "@/data/clienteData";
import { toast } from "@/hooks/use-toast";

const statusColors: Record<string, string> = {
  enviado: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  agendado: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  rascunho: "bg-muted text-muted-foreground",
  andamento: "bg-orange-500/10 text-orange-400 border-orange-500/20",
};

const typeLabels: Record<string, string> = {
  unica: "Mensagem Única",
  campanha: "Campanha",
  followup: "Follow-up",
};

const typeColors: Record<string, string> = {
  unica: "from-blue-500/15 to-blue-600/5",
  campanha: "from-purple-500/15 to-purple-600/5",
  followup: "from-orange-500/15 to-orange-600/5",
};

const WIZARD_STEPS = [
  { id: 1, label: "Tipo", icon: FileText },
  { id: 2, label: "Segmento", icon: Target },
  { id: 3, label: "Mensagem", icon: MessageSquare },
  { id: 4, label: "Revisão", icon: Check },
];

export default function ClienteDisparos() {
  const disparos = useMemo(() => getWhatsAppDisparos(), []);
  const followUps = useMemo(() => getFollowUpRules(), []);
  const kpis = useMemo(() => getDisparosKpis(), []);
  const accounts = useMemo(() => getChatAccounts().filter(a => a.status === "connected"), []);
  const [followUpsOpen, setFollowUpsOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardData, setWizardData] = useState({
    name: "", type: "unica", accountId: accounts[0]?.id || "",
    funnelStage: "", temperature: "", segment: "", message: "",
  });

  const resetWizard = () => {
    setWizardStep(1);
    setWizardData({ name: "", type: "unica", accountId: accounts[0]?.id || "", funnelStage: "", temperature: "", segment: "", message: "" });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Disparos WhatsApp"
        subtitle="Envie mensagens, campanhas e follow-ups via WhatsApp"
        icon={<Send className="w-5 h-5 text-primary" />}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] gap-1 border-emerald-500/30 text-emerald-400"><Zap className="w-3 h-3" /> Z-API</Badge>
            <Button size="sm" onClick={() => { resetWizard(); setWizardOpen(true); }}>
              <Plus className="w-4 h-4 mr-1" /> Novo Disparo
            </Button>
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map((k, i) => (
          <KpiCard key={k.label} label={k.label} value={k.value} trend={k.trend} delay={i} />
        ))}
      </div>

      {/* Disparo cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {disparos.map((d, i) => (
          <Card
            key={d.id}
            className="overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer group"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${typeColors[d.type]} opacity-50`} />
            <CardContent className="relative p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{d.name}</p>
                  <p className="text-[10px] text-muted-foreground">{d.accountName}</p>
                </div>
                <Badge variant="outline" className={`text-[9px] shrink-0 ${statusColors[d.status]}`}>
                  {d.status}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <Badge className="text-[9px] bg-background/50 border" variant="outline">{typeLabels[d.type]}</Badge>
                {d.segment.map(s => (
                  <Badge key={s} variant="outline" className="text-[8px]">{s}</Badge>
                ))}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 rounded-lg bg-background/40">
                  <p className="text-sm font-bold">{d.recipients}</p>
                  <p className="text-[9px] text-muted-foreground">Dest.</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-background/40">
                  <p className="text-sm font-bold">{d.deliveryRate ? `${d.deliveryRate}%` : "—"}</p>
                  <p className="text-[9px] text-muted-foreground">Entrega</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-background/40">
                  <p className="text-sm font-bold text-primary">{d.responseRate ? `${d.responseRate}%` : "—"}</p>
                  <p className="text-[9px] text-muted-foreground">Resposta</p>
                </div>
              </div>

              {d.deliveryRate && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] text-muted-foreground">
                    <span>Entrega</span>
                    <span>{d.deliveryRate}%</span>
                  </div>
                  <Progress value={d.deliveryRate} className="h-1.5" />
                </div>
              )}

              <p className="text-[10px] text-muted-foreground">{d.sentAt || d.scheduledAt || "Rascunho"}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Follow-ups Automáticos */}
      <Collapsible open={followUpsOpen} onOpenChange={setFollowUpsOpen}>
        <Card>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="pb-3 cursor-pointer hover:bg-muted/20 transition-colors">
              <CardTitle className="text-sm flex items-center gap-2">
                <Settings2 className="w-4 h-4" /> Follow-ups Automáticos
                <Badge variant="outline" className="text-[9px] ml-auto">{followUps.filter(f => f.active).length} ativos</Badge>
                {followUpsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-3">
              {followUps.map(rule => (
                <div key={rule.id} className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/20 transition-colors">
                  <Switch checked={rule.active} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{rule.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Se não respondeu em <span className="font-semibold">{rule.daysNoResponse} dias</span> → enviar mensagem
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {rule.segment.map(s => <Badge key={s} variant="outline" className="text-[8px]">{s}</Badge>)}
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full"><Plus className="w-3.5 h-3.5 mr-1" /> Adicionar Regra</Button>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Wizard Sheet */}
      <Sheet open={wizardOpen} onOpenChange={setWizardOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Novo Disparo WhatsApp</SheetTitle>
            <SheetDescription>Preencha as etapas para criar seu disparo</SheetDescription>
          </SheetHeader>

          {/* Stepper */}
          <div className="flex items-center gap-1 mt-6 mb-8">
            {WIZARD_STEPS.map((step, i) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className={`flex items-center gap-1.5 ${wizardStep >= step.id ? "text-primary" : "text-muted-foreground"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                    wizardStep > step.id ? "bg-primary text-primary-foreground border-primary" :
                    wizardStep === step.id ? "border-primary text-primary" : "border-muted"
                  }`}>
                    {wizardStep > step.id ? <Check className="w-3.5 h-3.5" /> : step.id}
                  </div>
                  <span className="text-[10px] font-medium hidden sm:block">{step.label}</span>
                </div>
                {i < WIZARD_STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 rounded ${wizardStep > step.id ? "bg-primary" : "bg-muted"}`} />
                )}
              </div>
            ))}
          </div>

          {/* Step content */}
          <div className="space-y-5 animate-fade-in" key={wizardStep}>
            {wizardStep === 1 && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs">Nome do disparo</Label>
                  <Input
                    placeholder="Ex: Promoção de março"
                    value={wizardData.name}
                    onChange={e => setWizardData(p => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Tipo</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["unica", "campanha", "followup"] as const).map(t => (
                      <button
                        key={t}
                        className={`p-3 rounded-xl border-2 text-center transition-all ${
                          wizardData.type === t ? "border-primary bg-primary/10" : "border-muted hover:border-muted-foreground/30"
                        }`}
                        onClick={() => setWizardData(p => ({ ...p, type: t }))}
                      >
                        <p className="text-xs font-semibold">{typeLabels[t]}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Conta WhatsApp</Label>
                  <Select value={wizardData.accountId} onValueChange={v => setWizardData(p => ({ ...p, accountId: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {wizardStep === 2 && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs">Etapa do funil</Label>
                  <Select value={wizardData.funnelStage} onValueChange={v => setWizardData(p => ({ ...p, funnelStage: v }))}>
                    <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="novo">Novo Lead</SelectItem>
                      <SelectItem value="contato">Contato</SelectItem>
                      <SelectItem value="proposta">Proposta</SelectItem>
                      <SelectItem value="fechado">Fechado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Temperatura</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Quente", "Morno", "Frio"].map(t => (
                      <button
                        key={t}
                        className={`p-2.5 rounded-xl border-2 text-center text-xs font-medium transition-all ${
                          wizardData.temperature === t ? "border-primary bg-primary/10" : "border-muted hover:border-muted-foreground/30"
                        }`}
                        onClick={() => setWizardData(p => ({ ...p, temperature: p.temperature === t ? "" : t }))}
                      >
                        {t === "Quente" ? "🔥" : t === "Morno" ? "🌤️" : "❄️"} {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Tags CRM (segmento)</Label>
                  <Input
                    placeholder="Ex: Lead Quente, Decisor"
                    value={wizardData.segment}
                    onChange={e => setWizardData(p => ({ ...p, segment: e.target.value }))}
                  />
                </div>
              </>
            )}

            {wizardStep === 3 && (
              <div className="space-y-2">
                <Label className="text-xs">Mensagem</Label>
                <Textarea
                  placeholder="Digite a mensagem do disparo..."
                  className="min-h-[160px]"
                  value={wizardData.message}
                  onChange={e => setWizardData(p => ({ ...p, message: e.target.value }))}
                />
                <p className="text-[10px] text-muted-foreground">{wizardData.message.length} caracteres</p>
              </div>
            )}

            {wizardStep === 4 && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold">Revisão do Disparo</h4>
                <div className="space-y-3 p-4 rounded-xl border bg-muted/20">
                  {[
                    { l: "Nome", v: wizardData.name || "—" },
                    { l: "Tipo", v: typeLabels[wizardData.type] },
                    { l: "Temperatura", v: wizardData.temperature || "Todas" },
                    { l: "Segmento", v: wizardData.segment || "Todos" },
                  ].map(r => (
                    <div key={r.l} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{r.l}</span>
                      <span className="font-medium">{r.v}</span>
                    </div>
                  ))}
                </div>
                {wizardData.message && (
                  <div className="p-3 rounded-lg border bg-background text-sm whitespace-pre-wrap">
                    {wizardData.message}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex gap-2 mt-8">
            {wizardStep > 1 && (
              <Button variant="outline" className="flex-1" onClick={() => setWizardStep(s => s - 1)}>Voltar</Button>
            )}
            {wizardStep < 4 ? (
              <Button className="flex-1" onClick={() => setWizardStep(s => s + 1)}>
                Próximo <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            ) : (
              <Button className="flex-1" onClick={() => {
                setWizardOpen(false);
                toast({ title: "Disparo criado!", description: `"${wizardData.name}" foi adicionado com sucesso.` });
              }}>
                <Send className="w-3.5 h-3.5 mr-1" /> Enviar Disparo
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
