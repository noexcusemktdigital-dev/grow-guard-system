// @ts-nocheck
import { useState } from "react";
import { logger } from "@/lib/logger";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { KpiCard } from "@/components/KpiCard";
import { Fragment } from "react";
import {
  AlertTriangle, CheckCircle, Search, BarChart3, Activity,
  ChevronDown, ChevronUp, Trash2, Eye, Clock, Bug, ShieldAlert, Server,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { usePlatformErrors, useResolveError, useDeleteError, useErrorStats } from "@/hooks/useSaasAdmin";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const SEVERITY_COLORS: Record<string, string> = {
  critical: "hsl(var(--destructive))",
  error: "hsl(var(--destructive) / 0.7)",
  warning: "hsl(var(--chart-4))",
  info: "hsl(var(--chart-2))",
};

const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

/* ─── Visão Geral ─── */
function VisaoGeralTab() {
  const { data: stats, isLoading } = useErrorStats();

  if (isLoading) return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
      </div>
      <Skeleton className="h-48 w-full" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Erros Abertos" value={String(stats?.totalOpen || 0)} icon={Bug} />
        <KpiCard label="Críticos Abertos" value={String(stats?.criticalOpen || 0)} icon={ShieldAlert} />
        <KpiCard label="Resolvidos (mês)" value={String(stats?.resolvedThisMonth || 0)} icon={CheckCircle} />
        <KpiCard label="Últimas 24h" value={String(stats?.last24h || 0)} icon={Clock} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Erros por Dia (últimos 7 dias)</CardTitle></CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.dailyCounts || []}>
                <XAxis dataKey="date" tickFormatter={(v) => format(new Date(v), "dd/MM")} tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <RechartsTooltip labelFormatter={(v) => format(new Date(v as string), "dd/MM/yyyy")} />
                <Bar dataKey="count" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="Erros" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Distribuição por Source</CardTitle></CardHeader>
          <CardContent className="h-[260px] flex items-center justify-center">
            {stats?.bySource?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.bySource} dataKey="count" nameKey="source" cx="50%" cy="50%" outerRadius={90} label={({ source, percent }) => `${source} (${(percent * 100).toFixed(0)}%)`}>
                    {stats.bySource.map((_: { source: string; count: number }, i: number) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">Sem dados disponíveis</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ─── Erros (Tabela) ─── */
function ErrosTab() {
  const [severity, setSeverity] = useState("");
  const [source, setSource] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [resolveDialog, setResolveDialog] = useState<string | null>(null);
  const [resolveNote, setResolveNote] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { data: errors, isLoading } = usePlatformErrors({
    severity: severity || undefined,
    source: source || undefined,
    status: status || undefined,
    search: search || undefined,
  });
  const resolveError = useResolveError();
  const deleteError = useDeleteError();

  const handleResolve = async () => {
    if (!resolveDialog) return;
    try {
      await resolveError.mutateAsync({ errorId: resolveDialog, note: resolveNote });
      toast.success("Erro marcado como resolvido");
      setResolveDialog(null);
      setResolveNote("");
    } catch (err) {
      logger.error("Erro ao resolver:", err);
      toast.error("Falha ao resolver erro");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteError.mutateAsync(deleteTarget);
      toast.success("Erro excluído");
      setDeleteTarget(null);
    } catch (err) {
      logger.error("Erro ao excluir:", err);
      toast.error("Falha ao excluir erro");
    }
  };

  const severityBadge = (sev: string) => {
    const variant = sev === "critical" ? "destructive" : sev === "error" ? "destructive" : sev === "warning" ? "secondary" : "outline";
    return <Badge variant={variant}>{sev}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar mensagem ou função..." value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Buscar mensagem ou função" className="pl-9" />
        </div>
        <Select value={severity} onValueChange={setSeverity}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Severidade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
        <Select value={source} onValueChange={setSource}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Source" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="edge_function">Edge Function</SelectItem>
            <SelectItem value="webhook">Webhook</SelectItem>
            <SelectItem value="client_app">Client App</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="open">Aberto</SelectItem>
            <SelectItem value="resolved">Resolvido</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="secondary">{errors?.length || 0} resultados</Badge>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Severidade</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Mensagem</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8}><div className="space-y-2 py-4">{[1,2,3].map(i => <Skeleton key={i} className="h-8 w-full" />)}</div></TableCell></TableRow>
              ) : !errors?.length ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhum erro encontrado 🎉</TableCell></TableRow>
              ) : (
                errors.map((err) => (
                  <Fragment key={err.id}>
                    <TableRow className="cursor-pointer" onClick={() => setExpanded(expanded === err.id ? null : err.id)}>
                      <TableCell className="px-2">
                        {expanded === err.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </TableCell>
                      <TableCell>{severityBadge(err.severity)}</TableCell>
                      <TableCell className="text-xs">{err.source}</TableCell>
                      <TableCell className="font-mono text-xs">{err.function_name || "—"}</TableCell>
                      <TableCell className="max-w-[250px] truncate text-xs">{err.error_message}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{format(new Date(err.created_at), "dd/MM HH:mm")}</TableCell>
                      <TableCell>
                        {err.resolved ? (
                          <Badge variant="secondary" className="gap-1"><CheckCircle className="w-3 h-3" /> Resolvido</Badge>
                        ) : (
                          <Badge variant="destructive" className="gap-1"><AlertTriangle className="w-3 h-3" /> Aberto</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {!err.resolved && (
                            <Button size="sm" variant="ghost" onClick={() => setResolveDialog(err.id)}>
                              <CheckCircle className="w-3.5 h-3.5 mr-1" /> Resolver
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(err.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expanded === err.id && (
                      <TableRow>
                        <TableCell colSpan={8} className="bg-muted/30 p-4">
                          <div className="space-y-3 text-xs">
                            <div>
                              <span className="font-semibold text-foreground">Mensagem completa:</span>
                              <p className="text-muted-foreground mt-1 whitespace-pre-wrap">{err.error_message}</p>
                            </div>
                            {err.error_stack && (
                              <div>
                                <span className="font-semibold text-foreground">Stack Trace:</span>
                                <pre className="mt-1 text-[11px] bg-background p-3 rounded-md border overflow-x-auto max-h-[200px] text-muted-foreground">{err.error_stack}</pre>
                              </div>
                            )}
                            {err.metadata && Object.keys(err.metadata).length > 0 && (
                              <div>
                                <span className="font-semibold text-foreground">Metadata:</span>
                                <pre className="mt-1 text-[11px] bg-background p-3 rounded-md border overflow-x-auto text-muted-foreground">{JSON.stringify(err.metadata, null, 2)}</pre>
                              </div>
                            )}
                            {err.resolved && err.resolved_at && (
                              <p className="text-muted-foreground">Resolvido em {format(new Date(err.resolved_at), "dd/MM/yyyy HH:mm")}{err.resolved_note ? ` — ${err.resolved_note}` : ""}</p>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Resolve Dialog */}
      <Dialog open={!!resolveDialog} onOpenChange={(o) => { if (!o) { setResolveDialog(null); setResolveNote(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Resolver Erro</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Nota (opcional)</Label>
              <Textarea value={resolveNote} onChange={(e) => setResolveNote(e.target.value)} placeholder="Descreva a causa raiz ou o que foi feito..." rows={3} />
            </div>
            <Button onClick={handleResolve} disabled={resolveError.isPending} className="w-full">
              {resolveError.isPending ? "Resolvendo..." : "Marcar como Resolvido"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir erro?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação é irreversível. O registro será removido permanentemente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ─── Atividade (Timeline) ─── */
function AtividadeTab() {
  const [filterSev, setFilterSev] = useState("");
  const { data: errors, isLoading } = usePlatformErrors({ severity: filterSev || undefined });

  const recent = (errors || []).slice(0, 50);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={filterSev} onValueChange={setFilterSev}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Severidade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="secondary">{recent.length} registros</Badge>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : !recent.length ? (
        <div className="text-muted-foreground py-12 text-center">Nenhuma atividade recente</div>
      ) : (
        <div className="space-y-2">
          {recent.map((err) => (
            <Card key={err.id} className="p-3">
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                  err.severity === "critical" ? "bg-destructive" : err.severity === "error" ? "bg-destructive/70" : err.severity === "warning" ? "bg-chart-4" : "bg-chart-2"
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={err.severity === "critical" ? "destructive" : err.severity === "error" ? "destructive" : "secondary"} className="text-[10px]">
                      {err.severity}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{err.source}</span>
                    {err.function_name && <span className="text-xs font-mono text-muted-foreground">• {err.function_name}</span>}
                    <span className="text-xs text-muted-foreground ml-auto">
                      {formatDistanceToNow(new Date(err.created_at), { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>
                  <p className="text-sm mt-1 text-foreground truncate">{err.error_message}</p>
                </div>
                {err.resolved && <CheckCircle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Main ─── */
export default function SaasDashboard() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Logs & Erros"
        subtitle="Central de monitoramento de erros e logs do sistema"
        icon={<Server className="w-5 h-5 text-primary" />}
      />

      <Tabs defaultValue="visao-geral" className="space-y-4">
        <TabsList>
          <TabsTrigger value="visao-geral" className="gap-1.5 text-xs"><BarChart3 className="w-3.5 h-3.5" /> Visão Geral</TabsTrigger>
          <TabsTrigger value="erros" className="gap-1.5 text-xs"><AlertTriangle className="w-3.5 h-3.5" /> Erros</TabsTrigger>
          <TabsTrigger value="atividade" className="gap-1.5 text-xs"><Activity className="w-3.5 h-3.5" /> Atividade</TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral"><VisaoGeralTab /></TabsContent>
        <TabsContent value="erros"><ErrosTab /></TabsContent>
        <TabsContent value="atividade"><AtividadeTab /></TabsContent>
      </Tabs>
    </div>
  );
}
