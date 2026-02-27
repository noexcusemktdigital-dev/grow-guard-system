import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Inbox, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/KpiCard";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFinanceRevenues, useFinanceMutations } from "@/hooks/useFinance";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAllClientPayments } from "@/hooks/useClientPayments";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function useAllSystemPayments() {
  return useQuery({
    queryKey: ["all-system-payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("franchisee_system_payments" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []) as any[];
    },
  });
}

export default function FinanceiroReceitas() {
  const { toast } = useToast();
  const { data: revenues, isLoading } = useFinanceRevenues();
  const { createRevenue } = useFinanceMutations();
  const { data: systemPayments, isLoading: loadingSP } = useAllSystemPayments();
  const { data: clientPayments, isLoading: loadingCP } = useAllClientPayments();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState("Assessoria");
  const [tab, setTab] = useState("todas");

  const total = (revenues ?? []).reduce((s, r) => s + Number(r.amount), 0);
  const totalSistema = (systemPayments ?? []).filter((p: any) => p.status === "paid").reduce((s: number, p: any) => s + Number(p.amount || 250), 0);
  const totalClientes = (clientPayments ?? []).filter((p: any) => p.status === "paid").reduce((s: number, p: any) => s + Number(p.amount || 0), 0);

  const handleSave = () => {
    if (!desc.trim()) { toast({ title: "Informe a descrição", variant: "destructive" }); return; }
    createRevenue.mutate({ description: desc, amount, category, status: "pending" });
    setDialogOpen(false);
    setDesc(""); setAmount(0);
    toast({ title: "Receita adicionada" });
  };

  if (isLoading) return <div className="space-y-6"><Skeleton className="h-12 w-full" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="page-header-title">Receitas</h1><p className="text-sm text-muted-foreground mt-1">Receitas manuais, sistema e clientes franqueados</p></div>
        <Button size="sm" onClick={() => setDialogOpen(true)} className="gap-2"><Plus className="w-4 h-4" /> Nova Receita</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Receitas Manuais" value={formatBRL(total)} trend="up" />
        <KpiCard label="Sistema Franqueados" value={formatBRL(totalSistema)} />
        <KpiCard label="Clientes Franqueados" value={formatBRL(totalClientes)} />
        <KpiCard label="Total Geral" value={formatBRL(total + totalSistema + totalClientes)} />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="todas">Receitas Manuais</TabsTrigger>
          <TabsTrigger value="sistema">Sistema Franqueados</TabsTrigger>
          <TabsTrigger value="clientes">Clientes Franqueados</TabsTrigger>
        </TabsList>

        <TabsContent value="todas" className="mt-4">
          {(revenues ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Inbox className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-1">Nenhuma receita registrada</h3>
              <p className="text-sm text-muted-foreground mb-4">Adicione sua primeira receita.</p>
              <Button onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4 mr-1" /> Nova Receita</Button>
            </div>
          ) : (
            <div className="glass-card overflow-hidden overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Descrição</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Categoria</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">Valor</th>
                    <th className="text-center py-3 px-4 text-muted-foreground font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {revenues!.map(r => (
                    <tr key={r.id} className="border-b border-border/50 hover:bg-secondary/30">
                      <td className="py-3 px-4 font-medium">{r.description}</td>
                      <td className="py-3 px-4 text-muted-foreground">{r.category || "—"}</td>
                      <td className="py-3 px-4 text-right">{formatBRL(Number(r.amount))}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded ${r.status === "paid" ? "bg-emerald-500/15 text-emerald-500" : "bg-yellow-500/15 text-yellow-500"}`}>{r.status === "paid" ? "Recebido" : "Pendente"}</span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{r.date ? new Date(r.date + "T00:00:00").toLocaleDateString("pt-BR") : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="sistema" className="mt-4">
          {loadingSP ? <Skeleton className="h-48" /> : (systemPayments ?? []).length === 0 ? (
            <div className="text-center py-16"><Inbox className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" /><p className="text-sm text-muted-foreground">Nenhum pagamento de sistema registrado.</p></div>
          ) : (
            <div className="glass-card overflow-hidden overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Organização</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Mês</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">Valor</th>
                    <th className="text-center py-3 px-4 text-muted-foreground font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Pago em</th>
                  </tr>
                </thead>
                <tbody>
                  {(systemPayments ?? []).map((p: any) => (
                    <tr key={p.id} className="border-b border-border/50 hover:bg-secondary/30">
                      <td className="py-3 px-4 font-medium">{p.organization_id?.slice(0, 8)}...</td>
                      <td className="py-3 px-4">{p.month}</td>
                      <td className="py-3 px-4 text-right">{formatBRL(Number(p.amount || 250))}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={p.status === "paid" ? "default" : p.status === "pending" ? "secondary" : "destructive"}>
                          {p.status === "paid" ? "Pago" : p.status === "pending" ? "Pendente" : "Atrasado"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{p.paid_at ? new Date(p.paid_at).toLocaleDateString("pt-BR") : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="clientes" className="mt-4">
          {loadingCP ? <Skeleton className="h-48" /> : (clientPayments ?? []).length === 0 ? (
            <div className="text-center py-16"><Inbox className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" /><p className="text-sm text-muted-foreground">Nenhum pagamento de cliente registrado.</p></div>
          ) : (
            <div className="glass-card overflow-hidden overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Organização</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Mês</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">Valor</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">Part. Franqueado</th>
                    <th className="text-center py-3 px-4 text-muted-foreground font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Pago em</th>
                  </tr>
                </thead>
                <tbody>
                  {(clientPayments ?? []).map((p: any) => (
                    <tr key={p.id} className="border-b border-border/50 hover:bg-secondary/30">
                      <td className="py-3 px-4 font-medium">{p.organization_id?.slice(0, 8)}...</td>
                      <td className="py-3 px-4">{p.month}</td>
                      <td className="py-3 px-4 text-right">{formatBRL(Number(p.amount || 0))}</td>
                      <td className="py-3 px-4 text-right text-emerald-600">{formatBRL(Number(p.franchisee_share || 0))}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={p.status === "paid" ? "default" : p.status === "pending" ? "secondary" : "destructive"}>
                          {p.status === "paid" ? "Pago" : p.status === "pending" ? "Pendente" : "Atrasado"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{p.paid_at ? new Date(p.paid_at).toLocaleDateString("pt-BR") : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Nova Receita</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Descrição *</Label><Input value={desc} onChange={e => setDesc(e.target.value)} /></div>
            <div><Label>Valor (R$)</Label><Input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} /></div>
            <div><Label>Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Assessoria">Assessoria</SelectItem>
                  <SelectItem value="SaaS">SaaS</SelectItem>
                  <SelectItem value="Sistema">Sistema</SelectItem>
                  <SelectItem value="Franquia">Venda de Franquia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
