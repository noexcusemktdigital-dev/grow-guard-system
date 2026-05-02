// @ts-nocheck
import { useState, useMemo } from "react";
import type { Tables } from "@/integrations/supabase/types";
import { useOrgProfile } from "@/hooks/useOrgProfile";
import { useActiveGoals } from "@/hooks/useGoals";
import { useGoalProgress } from "@/hooks/useGoalProgress";
import { GoalProgressRing } from "@/components/metas/GoalProgressRing";
import {
  BarChart3, TrendingUp, Users, DollarSign,
  ArrowUpRight, ArrowDownRight, Target, Eye,
  MessageCircle, Bot, Download, FileText, Calendar, ChevronDown, FileImage,
  CheckCircle2, TrendingDown, ArrowRight, AlertTriangle, GitBranch, Trophy, XCircle,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCrmFunnels } from "@/hooks/useCrmFunnels";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { useCrmLeads } from "@/hooks/useClienteCrm";
import { useCrmProposals } from "@/hooks/useCrmProposals";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import {
  RadialBarChart, RadialBar, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  LineChart, Line, ResponsiveContainer, PieChart, Pie, Cell, Legend, ReferenceLine,
} from "recharts";
import { useToast } from "@/hooks/use-toast";
import { formatBRL } from "@/lib/formatting";
import { CHART_COLORS, CHART_PALETTE, CHART_GRID_COLOR, ChartTooltip, formatBRL as formatBRLChart } from "@/lib/chartTheme";

import {
  downloadCsv, downloadReportPdf, getDateRange, filterByDate,
  getGoalStatusLabel, METRIC_TO_KPI, DashboardKpiCard,
  type GoalStatus,
} from "./ClienteDashboardHelpers";

interface WaContact { id: string; name: string | null; phone: string | null; last_message_at: string | null; attending_mode?: string; unread_count?: number; created_at: string; [key: string]: unknown; }
interface WaMessage { id: string; contact_id: string; direction: string; type: string; content: string | null; created_at: string; status?: string; [key: string]: unknown; }
interface GoalRow { id: string; title: string; metric: string; target_value: number; current_value?: number; scope?: string; status?: string; period_start?: string; period_end?: string; [key: string]: unknown; }
interface AgentRow { id: string; name: string; status: string; [key: string]: unknown; }
interface AiLogRow { id: string; agent_id: string; tokens_used: number; model: string; created_at: string; [key: string]: unknown; }

/* ========== MAIN COMPONENT ========== */
export default function ClienteDashboard() {
  const { data: leads, isLoading: leadsLoading } = useCrmLeads();
  const { data: proposals } = useCrmProposals();
  const { data: orgId } = useUserOrgId();
  const orgProfile = useOrgProfile();
  const orgName = orgProfile.data?.name || "Relatório";
  const { toast } = useToast();
  const navigate = useNavigate();
  const [period, setPeriod] = useState("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [selectedFunnelId, setSelectedFunnelId] = useState<string>("all");
  const { data: funnels } = useCrmFunnels();

  const { data: activeGoals } = useActiveGoals();
  const { data: goalProgress } = useGoalProgress(activeGoals);

  const { data: chatContacts } = useQuery({
    queryKey: ["dashboard-chat-contacts", orgId],
    queryFn: async () => { const { data } = await supabase.from("whatsapp_contacts" as unknown as "profiles").select("*").eq("organization_id", orgId ?? ""); return data || []; },
    enabled: !!orgId,
  });
  const { data: chatMessages } = useQuery({
    queryKey: ["dashboard-chat-messages", orgId],
    queryFn: async () => { const { data } = await supabase.from("whatsapp_messages" as unknown as "profiles").select("*").eq("organization_id", orgId ?? "").order("created_at", { ascending: false }).limit(500); return data || []; },
    enabled: !!orgId,
  });
  const { data: agents } = useQuery({
    queryKey: ["dashboard-agents", orgId],
    queryFn: async () => { const { data } = await supabase.from("client_ai_agents").select("*").eq("organization_id", orgId ?? ""); return data || []; },
    enabled: !!orgId,
  });
  const { data: aiLogs } = useQuery({
    queryKey: ["dashboard-ai-logs", orgId],
    queryFn: async () => { const { data } = await supabase.from("ai_conversation_logs").select("*").eq("organization_id", orgId ?? "").order("created_at", { ascending: false }).limit(200); return data || []; },
    enabled: !!orgId,
  });

  const { from: dateFrom, to: dateTo } = useMemo(() => getDateRange(period, customFrom, customTo), [period, customFrom, customTo]);
  const allLeadsRaw = useMemo(() => {
    const list = leads ?? [];
    if (selectedFunnelId === "all") return list;
    return list.filter((l: Tables<'crm_leads'>) => l.funnel_id === selectedFunnelId);
  }, [leads, selectedFunnelId]);
  const allLeads = useMemo(() => filterByDate(allLeadsRaw, dateFrom, dateTo), [allLeadsRaw, dateFrom, dateTo]);
  const prevLeads = useMemo(() => {
    if (!dateFrom) return [];
    const periodMs = dateTo.getTime() - dateFrom.getTime();
    const prevFrom = new Date(dateFrom.getTime() - periodMs);
    const prevTo = new Date(dateFrom.getTime() - 1);
    return filterByDate(allLeadsRaw, prevFrom, prevTo);
  }, [allLeadsRaw, dateFrom, dateTo]);

  const wonLeads = allLeads.filter(l => l.won_at);
  const lostLeads = allLeads.filter(l => l.lost_at);
  const activeLeads = allLeads.filter(l => !l.won_at && !l.lost_at);
  const totalValue = wonLeads.reduce((sum, l) => sum + Number(l.value || 0), 0);
  const pipelineValue = activeLeads.reduce((sum, l) => sum + Number(l.value || 0), 0);
  const conversionRate = allLeads.length > 0 ? ((wonLeads.length / allLeads.length) * 100).toFixed(1) : "0";
  const lossRate = allLeads.length > 0 ? ((lostLeads.length / allLeads.length) * 100).toFixed(1) : "0";
  const ticketMedio = wonLeads.length > 0 ? totalValue / wonLeads.length : 0;

  const prevWonLeads = prevLeads.filter(l => l.won_at);
  const prevTotalValue = prevWonLeads.reduce((sum, l) => sum + Number(l.value || 0), 0);
  const prevConversionRate = prevLeads.length > 0 ? ((prevWonLeads.length / prevLeads.length) * 100) : 0;

  function calcTrend(current: number, previous: number): { value: string; positive: boolean } | undefined {
    if (previous === 0 && current === 0) return undefined;
    if (previous === 0) return { value: "+100%", positive: true };
    const pct = ((current - previous) / previous * 100).toFixed(0);
    return { value: `${Number(pct) >= 0 ? "+" : ""}${pct}%`, positive: Number(pct) >= 0 };
  }

  function getKpiGoalData(kpiLabel: string): { status: GoalStatus; percent: number; targetFormatted: string; daysLeft: number } | undefined {
    if (!activeGoals || !goalProgress) return undefined;
    for (const goal of activeGoals) {
      const metric = goal.metric || "revenue";
      const matchLabels = METRIC_TO_KPI[metric];
      if (matchLabels?.includes(kpiLabel)) {
        const prog = goalProgress[goal.id];
        if (!prog) return undefined;
        const isMonetary = ["revenue", "faturamento", "avg_ticket"].includes(metric);
        const isPct = metric === "conversions";
        const targetFormatted = isMonetary ? formatBRL(goal.target_value) : isPct ? `${goal.target_value}%` : String(goal.target_value);
        return { status: prog.status, percent: prog.percent, targetFormatted, daysLeft: prog.daysLeft };
      }
    }
    return undefined;
  }

  const conversionGoal = useMemo(() => {
    if (!activeGoals || !goalProgress) return null;
    const g = activeGoals.find((g: GoalRow) => g.metric === "conversions");
    return g ? goalProgress[g.id] : null;
  }, [activeGoals, goalProgress]);

  const leadsGoal = useMemo(() => {
    if (!activeGoals) return null;
    return activeGoals.find((g: GoalRow) => g.metric === "leads") || null;
  }, [activeGoals]);

  const avgClosingDays = useMemo(() => {
    const closedLeads = wonLeads.filter(l => l.won_at && l.created_at);
    if (closedLeads.length === 0) return 0;
    const totalDays = closedLeads.reduce((sum, l) => {
      const diff = new Date(l.won_at!).getTime() - new Date(l.created_at).getTime();
      return sum + diff / (1000 * 60 * 60 * 24);
    }, 0);
    return Math.round(totalDays / closedLeads.length);
  }, [wonLeads]);

  const leadsPerWeek = useMemo(() => {
    const weeks: { name: string; value: number }[] = [];
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
      const start = new Date(now); start.setDate(start.getDate() - (i + 1) * 7);
      const end = new Date(now); end.setDate(end.getDate() - i * 7);
      const count = allLeads.filter(l => { const d = new Date(l.created_at); return d >= start && d < end; }).length;
      weeks.push({ name: `S${8 - i}`, value: count });
    }
    return weeks;
  }, [allLeads]);

  const lostReasons = useMemo(() => {
    const map: Record<string, number> = {};
    lostLeads.forEach(l => { const reason = l.lost_reason || "Sem motivo"; map[reason] = (map[reason] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [lostLeads]);

  const rankingByMember = useMemo(() => {
    const map: Record<string, { won: number; total: number; revenue: number; name: string }> = {};
    allLeads.forEach((l: Tables<'crm_leads'>) => {
      const key = l.assigned_to || "sem_responsavel";
      if (!map[key]) map[key] = { won: 0, total: 0, revenue: 0, name: l.assigned_to ? String(key).slice(0, 8) : "Sem responsável" };
      map[key].total++;
      if (l.won_at) { map[key].won++; map[key].revenue += Number(l.value || 0); }
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [allLeads]);

  const leadsBySource = useMemo(() => {
    const map: Record<string, number> = {};
    allLeads.forEach(l => { const s = l.source || "Sem origem"; map[s] = (map[s] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [allLeads]);

  const leadsByStage = useMemo(() => {
    const map: Record<string, number> = {};
    allLeads.forEach(l => { map[l.stage] = (map[l.stage] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [allLeads]);

  const topLeads = useMemo(() => [...allLeads].filter(l => (l.value || 0) > 0).sort((a, b) => (b.value || 0) - (a.value || 0)).slice(0, 5), [allLeads]);
  const openProposals = (proposals ?? []).filter(p => p.status === "draft" || p.status === "sent");
  const openProposalsValue = openProposals.reduce((s, p) => s + (p.value || 0), 0);

  const allContacts = chatContacts ?? [];
  const allMessagesRaw = chatMessages ?? [];
  const allMessages = useMemo(() => {
    if (!dateFrom) return allMessagesRaw;
    return allMessagesRaw.filter((m: WaMessage) => { const d = new Date(m.created_at); return d >= dateFrom && d <= dateTo; });
  }, [allMessagesRaw, dateFrom, dateTo]);

  const todayStr = new Date().toISOString().slice(0, 10);
  const messagesToday = allMessagesRaw.filter((m: WaMessage) => m.created_at?.startsWith(todayStr));

  const messagesPerDay = useMemo(() => {
    const days: { name: string; inbound: number; outbound: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().slice(0, 10);
      const dayMsgs = allMessagesRaw.filter((m: WaMessage) => m.created_at?.startsWith(dayStr));
      days.push({ name: d.toLocaleDateString("pt-BR", { weekday: "short" }), inbound: dayMsgs.filter((m: WaMessage) => m.direction === "inbound").length, outbound: dayMsgs.filter((m: WaMessage) => m.direction === "outbound").length });
    }
    return days;
  }, [allMessagesRaw]);

  const aiVsHuman = useMemo(() => [
    { name: "IA", value: allContacts.filter((c: WaContact) => c.attending_mode === "ai").length },
    { name: "Humano", value: allContacts.filter((c: WaContact) => c.attending_mode === "human").length },
  ], [allContacts]);

  const noResponseCount = useMemo(() => allContacts.filter((c: WaContact) => {
    const contactMsgs = allMessagesRaw.filter((m: WaMessage) => m.contact_id === c.id);
    if (contactMsgs.length === 0) return false;
    return contactMsgs[0].direction === "inbound";
  }).length, [allContacts, allMessagesRaw]);

  const avgResponseTime = useMemo(() => {
    let totalTime = 0; let count = 0;
    const sorted = [...allMessages].sort((a: WaMessage, b: WaMessage) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    for (let i = 0; i < sorted.length - 1; i++) {
      const m = sorted[i];
      if (m.direction === "inbound") {
        const next = sorted.slice(i + 1).find((n: WaMessage) => n.direction === "outbound" && n.contact_id === m.contact_id);
        if (next) { const diff = (new Date(next.created_at).getTime() - new Date(m.created_at).getTime()) / (1000 * 60); if (diff < 1440) { totalTime += diff; count++; } }
      }
    }
    return count > 0 ? Math.round(totalTime / count) : 0;
  }, [allMessages]);

  const allAgents = agents ?? [];
  const activeAgents = allAgents.filter((a: AgentRow) => a.status === "active");
  const filteredAiLogs = useMemo(() => {
    const logs = aiLogs ?? [];
    if (!dateFrom) return logs;
    return logs.filter((l: AiLogRow) => { const d = new Date(l.created_at); return d >= dateFrom && d <= dateTo; });
  }, [aiLogs, dateFrom, dateTo]);

  const totalTokens = filteredAiLogs.reduce((s: number, l: AiLogRow) => s + (l.tokens_used || 0), 0);
  const avgTokensPerConvo = filteredAiLogs.length > 0 ? Math.round(totalTokens / filteredAiLogs.length) : 0;

  const conversationsPerAgent = useMemo(() => {
    const map: Record<string, { name: string; count: number }> = {};
    filteredAiLogs.forEach((log: AiLogRow) => {
      const agent = allAgents.find((a: AgentRow) => a.id === log.agent_id);
      const name = agent?.name || "Desconhecido";
      if (!map[log.agent_id]) map[log.agent_id] = { name, count: 0 };
      map[log.agent_id].count++;
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [filteredAiLogs, allAgents]);

  const handoffRate = useMemo(() => {
    const total = allContacts.length;
    if (total === 0) return "0";
    return ((allContacts.filter((c: WaContact) => c.attending_mode === "human").length / total) * 100).toFixed(1);
  }, [allContacts]);

  const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(var(--muted-foreground))"];
  const periodLabel = period === "7d" ? "7 dias" : period === "30d" ? "30 dias" : period === "90d" ? "90 dias" : period === "custom" ? "Personalizado" : "Todo período";

  if (leadsLoading) {
    return (
      <div className="w-full space-y-6">
        <PageHeader title="Relatórios" subtitle="Análises e métricas" icon={<BarChart3 className="w-5 h-5 text-primary" />} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <PageHeader title="Relatórios" subtitle={selectedFunnelId !== "all" ? `Funil: ${funnels?.find(f => f.id === selectedFunnelId)?.name}` : "Analise e exporte relatórios das suas frentes comerciais"} icon={<BarChart3 className="w-5 h-5 text-primary" />}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {funnels && funnels.length > 1 && (
              <Select value={selectedFunnelId} onValueChange={setSelectedFunnelId}>
                <SelectTrigger className="h-8 text-xs w-44">
                  <GitBranch className="w-3 h-3 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="Todos os funis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">Todos os funis</SelectItem>
                  {funnels.map(f => (
                    <SelectItem key={f.id} value={f.id} className="text-xs">{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          <div className="flex gap-1 p-1 rounded-lg bg-muted/50 border items-center flex-wrap">
            {[{ key: "7d", label: "7 dias" }, { key: "30d", label: "30 dias" }, { key: "90d", label: "90 dias" }, { key: "all", label: "Todo período" }].map(p => (
              <Button key={p.key} variant={period === p.key ? "default" : "ghost"} size="sm" className="text-xs h-7 px-3" onClick={() => setPeriod(p.key)}>{p.label}</Button>
            ))}
            <Popover>
              <PopoverTrigger asChild><Button variant={period === "custom" ? "default" : "ghost"} size="sm" className="text-xs h-7 px-3 gap-1"><Calendar className="w-3 h-3" /> Personalizado</Button></PopoverTrigger>
              <PopoverContent className="w-auto p-3 space-y-2" align="end">
                <div className="space-y-1"><label className="text-[10px] text-muted-foreground font-medium">De</label><Input type="date" value={customFrom} onChange={e => { setCustomFrom(e.target.value); setPeriod("custom"); }} className="h-8 text-xs" /></div>
                <div className="space-y-1"><label className="text-[10px] text-muted-foreground font-medium">Até</label><Input type="date" value={customTo} onChange={e => { setCustomTo(e.target.value); setPeriod("custom"); }} className="h-8 text-xs" /></div>
              </PopoverContent>
            </Popover>
          </div>
          </div>
        }
      />

      {dateFrom && <div className="flex items-center gap-2"><Badge variant="secondary" className="text-[10px]">{dateFrom.toLocaleDateString("pt-BR")} — {dateTo.toLocaleDateString("pt-BR")}</Badge><span className="text-[10px] text-muted-foreground">{allLeads.length} de {allLeadsRaw.length} leads no período</span></div>}

      <Tabs defaultValue="crm" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="crm" className="text-xs gap-1"><Users className="w-3 h-3" /> CRM</TabsTrigger>
          <TabsTrigger value="chat" className="text-xs gap-1"><MessageCircle className="w-3 h-3" /> Chat</TabsTrigger>
          <TabsTrigger value="agents" className="text-xs gap-1"><Bot className="w-3 h-3" /> Agentes IA</TabsTrigger>
        </TabsList>

        {/* ===== CRM TAB ===== */}
        <TabsContent value="crm" className="space-y-6 mt-4" id="report-crm">
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="text-xs gap-1"><Download className="w-3 h-3" /> Exportar <ChevronDown className="w-3 h-3" /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => { downloadCsv("crm-leads.csv", ["Nome", "Empresa", "Valor", "Etapa", "Origem", "Criado em"], allLeads.map(l => [l.name, l.company || "", String(l.value || 0), l.stage, l.source || "", l.created_at])); toast({ title: "CSV exportado", description: `${allLeads.length} leads exportados (${periodLabel})` }); }}><FileText className="w-3.5 h-3.5 mr-2" /> CSV (planilha)</DropdownMenuItem>
                <DropdownMenuItem onClick={async () => { toast({ title: "Gerando PDF…" }); await downloadReportPdf("report-crm", "CRM — Relatório", orgName); toast({ title: "PDF exportado" }); }}><FileImage className="w-3.5 h-3.5 mr-2" /> PDF (relatório visual)</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {(() => {
            const gRecTotal = getKpiGoalData("Receita Total"); const gLeads = getKpiGoalData("Leads Captados"); const gConv = getKpiGoalData("Taxa de Conversão"); const gTicket = getKpiGoalData("Ticket Médio"); const gPipeline = getKpiGoalData("Pipeline Ativo");
            return (<>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <DashboardKpiCard label="Receita Total" value={`R$ ${totalValue.toLocaleString("pt-BR")}`} icon={DollarSign} gradient="from-emerald-500/15 to-emerald-600/5" trend={calcTrend(totalValue, prevTotalValue)} goalStatus={gRecTotal?.status} goalPercent={gRecTotal?.percent} goalTarget={gRecTotal?.targetFormatted} goalDaysLeft={gRecTotal?.daysLeft} />
                <DashboardKpiCard label="Leads Captados" value={String(allLeads.length)} icon={Users} gradient="from-blue-500/15 to-blue-600/5" trend={calcTrend(allLeads.length, prevLeads.length)} goalStatus={gLeads?.status} goalPercent={gLeads?.percent} goalTarget={gLeads?.targetFormatted} goalDaysLeft={gLeads?.daysLeft} />
                <DashboardKpiCard label="Taxa de Conversão" value={`${conversionRate}%`} icon={Target} gradient="from-purple-500/15 to-purple-600/5" trend={calcTrend(Number(conversionRate), prevConversionRate)} goalStatus={gConv?.status} goalPercent={gConv?.percent} goalTarget={gConv?.targetFormatted} goalDaysLeft={gConv?.daysLeft} />
                <DashboardKpiCard label="Ticket Médio" value={`R$ ${ticketMedio.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`} icon={Eye} gradient="from-amber-500/15 to-amber-600/5" goalStatus={gTicket?.status} goalPercent={gTicket?.percent} goalTarget={gTicket?.targetFormatted} goalDaysLeft={gTicket?.daysLeft} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <DashboardKpiCard label="Pipeline Ativo" value={`R$ ${pipelineValue.toLocaleString("pt-BR")}`} icon={TrendingUp} gradient="from-sky-500/15 to-sky-600/5" goalStatus={gPipeline?.status} goalPercent={gPipeline?.percent} goalTarget={gPipeline?.targetFormatted} goalDaysLeft={gPipeline?.daysLeft} />
                <DashboardKpiCard label="Leads Perdidos" value={String(lostLeads.length)} icon={ArrowDownRight} gradient="from-red-500/15 to-red-600/5" />
                <DashboardKpiCard label="Taxa de Perda" value={`${lossRate}%`} icon={ArrowDownRight} gradient="from-orange-500/15 to-orange-600/5" />
                <DashboardKpiCard label="Tempo Médio Fechamento" value={`${avgClosingDays}d`} icon={Target} gradient="from-indigo-500/15 to-indigo-600/5" />
              </div>
            </>);
          })()}

          {activeGoals && activeGoals.length > 0 && goalProgress ? (
            <Card>
              <CardHeader className="pb-3"><div className="flex items-center justify-between"><CardTitle className="text-sm flex items-center gap-2"><Target className="w-4 h-4 text-primary" /> Metas do Mês</CardTitle><Button variant="ghost" size="sm" className="text-[10px] h-6" onClick={() => navigate("/metas-ranking")}>Ver todas →</Button></div></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeGoals.map((goal: GoalRow) => {
                    const prog = goalProgress[goal.id]; if (!prog) return null;
                    const statusInfo = getGoalStatusLabel(prog.status);
                    const barColor = prog.status === "batida" || prog.status === "no_ritmo" ? "bg-emerald-500" : prog.status === "em_andamento" ? "bg-amber-500" : "bg-red-500";
                    const isMonetary = ["revenue", "faturamento", "avg_ticket"].includes(goal.metric || "");
                    const isPct = goal.metric === "conversions";
                    const currentFmt = isMonetary ? formatBRL(prog.currentValue) : isPct ? `${prog.currentValue}%` : String(prog.currentValue);
                    const targetFmt = isMonetary ? formatBRL(goal.target_value) : isPct ? `${goal.target_value}%` : String(goal.target_value);
                    const projectedPercent = prog.daysLeft > 0 && prog.pacePerDay > 0 ? Math.round(((prog.currentValue + prog.pacePerDay * prog.daysLeft) / (goal.target_value || 1)) * 100) : Math.round(prog.percent);
                    return (
                      <div key={goal.id} className="flex gap-3 p-3 rounded-xl border bg-card/50">
                        <GoalProgressRing percent={prog.percent} size={52} strokeWidth={5} />
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-center gap-2"><span className="text-xs font-semibold truncate">{goal.title}</span><span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${statusInfo.className}`}>{statusInfo.label}</span></div>
                          <p className="text-[11px] text-muted-foreground">{currentFmt} / {targetFmt}</p>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden"><div className={`h-full rounded-full ${barColor} transition-all duration-700`} style={{ width: `${Math.min(prog.percent, 100)}%` }} /></div>
                          <div className="flex items-center justify-between"><span className="text-[9px] text-muted-foreground">{prog.daysLeft > 0 ? `Projeção: ~${Math.min(projectedPercent, 999)}% · ${prog.daysLeft}d restantes` : "Período encerrado"}</span></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed"><CardContent className="flex items-center justify-between py-4"><div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-muted-foreground" /><p className="text-xs text-muted-foreground">Nenhuma meta ativa para este mês.</p></div><Button variant="outline" size="sm" className="text-xs" onClick={() => navigate("/metas-ranking")}>Criar metas</Button></CardContent></Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Target className="w-4 h-4 text-primary" /> Taxa de Conversão</CardTitle></CardHeader><CardContent className="flex flex-col items-center justify-center"><div className="h-40 w-full max-w-xs"><ResponsiveContainer width="100%" height="100%"><RadialBarChart innerRadius="70%" outerRadius="100%" data={[{ name: "Conversão", value: Number(conversionRate), fill: conversionGoal ? conversionGoal.status === "batida" || conversionGoal.status === "no_ritmo" ? "hsl(142 76% 36%)" : conversionGoal.status === "em_andamento" ? "hsl(45 93% 47%)" : "hsl(0 84% 60%)" : "hsl(var(--primary))" }]} startAngle={90} endAngle={-270}><RadialBar background={{ fill: "hsl(var(--muted))" }} dataKey="value" cornerRadius={10} /></RadialBarChart></ResponsiveContainer></div><div className="text-center -mt-24 relative z-10"><p className="text-3xl font-bold">{conversionRate}%</p><p className="text-[10px] text-muted-foreground uppercase tracking-wider">de conversão</p></div></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Leads por Etapa</CardTitle></CardHeader><CardContent>{leadsByStage.length > 0 ? <div className="h-48"><ResponsiveContainer width="100%" height="100%"><BarChart data={leadsByStage}><CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_COLOR} vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 11, fill: "#888" }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 11, fill: "#888" }} axisLine={false} tickLine={false} /><ReTooltip content={<ChartTooltip />} /><Bar dataKey="value" radius={[6, 6, 0, 0]}>{leadsByStage.map((_: { name: string; value: number }, i: number) => <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />)}</Bar></BarChart></ResponsiveContainer></div> : <p className="text-xs text-muted-foreground text-center py-8">Sem dados no período</p>}</CardContent></Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Leads por Origem</CardTitle></CardHeader><CardContent>{leadsBySource.length > 0 ? <div className="h-48"><ResponsiveContainer width="100%" height="100%"><BarChart data={leadsBySource} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_COLOR} horizontal={false} /><XAxis type="number" tick={{ fontSize: 11, fill: "#888" }} axisLine={false} tickLine={false} /><YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#888" }} axisLine={false} tickLine={false} width={90} /><ReTooltip content={<ChartTooltip />} /><Bar dataKey="value" radius={[0, 6, 6, 0]}>{leadsBySource.map((_: { name: string; value: number }, i: number) => <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />)}</Bar></BarChart></ResponsiveContainer></div> : <p className="text-xs text-muted-foreground text-center py-8">Sem dados no período</p>}</CardContent></Card>
            <div className="space-y-4">
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><FileText className="w-4 h-4 text-primary" /> Propostas em Aberto</CardTitle></CardHeader><CardContent><div className="flex items-baseline gap-3"><p className="text-2xl font-bold">{openProposals.length}</p><p className="text-xs text-muted-foreground">propostas · R$ {openProposalsValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p></div></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Top Leads por Valor</CardTitle></CardHeader><CardContent className="p-0">{topLeads.length > 0 ? <Table><TableBody>{topLeads.map(l => <TableRow key={l.id}><TableCell className="py-2 text-xs font-medium">{l.name}</TableCell><TableCell className="py-2 text-xs text-right text-primary font-semibold">R$ {(l.value || 0).toLocaleString("pt-BR")}</TableCell></TableRow>)}</TableBody></Table> : <p className="text-xs text-muted-foreground text-center py-4">Sem dados no período</p>}</CardContent></Card>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Leads Criados por Semana</CardTitle></CardHeader><CardContent>{leadsPerWeek.some(w => w.value > 0) ? <div className="h-48"><ResponsiveContainer width="100%" height="100%"><LineChart data={leadsPerWeek}><CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_COLOR} vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 11, fill: "#888" }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 11, fill: "#888" }} axisLine={false} tickLine={false} /><ReTooltip content={<ChartTooltip />} /><Line type="monotone" dataKey="value" stroke={CHART_COLORS.purple} strokeWidth={2.5} dot={{ r: 4, fill: "#fff", stroke: CHART_COLORS.purple, strokeWidth: 2 }} activeDot={{ r: 6 }} />{leadsGoal && leadsGoal.target_value && <ReferenceLine y={Math.round(leadsGoal.target_value / 4)} stroke={CHART_COLORS.amber} strokeDasharray="6 3" label={{ value: "Meta/sem", position: "right", fontSize: 10, fill: CHART_COLORS.amber }} />}</LineChart></ResponsiveContainer></div> : <p className="text-xs text-muted-foreground text-center py-8">Sem dados no período</p>}</CardContent></Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><XCircle className="w-4 h-4 text-destructive" /> Motivos de Perda</CardTitle></CardHeader>
              <CardContent>
                {lostReasons.length > 0 ? (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={lostReasons} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_COLOR} horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={100} />
                        <ReTooltip content={<ChartTooltip />} />
                        <Bar dataKey="value" name="Leads" radius={[0, 6, 6, 0]} fill="hsl(0 84% 60% / 0.7)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : <p className="text-xs text-muted-foreground text-center py-8">Nenhum lead perdido no período</p>}
              </CardContent>
            </Card>
          </div>

          {rankingByMember.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-500" /> Ranking por Responsável</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {rankingByMember.map((m, i) => (
                  <div key={m.name + i} className="flex items-center gap-3">
                    <span className={`text-xs font-bold w-5 text-center ${i === 0 ? "text-amber-500" : "text-muted-foreground"}`}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-medium truncate">{m.name}</span>
                        <span className="text-xs text-muted-foreground shrink-0 ml-2">{m.won} vendas</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${rankingByMember[0].revenue > 0 ? (m.revenue / rankingByMember[0].revenue) * 100 : 0}%` }} />
                      </div>
                    </div>
                    <span className="text-xs font-semibold shrink-0">R$ {m.revenue.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ===== CHAT TAB ===== */}
        <TabsContent value="chat" className="space-y-6 mt-4" id="report-chat">
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="text-xs gap-1"><Download className="w-3 h-3" /> Exportar <ChevronDown className="w-3 h-3" /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => { downloadCsv("chat-contacts.csv", ["Nome", "Telefone", "Última mensagem"], allContacts.map((c: WaContact) => [c.name || "", c.phone || "", c.last_message_at || ""])); toast({ title: "CSV exportado" }); }}><FileText className="w-3.5 h-3.5 mr-2" /> CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={async () => { toast({ title: "Gerando PDF…" }); await downloadReportPdf("report-chat", "Chat — Relatório", orgName); toast({ title: "PDF exportado" }); }}><FileImage className="w-3.5 h-3.5 mr-2" /> PDF</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <DashboardKpiCard label="Total Conversas" value={String(allContacts.length)} icon={MessageCircle} gradient="from-emerald-500/15 to-emerald-600/5" />
            <DashboardKpiCard label="Mensagens Hoje" value={String(messagesToday.length)} icon={MessageCircle} gradient="from-blue-500/15 to-blue-600/5" />
            <DashboardKpiCard label="Tempo Médio Resposta" value={`${avgResponseTime}min`} icon={Target} gradient="from-purple-500/15 to-purple-600/5" />
            <DashboardKpiCard label="Sem Resposta" value={String(noResponseCount)} icon={ArrowDownRight} gradient="from-red-500/15 to-red-600/5" />
          </div>
          {allMessagesRaw.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Mensagens por Dia (7 dias)</CardTitle></CardHeader><CardContent><div className="h-48"><ResponsiveContainer width="100%" height="100%"><BarChart data={messagesPerDay} barGap={2}><CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_COLOR} vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 11, fill: "#888" }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 11, fill: "#888" }} axisLine={false} tickLine={false} /><ReTooltip content={<ChartTooltip />} /><Bar dataKey="inbound" name="Recebidas" fill={CHART_COLORS.teal} radius={[4, 4, 0, 0]} /><Bar dataKey="outbound" name="Enviadas" fill={CHART_COLORS.purple} radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Atendimento: IA vs Humano</CardTitle></CardHeader><CardContent className="flex items-center justify-center"><div className="h-48 w-full max-w-xs"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={aiVsHuman} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`}>{aiVsHuman.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><ReTooltip /></PieChart></ResponsiveContainer></div></CardContent></Card>
            </div>
          )}
          {allContacts.length === 0 && <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center py-12 text-center"><MessageCircle className="w-10 h-10 text-muted-foreground/30 mb-3" /><p className="text-sm font-medium">Sem dados de chat</p><p className="text-xs text-muted-foreground mt-1">Configure o WhatsApp para ver métricas de conversas.</p></CardContent></Card>}
        </TabsContent>

        {/* ===== AGENTS TAB ===== */}
        <TabsContent value="agents" className="space-y-6 mt-4" id="report-agents">
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="text-xs gap-1"><Download className="w-3 h-3" /> Exportar <ChevronDown className="w-3 h-3" /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => { downloadCsv("ai-logs.csv", ["Agente ID", "Tokens", "Modelo", "Data"], filteredAiLogs.map((l: AiLogRow) => [l.agent_id, String(l.tokens_used || 0), l.model || "", l.created_at])); toast({ title: "CSV exportado" }); }}><FileText className="w-3.5 h-3.5 mr-2" /> CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={async () => { toast({ title: "Gerando PDF…" }); await downloadReportPdf("report-agents", "Agentes IA — Relatório", orgName); toast({ title: "PDF exportado" }); }}><FileImage className="w-3.5 h-3.5 mr-2" /> PDF</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <DashboardKpiCard label="Total Agentes" value={String(allAgents.length)} icon={Bot} gradient="from-emerald-500/15 to-emerald-600/5" />
            <DashboardKpiCard label="Agentes Ativos" value={String(activeAgents.length)} icon={Bot} gradient="from-blue-500/15 to-blue-600/5" />
            <DashboardKpiCard label="Taxa de Handoff" value={`${handoffRate}%`} icon={Users} gradient="from-purple-500/15 to-purple-600/5" />
            <DashboardKpiCard label="Média Tokens/Conversa" value={String(avgTokensPerConvo)} icon={TrendingUp} gradient="from-amber-500/15 to-amber-600/5" />
          </div>
          {conversationsPerAgent.length > 0 && <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Conversas por Agente</CardTitle></CardHeader><CardContent><div className="h-48"><ResponsiveContainer width="100%" height="100%"><BarChart data={conversationsPerAgent} layout="vertical"><CartesianGrid strokeDasharray="3 3" className="stroke-muted" /><XAxis type="number" tick={{ fontSize: 10 }} /><YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={100} /><ReTooltip /><Bar dataKey="count" name="Conversas" radius={[0, 4, 4, 0]}>{conversationsPerAgent.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Bar></BarChart></ResponsiveContainer></div></CardContent></Card>}
          {allAgents.length === 0 && <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center py-12 text-center"><Bot className="w-10 h-10 text-muted-foreground/30 mb-3" /><p className="text-sm font-medium">Sem agentes IA</p><p className="text-xs text-muted-foreground mt-1">Crie agentes IA para ver métricas de uso.</p></CardContent></Card>}
        </TabsContent>
      </Tabs>
    </div>
  );
}
