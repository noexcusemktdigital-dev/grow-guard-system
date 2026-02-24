import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/KpiCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, ArrowRightLeft, TrendingUp, Wallet, Inbox, Plus, FileDown, FileSignature } from "lucide-react";
import { useFinanceRevenues, useFinanceExpenses, useFinanceClosings, useFinanceMutations } from "@/hooks/useFinance";
import { useContracts } from "@/hooks/useContracts";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { toast } from "sonner";

const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function NewTransactionDialog({ type, onSave }: { type: "receita" | "despesa"; onSave: (data: any) => void }) {
  const [open, setOpen] = useState(false);
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState("");

  const handleSubmit = () => {
    if (!desc || !amount) return toast.error("Preencha descrição e valor");
    onSave({ description: desc, amount: Number(amount), date, category: category || "Geral", status: "pending" });
    setDesc(""); setAmount(""); setCategory("");
    setOpen(false);
    toast.success(`${type === "receita" ? "Receita" : "Despesa"} registrada!`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><Plus className="w-4 h-4 mr-1" />Nova {type}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Nova {type === "receita" ? "Receita" : "Despesa"}</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div><Label>Descrição</Label><Input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Ex: Mensalidade cliente X" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Valor (R$)</Label><Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0,00" /></div>
            <div><Label>Data</Label><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
          </div>
          <div><Label>Categoria</Label><Input value={category} onChange={e => setCategory(e.target.value)} placeholder="Geral" /></div>
          <Button onClick={handleSubmit} className="w-full">Salvar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function FranqueadoFinanceiro() {
  const { data: revenues, isLoading: loadingRev } = useFinanceRevenues();
  const { data: expenses, isLoading: loadingExp } = useFinanceExpenses();
  const { data: closings, isLoading: loadingCl } = useFinanceClosings();
  const { data: contracts, isLoading: loadingCon } = useContracts();
  const { createRevenue, createExpense } = useFinanceMutations();

  const isLoading = loadingRev || loadingExp || loadingCl || loadingCon;

  if (isLoading) {
    return (
      <div className="w-full space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      </div>
    );
  }

  const totalReceitas = (revenues ?? []).reduce((s, r) => s + Number(r.amount), 0);
  const totalDespesas = (expenses ?? []).reduce((s, e) => s + Number(e.amount), 0);
  const resultado = totalReceitas - totalDespesas;
  const activeContracts = (contracts ?? []).filter(c => c.status === "active");
  const recorrente = activeContracts.reduce((s, c) => s + Number((c as any).monthly_value || 0), 0);

  // Chart data - last 6 months
  const now = new Date();
  const chartData = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    const mKey = `${y}-${String(m).padStart(2, "0")}`;
    const rec = (revenues ?? []).filter(r => r.date?.startsWith(mKey)).reduce((s, r) => s + Number(r.amount), 0);
    const desp = (expenses ?? []).filter(e => e.date?.startsWith(mKey)).reduce((s, e) => s + Number(e.amount), 0);
    return { name: `${monthNames[m - 1]}/${String(y).slice(2)}`, Receitas: rec, Despesas: desp };
  });

  return (
    <div className="w-full space-y-6">
      <PageHeader title="Financeiro Unidade" subtitle="Gestão financeira completa da sua unidade" />

      <Tabs defaultValue="resumo" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="movimentacoes">Receitas e Despesas</TabsTrigger>
          <TabsTrigger value="fechamentos">Fechamentos</TabsTrigger>
        </TabsList>

        {/* ========== ABA RESUMO ========== */}
        <TabsContent value="resumo" className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Receita Recorrente" value={`R$ ${recorrente.toLocaleString("pt-BR")}`} icon={FileSignature} delay={0} variant="accent" />
            <KpiCard label="Total Receitas" value={`R$ ${totalReceitas.toLocaleString("pt-BR")}`} icon={DollarSign} delay={1} />
            <KpiCard label="Total Despesas" value={`R$ ${totalDespesas.toLocaleString("pt-BR")}`} icon={ArrowRightLeft} delay={2} />
            <KpiCard label="Resultado Líquido" value={`R$ ${resultado.toLocaleString("pt-BR")}`} icon={TrendingUp} delay={3} variant={resultado >= 0 ? "accent" : undefined} />
          </div>

          {/* Contratos ativos */}
          {activeContracts.length > 0 && (
            <Card className="glass-card">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Contratos Ativos</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Valor Mensal</TableHead>
                      <TableHead>Vigência</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeContracts.map(c => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.title}</TableCell>
                        <TableCell>{c.signer_name || "—"}</TableCell>
                        <TableCell className="font-semibold text-primary">R$ {Number((c as any).monthly_value || 0).toLocaleString("pt-BR")}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {(c as any).start_date ? new Date((c as any).start_date).toLocaleDateString("pt-BR") : "—"} — {(c as any).end_date ? new Date((c as any).end_date).toLocaleDateString("pt-BR") : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Gráfico */}
          <Card className="glass-card">
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Receitas vs Despesas (6 meses)</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Legend />
                    <Bar dataKey="Receitas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Despesas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== ABA RECEITAS E DESPESAS ========== */}
        <TabsContent value="movimentacoes" className="space-y-4">
          <Tabs defaultValue="receitas" className="space-y-4">
            <div className="flex items-center justify-between">
              <TabsList className="grid w-60 grid-cols-2">
                <TabsTrigger value="receitas">Receitas</TabsTrigger>
                <TabsTrigger value="despesas">Despesas</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="receitas" className="space-y-4">
              <div className="flex justify-end">
                <NewTransactionDialog type="receita" onSave={d => createRevenue.mutate(d)} />
              </div>
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
                          <TableCell className="font-semibold text-primary">R$ {Number(r.amount).toLocaleString("pt-BR")}</TableCell>
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
              <div className="flex justify-end">
                <NewTransactionDialog type="despesa" onSave={d => createExpense.mutate(d)} />
              </div>
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
                          <TableCell className="font-semibold">R$ {Number(e.amount).toLocaleString("pt-BR")}</TableCell>
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
        </TabsContent>

        {/* ========== ABA FECHAMENTOS ========== */}
        <TabsContent value="fechamentos" className="space-y-4">
          <p className="text-sm text-muted-foreground">Arquivos de fechamento (DRE) enviados pela franqueadora.</p>
          {(closings ?? []).length === 0 ? (
            <div className="text-center py-16">
              <Inbox className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground font-medium">Nenhum fechamento disponível</p>
              <p className="text-xs text-muted-foreground mt-1">Os documentos aparecerão aqui quando a franqueadora publicá-los.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {(closings ?? []).map(cl => (
                <Card key={cl.id} className="glass-card">
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileDown className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{cl.title}</p>
                        <p className="text-xs text-muted-foreground">{monthNames[(cl.month || 1) - 1]} / {cl.year}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={cl.status === "published" ? "default" : "secondary"}>
                        {cl.status === "published" ? "Disponível" : "Pendente"}
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
