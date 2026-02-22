import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { KpiCard } from "@/components/KpiCard";
import { FileText, DollarSign, Inbox } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserOrgId } from "@/hooks/useUserOrgId";

function useCrmProposals() {
  const { data: orgId } = useUserOrgId();
  return useQuery({
    queryKey: ["crm-proposals", orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from("crm_proposals").select("*").eq("organization_id", orgId!).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}

export default function FranqueadoPropostas() {
  const { data: proposals, isLoading } = useCrmProposals();

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const items = proposals ?? [];
  const total = items.reduce((s, p) => s + Number(p.value || 0), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader title="Propostas" subtitle="Gerencie suas propostas comerciais" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total de Propostas" value={String(items.length)} icon={FileText} delay={0} />
        <KpiCard label="Valor Total" value={`R$ ${total.toLocaleString()}`} icon={DollarSign} delay={1} variant="accent" />
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <Inbox className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground font-medium">Nenhuma proposta encontrada</p>
          <p className="text-xs text-muted-foreground mt-1">Crie propostas a partir do CRM para gerenciá-las aqui.</p>
        </div>
      ) : (
        <Card className="glass-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(p => (
                <TableRow key={p.id} className="cursor-pointer hover:bg-muted/30">
                  <TableCell className="font-medium">{p.title}</TableCell>
                  <TableCell className="font-semibold">R$ {Number(p.value || 0).toLocaleString()}</TableCell>
                  <TableCell><Badge variant={p.status === "accepted" ? "default" : "secondary"}>{p.status}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{new Date(p.created_at).toLocaleDateString("pt-BR")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
