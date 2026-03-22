import { useState, useEffect } from "react";
import { Globe, Users, RefreshCw, Unplug, Loader2, ExternalLink, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAdConnections, useSyncMetrics, useDisconnectAd, getOAuthUrl, AdConnection } from "@/hooks/useAdPlatforms";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

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

export function AdConnectionCards() {
  const { data: connections, isLoading } = useAdConnections();
  const { data: orgId } = useUserOrgId();
  const syncMutation = useSyncMetrics();
  const disconnectMutation = useDisconnectAd();
  const queryClient = useQueryClient();
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);

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
    } catch (err: any) {
      toast({ title: "Erro ao iniciar conexão", description: err.message, variant: "destructive" });
      setConnectingPlatform(null);
    }
  };

  // Handle return from OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const adsConnected = params.get("ads_connected");
    const adsError = params.get("ads_error");

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

  const getConnection = (platform: string): AdConnection | undefined =>
    connections?.find((c) => c.platform === platform && c.status === "active");

  return (
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
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs gap-1.5"
                      onClick={() => syncMutation.mutate(conn.id)}
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
  );
}
