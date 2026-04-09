import { useState } from "react";
import {
  BarChart3, RefreshCw, AlertTriangle, TrendingUp, Users,
  Wifi, WifiOff, Clock, Copy, CheckCircle2, Info,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { useMetaAdsInsights, type MetaAdsPeriod } from "@/hooks/use-meta-ads";
import { useAdsAlerts } from "@/hooks/use-ads-alerts";

// -----------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------
const NOE_ORG_ID = "adb09618-e9f3-4dbd-a89c-29e3eb1bec9f";
const SISTEMA_URL = "https://sistema.noexcusedigital.com.br";

// -----------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------
interface FranqueadoConnectionRow {
  unit_id: string;
  unit_name: string;
  org_id: string | null;
  connection_id: string | null;
  account_name: string | null;
  is_active: boolean | null;
  token_expires_at: string | null;
  connected_at: string | null;
  last_sync_at: string | null;
}

type ConnectionHealth = "active" | "expired" | "none";

function getConnectionHealth(row: FranqueadoConnectionRow): ConnectionHealth {
  if (!row.connection_id || !row.is_active) return "none";
  if (row.token_expires_at && new Date(row.token_expires_at) < new Date()) return "expired";
  return "active";
}

// -----------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------
function fmtBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtNumber(value: number): string {
  return value.toLocaleString("pt-BR");
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

// -----------------------------------------------------------------------
// Skeleton card
// -----------------------------------------------------------------------
function SummaryCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-1 pt-4 px-4">
        <Skeleton className="h-3 w-28" />
      </CardHeader>
      <CardContent className="pb-4 px-4">
        <Skeleton className="h-7 w-20 mt-1" />
      </CardContent>
    </Card>
  );
}

// -----------------------------------------------------------------------
// Connection status badge
// -----------------------------------------------------------------------
function ConnectionBadge({ health }: { health: ConnectionHealth }) {
  if (health === "active") {
    return (
      <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-400/40 hover:bg-emerald-500/20 text-xs">
        <Wifi className="w-3 h-3 mr-1" />
        Conectado
      </Badge>
    );
  }
  if (health === "expired") {
    return (
      <Badge className="bg-yellow-500/15 text-yellow-700 border-yellow-400/40 hover:bg-yellow-500/20 text-xs">
        <Clock className="w-3 h-3 mr-1" />
        Expirado
      </Badge>
    );
  }
  return (
    <Badge className="bg-zinc-500/10 text-zinc-500 border-zinc-400/30 hover:bg-zinc-500/15 text-xs">
      <WifiOff className="w-3 h-3 mr-1" />
      Sem conexão
    </Badge>
  );
}

// -----------------------------------------------------------------------
// Central NOE account card (Seção 3)
// -----------------------------------------------------------------------
function NoeAccountCard() {
  const [period, setPeriod] = useState<MetaAdsPeriod>("today");
  // conta NOE central: sem org_id — usa a conta hardcoded na edge function
  const { data, isLoading, isError, error, refetch, isFetching } = useMetaAdsInsights(period);

  useAdsAlerts(data);

  const account = data?.account;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold">Conta da Franqueadora</h2>
          <Badge variant="outline" className="text-xs">NOE FRANQUIA</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={period} onValueChange={(v) => setPeriod(v as MetaAdsPeriod)}>
            <TabsList className="h-8">
              <TabsTrigger value="today" className="text-xs px-3 h-6">Hoje</TabsTrigger>
              <TabsTrigger value="last_7d" className="text-xs px-3 h-6">7 dias</TabsTrigger>
              <TabsTrigger value="last_30d" className="text-xs px-3 h-6">30 dias</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isFetching ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {isError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar dados</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "Não foi possível conectar à Meta API."}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { title: "Gasto", value: account ? fmtBRL(account.spend) : "—" },
          { title: "Leads", value: account ? fmtNumber(account.leads) : "—" },
          { title: "CPL", value: account ? fmtBRL(account.cpl) : "—", sub: "Custo por lead" },
          { title: "CTR", value: account ? `${account.ctr.toFixed(2)}%` : "—", sub: "Taxa de clique" },
          { title: "Impressões", value: account ? fmtNumber(account.impressions) : "—" },
          { title: "Cliques", value: account ? fmtNumber(account.clicks) : "—" },
        ].map((m) => (
          <Card key={m.title}>
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {m.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4 px-4">
              {isLoading ? (
                <Skeleton className="h-7 w-24 mt-1" />
              ) : (
                <>
                  <p className="text-2xl font-bold tracking-tight">{m.value}</p>
                  {m.sub && <p className="text-xs text-muted-foreground mt-0.5">{m.sub}</p>}
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------
// Main page — AdsNetwork
// -----------------------------------------------------------------------
export default function AdsNetwork() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Query: buscar todos os franqueados com status de conexão
  const {
    data: franchiseeRows,
    isLoading: isLoadingTable,
    isError: isErrorTable,
    refetch: refetchTable,
    isFetching: isFetchingTable,
  } = useQuery<FranqueadoConnectionRow[]>({
    queryKey: ["ads-network-connections", NOE_ORG_ID],
    queryFn: async () => {
      // RPC que retorna franqueados + último status de conexão
      const { data, error } = await supabase.rpc("get_ads_network_status", {
        _franqueadora_org_id: NOE_ORG_ID,
      });
      if (error) throw error;
      return (data ?? []) as FranqueadoConnectionRow[];
    },
    staleTime: 2 * 60 * 1000,
  });

  const rows = franchiseeRows ?? [];

  // Calcular totais para os cards de resumo
  const totalActive = rows.filter((r) => getConnectionHealth(r) === "active").length;
  const totalUnits = rows.length;

  const handleCopyInvite = (row: FranqueadoConnectionRow) => {
    const link = `${SISTEMA_URL}/franqueado/anuncios?invite=true&unit=${row.unit_id}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedId(row.unit_id);
      toast.success("Link copiado!", { description: "Cole e envie para o franqueado." });
      setTimeout(() => setCopiedId(null), 2500);
    });
  };

  return (
    <div className="flex flex-col gap-8 p-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-semibold">Rede de Anúncios</h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetchTable()}
          disabled={isFetchingTable}
          className="self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isFetchingTable ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Seção 1 — Resumo da Rede */}
      <section>
        <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          Resumo da Rede
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {isLoadingTable ? (
            <><SummaryCardSkeleton /><SummaryCardSkeleton /><SummaryCardSkeleton /><SummaryCardSkeleton /></>
          ) : (
            <>
              <Card>
                <CardHeader className="pb-1 pt-4 px-4">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Conexões Ativas
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4 px-4">
                  <p className="text-2xl font-bold tracking-tight text-emerald-600">
                    {totalActive}
                    <span className="text-sm font-normal text-muted-foreground ml-1">/ {totalUnits}</span>
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-1 pt-4 px-4">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Sem Conexão
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4 px-4">
                  <p className="text-2xl font-bold tracking-tight">
                    {rows.filter((r) => getConnectionHealth(r) === "none").length}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-1 pt-4 px-4">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Total Gasto (rede)
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4 px-4">
                  <p className="text-2xl font-bold tracking-tight text-muted-foreground">—</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Disponível em breve</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-1 pt-4 px-4">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    CPL Médio Rede
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4 px-4">
                  <p className="text-2xl font-bold tracking-tight text-muted-foreground">—</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Disponível em breve</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </section>

      {/* Seção 2 — Tabela de Franqueados */}
      <section>
        <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
          Franqueados
        </h2>

        {isErrorTable && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erro ao carregar franqueados</AlertTitle>
            <AlertDescription>
              Não foi possível carregar os dados. Verifique se a função get_ads_network_status está disponível.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Unidade</TableHead>
                  <TableHead>Status conexão</TableHead>
                  <TableHead>Conta conectada</TableHead>
                  <TableHead>Última sincronização</TableHead>
                  <TableHead className="text-right pr-4">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingTable ? (
                  <>
                    {[1, 2, 3, 4].map((i) => (
                      <TableRow key={i}>
                        {[1, 2, 3, 4, 5].map((j) => (
                          <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Info className="w-5 h-5" />
                        <span className="text-sm">Nenhuma unidade encontrada.</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => {
                    const health = getConnectionHealth(row);
                    const isCopied = copiedId === row.unit_id;
                    return (
                      <TableRow key={row.unit_id}>
                        <TableCell className="pl-4 font-medium">
                          {row.unit_name}
                        </TableCell>
                        <TableCell>
                          <ConnectionBadge health={health} />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {row.account_name ?? "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {fmtDate(row.last_sync_at ?? row.connected_at)}
                        </TableCell>
                        <TableCell className="text-right pr-4">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => handleCopyInvite(row)}
                          >
                            {isCopied ? (
                              <><CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />Copiado</>
                            ) : (
                              <><Copy className="w-3.5 h-3.5 mr-1.5" />Enviar convite</>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      {/* Seção 3 — Conta da Franqueadora (NOE central) */}
      <section className="border-t pt-6">
        <NoeAccountCard />
      </section>
    </div>
  );
}
