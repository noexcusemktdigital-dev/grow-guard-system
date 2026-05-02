// @ts-nocheck
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  TrendingUp, Shield, RefreshCw, AlertTriangle, Info, Lock,
  CheckCircle2, Unlink,
} from "lucide-react";
import { toast } from "sonner";
import { reportError } from "@/lib/error-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { useAdsConnections, useAdsConnectionStatus, useInitiateMetaOAuth } from "@/hooks/use-ads-connections";
import { useMetaAdsInsights, type MetaAdsPeriod, type MetaAdsCampaign } from "@/hooks/use-meta-ads";
import { useAdsAlerts } from "@/hooks/use-ads-alerts";

// -----------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------
function fmtBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtNumber(value: number): string {
  return value.toLocaleString("pt-BR");
}

function fmtPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

type CplStatus = "ok" | "warning" | "critical";

function getCplStatus(cpl: number, spend: number, leads: number): CplStatus {
  if (leads === 0 && spend >= 50) return "critical";
  if (cpl > 50) return "critical";
  if (cpl >= 30 && cpl <= 50) return "warning";
  return "ok";
}

function CplBadge({ cpl, spend, leads }: { cpl: number; spend: number; leads: number }) {
  const status = getCplStatus(cpl, spend, leads);
  if (status === "critical") {
    return <Badge variant="destructive" className="text-xs font-semibold">CRÍTICO</Badge>;
  }
  if (status === "warning") {
    return (
      <Badge className="bg-yellow-500/15 text-yellow-700 border-yellow-400/40 text-xs font-semibold hover:bg-yellow-500/20">
        ATENÇÃO
      </Badge>
    );
  }
  return (
    <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-400/40 text-xs font-semibold hover:bg-emerald-500/20">
      OK
    </Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isActive = status === "ACTIVE";
  return (
    <Badge className={
      isActive
        ? "bg-emerald-500/15 text-emerald-700 border-emerald-400/40 text-xs hover:bg-emerald-500/20"
        : "bg-zinc-500/10 text-zinc-500 border-zinc-400/30 text-xs hover:bg-zinc-500/15"
    }>
      {isActive ? "ATIVA" : "PAUSADA"}
    </Badge>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  sub?: string;
  isLoading: boolean;
  highlight?: CplStatus;
}

function MetricCard({ title, value, sub, isLoading, highlight }: MetricCardProps) {
  const borderColor =
    highlight === "critical" ? "border-red-500/50" :
    highlight === "warning" ? "border-yellow-500/50" : "";

  return (
    <Card className={borderColor}>
      <CardHeader className="pb-1 pt-4 px-4">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4 px-4">
        {isLoading ? (
          <Skeleton className="h-7 w-28 mt-1" />
        ) : (
          <>
            <p className={`text-2xl font-bold tracking-tight ${
              highlight === "critical" ? "text-red-600" :
              highlight === "warning" ? "text-yellow-600" : ""
            }`}>
              {value}
            </p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function SkeletonRow() {
  return (
    <TableRow>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <TableCell key={i}><Skeleton className="h-4 w-full" /></TableCell>
      ))}
    </TableRow>
  );
}

const PERIOD_LABELS: Record<MetaAdsPeriod, string> = {
  today: "Hoje",
  last_7d: "Últimos 7 dias",
  last_30d: "Últimos 30 dias",
};

// -----------------------------------------------------------------------
// Estado A — Sem conexão
// -----------------------------------------------------------------------
function NoConnectionState({ onConnect, isConnecting }: { onConnect: () => void; isConnecting: boolean }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <Card className="p-8 shadow-lg border-border/50">
          {/* Logo Meta simulado */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-md">
              <TrendingUp className="w-9 h-9 text-white" />
            </div>
          </div>

          <h2 className="text-xl font-bold text-foreground mb-2">
            Conecte sua conta de anúncios
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Visualize o desempenho das suas campanhas diretamente aqui
          </p>

          <Button
            onClick={onConnect}
            disabled={isConnecting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5"
            size="lg"
          >
            {isConnecting ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Redirecionando…
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4 mr-2" />
                Conectar com Meta Ads
              </>
            )}
          </Button>

          <div className="mt-4 flex items-center justify-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Seus dados são seguros. Nunca pedimos sua senha.
            </span>
          </div>
        </Card>

        <div className="flex items-center justify-center gap-2">
          <Badge
            variant="outline"
            className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/30 dark:text-emerald-400"
          >
            <Shield className="w-3 h-3 mr-1" />
            Seguro
          </Badge>
          <span className="text-xs text-muted-foreground">
            Conexão via OAuth 2.0 certificada pela Meta
          </span>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------
// Estado C — Token expirado
// -----------------------------------------------------------------------
function ExpiredConnectionState({ onReconnect, isConnecting }: { onReconnect: () => void; isConnecting: boolean }) {
  return (
    <div className="flex flex-col gap-6 p-6">
      <Alert className="border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertTitle className="text-yellow-700">Sua conexão expirou</AlertTitle>
        <AlertDescription className="flex items-center justify-between gap-4 flex-wrap">
          <span>Reconecte para continuar vendo seus dados de anúncios.</span>
          <Button
            size="sm"
            onClick={onReconnect}
            disabled={isConnecting}
            className="bg-yellow-600 hover:bg-yellow-700 text-white shrink-0"
          >
            {isConnecting ? (
              <><RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />Reconectando…</>
            ) : (
              "Reconectar"
            )}
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}

// -----------------------------------------------------------------------
// Estado B — Com conexão ativa (métricas completas)
// -----------------------------------------------------------------------
interface ConnectedStateProps {
  orgId: string;
  accountName: string | null;
  onDisconnect: () => void;
  isDisconnecting: boolean;
}

function ConnectedState({ orgId, accountName, onDisconnect, isDisconnecting }: ConnectedStateProps) {
  const [period, setPeriod] = useState<MetaAdsPeriod>("today");
  const { data, isLoading, isError, error, refetch, isFetching } = useMetaAdsInsights(period, orgId);

  useAdsAlerts(data);

  const account = data?.account;
  const campaigns: MetaAdsCampaign[] = data?.campaigns ?? [];
  const accountStatus = account ? getCplStatus(account.cpl, account.spend, account.leads) : "ok";

  const showAlert =
    !isLoading && !isError && account &&
    (accountStatus === "critical" || accountStatus === "warning");

  const hasNoCampaigns = !isLoading && !isError && campaigns.length === 0;
  const hasNoSpend = !isLoading && !isError && account && account.spend === 0 && !hasNoCampaigns;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-semibold">Anúncios Meta</h1>
          {accountName && (
            <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-400/40 hover:bg-emerald-500/20">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Conectado: {accountName}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <button
            onClick={onDisconnect}
            disabled={isDisconnecting}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors underline underline-offset-2 disabled:opacity-50"
          >
            {isDisconnecting ? "Desconectando…" : "Desconectar"}
          </button>
        </div>
      </div>

      {/* Period tabs */}
      <Tabs value={period} onValueChange={(v) => setPeriod(v as MetaAdsPeriod)}>
        <TabsList>
          <TabsTrigger value="today">Hoje</TabsTrigger>
          <TabsTrigger value="last_7d">Últimos 7 dias</TabsTrigger>
          <TabsTrigger value="last_30d">Últimos 30 dias</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Error state */}
      {isError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar dados</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "Não foi possível conectar à Meta API. Verifique a conexão."}
          </AlertDescription>
        </Alert>
      )}

      {/* Alert: performance ruim */}
      {showAlert && (
        <Alert className={
          accountStatus === "critical"
            ? "border-red-500/50 bg-red-50/50 dark:bg-red-950/20"
            : "border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20"
        }>
          <AlertTriangle className={`h-4 w-4 ${accountStatus === "critical" ? "text-red-600" : "text-yellow-600"}`} />
          <AlertTitle className={accountStatus === "critical" ? "text-red-700" : "text-yellow-700"}>
            {accountStatus === "critical" ? "Performance crítica" : "Atenção necessária"}
          </AlertTitle>
          <AlertDescription>
            {account && account.leads === 0 && account.spend >= 50
              ? `Foram gastos ${fmtBRL(account.spend)} sem nenhum lead gerado em "${PERIOD_LABELS[period]}".`
              : `CPL atual de ${fmtBRL(account?.cpl ?? 0)} está ${accountStatus === "critical" ? "acima de R$50" : "entre R$30 e R$50"}. Revise as campanhas.`}
          </AlertDescription>
        </Alert>
      )}

      {hasNoCampaigns && !isError && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Nenhuma campanha encontrada</AlertTitle>
          <AlertDescription>
            A conta Meta Ads não possui campanhas para o período selecionado.
          </AlertDescription>
        </Alert>
      )}

      {hasNoSpend && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Sem investimento {PERIOD_LABELS[period].toLowerCase()}</AlertTitle>
          <AlertDescription>
            Nenhum valor foi investido neste período. As campanhas podem estar pausadas.
          </AlertDescription>
        </Alert>
      )}

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard title="Gasto" value={account ? fmtBRL(account.spend) : "—"} isLoading={isLoading} />
        <MetricCard title="Leads" value={account ? fmtNumber(account.leads) : "—"} isLoading={isLoading} />
        <MetricCard
          title="CPL" value={account ? fmtBRL(account.cpl) : "—"} sub="Custo por lead"
          isLoading={isLoading}
          highlight={account ? getCplStatus(account.cpl, account.spend, account.leads) : "ok"}
        />
        <MetricCard title="CTR" value={account ? fmtPercent(account.ctr) : "—"} sub="Taxa de clique" isLoading={isLoading} />
        <MetricCard title="Impressões" value={account ? fmtNumber(account.impressions) : "—"} isLoading={isLoading} />
        <MetricCard title="Cliques" value={account ? fmtNumber(account.clicks) : "—"} isLoading={isLoading} />
      </div>

      {/* Campaigns table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">
            Campanhas — {PERIOD_LABELS[period]}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Campanha</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Orçamento/dia</TableHead>
                <TableHead className="text-right">Gasto</TableHead>
                <TableHead className="text-right">Leads</TableHead>
                <TableHead className="text-right">CPL</TableHead>
                <TableHead className="text-right pr-4">Performance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <><SkeletonRow /><SkeletonRow /><SkeletonRow /></>
              ) : campaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-sm">
                    Nenhuma campanha para exibir
                  </TableCell>
                </TableRow>
              ) : (
                campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="pl-4 font-medium max-w-[220px] truncate" title={campaign.name}>
                      {campaign.name}
                    </TableCell>
                    <TableCell><StatusBadge status={campaign.status} /></TableCell>
                    <TableCell className="text-right text-sm">
                      {campaign.daily_budget != null ? fmtBRL(campaign.daily_budget) : "—"}
                    </TableCell>
                    <TableCell className="text-right text-sm">{fmtBRL(campaign.spend)}</TableCell>
                    <TableCell className="text-right text-sm">{fmtNumber(campaign.leads)}</TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {campaign.leads > 0 ? fmtBRL(campaign.cpl) : "—"}
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <CplBadge cpl={campaign.cpl} spend={campaign.spend} leads={campaign.leads} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        Dados atualizados automaticamente a cada 5 minutos via Meta Graph API v21.0
      </p>
    </div>
  );
}

// -----------------------------------------------------------------------
// Main page — FranqueadoAnuncios
// -----------------------------------------------------------------------
export default function FranqueadoAnuncios() {
  const [searchParams] = useSearchParams();
  const [isConnecting, setIsConnecting] = useState(false);

  const { data: orgId } = useUserOrgId();
  const { connections, disconnect } = useAdsConnections();
  const connectionStatus = useAdsConnectionStatus();
  const initiateOAuth = useInitiateMetaOAuth();

  // Mostrar toast quando OAuth callback retorna com ?connected=true
  useEffect(() => {
    if (searchParams.get("connected") === "true") {
      toast.success("Conta conectada com sucesso!", {
        description: "Seus dados de anúncios já estão disponíveis.",
        id: "ads-connected",
      });
    }
  }, [searchParams]);

  // WORKAROUND: ads-oauth-start não está deployed — usa RPC + ads-get-config
  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const url = await initiateOAuth.mutateAsync();
      window.location.href = url;
    } catch (err) {
      reportError(err, { title: "Erro ao iniciar conexão", category: "anuncios.connect" });
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    // Usar 'status' em vez do antigo 'is_active'
    const activeConnection = connections.find((c) => c.status === "active");
    if (!activeConnection) return;
    try {
      await disconnect.mutateAsync(activeConnection.id);
      toast.success("Conta desconectada com sucesso.");
    } catch (err) {
      reportError(err, { title: "Erro ao desconectar. Tente novamente.", category: "anuncios.disconnect" });
    }
  };

  // Status ainda carregando — aguardar antes de decidir qual estado renderizar
  if (connectionStatus.isLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}><CardContent className="pt-4 pb-4"><Skeleton className="h-14 w-full" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  // Estado C — token expirado
  if (connectionStatus.data?.isExpired) {
    return <ExpiredConnectionState onReconnect={handleConnect} isConnecting={isConnecting} />;
  }

  // Estado A — sem conexão
  if (!connectionStatus.data?.hasActiveConnection) {
    return <NoConnectionState onConnect={handleConnect} isConnecting={isConnecting} />;
  }

  // Estado B — com conexão ativa
  return (
    <ConnectedState
      orgId={orgId!}
      accountName={connectionStatus.data?.accountName ?? null}
      onDisconnect={handleDisconnect}
      isDisconnecting={disconnect.isPending}
    />
  );
}
