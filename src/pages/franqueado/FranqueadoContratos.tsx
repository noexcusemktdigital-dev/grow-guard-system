// @ts-nocheck
import { useState, useMemo } from "react";
import type { Tables } from "@/integrations/supabase/types";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/KpiCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  FileSignature, DollarSign, Inbox, Download, Link2, Plus,
  CheckCircle, AlertTriangle, Clock, FileType,
} from "lucide-react";
import { useContracts } from "@/hooks/useContracts";
import { useCrmLeads } from "@/hooks/useCrmLeads";
import { useSearchParams } from "react-router-dom";
import { format, differenceInDays } from "date-fns";
import { downloadContractPdf } from "@/lib/contractPdfTemplate";
import { downloadContractDocx } from "@/lib/contractDocxGenerator";
import { ServiceContractForm } from "@/pages/ContratosGeradorServiceForm";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  draft: { label: "Rascunho", variant: "secondary" },
  active: { label: "Ativo", variant: "default" },
  signed: { label: "Assinado", variant: "outline" },
  cancelled: { label: "Cancelado", variant: "destructive" },
};

export default function FranqueadoContratos() {
  const { data: contracts, isLoading } = useContracts();
  const { data: leads } = useCrmLeads();
  const [searchParams] = useSearchParams();
  const proposalIdFromUrl = searchParams.get("proposal_id");
  const tabFromUrl = searchParams.get("tab");
  const [tab, setTab] = useState(tabFromUrl === "novo" ? "novo" : "novo");
  const [statusFilter, setStatusFilter] = useState("all");

  if (isLoading) {
    return <div className="w-full space-y-6"><Skeleton className="h-10 w-64" /><div className="grid grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div></div>;
  }

  const items = contracts ?? [];
  const filtered = statusFilter === "all" ? items : items.filter(c => c.status === statusFilter);
  const ativos = items.filter(c => c.status === "active").length;
  const totalMensal = items.filter(c => c.status === "active").reduce((s, c) => s + Number((c as Tables<'contracts'>).monthly_value || 0), 0);
  const leadsMap = new Map((leads ?? []).map(l => [l.id, l]));

  return (
    <div className="w-full space-y-6">
      <PageHeader title="Contratos" subtitle="Gere contratos vinculados às propostas aprovadas" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Contratos Ativos" value={String(ativos)} icon={FileSignature} delay={0} variant="accent" />
        <KpiCard label="Total Contratos" value={String(items.length)} icon={FileSignature} delay={1} />
        <KpiCard label="Receita Mensal" value={`R$ ${totalMensal.toLocaleString("pt-BR")}`} icon={DollarSign} delay={2} />
        <KpiCard label="Vinculados CRM" value={String(items.filter(c => (c as Tables<'contracts'>).lead_id).length)} icon={Link2} delay={3} />
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="novo"><Plus className="w-4 h-4 mr-1" />Gerar Contrato</TabsTrigger>
          <TabsTrigger value="lista">Gestão de Contratos</TabsTrigger>
        </TabsList>

        <TabsContent value="novo">
          <ServiceContractForm
            onSuccess={() => setTab("lista")}
            initialProposalId={proposalIdFromUrl || undefined}
          />
        </TabsContent>

        <TabsContent value="lista" className="space-y-4">
          <div className="flex gap-2">
            {["all", "draft", "active", "signed", "cancelled"].map(s => (
              <Button key={s} size="sm" variant={statusFilter === s ? "default" : "outline"} onClick={() => setStatusFilter(s)}>
                {s === "all" ? "Todos" : statusLabels[s]?.label || s}
              </Button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <Inbox className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground font-medium">Nenhum contrato encontrado</p>
            </div>
          ) : (
            <Card className="glass-card">
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Valor Mensal</TableHead>
                    <TableHead>Dia Pgto</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assinatura</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>CRM</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(c => {
                    const st = statusLabels[c.status] || { label: c.status, variant: "secondary" as const };
                    const linkedLead = (c as Tables<'contracts'>).lead_id ? leadsMap.get((c as Tables<'contracts'>).lead_id) : null;
                    const isSigned = !!(c as Tables<'contracts'>).signed_at;
                    const endDateContract = (c as Tables<'contracts'>).end_date ? new Date((c as Tables<'contracts'>).end_date) : null;
                    const daysToEnd = endDateContract ? differenceInDays(endDateContract, new Date()) : null;

                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.title}</TableCell>
                        <TableCell>{c.signer_name || "—"}</TableCell>
                        <TableCell className="font-semibold">R$ {Number((c as Tables<'contracts'>).monthly_value || 0).toLocaleString("pt-BR")}</TableCell>
                        <TableCell>{(c as Tables<'contracts'>).payment_day ? `Dia ${(c as Tables<'contracts'>).payment_day}` : "—"}</TableCell>
                        <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                        <TableCell>
                          {isSigned ? (
                            <Badge className="gap-1 bg-emerald-500/15 text-emerald-700 border-emerald-500/30 text-[10px]"><CheckCircle className="w-3 h-3" />Assinado</Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1 text-[10px]"><Clock className="w-3 h-3" />Não assinado</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {daysToEnd !== null && c.status === "active" ? (
                            daysToEnd <= 30 ? (
                              <Badge variant="destructive" className="gap-1 text-[10px]"><AlertTriangle className="w-3 h-3" />Vence em {daysToEnd}d</Badge>
                            ) : daysToEnd <= 90 ? (
                              <Badge variant="outline" className="gap-1 text-[10px] text-amber-600"><Clock className="w-3 h-3" />{daysToEnd}d</Badge>
                            ) : (
                              <span className="text-[10px] text-muted-foreground">{daysToEnd}d</span>
                            )
                          ) : "—"}
                        </TableCell>
                        <TableCell>
                          {linkedLead ? <Badge variant="outline" className="text-xs"><Link2 className="w-3 h-3 mr-1" />{linkedLead.name}</Badge> : <span className="text-xs text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button size="sm" variant="ghost" onClick={() => downloadContractPdf(c)} title="Baixar PDF">
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => downloadContractDocx(c)} title="Baixar DOCX">
                              <FileType className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
