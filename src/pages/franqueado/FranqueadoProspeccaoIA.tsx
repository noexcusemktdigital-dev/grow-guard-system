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
} from "lucide-react";
import { useState } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// ── Nova Prospecção ──────────────────────────────────────────────

function NovaProspeccaoTab() {
  const [inputs, setInputs] = useState<ProspectionInputs>({
    regiao: "",
    nicho: "",
    porte: "",
    desafio: "",
    objetivo: "Agendar reunião de diagnóstico",
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
    } catch (e: any) {
      toast.error(e.message || "Erro ao gerar prospecção");
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
    setInputs({ regiao: "", nicho: "", porte: "", desafio: "", objetivo: "Agendar reunião de diagnóstico" });
  };

  return (
    <div className="space-y-6">
      {/* Form */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" /> Configurar Prospecção
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Objetivo da Abordagem</label>
              <Select value={inputs.objetivo} onValueChange={(v) => setInputs((p) => ({ ...p, objetivo: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Agendar reunião de diagnóstico">Agendar Reunião</SelectItem>
                  <SelectItem value="Apresentar serviço">Apresentar Serviço</SelectItem>
                  <SelectItem value="Reativar contato">Reativar Contato</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Desafio Principal do Prospect</label>
            <Textarea value={inputs.desafio} onChange={(e) => setInputs((p) => ({ ...p, desafio: e.target.value }))} placeholder="Ex: Baixa presença digital, não consegue captar clientes online..." rows={3} />
          </div>
          <Button onClick={handleGenerate} className="w-full" disabled={create.isPending}>
            {create.isPending ? <RefreshCw className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
            {create.isPending ? "Gerando plano com IA..." : "Gerar Plano de Prospecção"}
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
                    {(leads ?? []).map((l: any) => (
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
              <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => copyToClipboard(result.roteiro_contato.script_telefone)}>
                <Copy className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="bg-muted/50 rounded-md p-3 relative">
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">💬 Script WhatsApp</p>
              <p className="text-sm whitespace-pre-line">{result.roteiro_contato.script_whatsapp}</p>
              <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => copyToClipboard(result.roteiro_contato.script_whatsapp)}>
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
      (p.inputs as any)?.nicho?.toLowerCase().includes(search.toLowerCase())
  );

  const getLeadName = (leadId: string | null) => {
    if (!leadId) return null;
    const lead = (leads ?? []).find((l: any) => l.id === leadId);
    return lead ? (lead as any).name : null;
  };

  return (
    <>
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar prospecções..." className="pl-9" />
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground text-sm">Carregando...</div>
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
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditTitle(p.title); setEditingId(p.id); }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    {p.lead_id ? (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateMut.mutate({ id: p.id, lead_id: null })}>
                        <Unlink className="w-3.5 h-3.5" />
                      </Button>
                    ) : null}
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMut.mutate(p.id)}>
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

// ── Scripts Comerciais ──────────────────────────────────────────

function ScriptsTab() {
  const [stage, setStage] = useState("prospeccao");
  const [briefing, setBriefing] = useState("");
  const [loading, setLoading] = useState(false);
  const [scriptResult, setScriptResult] = useState<string | null>(null);

  const stageLabels: Record<string, string> = {
    prospeccao: "Prospecção",
    diagnostico: "Diagnóstico",
    negociacao: "Negociação",
    fechamento: "Fechamento",
    objecoes: "Quebra de Objeções",
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-script", {
        body: { stage, briefing: { contexto: briefing }, context: {} },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setScriptResult(data.content);
      toast.success("Script gerado!");
    } catch (e: any) {
      toast.error(e.message || "Erro ao gerar script");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" /> Gerar Script Comercial
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Etapa do Funil</label>
            <Select value={stage} onValueChange={setStage}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(stageLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Contexto / Briefing</label>
            <Textarea value={briefing} onChange={(e) => setBriefing(e.target.value)} placeholder="Descreva o cenário, segmento do cliente, produto/serviço..." rows={4} />
          </div>
          <Button onClick={handleGenerate} className="w-full" disabled={loading}>
            {loading ? <RefreshCw className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
            {loading ? "Gerando..." : "Gerar Script"}
          </Button>
        </CardContent>
      </Card>

      {scriptResult && (
        <Card className="glass-card">
          <CardContent className="p-4 relative">
            <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8" onClick={() => { navigator.clipboard.writeText(scriptResult); toast.success("Copiado!"); }}>
              <Copy className="w-4 h-4" />
            </Button>
            <p className="text-sm whitespace-pre-line pr-10">{scriptResult}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────

export default function FranqueadoProspeccaoIA() {
  return (
    <div className="w-full space-y-6">
      <PageHeader title="Prospecção IA" subtitle="Planeje prospecções, gere scripts comerciais e arquive estratégias com IA" />

      <Tabs defaultValue="nova">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="nova"><Sparkles className="w-4 h-4 mr-1" /> Nova</TabsTrigger>
          <TabsTrigger value="historico"><History className="w-4 h-4 mr-1" /> Histórico</TabsTrigger>
          <TabsTrigger value="scripts"><MessageSquare className="w-4 h-4 mr-1" /> Scripts</TabsTrigger>
        </TabsList>

        <TabsContent value="nova" className="space-y-6">
          <NovaProspeccaoTab />
        </TabsContent>

        <TabsContent value="historico" className="space-y-6">
          <HistoricoTab />
        </TabsContent>

        <TabsContent value="scripts" className="space-y-6">
          <ScriptsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
