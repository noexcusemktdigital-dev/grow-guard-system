import { useState } from "react";
import { Building2, ArrowLeft, Users, FileText, Settings, ClipboardList, Inbox, Plus, CreditCard, RefreshCw, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useUnits, useUnitMutations } from "@/hooks/useUnits";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

function CreditosSaasTab() {
  const queryClient = useQueryClient();
  const [rechargeOrg, setRechargeOrg] = useState<{ id: string; name: string } | null>(null);
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [rechargeDesc, setRechargeDesc] = useState("");
  const [linkOrg, setLinkOrg] = useState<{ id: string; name: string; currentId?: string } | null>(null);
  const [asaasId, setAsaasId] = useState("");

  // Fetch all client organizations with wallets
  const { data: orgCredits, isLoading } = useQuery({
    queryKey: ["admin-org-credits"],
    queryFn: async () => {
      // Get client orgs
      const { data: orgs, error: orgsErr } = await supabase
        .from("organizations")
        .select("id, name, type, asaas_customer_id")
        .eq("type", "cliente");
      if (orgsErr) throw orgsErr;

      // Get all wallets
      const { data: wallets, error: walletsErr } = await supabase
        .from("credit_wallets")
        .select("organization_id, balance");
      if (walletsErr) throw walletsErr;

      const walletMap = new Map(wallets?.map((w: any) => [w.organization_id, w.balance]) || []);

      // Get subscriptions
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("organization_id, plan, status");
      const subMap = new Map(subs?.map((s: any) => [s.organization_id, s]) || []);

      return (orgs || []).map((org: any) => ({
        ...org,
        balance: walletMap.get(org.id) ?? 0,
        subscription: subMap.get(org.id) || null,
      }));
    },
  });

  const rechargeMutation = useMutation({
    mutationFn: async ({ orgId, amount, description }: { orgId: string; amount: number; description: string }) => {
      const { data, error } = await supabase.functions.invoke("recharge-credits", {
        body: { organization_id: orgId, amount, description },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Créditos recarregados! Novo saldo: ${data.new_balance}`);
      queryClient.invalidateQueries({ queryKey: ["admin-org-credits"] });
      setRechargeOrg(null);
      setRechargeAmount("");
      setRechargeDesc("");
    },
    onError: (err: any) => {
      toast.error(`Erro ao recarregar: ${err.message}`);
    },
  });

  const linkAsaasMutation = useMutation({
    mutationFn: async ({ orgId, customerId }: { orgId: string; customerId: string }) => {
      const { error } = await supabase
        .from("organizations")
        .update({ asaas_customer_id: customerId || null })
        .eq("id", orgId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("ID Asaas vinculado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["admin-org-credits"] });
      setLinkOrg(null);
      setAsaasId("");
    },
    onError: (err: any) => {
      toast.error(`Erro ao vincular: ${err.message}`);
    },
  });

  if (isLoading) {
    return <div className="space-y-3"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>;
  }

  return (
    <>
      <Card className="p-4">
        <div className="space-y-1 mb-4">
          <h3 className="font-semibold text-foreground">Gestão de Créditos — Clientes SaaS</h3>
          <p className="text-xs text-muted-foreground">Visualize e recarregue créditos das organizações-cliente</p>
        </div>

        {(!orgCredits || orgCredits.length === 0) ? (
          <p className="text-sm text-muted-foreground text-center py-6">Nenhuma organização-cliente encontrada.</p>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-5 gap-2 text-xs font-medium text-muted-foreground border-b pb-2">
              <span>Organização</span>
              <span>Plano</span>
              <span>Status</span>
              <span className="text-right">Saldo</span>
              <span className="text-right">Ações</span>
            </div>
            {orgCredits.map((org: any) => (
              <div key={org.id} className="grid grid-cols-5 gap-2 items-center text-sm py-2 border-b last:border-0">
                <div>
                  <span className="font-medium text-foreground">{org.name}</span>
                  {org.asaas_customer_id && <p className="text-[10px] text-muted-foreground">Asaas: {org.asaas_customer_id}</p>}
                </div>
                <span className="text-muted-foreground">{org.subscription?.plan || "—"}</span>
                <Badge variant={org.subscription?.status === "active" ? "default" : "secondary"} className="text-[10px] w-fit">
                  {org.subscription?.status || "—"}
                </Badge>
                <span className={`text-right font-semibold tabular-nums ${org.balance <= 0 ? "text-destructive" : org.balance < 500 ? "text-amber-500" : "text-foreground"}`}>
                  {org.balance.toLocaleString("pt-BR")}
                </span>
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => { setLinkOrg({ id: org.id, name: org.name, currentId: org.asaas_customer_id }); setAsaasId(org.asaas_customer_id || ""); }}>
                    <Link2 className="w-3 h-3" /> {org.asaas_customer_id ? "Editar ID" : "Vincular"}
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setRechargeOrg({ id: org.id, name: org.name })}>
                    <RefreshCw className="w-3 h-3" /> Recarregar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Dialog open={!!rechargeOrg} onOpenChange={() => setRechargeOrg(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Recarregar Créditos</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Organização: <strong>{rechargeOrg?.name}</strong></p>
            <div className="space-y-2">
              <Label>Quantidade de créditos</Label>
              <Input type="number" min={1} value={rechargeAmount} onChange={(e) => setRechargeAmount(e.target.value)} placeholder="Ex: 5000" />
            </div>
            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Textarea value={rechargeDesc} onChange={(e) => setRechargeDesc(e.target.value)} placeholder="Ex: Pagamento via boleto ref. Jan/2026" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRechargeOrg(null)}>Cancelar</Button>
            <Button
              onClick={() => rechargeOrg && rechargeMutation.mutate({ orgId: rechargeOrg.id, amount: parseInt(rechargeAmount), description: rechargeDesc })}
              disabled={!rechargeAmount || parseInt(rechargeAmount) <= 0 || rechargeMutation.isPending}
            >
              {rechargeMutation.isPending ? "Recarregando..." : "Confirmar Recarga"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!linkOrg} onOpenChange={() => setLinkOrg(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Vincular ID Asaas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Organização: <strong>{linkOrg?.name}</strong></p>
            <div className="space-y-2">
              <Label>ID do cliente Asaas</Label>
              <Input value={asaasId} onChange={(e) => setAsaasId(e.target.value)} placeholder="cus_000000000000" />
              <p className="text-[10px] text-muted-foreground">Encontre o ID do cliente no painel Asaas (formato: cus_...)</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkOrg(null)}>Cancelar</Button>
            <Button
              onClick={() => linkOrg && linkAsaasMutation.mutate({ orgId: linkOrg.id, customerId: asaasId.trim() })}
              disabled={linkAsaasMutation.isPending}
            >
              {linkAsaasMutation.isPending ? "Salvando..." : "Salvar Vínculo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function Unidades() {
  const { data: units, isLoading } = useUnits();
  const { createUnit } = useUnitMutations();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = (units ?? []).find(u => u.id === selectedId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        {selected && (
          <Button variant="ghost" size="icon" onClick={() => setSelectedId(null)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" />
            <h1 className="page-header-title">{selected ? selected.name : "Unidades da Rede"}</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {selected ? "Gerenciamento da unidade" : "Cadastro e gerenciamento das franquias da rede"}
          </p>
        </div>
      </div>

      {!selected ? (
        <>
          {/* Creditos SaaS Tab - always visible for admins */}
          <Tabs defaultValue="unidades">
            <TabsList>
              <TabsTrigger value="unidades" className="gap-2"><Building2 className="w-4 h-4" /> Unidades</TabsTrigger>
              <TabsTrigger value="creditos" className="gap-2"><CreditCard className="w-4 h-4" /> Créditos SaaS</TabsTrigger>
            </TabsList>

            <TabsContent value="unidades" className="mt-4">
              {(units ?? []).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Inbox className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-1">Nenhuma unidade cadastrada</h3>
                  <p className="text-sm text-muted-foreground mb-4">Cadastre a primeira unidade da rede.</p>
                  <Button onClick={() => createUnit.mutate({ name: "Nova Unidade" })}>
                    <Plus className="w-4 h-4 mr-1" /> Nova Unidade
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {units!.map(u => (
                    <Card key={u.id} className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedId(u.id)}>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{u.name}</h3>
                        <Badge variant={u.status === "active" ? "default" : "secondary"} className="text-[10px]">{u.status === "active" ? "Ativa" : u.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{u.city}{u.state ? `, ${u.state}` : ""}</p>
                      {u.manager_name && <p className="text-xs text-muted-foreground mt-1">Responsável: {u.manager_name}</p>}
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="creditos" className="mt-4">
              <CreditosSaasTab />
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <div className="animate-fade-in">
          <Tabs defaultValue="dados">
            <TabsList className="mb-6">
              <TabsTrigger value="dados" className="gap-2"><ClipboardList className="w-4 h-4" /> Dados</TabsTrigger>
              <TabsTrigger value="usuarios" className="gap-2"><Users className="w-4 h-4" /> Usuários</TabsTrigger>
              <TabsTrigger value="documentos" className="gap-2"><FileText className="w-4 h-4" /> Documentos</TabsTrigger>
              <TabsTrigger value="financeiro" className="gap-2"><Settings className="w-4 h-4" /> Financeiro</TabsTrigger>
            </TabsList>
            <TabsContent value="dados">
              <Card className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground">Nome:</span> <span className="font-medium">{selected.name}</span></div>
                  <div><span className="text-muted-foreground">Status:</span> <span className="font-medium">{selected.status}</span></div>
                  <div><span className="text-muted-foreground">Cidade:</span> <span className="font-medium">{selected.city || "—"}</span></div>
                  <div><span className="text-muted-foreground">Estado:</span> <span className="font-medium">{selected.state || "—"}</span></div>
                  <div><span className="text-muted-foreground">Telefone:</span> <span className="font-medium">{selected.phone || "—"}</span></div>
                  <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{selected.email || "—"}</span></div>
                  <div><span className="text-muted-foreground">Responsável:</span> <span className="font-medium">{selected.manager_name || "—"}</span></div>
                </div>
              </Card>
            </TabsContent>
            <TabsContent value="usuarios"><Card className="p-6 text-center text-muted-foreground">Nenhum usuário vinculado a esta unidade.</Card></TabsContent>
            <TabsContent value="documentos"><Card className="p-6 text-center text-muted-foreground">Nenhum documento cadastrado.</Card></TabsContent>
            <TabsContent value="financeiro"><Card className="p-6 text-center text-muted-foreground">Configuração financeira não definida.</Card></TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
