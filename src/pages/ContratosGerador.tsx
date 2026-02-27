import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useContractTemplates, useContractMutations } from "@/hooks/useContracts";
import { useUnits } from "@/hooks/useUnits";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const CONTRACT_TYPES = [
  { value: "assessoria", label: "Assessoria" },
  { value: "saas", label: "SaaS" },
  { value: "sistema", label: "Sistema" },
  { value: "franquia", label: "Franquia" },
];

const OWNER_TYPES = [
  { value: "matriz", label: "Matriz" },
  { value: "unidade", label: "Unidade (Franqueado)" },
  { value: "cliente_saas", label: "Cliente SaaS" },
];

export default function ContratosGerador() {
  const { toast } = useToast();
  const { data: templates, isLoading } = useContractTemplates();
  const { data: units } = useUnits();
  const { createContract } = useContractMutations();
  const [dialogOpen, setDialogOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [contractType, setContractType] = useState("franquia");
  const [ownerType, setOwnerType] = useState("matriz");
  const [unitOrgId, setUnitOrgId] = useState("");
  const [signerName, setSignerName] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [clientDocument, setClientDocument] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [monthlyValue, setMonthlyValue] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  const [durationMonths, setDurationMonths] = useState(12);
  const [paymentDay, setPaymentDay] = useState(10);
  const [templateId, setTemplateId] = useState("");

  const resetForm = () => {
    setTitle(""); setContractType("franquia"); setOwnerType("matriz"); setUnitOrgId("");
    setSignerName(""); setSignerEmail(""); setClientDocument(""); setClientPhone("");
    setClientAddress(""); setServiceDescription(""); setMonthlyValue(0); setTotalValue(0);
    setDurationMonths(12); setPaymentDay(10); setTemplateId("");
  };

  const handleCreate = () => {
    if (!title.trim()) { toast({ title: "Informe o título", variant: "destructive" }); return; }
    createContract.mutate({
      title,
      contract_type: contractType,
      owner_type: ownerType,
      unit_org_id: ownerType === "unidade" && unitOrgId ? unitOrgId : undefined,
      signer_name: signerName || undefined,
      signer_email: signerEmail || undefined,
      client_document: clientDocument || undefined,
      client_phone: clientPhone || undefined,
      client_address: clientAddress || undefined,
      service_description: serviceDescription || undefined,
      monthly_value: monthlyValue || undefined,
      total_value: totalValue || undefined,
      duration_months: durationMonths || undefined,
      payment_day: paymentDay || undefined,
      template_id: templateId || undefined,
      status: "draft",
    });
    setDialogOpen(false);
    resetForm();
    toast({ title: "Contrato criado com sucesso" });
  };

  if (isLoading) return <div className="space-y-6"><Skeleton className="h-12 w-full" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header-title">Criar Contrato</h1>
          <p className="text-sm text-muted-foreground mt-1">Crie contratos da matriz (franquia, próprios)</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4 mr-1" /> Novo Contrato</Button>
      </div>

      <div className="glass-card p-8 text-center">
        <h3 className="text-lg font-semibold mb-2">Criar novo contrato</h3>
        <p className="text-sm text-muted-foreground mb-4">Preencha os dados para gerar um contrato da matriz.</p>
        <Button onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4 mr-1" /> Novo Contrato</Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Novo Contrato</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Título *</Label><Input value={title} onChange={e => setTitle(e.target.value)} /></div>
            
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Tipo de Contrato</Label>
                <Select value={contractType} onValueChange={setContractType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CONTRACT_TYPES.map(ct => <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Proprietário</Label>
                <Select value={ownerType} onValueChange={setOwnerType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{OWNER_TYPES.map(ot => <SelectItem key={ot.value} value={ot.value}>{ot.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            {ownerType === "unidade" && (units ?? []).length > 0 && (
              <div><Label>Unidade</Label>
                <Select value={unitOrgId} onValueChange={setUnitOrgId}>
                  <SelectTrigger><SelectValue placeholder="Selecionar unidade" /></SelectTrigger>
                  <SelectContent>{units!.map(u => <SelectItem key={u.id} value={(u as any).unit_org_id || u.id}>{u.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}

            {(templates ?? []).length > 0 && (
              <div><Label>Template base</Label>
                <Select value={templateId} onValueChange={setTemplateId}>
                  <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                  <SelectContent>{templates!.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div><Label>Nome do Signatário</Label><Input value={signerName} onChange={e => setSignerName(e.target.value)} /></div>
              <div><Label>Email do Signatário</Label><Input value={signerEmail} onChange={e => setSignerEmail(e.target.value)} /></div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div><Label>CPF/CNPJ</Label><Input value={clientDocument} onChange={e => setClientDocument(e.target.value)} /></div>
              <div><Label>Telefone</Label><Input value={clientPhone} onChange={e => setClientPhone(e.target.value)} /></div>
              <div><Label>Dia Vencimento</Label><Input type="number" value={paymentDay} onChange={e => setPaymentDay(Number(e.target.value))} min={1} max={31} /></div>
            </div>

            <div><Label>Endereço</Label><Input value={clientAddress} onChange={e => setClientAddress(e.target.value)} /></div>
            <div><Label>Descrição dos Serviços</Label><Textarea rows={3} value={serviceDescription} onChange={e => setServiceDescription(e.target.value)} /></div>

            <div className="grid grid-cols-3 gap-4">
              <div><Label>Valor Mensal (R$)</Label><Input type="number" value={monthlyValue} onChange={e => setMonthlyValue(Number(e.target.value))} /></div>
              <div><Label>Valor Total (R$)</Label><Input type="number" value={totalValue} onChange={e => setTotalValue(Number(e.target.value))} /></div>
              <div><Label>Duração (meses)</Label><Input type="number" value={durationMonths} onChange={e => setDurationMonths(Number(e.target.value))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate}>Criar Contrato</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
