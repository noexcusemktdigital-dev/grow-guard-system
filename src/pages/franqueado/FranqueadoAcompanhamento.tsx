// @ts-nocheck
import { useState, useMemo, useRef } from "react";
import {
  useClientFolders,
  useClientFoldersForUnit,
  useClientFollowups,
  useSaveFollowup,
  type ClientFollowup,
  type FollowupAnalise,
  type FollowupPlano,
  type AnaliseSubSection,
  type ConteudoSection,
  type ConteudoPauta,
  type TrafegoCampanha,
  type WebSecao,
  type VendasSection,
} from "@/hooks/useClientFollowups";
import { useAuth } from "@/contexts/AuthContext";
import { useUnits } from "@/hooks/useUnits";
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
  FolderOpen, Plus, ChevronLeft, Save, FileDown, XCircle, Presentation,
  BarChart3, Megaphone, TrendingUp, Globe, Target,
  ThumbsUp, ThumbsDown, Eye, Palette, MousePointerClick, ShoppingCart,
  ArrowUpRight, AlertTriangle, Sparkles, Calendar, Clock, Link2, FileText, Crosshair, DollarSign, Users,
  Upload, Loader2, ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell,
} from "recharts";

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  draft: { label: "Rascunho", variant: "secondary" },
  presented: { label: "Apresentado", variant: "default" },
  approved: { label: "Aprovado", variant: "outline" },
};

const CHART_COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];
const PIE_COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];

function getMonthLabel(ref: string) {
  const [y, m] = ref.split("-");
  return `${MONTH_NAMES[parseInt(m, 10) - 1]} ${y}`;
}
function getCurrentMonthRef() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ─── Reusable components ───
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

function MetricInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
      <div className="flex-1 min-w-0">
        <label className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider block">{label}</label>
        <Input type="number" value={value || 0} onChange={(e) => onChange(Number(e.target.value))} className="h-8 mt-0.5 text-base font-semibold border-0 bg-transparent p-0 shadow-none focus-visible:ring-0" />
      </div>
    </div>
  );
}

// ─── Metrics chart for analysis area ───
function AnaliseMetricsChart({ metricas, title }: { metricas: Record<string, number>; title: string }) {
  const data = useMemo(() =>
    Object.entries(metricas)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name: name.length > 12 ? name.substring(0, 12) + "..." : name, value })),
    [metricas]
  );

  if (data.length === 0) return null;

  return (
    <Card className="mt-3">
      <CardHeader className="pb-2 pt-3">
        <CardTitle className="text-xs text-muted-foreground uppercase tracking-wider">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pb-3">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
            <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ─── Analysis sub-section editor ───
function AnaliseAreaEditor({
  title, description, icon: Icon, accentColor, metricLabels, section, onChange, showImageUpload = false,
}: {
  title: string; description: string; icon: React.ElementType; accentColor: string;
  metricLabels: string[]; section: AnaliseSubSection; onChange: (s: AnaliseSubSection) => void;
  showImageUpload?: boolean;
}) {
  const metricas = section.metricas || {};
  const positivos = section.positivos || [""];
  const negativos = section.negativos || [""];
  const imagens = section.imagens || [];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const newUrls: string[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        const ext = file.name.split(".").pop() || "png";
        const path = `criativos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from("followup-assets").upload(path, file);
        if (error) { console.error(error); continue; }
        const { data: urlData } = supabase.storage.from("followup-assets").getPublicUrl(path);
        if (urlData?.publicUrl) newUrls.push(urlData.publicUrl);
      }
      if (newUrls.length > 0) {
        onChange({ ...section, imagens: [...imagens, ...newUrls] });
      }
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = (idx: number) => {
    const updated = imagens.filter((_, i) => i !== idx);
    onChange({ ...section, imagens: updated });
  };

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
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Métricas do Mês</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {metricLabels.map((label) => (
              <MetricInput key={label} label={label} value={metricas[label] || 0}
                onChange={(v) => onChange({ ...section, metricas: { ...metricas, [label]: v } })} />
            ))}
          </div>
        </div>

        <AnaliseMetricsChart metricas={metricas} title={`Visão Geral — ${title}`} />

        <Separator />

        {showImageUpload && (
          <>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5" />
                  Anúncios em Destaque
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Upload className="w-3 h-3 mr-1" />}
                  {uploading ? "Enviando..." : "Adicionar Imagem"}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>
              {imagens.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {imagens.map((url, idx) => (
                    <div key={idx} className="relative group rounded-lg overflow-hidden border bg-muted aspect-square">
                      <img src={url} alt={`Criativo ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold"
                      >
                        ✕
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-2 py-1 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                        Criativo {idx + 1}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}>
                  <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-xs text-muted-foreground">Clique para adicionar imagens dos anúncios em veiculação</p>
                  <p className="text-[10px] text-muted-foreground mt-1">PNG, JPEG • Múltiplas imagens</p>
                </div>
              )}
            </div>
            <Separator />
          </>
        )}

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

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Observações</label>
          <Textarea value={section.observacoes || ""} onChange={(e) => onChange({ ...section, observacoes: e.target.value })} rows={2} placeholder="Observações específicas..." />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Radar overview chart ───
function AnaliseOverviewRadar({ analise }: { analise: { conteudo?: AnaliseSubSection; trafego?: AnaliseSubSection; web?: AnaliseSubSection; vendas?: AnaliseSubSection } }) {
  const getScore = (s?: AnaliseSubSection) => {
    if (!s?.metricas) return 0;
    const vals = Object.values(s.metricas).filter((v) => v > 0);
    return vals.length;
  };

  const data = [
    { area: "Conteúdo", preenchido: getScore(analise.conteudo), positivos: analise.conteudo?.positivos?.filter(Boolean).length || 0 },
    { area: "Tráfego", preenchido: getScore(analise.trafego), positivos: analise.trafego?.positivos?.filter(Boolean).length || 0 },
    { area: "Web", preenchido: getScore(analise.web), positivos: analise.web?.positivos?.filter(Boolean).length || 0 },
    { area: "Vendas", preenchido: getScore(analise.vendas), positivos: analise.vendas?.positivos?.filter(Boolean).length || 0 },
  ];

  const hasData = data.some((d) => d.preenchido > 0);
  if (!hasData) return null;

  return (
    <Card>
      <CardHeader className="pb-2 pt-3">
        <CardTitle className="text-xs text-muted-foreground uppercase tracking-wider">Visão Geral das Áreas</CardTitle>
      </CardHeader>
      <CardContent className="pb-3">
        <ResponsiveContainer width="100%" height={220}>
          <RadarChart data={data}>
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis dataKey="area" tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }} />
            <PolarRadiusAxis tick={{ fontSize: 9 }} />
            <Radar name="Métricas" dataKey="preenchido" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
            <Radar name="Positivos" dataKey="positivos" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.2} />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ─── Content format distribution chart ───
function ConteudoFormatChart({ pautas }: { pautas: ConteudoPauta[] }) {
  const data = useMemo(() => {
    const map = new Map<string, number>();
    pautas.forEach((p) => { if (p.formato) map.set(p.formato, (map.get(p.formato) || 0) + 1); });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [pautas]);

  if (data.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2 pt-3">
        <CardTitle className="text-xs text-muted-foreground uppercase tracking-wider">Distribuição por Formato</CardTitle>
      </CardHeader>
      <CardContent className="pb-3 flex justify-center">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`}>
              {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ─── Campaign investment chart ───
function TrafegoInvestimentoChart({ campanhas }: { campanhas: TrafegoCampanha[] }) {
  const data = useMemo(() =>
    campanhas.filter((c) => c.investimento_total > 0).map((c) => ({
      name: c.nome_campanha || c.plataforma || "Campanha",
      investimento: c.investimento_total,
      meta_conversoes: c.meta_conversoes || 0,
    })), [campanhas]
  );

  if (data.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2 pt-3">
        <CardTitle className="text-xs text-muted-foreground uppercase tracking-wider">Investimento por Campanha</CardTitle>
      </CardHeader>
      <CardContent className="pb-3">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
            <Bar dataKey="investimento" name="Investimento (R$)" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ─── LEVEL 1: Client Folders ───
function FolderListView({ folders, onSelect, isMatriz, units }: { folders: { name: string; count: number; unit_org_id: string | null }[]; onSelect: (name: string, unitOrgId?: string) => void; isMatriz: boolean; units?: any[] }) {
  const [newName, setNewName] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [showInput, setShowInput] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><FolderOpen className="w-6 h-6 text-primary" /> Acompanhamento de Clientes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isMatriz ? "Crie e gerencie ciclos mensais vinculados às unidades" : "Visualize os acompanhamentos da sua unidade"}
          </p>
        </div>
        {isMatriz && <Button onClick={() => setShowInput(true)} size="sm"><Plus className="w-4 h-4 mr-1" /> Nova Pasta</Button>}
      </div>
      {showInput && isMatriz && (
        <Card><CardContent className="pt-4 space-y-3">
          <div className="flex gap-3">
            <Input placeholder="Nome do cliente..." value={newName} onChange={(e) => setNewName(e.target.value)} className="flex-1" autoFocus />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Vincular à Unidade</label>
            <Select value={selectedUnit} onValueChange={setSelectedUnit}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Selecione a unidade..." /></SelectTrigger>
              <SelectContent>
                {(units || []).map((u: any) => (
                  <SelectItem key={u.id} value={u.unit_org_id || u.id}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => { if (newName.trim() && selectedUnit) { onSelect(newName.trim(), selectedUnit); setShowInput(false); setNewName(""); setSelectedUnit(""); } }} disabled={!newName.trim() || !selectedUnit}>Criar</Button>
            <Button variant="ghost" onClick={() => { setShowInput(false); setNewName(""); setSelectedUnit(""); }}>Cancelar</Button>
          </div>
        </CardContent></Card>
      )}
      {folders.length === 0 && !showInput ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          {isMatriz ? "Nenhum cliente cadastrado." : "Nenhum acompanhamento vinculado à sua unidade."}
        </CardContent></Card>
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
function CycleListView({ clientName, followups, onBack, onNew, onEdit, isMatriz }: { clientName: string; followups: ClientFollowup[]; onBack: () => void; onNew: () => void; onEdit: (f: ClientFollowup) => void; isMatriz: boolean }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}><ChevronLeft className="w-4 h-4 mr-1" /> Voltar</Button>
        <h1 className="text-xl font-bold flex-1">{clientName}</h1>
        {isMatriz && <Button onClick={onNew} size="sm"><Plus className="w-4 h-4 mr-1" /> Novo Acompanhamento</Button>}
      </div>
      {followups.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum acompanhamento criado.</CardContent></Card>
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
                <CardContent><p className="text-xs text-muted-foreground">Criado em {new Date(f.created_at).toLocaleDateString("pt-BR")}</p></CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Default empty objects ───
const EMPTY_PAUTA: ConteudoPauta = { titulo: "", formato: "Reels", objetivo: "", roteiro: "", tempo_duracao: "", data_postagem: "", plataforma: "Instagram", tipo: "organico", cta: "", referencias: "", necessidades_cliente: "", observacoes: "" };
const EMPTY_CAMPANHA: TrafegoCampanha = { nome_campanha: "", plataforma: "Meta Ads", objetivo_campanha: "", tipo_campanha: "", formato_anuncio: "", publico_alvo: "", segmentacao: "", localizacao: "", faixa_etaria: "", investimento_diario: 0, investimento_total: 0, duracao_dias: 30, data_inicio: "", data_fim: "", copy_principal: "", cta: "", url_destino: "", meta_cpl: 0, meta_cpc: 0, meta_ctr: 0, meta_conversoes: 0, meta_roas: 0, observacoes: "" };
const EMPTY_WEB_SECAO: WebSecao = { titulo: "", tipo: "Landing Page", objetivo: "", descricao: "", secoes_pagina: [""], expectativa_resultado: "", necessidades_cliente: "", prazo_estimado: "", status: "A criar", observacoes: "" };

const FORMATOS = ["Reels", "Stories", "Carrossel", "Post Estático", "Vídeo Longo", "Live", "Blog", "E-mail", "Newsletter"];
const PLATAFORMAS_CONTEUDO = ["Instagram", "TikTok", "YouTube", "LinkedIn", "Facebook", "Blog", "E-mail"];
const PLATAFORMAS_ADS = ["Meta Ads", "Google Ads", "TikTok Ads", "LinkedIn Ads", "Pinterest Ads"];
const OBJETIVOS_CAMPANHA = ["Conversão", "Tráfego", "Reconhecimento", "Engajamento", "Geração de Leads", "Vídeo Views", "Mensagens", "Remarketing"];
const FORMATOS_ANUNCIO = ["Imagem Única", "Vídeo", "Carrossel", "Coleção", "Experiência Instantânea"];
const TIPOS_WEB = ["Landing Page", "Página Institucional", "Blog Post", "E-commerce", "Formulário", "Pop-up"];

// ─── LEVEL 3: Editor ───
function FollowupEditor({ existing, clientName, onBack, readOnly = false, unitOrgId }: { existing: ClientFollowup | null; clientName: string; onBack: () => void; readOnly?: boolean; unitOrgId?: string }) {
  const saveFollowup = useSaveFollowup();
  const [monthRef, setMonthRef] = useState(existing?.month_ref || getCurrentMonthRef());
  const [status, setStatus] = useState(existing?.status || "draft");

  // Análise
  const [analiseConteudo, setAnaliseConteudo] = useState<AnaliseSubSection>(existing?.analise?.conteudo || { metricas: {}, positivos: [""], negativos: [""], observacoes: "" });
  const [analiseTrafego, setAnaliseTrafego] = useState<AnaliseSubSection>(existing?.analise?.trafego || { metricas: {}, positivos: [""], negativos: [""], observacoes: "" });
  const [analiseWeb, setAnaliseWeb] = useState<AnaliseSubSection>(existing?.analise?.web || { metricas: {}, positivos: [""], negativos: [""], observacoes: "" });
  const [analiseVendas, setAnaliseVendas] = useState<AnaliseSubSection>(existing?.analise?.vendas || { metricas: {}, positivos: [""], negativos: [""], observacoes: "" });
  const [resumoGeral, setResumoGeral] = useState(existing?.analise?.resumo_geral || "");
  const [avancosMes, setAvancosMes] = useState<string[]>(existing?.analise?.avancos_mes || [""]);
  const [pontosMelhorar, setPontosMelhorar] = useState<string[]>(existing?.analise?.pontos_melhorar || [""]);

  // Conteúdo
  const [linhaEditorial, setLinhaEditorial] = useState(existing?.plano_proximo?.conteudo?.linha_editorial || "");
  const [pautas, setPautas] = useState<ConteudoPauta[]>(existing?.plano_proximo?.conteudo?.pautas || []);
  const [necessidadesConteudo, setNecessidadesConteudo] = useState<string[]>(existing?.plano_proximo?.conteudo?.necessidades_cliente || [""]);

  // Tráfego
  const [campanhas, setCampanhas] = useState<TrafegoCampanha[]>(existing?.plano_proximo?.trafego?.campanhas || []);

  // Web
  const [webSecoes, setWebSecoes] = useState<WebSecao[]>(existing?.plano_proximo?.web?.secoes || []);

  // Vendas
  const [vendas, setVendas] = useState<VendasSection>(existing?.plano_proximo?.vendas || {
    analise_crm: "", funil_atual: "", taxa_conversao: "", ticket_medio: "", meta_vendas: "",
    estrategias: [""], melhorias: [""], acoes_equipe: [""], ferramentas: [""], observacoes: "",
  });

  const buildAnalise = (): FollowupAnalise => ({
    conteudo: analiseConteudo, trafego: analiseTrafego, web: analiseWeb, vendas: analiseVendas,
    resumo_geral: resumoGeral, avancos_mes: avancosMes.filter(Boolean), pontos_melhorar: pontosMelhorar.filter(Boolean),
  });

  const buildPlano = (): FollowupPlano => ({
    conteudo: { linha_editorial: linhaEditorial, qtd_postagens: pautas.length, pautas, necessidades_cliente: necessidadesConteudo.filter(Boolean) },
    trafego: { campanhas },
    web: { secoes: webSecoes },
    vendas,
  });

  const handleSave = () => {
    if (readOnly) return;
    saveFollowup.mutate({ id: existing?.id, client_name: clientName, month_ref: monthRef, status, analise: buildAnalise(), plano_proximo: buildPlano(), unit_org_id: existing?.unit_org_id || unitOrgId });
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

  // Pauta helpers
  const addPauta = (tipo: "organico" | "pago") => setPautas([...pautas, { ...EMPTY_PAUTA, tipo }]);
  const updatePauta = (idx: number, field: keyof ConteudoPauta, value: any) => {
    const n = [...pautas]; n[idx] = { ...n[idx], [field]: value }; setPautas(n);
  };
  const removePauta = (idx: number) => setPautas(pautas.filter((_, i) => i !== idx));

  // Campanha helpers
  const addCampanha = () => setCampanhas([...campanhas, { ...EMPTY_CAMPANHA }]);
  const updateCampanha = (idx: number, field: keyof TrafegoCampanha, value: any) => {
    const n = [...campanhas]; n[idx] = { ...n[idx], [field]: value }; setCampanhas(n);
  };
  const removeCampanha = (idx: number) => setCampanhas(campanhas.filter((_, i) => i !== idx));

  // Web helpers
  const addWebSecao = () => setWebSecoes([...webSecoes, { ...EMPTY_WEB_SECAO }]);
  const updateWebSecao = (idx: number, updates: Partial<WebSecao>) => {
    const n = [...webSecoes]; n[idx] = { ...n[idx], ...updates }; setWebSecoes(n);
  };
  const removeWebSecao = (idx: number) => setWebSecoes(webSecoes.filter((_, i) => i !== idx));

  const pautasOrg = pautas.filter((p) => p.tipo === "organico");
  const pautasPago = pautas.filter((p) => p.tipo === "pago");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="sm" onClick={onBack}><ChevronLeft className="w-4 h-4 mr-1" /> Voltar</Button>
        <h1 className="text-xl font-bold flex-1">{existing ? `${clientName} — ${getMonthLabel(monthRef)}` : `Novo Acompanhamento — ${clientName}`}</h1>
        {readOnly && <Badge variant="secondary">Somente Leitura</Badge>}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPdf}><FileDown className="w-4 h-4 mr-1" /> PDF</Button>
          <Button variant="outline" size="sm" className="text-violet-600 border-violet-300 hover:bg-violet-50" onClick={() => {
            if (!existing?.id) {
              toast.info("Salve o acompanhamento antes de apresentar");
              return;
            }
            if (!readOnly) handleSave();
            window.open(`/apresentacao/${existing.id}`, "_blank");
          }}><Presentation className="w-4 h-4 mr-1" /> Apresentar</Button>
          {!readOnly && <Button size="sm" onClick={handleSave} disabled={saveFollowup.isPending}><Save className="w-4 h-4 mr-1" /> Salvar</Button>}
        </div>
      </div>

      {/* Config */}
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

        {/* ═══ TAB 1: ANÁLISE ═══ */}
        <TabsContent value="analise" className="space-y-6 mt-4">
          <div className="bg-muted/30 rounded-lg p-4 border">
            <div className="flex items-center gap-2 mb-1"><Eye className="w-5 h-5 text-primary" /><h2 className="text-lg font-bold">Análise do Mês Atual</h2></div>
            <p className="text-sm text-muted-foreground">Analise cada área para fundamentar o plano do próximo mês.</p>
          </div>

          <AnaliseOverviewRadar analise={{ conteudo: analiseConteudo, trafego: analiseTrafego, web: analiseWeb, vendas: analiseVendas }} />

          <AnaliseAreaEditor title="Conteúdo & Criativos" description="Performance dos criativos orgânicos e pagos" icon={Palette} accentColor="bg-violet-500"
            metricLabels={["Alcance Orgânico", "Engajamento", "Impressões", "Cliques no Link", "Seguidores Novos", "Posts Publicados"]}
            section={analiseConteudo} onChange={setAnaliseConteudo} />

          <AnaliseAreaEditor title="Tráfego Pago" description="Números das campanhas — investimento, custo e conversões" icon={MousePointerClick} accentColor="bg-blue-500"
            metricLabels={["Investimento Total", "Impressões", "Cliques", "CTR (%)", "CPC (R$)", "CPL (R$)", "Conversões", "ROAS"]}
            section={analiseTrafego} onChange={setAnaliseTrafego} />

          <AnaliseAreaEditor title="Web / Site" description="Desempenho do site e landing pages" icon={Globe} accentColor="bg-emerald-500"
            metricLabels={["Sessões", "Usuários Únicos", "Taxa de Rejeição (%)", "Tempo Médio (s)", "Conversões Site", "Páginas/Sessão"]}
            section={analiseWeb} onChange={setAnaliseWeb} />

          <AnaliseAreaEditor title="Vendas / CRM" description="Resultados comerciais e pipeline" icon={ShoppingCart} accentColor="bg-orange-500"
            metricLabels={["Leads Gerados", "Leads Qualificados", "Propostas Enviadas", "Vendas Fechadas", "Ticket Médio (R$)", "Faturamento (R$)"]}
            section={analiseVendas} onChange={setAnaliseVendas} />

          <Separator />

          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" /><CardTitle className="text-base">Resumo Geral</CardTitle></div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea value={resumoGeral} onChange={(e) => setResumoGeral(e.target.value)} rows={3} placeholder="Resumo geral do mês..." />
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2"><ArrowUpRight className="w-4 h-4 text-green-500" /><label className="text-xs font-semibold text-green-600 uppercase tracking-wider">Avanços do Mês</label></div>
                  <ListEditor items={avancosMes} onChange={setAvancosMes} placeholder="Conquista..." />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2"><AlertTriangle className="w-4 h-4 text-amber-500" /><label className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Pontos a Melhorar</label></div>
                  <ListEditor items={pontosMelhorar} onChange={setPontosMelhorar} placeholder="Melhoria..." />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ TAB 2: CONTEÚDO ═══ */}
        <TabsContent value="conteudo" className="space-y-6 mt-4">
          <div className="bg-muted/30 rounded-lg p-4 border">
            <div className="flex items-center gap-2 mb-1"><Megaphone className="w-5 h-5 text-primary" /><h2 className="text-lg font-bold">Plano de Conteúdo — Próximo Mês</h2></div>
            <p className="text-sm text-muted-foreground">Monte a pauta completa de conteúdo orgânico e pago.</p>
          </div>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Linha Editorial</CardTitle></CardHeader>
            <CardContent><Textarea value={linhaEditorial} onChange={(e) => setLinhaEditorial(e.target.value)} rows={3} placeholder="Descreva a linha editorial do mês..." /></CardContent>
          </Card>

          <ConteudoFormatChart pautas={pautas} />

          {/* Pauta Orgânica */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2"><Badge variant="outline" className="text-green-600 border-green-500">Orgânico</Badge><span className="text-sm font-semibold">{pautasOrg.length} posts</span></div>
              <Button size="sm" variant="outline" onClick={() => addPauta("organico")}><Plus className="w-3 h-3 mr-1" /> Post Orgânico</Button>
            </div>
            {pautasOrg.length === 0 && <Card><CardContent className="py-6 text-center text-muted-foreground text-sm">Nenhum post orgânico. Adicione acima.</CardContent></Card>}
            {pautas.map((p, idx) => p.tipo === "organico" && (
              <PautaCard key={idx} pauta={p} idx={idx} onChange={updatePauta} onRemove={removePauta} />
            ))}
          </div>

          <Separator />

          {/* Pauta Paga */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2"><Badge variant="outline" className="text-blue-600 border-blue-500">Tráfego Pago</Badge><span className="text-sm font-semibold">{pautasPago.length} criativos</span></div>
              <Button size="sm" variant="outline" onClick={() => addPauta("pago")}><Plus className="w-3 h-3 mr-1" /> Criativo Pago</Button>
            </div>
            {pautasPago.length === 0 && <Card><CardContent className="py-6 text-center text-muted-foreground text-sm">Nenhum criativo pago. Adicione acima.</CardContent></Card>}
            {pautas.map((p, idx) => p.tipo === "pago" && (
              <PautaCard key={idx} pauta={p} idx={idx} onChange={updatePauta} onRemove={removePauta} />
            ))}
          </div>

          <Separator />

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Necessidades do Cliente (Conteúdo)</CardTitle></CardHeader>
            <CardContent><ListEditor items={necessidadesConteudo} onChange={setNecessidadesConteudo} placeholder="O que precisa do cliente..." /></CardContent>
          </Card>
        </TabsContent>

        {/* ═══ TAB 3: TRÁFEGO ═══ */}
        <TabsContent value="trafego" className="space-y-6 mt-4">
          <div className="bg-muted/30 rounded-lg p-4 border">
            <div className="flex items-center gap-2 mb-1"><TrendingUp className="w-5 h-5 text-primary" /><h2 className="text-lg font-bold">Campanhas de Tráfego Pago — Próximo Mês</h2></div>
            <p className="text-sm text-muted-foreground">Monte cada campanha com todos os detalhes de execução.</p>
          </div>

          <TrafegoInvestimentoChart campanhas={campanhas} />

          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">{campanhas.length} campanha(s)</span>
            <Button size="sm" variant="outline" onClick={addCampanha}><Plus className="w-3 h-3 mr-1" /> Nova Campanha</Button>
          </div>

          {campanhas.length === 0 && <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhuma campanha adicionada.</CardContent></Card>}

          {campanhas.map((c, idx) => (
            <CampanhaCard key={idx} campanha={c} idx={idx} onChange={updateCampanha} onRemove={removeCampanha} />
          ))}
        </TabsContent>

        {/* ═══ TAB 4: WEB ═══ */}
        <TabsContent value="web" className="space-y-6 mt-4">
          <div className="bg-muted/30 rounded-lg p-4 border">
            <div className="flex items-center gap-2 mb-1"><Globe className="w-5 h-5 text-primary" /><h2 className="text-lg font-bold">Plano Web / Landing Pages — Próximo Mês</h2></div>
            <p className="text-sm text-muted-foreground">Defina cada página com objetivos, seções e o que precisa do cliente.</p>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">{webSecoes.length} página(s)</span>
            <Button size="sm" variant="outline" onClick={addWebSecao}><Plus className="w-3 h-3 mr-1" /> Nova Página</Button>
          </div>

          {webSecoes.length === 0 && <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhuma página adicionada.</CardContent></Card>}

          {webSecoes.map((s, idx) => (
            <WebSecaoCard key={idx} secao={s} idx={idx} onChange={updateWebSecao} onRemove={removeWebSecao} />
          ))}
        </TabsContent>

        {/* ═══ TAB 5: VENDAS ═══ */}
        <TabsContent value="vendas" className="space-y-6 mt-4">
          <div className="bg-muted/30 rounded-lg p-4 border">
            <div className="flex items-center gap-2 mb-1"><Target className="w-5 h-5 text-primary" /><h2 className="text-lg font-bold">Plano de Vendas / CRM — Próximo Mês</h2></div>
            <p className="text-sm text-muted-foreground">Estratégias comerciais, funil e metas de vendas.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Funil Atual</CardTitle></CardHeader>
              <CardContent><Textarea value={vendas.funil_atual || ""} onChange={(e) => setVendas({ ...vendas, funil_atual: e.target.value })} rows={2} placeholder="Descreva o funil atual..." /></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Meta de Vendas</CardTitle></CardHeader>
              <CardContent><Input value={vendas.meta_vendas || ""} onChange={(e) => setVendas({ ...vendas, meta_vendas: e.target.value })} placeholder="Ex: 20 vendas / R$ 50.000" /></CardContent></Card>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Taxa de Conversão</CardTitle></CardHeader>
              <CardContent><Input value={vendas.taxa_conversao || ""} onChange={(e) => setVendas({ ...vendas, taxa_conversao: e.target.value })} placeholder="Ex: 3.5%" /></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Ticket Médio</CardTitle></CardHeader>
              <CardContent><Input value={vendas.ticket_medio || ""} onChange={(e) => setVendas({ ...vendas, ticket_medio: e.target.value })} placeholder="Ex: R$ 2.500" /></CardContent></Card>
          </div>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Análise do CRM</CardTitle></CardHeader>
            <CardContent><Textarea value={vendas.analise_crm || ""} onChange={(e) => setVendas({ ...vendas, analise_crm: e.target.value })} rows={4} placeholder="Análise geral do CRM e pipeline..." /></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Estratégias Propostas</CardTitle></CardHeader>
            <CardContent><ListEditor items={vendas.estrategias || [""]} onChange={(v) => setVendas({ ...vendas, estrategias: v })} placeholder="Estratégia..." /></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Melhorias Sugeridas</CardTitle></CardHeader>
            <CardContent><ListEditor items={vendas.melhorias || [""]} onChange={(v) => setVendas({ ...vendas, melhorias: v })} placeholder="Melhoria..." /></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Ações da Equipe Comercial</CardTitle></CardHeader>
            <CardContent><ListEditor items={vendas.acoes_equipe || [""]} onChange={(v) => setVendas({ ...vendas, acoes_equipe: v })} placeholder="Ação da equipe..." /></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Ferramentas & Processos</CardTitle></CardHeader>
            <CardContent><ListEditor items={vendas.ferramentas || [""]} onChange={(v) => setVendas({ ...vendas, ferramentas: v })} placeholder="Ferramenta ou processo..." /></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Observações Gerais</CardTitle></CardHeader>
            <CardContent><Textarea value={vendas.observacoes || ""} onChange={(e) => setVendas({ ...vendas, observacoes: e.target.value })} rows={3} placeholder="Observações..." /></CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Pauta Card (content post) ───
function PautaCard({ pauta, idx, onChange, onRemove }: { pauta: ConteudoPauta; idx: number; onChange: (i: number, f: keyof ConteudoPauta, v: any) => void; onRemove: (i: number) => void }) {
  const borderColor = pauta.tipo === "organico" ? "border-l-green-500" : "border-l-blue-500";
  return (
    <Card className={`mb-3 border-l-4 ${borderColor}`}>
      <CardHeader className="pb-2 pt-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <Input value={pauta.titulo} onChange={(e) => onChange(idx, "titulo", e.target.value)} placeholder="Título do post/criativo" className="font-semibold border-0 bg-transparent p-0 h-auto shadow-none focus-visible:ring-0 text-base" />
          </div>
          <Button size="icon" variant="ghost" onClick={() => onRemove(idx)}><XCircle className="w-4 h-4 text-destructive" /></Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="text-[10px] uppercase text-muted-foreground font-bold block mb-1">Formato</label>
            <Select value={pauta.formato} onValueChange={(v) => onChange(idx, "formato", v)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{FORMATOS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-[10px] uppercase text-muted-foreground font-bold block mb-1">Plataforma</label>
            <Select value={pauta.plataforma} onValueChange={(v) => onChange(idx, "plataforma", v)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{PLATAFORMAS_CONTEUDO.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-[10px] uppercase text-muted-foreground font-bold flex items-center gap-1 mb-1"><Clock className="w-3 h-3" /> Duração</label>
            <Input value={pauta.tempo_duracao} onChange={(e) => onChange(idx, "tempo_duracao", e.target.value)} placeholder="30s, 1min..." className="h-8 text-xs" />
          </div>
          <div>
            <label className="text-[10px] uppercase text-muted-foreground font-bold flex items-center gap-1 mb-1"><Calendar className="w-3 h-3" /> Data</label>
            <Input type="date" value={pauta.data_postagem} onChange={(e) => onChange(idx, "data_postagem", e.target.value)} className="h-8 text-xs" />
          </div>
        </div>
        <div>
          <label className="text-[10px] uppercase text-muted-foreground font-bold flex items-center gap-1 mb-1"><Crosshair className="w-3 h-3" /> Objetivo</label>
          <Input value={pauta.objetivo} onChange={(e) => onChange(idx, "objetivo", e.target.value)} placeholder="Qual o objetivo deste conteúdo?" className="text-xs" />
        </div>
        <div>
          <label className="text-[10px] uppercase text-muted-foreground font-bold mb-1 block">Roteiro / Descrição</label>
          <Textarea value={pauta.roteiro} onChange={(e) => onChange(idx, "roteiro", e.target.value)} rows={3} placeholder="Descreva o roteiro completo..." className="text-xs" />
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] uppercase text-muted-foreground font-bold mb-1 block">CTA (Call to Action)</label>
            <Input value={pauta.cta} onChange={(e) => onChange(idx, "cta", e.target.value)} placeholder="Ex: Agende sua consulta" className="text-xs" />
          </div>
          <div>
            <label className="text-[10px] uppercase text-muted-foreground font-bold flex items-center gap-1 mb-1"><Link2 className="w-3 h-3" /> Referências</label>
            <Input value={pauta.referencias} onChange={(e) => onChange(idx, "referencias", e.target.value)} placeholder="Links ou referências visuais" className="text-xs" />
          </div>
        </div>
        <div>
          <label className="text-[10px] uppercase text-muted-foreground font-bold mb-1 block">Necessidades do Cliente</label>
          <Input value={pauta.necessidades_cliente} onChange={(e) => onChange(idx, "necessidades_cliente", e.target.value)} placeholder="O que precisa do cliente para produzir?" className="text-xs" />
        </div>
        <div>
          <label className="text-[10px] uppercase text-muted-foreground font-bold mb-1 block">Observações</label>
          <Input value={pauta.observacoes} onChange={(e) => onChange(idx, "observacoes", e.target.value)} placeholder="Notas adicionais..." className="text-xs" />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Campanha Card (traffic) ───
function CampanhaCard({ campanha, idx, onChange, onRemove }: { campanha: TrafegoCampanha; idx: number; onChange: (i: number, f: keyof TrafegoCampanha, v: any) => void; onRemove: (i: number) => void }) {
  return (
    <Card className="mb-4 border-l-4 border-l-blue-500">
      <CardHeader className="pb-2 pt-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <Input value={campanha.nome_campanha} onChange={(e) => onChange(idx, "nome_campanha", e.target.value)} placeholder="Nome da Campanha" className="font-semibold border-0 bg-transparent p-0 h-auto shadow-none focus-visible:ring-0 text-base" />
          </div>
          <Button size="icon" variant="ghost" onClick={() => onRemove(idx)}><XCircle className="w-4 h-4 text-destructive" /></Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {/* Config */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] uppercase text-muted-foreground font-bold mb-1 block">Plataforma</label>
            <Select value={campanha.plataforma} onValueChange={(v) => onChange(idx, "plataforma", v)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{PLATAFORMAS_ADS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-[10px] uppercase text-muted-foreground font-bold mb-1 block">Objetivo</label>
            <Select value={campanha.objetivo_campanha} onValueChange={(v) => onChange(idx, "objetivo_campanha", v)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{OBJETIVOS_CAMPANHA.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-[10px] uppercase text-muted-foreground font-bold mb-1 block">Formato do Anúncio</label>
            <Select value={campanha.formato_anuncio} onValueChange={(v) => onChange(idx, "formato_anuncio", v)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{FORMATOS_ANUNCIO.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] uppercase text-muted-foreground font-bold mb-1 block">Tipo de Campanha</label>
            <Input value={campanha.tipo_campanha} onChange={(e) => onChange(idx, "tipo_campanha", e.target.value)} placeholder="Ex: Remarketing, LAL, Vendas..." className="text-xs" />
          </div>
          <div>
            <label className="text-[10px] uppercase text-muted-foreground font-bold mb-1 block">URL de Destino</label>
            <Input value={campanha.url_destino} onChange={(e) => onChange(idx, "url_destino", e.target.value)} placeholder="https://..." className="text-xs" />
          </div>
        </div>

        <Separator />

        {/* Targeting */}
        <div>
          <label className="text-[10px] uppercase text-muted-foreground font-bold flex items-center gap-1 mb-2"><Users className="w-3 h-3" /> Segmentação</label>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">Público-Alvo</label>
              <Textarea value={campanha.publico_alvo} onChange={(e) => onChange(idx, "publico_alvo", e.target.value)} rows={2} placeholder="Descreva o público..." className="text-xs" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">Segmentação (Interesses, LAL, etc.)</label>
              <Textarea value={campanha.segmentacao} onChange={(e) => onChange(idx, "segmentacao", e.target.value)} rows={2} placeholder="Detalhes da segmentação..." className="text-xs" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">Localização</label>
              <Input value={campanha.localizacao} onChange={(e) => onChange(idx, "localizacao", e.target.value)} placeholder="Ex: São Paulo - SP" className="text-xs" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">Faixa Etária</label>
              <Input value={campanha.faixa_etaria} onChange={(e) => onChange(idx, "faixa_etaria", e.target.value)} placeholder="Ex: 25-45 anos" className="text-xs" />
            </div>
          </div>
        </div>

        <Separator />

        {/* Creative */}
        <div>
          <label className="text-[10px] uppercase text-muted-foreground font-bold mb-1 block">Copy Principal</label>
          <Textarea value={campanha.copy_principal} onChange={(e) => onChange(idx, "copy_principal", e.target.value)} rows={3} placeholder="Texto principal do anúncio..." className="text-xs" />
        </div>
        <div>
          <label className="text-[10px] uppercase text-muted-foreground font-bold mb-1 block">CTA</label>
          <Input value={campanha.cta} onChange={(e) => onChange(idx, "cta", e.target.value)} placeholder="Ex: Saiba Mais, Compre Agora..." className="text-xs" />
        </div>

        <Separator />

        {/* Investment */}
        <div>
          <label className="text-[10px] uppercase text-muted-foreground font-bold flex items-center gap-1 mb-2"><DollarSign className="w-3 h-3" /> Investimento & Período</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">Inv. Diário (R$)</label>
              <Input type="number" value={campanha.investimento_diario || ""} onChange={(e) => onChange(idx, "investimento_diario", Number(e.target.value))} className="text-xs" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">Inv. Total (R$)</label>
              <Input type="number" value={campanha.investimento_total || ""} onChange={(e) => onChange(idx, "investimento_total", Number(e.target.value))} className="text-xs" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">Data Início</label>
              <Input type="date" value={campanha.data_inicio} onChange={(e) => onChange(idx, "data_inicio", e.target.value)} className="text-xs" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">Data Fim</label>
              <Input type="date" value={campanha.data_fim} onChange={(e) => onChange(idx, "data_fim", e.target.value)} className="text-xs" />
            </div>
          </div>
        </div>

        <Separator />

        {/* Metas */}
        <div>
          <label className="text-[10px] uppercase text-muted-foreground font-bold flex items-center gap-1 mb-2"><Target className="w-3 h-3" /> Metas da Campanha</label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">CPL (R$)</label>
              <Input type="number" value={campanha.meta_cpl || ""} onChange={(e) => onChange(idx, "meta_cpl", Number(e.target.value))} className="text-xs" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">CPC (R$)</label>
              <Input type="number" value={campanha.meta_cpc || ""} onChange={(e) => onChange(idx, "meta_cpc", Number(e.target.value))} className="text-xs" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">CTR (%)</label>
              <Input type="number" value={campanha.meta_ctr || ""} onChange={(e) => onChange(idx, "meta_ctr", Number(e.target.value))} className="text-xs" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">Conversões</label>
              <Input type="number" value={campanha.meta_conversoes || ""} onChange={(e) => onChange(idx, "meta_conversoes", Number(e.target.value))} className="text-xs" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">ROAS</label>
              <Input type="number" value={campanha.meta_roas || ""} onChange={(e) => onChange(idx, "meta_roas", Number(e.target.value))} className="text-xs" />
            </div>
          </div>
        </div>

        <div>
          <label className="text-[10px] uppercase text-muted-foreground font-bold mb-1 block">Observações</label>
          <Textarea value={campanha.observacoes} onChange={(e) => onChange(idx, "observacoes", e.target.value)} rows={2} placeholder="Notas adicionais da campanha..." className="text-xs" />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Web Section Card ───
function WebSecaoCard({ secao, idx, onChange, onRemove }: { secao: WebSecao; idx: number; onChange: (i: number, u: Partial<WebSecao>) => void; onRemove: (i: number) => void }) {
  return (
    <Card className="mb-4 border-l-4 border-l-emerald-500">
      <CardHeader className="pb-2 pt-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1">
            <Globe className="w-4 h-4 text-emerald-500" />
            <Input value={secao.titulo} onChange={(e) => onChange(idx, { titulo: e.target.value })} placeholder="Nome da Página / Seção" className="font-semibold border-0 bg-transparent p-0 h-auto shadow-none focus-visible:ring-0 text-base" />
          </div>
          <Button size="icon" variant="ghost" onClick={() => onRemove(idx)}><XCircle className="w-4 h-4 text-destructive" /></Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] uppercase text-muted-foreground font-bold mb-1 block">Tipo</label>
            <Select value={secao.tipo || "Landing Page"} onValueChange={(v) => onChange(idx, { tipo: v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{TIPOS_WEB.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-[10px] uppercase text-muted-foreground font-bold mb-1 block">Status</label>
            <Select value={secao.status || "A criar"} onValueChange={(v) => onChange(idx, { status: v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="A criar">A criar</SelectItem>
                <SelectItem value="Em alteração">Em alteração</SelectItem>
                <SelectItem value="Em revisão">Em revisão</SelectItem>
                <SelectItem value="Concluída">Concluída</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-[10px] uppercase text-muted-foreground font-bold mb-1 block">Prazo Estimado</label>
            <Input value={secao.prazo_estimado || ""} onChange={(e) => onChange(idx, { prazo_estimado: e.target.value })} placeholder="Ex: 15 dias" className="h-8 text-xs" />
          </div>
        </div>
        <div>
          <label className="text-[10px] uppercase text-muted-foreground font-bold mb-1 block">Objetivo da Página</label>
          <Textarea value={secao.objetivo || ""} onChange={(e) => onChange(idx, { objetivo: e.target.value })} rows={2} placeholder="Qual o objetivo desta página?" className="text-xs" />
        </div>
        <div>
          <label className="text-[10px] uppercase text-muted-foreground font-bold mb-1 block">Descrição / Briefing</label>
          <Textarea value={secao.descricao || ""} onChange={(e) => onChange(idx, { descricao: e.target.value })} rows={3} placeholder="Descreva o que a página precisa ter..." className="text-xs" />
        </div>
        <div>
          <label className="text-[10px] uppercase text-muted-foreground font-bold mb-1 block">Seções da Página</label>
          <ListEditor items={secao.secoes_pagina || [""]} onChange={(v) => onChange(idx, { secoes_pagina: v })} placeholder="Ex: Hero, Benefícios, Depoimentos..." />
        </div>
        <div>
          <label className="text-[10px] uppercase text-muted-foreground font-bold mb-1 block">Expectativa de Resultado</label>
          <Textarea value={secao.expectativa_resultado || ""} onChange={(e) => onChange(idx, { expectativa_resultado: e.target.value })} rows={2} placeholder="O que se espera de resultado com esta página?" className="text-xs" />
        </div>
        <div>
          <label className="text-[10px] uppercase text-muted-foreground font-bold mb-1 block">Necessidades do Cliente</label>
          <Textarea value={secao.necessidades_cliente || ""} onChange={(e) => onChange(idx, { necessidades_cliente: e.target.value })} rows={2} placeholder="O que precisa do cliente para executar?" className="text-xs" />
        </div>
        <div>
          <label className="text-[10px] uppercase text-muted-foreground font-bold mb-1 block">Observações</label>
          <Input value={secao.observacoes || ""} onChange={(e) => onChange(idx, { observacoes: e.target.value })} placeholder="Notas adicionais..." className="text-xs" />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ───
export default function FranqueadoAcompanhamento() {
  const { role } = useAuth();
  const isMatriz = role === "super_admin" || role === "admin";
  const isFranqueado = role === "franqueado";

  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [selectedUnitOrgId, setSelectedUnitOrgId] = useState<string | undefined>();
  const [editing, setEditing] = useState<ClientFollowup | null | "new">(null);

  const { data: matrizFolders = [] } = useClientFolders();
  const { data: unitFolders = [] } = useClientFoldersForUnit();
  const { data: units = [] } = useUnits();
  const { data: followups = [] } = useClientFollowups(selectedClient);

  const folders = isMatriz ? matrizFolders : unitFolders;
  const readOnly = isFranqueado;

  const handleFolderSelect = (name: string, unitOrgId?: string) => {
    setSelectedClient(name);
    if (unitOrgId) setSelectedUnitOrgId(unitOrgId);
  };

  if (editing) {
    return (
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        <FollowupEditor
          existing={editing === "new" ? null : editing}
          clientName={selectedClient!}
          onBack={() => setEditing(null)}
          readOnly={readOnly}
          unitOrgId={selectedUnitOrgId}
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
          onBack={() => { setSelectedClient(null); setSelectedUnitOrgId(undefined); }}
          onNew={() => setEditing("new")}
          onEdit={(f) => setEditing(f)}
          isMatriz={isMatriz}
        />
      </div>
    );
  }
  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <FolderListView
        folders={folders}
        onSelect={handleFolderSelect}
        isMatriz={isMatriz}
        units={units}
      />
    </div>
  );
}
