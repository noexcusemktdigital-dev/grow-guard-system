import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/KpiCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, ArrowRightLeft, TrendingUp, Wallet, Inbox } from "lucide-react";
import { useFinanceRevenues, useFinanceExpenses } from "@/hooks/useFinance";

export default function FranqueadoFinanceiro() {
  const { data: revenues, isLoading: loadingRev } = useFinanceRevenues();
  const { data: expenses, isLoading: loadingExp } = useFinanceExpenses();

  const isLoading = loadingRev || loadingExp;
  const totalReceitas = (revenues ?? []).reduce((s, r) => s + Number(r.amount), 0);
  const totalDespesas = (expenses ?? []).reduce((s, e) => s + Number(e.amount), 0);
  const resultado = totalReceitas - totalDespesas;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader title="Financeiro Unidade" subtitle="Acompanhamento financeiro da sua unidade" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Receitas" value={`R$ ${totalReceitas.toLocaleString()}`} icon={DollarSign} delay={0} variant="accent" />
        <KpiCard label="Despesas" value={`R$ ${totalDespesas.toLocaleString()}`} icon={ArrowRightLeft} delay={1} />
        <KpiCard label="Resultado" value={`R$ ${resultado.toLocaleString()}`} icon={TrendingUp} delay={2} variant={resultado >= 0 ? "accent" : undefined} />
        <KpiCard label="Transações" value={String((revenues ?? []).length + (expenses ?? []).length)} icon={Wallet} delay={3} />
      </div>

      <Tabs defaultValue="receitas" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="receitas">Receitas</TabsTrigger>
          <TabsTrigger value="despesas">Despesas</TabsTrigger>
        </TabsList>

        <TabsContent value="receitas" className="space-y-4">
          {(revenues ?? []).length === 0 ? (
            <div className="text-center py-16">
              <Inbox className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma receita registrada.</p>
            </div>
          ) : (
            <Card className="glass-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(revenues ?? []).map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.description}</TableCell>
                      <TableCell className="font-semibold text-primary">R$ {Number(r.amount).toLocaleString()}</TableCell>
                      <TableCell><Badge variant="outline">{r.category || "Geral"}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{r.date}</TableCell>
                      <TableCell><Badge variant={r.status === "paid" ? "default" : "secondary"}>{r.status === "paid" ? "Pago" : "Pendente"}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="despesas" className="space-y-4">
          {(expenses ?? []).length === 0 ? (
            <div className="text-center py-16">
              <Inbox className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma despesa registrada.</p>
            </div>
          ) : (
            <Card className="glass-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(expenses ?? []).map(e => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{e.description}</TableCell>
                      <TableCell className="font-semibold">R$ {Number(e.amount).toLocaleString()}</TableCell>
                      <TableCell><Badge variant="outline">{e.category || "Geral"}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{e.date}</TableCell>
                      <TableCell><Badge variant={e.status === "paid" ? "default" : "secondary"}>{e.status === "paid" ? "Pago" : "Pendente"}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
