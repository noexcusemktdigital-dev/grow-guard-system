import { useState, useMemo } from "react";
import { Inbox, Search, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNetworkContracts } from "@/hooks/useContracts";
import { KpiCard } from "@/components/KpiCard";

const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-emerald-500/15 text-emerald-500",
  signed: "bg-blue-500/15 text-blue-500",
  expired: "bg-red-500/15 text-red-500",
  cancelled: "bg-red-500/15 text-red-500",
};

const statusLabels: Record<string, string> = {
  draft: "Rascunho", active: "Ativo", signed: "Assinado", expired: "Vencido", cancelled: "Cancelado",
};

const typeLabels: Record<string, string> = {
  assessoria: "Assessoria", saas: "SaaS", sistema: "Sistema", franquia: "Franquia",
};

const ownerLabels: Record<string, string> = {
  unidade: "Unidade", matriz: "Matriz", cliente_saas: "Cliente SaaS",
};

export default function ContratosGerenciamento() {
  const { data: contracts, isLoading } = useNetworkContracts();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterOwner, setFilterOwner] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const filtered = useMemo(() => {
    if (!contracts) return [];
    return contracts.filter(c => {
      if (search && !c.title?.toLowerCase().includes(search.toLowerCase()) && !c.signer_name?.toLowerCase().includes(search.toLowerCase()) && !c.org_name?.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterType !== "all" && c.contract_type !== filterType) return false;
      if (filterOwner !== "all" && c.owner_type !== filterOwner) return false;
      if (filterStatus !== "all" && c.status !== filterStatus) return false;
      return true;
    });
  }, [contracts, search, filterType, filterOwner, filterStatus]);

  const totalMRR = filtered.filter(c => c.status === "active" || c.status === "signed").reduce((s, c) => s + Number(c.monthly_value || 0), 0);
  const totalContracts = filtered.length;
  const activeCount = filtered.filter(c => c.status === "active" || c.status === "signed").length;

  if (isLoading) return <div className="space-y-6"><Skeleton className="h-12 w-full" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-header-title">Contratos da Rede</h1>
        <p className="text-sm text-muted-foreground mt-1">Visão consolidada de todos os contratos</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Contratos" value={String(totalContracts)} />
        <KpiCard label="Ativos" value={String(activeCount)} trend="up" />
        <KpiCard label="MRR Rede" value={formatBRL(totalMRR)} accent />
        <KpiCard label="Valor Total" value={formatBRL(filtered.reduce((s, c) => s + Number(c.total_value || 0), 0))} />
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por título, signatário ou unidade..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
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
            {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
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
                <th className="text-left py-3 px-4 font-medium">Título</th>
                <th className="text-left py-3 px-4 font-medium">Unidade</th>
                <th className="text-center py-3 px-4 font-medium">Tipo</th>
                <th className="text-center py-3 px-4 font-medium">Dono</th>
                <th className="text-right py-3 px-4 font-medium">Mensal</th>
                <th className="text-center py-3 px-4 font-medium">Status</th>
                <th className="text-left py-3 px-4 font-medium">Signatário</th>
                <th className="text-left py-3 px-4 font-medium">Data</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c: any) => (
                <tr key={c.id} className="border-b hover:bg-muted/30">
                  <td className="py-3 px-4 font-medium">{c.title}</td>
                  <td className="py-3 px-4 text-muted-foreground">{c.org_name || "—"}</td>
                  <td className="py-3 px-4 text-center">
                    <Badge variant="outline" className="text-[10px] capitalize">{typeLabels[c.contract_type] || c.contract_type || "—"}</Badge>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge variant="secondary" className="text-[10px]">{ownerLabels[c.owner_type] || c.owner_type || "—"}</Badge>
                  </td>
                  <td className="py-3 px-4 text-right">{c.monthly_value ? formatBRL(Number(c.monthly_value)) : "—"}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded ${statusColors[c.status] || "bg-muted"}`}>{statusLabels[c.status] || c.status}</span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{c.signer_name || "—"}</td>
                  <td className="py-3 px-4 text-muted-foreground">{new Date(c.created_at).toLocaleDateString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
