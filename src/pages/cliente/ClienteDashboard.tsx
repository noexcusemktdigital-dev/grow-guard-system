import { useState, useMemo } from "react";
import { useOrgProfile } from "@/hooks/useOrgProfile";
import { useActiveGoals } from "@/hooks/useGoals";
import { useGoalProgress } from "@/hooks/useGoalProgress";
import {
  BarChart3, TrendingUp, Users, DollarSign,
  ArrowUpRight, ArrowDownRight, Target, Eye,
  MessageCircle, Bot, Download, FileText, Calendar, ChevronDown, FileImage,
  CheckCircle2, TrendingDown, ArrowRight, AlertTriangle,
} from "lucide-react";
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

/* ========== CSV EXPORT ========== */
function downloadCsv(filename: string, headers: string[], rows: string[][]) {
  const csv = [headers.join(";"), ...rows.map(r => r.map(c => `"${(c ?? "").replace(/"/g, '""')}"`).join(";"))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/* ========== PDF EXPORT ========== */
async function downloadReportPdf(containerId: string, title: string, orgName?: string) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const element = document.getElementById(containerId);
  if (!element) return;

  // Hide export buttons during capture
  element.classList.add("pdf-exporting");

  // Small delay to let the DOM update
  await new Promise(r => setTimeout(r, 100));

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      scrollY: -window.scrollY,
    });

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const headerHeight = 22;

    // Draw header
    pdf.setFillColor(226, 35, 59); // brand red
    pdf.rect(0, 0, pageWidth, headerHeight, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text(orgName || "Relatório", margin, 10);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.text(title, margin, 16);
    const dateStr = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
    pdf.text(dateStr, pageWidth - margin - pdf.getTextWidth(dateStr), 16);

    // Add captured image with pagination
    const imgData = canvas.toDataURL("image/png");
    const imgWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const contentStart = headerHeight + 4;
    const usableHeight = pageHeight - margin;

    let heightLeft = imgHeight;
    let position = contentStart;
    let srcY = 0;

    while (heightLeft > 0) {
      const sliceHeight = Math.min(heightLeft, usableHeight - position);
      // Create a slice of the canvas for this page
      const sliceCanvas = document.createElement("canvas");
      sliceCanvas.width = canvas.width;
      const srcSliceHeight = (sliceHeight / imgHeight) * canvas.height;
      sliceCanvas.height = srcSliceHeight;
      const ctx = sliceCanvas.getContext("2d")!;
      ctx.drawImage(canvas, 0, srcY, canvas.width, srcSliceHeight, 0, 0, canvas.width, srcSliceHeight);

      const sliceData = sliceCanvas.toDataURL("image/png");
      pdf.addImage(sliceData, "PNG", margin, position, imgWidth, sliceHeight);

      heightLeft -= sliceHeight;
      srcY += srcSliceHeight;

      if (heightLeft > 0) {
        pdf.addPage();
        position = margin;
      }
    }

    const filename = `${title.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.pdf`;
    pdf.save(filename);
  } finally {
    element.classList.remove("pdf-exporting");
  }
}

/* ========== DATE FILTER HELPER ========== */
function getDateRange(period: string, customFrom: string, customTo: string): { from: Date | null; to: Date } {
  const now = new Date();
  const to = new Date(now);
  to.setHours(23, 59, 59, 999);

  switch (period) {
    case "7d": {
      const from = new Date(now);
      from.setDate(from.getDate() - 7);
      from.setHours(0, 0, 0, 0);
      return { from, to };
    }
    case "30d": {
      const from = new Date(now);
      from.setDate(from.getDate() - 30);
      from.setHours(0, 0, 0, 0);
      return { from, to };
    }
    case "90d": {
      const from = new Date(now);
      from.setDate(from.getDate() - 90);
      from.setHours(0, 0, 0, 0);
      return { from, to };
    }
    case "custom": {
      const from = customFrom ? new Date(customFrom + "T00:00:00") : null;
      const customEnd = customTo ? new Date(customTo + "T23:59:59") : to;
      return { from, to: customEnd };
    }
    default: // "all"
      return { from: null, to };
  }
}

function filterByDate<T extends { created_at: string }>(items: T[], from: Date | null, to: Date): T[] {
  if (!from) return items;
  return items.filter(item => {
    const d = new Date(item.created_at);
    return d >= from && d <= to;
  });
}

/* ========== KPI CARD ========== */
function KpiCard({ label, value, icon: Icon, gradient, trend }: { label: string; value: string; icon: React.ElementType; gradient: string; trend?: { value: string; positive: boolean } }) {
  return (
    <Card className="relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-60`} />
      <CardContent className="relative p-4">
        <div className="w-9 h-9 rounded-lg bg-background/50 border flex items-center justify-center">
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
            {trend && (
              <span className={`text-[10px] font-medium flex items-center gap-0.5 ${trend.positive ? "text-emerald-600" : "text-red-500"}`}>
                {trend.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {trend.value}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ========== MAIN COMPONENT ========== */
export default function ClienteDashboard() {
  const { data: leads, isLoading: leadsLoading } = useCrmLeads();
  const { data: proposals } = useCrmProposals();
  const { data: orgId } = useUserOrgId();
  const orgProfile = useOrgProfile();
  const orgName = orgProfile.data?.name || "Relatório";
  const { toast } = useToast();
  const [period, setPeriod] = useState("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  // Chat data
  const { data: chatContacts } = useQuery({
    queryKey: ["dashboard-chat-contacts", orgId],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("whatsapp_contacts").select("*").eq("organization_id", orgId!);
      if (error) return [];
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: chatMessages } = useQuery({
    queryKey: ["dashboard-chat-messages", orgId],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("whatsapp_messages").select("*").eq("organization_id", orgId!).order("created_at", { ascending: false }).limit(500);
      if (error) return [];
      return data || [];
    },
    enabled: !!orgId,
  });

  // AI Agents data
  const { data: agents } = useQuery({
    queryKey: ["dashboard-agents", orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from("client_ai_agents").select("*").eq("organization_id", orgId!);
      if (error) return [];
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: aiLogs } = useQuery({
    queryKey: ["dashboard-ai-logs", orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from("ai_conversation_logs").select("*").eq("organization_id", orgId!).order("created_at", { ascending: false }).limit(200);
      if (error) return [];
      return data || [];
    },
    enabled: !!orgId,
  });

  // ===== DATE RANGE =====
  const { from: dateFrom, to: dateTo } = useMemo(() => getDateRange(period, customFrom, customTo), [period, customFrom, customTo]);

  // ===== FILTERED DATA =====
  const allLeadsRaw = leads ?? [];
  const allLeads = useMemo(() => filterByDate(allLeadsRaw, dateFrom, dateTo), [allLeadsRaw, dateFrom, dateTo]);

  // Previous period for comparison
  const prevLeads = useMemo(() => {
    if (!dateFrom) return [];
    const periodMs = dateTo.getTime() - dateFrom.getTime();
    const prevFrom = new Date(dateFrom.getTime() - periodMs);
    const prevTo = new Date(dateFrom.getTime() - 1);
    return filterByDate(allLeadsRaw, prevFrom, prevTo);
  }, [allLeadsRaw, dateFrom, dateTo]);

  // CRM computed values
  const wonLeads = allLeads.filter(l => l.won_at);
  const lostLeads = allLeads.filter(l => l.lost_at);
  const activeLeads = allLeads.filter(l => !l.won_at && !l.lost_at);
  const totalValue = wonLeads.reduce((sum, l) => sum + Number(l.value || 0), 0);
  const pipelineValue = activeLeads.reduce((sum, l) => sum + Number(l.value || 0), 0);
  const conversionRate = allLeads.length > 0 ? ((wonLeads.length / allLeads.length) * 100).toFixed(1) : "0";
  const lossRate = allLeads.length > 0 ? ((lostLeads.length / allLeads.length) * 100).toFixed(1) : "0";
  const ticketMedio = wonLeads.length > 0 ? totalValue / wonLeads.length : 0;

  // Previous period comparison
  const prevWonLeads = prevLeads.filter(l => l.won_at);
  const prevTotalValue = prevWonLeads.reduce((sum, l) => sum + Number(l.value || 0), 0);
  const prevConversionRate = prevLeads.length > 0 ? ((prevWonLeads.length / prevLeads.length) * 100) : 0;

  function calcTrend(current: number, previous: number): { value: string; positive: boolean } | undefined {
    if (previous === 0 && current === 0) return undefined;
    if (previous === 0) return { value: "+100%", positive: true };
    const pct = ((current - previous) / previous * 100).toFixed(0);
    return { value: `${Number(pct) >= 0 ? "+" : ""}${pct}%`, positive: Number(pct) >= 0 };
  }

  // Average closing time (days between created_at and won_at)
  const avgClosingDays = useMemo(() => {
    const closedLeads = wonLeads.filter(l => l.won_at && l.created_at);
    if (closedLeads.length === 0) return 0;
    const totalDays = closedLeads.reduce((sum, l) => {
      const diff = new Date(l.won_at!).getTime() - new Date(l.created_at).getTime();
      return sum + diff / (1000 * 60 * 60 * 24);
    }, 0);
    return Math.round(totalDays / closedLeads.length);
  }, [wonLeads]);

  // Leads created per week (last 8 weeks)
  const leadsPerWeek = useMemo(() => {
    const weeks: { name: string; value: number }[] = [];
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
      const start = new Date(now);
      start.setDate(start.getDate() - (i + 1) * 7);
      const end = new Date(now);
      end.setDate(end.getDate() - i * 7);
      const count = allLeads.filter(l => {
        const d = new Date(l.created_at);
        return d >= start && d < end;
      }).length;
      weeks.push({ name: `S${8 - i}`, value: count });
    }
    return weeks;
  }, [allLeads]);

  // Lost reasons
  const lostReasons = useMemo(() => {
    const map: Record<string, number> = {};
    lostLeads.forEach(l => {
      const reason = l.lost_reason || "Sem motivo";
      map[reason] = (map[reason] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [lostLeads]);

  // Leads by source
  const leadsBySource = useMemo(() => {
    const map: Record<string, number> = {};
    allLeads.forEach(l => { const s = l.source || "Sem origem"; map[s] = (map[s] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [allLeads]);

  // Leads by stage
  const leadsByStage = useMemo(() => {
    const map: Record<string, number> = {};
    allLeads.forEach(l => { map[l.stage] = (map[l.stage] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [allLeads]);

  // Top leads by value
  const topLeads = useMemo(() =>
    [...allLeads].filter(l => (l.value || 0) > 0).sort((a, b) => (b.value || 0) - (a.value || 0)).slice(0, 5),
    [allLeads]
  );

  // Open proposals
  const openProposals = (proposals ?? []).filter(p => p.status === "draft" || p.status === "sent");
  const openProposalsValue = openProposals.reduce((s, p) => s + (p.value || 0), 0);

  // Chat computed - also filtered by date
  const allContacts = chatContacts ?? [];
  const allMessagesRaw = chatMessages ?? [];
  const allMessages = useMemo(() => {
    if (!dateFrom) return allMessagesRaw;
    return allMessagesRaw.filter((m: any) => {
      const d = new Date(m.created_at);
      return d >= dateFrom && d <= dateTo;
    });
  }, [allMessagesRaw, dateFrom, dateTo]);

  const todayStr = new Date().toISOString().slice(0, 10);
  const messagesToday = allMessagesRaw.filter((m: any) => m.created_at?.startsWith(todayStr));

  // Messages per day (last 7 days)
  const messagesPerDay = useMemo(() => {
    const days: { name: string; inbound: number; outbound: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().slice(0, 10);
      const dayMsgs = allMessagesRaw.filter((m: any) => m.created_at?.startsWith(dayStr));
      days.push({
        name: d.toLocaleDateString("pt-BR", { weekday: "short" }),
        inbound: dayMsgs.filter((m: any) => m.direction === "inbound").length,
        outbound: dayMsgs.filter((m: any) => m.direction === "outbound").length,
      });
    }
    return days;
  }, [allMessagesRaw]);

  // AI vs Human distribution
  const aiVsHuman = useMemo(() => {
    const aiContacts = allContacts.filter((c: any) => c.attending_mode === "ai").length;
    const humanContacts = allContacts.filter((c: any) => c.attending_mode === "human").length;
    return [
      { name: "IA", value: aiContacts },
      { name: "Humano", value: humanContacts },
    ];
  }, [allContacts]);

  // Contacts without response
  const noResponseCount = useMemo(() => {
    return allContacts.filter((c: any) => {
      const contactMsgs = allMessagesRaw.filter((m: any) => m.contact_id === c.id);
      if (contactMsgs.length === 0) return false;
      const lastMsg = contactMsgs[0];
      return lastMsg.direction === "inbound";
    }).length;
  }, [allContacts, allMessagesRaw]);

  // Average response time (minutes)
  const avgResponseTime = useMemo(() => {
    let totalTime = 0;
    let count = 0;
    const sorted = [...allMessages].sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    for (let i = 0; i < sorted.length - 1; i++) {
      const m = sorted[i] as any;
      if (m.direction === "inbound") {
        const next = sorted.slice(i + 1).find((n: any) => n.direction === "outbound" && n.contact_id === m.contact_id);
        if (next) {
          const diff = (new Date((next as any).created_at).getTime() - new Date(m.created_at).getTime()) / (1000 * 60);
          if (diff < 1440) {
            totalTime += diff;
            count++;
          }
        }
      }
    }
    return count > 0 ? Math.round(totalTime / count) : 0;
  }, [allMessages]);

  // AI computed - also filtered
  const allAgents = agents ?? [];
  const activeAgents = allAgents.filter((a: any) => a.status === "active");
  const filteredAiLogs = useMemo(() => {
    const logs = aiLogs ?? [];
    if (!dateFrom) return logs;
    return logs.filter((l: any) => {
      const d = new Date(l.created_at);
      return d >= dateFrom && d <= dateTo;
    });
  }, [aiLogs, dateFrom, dateTo]);
  
  const totalTokens = filteredAiLogs.reduce((s: number, l: any) => s + (l.tokens_used || 0), 0);
  const avgTokensPerConvo = filteredAiLogs.length > 0 ? Math.round(totalTokens / filteredAiLogs.length) : 0;

  // Conversations per agent
  const conversationsPerAgent = useMemo(() => {
    const map: Record<string, { name: string; count: number }> = {};
    filteredAiLogs.forEach((log: any) => {
      const agent = allAgents.find((a: any) => a.id === log.agent_id);
      const name = agent?.name || "Desconhecido";
      if (!map[log.agent_id]) map[log.agent_id] = { name, count: 0 };
      map[log.agent_id].count++;
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [filteredAiLogs, allAgents]);

  // Handoff rate
  const handoffRate = useMemo(() => {
    const total = allContacts.length;
    if (total === 0) return "0";
    const handoffs = allContacts.filter((c: any) => c.attending_mode === "human").length;
    return ((handoffs / total) * 100).toFixed(1);
  }, [allContacts]);

  const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(var(--muted-foreground))"];

  // Period label for display
  const periodLabel = period === "7d" ? "7 dias" : period === "30d" ? "30 dias" : period === "90d" ? "90 dias" : period === "custom" ? "Personalizado" : "Todo período";

  if (leadsLoading) {
    return (
      <div className="w-full space-y-6">
        <PageHeader title="Relatórios" subtitle="Análises e métricas" icon={<BarChart3 className="w-5 h-5 text-primary" />} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="Relatórios"
        subtitle="Analise e exporte relatórios das suas frentes comerciais"
        icon={<BarChart3 className="w-5 h-5 text-primary" />}
        actions={
          <div className="flex gap-1 p-1 rounded-lg bg-muted/50 border items-center flex-wrap">
            {[
              { key: "7d", label: "7 dias" },
              { key: "30d", label: "30 dias" },
              { key: "90d", label: "90 dias" },
              { key: "all", label: "Todo período" },
            ].map(p => (
              <Button key={p.key} variant={period === p.key ? "default" : "ghost"} size="sm" className="text-xs h-7 px-3" onClick={() => setPeriod(p.key)}>{p.label}</Button>
            ))}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={period === "custom" ? "default" : "ghost"} size="sm" className="text-xs h-7 px-3 gap-1">
                  <Calendar className="w-3 h-3" /> Personalizado
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3 space-y-2" align="end">
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground font-medium">De</label>
                  <Input type="date" value={customFrom} onChange={e => { setCustomFrom(e.target.value); setPeriod("custom"); }} className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground font-medium">Até</label>
                  <Input type="date" value={customTo} onChange={e => { setCustomTo(e.target.value); setPeriod("custom"); }} className="h-8 text-xs" />
                </div>
              </PopoverContent>
            </Popover>
          </div>
        }
      />

      {/* Period info badge */}
      {dateFrom && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-[10px]">
            {dateFrom.toLocaleDateString("pt-BR")} — {dateTo.toLocaleDateString("pt-BR")}
          </Badge>
          <span className="text-[10px] text-muted-foreground">{allLeads.length} de {allLeadsRaw.length} leads no período</span>
        </div>
      )}

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
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs gap-1">
                  <Download className="w-3 h-3" /> Exportar <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => {
                  downloadCsv("crm-leads.csv", ["Nome", "Empresa", "Valor", "Etapa", "Origem", "Criado em"],
                    allLeads.map(l => [l.name, l.company || "", String(l.value || 0), l.stage, l.source || "", l.created_at])
                  );
                  toast({ title: "CSV exportado", description: `${allLeads.length} leads exportados (${periodLabel})` });
                }}>
                  <FileText className="w-3.5 h-3.5 mr-2" /> CSV (planilha)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={async () => {
                  toast({ title: "Gerando PDF…", description: "Aguarde enquanto o relatório é gerado" });
                  await downloadReportPdf("report-crm", "CRM — Relatório", orgName);
                  toast({ title: "PDF exportado", description: "Relatório visual do CRM baixado" });
                }}>
                  <FileImage className="w-3.5 h-3.5 mr-2" /> PDF (relatório visual)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Receita Total" value={`R$ ${totalValue.toLocaleString("pt-BR")}`} icon={DollarSign} gradient="from-emerald-500/15 to-emerald-600/5" trend={calcTrend(totalValue, prevTotalValue)} />
            <KpiCard label="Leads Captados" value={String(allLeads.length)} icon={Users} gradient="from-blue-500/15 to-blue-600/5" trend={calcTrend(allLeads.length, prevLeads.length)} />
            <KpiCard label="Taxa de Conversão" value={`${conversionRate}%`} icon={Target} gradient="from-purple-500/15 to-purple-600/5" trend={calcTrend(Number(conversionRate), prevConversionRate)} />
            <KpiCard label="Ticket Médio" value={`R$ ${ticketMedio.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`} icon={Eye} gradient="from-amber-500/15 to-amber-600/5" />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Pipeline Ativo" value={`R$ ${pipelineValue.toLocaleString("pt-BR")}`} icon={TrendingUp} gradient="from-sky-500/15 to-sky-600/5" />
            <KpiCard label="Leads Perdidos" value={String(lostLeads.length)} icon={ArrowDownRight} gradient="from-red-500/15 to-red-600/5" />
            <KpiCard label="Taxa de Perda" value={`${lossRate}%`} icon={ArrowDownRight} gradient="from-orange-500/15 to-orange-600/5" />
            <KpiCard label="Tempo Médio Fechamento" value={`${avgClosingDays}d`} icon={Target} gradient="from-indigo-500/15 to-indigo-600/5" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Conversion radial */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Target className="w-4 h-4 text-primary" /> Taxa de Conversão</CardTitle></CardHeader>
              <CardContent className="flex flex-col items-center justify-center">
                <div className="h-40 w-full max-w-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart innerRadius="70%" outerRadius="100%" data={[{ name: "Conversão", value: Number(conversionRate), fill: "hsl(var(--primary))" }]} startAngle={90} endAngle={-270}>
                      <RadialBar background={{ fill: "hsl(var(--muted))" }} dataKey="value" cornerRadius={10} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center -mt-24 relative z-10">
                  <p className="text-3xl font-bold">{conversionRate}%</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">de conversão</p>
                </div>
              </CardContent>
            </Card>

            {/* Leads by stage */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Leads por Etapa</CardTitle></CardHeader>
              <CardContent>
                {leadsByStage.length > 0 ? (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={leadsByStage}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <ReTooltip />
                        <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : <p className="text-xs text-muted-foreground text-center py-8">Sem dados no período</p>}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Leads by source */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Leads por Origem</CardTitle></CardHeader>
              <CardContent>
                {leadsBySource.length > 0 ? (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={leadsBySource} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis type="number" tick={{ fontSize: 10 }} />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={80} />
                        <ReTooltip />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {leadsBySource.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : <p className="text-xs text-muted-foreground text-center py-8">Sem dados no período</p>}
              </CardContent>
            </Card>

            {/* Open proposals + top leads */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><FileText className="w-4 h-4 text-primary" /> Propostas em Aberto</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-3">
                    <p className="text-2xl font-bold">{openProposals.length}</p>
                    <p className="text-xs text-muted-foreground">propostas · R$ {openProposalsValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Top Leads por Valor</CardTitle></CardHeader>
                <CardContent className="p-0">
                  {topLeads.length > 0 ? (
                    <Table>
                      <TableBody>
                        {topLeads.map(l => (
                          <TableRow key={l.id}>
                            <TableCell className="py-2 text-xs font-medium">{l.name}</TableCell>
                            <TableCell className="py-2 text-xs text-right text-primary font-semibold">
                              R$ {(l.value || 0).toLocaleString("pt-BR")}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : <p className="text-xs text-muted-foreground text-center py-4">Sem dados no período</p>}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Leads per week + Lost reasons */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Leads Criados por Semana</CardTitle></CardHeader>
              <CardContent>
                {leadsPerWeek.some(w => w.value > 0) ? (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={leadsPerWeek}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <ReTooltip />
                        <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : <p className="text-xs text-muted-foreground text-center py-8">Sem dados no período</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Motivos de Perda</CardTitle></CardHeader>
              <CardContent>
                {lostReasons.length > 0 ? (
                  <div className="space-y-2">
                    {lostReasons.map((r, i) => (
                      <div key={r.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="text-xs text-muted-foreground truncate">{r.name}</span>
                        </div>
                        <Badge variant="secondary" className="text-[10px]">{r.value}</Badge>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-xs text-muted-foreground text-center py-8">Nenhum lead perdido no período</p>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ===== CHAT TAB ===== */}
        <TabsContent value="chat" className="space-y-6 mt-4" id="report-chat">
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs gap-1">
                  <Download className="w-3 h-3" /> Exportar <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => {
                  downloadCsv("chat-contacts.csv", ["Nome", "Telefone", "Última mensagem"],
                    allContacts.map((c: any) => [c.name || "", c.phone || "", c.last_message_at || ""])
                  );
                  toast({ title: "CSV exportado", description: `${allContacts.length} contatos exportados` });
                }}>
                  <FileText className="w-3.5 h-3.5 mr-2" /> CSV (planilha)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={async () => {
                  toast({ title: "Gerando PDF…", description: "Aguarde enquanto o relatório é gerado" });
                  await downloadReportPdf("report-chat", "Chat — Relatório", orgName);
                  toast({ title: "PDF exportado", description: "Relatório visual do Chat baixado" });
                }}>
                  <FileImage className="w-3.5 h-3.5 mr-2" /> PDF (relatório visual)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Total Conversas" value={String(allContacts.length)} icon={MessageCircle} gradient="from-emerald-500/15 to-emerald-600/5" />
            <KpiCard label="Mensagens Hoje" value={String(messagesToday.length)} icon={MessageCircle} gradient="from-blue-500/15 to-blue-600/5" />
            <KpiCard label="Tempo Médio Resposta" value={`${avgResponseTime}min`} icon={Target} gradient="from-purple-500/15 to-purple-600/5" />
            <KpiCard label="Sem Resposta" value={String(noResponseCount)} icon={ArrowDownRight} gradient="from-red-500/15 to-red-600/5" />
          </div>

          {/* Messages per day + AI vs Human */}
          {allMessagesRaw.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Mensagens por Dia (7 dias)</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={messagesPerDay}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <ReTooltip />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                        <Bar dataKey="inbound" name="Recebidas" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="outbound" name="Enviadas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Atendimento: IA vs Humano</CardTitle></CardHeader>
                <CardContent className="flex items-center justify-center">
                  <div className="h-48 w-full max-w-xs">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={aiVsHuman} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`}>
                          {aiVsHuman.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <ReTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {allContacts.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <MessageCircle className="w-10 h-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-medium">Sem dados de chat</p>
                <p className="text-xs text-muted-foreground mt-1">Configure o WhatsApp para ver métricas de conversas.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ===== AGENTS TAB ===== */}
        <TabsContent value="agents" className="space-y-6 mt-4" id="report-agents">
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs gap-1">
                  <Download className="w-3 h-3" /> Exportar <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => {
                  downloadCsv("ai-logs.csv", ["Agente ID", "Tokens", "Modelo", "Data"],
                    filteredAiLogs.map((l: any) => [l.agent_id, String(l.tokens_used || 0), l.model || "", l.created_at])
                  );
                  toast({ title: "CSV exportado", description: `${filteredAiLogs.length} logs exportados (${periodLabel})` });
                }}>
                  <FileText className="w-3.5 h-3.5 mr-2" /> CSV (planilha)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={async () => {
                  toast({ title: "Gerando PDF…", description: "Aguarde enquanto o relatório é gerado" });
                  await downloadReportPdf("report-agents", "Agentes IA — Relatório", orgName);
                  toast({ title: "PDF exportado", description: "Relatório visual dos Agentes IA baixado" });
                }}>
                  <FileImage className="w-3.5 h-3.5 mr-2" /> PDF (relatório visual)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Total Agentes" value={String(allAgents.length)} icon={Bot} gradient="from-emerald-500/15 to-emerald-600/5" />
            <KpiCard label="Agentes Ativos" value={String(activeAgents.length)} icon={Bot} gradient="from-blue-500/15 to-blue-600/5" />
            <KpiCard label="Taxa de Handoff" value={`${handoffRate}%`} icon={Users} gradient="from-purple-500/15 to-purple-600/5" />
            <KpiCard label="Média Tokens/Conversa" value={String(avgTokensPerConvo)} icon={TrendingUp} gradient="from-amber-500/15 to-amber-600/5" />
          </div>

          {/* Conversations per agent */}
          {conversationsPerAgent.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Conversas por Agente</CardTitle></CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={conversationsPerAgent} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" tick={{ fontSize: 10 }} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={100} />
                      <ReTooltip />
                      <Bar dataKey="count" name="Conversas" radius={[0, 4, 4, 0]}>
                        {conversationsPerAgent.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {allAgents.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Bot className="w-10 h-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-medium">Sem agentes IA</p>
                <p className="text-xs text-muted-foreground mt-1">Crie agentes IA para ver métricas de uso.</p>
              </CardContent>
            </Card>
          )}

        </TabsContent>
      </Tabs>
    </div>
  );
}
