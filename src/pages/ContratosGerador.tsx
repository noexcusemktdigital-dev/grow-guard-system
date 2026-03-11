import { useState, useMemo, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { KpiCard } from "@/components/KpiCard";
import {
  FileSignature, DollarSign, Inbox, Download, Plus, Users, CalendarDays,
  CheckCircle, AlertTriangle, Clock, Eye, Link2, Search, Filter, Pencil, Trash2,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useContracts, useNetworkContracts, useContractMutations } from "@/hooks/useContracts";
import { useCrmProposals } from "@/hooks/useCrmProposals";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { differenceInDays } from "date-fns";
import {
  SERVICE_CONTENT, SERVICE_PLACEHOLDERS,
  FRANCHISE_CONTENT, FRANCHISE_PLACEHOLDERS,
} from "@/constants/contractTemplates";
import { downloadContractPdf, getPreviewHtml } from "@/lib/contractPdfTemplate";

// ─── Constants ───

const CONTRACT_TYPE_OPTIONS = [
  { value: "assessoria", label: "Prestação de Serviço" },
  { value: "franquia", label: "Franquia Empresarial" },
];

const DURATION_OPTIONS = [
  { value: "1", label: "1 mês" },
  { value: "3", label: "3 meses" },
  { value: "6", label: "6 meses" },
  { value: "12", label: "12 meses" },
  { value: "24", label: "24 meses" },
  { value: "36", label: "36 meses" },
];

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  draft: { label: "Rascunho", variant: "secondary" },
  active: { label: "Ativo", variant: "default" },
  signed: { label: "Assinado", variant: "outline" },
  cancelled: { label: "Cancelado", variant: "destructive" },
};

// ─── Helpers ───

function buildContent(form: Record<string, string>, type: string) {
  const content = type === "franquia" ? FRANCHISE_CONTENT : SERVICE_CONTENT;
  const placeholders = type === "franquia" ? FRANCHISE_PLACEHOLDERS : SERVICE_PLACEHOLDERS;
  let result = content;
  for (const p of placeholders) {
    const key = p.key.replace(/\{\{|\}\}/g, "");
    result = result.split(p.key).join(form[key] || p.key);
  }
  return result;
}

// ─── Service Contract Form ───

function ServiceContractForm({ onSuccess, initialProposalId }: { onSuccess: () => void; initialProposalId?: string }) {
  const { createContract } = useContractMutations();
  const { data: proposals } = useCrmProposals();
  const [showPreview, setShowPreview] = useState(false);
  const [selectedProposalId, setSelectedProposalId] = useState(initialProposalId || "");

  const acceptedProposals = (proposals ?? []).filter(p => p.status === "accepted" || p.status === "draft" || p.status === "sent");
  const selectedProposal = acceptedProposals.find(p => p.id === selectedProposalId);

  // Derive services, values, and duration from the proposal
  const proposalItems = selectedProposal ? (Array.isArray(selectedProposal.items) ? selectedProposal.items : []) : [];
  const proposalContent = selectedProposal?.content || {};
  const proposalServicos = proposalItems.map((it: any) => `${it.name}: ${it.quantity || 1} unidade(s)`).join(";\n") || "";
  const proposalPrazo = proposalContent.duration ? String(proposalContent.duration) : "";
  const proposalValorTotal = selectedProposal?.value ? Number(selectedProposal.value) : 0;
  const proposalPayment = proposalContent.payment_option || selectedProposal?.payment_terms || "";

  // Compute monthly value from proposal
  const proposalMonthly = proposalPrazo && Number(proposalPrazo) > 0 ? proposalValorTotal / Number(proposalPrazo) : proposalValorTotal;

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

  // Auto-fill from proposal
  useEffect(() => {
    if (selectedProposal) {
      setForm(prev => ({
        ...prev,
        servicos_descricao: proposalServicos || prev.servicos_descricao,
        prazo_meses: proposalPrazo || prev.prazo_meses,
        valor_mensal: proposalMonthly ? proposalMonthly.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : prev.valor_mensal,
        valor_setup: proposalContent.setup_value ? Number(proposalContent.setup_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : prev.valor_setup,
        dia_vencimento: proposalContent.payment_day ? String(proposalContent.payment_day) : prev.dia_vencimento,
      }));
    }
  }, [selectedProposalId]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (key: string, val: string) => setForm(prev => ({ ...prev, [key]: val }));
  const previewContent = useMemo(() => buildContent(form, "assessoria"), [form]);
  const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const handleSave = (status: string) => {
    if (!selectedProposalId) return toast.error("Selecione uma proposta para gerar o contrato de prestação de serviço");
    if (!form.contratante_razao_social) return toast.error("Informe a Razão Social do contratante");
    if (!form.contratante_cnpj) return toast.error("Informe o CNPJ do contratante");

    const content = buildContent(form, "assessoria");
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
        owner_type: "matriz",
        lead_id: selectedProposal?.lead_id || undefined,
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
      {/* Proposta Vinculada (obrigatória) */}
      <Card className="glass-card border-primary/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Link2 className="w-4 h-4" /> Proposta Vinculada *
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Selecione a Proposta *</Label>
            <Select value={selectedProposalId} onValueChange={setSelectedProposalId}>
              <SelectTrigger><SelectValue placeholder="Selecione uma proposta" /></SelectTrigger>
              <SelectContent>
                {acceptedProposals.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title} — {formatBRL(Number(p.value || 0))} ({p.status === "accepted" ? "Aceita" : p.status === "sent" ? "Enviada" : "Rascunho"})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedProposal && (
            <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dados da Proposta</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Valor Total</p>
                  <p className="font-bold text-foreground">{formatBRL(proposalValorTotal)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Duração</p>
                  <p className="font-medium text-foreground">{proposalPrazo ? `${proposalPrazo} meses` : "Não definido"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pagamento</p>
                  <p className="font-medium text-foreground">{proposalPayment || "A definir"}</p>
                </div>
              </div>
              {proposalItems.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Serviços</p>
                  <ul className="text-xs space-y-0.5 text-foreground">
                    {proposalItems.map((it: any, i: number) => (
                      <li key={i}>• {it.name} — {it.quantity || 1}x — {formatBRL(Number(it.total || 0))}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {!selectedProposalId && (
            <p className="text-xs text-destructive">É necessário vincular uma proposta para gerar contratos de prestação de serviço. Crie uma proposta em Comercial → Propostas.</p>
          )}
        </CardContent>
      </Card>

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

      {/* Data da Assinatura - sempre visível */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <CalendarDays className="w-4 h-4" /> Data da Assinatura
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div><Label>Data da Assinatura</Label><Input value={form.data_assinatura} onChange={e => set("data_assinatura", e.target.value)} placeholder="27 de fevereiro de 2026" /></div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)} className="gap-2">
          <Eye className="w-4 h-4" />{showPreview ? "Ocultar Preview" : "Visualizar Contrato"}
        </Button>
      </div>

      {showPreview && (
        <Card className="glass-card overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-white" dangerouslySetInnerHTML={{ __html: getPreviewHtml(previewContent, "assessoria") }} />
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={() => handleSave("draft")} disabled={createContract.isPending || !selectedProposalId}>Salvar como Rascunho</Button>
        <Button onClick={() => handleSave("active")} disabled={createContract.isPending || !selectedProposalId}>Gerar Contrato</Button>
      </div>
    </div>
  );
}

// ─── Franchise Contract Form ───

function FranchiseContractForm({ onSuccess }: { onSuccess: () => void }) {
  const { createContract } = useContractMutations();
  const [showPreview, setShowPreview] = useState(false);

  const [form, setForm] = useState<Record<string, string>>({
    numero_contrato: "",
    franqueada_nome: "",
    franqueada_nacionalidade: "",
    franqueada_estado_civil: "",
    franqueada_cpf: "",
    franqueada_rg: "",
    franqueada_email: "",
    franqueada_endereco: "",
    franqueada_bairro: "",
    franqueada_cep: "",
    franqueada_cidade: "",
    franqueada_estado: "",
    franqueada_cnpj: "",
    franqueada_razao_social: "",
    operador_nome: "",
    taxa_adesao_valor: "",
    taxa_adesao_forma: "",
    taxa_manutencao_valor: "",
    data_assinatura: "",
  });

  const set = (key: string, val: string) => setForm(prev => ({ ...prev, [key]: val }));
  const previewContent = useMemo(() => buildContent(form, "franquia"), [form]);

  const handleSave = (status: string) => {
    if (!form.franqueada_nome && !form.franqueada_razao_social) return toast.error("Informe o nome ou razão social da franqueada");
    if (!form.franqueada_cpf && !form.franqueada_cnpj) return toast.error("Informe o CPF ou CNPJ da franqueada");

    const content = buildContent(form, "franquia");
    const monthlyValue = parseFloat(form.taxa_manutencao_valor.replace(/\./g, "").replace(",", ".")) || 0;
    const adesaoValue = parseFloat(form.taxa_adesao_valor.replace(/\./g, "").replace(",", ".")) || 0;

    createContract.mutate(
      {
        title: `Contrato Franquia - ${form.franqueada_razao_social || form.franqueada_nome}`,
        content,
        signer_name: form.franqueada_razao_social || form.franqueada_nome,
        client_document: form.franqueada_cnpj || form.franqueada_cpf,
        client_address: `${form.franqueada_endereco}, ${form.franqueada_bairro}, ${form.franqueada_cidade}/${form.franqueada_estado} - CEP ${form.franqueada_cep}`,
        monthly_value: monthlyValue,
        total_value: adesaoValue,
        duration_months: 36,
        status,
        contract_type: "franquia",
        owner_type: "matriz",
      },
      {
        onSuccess: () => {
          toast.success(status === "draft" ? "Rascunho salvo!" : "Contrato de franquia gerado!");
          onSuccess();
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Dados Pessoais / PF */}
      <Card className="glass-card border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Users className="w-4 h-4" /> Dados da Franqueada (Pessoa Física)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><Label>Nome Completo *</Label><Input value={form.franqueada_nome} onChange={e => set("franqueada_nome", e.target.value)} placeholder="Maria Silva" /></div>
            <div><Label>CPF *</Label><Input value={form.franqueada_cpf} onChange={e => set("franqueada_cpf", e.target.value)} placeholder="000.000.000-00" /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div><Label>RG</Label><Input value={form.franqueada_rg} onChange={e => set("franqueada_rg", e.target.value)} placeholder="00.000.000-0" /></div>
            <div><Label>Nacionalidade</Label><Input value={form.franqueada_nacionalidade} onChange={e => set("franqueada_nacionalidade", e.target.value)} placeholder="brasileira" /></div>
            <div><Label>Estado Civil</Label><Input value={form.franqueada_estado_civil} onChange={e => set("franqueada_estado_civil", e.target.value)} placeholder="solteira" /></div>
          </div>
          <div><Label>E-mail</Label><Input value={form.franqueada_email} onChange={e => set("franqueada_email", e.target.value)} placeholder="email@exemplo.com" /></div>
          <div><Label>Endereço</Label><Input value={form.franqueada_endereco} onChange={e => set("franqueada_endereco", e.target.value)} placeholder="Rua Exemplo, nº 100" /></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div><Label>Bairro</Label><Input value={form.franqueada_bairro} onChange={e => set("franqueada_bairro", e.target.value)} /></div>
            <div><Label>CEP</Label><Input value={form.franqueada_cep} onChange={e => set("franqueada_cep", e.target.value)} placeholder="00000-000" /></div>
            <div><Label>Cidade</Label><Input value={form.franqueada_cidade} onChange={e => set("franqueada_cidade", e.target.value)} /></div>
            <div><Label>Estado</Label><Input value={form.franqueada_estado} onChange={e => set("franqueada_estado", e.target.value)} /></div>
          </div>
        </CardContent>
      </Card>

      {/* PJ (opcional) */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <FileSignature className="w-4 h-4" /> Dados PJ (se aplicável)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><Label>Razão Social</Label><Input value={form.franqueada_razao_social} onChange={e => set("franqueada_razao_social", e.target.value)} placeholder="Empresa Exemplo LTDA" /></div>
            <div><Label>CNPJ</Label><Input value={form.franqueada_cnpj} onChange={e => set("franqueada_cnpj", e.target.value)} placeholder="00.000.000/0001-00" /></div>
          </div>
          <div><Label>Sócio Operador</Label><Input value={form.operador_nome} onChange={e => set("operador_nome", e.target.value)} placeholder="Nome do sócio operador" /></div>
        </CardContent>
      </Card>

      {/* Taxas e Contrato */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <DollarSign className="w-4 h-4" /> Taxas e Pagamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><Label>Nº do Contrato</Label><Input value={form.numero_contrato} onChange={e => set("numero_contrato", e.target.value)} placeholder="001" /></div>
            <div><Label>Data da Assinatura</Label><Input value={form.data_assinatura} onChange={e => set("data_assinatura", e.target.value)} placeholder="27 de fevereiro de 2026" /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><Label>Valor Taxa de Adesão (R$)</Label><Input value={form.taxa_adesao_valor} onChange={e => set("taxa_adesao_valor", e.target.value)} placeholder="15.000,00" /></div>
            <div><Label>Forma de Pagamento Adesão</Label><Input value={form.taxa_adesao_forma} onChange={e => set("taxa_adesao_forma", e.target.value)} placeholder="parcelado em 12 vezes no boleto" /></div>
          </div>
          <div>
            <Label>Taxa Mensal de Manutenção (R$)</Label>
            <Input value={form.taxa_manutencao_valor} onChange={e => set("taxa_manutencao_valor", e.target.value)} placeholder="500,00" />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)} className="gap-2">
          <Eye className="w-4 h-4" />{showPreview ? "Ocultar Preview" : "Visualizar Contrato"}
        </Button>
      </div>

      {showPreview && (
        <Card className="glass-card">
          <CardContent className="p-6">
            <pre className="whitespace-pre-wrap text-xs leading-relaxed font-serif text-foreground/80">{previewContent}</pre>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={() => handleSave("draft")} disabled={createContract.isPending}>Salvar como Rascunho</Button>
        <Button onClick={() => handleSave("active")} disabled={createContract.isPending}>Gerar Contrato</Button>
      </div>
    </div>
  );
}

// ─── Main Page ───

export default function ContratosGerador() {
  const { data: contracts, isLoading } = useContracts();
  const { data: networkContracts, isLoading: isLoadingNetwork } = useNetworkContracts();
  const { updateContract, deleteContract } = useContractMutations();
  const [searchParams] = useSearchParams();
  const proposalIdFromUrl = searchParams.get("proposal_id");
  const tabFromUrl = searchParams.get("tab");
  const [tab, setTab] = useState(tabFromUrl === "novo" ? "gerar" : "gestao");
  const [contractType, setContractType] = useState("assessoria");

  // Gestão tab state
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterOwner, setFilterOwner] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [detailContract, setDetailContract] = useState<any>(null);
  const [editDialog, setEditDialog] = useState(false);
  const [editingContract, setEditingContract] = useState<any>(null);
  const [editForm, setEditForm] = useState({ status: "active", monthly_value: 0, signer_name: "", signer_email: "", start_date: "", end_date: "" });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const gestaoStatusLabels: Record<string, string> = { draft: "Rascunho", active: "Ativo", signed: "Assinado", expired: "Vencido", cancelled: "Cancelado" };
  const gestaoStatusColors: Record<string, string> = { draft: "bg-muted text-muted-foreground", active: "bg-emerald-500/15 text-emerald-500", signed: "bg-blue-500/15 text-blue-500", expired: "bg-red-500/15 text-red-500", cancelled: "bg-red-500/15 text-red-500" };
  const typeLabels: Record<string, string> = { assessoria: "Assessoria", saas: "SaaS", sistema: "Sistema", franquia: "Franquia" };
  const ownerLabels: Record<string, string> = { unidade: "Unidade", matriz: "Matriz", cliente_saas: "Cliente SaaS" };

  function daysUntilExpiry(endDate: string | null): number | null {
    if (!endDate) return null;
    const diff = new Date(endDate).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  const allContracts = networkContracts ?? [];
  const filtered = useMemo(() => {
    return allContracts.filter((c: any) => {
      if (search && !c.title?.toLowerCase().includes(search.toLowerCase()) && !c.signer_name?.toLowerCase().includes(search.toLowerCase()) && !c.org_name?.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterType !== "all" && c.contract_type !== filterType) return false;
      if (filterOwner !== "all" && c.owner_type !== filterOwner) return false;
      if (filterStatus !== "all" && c.status !== filterStatus) return false;
      return true;
    });
  }, [allContracts, search, filterType, filterOwner, filterStatus]);

  const totalMRR = filtered.filter((c: any) => c.status === "active" || c.status === "signed").reduce((s: number, c: any) => s + Number(c.monthly_value || 0), 0);
  const totalContracts = filtered.length;
  const activeCount = filtered.filter((c: any) => c.status === "active" || c.status === "signed").length;
  const expiringCount = filtered.filter((c: any) => { const d = daysUntilExpiry(c.end_date); return d !== null && d > 0 && d <= 30; }).length;
  const formatBRLFn = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const openEdit = (c: any) => {
    setEditingContract(c);
    setEditForm({ status: c.status, monthly_value: Number(c.monthly_value || 0), signer_name: c.signer_name || "", signer_email: c.signer_email || "", start_date: c.start_date || "", end_date: c.end_date || "" });
    setEditDialog(true);
  };

  const saveEdit = () => {
    if (!editingContract) return;
    updateContract.mutate({ id: editingContract.id, ...editForm });
    setEditDialog(false);
    toast.success("Contrato atualizado");
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    deleteContract.mutate(deleteId);
    setDeleteId(null);
    toast.success("Contrato excluído");
  };

  if (isLoading || isLoadingNetwork) {
    return <div className="w-full space-y-6"><Skeleton className="h-10 w-64" /><div className="grid grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div></div>;
  }

  return (
    <div className="w-full space-y-6">
      <PageHeader title="Contratos" subtitle="Gere e gerencie contratos da matriz — franquia ou prestação de serviço" />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard label="Total" value={String(totalContracts)} icon={FileSignature} delay={0} />
        <KpiCard label="Ativos" value={String(activeCount)} icon={FileSignature} delay={1} variant="accent" />
        <KpiCard label="MRR Rede" value={formatBRLFn(totalMRR)} icon={DollarSign} delay={2} />
        <KpiCard label="A Vencer (30d)" value={String(expiringCount)} icon={AlertTriangle} delay={3} />
        <KpiCard label="Valor Total" value={formatBRLFn(filtered.reduce((s: number, c: any) => s + Number(c.total_value || 0), 0))} icon={DollarSign} delay={4} />
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="gerar"><Plus className="w-4 h-4 mr-1" />Gerar Contrato</TabsTrigger>
          <TabsTrigger value="gestao">Gestão de Contratos</TabsTrigger>
        </TabsList>

        <TabsContent value="gerar" className="space-y-4">
          <div className="flex gap-3 items-center">
            <Label className="text-sm font-medium">Tipo de Contrato:</Label>
            {CONTRACT_TYPE_OPTIONS.map(opt => (
              <Button key={opt.value} size="sm" variant={contractType === opt.value ? "default" : "outline"} onClick={() => setContractType(opt.value)}>
                {opt.label}
              </Button>
            ))}
          </div>

          {contractType === "assessoria" ? (
            <ServiceContractForm onSuccess={() => setTab("gestao")} initialProposalId={proposalIdFromUrl || undefined} />
          ) : (
            <FranchiseContractForm onSuccess={() => setTab("gestao")} />
          )}
        </TabsContent>

        <TabsContent value="gestao" className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar por título, cliente ou unidade..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[140px]"><Filter className="w-3.5 h-3.5 mr-1" /><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Tipos</SelectItem>
                {Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterOwner} onValueChange={setFilterOwner}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Proprietário" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Donos</SelectItem>
                {Object.entries(ownerLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                {Object.entries(gestaoStatusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Inbox className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-1">Nenhum contrato encontrado</h3>
              <p className="text-sm text-muted-foreground">Ajuste os filtros ou crie novos contratos.</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left py-3 px-4 font-medium">Cliente</th>
                    <th className="text-left py-3 px-4 font-medium">Contrato</th>
                    <th className="text-left py-3 px-4 font-medium">Unidade</th>
                    <th className="text-center py-3 px-4 font-medium">Tipo</th>
                    <th className="text-right py-3 px-4 font-medium">Mensal</th>
                    <th className="text-center py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Vencimento</th>
                    <th className="text-center py-3 px-4 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c: any) => {
                    const days = daysUntilExpiry(c.end_date);
                    const isExpiring = days !== null && days > 0 && days <= 30;
                    const isExpired = days !== null && days <= 0;
                    return (
                      <tr key={c.id} className="border-b hover:bg-muted/30">
                        <td className="py-3 px-4 font-medium">{c.signer_name || "—"}</td>
                        <td className="py-3 px-4 text-muted-foreground">{c.title}</td>
                        <td className="py-3 px-4 text-muted-foreground">{c.org_name || "—"}</td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant="outline" className="text-[10px] capitalize">{typeLabels[c.contract_type] || c.contract_type || "—"}</Badge>
                        </td>
                        <td className="py-3 px-4 text-right">{c.monthly_value ? formatBRLFn(Number(c.monthly_value)) : "—"}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`text-xs px-2 py-0.5 rounded ${gestaoStatusColors[c.status] || "bg-muted"}`}>{gestaoStatusLabels[c.status] || c.status}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="text-muted-foreground">{c.end_date ? new Date(c.end_date).toLocaleDateString("pt-BR") : "—"}</span>
                            {isExpiring && <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />}
                            {isExpired && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDetailContract(c)}><Eye className="w-3.5 h-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}><Pencil className="w-3.5 h-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(c.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => downloadContractPdf(c)} title="Baixar PDF"><Download className="w-3.5 h-3.5" /></Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Detail Sheet */}
      <Sheet open={!!detailContract} onOpenChange={() => setDetailContract(null)}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader><SheetTitle>Detalhes do Contrato</SheetTitle></SheetHeader>
          {detailContract && (
            <div className="space-y-4 mt-4">
              {[
                ["Título", detailContract.title],
                ["Cliente (Signatário)", detailContract.signer_name],
                ["E-mail", detailContract.signer_email],
                ["CPF/CNPJ", detailContract.client_document],
                ["Telefone", detailContract.client_phone],
                ["Endereço", detailContract.client_address],
                ["Unidade", detailContract.org_name],
                ["Tipo", typeLabels[detailContract.contract_type] || detailContract.contract_type],
                ["Dono", ownerLabels[detailContract.owner_type] || detailContract.owner_type],
                ["Status", gestaoStatusLabels[detailContract.status] || detailContract.status],
                ["Valor Mensal", detailContract.monthly_value ? formatBRLFn(Number(detailContract.monthly_value)) : "—"],
                ["Valor Total", detailContract.total_value ? formatBRLFn(Number(detailContract.total_value)) : "—"],
                ["Duração", detailContract.duration_months ? `${detailContract.duration_months} meses` : "—"],
                ["Início", detailContract.start_date ? new Date(detailContract.start_date).toLocaleDateString("pt-BR") : "—"],
                ["Vencimento", detailContract.end_date ? new Date(detailContract.end_date).toLocaleDateString("pt-BR") : "—"],
                ["Dia Pagamento", detailContract.payment_day || "—"],
                ["Descrição do Serviço", detailContract.service_description],
                ["Criado em", new Date(detailContract.created_at).toLocaleDateString("pt-BR")],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-medium">{value || "—"}</p>
                </div>
              ))}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Editar Contrato</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Cliente (Signatário)</Label><Input value={editForm.signer_name} onChange={e => setEditForm(f => ({ ...f, signer_name: e.target.value }))} /></div>
            <div><Label>E-mail</Label><Input value={editForm.signer_email} onChange={e => setEditForm(f => ({ ...f, signer_email: e.target.value }))} /></div>
            <div><Label>Valor Mensal (R$)</Label><Input type="number" value={editForm.monthly_value} onChange={e => setEditForm(f => ({ ...f, monthly_value: Number(e.target.value) }))} /></div>
            <div><Label>Status</Label>
              <Select value={editForm.status} onValueChange={v => setEditForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(gestaoStatusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Início</Label><Input type="date" value={editForm.start_date} onChange={e => setEditForm(f => ({ ...f, start_date: e.target.value }))} /></div>
              <div><Label>Vencimento</Label><Input type="date" value={editForm.end_date} onChange={e => setEditForm(f => ({ ...f, end_date: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>Cancelar</Button>
            <Button onClick={saveEdit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir contrato</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita. Deseja excluir este contrato?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
