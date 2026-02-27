import { useState, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/KpiCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FileSignature, DollarSign, Inbox, Download, Link2, Plus, Users, CalendarDays,
  CheckCircle, AlertTriangle, Send, Clock,
} from "lucide-react";
import { useContracts, useContractTemplates, useContractMutations } from "@/hooks/useContracts";
import { useCrmLeads } from "@/hooks/useCrmLeads";
import { useCrmProposals } from "@/hooks/useCrmProposals";
import { toast } from "sonner";
import { addMonths, format, differenceInDays } from "date-fns";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  draft: { label: "Rascunho", variant: "secondary" },
  active: { label: "Ativo", variant: "default" },
  signed: { label: "Assinado", variant: "outline" },
  cancelled: { label: "Cancelado", variant: "destructive" },
};

const DURATION_OPTIONS = [
  { value: "1", label: "1 mês" },
  { value: "6", label: "6 meses" },
  { value: "12", label: "12 meses" },
];

function ContractForm({ onSuccess }: { onSuccess: () => void }) {
  const { createContract } = useContractMutations();
  const { data: leads } = useCrmLeads();
  const { data: proposals } = useCrmProposals();

  const acceptedProposals = useMemo(() => (proposals ?? []).filter(p => p.status === "accepted"), [proposals]);

  const [form, setForm] = useState({
    title: "", signer_name: "", signer_email: "", client_document: "", client_phone: "",
    client_address: "", service_description: "", monthly_value: "", duration_months: "",
    start_date: "", payment_day: "", lead_id: "", proposal_id: "", status: "draft",
  });

  const totalValue = useMemo(() => (Number(form.monthly_value) || 0) * (Number(form.duration_months) || 0), [form.monthly_value, form.duration_months]);
  const endDate = useMemo(() => {
    if (!form.start_date || !form.duration_months) return "";
    return format(addMonths(new Date(form.start_date), Number(form.duration_months)), "yyyy-MM-dd");
  }, [form.start_date, form.duration_months]);

  const set = (key: string, val: string) => setForm(prev => ({ ...prev, [key]: val }));

  // Filter proposals by selected lead
  const filteredProposals = useMemo(() => {
    if (!form.lead_id) return acceptedProposals;
    return acceptedProposals.filter(p => p.lead_id === form.lead_id);
  }, [acceptedProposals, form.lead_id]);

  const handleLeadSelect = (leadId: string) => {
    const lead = (leads ?? []).find(l => l.id === leadId);
    setForm(prev => ({
      ...prev, lead_id: leadId, proposal_id: "",
      signer_name: lead?.name || prev.signer_name,
      signer_email: lead?.email || prev.signer_email,
      client_phone: lead?.phone || prev.client_phone,
    }));
  };

  const handleProposalSelect = (proposalId: string) => {
    const proposal = acceptedProposals.find(p => p.id === proposalId);
    if (!proposal) return;
    const serviceDesc = (proposal.items ?? []).map((item: any) => `• ${item.name} (${item.quantity}x)`).join("\n");
    const monthlyVal = (proposal.content as any)?.monthly_value || proposal.value || 0;
    setForm(prev => ({
      ...prev, proposal_id: proposalId,
      title: `Contrato - ${proposal.title}`,
      service_description: serviceDesc,
      monthly_value: String(monthlyVal),
      lead_id: proposal.lead_id || prev.lead_id,
    }));
    if (proposal.lead_id) {
      const lead = (leads ?? []).find(l => l.id === proposal.lead_id);
      if (lead) setForm(prev => ({ ...prev, signer_name: lead.name || prev.signer_name, signer_email: lead.email || prev.signer_email, client_phone: lead.phone || prev.client_phone }));
    }
  };

  const handleSave = (status: string) => {
    if (!form.lead_id) return toast.error("Selecione um lead do CRM");
    if (!form.proposal_id) return toast.error("Selecione uma proposta aceita");
    if (!form.payment_day) return toast.error("Informe o dia de pagamento");
    if (!form.duration_months) return toast.error("Selecione a duração");
    createContract.mutate({
      title: form.title || `Contrato - ${form.signer_name}`,
      signer_name: form.signer_name, signer_email: form.signer_email || undefined,
      client_document: form.client_document || undefined, client_phone: form.client_phone || undefined,
      client_address: form.client_address || undefined, service_description: form.service_description || undefined,
      monthly_value: Number(form.monthly_value) || 0, total_value: totalValue,
      duration_months: Number(form.duration_months) || undefined,
      start_date: form.start_date || undefined, end_date: endDate || undefined,
      lead_id: form.lead_id, payment_day: Number(form.payment_day) || undefined, status,
    }, {
      onSuccess: () => {
        toast.success(status === "draft" ? "Rascunho salvo!" : "Contrato gerado!");
        setForm({ title: "", signer_name: "", signer_email: "", client_document: "", client_phone: "", client_address: "", service_description: "", monthly_value: "", duration_months: "", start_date: "", payment_day: "", lead_id: "", proposal_id: "", status: "draft" });
        onSuccess();
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Lead (obrigatório) */}
      <Card className="glass-card border-primary/20">
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Link2 className="w-4 h-4" />Lead do CRM *</CardTitle></CardHeader>
        <CardContent>
          <Select value={form.lead_id} onValueChange={handleLeadSelect}>
            <SelectTrigger><SelectValue placeholder="Selecionar lead..." /></SelectTrigger>
            <SelectContent>{(leads ?? []).map(l => <SelectItem key={l.id} value={l.id}>{l.name} {l.email ? `— ${l.email}` : ""}</SelectItem>)}</SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* 2. Proposta Aceita (obrigatório) */}
      <Card className="glass-card border-primary/20">
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><FileSignature className="w-4 h-4" />Proposta Aceita *</CardTitle></CardHeader>
        <CardContent>
          {filteredProposals.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhuma proposta aceita {form.lead_id ? "para este lead" : "encontrada"}. Gere e aceite uma proposta primeiro.</p>
          ) : (
            <Select value={form.proposal_id} onValueChange={handleProposalSelect}>
              <SelectTrigger><SelectValue placeholder="Selecionar proposta aceita..." /></SelectTrigger>
              <SelectContent>{filteredProposals.map(p => <SelectItem key={p.id} value={p.id}>{p.title} — R$ {Number(p.value || 0).toLocaleString("pt-BR")}</SelectItem>)}</SelectContent>
            </Select>
          )}
          {form.proposal_id && <p className="text-xs text-emerald-600 mt-2">✓ Dados da proposta preenchidos automaticamente.</p>}
        </CardContent>
      </Card>

      {/* 3. Dados do Cliente (auto-preenchidos) */}
      <Card className="glass-card">
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Users className="w-4 h-4" />Dados do Cliente</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Nome</Label><Input value={form.signer_name} onChange={e => set("signer_name", e.target.value)} placeholder="Nome completo" /></div>
            <div><Label>Email</Label><Input type="email" value={form.signer_email} onChange={e => set("signer_email", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>CPF/CNPJ</Label><Input value={form.client_document} onChange={e => set("client_document", e.target.value)} /></div>
            <div><Label>Telefone</Label><Input value={form.client_phone} onChange={e => set("client_phone", e.target.value)} /></div>
          </div>
          <div><Label>Endereço</Label><Input value={form.client_address} onChange={e => set("client_address", e.target.value)} /></div>
        </CardContent>
      </Card>

      {/* 4. Pagamento e Vigência */}
      <Card className="glass-card">
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><DollarSign className="w-4 h-4" />Pagamento e Vigência</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <Label>Valor Mensal</Label>
              <div className="h-10 flex items-center px-3 rounded-md border border-input bg-muted/50 text-sm font-semibold">R$ {Number(form.monthly_value || 0).toLocaleString("pt-BR")}</div>
            </div>
            <div>
              <Label>Duração *</Label>
              <Select value={form.duration_months} onValueChange={v => set("duration_months", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{DURATION_OPTIONS.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Dia de Pagamento *</Label>
              <Select value={form.payment_day} onValueChange={v => set("payment_day", v)}>
                <SelectTrigger><SelectValue placeholder="Dia" /></SelectTrigger>
                <SelectContent>{Array.from({ length: 31 }, (_, i) => i + 1).map(d => <SelectItem key={d} value={String(d)}>Dia {d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Valor Total</Label>
              <div className="h-10 flex items-center px-3 rounded-md border border-input bg-muted/50 text-sm font-semibold">R$ {totalValue.toLocaleString("pt-BR")}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Data Início</Label><Input type="date" value={form.start_date} onChange={e => set("start_date", e.target.value)} /></div>
            <div>
              <Label>Data Fim (automática)</Label>
              <div className="h-10 flex items-center px-3 rounded-md border border-input bg-muted/50 text-sm text-muted-foreground">
                {endDate ? new Date(endDate).toLocaleDateString("pt-BR") : "Selecione início e duração"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={() => handleSave("draft")} disabled={createContract.isPending}>Salvar como Rascunho</Button>
        <Button onClick={() => handleSave("active")} disabled={createContract.isPending}>Gerar Contrato</Button>
      </div>
    </div>
  );
}

function downloadContractPdf(contract: any) {
  import("html2pdf.js").then(({ default: html2pdf }) => {
    const el = document.createElement("div");
    el.innerHTML = `
      <div style="font-family:'Times New Roman',serif;padding:60px 50px;max-width:750px;color:#1a1a1a;line-height:1.6;">
        <div style="text-align:center;margin-bottom:40px;">
          <h1 style="font-size:22px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;margin-bottom:4px;">CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h1>
          <p style="font-size:12px;color:#666;">Nº ${contract.id?.slice(0,8).toUpperCase()} — ${new Date(contract.created_at).toLocaleDateString("pt-BR")}</p>
        </div>
        <hr style="border:none;border-top:2px solid #333;margin:20px 0;"/>

        <h3 style="font-size:14px;font-weight:bold;text-transform:uppercase;margin:24px 0 12px;">1. DAS PARTES</h3>
        <p style="font-size:13px;"><strong>CONTRATANTE:</strong> ${contract.signer_name || "—"}</p>
        <p style="font-size:13px;">CPF/CNPJ: ${contract.client_document || "—"} | Email: ${contract.signer_email || "—"} | Tel: ${contract.client_phone || "—"}</p>
        <p style="font-size:13px;">Endereço: ${contract.client_address || "—"}</p>

        <h3 style="font-size:14px;font-weight:bold;text-transform:uppercase;margin:24px 0 12px;">2. DO OBJETO</h3>
        <p style="font-size:13px;white-space:pre-wrap;">${contract.service_description || "Serviços conforme proposta comercial aceita."}</p>

        <h3 style="font-size:14px;font-weight:bold;text-transform:uppercase;margin:24px 0 12px;">3. DO VALOR E PAGAMENTO</h3>
        <table style="width:100%;font-size:13px;border-collapse:collapse;">
          <tr><td style="padding:6px 0;border-bottom:1px solid #eee;">Valor Mensal:</td><td style="text-align:right;padding:6px 0;border-bottom:1px solid #eee;font-weight:bold;">R$ ${Number(contract.monthly_value || 0).toLocaleString("pt-BR")}</td></tr>
          <tr><td style="padding:6px 0;border-bottom:1px solid #eee;">Duração:</td><td style="text-align:right;padding:6px 0;border-bottom:1px solid #eee;">${contract.duration_months || "—"} meses</td></tr>
          <tr><td style="padding:6px 0;border-bottom:1px solid #eee;">Dia de Pagamento:</td><td style="text-align:right;padding:6px 0;border-bottom:1px solid #eee;">Dia ${contract.payment_day || "—"}</td></tr>
          <tr><td style="padding:6px 0;font-weight:bold;">Valor Total:</td><td style="text-align:right;padding:6px 0;font-weight:bold;font-size:15px;">R$ ${Number(contract.total_value || 0).toLocaleString("pt-BR")}</td></tr>
        </table>

        <h3 style="font-size:14px;font-weight:bold;text-transform:uppercase;margin:24px 0 12px;">4. DA VIGÊNCIA</h3>
        <p style="font-size:13px;">Início: ${contract.start_date ? new Date(contract.start_date).toLocaleDateString("pt-BR") : "—"} | Término: ${contract.end_date ? new Date(contract.end_date).toLocaleDateString("pt-BR") : "—"}</p>

        <h3 style="font-size:14px;font-weight:bold;text-transform:uppercase;margin:24px 0 12px;">5. DAS DISPOSIÇÕES GERAIS</h3>
        <p style="font-size:12px;color:#444;">O presente contrato é regido pelas leis brasileiras. Fica eleito o foro da comarca da sede do CONTRATADO para dirimir quaisquer questões oriundas do presente instrumento.</p>

        <div style="margin-top:80px;display:flex;justify-content:space-between;">
          <div style="text-align:center;width:42%;">
            <div style="border-top:1px solid #333;padding-top:8px;">
              <p style="font-size:12px;font-weight:bold;">CONTRATANTE</p>
              <p style="font-size:11px;color:#666;">${contract.signer_name || "—"}</p>
            </div>
          </div>
          <div style="text-align:center;width:42%;">
            <div style="border-top:1px solid #333;padding-top:8px;">
              <p style="font-size:12px;font-weight:bold;">CONTRATADO</p>
              <p style="font-size:11px;color:#666;">Franquia</p>
            </div>
          </div>
        </div>
        <p style="text-align:center;font-size:10px;color:#999;margin-top:40px;">Documento gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}</p>
      </div>
    `;
    html2pdf().set({ margin: [10, 10, 10, 10], filename: `${contract.title || "Contrato"}.pdf`, jsPDF: { format: "a4" } }).from(el).save();
  });
}

export default function FranqueadoContratos() {
  const { data: contracts, isLoading } = useContracts();
  const { data: leads } = useCrmLeads();
  const [tab, setTab] = useState("lista");
  const [statusFilter, setStatusFilter] = useState("all");

  if (isLoading) {
    return <div className="w-full space-y-6"><Skeleton className="h-10 w-64" /><div className="grid grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div></div>;
  }

  const items = contracts ?? [];
  const filtered = statusFilter === "all" ? items : items.filter(c => c.status === statusFilter);
  const ativos = items.filter(c => c.status === "active").length;
  const totalMensal = items.filter(c => c.status === "active").reduce((s, c) => s + Number((c as any).monthly_value || 0), 0);
  const leadsMap = new Map((leads ?? []).map(l => [l.id, l]));

  return (
    <div className="w-full space-y-6">
      <PageHeader title="Meus Contratos" subtitle="Crie, gerencie e vincule contratos ao CRM" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Contratos Ativos" value={String(ativos)} icon={FileSignature} delay={0} variant="accent" />
        <KpiCard label="Total Contratos" value={String(items.length)} icon={FileSignature} delay={1} />
        <KpiCard label="Receita Mensal" value={`R$ ${totalMensal.toLocaleString("pt-BR")}`} icon={DollarSign} delay={2} />
        <KpiCard label="Vinculados CRM" value={String(items.filter(c => (c as any).lead_id).length)} icon={Link2} delay={3} />
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="lista">Contratos</TabsTrigger>
          <TabsTrigger value="novo"><Plus className="w-4 h-4 mr-1" />Novo Contrato</TabsTrigger>
        </TabsList>

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
                    const linkedLead = (c as any).lead_id ? leadsMap.get((c as any).lead_id) : null;
                    const isSigned = !!(c as any).signed_at;
                    const endDateContract = (c as any).end_date ? new Date((c as any).end_date) : null;
                    const daysToEnd = endDateContract ? differenceInDays(endDateContract, new Date()) : null;

                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.title}</TableCell>
                        <TableCell>{c.signer_name || "—"}</TableCell>
                        <TableCell className="font-semibold">R$ {Number((c as any).monthly_value || 0).toLocaleString("pt-BR")}</TableCell>
                        <TableCell>{(c as any).payment_day ? `Dia ${(c as any).payment_day}` : "—"}</TableCell>
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
                          <Button size="sm" variant="ghost" onClick={() => downloadContractPdf(c)} title="Baixar PDF"><Download className="w-4 h-4" /></Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="novo">
          <ContractForm onSuccess={() => setTab("lista")} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
