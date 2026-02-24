import { useState, useRef, useMemo } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { FileSignature, DollarSign, Inbox, Download, Link2, Plus, Users } from "lucide-react";
import { useContracts, useContractTemplates, useContractMutations } from "@/hooks/useContracts";
import { useCrmLeads } from "@/hooks/useCrmLeads";
import { toast } from "sonner";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  draft: { label: "Rascunho", variant: "secondary" },
  active: { label: "Ativo", variant: "default" },
  signed: { label: "Assinado", variant: "outline" },
  cancelled: { label: "Cancelado", variant: "destructive" },
};

function ContractForm({ onSuccess }: { onSuccess: () => void }) {
  const { createContract } = useContractMutations();
  const { data: leads } = useCrmLeads();
  const { data: templates } = useContractTemplates();
  const contractRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    title: "",
    signer_name: "",
    signer_email: "",
    client_document: "",
    client_phone: "",
    client_address: "",
    service_description: "",
    monthly_value: "",
    duration_months: "",
    start_date: "",
    end_date: "",
    lead_id: "",
    template_id: "",
    status: "draft",
  });

  const totalValue = useMemo(() => {
    const mv = Number(form.monthly_value) || 0;
    const dm = Number(form.duration_months) || 0;
    return mv * dm;
  }, [form.monthly_value, form.duration_months]);

  const set = (key: string, val: string) => setForm(prev => ({ ...prev, [key]: val }));

  const handleLeadSelect = (leadId: string) => {
    set("lead_id", leadId);
    const lead = (leads ?? []).find(l => l.id === leadId);
    if (lead) {
      setForm(prev => ({
        ...prev,
        lead_id: leadId,
        signer_name: lead.name || prev.signer_name,
        signer_email: lead.email || prev.signer_email,
        client_phone: lead.phone || prev.client_phone,
      }));
    }
  };

  const handleSave = (status: string) => {
    if (!form.title || !form.signer_name) return toast.error("Preencha título e nome do cliente");
    createContract.mutate(
      {
        title: form.title,
        signer_name: form.signer_name,
        signer_email: form.signer_email || undefined,
        client_document: form.client_document || undefined,
        client_phone: form.client_phone || undefined,
        client_address: form.client_address || undefined,
        service_description: form.service_description || undefined,
        monthly_value: Number(form.monthly_value) || 0,
        total_value: totalValue,
        duration_months: Number(form.duration_months) || undefined,
        start_date: form.start_date || undefined,
        end_date: form.end_date || undefined,
        lead_id: form.lead_id || undefined,
        template_id: form.template_id || undefined,
        status,
      },
      {
        onSuccess: () => {
          toast.success(status === "draft" ? "Rascunho salvo!" : "Contrato gerado com sucesso!");
          setForm({ title: "", signer_name: "", signer_email: "", client_document: "", client_phone: "", client_address: "", service_description: "", monthly_value: "", duration_months: "", start_date: "", end_date: "", lead_id: "", template_id: "", status: "draft" });
          onSuccess();
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Vinculação CRM */}
      <Card className="glass-card">
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Link2 className="w-4 h-4" />Vincular ao CRM (opcional)</CardTitle></CardHeader>
        <CardContent>
          <Select value={form.lead_id} onValueChange={handleLeadSelect}>
            <SelectTrigger><SelectValue placeholder="Selecionar lead do CRM..." /></SelectTrigger>
            <SelectContent>
              {(leads ?? []).map(l => (
                <SelectItem key={l.id} value={l.id}>{l.name} {l.email ? `— ${l.email}` : ""}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.lead_id && <p className="text-xs text-muted-foreground mt-2">Dados do lead serão importados automaticamente.</p>}
        </CardContent>
      </Card>

      {/* Dados do Cliente */}
      <Card className="glass-card">
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Users className="w-4 h-4" />Dados do Cliente</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Nome *</Label><Input value={form.signer_name} onChange={e => set("signer_name", e.target.value)} placeholder="Nome completo" /></div>
            <div><Label>Email</Label><Input type="email" value={form.signer_email} onChange={e => set("signer_email", e.target.value)} placeholder="email@exemplo.com" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>CPF/CNPJ</Label><Input value={form.client_document} onChange={e => set("client_document", e.target.value)} placeholder="000.000.000-00" /></div>
            <div><Label>Telefone</Label><Input value={form.client_phone} onChange={e => set("client_phone", e.target.value)} placeholder="(00) 00000-0000" /></div>
          </div>
          <div><Label>Endereço</Label><Input value={form.client_address} onChange={e => set("client_address", e.target.value)} placeholder="Rua, número, bairro, cidade" /></div>
        </CardContent>
      </Card>

      {/* Contratação */}
      <Card className="glass-card">
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><FileSignature className="w-4 h-4" />Contratação</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Título do Contrato *</Label><Input value={form.title} onChange={e => set("title", e.target.value)} placeholder="Ex: Contrato de Prestação de Serviços" /></div>
          {(templates ?? []).length > 0 && (
            <div>
              <Label>Template</Label>
              <Select value={form.template_id} onValueChange={v => set("template_id", v)}>
                <SelectTrigger><SelectValue placeholder="Selecionar template (opcional)" /></SelectTrigger>
                <SelectContent>{(templates ?? []).map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          <div><Label>Descrição dos Serviços</Label><Textarea value={form.service_description} onChange={e => set("service_description", e.target.value)} placeholder="Descreva os serviços contratados..." rows={4} /></div>
        </CardContent>
      </Card>

      {/* Valores */}
      <Card className="glass-card">
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><DollarSign className="w-4 h-4" />Valores e Vigência</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Valor Mensal (R$)</Label><Input type="number" value={form.monthly_value} onChange={e => set("monthly_value", e.target.value)} placeholder="0,00" /></div>
            <div><Label>Duração (meses)</Label><Input type="number" value={form.duration_months} onChange={e => set("duration_months", e.target.value)} placeholder="12" /></div>
            <div>
              <Label>Valor Total</Label>
              <div className="h-10 flex items-center px-3 rounded-md border border-input bg-muted/50 text-sm font-semibold">
                R$ {totalValue.toLocaleString("pt-BR")}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Data Início</Label><Input type="date" value={form.start_date} onChange={e => set("start_date", e.target.value)} /></div>
            <div><Label>Data Fim</Label><Input type="date" value={form.end_date} onChange={e => set("end_date", e.target.value)} /></div>
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
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
      <div style="font-family:sans-serif;padding:40px;max-width:700px;">
        <h1 style="font-size:20px;margin-bottom:4px;">${contract.title}</h1>
        <p style="color:#888;font-size:12px;margin-bottom:24px;">Contrato gerado em ${new Date(contract.created_at).toLocaleDateString("pt-BR")}</p>
        <hr/>
        <h3 style="font-size:14px;margin-top:20px;">Dados do Cliente</h3>
        <table style="width:100%;font-size:13px;margin-top:8px;">
          <tr><td style="padding:4px 0;color:#666;">Nome:</td><td>${contract.signer_name || "—"}</td></tr>
          <tr><td style="padding:4px 0;color:#666;">Email:</td><td>${contract.signer_email || "—"}</td></tr>
          <tr><td style="padding:4px 0;color:#666;">CPF/CNPJ:</td><td>${contract.client_document || "—"}</td></tr>
          <tr><td style="padding:4px 0;color:#666;">Telefone:</td><td>${contract.client_phone || "—"}</td></tr>
          <tr><td style="padding:4px 0;color:#666;">Endereço:</td><td>${contract.client_address || "—"}</td></tr>
        </table>
        <h3 style="font-size:14px;margin-top:20px;">Serviços Contratados</h3>
        <p style="font-size:13px;white-space:pre-wrap;">${contract.service_description || "—"}</p>
        <h3 style="font-size:14px;margin-top:20px;">Valores</h3>
        <table style="width:100%;font-size:13px;margin-top:8px;">
          <tr><td style="padding:4px 0;color:#666;">Valor Mensal:</td><td>R$ ${Number(contract.monthly_value || 0).toLocaleString("pt-BR")}</td></tr>
          <tr><td style="padding:4px 0;color:#666;">Duração:</td><td>${contract.duration_months || "—"} meses</td></tr>
          <tr><td style="padding:4px 0;color:#666;">Valor Total:</td><td><strong>R$ ${Number(contract.total_value || 0).toLocaleString("pt-BR")}</strong></td></tr>
          <tr><td style="padding:4px 0;color:#666;">Vigência:</td><td>${contract.start_date ? new Date(contract.start_date).toLocaleDateString("pt-BR") : "—"} a ${contract.end_date ? new Date(contract.end_date).toLocaleDateString("pt-BR") : "—"}</td></tr>
        </table>
        <div style="margin-top:60px;display:flex;justify-content:space-between;">
          <div style="text-align:center;width:45%;">
            <hr style="margin-bottom:4px;"/>
            <span style="font-size:12px;">Contratante</span>
          </div>
          <div style="text-align:center;width:45%;">
            <hr style="margin-bottom:4px;"/>
            <span style="font-size:12px;">Contratado</span>
          </div>
        </div>
      </div>
    `;
    html2pdf().set({ margin: 0.5, filename: `${contract.title}.pdf`, jsPDF: { format: "a4" } }).from(el).save();
  });
}

export default function FranqueadoContratos() {
  const { data: contracts, isLoading } = useContracts();
  const { data: leads } = useCrmLeads();
  const { updateContract } = useContractMutations();
  const [tab, setTab] = useState("lista");
  const [statusFilter, setStatusFilter] = useState("all");

  if (isLoading) {
    return (
      <div className="w-full space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      </div>
    );
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
          <TabsTrigger value="novo">
            <Plus className="w-4 h-4 mr-1" />Novo Contrato
          </TabsTrigger>
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
              <p className="text-xs text-muted-foreground mt-1">Crie seu primeiro contrato na aba "Novo Contrato".</p>
            </div>
          ) : (
            <Card className="glass-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Valor Mensal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>CRM</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(c => {
                    const st = statusLabels[c.status] || { label: c.status, variant: "secondary" as const };
                    const linkedLead = (c as any).lead_id ? leadsMap.get((c as any).lead_id) : null;
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.title}</TableCell>
                        <TableCell>{c.signer_name || "—"}</TableCell>
                        <TableCell className="font-semibold">R$ {Number((c as any).monthly_value || 0).toLocaleString("pt-BR")}</TableCell>
                        <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                        <TableCell>
                          {linkedLead ? (
                            <Badge variant="outline" className="text-xs"><Link2 className="w-3 h-3 mr-1" />{linkedLead.name}</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">{new Date(c.created_at).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" onClick={() => downloadContractPdf(c)} title="Baixar PDF">
                            <Download className="w-4 h-4" />
                          </Button>
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
