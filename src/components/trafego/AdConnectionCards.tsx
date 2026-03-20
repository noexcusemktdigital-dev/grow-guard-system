import { useState, useEffect } from "react";
import { Globe, Users, RefreshCw, Unplug, Loader2, ExternalLink, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAdConnections, useSyncMetrics, useDisconnectAd, getOAuthUrl, AdConnection } from "@/hooks/useAdPlatforms";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/lib/supabase";
import { useUserOrgId } from "@/hooks/useUserOrgId";

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
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);

  const handleConnect = async (platform: "google_ads" | "meta_ads") => {
    const redirectUri = `${window.location.origin}/cliente/trafego-pago?oauth_callback=true&platform=${platform}`;
    const url = getOAuthUrl(platform, redirectUri);
    window.open(url, "_blank", "width=600,height=700");
  };

  // Handle OAuth callback
  useState(() => {
    const params = new URLSearchParams(window.location.search);
    const isCallback = params.get("oauth_callback");
    const code = params.get("code");
    const platform = params.get("platform");

    if (isCallback && code && platform && orgId) {
      setConnectingPlatform(platform);
      const redirectUri = `${window.location.origin}/cliente/trafego-pago?oauth_callback=true&platform=${platform}`;

      supabase.functions.invoke("ads-oauth-callback", {
        body: { platform, code, redirect_uri: redirectUri, organization_id: orgId },
      }).then(({ error }) => {
        setConnectingPlatform(null);
        // Clean URL
        window.history.replaceState({}, "", window.location.pathname);
      });
    }
  });

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
                  Conectar {config.label}
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
