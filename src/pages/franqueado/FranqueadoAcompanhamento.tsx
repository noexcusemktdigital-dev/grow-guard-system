import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { useClientFollowups, useSaveFollowup, type FollowupAnalise, type FollowupPlano, type ClientFollowup } from "@/hooks/useClientFollowups";
import { extractEdgeFunctionError } from "@/lib/edgeFunctionError";
import { MONTH_NAMES } from "@/lib/formatting";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ClipboardList, Plus, Sparkles, FileDown, Save, ChevronLeft,
  CheckCircle2, XCircle, Clock, TrendingUp, Megaphone, Globe, Target,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

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

// ─── List View ───
function FollowupListView({
  strategies,
  selectedStrategyId,
  setSelectedStrategyId,
  followups,
  onNew,
  onEdit,
}: {
  strategies: any[];
  selectedStrategyId: string | null;
  setSelectedStrategyId: (v: string) => void;
  followups: ClientFollowup[];
  onNew: () => void;
  onEdit: (f: ClientFollowup) => void;
}) {
  const selectedStrategy = strategies.find((s) => s.id === selectedStrategyId);
  const clientName = selectedStrategy?.answers?.nome_empresa || selectedStrategy?.answers?.empresa || "Cliente";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-primary" />
            Acompanhamento do Cliente
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Ciclos mensais vinculados à estratégia</p>
        </div>
      </div>

      {/* Strategy selector */}
      <Card>
        <CardContent className="pt-5">
          <label className="text-sm font-medium mb-2 block">Vincular Estratégia</label>
          <Select value={selectedStrategyId || ""} onValueChange={setSelectedStrategyId}>
            <SelectTrigger><SelectValue placeholder="Selecione uma estratégia..." /></SelectTrigger>
            <SelectContent>
              {strategies.map((s: any) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.answers?.nome_empresa || s.answers?.empresa || "Sem nome"} — {new Date(s.created_at).toLocaleDateString("pt-BR")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedStrategyId && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Ciclos de {clientName}</h2>
            <Button onClick={onNew} size="sm"><Plus className="w-4 h-4 mr-1" /> Novo Ciclo</Button>
          </div>

          {followups.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum ciclo criado ainda. Clique em "Novo Ciclo" para começar.</CardContent></Card>
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
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>{(f.analise?.destaques?.length || 0)} destaques • {(f.analise?.gaps?.length || 0)} gaps</p>
                        <p>Criado em {new Date(f.created_at).toLocaleDateString("pt-BR")}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Cycle Editor ───
function FollowupEditor({
  existing,
  strategyId,
  strategyResult,
  onBack,
}: {
  existing: ClientFollowup | null;
  strategyId: string;
  strategyResult: any;
  onBack: () => void;
}) {
  const printRef = useRef<HTMLDivElement>(null);
  const saveFollowup = useSaveFollowup();
  const [monthRef, setMonthRef] = useState(existing?.month_ref || getCurrentMonthRef());
  const [status, setStatus] = useState(existing?.status || "draft");
  const [generating, setGenerating] = useState(false);

  // Análise state
  const [destaques, setDestaques] = useState<string[]>(existing?.analise?.destaques || [""]);
  const [gaps, setGaps] = useState<string[]>(existing?.analise?.gaps || [""]);
  const [observacoes, setObservacoes] = useState(existing?.analise?.observacoes || "");
  const [metricas, setMetricas] = useState(existing?.analise?.metricas || { leads: 0, conversoes: 0, trafego: 0, engajamento: 0, faturamento: 0 });
  const [entregas, setEntregas] = useState<{ nome: string; status: "feito" | "pendente" | "cancelado" }[]>(
    existing?.analise?.entregas_realizadas ||
    (strategyResult?.entregaveis || []).map((e: any) => ({ nome: e.nome || e.name || e, status: "pendente" as const }))
  );

  // Plano state
  const [plano, setPlano] = useState<FollowupPlano>(existing?.plano_proximo || {
    conteudo: { acoes: [""], entregas: [""] },
    trafego: { acoes: [""], budget: 0, plataformas: ["Meta Ads"] },
    web: { acoes: [""], entregas: [""] },
    sales: { acoes: [""], entregas: [""] },
  });

  const updatePlanoField = (section: keyof FollowupPlano, field: string, value: any) => {
    setPlano((p) => ({ ...p, [section]: { ...(p[section] as any), [field]: value } }));
  };

  const handleSave = () => {
    const analise: FollowupAnalise = { entregas_realizadas: entregas, metricas, destaques: destaques.filter(Boolean), gaps: gaps.filter(Boolean), observacoes };
    saveFollowup.mutate({ id: existing?.id, strategy_id: strategyId, month_ref: monthRef, status, analise, plano_proximo: plano });
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const analise_parcial = { entregas_realizadas: entregas, metricas, destaques: destaques.filter(Boolean), gaps: gaps.filter(Boolean) };
      const { data, error } = await supabase.functions.invoke("generate-followup", {
        body: { strategy_result: strategyResult, month_ref: monthRef, analise_parcial, ciclos_anteriores: [] },
      });
      if (error) throw await extractEdgeFunctionError(error);
      if (data?.analise) {
        if (data.analise.destaques?.length) setDestaques(data.analise.destaques);
        if (data.analise.gaps?.length) setGaps(data.analise.gaps);
        if (data.analise.observacoes) setObservacoes(data.analise.observacoes);
      }
      if (data?.plano_proximo) setPlano(data.plano_proximo);
      toast.success("Sugestões geradas pela IA!");
    } catch (e: any) {
      toast.error(e.message || "Erro ao gerar com IA");
    } finally {
      setGenerating(false);
    }
  };

  const handleExportPdf = async () => {
    if (!printRef.current) return;
    toast.info("Gerando PDF...");
    const buttons = printRef.current.querySelectorAll("button, [data-pdf-hide]");
    buttons.forEach((b) => ((b as HTMLElement).style.display = "none"));
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imgW = 210;
      const pageH = 297;
      const margin = 8;
      const contentW = imgW - margin * 2;
      const contentH = pageH - margin * 2;
      const imgH = (canvas.height * contentW) / canvas.width;
      const pdf = new jsPDF("p", "mm", "a4");
      let y = 0;
      let page = 0;
      while (y < imgH) {
        if (page > 0) pdf.addPage();
        const srcY = (y / imgH) * canvas.height;
        const srcH = Math.min((contentH / imgH) * canvas.height, canvas.height - srcY);
        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = srcH;
        sliceCanvas.getContext("2d")!.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);
        const sliceImg = sliceCanvas.toDataURL("image/jpeg", 0.92);
        const drawH = (srcH * contentW) / canvas.width;
        pdf.addImage(sliceImg, "JPEG", margin, margin, contentW, drawH);
        y += contentH;
        page++;
      }
      pdf.save(`acompanhamento-${monthRef}.pdf`);
      toast.success("PDF exportado!");
    } finally {
      buttons.forEach((b) => ((b as HTMLElement).style.display = ""));
    }
  };

  const listEditor = (items: string[], setItems: (v: string[]) => void) => (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <Input value={item} onChange={(e) => { const n = [...items]; n[i] = e.target.value; setItems(n); }} placeholder="Descreva..." className="flex-1" />
          {items.length > 1 && (
            <Button size="icon" variant="ghost" onClick={() => setItems(items.filter((_, j) => j !== i))}><XCircle className="w-4 h-4 text-destructive" /></Button>
          )}
        </div>
      ))}
      <Button size="sm" variant="outline" onClick={() => setItems([...items, ""])}><Plus className="w-3 h-3 mr-1" /> Adicionar</Button>
    </div>
  );

  const planoSection = (icon: React.ElementType, title: string, section: keyof FollowupPlano) => {
    const Icon = icon;
    const sec = (plano[section] || { acoes: [""], entregas: [""] }) as any;
    return (
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-zinc-200 flex items-center gap-2"><Icon className="w-4 h-4 text-primary" />{title}</h4>
        <div>
          <label className="text-xs text-zinc-400 mb-1 block">Ações</label>
          {listEditor(sec.acoes || [""], (v) => updatePlanoField(section, "acoes", v))}
        </div>
        {section === "trafego" ? (
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-zinc-400 mb-1 block">Budget (R$)</label>
              <Input type="number" value={sec.budget || 0} onChange={(e) => updatePlanoField(section, "budget", Number(e.target.value))} />
            </div>
            <div className="flex-1">
              <label className="text-xs text-zinc-400 mb-1 block">Plataformas</label>
              <Input value={(sec.plataformas || []).join(", ")} onChange={(e) => updatePlanoField(section, "plataformas", e.target.value.split(",").map((s: string) => s.trim()))} />
            </div>
          </div>
        ) : (
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Entregas</label>
            {listEditor(sec.entregas || [""], (v) => updatePlanoField(section, "entregas", v))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6" ref={printRef}>
      {/* Header */}
      <div className="flex items-center gap-3" data-pdf-hide>
        <Button variant="ghost" size="sm" onClick={onBack}><ChevronLeft className="w-4 h-4 mr-1" /> Voltar</Button>
        <h1 className="text-xl font-bold flex-1">{existing ? `Ciclo — ${getMonthLabel(monthRef)}` : "Novo Ciclo Mensal"}</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPdf}><FileDown className="w-4 h-4 mr-1" /> PDF</Button>
          <Button variant="outline" size="sm" onClick={handleGenerate} disabled={generating}>
            {generating ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />} Gerar com IA
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saveFollowup.isPending}>
            <Save className="w-4 h-4 mr-1" /> Salvar
          </Button>
        </div>
      </div>

      {/* Config */}
      <div className="flex gap-4 items-end" data-pdf-hide>
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

      {/* ═══ ANÁLISE DO MÊS (light theme) ═══ */}
      <div className="space-y-5">
        <h2 className="text-lg font-bold uppercase tracking-wider text-foreground border-b pb-2">📊 Análise do Mês</h2>

        {/* Entregas checklist */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Entregas Realizadas</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {entregas.map((e, i) => (
              <div key={i} className="flex items-center gap-3">
                <button
                  onClick={() => {
                    const next = e.status === "feito" ? "pendente" : e.status === "pendente" ? "cancelado" : "feito";
                    const n = [...entregas]; n[i] = { ...e, status: next as any }; setEntregas(n);
                  }}
                  className="flex-shrink-0"
                >
                  {e.status === "feito" ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : e.status === "cancelado" ? <XCircle className="w-5 h-5 text-destructive" /> : <Clock className="w-5 h-5 text-amber-500" />}
                </button>
                <span className={`text-sm flex-1 ${e.status === "cancelado" ? "line-through text-muted-foreground" : ""}`}>{e.nome}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Métricas */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {(["leads", "conversoes", "trafego", "engajamento", "faturamento"] as const).map((k) => (
            <Card key={k}>
              <CardContent className="pt-4 text-center">
                <label className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">{k}</label>
                <Input type="number" value={metricas[k] || 0} onChange={(e) => setMetricas({ ...metricas, [k]: Number(e.target.value) })} className="text-center mt-1 text-lg font-bold" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Destaques + Gaps */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-green-600">✅ O que funcionou</CardTitle></CardHeader>
            <CardContent>{listEditor(destaques, setDestaques)}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-destructive">⚠️ O que não funcionou</CardTitle></CardHeader>
            <CardContent>{listEditor(gaps, setGaps)}</CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Observações Gerais</CardTitle></CardHeader>
          <CardContent><Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={3} placeholder="Análise geral do mês..." /></CardContent>
        </Card>
      </div>

      {/* ═══ PLANO DO PRÓXIMO MÊS (dark theme) ═══ */}
      <div className="bg-zinc-950 rounded-2xl p-6 -mx-2 space-y-6">
        <h2 className="text-lg font-bold uppercase tracking-wider text-white border-b border-zinc-800 pb-2">🚀 Plano do Próximo Mês</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">{planoSection(Megaphone, "Conteúdo", "conteudo")}</div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">{planoSection(TrendingUp, "Tráfego Pago", "trafego")}</div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">{planoSection(Globe, "Web / Site", "web")}</div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">{planoSection(Target, "Sales / CRM", "sales")}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───
export default function FranqueadoAcompanhamento() {
  const { data: orgId } = useUserOrgId();
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(null);
  const [editing, setEditing] = useState<ClientFollowup | null | "new">(null);

  const { data: strategies = [] } = useQuery({
    queryKey: ["franqueado-strategies-list", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("franqueado_strategies")
        .select("id, diagnostic_answers, result, title, created_at, status")
        .eq("organization_id", orgId)
        .eq("status", "done")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: followups = [] } = useClientFollowups(selectedStrategyId);

  const selectedStrategy = strategies.find((s: any) => s.id === selectedStrategyId);

  if (editing) {
    return (
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        <FollowupEditor
          existing={editing === "new" ? null : editing}
          strategyId={selectedStrategyId!}
          strategyResult={selectedStrategy?.strategy_result}
          onBack={() => setEditing(null)}
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <FollowupListView
        strategies={strategies}
        selectedStrategyId={selectedStrategyId}
        setSelectedStrategyId={setSelectedStrategyId}
        followups={followups}
        onNew={() => setEditing("new")}
        onEdit={(f) => setEditing(f)}
      />
    </div>
  );
}
