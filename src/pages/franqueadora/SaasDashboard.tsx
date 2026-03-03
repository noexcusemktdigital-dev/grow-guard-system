import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { KpiCard } from "@/components/KpiCard";
import {
  Users, DollarSign, Settings, HeadphonesIcon, AlertTriangle,
  CheckCircle, CreditCard, TrendingUp, Coins, Search,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  useSaasClients,
  useSaasCostDashboard,
  usePlatformErrors,
  useResolveError,
  useAllSupportTickets,
  useAdjustCredits,
} from "@/hooks/useSaasAdmin";

function ClientesTab() {
  const { data: clients, isLoading } = useSaasClients();
  const [search, setSearch] = useState("");

  const filtered = (clients || []).filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar cliente..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Badge variant="secondary">{filtered.length} clientes</Badge>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Créditos</TableHead>
                <TableHead>Usuários</TableHead>
                <TableHead>Criado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum cliente encontrado</TableCell></TableRow>
              ) : (
                filtered.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{client.subscription?.plan || "Sem plano"}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={client.subscription?.status === "active" ? "default" : "secondary"}>
                        {client.subscription?.status || "inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>{client.wallet?.balance ?? 0}</TableCell>
                    <TableCell>{client.memberCount}</TableCell>
                    <TableCell>{format(new Date(client.created_at), "dd/MM/yyyy")}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function CustosTab() {
  const { data: costs, isLoading } = useSaasCostDashboard();

  if (isLoading) return <div className="text-muted-foreground py-8 text-center">Carregando dados de custos...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard label="Assinaturas Ativas" value={String(costs?.activeSubscriptions || 0)} icon={CreditCard} />
        <KpiCard label="Créditos Consumidos (mês)" value={String(costs?.totalCreditsConsumed || 0)} icon={Coins} />
        <KpiCard label="Custo IA Estimado" value={`R$ ${(costs?.estimatedAiCost || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} icon={TrendingUp} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Consumo por Organização</CardTitle></CardHeader>
        <CardContent>
          {costs?.consumptionByOrg && Object.keys(costs.consumptionByOrg).length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Org ID</TableHead>
                  <TableHead>Créditos Consumidos</TableHead>
                  <TableHead>Custo Estimado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(costs.consumptionByOrg).map(([orgId, amount]) => (
                  <TableRow key={orgId}>
                    <TableCell className="font-mono text-xs">{orgId.slice(0, 8)}...</TableCell>
                    <TableCell>{amount as number}</TableCell>
                    <TableCell>R$ {((amount as number) * 0.002).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-sm">Nenhum consumo registrado este mês.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function GerenciamentoTab() {
  const { data: clients, isLoading } = useSaasClients();
  const adjustCredits = useAdjustCredits();
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [creditAmount, setCreditAmount] = useState("");
  const [creditDesc, setCreditDesc] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleAdjust = async () => {
    if (!selectedOrg || !creditAmount) return;
    try {
      await adjustCredits.mutateAsync({
        orgId: selectedOrg,
        amount: parseInt(creditAmount),
        description: creditDesc || "Ajuste manual pelo admin",
      });
      toast.success("Créditos ajustados com sucesso");
      setDialogOpen(false);
      setCreditAmount("");
      setCreditDesc("");
      setSelectedOrg(null);
    } catch {
      toast.error("Erro ao ajustar créditos");
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Créditos</TableHead>
                <TableHead>Usuários</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : (
                (clients || []).map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{client.subscription?.plan || "—"}</Badge>
                    </TableCell>
                    <TableCell>{client.wallet?.balance ?? 0}</TableCell>
                    <TableCell>{client.memberCount}</TableCell>
                    <TableCell>
                      <Dialog open={dialogOpen && selectedOrg === client.id} onOpenChange={(o) => { setDialogOpen(o); if (!o) setSelectedOrg(null); }}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" onClick={() => { setSelectedOrg(client.id); setDialogOpen(true); }}>
                            Ajustar Créditos
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Ajustar Créditos — {client.name}</DialogTitle></DialogHeader>
                          <div className="space-y-4 pt-2">
                            <div>
                              <Label>Quantidade (positivo = adicionar, negativo = remover)</Label>
                              <Input type="number" value={creditAmount} onChange={(e) => setCreditAmount(e.target.value)} placeholder="Ex: 500 ou -100" />
                            </div>
                            <div>
                              <Label>Descrição</Label>
                              <Input value={creditDesc} onChange={(e) => setCreditDesc(e.target.value)} placeholder="Motivo do ajuste" />
                            </div>
                            <Button onClick={handleAdjust} disabled={adjustCredits.isPending} className="w-full">
                              {adjustCredits.isPending ? "Ajustando..." : "Confirmar Ajuste"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function SuporteTab() {
  const { data: tickets, isLoading } = useAllSupportTickets();

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Prioridade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criado em</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : !tickets?.length ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum ticket encontrado</TableCell></TableRow>
            ) : (
              tickets.map((t: any) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.title}</TableCell>
                  <TableCell>{t.category || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={t.priority === "high" || t.priority === "urgent" ? "destructive" : "secondary"}>
                      {t.priority || "normal"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={t.status === "open" ? "default" : "secondary"}>{t.status}</Badge>
                  </TableCell>
                  <TableCell>{format(new Date(t.created_at), "dd/MM/yyyy HH:mm")}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function ErrosTab() {
  const [severity, setSeverity] = useState<string>("");
  const [source, setSource] = useState<string>("");
  const { data: errors, isLoading } = usePlatformErrors({
    severity: severity || undefined,
    source: source || undefined,
  });
  const resolveError = useResolveError();

  const handleResolve = async (id: string) => {
    try {
      await resolveError.mutateAsync(id);
      toast.success("Erro marcado como resolvido");
    } catch {
      toast.error("Falha ao resolver erro");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={severity} onValueChange={setSeverity}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Severidade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
        <Select value={source} onValueChange={setSource}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Source" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="edge_function">Edge Function</SelectItem>
            <SelectItem value="webhook">Webhook</SelectItem>
            <SelectItem value="client_app">Client App</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Severidade</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Mensagem</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : !errors?.length ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum erro registrado 🎉</TableCell></TableRow>
              ) : (
                errors.map((err) => (
                  <TableRow key={err.id}>
                    <TableCell>
                      <Badge variant={err.severity === "critical" ? "destructive" : err.severity === "warning" ? "secondary" : "outline"}>
                        {err.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{err.source}</TableCell>
                    <TableCell className="font-mono text-xs">{err.function_name || "—"}</TableCell>
                    <TableCell className="max-w-[300px] truncate text-xs">{err.error_message}</TableCell>
                    <TableCell className="text-xs">{format(new Date(err.created_at), "dd/MM HH:mm")}</TableCell>
                    <TableCell>
                      {err.resolved ? (
                        <Badge variant="secondary" className="gap-1"><CheckCircle className="w-3 h-3" /> Resolvido</Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1"><AlertTriangle className="w-3 h-3" /> Aberto</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {!err.resolved && (
                        <Button size="sm" variant="ghost" onClick={() => handleResolve(err.id)} disabled={resolveError.isPending}>
                          Resolver
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SaasDashboard() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestão SaaS"
        subtitle="Painel centralizado de gestão da plataforma SaaS"
      />

      <Tabs defaultValue="clientes" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
          <TabsTrigger value="clientes" className="gap-1.5 text-xs"><Users className="w-3.5 h-3.5" /> Clientes</TabsTrigger>
          <TabsTrigger value="custos" className="gap-1.5 text-xs"><DollarSign className="w-3.5 h-3.5" /> Custos</TabsTrigger>
          <TabsTrigger value="gerenciamento" className="gap-1.5 text-xs"><Settings className="w-3.5 h-3.5" /> Gerenciamento</TabsTrigger>
          <TabsTrigger value="suporte" className="gap-1.5 text-xs"><HeadphonesIcon className="w-3.5 h-3.5" /> Suporte</TabsTrigger>
          <TabsTrigger value="erros" className="gap-1.5 text-xs"><AlertTriangle className="w-3.5 h-3.5" /> Erros</TabsTrigger>
        </TabsList>

        <TabsContent value="clientes"><ClientesTab /></TabsContent>
        <TabsContent value="custos"><CustosTab /></TabsContent>
        <TabsContent value="gerenciamento"><GerenciamentoTab /></TabsContent>
        <TabsContent value="suporte"><SuporteTab /></TabsContent>
        <TabsContent value="erros"><ErrosTab /></TabsContent>
      </Tabs>
    </div>
  );
}
