// @ts-nocheck
import { useState } from "react";
import { RefreshCw, TrendingUp, AlertTriangle, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useMetaAdsInsights,
  type MetaAdsPeriod,
  type MetaAdsCampaign,
} from "@/hooks/use-meta-ads";
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
    return (
      <Badge variant="destructive" className="text-xs font-semibold">
        CRÍTICO
      </Badge>
    );
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
    <Badge
      className={
        isActive
          ? "bg-emerald-500/15 text-emerald-700 border-emerald-400/40 text-xs hover:bg-emerald-500/20"
          : "bg-zinc-500/10 text-zinc-500 border-zinc-400/30 text-xs hover:bg-zinc-500/15"
      }
    >
      {isActive ? "ATIVA" : "PAUSADA"}
    </Badge>
  );
}

// -----------------------------------------------------------------------
// Metric card
// -----------------------------------------------------------------------
interface MetricCardProps {
  title: string;
  value: string;
  sub?: string;
  isLoading: boolean;
  highlight?: CplStatus;
}

function MetricCard({ title, value, sub, isLoading, highlight }: MetricCardProps) {
  const borderColor =
    highlight === "critical"
      ? "border-red-500/50"
      : highlight === "warning"
        ? "border-yellow-500/50"
        : "";

  return (
    <Card className={`${borderColor}`}>
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
            <p
              className={`text-2xl font-bold tracking-tight ${
                highlight === "critical"
                  ? "text-red-600"
                  : highlight === "warning"
                    ? "text-yellow-600"
                    : ""
              }`}
            >
              {value}
            </p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// -----------------------------------------------------------------------
// Campaign table row skeleton
// -----------------------------------------------------------------------
function SkeletonRow() {
  return (
    <TableRow>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <TableCell key={i}>
          <Skeleton className="h-4 w-full" />
        </TableCell>
      ))}
    </TableRow>
  );
}

// -----------------------------------------------------------------------
// Main page
// -----------------------------------------------------------------------
const PERIOD_LABELS: Record<MetaAdsPeriod, string> = {
  today: "Hoje",
  last_7d: "Últimos 7 dias",
  last_30d: "Últimos 30 dias",
};

export default function Anuncios() {
  const [period, setPeriod] = useState<MetaAdsPeriod>("today");
  const { data, isLoading, isError, error, refetch, isFetching } = useMetaAdsInsights(period);

  // FUNC-ADS-002: alertas proativos de CPL alto
  useAdsAlerts(data);

  const account = data?.account;
  const campaigns: MetaAdsCampaign[] = data?.campaigns ?? [];

  const accountStatus = account
    ? getCplStatus(account.cpl, account.spend, account.leads)
    : "ok";

  // Alerta geral: CPL alto ou sem leads com gasto > R$50
  const showAlert =
    !isLoading &&
    !isError &&
    account &&
    (accountStatus === "critical" || accountStatus === "warning");

  // Banner: conta sem dados (todos zeros e sem campanhas ativas)
  const hasNoCampaigns =
    !isLoading && !isError && campaigns.length === 0;

  const hasNoSpend =
    !isLoading && !isError && account && account.spend === 0 && !hasNoCampaigns;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-semibold">Anúncios Meta</h1>
          <Badge variant="outline" className="text-xs">NOE FRANQUIA</Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
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
            {error instanceof Error ? error.message : "Não foi possível conectar à Meta API. Verifique o token de acesso."}
          </AlertDescription>
        </Alert>
      )}

      {/* Alert: performance ruim */}
      {showAlert && (
        <Alert
          className={
            accountStatus === "critical"
              ? "border-red-500/50 bg-red-50/50 dark:bg-red-950/20"
              : "border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20"
          }
        >
          <AlertTriangle
            className={`h-4 w-4 ${accountStatus === "critical" ? "text-red-600" : "text-yellow-600"}`}
          />
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

      {/* Banner: sem campanhas */}
      {hasNoCampaigns && !isError && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Nenhuma campanha encontrada</AlertTitle>
          <AlertDescription>
            A conta Meta Ads não possui campanhas para o período selecionado, ou todas estão arquivadas.
          </AlertDescription>
        </Alert>
      )}

      {/* Banner: sem gasto */}
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
        <MetricCard
          title="Gasto"
          value={account ? fmtBRL(account.spend) : "—"}
          isLoading={isLoading}
        />
        <MetricCard
          title="Leads"
          value={account ? fmtNumber(account.leads) : "—"}
          isLoading={isLoading}
        />
        <MetricCard
          title="CPL"
          value={account ? fmtBRL(account.cpl) : "—"}
          sub="Custo por lead"
          isLoading={isLoading}
          highlight={account ? getCplStatus(account.cpl, account.spend, account.leads) : "ok"}
        />
        <MetricCard
          title="CTR"
          value={account ? fmtPercent(account.ctr) : "—"}
          sub="Taxa de clique"
          isLoading={isLoading}
        />
        <MetricCard
          title="Impressões"
          value={account ? fmtNumber(account.impressions) : "—"}
          isLoading={isLoading}
        />
        <MetricCard
          title="Cliques"
          value={account ? fmtNumber(account.clicks) : "—"}
          isLoading={isLoading}
        />
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
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
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
                    <TableCell>
                      <StatusBadge status={campaign.status} />
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {campaign.daily_budget != null ? fmtBRL(campaign.daily_budget) : "—"}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {fmtBRL(campaign.spend)}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {fmtNumber(campaign.leads)}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {campaign.leads > 0 ? fmtBRL(campaign.cpl) : "—"}
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <CplBadge
                        cpl={campaign.cpl}
                        spend={campaign.spend}
                        leads={campaign.leads}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Footer note */}
      <p className="text-xs text-muted-foreground text-center">
        Dados atualizados automaticamente a cada 5 minutos via Meta Graph API v21.0
      </p>
    </div>
  );
}
