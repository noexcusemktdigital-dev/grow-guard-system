import { useState, useMemo, useRef } from "react";
import { sanitizeHtml } from "@/lib/sanitize";
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
import {
  FileSignature, DollarSign, Inbox, Download, Link2, Plus, Users, CalendarDays,
  CheckCircle, AlertTriangle, Clock, Eye,
} from "lucide-react";
import { useContracts, useContractMutations } from "@/hooks/useContracts";
import { useCrmLeads } from "@/hooks/useCrmLeads";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import { SERVICE_CONTENT, SERVICE_PLACEHOLDERS } from "@/constants/contractTemplates";
import { downloadContractPdf, getPreviewHtml } from "@/lib/contractPdfTemplate";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  draft: { label: "Rascunho", variant: "secondary" },
  active: { label: "Ativo", variant: "default" },
  signed: { label: "Assinado", variant: "outline" },
  cancelled: { label: "Cancelado", variant: "destructive" },
};

const DURATION_OPTIONS = [
  { value: "1", label: "1 mês" },
  { value: "3", label: "3 meses" },
  { value: "6", label: "6 meses" },
  { value: "12", label: "12 meses" },
  { value: "24", label: "24 meses" },
];

function buildContractContent(form: Record<string, string>) {
  let content = SERVICE_CONTENT;
  for (const p of SERVICE_PLACEHOLDERS) {
    const key = p.key.replace(/\{\{|\}\}/g, "");
    content = content.split(p.key).join(form[key] || p.key);
  }
  return content;
}

// ─── Contract Form ───

function ContractForm({ onSuccess }: { onSuccess: () => void }) {
  const { createContract } = useContractMutations();
  const [showPreview, setShowPreview] = useState(false);

  const [form, setForm] = useState<Record<string, string>>({
    contratante_razao_social: "",
    contratante_cnpj: "",
    contratante_endereco: "",
    contratante_bairro: "",
    contratante_cep: "",
    contratante_cidade: "",
    contratante_estado: "",
    servicos_descricao: "",
    prazo_meses: "",
    valor_setup: "",
    valor_setup_extenso: "",
    valor_mensal: "",
    valor_mensal_extenso: "",
    dia_vencimento: "",
    data_assinatura: "",
  });

  const set = (key: string, val: string) => setForm(prev => ({ ...prev, [key]: val }));

  const previewContent = useMemo(() => buildContractContent(form), [form]);

  const handleSave = (status: string) => {
    if (!form.contratante_razao_social) return toast.error("Informe a Razão Social do contratante");
    if (!form.contratante_cnpj) return toast.error("Informe o CNPJ do contratante");
    if (!form.prazo_meses) return toast.error("Selecione o prazo do contrato");
    if (!form.dia_vencimento) return toast.error("Informe o dia de vencimento");

    const content = buildContractContent(form);
    const monthlyValue = parseFloat(form.valor_mensal.replace(/\./g, "").replace(",", ".")) || 0;
    const durationMonths = Number(form.prazo_meses) || 0;

    createContract.mutate(
      {
        title: `Contrato - ${form.contratante_razao_social}`,
        content,
        signer_name: form.contratante_razao_social,
        client_document: form.contratante_cnpj,
        client_address: `${form.contratante_endereco}, ${form.contratante_bairro}, ${form.contratante_cidade}/${form.contratante_estado} - CEP ${form.contratante_cep}`,
        service_description: form.servicos_descricao,
        monthly_value: monthlyValue,
        total_value: monthlyValue * durationMonths,
        duration_months: durationMonths,
        payment_day: Number(form.dia_vencimento) || undefined,
        status,
        contract_type: "assessoria",
      },
      {
        onSuccess: () => {
          toast.success(status === "draft" ? "Rascunho salvo!" : "Contrato gerado com sucesso!");
          onSuccess();
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Dados do Contratante */}
      <Card className="glass-card border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Users className="w-4 h-4" /> Dados do Contratante
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><Label>Razão Social *</Label><Input value={form.contratante_razao_social} onChange={e => set("contratante_razao_social", e.target.value)} placeholder="Empresa Exemplo LTDA" /></div>
            <div><Label>CNPJ *</Label><Input value={form.contratante_cnpj} onChange={e => set("contratante_cnpj", e.target.value)} placeholder="00.000.000/0001-00" /></div>
          </div>
          <div><Label>Endereço</Label><Input value={form.contratante_endereco} onChange={e => set("contratante_endereco", e.target.value)} placeholder="Avenida Exemplo, nº 100" /></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div><Label>Bairro</Label><Input value={form.contratante_bairro} onChange={e => set("contratante_bairro", e.target.value)} /></div>
            <div><Label>CEP</Label><Input value={form.contratante_cep} onChange={e => set("contratante_cep", e.target.value)} placeholder="00000-000" /></div>
            <div><Label>Cidade</Label><Input value={form.contratante_cidade} onChange={e => set("contratante_cidade", e.target.value)} /></div>
            <div><Label>Estado</Label><Input value={form.contratante_estado} onChange={e => set("contratante_estado", e.target.value)} /></div>
          </div>
        </CardContent>
      </Card>

      {/* Serviços e Prazo */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <FileSignature className="w-4 h-4" /> Serviços e Prazo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Serviços Contratados *</Label>
            <Textarea
              value={form.servicos_descricao}
              onChange={e => set("servicos_descricao", e.target.value)}
              placeholder={"Artes: 04 unidades;\nVídeos: 04 unidades;\nProgramação: Meta;\nGestão de Tráfego Pago: Meta e Google;"}
              rows={4}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Prazo do Contrato *</Label>
              <Select value={form.prazo_meses} onValueChange={v => set("prazo_meses", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{DURATION_OPTIONS.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Data da Assinatura</Label>
              <Input value={form.data_assinatura} onChange={e => set("data_assinatura", e.target.value)} placeholder="27 de fevereiro de 2026" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Valores */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <DollarSign className="w-4 h-4" /> Valores e Pagamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><Label>Valor Setup (R$)</Label><Input value={form.valor_setup} onChange={e => set("valor_setup", e.target.value)} placeholder="1.000,00" /></div>
            <div><Label>Setup por Extenso</Label><Input value={form.valor_setup_extenso} onChange={e => set("valor_setup_extenso", e.target.value)} placeholder="mil reais" /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><Label>Valor Mensal (R$) *</Label><Input value={form.valor_mensal} onChange={e => set("valor_mensal", e.target.value)} placeholder="2.500,00" /></div>
            <div><Label>Mensal por Extenso</Label><Input value={form.valor_mensal_extenso} onChange={e => set("valor_mensal_extenso", e.target.value)} placeholder="dois mil e quinhentos reais" /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Dia de Vencimento *</Label>
              <Select value={form.dia_vencimento} onValueChange={v => set("dia_vencimento", v)}>
                <SelectTrigger><SelectValue placeholder="Dia" /></SelectTrigger>
                <SelectContent>{Array.from({ length: 31 }, (_, i) => i + 1).map(d => <SelectItem key={d} value={String(d)}>Dia {d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Toggle */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)} className="gap-2">
          <Eye className="w-4 h-4" />{showPreview ? "Ocultar Preview" : "Visualizar Contrato"}
        </Button>
      </div>

      {showPreview && (
        <Card className="glass-card overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-white" dangerouslySetInnerHTML={{ __html: sanitizeHtml(getPreviewHtml(previewContent, "assessoria")) }} />
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={() => handleSave("draft")} disabled={createContract.isPending}>Salvar como Rascunho</Button>
        <Button onClick={() => handleSave("active")} disabled={createContract.isPending}>Gerar Contrato</Button>
      </div>
    </div>
  );
}

// ─── Main Page ───

export default function FranqueadoContratos() {
  const { data: contracts, isLoading } = useContracts();
  const { data: leads } = useCrmLeads();
  const [tab, setTab] = useState("novo");
  const [statusFilter, setStatusFilter] = useState("all");

  if (isLoading) {
    return <div className="w-full space-y-6"><Skeleton className="h-10 w-64" /><div className="grid grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div></div>;
  }

  const items = contracts ?? [];
  const filtered = statusFilter === "all" ? items : items.filter(c => c.status === statusFilter);
  const ativos = items.filter(c => c.status === "active").length;
  const totalMensal = items.filter(c => c.status === "active").reduce((s, c) => s + Number((c as unknown as Record<string, unknown>).monthly_value || 0), 0);
  const leadsMap = new Map((leads ?? []).map(l => [l.id, l]));

  return (
    <div className="w-full space-y-6">
      <PageHeader title="Contratos" subtitle="Gere e gerencie contratos de prestação de serviço" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Contratos Ativos" value={String(ativos)} icon={FileSignature} delay={0} variant="accent" />
        <KpiCard label="Total Contratos" value={String(items.length)} icon={FileSignature} delay={1} />
        <KpiCard label="Receita Mensal" value={`R$ ${totalMensal.toLocaleString("pt-BR")}`} icon={DollarSign} delay={2} />
        <KpiCard label="Vinculados CRM" value={String(items.filter(c => (c as unknown as Record<string, unknown>).lead_id).length)} icon={Link2} delay={3} />
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="novo"><Plus className="w-4 h-4 mr-1" />Gerar Contrato</TabsTrigger>
          <TabsTrigger value="lista">Gestão de Contratos</TabsTrigger>
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
                    const linkedLead = (c as unknown as Record<string, unknown>).lead_id ? leadsMap.get((c as unknown as Record<string, unknown>).lead_id) : null;
                    const isSigned = !!(c as unknown as Record<string, unknown>).signed_at;
                    const endDateContract = (c as unknown as Record<string, unknown>).end_date ? new Date((c as unknown as Record<string, unknown>).end_date) : null;
                    const daysToEnd = endDateContract ? differenceInDays(endDateContract, new Date()) : null;

                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.title}</TableCell>
                        <TableCell>{c.signer_name || "—"}</TableCell>
                        <TableCell className="font-semibold">R$ {Number((c as unknown as Record<string, unknown>).monthly_value || 0).toLocaleString("pt-BR")}</TableCell>
                        <TableCell>{(c as unknown as Record<string, unknown>).payment_day ? `Dia ${(c as unknown as Record<string, unknown>).payment_day}` : "—"}</TableCell>
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
              </div>
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
