import { useState } from "react";
import {
  useClientFolders,
  useClientFollowups,
  useSaveFollowup,
  type ClientFollowup,
  type FollowupAnalise,
  type FollowupPlano,
  type AnaliseSubSection,
  type ConteudoSection,
  type TrafegoPlataforma,
  type WebSecao,
  type VendasSection,
} from "@/hooks/useClientFollowups";
import { generateFollowupPdf } from "@/lib/followupPdfGenerator";
import { MONTH_NAMES } from "@/lib/formatting";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  FolderOpen, Plus, ChevronLeft, Save, FileDown, XCircle,
  BarChart3, Megaphone, TrendingUp, Globe, Target,
  ThumbsUp, ThumbsDown, Eye, Palette, MousePointerClick, ShoppingCart,
  ArrowUpRight, ArrowDownRight, Sparkles, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  draft: { label: "Rascunho", variant: "secondary" },
  presented: { label: "Apresentado", variant: "default" },
  approved: { label: "Aprovado", variant: "outline" },
};

function getMonthLabel(ref: string) {
  const [y, m] = ref.split("-");
  return `${MONTH_NAMES[parseInt(m, 10) - 1]} ${y}`;
}

function getCurrentMonthRef() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ─── Reusable list editor ───
function ListEditor({ items, onChange, placeholder = "Descreva..." }: { items: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <Input value={item} onChange={(e) => { const n = [...items]; n[i] = e.target.value; onChange(n); }} placeholder={placeholder} className="flex-1" />
          {items.length > 1 && (
            <Button size="icon" variant="ghost" onClick={() => onChange(items.filter((_, j) => j !== i))}><XCircle className="w-4 h-4 text-destructive" /></Button>
          )}
        </div>
      ))}
      <Button size="sm" variant="outline" onClick={() => onChange([...items, ""])}><Plus className="w-3 h-3 mr-1" /> Adicionar</Button>
    </div>
  );
}

// ─── Metric input card ───
function MetricInput({ label, value, onChange, icon: Icon }: { label: string; value: number; onChange: (v: number) => void; icon?: React.ElementType }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
      {Icon && <Icon className="w-4 h-4 text-muted-foreground shrink-0" />}
      <div className="flex-1 min-w-0">
        <label className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider block">{label}</label>
        <Input type="number" value={value || 0} onChange={(e) => onChange(Number(e.target.value))} className="h-8 mt-0.5 text-base font-semibold border-0 bg-transparent p-0 shadow-none focus-visible:ring-0" />
      </div>
    </div>
  );
}

// ─── Analysis sub-section editor ───
function AnaliseAreaEditor({
  title,
  description,
  icon: Icon,
  accentColor,
  metricLabels,
  metricIcons,
  section,
  onChange,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  accentColor: string;
  metricLabels: string[];
  metricIcons?: Record<string, React.ElementType>;
  section: AnaliseSubSection;
  onChange: (s: AnaliseSubSection) => void;
}) {
  const metricas = section.metricas || {};
  const positivos = section.positivos || [""];
  const negativos = section.negativos || [""];

  return (
    <Card className="overflow-hidden">
      <div className={`h-1 ${accentColor}`} />
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg ${accentColor} bg-opacity-10 flex items-center justify-center`}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="text-xs">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Metrics */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Métricas do Mês</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {metricLabels.map((label) => (
              <MetricInput
                key={label}
                label={label}
                value={metricas[label] || 0}
                onChange={(v) => onChange({ ...section, metricas: { ...metricas, [label]: v } })}
                icon={metricIcons?.[label]}
              />
            ))}
          </div>
        </div>

        <Separator />

        {/* Positivos & Negativos side by side */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ThumbsUp className="w-4 h-4 text-green-500" />
              <label className="text-xs font-semibold text-green-600 uppercase tracking-wider">Pontos Positivos</label>
            </div>
            <ListEditor items={positivos} onChange={(v) => onChange({ ...section, positivos: v })} placeholder="O que deu certo..." />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ThumbsDown className="w-4 h-4 text-destructive" />
              <label className="text-xs font-semibold text-destructive uppercase tracking-wider">Pontos Negativos</label>
            </div>
            <ListEditor items={negativos} onChange={(v) => onChange({ ...section, negativos: v })} placeholder="O que precisa melhorar..." />
          </div>
        </div>

        {/* Observações */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Observações</label>
          <Textarea
            value={section.observacoes || ""}
            onChange={(e) => onChange({ ...section, observacoes: e.target.value })}
            rows={2}
            placeholder="Observações específicas desta área..."
          />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── LEVEL 1: Client Folders ───
function FolderListView({ folders, onSelect }: { folders: { name: string; count: number }[]; onSelect: (name: string) => void }) {
  const [newName, setNewName] = useState("");
  const [showInput, setShowInput] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><FolderOpen className="w-6 h-6 text-primary" /> Acompanhamento de Clientes</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie ciclos mensais por cliente</p>
        </div>
        <Button onClick={() => setShowInput(true)} size="sm"><Plus className="w-4 h-4 mr-1" /> Nova Pasta</Button>
      </div>

      {showInput && (
        <Card>
          <CardContent className="pt-4 flex gap-3">
            <Input placeholder="Nome do cliente..." value={newName} onChange={(e) => setNewName(e.target.value)} className="flex-1" autoFocus />
            <Button onClick={() => { if (newName.trim()) { onSelect(newName.trim()); setShowInput(false); setNewName(""); } }} disabled={!newName.trim()}>Criar</Button>
            <Button variant="ghost" onClick={() => { setShowInput(false); setNewName(""); }}>Cancelar</Button>
          </CardContent>
        </Card>
      )}

      {folders.length === 0 && !showInput ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum cliente cadastrado. Clique em "Nova Pasta" para começar.</CardContent></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {folders.map((f) => (
            <Card key={f.name} className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => onSelect(f.name)}>
              <CardContent className="pt-5 flex items-center gap-3">
                <FolderOpen className="w-8 h-8 text-primary/60" />
                <div>
                  <p className="font-semibold">{f.name}</p>
                  <p className="text-xs text-muted-foreground">{f.count} {f.count === 1 ? "ciclo" : "ciclos"}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── LEVEL 2: Cycle list ───
function CycleListView({ clientName, followups, onBack, onNew, onEdit }: { clientName: string; followups: ClientFollowup[]; onBack: () => void; onNew: () => void; onEdit: (f: ClientFollowup) => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}><ChevronLeft className="w-4 h-4 mr-1" /> Voltar</Button>
        <h1 className="text-xl font-bold flex-1">{clientName}</h1>
        <Button onClick={onNew} size="sm"><Plus className="w-4 h-4 mr-1" /> Novo Acompanhamento</Button>
      </div>

      {followups.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum acompanhamento criado. Clique em "Novo Acompanhamento" para começar.</CardContent></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {followups.map((f) => {
            const badge = STATUS_BADGE[f.status] || STATUS_BADGE.draft;
            return (
              <Card key={f.id} className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => onEdit(f)}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{getMonthLabel(f.month_ref)}</CardTitle>
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Criado em {new Date(f.created_at).toLocaleDateString("pt-BR")}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── LEVEL 3: 5-tab Editor ───
function FollowupEditor({ existing, clientName, onBack }: { existing: ClientFollowup | null; clientName: string; onBack: () => void }) {
  const saveFollowup = useSaveFollowup();
  const [monthRef, setMonthRef] = useState(existing?.month_ref || getCurrentMonthRef());
  const [status, setStatus] = useState(existing?.status || "draft");

  // Tab 1: Análise (4 sub-seções)
  const [analiseConteudo, setAnaliseConteudo] = useState<AnaliseSubSection>(existing?.analise?.conteudo || { metricas: {}, positivos: [""], negativos: [""], observacoes: "" });
  const [analiseTrafego, setAnaliseTrafego] = useState<AnaliseSubSection>(existing?.analise?.trafego || { metricas: {}, positivos: [""], negativos: [""], observacoes: "" });
  const [analiseWeb, setAnaliseWeb] = useState<AnaliseSubSection>(existing?.analise?.web || { metricas: {}, positivos: [""], negativos: [""], observacoes: "" });
  const [analiseVendas, setAnaliseVendas] = useState<AnaliseSubSection>(existing?.analise?.vendas || { metricas: {}, positivos: [""], negativos: [""], observacoes: "" });
  const [resumoGeral, setResumoGeral] = useState(existing?.analise?.resumo_geral || "");
  const [avancosMes, setAvancosMes] = useState<string[]>(existing?.analise?.avancos_mes || [""]);
  const [pontosMelhorar, setPontosMelhorar] = useState<string[]>(existing?.analise?.pontos_melhorar || [""]);

  // Tab 2: Conteúdo
  const [conteudo, setConteudo] = useState<ConteudoSection>(existing?.plano_proximo?.conteudo || {
    roteiros: [""], artes: [""], qtd_postagens: 0, tipo_conteudo: [],
    linha_editorial: "", referencias: [""], necessidades_cliente: [""],
  });

  // Tab 3: Tráfego
  const [plataformas, setPlataformas] = useState<TrafegoPlataforma[]>(
    existing?.plano_proximo?.trafego?.plataformas || []
  );

  // Tab 4: Web
  const [webSecoes, setWebSecoes] = useState<WebSecao[]>(existing?.plano_proximo?.web?.secoes || []);

  // Tab 5: Vendas
  const [vendas, setVendas] = useState<VendasSection>(existing?.plano_proximo?.vendas || {
    analise_crm: "", estrategias: [""], melhorias: [""],
  });

  const CONTENT_TYPES = ["Reels", "Stories", "Carrossel", "Post Estático", "Vídeo Longo", "Live", "Blog"];

  const buildAnalise = (): FollowupAnalise => ({
    conteudo: analiseConteudo,
    trafego: analiseTrafego,
    web: analiseWeb,
    vendas: analiseVendas,
    resumo_geral: resumoGeral,
    avancos_mes: avancosMes.filter(Boolean),
    pontos_melhorar: pontosMelhorar.filter(Boolean),
  });

  const buildPlano = (): FollowupPlano => ({
    conteudo,
    trafego: { plataformas },
    web: { secoes: webSecoes },
    vendas,
  });

  const handleSave = () => {
    saveFollowup.mutate({ id: existing?.id, client_name: clientName, month_ref: monthRef, status, analise: buildAnalise(), plano_proximo: buildPlano() });
  };

  const handleExportPdf = async () => {
    toast.info("Gerando PDF...");
    try {
      await generateFollowupPdf(clientName, monthRef, buildAnalise(), buildPlano());
      toast.success("PDF exportado!");
    } catch (e: any) {
      toast.error("Erro ao gerar PDF: " + (e.message || ""));
    }
  };

  const addPlataforma = () => setPlataformas([...plataformas, { nome: "Meta Ads", tipo_campanha: "", conteudo_campanha: "", publicos: "", objetivo: "", investimento: 0, divisao_investimento: "", metricas_meta: "" }]);
  const updatePlataforma = (idx: number, field: keyof TrafegoPlataforma, value: any) => {
    const n = [...plataformas]; n[idx] = { ...n[idx], [field]: value }; setPlataformas(n);
  };
  const removePlataforma = (idx: number) => setPlataformas(plataformas.filter((_, i) => i !== idx));

  const addWebSecao = () => setWebSecoes([...webSecoes, { titulo: "", motivo: "", necessidades_cliente: "" }]);
  const updateWebSecao = (idx: number, field: keyof WebSecao, value: string) => {
    const n = [...webSecoes]; n[idx] = { ...n[idx], [field]: value }; setWebSecoes(n);
  };
  const removeWebSecao = (idx: number) => setWebSecoes(webSecoes.filter((_, i) => i !== idx));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="sm" onClick={onBack}><ChevronLeft className="w-4 h-4 mr-1" /> Voltar</Button>
        <h1 className="text-xl font-bold flex-1">{existing ? `${clientName} — ${getMonthLabel(monthRef)}` : `Novo Acompanhamento — ${clientName}`}</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPdf}><FileDown className="w-4 h-4 mr-1" /> PDF</Button>
          <Button size="sm" onClick={handleSave} disabled={saveFollowup.isPending}><Save className="w-4 h-4 mr-1" /> Salvar</Button>
        </div>
      </div>

      {/* Config row */}
      <div className="flex gap-4 items-end flex-wrap">
        <div>
          <label className="text-xs font-medium mb-1 block">Mês de Referência</label>
          <Input type="month" value={monthRef} onChange={(e) => setMonthRef(e.target.value)} className="w-44" />
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block">Status</label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Rascunho</SelectItem>
              <SelectItem value="presented">Apresentado</SelectItem>
              <SelectItem value="approved">Aprovado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 5 Tabs */}
      <Tabs defaultValue="analise" className="w-full">
        <TabsList className="w-full grid grid-cols-5">
          <TabsTrigger value="analise" className="text-xs gap-1"><BarChart3 className="w-3.5 h-3.5" /> Análise</TabsTrigger>
          <TabsTrigger value="conteudo" className="text-xs gap-1"><Megaphone className="w-3.5 h-3.5" /> Conteúdo</TabsTrigger>
          <TabsTrigger value="trafego" className="text-xs gap-1"><TrendingUp className="w-3.5 h-3.5" /> Tráfego</TabsTrigger>
          <TabsTrigger value="web" className="text-xs gap-1"><Globe className="w-3.5 h-3.5" /> Web</TabsTrigger>
          <TabsTrigger value="vendas" className="text-xs gap-1"><Target className="w-3.5 h-3.5" /> Vendas</TabsTrigger>
        </TabsList>

        {/* ── TAB 1: Análise (4 sub-seções) ── */}
        <TabsContent value="analise" className="space-y-6 mt-4">
          <div className="bg-muted/30 rounded-lg p-4 border">
            <div className="flex items-center gap-2 mb-1">
              <Eye className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold">Análise do Mês Atual</h2>
            </div>
            <p className="text-sm text-muted-foreground">Analise o estado atual de cada área para fundamentar o plano do próximo mês.</p>
          </div>

          {/* 1. Conteúdo & Criativos */}
          <AnaliseAreaEditor
            title="Conteúdo & Criativos"
            description="Análise dos criativos orgânicos e pagos — alcance, engajamento e performance"
            icon={Palette}
            accentColor="bg-violet-500"
            metricLabels={["Alcance Orgânico", "Engajamento", "Impressões", "Cliques no Link", "Seguidores Novos", "Posts Publicados"]}
            section={analiseConteudo}
            onChange={setAnaliseConteudo}
          />

          {/* 2. Tráfego Pago */}
          <AnaliseAreaEditor
            title="Tráfego Pago"
            description="Números das campanhas pagas — investimento, custo por resultado e conversões"
            icon={MousePointerClick}
            accentColor="bg-blue-500"
            metricLabels={["Investimento Total", "Impressões", "Cliques", "CTR (%)", "CPC (R$)", "CPL (R$)", "Conversões", "ROAS"]}
            section={analiseTrafego}
            onChange={setAnaliseTrafego}
          />

          {/* 3. Web / Site */}
          <AnaliseAreaEditor
            title="Web / Site"
            description="Desempenho do site e landing pages — visitas, taxa de conversão e comportamento"
            icon={Globe}
            accentColor="bg-emerald-500"
            metricLabels={["Sessões", "Usuários Únicos", "Taxa de Rejeição (%)", "Tempo Médio (s)", "Conversões Site", "Páginas/Sessão"]}
            section={analiseWeb}
            onChange={setAnaliseWeb}
          />

          {/* 4. Vendas */}
          <AnaliseAreaEditor
            title="Vendas / CRM"
            description="Resultados comerciais — leads qualificados, propostas e fechamentos"
            icon={ShoppingCart}
            accentColor="bg-orange-500"
            metricLabels={["Leads Gerados", "Leads Qualificados", "Propostas Enviadas", "Vendas Fechadas", "Ticket Médio (R$)", "Faturamento (R$)"]}
            section={analiseVendas}
            onChange={setAnaliseVendas}
          />

          <Separator className="my-2" />

          {/* Resumo Geral */}
          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <CardTitle className="text-base">Resumo Geral do Mês</CardTitle>
              </div>
              <CardDescription className="text-xs">Visão consolidada do desempenho e próximos passos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Análise Geral</label>
                <Textarea value={resumoGeral} onChange={(e) => setResumoGeral(e.target.value)} rows={3} placeholder="Resumo geral do mês — contexto e insights..." />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ArrowUpRight className="w-4 h-4 text-green-500" />
                    <label className="text-xs font-semibold text-green-600 uppercase tracking-wider">Avanços do Mês</label>
                  </div>
                  <ListEditor items={avancosMes} onChange={setAvancosMes} placeholder="Conquista ou avanço..." />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <label className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Pontos a Melhorar</label>
                  </div>
                  <ListEditor items={pontosMelhorar} onChange={setPontosMelhorar} placeholder="Ponto de melhoria..." />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB 2: Conteúdo ── */}
        <TabsContent value="conteudo" className="space-y-5 mt-4">
          <div className="bg-muted/30 rounded-lg p-4 border">
            <div className="flex items-center gap-2 mb-1">
              <Megaphone className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold">Plano de Conteúdo — Próximo Mês</h2>
            </div>
            <p className="text-sm text-muted-foreground">Defina a estratégia de conteúdo baseada na análise do mês atual.</p>
          </div>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Linha Editorial</CardTitle></CardHeader>
            <CardContent><Textarea value={conteudo.linha_editorial || ""} onChange={(e) => setConteudo({ ...conteudo, linha_editorial: e.target.value })} rows={3} placeholder="Descreva a linha editorial..." /></CardContent>
          </Card>
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Quantidade de Postagens</CardTitle></CardHeader>
              <CardContent><Input type="number" value={conteudo.qtd_postagens || 0} onChange={(e) => setConteudo({ ...conteudo, qtd_postagens: Number(e.target.value) })} /></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Tipos de Conteúdo</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {CONTENT_TYPES.map((t) => {
                    const active = conteudo.tipo_conteudo?.includes(t);
                    return (
                      <Badge key={t} variant={active ? "default" : "outline"} className="cursor-pointer" onClick={() => {
                        const current = conteudo.tipo_conteudo || [];
                        setConteudo({ ...conteudo, tipo_conteudo: active ? current.filter((x) => x !== t) : [...current, t] });
                      }}>{t}</Badge>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Roteiros</CardTitle></CardHeader>
            <CardContent><ListEditor items={conteudo.roteiros || [""]} onChange={(v) => setConteudo({ ...conteudo, roteiros: v })} placeholder="Descrição do roteiro..." /></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Artes / Criativos</CardTitle></CardHeader>
            <CardContent><ListEditor items={conteudo.artes || [""]} onChange={(v) => setConteudo({ ...conteudo, artes: v })} placeholder="Descrição da arte..." /></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Referências</CardTitle></CardHeader>
            <CardContent><ListEditor items={conteudo.referencias || [""]} onChange={(v) => setConteudo({ ...conteudo, referencias: v })} placeholder="Link ou descrição..." /></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Necessidades do Cliente</CardTitle></CardHeader>
            <CardContent><ListEditor items={conteudo.necessidades_cliente || [""]} onChange={(v) => setConteudo({ ...conteudo, necessidades_cliente: v })} placeholder="O que precisa do cliente..." /></CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB 3: Tráfego ── */}
        <TabsContent value="trafego" className="space-y-5 mt-4">
          <div className="bg-muted/30 rounded-lg p-4 border">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold">Plano de Tráfego Pago — Próximo Mês</h2>
            </div>
            <p className="text-sm text-muted-foreground">Defina as campanhas e investimentos baseados na análise do mês atual.</p>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Plataformas</h3>
            <Button size="sm" variant="outline" onClick={addPlataforma}><Plus className="w-3 h-3 mr-1" /> Plataforma</Button>
          </div>
          {plataformas.length === 0 && (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhuma plataforma adicionada.</CardContent></Card>
          )}
          {plataformas.map((p, idx) => (
            <Card key={idx}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Input value={p.nome} onChange={(e) => updatePlataforma(idx, "nome", e.target.value)} className="w-48 font-semibold" placeholder="Nome da plataforma" />
                  <Button size="icon" variant="ghost" onClick={() => removePlataforma(idx)}><XCircle className="w-4 h-4 text-destructive" /></Button>
                </div>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block">Tipo de Campanha</label>
                  <Input value={p.tipo_campanha} onChange={(e) => updatePlataforma(idx, "tipo_campanha", e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">O que vai rodar</label>
                  <Input value={p.conteudo_campanha} onChange={(e) => updatePlataforma(idx, "conteudo_campanha", e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Públicos-alvo</label>
                  <Input value={p.publicos} onChange={(e) => updatePlataforma(idx, "publicos", e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Objetivo</label>
                  <Input value={p.objetivo} onChange={(e) => updatePlataforma(idx, "objetivo", e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Investimento (R$)</label>
                  <Input type="number" value={p.investimento} onChange={(e) => updatePlataforma(idx, "investimento", Number(e.target.value))} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Divisão do Investimento</label>
                  <Input value={p.divisao_investimento} onChange={(e) => updatePlataforma(idx, "divisao_investimento", e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-medium mb-1 block">Métricas Meta</label>
                  <Textarea value={p.metricas_meta} onChange={(e) => updatePlataforma(idx, "metricas_meta", e.target.value)} rows={2} placeholder="KPIs que precisam ser alcançados..." />
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ── TAB 4: Web ── */}
        <TabsContent value="web" className="space-y-5 mt-4">
          <div className="bg-muted/30 rounded-lg p-4 border">
            <div className="flex items-center gap-2 mb-1">
              <Globe className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold">Plano Web / Landing Pages — Próximo Mês</h2>
            </div>
            <p className="text-sm text-muted-foreground">Defina alterações e criação de páginas baseadas na análise do mês atual.</p>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Seções / Páginas</h3>
            <Button size="sm" variant="outline" onClick={addWebSecao}><Plus className="w-3 h-3 mr-1" /> Seção</Button>
          </div>
          {webSecoes.length === 0 && (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhuma seção web adicionada.</CardContent></Card>
          )}
          {webSecoes.map((s, idx) => (
            <Card key={idx}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Input value={s.titulo} onChange={(e) => updateWebSecao(idx, "titulo", e.target.value)} className="w-64 font-semibold" placeholder="Título da seção/página" />
                  <Button size="icon" variant="ghost" onClick={() => removeWebSecao(idx)}><XCircle className="w-4 h-4 text-destructive" /></Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-xs font-medium mb-1 block">Motivo / Justificativa</label>
                  <Textarea value={s.motivo} onChange={(e) => updateWebSecao(idx, "motivo", e.target.value)} rows={2} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Necessidades do Cliente</label>
                  <Textarea value={s.necessidades_cliente} onChange={(e) => updateWebSecao(idx, "necessidades_cliente", e.target.value)} rows={2} />
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ── TAB 5: Vendas ── */}
        <TabsContent value="vendas" className="space-y-5 mt-4">
          <div className="bg-muted/30 rounded-lg p-4 border">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold">Plano de Vendas / CRM — Próximo Mês</h2>
            </div>
            <p className="text-sm text-muted-foreground">Defina estratégias comerciais baseadas na análise do mês atual.</p>
          </div>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Análise do CRM</CardTitle></CardHeader>
            <CardContent><Textarea value={vendas.analise_crm || ""} onChange={(e) => setVendas({ ...vendas, analise_crm: e.target.value })} rows={4} placeholder="Análise geral do CRM..." /></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Estratégias Propostas</CardTitle></CardHeader>
            <CardContent><ListEditor items={vendas.estrategias || [""]} onChange={(v) => setVendas({ ...vendas, estrategias: v })} placeholder="Descreva a estratégia..." /></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Melhorias Sugeridas</CardTitle></CardHeader>
            <CardContent><ListEditor items={vendas.melhorias || [""]} onChange={(v) => setVendas({ ...vendas, melhorias: v })} placeholder="Descreva a melhoria..." /></CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Main Page ───
export default function FranqueadoAcompanhamento() {
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [editing, setEditing] = useState<ClientFollowup | null | "new">(null);

  const { data: folders = [] } = useClientFolders();
  const { data: followups = [] } = useClientFollowups(selectedClient);

  if (editing) {
    return (
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        <FollowupEditor
          existing={editing === "new" ? null : editing}
          clientName={selectedClient!}
          onBack={() => setEditing(null)}
        />
      </div>
    );
  }

  if (selectedClient) {
    return (
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        <CycleListView
          clientName={selectedClient}
          followups={followups}
          onBack={() => setSelectedClient(null)}
          onNew={() => setEditing("new")}
          onEdit={(f) => setEditing(f)}
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <FolderListView
        folders={folders}
        onSelect={setSelectedClient}
      />
    </div>
  );
}
