import { useState, useMemo } from "react";
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
  CheckCircle, AlertTriangle, Clock, Eye, Link2,
} from "lucide-react";
import { useContracts, useContractMutations } from "@/hooks/useContracts";
import { toast } from "sonner";
import { differenceInDays } from "date-fns";
import {
  SERVICE_CONTENT, SERVICE_PLACEHOLDERS,
  FRANCHISE_CONTENT, FRANCHISE_PLACEHOLDERS,
} from "@/constants/contractTemplates";
import logoNoExcuse from "@/assets/logo-noexcuse.png";

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

async function getLogoBase64(): Promise<string> {
  try {
    const resp = await fetch(logoNoExcuse);
    const blob = await resp.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return "";
  }
}

function formatContractHtml(content: string, logoBase64: string, title: string): string {
  const paragraphs = content.split("\n").map(line => {
    const trimmed = line.trim();
    if (!trimmed) return "";
    if (/^CLÁUSULA\s/i.test(trimmed) || /^CONTRATO\s/i.test(trimmed) || /^[IVXL]+\s*[-–—]\s/i.test(trimmed)) {
      return `<h2 style="font-size:13px;font-weight:bold;text-transform:uppercase;margin:28px 0 10px;letter-spacing:0.5px;color:#1a1a1a;">${trimmed}</h2>`;
    }
    if (trimmed.startsWith("____")) {
      return `<p style="font-size:12px;margin:4px 0;color:#333;">${trimmed}</p>`;
    }
    if (/^[a-z]\)/.test(trimmed) || /^\d+\./.test(trimmed)) {
      return `<p style="font-size:11.5px;margin:4px 0 4px 16px;text-align:justify;line-height:1.7;color:#222;">${trimmed}</p>`;
    }
    return `<p style="font-size:11.5px;margin:6px 0;text-align:justify;line-height:1.7;color:#222;">${trimmed}</p>`;
  }).join("\n");

  return `
    <div style="font-family:Georgia,'Times New Roman',serif;max-width:700px;margin:0 auto;padding:50px 40px;color:#1a1a1a;">
      <div style="text-align:center;margin-bottom:30px;">
        ${logoBase64 ? `<img src="${logoBase64}" style="height:60px;margin-bottom:16px;" />` : ""}
        <h1 style="font-size:16px;font-weight:bold;text-transform:uppercase;letter-spacing:3px;margin:0;color:#111;">${title}</h1>
        <div style="width:60px;height:2px;background:#333;margin:10px auto 0;"></div>
      </div>
      ${paragraphs}
      <p style="text-align:center;font-size:9px;color:#aaa;margin-top:40px;border-top:1px solid #eee;padding-top:10px;">
        Documento gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")} — NOEXCUSE Marketing Digital
      </p>
    </div>
  `;
}

async function downloadContractPdf(contract: any) {
  const { default: html2pdf } = await import("html2pdf.js");
  const logoBase64 = await getLogoBase64();
  const content = contract.content || "Conteúdo do contrato não disponível.";
  const pdfTitle = contract.contract_type === "franquia"
    ? "CONTRATO DE FRANQUIA EMPRESARIAL"
    : "CONTRATO DE PRESTAÇÃO DE SERVIÇO";
  const html = formatContractHtml(content, logoBase64, pdfTitle);

  const el = document.createElement("div");
  el.innerHTML = html;

  html2pdf()
    .set({
      margin: [15, 15, 15, 15],
      filename: `${contract.title || "Contrato"}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    })
    .from(el)
    .save();
}

// ─── Service Contract Form ───

function ServiceContractForm({ onSuccess }: { onSuccess: () => void }) {
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
  const previewContent = useMemo(() => buildContent(form, "assessoria"), [form]);

  const handleSave = (status: string) => {
    if (!form.contratante_razao_social) return toast.error("Informe a Razão Social do contratante");
    if (!form.contratante_cnpj) return toast.error("Informe o CNPJ do contratante");
    if (!form.prazo_meses) return toast.error("Selecione o prazo do contrato");

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

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <FileSignature className="w-4 h-4" /> Serviços e Prazo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Serviços Contratados *</Label>
            <Textarea value={form.servicos_descricao} onChange={e => set("servicos_descricao", e.target.value)}
              placeholder={"Artes: 04 unidades;\nVídeos: 04 unidades;\nProgramação: Meta;\nGestão de Tráfego Pago: Meta e Google;"} rows={4} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Prazo do Contrato *</Label>
              <Select value={form.prazo_meses} onValueChange={v => set("prazo_meses", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{DURATION_OPTIONS.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Data da Assinatura</Label><Input value={form.data_assinatura} onChange={e => set("data_assinatura", e.target.value)} placeholder="27 de fevereiro de 2026" /></div>
          </div>
        </CardContent>
      </Card>

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
              <Label>Dia de Vencimento</Label>
              <Select value={form.dia_vencimento} onValueChange={v => set("dia_vencimento", v)}>
                <SelectTrigger><SelectValue placeholder="Dia" /></SelectTrigger>
                <SelectContent>{Array.from({ length: 31 }, (_, i) => i + 1).map(d => <SelectItem key={d} value={String(d)}>Dia {d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
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

    createContract.mutate(
      {
        title: `Contrato Franquia - ${form.franqueada_razao_social || form.franqueada_nome}`,
        content,
        signer_name: form.franqueada_razao_social || form.franqueada_nome,
        client_document: form.franqueada_cnpj || form.franqueada_cpf,
        client_address: `${form.franqueada_endereco}, ${form.franqueada_bairro}, ${form.franqueada_cidade}/${form.franqueada_estado} - CEP ${form.franqueada_cep}`,
        monthly_value: monthlyValue,
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

      {/* Valores e Contrato */}
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
  const [tab, setTab] = useState("lista");
  const [contractType, setContractType] = useState("assessoria");
  const [statusFilter, setStatusFilter] = useState("all");

  if (isLoading) {
    return <div className="w-full space-y-6"><Skeleton className="h-10 w-64" /><div className="grid grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div></div>;
  }

  const matrizContracts = (contracts ?? []).filter(c => (c as any).owner_type === "matriz" || !(c as any).owner_type);
  const filtered = statusFilter === "all" ? matrizContracts : matrizContracts.filter(c => c.status === statusFilter);
  const ativos = matrizContracts.filter(c => c.status === "active").length;
  const totalMensal = matrizContracts.filter(c => c.status === "active").reduce((s, c) => s + Number((c as any).monthly_value || 0), 0);

  return (
    <div className="w-full space-y-6">
      <PageHeader title="Criar Contrato" subtitle="Crie contratos da matriz — franquia ou prestação de serviço" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Contratos Ativos" value={String(ativos)} icon={FileSignature} delay={0} variant="accent" />
        <KpiCard label="Total Contratos" value={String(matrizContracts.length)} icon={FileSignature} delay={1} />
        <KpiCard label="Receita Mensal" value={`R$ ${totalMensal.toLocaleString("pt-BR")}`} icon={DollarSign} delay={2} />
        <KpiCard label="Franquias" value={String(matrizContracts.filter(c => (c as any).contract_type === "franquia").length)} icon={Users} delay={3} />
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
                    <TableHead>Tipo</TableHead>
                    <TableHead>Cliente / Franqueada</TableHead>
                    <TableHead>Valor Mensal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assinatura</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(c => {
                    const st = statusLabels[c.status] || { label: c.status, variant: "secondary" as const };
                    const isSigned = !!(c as any).signed_at;
                    const endDateContract = (c as any).end_date ? new Date((c as any).end_date) : null;
                    const daysToEnd = endDateContract ? differenceInDays(endDateContract, new Date()) : null;
                    const tipo = (c as any).contract_type === "franquia" ? "Franquia" : "Assessoria";

                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.title}</TableCell>
                        <TableCell><Badge variant="outline">{tipo}</Badge></TableCell>
                        <TableCell>{c.signer_name || "—"}</TableCell>
                        <TableCell className="font-semibold">R$ {Number((c as any).monthly_value || 0).toLocaleString("pt-BR")}</TableCell>
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

        <TabsContent value="novo" className="space-y-4">
          <div className="flex gap-3 items-center">
            <Label className="text-sm font-medium">Tipo de Contrato:</Label>
            {CONTRACT_TYPE_OPTIONS.map(opt => (
              <Button key={opt.value} size="sm" variant={contractType === opt.value ? "default" : "outline"} onClick={() => setContractType(opt.value)}>
                {opt.label}
              </Button>
            ))}
          </div>

          {contractType === "assessoria" ? (
            <ServiceContractForm onSuccess={() => setTab("lista")} />
          ) : (
            <FranchiseContractForm onSuccess={() => setTab("lista")} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
