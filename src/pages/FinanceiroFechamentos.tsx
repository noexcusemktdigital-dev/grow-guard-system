import { useMemo } from "react";
import { Inbox, FileDown, Building2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/KpiCard";
import { useNetworkContracts } from "@/hooks/useContracts";
import { useFinanceClosings } from "@/hooks/useFinance";
import { Button } from "@/components/ui/button";

const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function FinanceiroFechamentos() {
  const { data: contracts, isLoading: loadingContracts } = useNetworkContracts();
  const { data: closings, isLoading: loadingClosings } = useFinanceClosings();

  const isLoading = loadingContracts || loadingClosings;

  // Group active contracts by org for consolidation
  const consolidation = useMemo(() => {
    if (!contracts) return [];
    const activeContracts = contracts.filter((c: any) => c.status === "active" || c.status === "signed");
    const byOrg: Record<string, { orgName: string; contracts: number; mrr: number; royalty: number; systemFee: number }> = {};
    activeContracts.forEach((c: any) => {
      const key = c.org_name || c.organization_id;
      if (!byOrg[key]) byOrg[key] = { orgName: c.org_name || "—", contracts: 0, mrr: 0, royalty: 0, systemFee: 250 };
      byOrg[key].contracts++;
      byOrg[key].mrr += Number(c.monthly_value || 0);
    });
    // Calculate royalties (10% of MRR)
    Object.values(byOrg).forEach(o => { o.royalty = o.mrr * 0.1; });
    return Object.values(byOrg).sort((a, b) => b.mrr - a.mrr);
  }, [contracts]);

  const totalMRR = consolidation.reduce((s, c) => s + c.mrr, 0);
  const totalRoyalties = consolidation.reduce((s, c) => s + c.royalty, 0);
  const totalSystemFees = consolidation.reduce((s, c) => s + c.systemFee, 0);

  if (isLoading) return <div className="space-y-6"><Skeleton className="h-12 w-full" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="page-header-title">Fechamentos</h1>
        <p className="text-sm text-muted-foreground mt-1">Consolidação mensal por unidade — royalties e taxas</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="MRR Rede" value={formatBRL(totalMRR)} accent />
        <KpiCard label="Royalties (10%)" value={formatBRL(totalRoyalties)} />
        <KpiCard label="Taxas Sistema" value={formatBRL(totalSystemFees)} />
        <KpiCard label="Unidades Ativas" value={String(consolidation.length)} />
      </div>

      {consolidation.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Inbox className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-1">Nenhuma consolidação disponível</h3>
          <p className="text-sm text-muted-foreground">Contratos ativos gerarão fechamentos automaticamente.</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left py-3 px-4 font-medium">Unidade</th>
                <th className="text-center py-3 px-4 font-medium">Contratos</th>
                <th className="text-right py-3 px-4 font-medium">MRR</th>
                <th className="text-right py-3 px-4 font-medium">Royalty (10%)</th>
                <th className="text-right py-3 px-4 font-medium">Taxa Sistema</th>
                <th className="text-right py-3 px-4 font-medium">Total Devido</th>
              </tr>
            </thead>
            <tbody>
              {consolidation.map((c, i) => (
                <tr key={i} className="border-b hover:bg-muted/30">
                  <td className="py-3 px-4 font-medium flex items-center gap-2"><Building2 className="w-4 h-4 text-muted-foreground" />{c.orgName}</td>
                  <td className="py-3 px-4 text-center">{c.contracts}</td>
                  <td className="py-3 px-4 text-right">{formatBRL(c.mrr)}</td>
                  <td className="py-3 px-4 text-right text-amber-600">{formatBRL(c.royalty)}</td>
                  <td className="py-3 px-4 text-right text-blue-600">{formatBRL(c.systemFee)}</td>
                  <td className="py-3 px-4 text-right font-semibold">{formatBRL(c.royalty + c.systemFee)}</td>
                </tr>
              ))}
              <tr className="bg-muted/50 font-semibold">
                <td className="py-3 px-4">Total</td>
                <td className="py-3 px-4 text-center">{consolidation.reduce((s, c) => s + c.contracts, 0)}</td>
                <td className="py-3 px-4 text-right">{formatBRL(totalMRR)}</td>
                <td className="py-3 px-4 text-right text-amber-600">{formatBRL(totalRoyalties)}</td>
                <td className="py-3 px-4 text-right text-blue-600">{formatBRL(totalSystemFees)}</td>
                <td className="py-3 px-4 text-right">{formatBRL(totalRoyalties + totalSystemFees)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Existing closings/DRE files */}
      {(closings ?? []).length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Arquivos de Fechamento</h3>
          {closings!.map(cl => (
            <Card key={cl.id} className="glass-card">
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileDown className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{cl.title}</p>
                    <p className="text-xs text-muted-foreground">{cl.year}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={cl.status === "published" ? "default" : "secondary"}>
                    {cl.status === "published" ? "Publicado" : "Pendente"}
                  </Badge>
                  {cl.file_url && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={cl.file_url} target="_blank" rel="noreferrer"><FileDown className="w-4 h-4 mr-1" />Baixar</a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
