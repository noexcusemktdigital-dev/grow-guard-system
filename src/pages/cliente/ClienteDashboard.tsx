import { useState, useMemo } from "react";
import {
  BarChart3, TrendingUp, Users, DollarSign,
  ArrowUpRight, ArrowDownRight, Target, Eye,
  MessageCircle, Bot, Download, FileText
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCrmLeads } from "@/hooks/useClienteCrm";
import { useCrmProposals } from "@/hooks/useCrmProposals";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  RadialBarChart, RadialBar, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  LineChart, Line, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { useToast } from "@/hooks/use-toast";

/* ========== CSV EXPORT ========== */
function downloadCsv(filename: string, headers: string[], rows: string[][]) {
  const csv = [headers.join(","), ...rows.map(r => r.map(c => `"${(c ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/* ========== KPI CARD ========== */
function KpiCard({ label, value, icon: Icon, gradient }: { label: string; value: string; icon: React.ElementType; gradient: string }) {
  return (
    <Card className="relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-60`} />
      <CardContent className="relative p-4">
        <div className="w-9 h-9 rounded-lg bg-background/50 border flex items-center justify-center">
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{label}</p>
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
  const { toast } = useToast();
  const [period, setPeriod] = useState("30d");

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

  // CRM computed values
  const allLeads = leads ?? [];
  const wonLeads = allLeads.filter(l => l.won_at);
  const totalValue = wonLeads.reduce((sum, l) => sum + Number(l.value || 0), 0);
  const conversionRate = allLeads.length > 0 ? ((wonLeads.length / allLeads.length) * 100).toFixed(1) : "0";
  const ticketMedio = wonLeads.length > 0 ? totalValue / wonLeads.length : 0;

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

  // Chat computed
  const allContacts = chatContacts ?? [];
  const allMessages = chatMessages ?? [];
  const todayStr = new Date().toISOString().slice(0, 10);
  const messagesToday = allMessages.filter((m: any) => m.created_at?.startsWith(todayStr));

  // AI computed
  const allAgents = agents ?? [];
  const activeAgents = allAgents.filter((a: any) => a.status === "active");
  const totalTokens = (aiLogs ?? []).reduce((s: number, l: any) => s + (l.tokens_used || 0), 0);

  const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(var(--muted-foreground))"];

  if (leadsLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader title="Dashboard" subtitle="Análises e métricas" icon={<BarChart3 className="w-5 h-5 text-primary" />} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Métricas de CRM, Chat e Agentes IA"
        icon={<BarChart3 className="w-5 h-5 text-primary" />}
        actions={
          <div className="flex gap-1 p-1 rounded-lg bg-muted/50 border">
            {["7d", "30d", "90d"].map(p => (
              <Button key={p} variant={period === p ? "default" : "ghost"} size="sm" className="text-xs h-7 px-3" onClick={() => setPeriod(p)}>{p}</Button>
            ))}
          </div>
        }
      />

      <Tabs defaultValue="crm" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="crm" className="text-xs gap-1"><Users className="w-3 h-3" /> CRM</TabsTrigger>
          <TabsTrigger value="chat" className="text-xs gap-1"><MessageCircle className="w-3 h-3" /> Chat</TabsTrigger>
          <TabsTrigger value="agents" className="text-xs gap-1"><Bot className="w-3 h-3" /> Agentes IA</TabsTrigger>
        </TabsList>

        {/* ===== CRM TAB ===== */}
        <TabsContent value="crm" className="space-y-6 mt-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => {
              downloadCsv("crm-leads.csv", ["Nome", "Empresa", "Valor", "Etapa", "Origem", "Criado em"],
                allLeads.map(l => [l.name, l.company || "", String(l.value || 0), l.stage, l.source || "", l.created_at])
              );
              toast({ title: "CSV exportado" });
            }}>
              <Download className="w-3 h-3" /> Exportar
            </Button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Receita Total" value={`R$ ${totalValue.toLocaleString("pt-BR")}`} icon={DollarSign} gradient="from-emerald-500/15 to-emerald-600/5" />
            <KpiCard label="Leads Captados" value={String(allLeads.length)} icon={Users} gradient="from-blue-500/15 to-blue-600/5" />
            <KpiCard label="Taxa de Conversão" value={`${conversionRate}%`} icon={Target} gradient="from-purple-500/15 to-purple-600/5" />
            <KpiCard label="Ticket Médio" value={`R$ ${ticketMedio.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`} icon={Eye} gradient="from-amber-500/15 to-amber-600/5" />
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
                ) : <p className="text-xs text-muted-foreground text-center py-8">Sem dados</p>}
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
                        <Bar dataKey="value" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : <p className="text-xs text-muted-foreground text-center py-8">Sem dados</p>}
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
                  ) : <p className="text-xs text-muted-foreground text-center py-4">Sem dados</p>}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ===== CHAT TAB ===== */}
        <TabsContent value="chat" className="space-y-6 mt-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => {
              downloadCsv("chat-contacts.csv", ["Nome", "Telefone", "Última mensagem"],
                allContacts.map((c: any) => [c.name || "", c.phone || "", c.last_message_at || ""])
              );
              toast({ title: "CSV exportado" });
            }}>
              <Download className="w-3 h-3" /> Exportar
            </Button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Total Conversas" value={String(allContacts.length)} icon={MessageCircle} gradient="from-emerald-500/15 to-emerald-600/5" />
            <KpiCard label="Mensagens Hoje" value={String(messagesToday.length)} icon={MessageCircle} gradient="from-blue-500/15 to-blue-600/5" />
            <KpiCard label="Conversas Ativas" value={String(allContacts.filter((c: any) => c.attending_mode === "human").length)} icon={Users} gradient="from-purple-500/15 to-purple-600/5" />
            <KpiCard label="Total Mensagens" value={String(allMessages.length)} icon={TrendingUp} gradient="from-amber-500/15 to-amber-600/5" />
          </div>

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
        <TabsContent value="agents" className="space-y-6 mt-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => {
              downloadCsv("ai-logs.csv", ["Agente ID", "Tokens", "Modelo", "Data"],
                (aiLogs ?? []).map((l: any) => [l.agent_id, String(l.tokens_used || 0), l.model || "", l.created_at])
              );
              toast({ title: "CSV exportado" });
            }}>
              <Download className="w-3 h-3" /> Exportar
            </Button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Total Agentes" value={String(allAgents.length)} icon={Bot} gradient="from-emerald-500/15 to-emerald-600/5" />
            <KpiCard label="Agentes Ativos" value={String(activeAgents.length)} icon={Bot} gradient="from-blue-500/15 to-blue-600/5" />
            <KpiCard label="Mensagens IA" value={String((aiLogs ?? []).length)} icon={MessageCircle} gradient="from-purple-500/15 to-purple-600/5" />
            <KpiCard label="Tokens Utilizados" value={totalTokens.toLocaleString("pt-BR")} icon={TrendingUp} gradient="from-amber-500/15 to-amber-600/5" />
          </div>

          {allAgents.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Bot className="w-10 h-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-medium">Sem agentes IA</p>
                <p className="text-xs text-muted-foreground mt-1">Crie agentes IA para ver métricas de uso.</p>
              </CardContent>
            </Card>
          )}

          {(aiLogs ?? []).length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Últimas Conversas IA</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Modelo</TableHead>
                      <TableHead className="text-xs">Tokens</TableHead>
                      <TableHead className="text-xs text-right">Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(aiLogs ?? []).slice(0, 10).map((log: any) => (
                      <TableRow key={log.id}>
                        <TableCell className="py-2 text-xs">{log.model || "—"}</TableCell>
                        <TableCell className="py-2 text-xs">{log.tokens_used || 0}</TableCell>
                        <TableCell className="py-2 text-xs text-right">{new Date(log.created_at).toLocaleDateString("pt-BR")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
