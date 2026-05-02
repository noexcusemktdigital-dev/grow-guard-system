// @ts-nocheck
import { useState, useMemo, useEffect } from "react";
import { sanitizeHtml } from "@/lib/sanitize";
import { formatBRL } from "@/lib/formatting";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Link2, CalendarDays, Eye } from "lucide-react";
import { useContractMutations } from "@/hooks/useContracts";
import { useCrmProposals } from "@/hooks/useCrmProposals";
import { toast } from "sonner";
import { reportError } from "@/lib/error-toast";
import {
  SERVICE_CONTENT, SERVICE_PLACEHOLDERS,
} from "@/constants/contractTemplates";
import { getPreviewHtml } from "@/lib/contractPdfTemplate";

function buildServiceContent(form: Record<string, string>) {
  let result = SERVICE_CONTENT;
  for (const p of SERVICE_PLACEHOLDERS) {
    const key = p.key.replace(/\{\{|\}\}/g, "");
    result = result.split(p.key).join(form[key] || p.key);
  }
  return result;
}

interface ServiceContractFormProps {
  onSuccess: () => void;
  initialProposalId?: string;
}

export function ServiceContractForm({ onSuccess, initialProposalId }: ServiceContractFormProps) {
  const { createContract } = useContractMutations();
  const { data: proposals } = useCrmProposals();
  const [showPreview, setShowPreview] = useState(false);
  const [selectedProposalId, setSelectedProposalId] = useState(initialProposalId || "");

  const acceptedProposals = (proposals ?? []).filter(p => p.status === "accepted" || p.status === "draft" || p.status === "sent");
  const selectedProposal = acceptedProposals.find(p => p.id === selectedProposalId);

  const proposalItems = selectedProposal ? (Array.isArray(selectedProposal.items) ? selectedProposal.items : []) : [];
  const proposalContent = selectedProposal?.content || {};
  const proposalServicos = proposalItems.map((it: Record<string, unknown>) => `${it.name}: ${it.quantity || 1} unidade(s)`).join(";\n") || "";
  const proposalPrazo = proposalContent.duration ? String(proposalContent.duration) : "";
  const proposalValorTotal = selectedProposal?.value ? Number(selectedProposal.value) : 0;
  const proposalPayment = proposalContent.payment_option || selectedProposal?.payment_terms || "";
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
  const previewContent = useMemo(() => buildServiceContent(form), [form]);

  const handleSave = (status: string) => {
    if (!selectedProposalId) return reportError(new Error("Selecione uma proposta para gerar o contrato de prestação de serviço"), { title: "Selecione uma proposta para gerar o contrato de prestação de serviço", category: "contratos.validation" });
    if (!form.contratante_razao_social) return reportError(new Error("Informe a Razão Social do contratante"), { title: "Informe a Razão Social do contratante", category: "contratos.validation" });
    if (!form.contratante_cnpj) return reportError(new Error("Informe o CNPJ do contratante"), { title: "Informe o CNPJ do contratante", category: "contratos.validation" });

    const content = buildServiceContent(form);
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
                    {proposalItems.map((it: Record<string, unknown>, i: number) => (
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
            <div className="bg-white" dangerouslySetInnerHTML={{ __html: sanitizeHtml(getPreviewHtml(previewContent, "assessoria")) }} />
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
