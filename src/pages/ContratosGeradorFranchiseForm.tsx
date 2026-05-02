// @ts-nocheck
import { useState, useMemo } from "react";
import { sanitizeHtml } from "@/lib/sanitize";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileSignature, DollarSign, Users, Eye } from "lucide-react";
import { useContractMutations } from "@/hooks/useContracts";
import { toast } from "sonner";
import { reportError } from "@/lib/error-toast";
import { FRANCHISE_CONTENT, FRANCHISE_PLACEHOLDERS } from "@/constants/contractTemplates";
import { getPreviewHtml } from "@/lib/contractPdfTemplate";

function buildFranchiseContent(form: Record<string, string>) {
  let result = FRANCHISE_CONTENT;
  for (const p of FRANCHISE_PLACEHOLDERS) {
    const key = p.key.replace(/\{\{|\}\}/g, "");
    result = result.split(p.key).join(form[key] || p.key);
  }
  return result;
}

interface FranchiseContractFormProps {
  onSuccess: () => void;
}

export function FranchiseContractForm({ onSuccess }: FranchiseContractFormProps) {
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
  const previewContent = useMemo(() => buildFranchiseContent(form), [form]);

  const handleSave = (status: string) => {
    if (!form.franqueada_nome && !form.franqueada_razao_social) return reportError(new Error("Informe o nome ou razão social da franqueada"), { title: "Informe o nome ou razão social da franqueada", category: "contratos.validation" });
    if (!form.franqueada_cpf && !form.franqueada_cnpj) return reportError(new Error("Informe o CPF ou CNPJ da franqueada"), { title: "Informe o CPF ou CNPJ da franqueada", category: "contratos.validation" });

    const content = buildFranchiseContent(form);
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
        <Card className="glass-card overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-white" dangerouslySetInnerHTML={{ __html: sanitizeHtml(getPreviewHtml(previewContent, "franquia")) }} />
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
