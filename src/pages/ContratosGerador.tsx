import { useState, useMemo } from "react";
import type { Tables } from "@/integrations/supabase/types";
import { formatBRL } from "@/lib/formatting";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { KpiCard } from "@/components/KpiCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileSignature, DollarSign, Plus, AlertTriangle } from "lucide-react";
import { useContracts, useNetworkContracts, useContractMutations } from "@/hooks/useContracts";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { ServiceContractForm } from "./ContratosGeradorServiceForm";
import { FranchiseContractForm } from "./ContratosGeradorFranchiseForm";
import { ContratosGeradorGestaoTab } from "./ContratosGeradorGestaoTab";

const CONTRACT_TYPE_OPTIONS = [
  { value: "assessoria", label: "Prestação de Serviço" },
  { value: "franquia", label: "Franquia Empresarial" },
];

function daysUntilExpiry(endDate: string | null): number | null {
  if (!endDate) return null;
  const diff = new Date(endDate).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

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
  const [detailContract, setDetailContract] = useState<Tables<'contracts'> | null>(null);
  const [editDialog, setEditDialog] = useState(false);
  const [editingContract, setEditingContract] = useState<Tables<'contracts'> | null>(null);
  const [editForm, setEditForm] = useState({ status: "active", monthly_value: 0, signer_name: "", signer_email: "", start_date: "", end_date: "" });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const allContracts = networkContracts ?? [];
  const filtered = useMemo(() => {
    return allContracts.filter((c) => {
      if (search && !c.title?.toLowerCase().includes(search.toLowerCase()) && !c.signer_name?.toLowerCase().includes(search.toLowerCase()) && !c.org_name?.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterType !== "all" && c.contract_type !== filterType) return false;
      if (filterOwner !== "all" && c.owner_type !== filterOwner) return false;
      if (filterStatus !== "all" && c.status !== filterStatus) return false;
      return true;
    });
  }, [allContracts, search, filterType, filterOwner, filterStatus]);

  const totalMRR = filtered.filter((c) => c.status === "active" || c.status === "signed").reduce((s: number, c) => s + Number(c.monthly_value || 0), 0);
  const totalContracts = filtered.length;
  const activeCount = filtered.filter((c) => c.status === "active" || c.status === "signed").length;
  const expiringCount = filtered.filter((c) => { const d = daysUntilExpiry(c.end_date); return d !== null && d > 0 && d <= 30; }).length;

  type ContractItem = NonNullable<typeof networkContracts>[number];
  const openEdit = (c: ContractItem) => {
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
        <KpiCard label="MRR Rede" value={formatBRL(totalMRR)} icon={DollarSign} delay={2} />
        <KpiCard label="A Vencer (30d)" value={String(expiringCount)} icon={AlertTriangle} delay={3} />
        <KpiCard label="Valor Total" value={formatBRL(filtered.reduce((s: number, c) => s + Number(c.total_value || 0), 0))} icon={DollarSign} delay={4} />
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
          <ContratosGeradorGestaoTab
            filtered={filtered}
            search={search}
            setSearch={setSearch}
            filterType={filterType}
            setFilterType={setFilterType}
            filterOwner={filterOwner}
            setFilterOwner={setFilterOwner}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            detailContract={detailContract}
            setDetailContract={setDetailContract}
            editDialog={editDialog}
            setEditDialog={setEditDialog}
            editForm={editForm}
            setEditForm={setEditForm}
            deleteId={deleteId}
            setDeleteId={setDeleteId}
            openEdit={openEdit}
            saveEdit={saveEdit}
            confirmDelete={confirmDelete}
            isPendingUpdate={updateContract.isPending}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
