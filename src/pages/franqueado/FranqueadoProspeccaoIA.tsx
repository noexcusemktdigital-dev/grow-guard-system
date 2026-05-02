// @ts-nocheck
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Sparkles,
  RefreshCw,
  Target,
  MessageSquare,
  History,
  Save,
  Link2,
  Trash2,
  Copy,
  CheckCircle2,
  HelpCircle,
  Phone,
  ShieldQuestion,
  ListChecks,
  Search,
  Pencil,
  Unlink,
  BookOpen,
  CalendarClock,
  CalendarPlus,
  ClipboardList,
  Handshake,
  UserPlus,
} from "lucide-react";
import { useState } from "react";
import { playbooks, PLAYBOOK_CATEGORIAS, type Playbook } from "@/constants/prospectionPlaybooks";
import { toast } from "sonner";
import {
  useProspections,
  useCreateProspection,
  useUpdateProspection,
  useDeleteProspection,
  type ProspectionInputs,
  type ProspectionResult,
  type Prospection,
} from "@/hooks/useFranqueadoProspections";
import { useCrmLeads } from "@/hooks/useCrmLeads";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// ── Nova Prospecção ──────────────────────────────────────────────

function NovaProspeccaoTab() {
  const [inputs, setInputs] = useState<ProspectionInputs>({
    regiao: "",
    nicho: "",
    porte: "",
    desafio: "",
    objetivo: "Agendar diagnóstico gratuito",
    nome_empresa: "",
    site: "",
    redes_sociais: "",
    conhecimento_previo: "",
    nivel_contato: "frio",
    contato_decisor: "",
    cargo_decisor: "",
  });
  const [result, setResult] = useState<ProspectionResult | null>(null);
  const [prospectionId, setProspectionId] = useState<string | null>(null);
  const [linkLeadId, setLinkLeadId] = useState<string>("");

  const create = useCreateProspection();
  const update = useUpdateProspection();
  const { data: leads } = useCrmLeads();

  const handleGenerate = async () => {
    if (!inputs.regiao.trim() || !inputs.nicho.trim()) {
      toast.error("Preencha pelo menos Região e Nicho");
      return;
    }
    try {
      const p = await create.mutateAsync(inputs);
      setResult(p.result);
      setProspectionId(p.id);
      toast.success("Plano de prospecção gerado com sucesso!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e) || "Erro ao gerar prospecção");
    }
  };

  const handleLinkLead = () => {
    if (!prospectionId || !linkLeadId) return;
    update.mutate({ id: prospectionId, lead_id: linkLeadId });
    toast.success("Vinculado ao lead!");
  };

  const handleReset = () => {
    setResult(null);
    setProspectionId(null);
    setInputs({ regiao: "", nicho: "", porte: "", desafio: "", objetivo: "Agendar diagnóstico gratuito", nome_empresa: "", site: "", redes_sociais: "", conhecimento_previo: "", nivel_contato: "frio", contato_decisor: "", cargo_decisor: "" });
  };

  return (
    <div className="space-y-6">
      {/* Form */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" /> Criar Prospecção
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Nome da Empresa *</label>
              <Input value={inputs.nome_empresa} onChange={(e) => setInputs((p) => ({ ...p, nome_empresa: e.target.value }))} placeholder="Ex: Clínica Beleza Natural" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Região *</label>
              <Input value={inputs.regiao} onChange={(e) => setInputs((p) => ({ ...p, regiao: e.target.value }))} placeholder="Ex: Curitiba e região" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Nicho / Segmento *</label>
              <Input value={inputs.nicho} onChange={(e) => setInputs((p) => ({ ...p, nicho: e.target.value }))} placeholder="Ex: Clínicas de estética" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Porte do Prospect</label>
              <Select value={inputs.porte} onValueChange={(v) => setInputs((p) => ({ ...p, porte: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MEI">MEI</SelectItem>
                  <SelectItem value="ME">ME</SelectItem>
                  <SelectItem value="EPP">EPP</SelectItem>
                  <SelectItem value="Médio">Médio</SelectItem>
                  <SelectItem value="Grande">Grande</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Nível de Contato</label>
              <Select value={inputs.nivel_contato || "frio"} onValueChange={(v) => setInputs((p) => ({ ...p, nivel_contato: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="frio">🧊 Frio - Nunca falou</SelectItem>
                  <SelectItem value="morno">🌡️ Morno - Já houve contato</SelectItem>
                  <SelectItem value="quente">🔥 Quente - Já demonstrou interesse</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Objetivo da Abordagem</label>
              <Select value={inputs.objetivo} onValueChange={(v) => setInputs((p) => ({ ...p, objetivo: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Agendar diagnóstico gratuito">Agendar diagnóstico gratuito</SelectItem>
                  <SelectItem value="Retomar conversa com lead">Retomar conversa com lead</SelectItem>
                  <SelectItem value="Lead quente por indicação — agendar reunião">Lead quente por indicação — agendar reunião</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Site da Empresa</label>
              <Input value={inputs.site} onChange={(e) => setInputs((p) => ({ ...p, site: e.target.value }))} placeholder="https://..." />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Redes Sociais</label>
              <Input value={inputs.redes_sociais} onChange={(e) => setInputs((p) => ({ ...p, redes_sociais: e.target.value }))} placeholder="@instagram, LinkedIn, etc" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Nome do Decisor</label>
              <Input value={inputs.contato_decisor} onChange={(e) => setInputs((p) => ({ ...p, contato_decisor: e.target.value }))} placeholder="Ex: João Silva" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Cargo do Decisor</label>
              <Input value={inputs.cargo_decisor} onChange={(e) => setInputs((p) => ({ ...p, cargo_decisor: e.target.value }))} placeholder="Ex: CEO, Sócio, Gerente" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">O que já sabe sobre a empresa?</label>
            <Textarea value={inputs.conhecimento_previo} onChange={(e) => setInputs((p) => ({ ...p, conhecimento_previo: e.target.value }))} placeholder="Ex: Vi no Instagram que fazem promoções com frequência, mas não investem em tráfego pago..." rows={3} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Principal dor ou necessidade identificada</label>
            <Textarea value={inputs.desafio} onChange={(e) => setInputs((p) => ({ ...p, desafio: e.target.value }))} placeholder="Ex: Baixa presença digital, não consegue captar clientes online..." rows={3} />
          </div>
          <Button onClick={handleGenerate} className="w-full" disabled={create.isPending}>
            {create.isPending ? <RefreshCw className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
            {create.isPending ? "Gerando plano com a nossa IA..." : "Gerar Plano de Prospecção"}
          </Button>
        </CardContent>
      </Card>

      {/* Result */}
      {result && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RefreshCw className="w-4 h-4 mr-1" /> Gerar Novo
            </Button>
            {prospectionId && (
              <div className="flex items-center gap-2">
                <Select value={linkLeadId} onValueChange={setLinkLeadId}>
                  <SelectTrigger className="w-[200px] h-9">
                    <SelectValue placeholder="Vincular ao Lead..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(leads ?? []).map((l) => (
                      <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={handleLinkLead} disabled={!linkLeadId}>
                  <Link2 className="w-4 h-4 mr-1" /> Vincular
                </Button>
              </div>
            )}
          </div>
          <ProspectionResultCards result={result} />
        </div>
      )}
    </div>
  );
}

// ── Result cards ────────────────────────────────────────────────

const sectionMeta: Record<string, { icon: React.ElementType; color: string }> = {
  estrategia_abordagem: { icon: Target, color: "text-blue-500" },
  avaliacao_inicial: { icon: HelpCircle, color: "text-amber-500" },
  roteiro_contato: { icon: Phone, color: "text-green-500" },
  quebra_objecoes: { icon: ShieldQuestion, color: "text-red-500" },
  passo_a_passo_reuniao: { icon: ListChecks, color: "text-purple-500" },
};

function ProspectionResultCards({ result }: { result: ProspectionResult }) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  };

  return (
    <div className="grid gap-4">
      {/* Estratégia de Abordagem */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-500" />
            {result.estrategia_abordagem.titulo}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{result.estrategia_abordagem.descricao}</p>
          <div className="space-y-1">
            {result.estrategia_abordagem.passos.map((p, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="bg-primary/10 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0 mt-0.5">{i + 1}</span>
                <span>{p}</span>
              </div>
            ))}
          </div>
          {result.estrategia_abordagem.dicas.length > 0 && (
            <div className="bg-muted/50 rounded-md p-3 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Dicas</p>
              {result.estrategia_abordagem.dicas.map((d, i) => (
                <p key={i} className="text-sm">💡 {d}</p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Avaliação Inicial */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-amber-500" />
            {result.avaliacao_inicial.titulo}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">{result.avaliacao_inicial.descricao}</p>
          {result.avaliacao_inicial.perguntas.map((q, i) => (
            <div key={i} className="border rounded-md p-3 space-y-1">
              <p className="text-sm font-medium">❓ {q.pergunta}</p>
              <p className="text-xs text-muted-foreground">Objetivo: {q.objetivo}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Roteiro de Contato */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Phone className="w-4 h-4 text-green-500" />
            {result.roteiro_contato.titulo}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{result.roteiro_contato.descricao}</p>
          <div className="space-y-3">
            <div className="bg-muted/50 rounded-md p-3 relative">
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">📞 Script Telefone</p>
              <p className="text-sm whitespace-pre-line">{result.roteiro_contato.script_telefone}</p>
              <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => copyToClipboard(result.roteiro_contato.script_telefone)} aria-label="Copiar">
                <Copy className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="bg-muted/50 rounded-md p-3 relative">
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">💬 Script WhatsApp</p>
              <p className="text-sm whitespace-pre-line">{result.roteiro_contato.script_whatsapp}</p>
              <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => copyToClipboard(result.roteiro_contato.script_whatsapp)} aria-label="Copiar">
                <Copy className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quebra de Objeções */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <ShieldQuestion className="w-4 h-4 text-red-500" />
            {result.quebra_objecoes.titulo}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">{result.quebra_objecoes.descricao}</p>
          {result.quebra_objecoes.objecoes.map((o, i) => (
            <div key={i} className="border rounded-md p-3 space-y-1">
              <p className="text-sm font-medium text-destructive">🚫 "{o.objecao}"</p>
              <p className="text-sm text-foreground">✅ {o.resposta}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Passo a Passo para Reunião */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <ListChecks className="w-4 h-4 text-purple-500" />
            {result.passo_a_passo_reuniao.titulo}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">{result.passo_a_passo_reuniao.descricao}</p>
          {result.passo_a_passo_reuniao.checklist.map((item, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span>{item}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Histórico ───────────────────────────────────────────────────

function HistoricoTab() {
  const { data: prospections, isLoading } = useProspections();
  const deleteMut = useDeleteProspection();
  const updateMut = useUpdateProspection();
  const { data: leads } = useCrmLeads();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Prospection | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const filtered = (prospections ?? []).filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      ((p.inputs as Record<string, unknown> | null)?.nicho as string | undefined)?.toLowerCase().includes(search.toLowerCase())
  );

  const getLeadName = (leadId: string | null) => {
    if (!leadId) return null;
    const lead = (leads ?? []).find((l) => l.id === leadId);
    return lead ? (lead as unknown as { name?: string }).name : null;
  };

  return (
    <>
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar prospecções..." className="pl-9" aria-label="Buscar prospecções" />
        </div>

        {isLoading ? (
          <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">Nenhuma prospecção encontrada</div>
        ) : (
          <div className="space-y-2">
            {filtered.map((p) => (
              <Card key={p.id} className="glass-card cursor-pointer hover:ring-1 hover:ring-primary/30 transition-all" onClick={() => setSelected(p)}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="space-y-1 flex-1 min-w-0">
                    {editingId === p.id ? (
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="h-7 text-sm" />
                        <Button size="sm" variant="ghost" className="h-7" onClick={() => { updateMut.mutate({ id: p.id, title: editTitle }); setEditingId(null); }}>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm font-medium truncate">{p.title}</p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(p.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </span>
                      <Badge variant={p.status === "completed" ? "default" : "secondary"} className="text-[10px]">
                        {p.status === "completed" ? "Concluída" : p.status === "error" ? "Erro" : "Rascunho"}
                      </Badge>
                      {getLeadName(p.lead_id) && (
                        <Badge variant="outline" className="text-[10px]">
                          <Link2 className="w-3 h-3 mr-1" />{getLeadName(p.lead_id)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditTitle(p.title); setEditingId(p.id); }} aria-label="Editar">
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    {p.lead_id ? (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateMut.mutate({ id: p.id, lead_id: null })} aria-label="Desvincular">
                        <Unlink className="w-3.5 h-3.5" />
                      </Button>
                    ) : null}
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMut.mutate(p.id)} aria-label="Excluir">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{selected?.title}</SheetTitle>
          </SheetHeader>
          {selected?.result && (
            <div className="mt-4">
              <ProspectionResultCards result={selected.result} />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

// ── Playbooks Icon Map ──────────────────────────────────────────

const playbookIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Phone,
  CalendarClock,
  Target,
  ShieldQuestion,
  CalendarPlus,
  ClipboardList,
  Handshake,
  UserPlus,
};

const categoriaCores: Record<string, string> = {
  Abordagem: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  Análise: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  Objeções: "bg-red-500/10 text-red-600 dark:text-red-400",
  Fechamento: "bg-green-500/10 text-green-600 dark:text-green-400",
};

// ── Playbooks Tab ───────────────────────────────────────────────

function PlaybooksTab() {
  const [filtro, setFiltro] = useState<string>("Todos");
  const [selected, setSelected] = useState<Playbook | null>(null);

  const filtered = filtro === "Todos"
    ? playbooks
    : playbooks.filter((p) => p.categoria === filtro);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  };

  return (
    <>
      <div className="space-y-4">
        {/* Filtros */}
        <div className="flex gap-1.5 flex-wrap">
          {["Todos", ...PLAYBOOK_CATEGORIAS].map((cat) => (
            <Button
              key={cat}
              variant={filtro === cat ? "default" : "outline"}
              size="sm"
              className="text-xs"
              onClick={() => setFiltro(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((pb) => {
            const Icon = playbookIconMap[pb.icone] || BookOpen;
            return (
              <Card
                key={pb.id}
                className="glass-card cursor-pointer hover:ring-1 hover:ring-primary/30 transition-all"
                onClick={() => setSelected(pb)}
              >
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold truncate">{pb.titulo}</p>
                      <Badge className={`text-[10px] ${categoriaCores[pb.categoria] || ""}`} variant="secondary">
                        {pb.categoria}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{pb.descricao}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{pb.secoes.length} seções</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              {selected && (() => {
                const Icon = playbookIconMap[selected.icone] || BookOpen;
                return <Icon className="h-5 w-5 text-primary" />;
              })()}
              {selected?.titulo}
            </SheetTitle>
          </SheetHeader>
          {selected && (
            <div className="mt-4 space-y-6">
              <p className="text-sm text-muted-foreground">{selected.descricao}</p>

              {selected.secoes.map((secao, i) => (
                <div key={i} className="space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">{secao.titulo}</h3>
                  <p className="text-xs text-muted-foreground">{secao.descricao}</p>

                  {secao.passos && (
                    <div className="space-y-1.5">
                      {secao.passos.map((p, j) => (
                        <div key={j} className="flex items-start gap-2 text-sm">
                          <span className="bg-primary/10 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0 mt-0.5">{j + 1}</span>
                          <span>{p}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {secao.script && (
                    <div className="bg-muted/50 rounded-md p-3 relative">
                      <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => copyToClipboard(secao.script!)} aria-label="Copiar">
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                      <p className="text-sm whitespace-pre-line pr-10">{secao.script}</p>
                    </div>
                  )}

                  {secao.checklist && (
                    <div className="space-y-1">
                      {secao.checklist.map((item, j) => (
                        <div key={j} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {secao.dicas && (
                    <div className="bg-muted/50 rounded-md p-3 space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Dicas</p>
                      {secao.dicas.map((d, j) => (
                        <p key={j} className="text-sm">{d}</p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

// ── Page ─────────────────────────────────────────────────────────

export default function FranqueadoProspeccaoIA() {
  return (
    <div className="w-full space-y-6">
      <PageHeader title="Prospecção" subtitle="Planeje prospecções e arquive estratégias com a nossa IA" />

      <Tabs defaultValue="nova">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="nova"><Sparkles className="w-4 h-4 mr-1" /> Prospecção IA</TabsTrigger>
          <TabsTrigger value="historico"><History className="w-4 h-4 mr-1" /> Minhas Prospecções</TabsTrigger>
          <TabsTrigger value="playbooks"><BookOpen className="w-4 h-4 mr-1" /> Playbooks</TabsTrigger>
        </TabsList>

        <TabsContent value="nova" className="space-y-6">
          <NovaProspeccaoTab />
        </TabsContent>

        <TabsContent value="historico" className="space-y-6">
          <HistoricoTab />
        </TabsContent>

        <TabsContent value="playbooks" className="space-y-6">
          <PlaybooksTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
