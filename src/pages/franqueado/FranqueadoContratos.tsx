import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/KpiCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileSignature, DollarSign, Inbox } from "lucide-react";
import { useContracts } from "@/hooks/useContracts";

export default function FranqueadoContratos() {
  const { data: contracts, isLoading } = useContracts();

  if (isLoading) {
    return (
      <div className="w-full space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      </div>
    );
  }

  const items = contracts ?? [];
  const ativos = items.filter(c => c.status === "active").length;

  return (
    <div className="w-full space-y-6">
      <PageHeader title="Meus Contratos" subtitle="Gerencie contratos de clientes da unidade" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Contratos Ativos" value={String(ativos)} icon={FileSignature} delay={0} />
        <KpiCard label="Total" value={String(items.length)} icon={DollarSign} delay={1} />
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <Inbox className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground font-medium">Nenhum contrato encontrado</p>
          <p className="text-xs text-muted-foreground mt-1">Contratos gerados aparecerão aqui.</p>
        </div>
      ) : (
        <Card className="glass-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Assinante</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(c => (
                <TableRow key={c.id} className="cursor-pointer hover:bg-muted/30">
                  <TableCell className="font-medium">{c.title}</TableCell>
                  <TableCell>{c.signer_name || "—"}</TableCell>
                  <TableCell><Badge variant={c.status === "active" ? "default" : "secondary"}>{c.status === "active" ? "Ativo" : c.status === "signed" ? "Assinado" : c.status}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{new Date(c.created_at).toLocaleDateString("pt-BR")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
