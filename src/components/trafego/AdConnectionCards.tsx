import { useState, useEffect } from "react";
import { logger } from "@/lib/logger";
import { Globe, Users, RefreshCw, Unplug, Loader2, ExternalLink, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdConnections, useSyncMetrics, useDisconnectAd, useSelectAdAccount, getOAuthUrl, AdConnection } from "@/hooks/useAdPlatforms";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const platformConfig = {
  google_ads: {
    label: "Google Ads",
    icon: Globe,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
  },
  meta_ads: {
    label: "Meta Ads",
    icon: Users,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
  },
};

interface AdAccountOption {
  account_id: string;
  name: string;
}

export function AdConnectionCards() {
  const { data: connections, isLoading } = useAdConnections();
  const { data: orgId } = useUserOrgId();
  const syncMutation = useSyncMetrics();
  const disconnectMutation = useDisconnectAd();
  const selectAccountMutation = useSelectAdAccount();
  const queryClient = useQueryClient();
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerConnectionId, setPickerConnectionId] = useState<string | null>(null);
  const [pickerAccounts, setPickerAccounts] = useState<AdAccountOption[]>([]);
  const [syncPeriodByConn, setSyncPeriodByConn] = useState<Record<string, number>>({});

  const handleConnect = async (platform: "google_ads" | "meta_ads") => {
    if (!orgId) {
      toast({ title: "Erro", description: "Organização não encontrada.", variant: "destructive" });
      return;
    }

    setConnectingPlatform(platform);
    try {
      const url = await getOAuthUrl(platform, orgId);
      const w = window.open(url, "_blank", "noopener,noreferrer");
      if (!w) {
        window.open(url, "_blank");
      }
      toast({
        title: "Autorização iniciada",
        description: "Complete a autorização na nova aba. Ao finalizar, você será redirecionado de volta.",
      });
    } catch (err: unknown) {
      toast({ title: "Erro ao iniciar conexão", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
      setConnectingPlatform(null);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const adsConnected = params.get("ads_connected");
    const adsError = params.get("ads_error");
    const adsPickAccount = params.get("ads_pick_account");
    const adsAccounts = params.get("ads_accounts");

    if (adsPickAccount && adsAccounts) {
      try {
        const accounts = JSON.parse(adsAccounts) as AdAccountOption[];
        setPickerConnectionId(adsPickAccount);
        setPickerAccounts(accounts);
        setPickerOpen(true);
      } catch (e) {
        logger.error("Failed to parse ads_accounts:", e);
      }
      window.history.replaceState({}, "", window.location.pathname);
      setConnectingPlatform(null);
      return;
    }

    if (adsConnected) {
      const label = adsConnected === "google_ads" ? "Google Ads" : "Meta Ads";
      toast({ title: `${label} conectado com sucesso!`, description: "Agora você pode sincronizar suas métricas." });
      queryClient.invalidateQueries({ queryKey: ["ad-connections"] });
      window.history.replaceState({}, "", window.location.pathname);
      setConnectingPlatform(null);
    }

    if (adsError) {
      const errorMessages: Record<string, string> = {
        credentials_not_configured: "Credenciais da plataforma não configuradas no backend.",
        token_exchange_failed: "Falha ao trocar o código de autorização. Tente novamente.",
        save_failed: "Erro ao salvar a conexão. Tente novamente.",
        invalid_platform: "Plataforma inválida.",
        access_denied: "Acesso negado. Você precisa autorizar o acesso.",
        no_ad_account: "Nenhuma conta de anúncios encontrada. Para Google Ads, verifique se o Developer Token possui nível 'Basic Access'. Para Meta, verifique se sua conta tem um gerenciador de anúncios ativo.",
      };
      toast({
        title: "Erro na conexão",
        description: errorMessages[adsError] || `Erro: ${adsError}`,
        variant: "destructive",
      });
      window.history.replaceState({}, "", window.location.pathname);
      setConnectingPlatform(null);
    }
  }, []);

  const handleSelectAccount = async (account: AdAccountOption) => {
    if (!pickerConnectionId) return;
    try {
      // pickerConnectionId pode ser org_id (novo fluxo) ou connection_id (legado)
      const { data: conn } = await supabase
        .from("ad_platform_connections")
        .select("id, status")
        .eq("organization_id", pickerConnectionId)
        .eq("platform", "meta_ads")
        .eq("status", "pending")
        .maybeSingle();

      const connectionId = conn?.id || pickerConnectionId;

      await selectAccountMutation.mutateAsync({
        connection_id: connectionId,
        account_id: account.account_id,
        account_name: account.name,
      });
      setPickerOpen(false);
      setPickerConnectionId(null);
      setPickerAccounts([]);
    } catch (err) {
      toast({
        title: "Erro ao selecionar conta",
        description: err instanceof Error ? err.message : "Tente novamente",
        variant: "destructive",
      });
    }
  };

  const getConnection = (platform: string): AdConnection | undefined =>
    connections?.find((c) => c.platform === platform && c.status === "active");

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(["google_ads", "meta_ads"] as const).map((platform) => {
          const config = platformConfig[platform];
          const conn = getConnection(platform);
          const Icon = config.icon;
          const isConnecting = connectingPlatform === platform;

          return (
            <Card key={platform} className={conn ? `${config.borderColor} border-2` : ""}>
              <CardContent className="py-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${config.bgColor}`}>
                    <Icon className={`w-6 h-6 ${config.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold">{config.label}</p>
                    {conn ? (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        <span className="text-xs text-muted-foreground">{conn.account_name || "Conta conectada"}</span>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-0.5">Não conectado</p>
                    )}
                  </div>
                  {conn && (
                    <Badge variant="outline" className="text-[9px] border-green-500/30 text-green-600">Ativo</Badge>
                  )}
                </div>

                {conn ? (
                  <div className="space-y-3">
                    {conn.last_synced_at && (
                      <p className="text-[10px] text-muted-foreground">
                        Último sync: {format(new Date(conn.last_synced_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </p>
                    )}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">Período:</span>
                        <Select
                          value={String(syncPeriodByConn[conn.id] ?? 30)}
                          onValueChange={(v) => setSyncPeriodByConn((p) => ({ ...p, [conn.id]: Number(v) }))}
                        >
                          <SelectTrigger className="h-7 text-xs flex-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="7">Últimos 7 dias</SelectItem>
                            <SelectItem value="30">Últimos 30 dias</SelectItem>
                            <SelectItem value="90">Últimos 90 dias</SelectItem>
                            <SelectItem value="180">Últimos 6 meses</SelectItem>
                            <SelectItem value="365">Último 1 ano</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs gap-1.5"
                          onClick={() =>
                            syncMutation.mutate(
                              { connectionId: conn.id, periodDays: syncPeriodByConn[conn.id] ?? 30 },
                              {
                                onError: (err: unknown) => {
                                  const msg = err instanceof Error ? err.message : String(err);
                                  if (/permiss[ãa]o|permission|code":200/i.test(msg)) {
                                    toast({
                                      title: "Sem permissão para esta conta",
                                      description: 'Clique em "Trocar" para selecionar outra conta de anúncios.',
                                      variant: "destructive",
                                    });
                                  } else {
                                    toast({ title: "Erro ao sincronizar", description: msg, variant: "destructive" });
                                  }
                                },
                              },
                            )
                          }
                          disabled={syncMutation.isPending}
                        >
                          {syncMutation.isPending ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="w-3.5 h-3.5" />
                          )}
                          Sincronizar
                        </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs gap-1.5"
                        onClick={async () => {
                          await disconnectMutation.mutateAsync(conn.id);
                          handleConnect(platform);
                        }}
                        disabled={disconnectMutation.isPending}
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Trocar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs gap-1.5 text-destructive"
                        onClick={() => disconnectMutation.mutate(conn.id)}
                        disabled={disconnectMutation.isPending}
                      >
                        <Unplug className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    </div>
                  </div>
                ) : (
                  <Button
                    className="w-full text-xs gap-1.5"
                    onClick={() => handleConnect(platform)}
                    disabled={isConnecting}
                  >
                    {isConnecting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ExternalLink className="w-3.5 h-3.5" />
                    )}
                    {isConnecting ? "Aguardando autorização..." : `Conectar ${config.label}`}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Account Picker Dialog */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Selecionar Conta de Anúncios</DialogTitle>
            <DialogDescription>
              Foram encontradas múltiplas contas de anúncios. Escolha qual deseja conectar:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {pickerAccounts.map((account) => (
              <Button
                key={account.account_id}
                variant="outline"
                className="w-full justify-start text-left h-auto py-3"
                onClick={() => handleSelectAccount(account)}
                disabled={selectAccountMutation.isPending}
              >
                <div>
                  <p className="text-sm font-medium">{account.name}</p>
                  <p className="text-xs text-muted-foreground">ID: {account.account_id}</p>
                </div>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
