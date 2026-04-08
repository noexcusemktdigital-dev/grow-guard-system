import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Share2, Instagram, Facebook, Linkedin, RefreshCw, Unplug, Link2, Clock } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useSocialAccounts,
  useConnectSocialAccount,
  useDisconnectSocialAccount,
  type SocialAccount,
} from "@/hooks/useSocialAccounts";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

// ─── Platform config ──────────────────────────────────────────────────────────

interface PlatformConfig {
  key: SocialAccount["platform"];
  label: string;
  icon: React.ReactNode;
  gradient: string;
  comingSoon?: boolean;
}

const PLATFORMS: PlatformConfig[] = [
  {
    key: "instagram",
    label: "Instagram",
    icon: <Instagram className="w-6 h-6 text-white" />,
    gradient: "from-purple-500 via-pink-500 to-orange-400",
  },
  {
    key: "facebook",
    label: "Facebook",
    icon: <Facebook className="w-6 h-6 text-white" />,
    gradient: "from-blue-600 to-blue-500",
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
    gradient: "from-[#0077B5] to-[#005f94]",
  },
  {
    key: "google_ads",
    label: "Google Ads",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6">
        <path fill="#4285F4" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" opacity="0" />
        <path fill="#EA4335" d="M4.8 12.8L1.6 7A10 10 0 0 0 12 22l3.2-5.5A5 5 0 0 1 4.8 12.8z" />
        <path fill="#FBBC04" d="M22.4 7H15.6a5 5 0 0 1 .4 2 5 5 0 0 1-5 5L7.8 19.5A10 10 0 0 0 22.4 7z" />
        <path fill="#4285F4" d="M12 7a5 5 0 0 1 3.6 1.5L19 3A10 10 0 0 0 1.6 7h10.4z" />
      </svg>
    ),
    gradient: "from-slate-500 to-slate-600",
    comingSoon: true,
  },
  {
    key: "tiktok",
    label: "TikTok",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.77 1.52V6.74a4.85 4.85 0 0 1-1-.05z" />
      </svg>
    ),
    gradient: "from-black to-gray-800",
    comingSoon: true,
  },
];

// ─── Status helpers ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: SocialAccount["status"] }) {
  if (status === "active") {
    return (
      <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/20 text-[10px]">
        Ativo
      </Badge>
    );
  }
  if (status === "expired") {
    return (
      <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/20 text-[10px]">
        Expirado
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="text-[10px]">
      Desconectado
    </Badge>
  );
}

// ─── Platform Card ────────────────────────────────────────────────────────────

interface PlatformCardProps {
  config: PlatformConfig;
  account: SocialAccount | undefined;
  onConnect: (platform: SocialAccount["platform"]) => void;
  onDisconnect: (id: string) => void;
  isDisconnecting: boolean;
}

function PlatformCard({ config, account, onConnect, onDisconnect, isDisconnecting }: PlatformCardProps) {
  const isConnected = account && account.status === "active";
  const isExpiredOrDisconnected = account && (account.status === "expired" || account.status === "disconnected");

  return (
    <Card className="relative overflow-hidden border border-border/50 hover:border-border transition-colors">
      {/* Gradient header strip */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${config.gradient}`} />

      <CardContent className="p-5 space-y-4">
        {/* Platform identity */}
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center flex-shrink-0 shadow-sm`}>
            {config.icon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm text-foreground">{config.label}</span>
              {config.comingSoon && (
                <Badge variant="outline" className="text-[9px] px-1.5 h-4 rounded-full">
                  Em breve
                </Badge>
              )}
            </div>
            {isConnected && account.account_name && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">{account.account_name}</p>
            )}
          </div>
        </div>

        {/* Account details if connected */}
        {account && !config.comingSoon ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <StatusBadge status={account.status} />
              {account.last_synced_at && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Último sync:{" "}
                  {formatDistanceToNow(new Date(account.last_synced_at), { addSuffix: true, locale: ptBR })}
                </span>
              )}
            </div>
            {account.account_username && (
              <p className="text-xs text-muted-foreground font-mono">@{account.account_username}</p>
            )}
          </div>
        ) : !config.comingSoon ? (
          <p className="text-xs text-muted-foreground">Não conectado</p>
        ) : null}

        {/* Action button */}
        {!config.comingSoon && (
          <div className="pt-1">
            {isConnected ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full text-destructive border-destructive/30 hover:bg-destructive/10 hover:border-destructive/50 gap-1.5"
                onClick={() => onDisconnect(account!.id)}
                disabled={isDisconnecting}
              >
                <Unplug className="w-3.5 h-3.5" />
                Desconectar
              </Button>
            ) : isExpiredOrDisconnected ? (
              <Button
                size="sm"
                className="w-full gap-1.5"
                onClick={() => onConnect(config.key)}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reconectar
              </Button>
            ) : (
              <Button
                size="sm"
                className={`w-full gap-1.5 bg-gradient-to-r ${config.gradient} hover:opacity-90 text-white border-0`}
                onClick={() => onConnect(config.key)}
              >
                <Link2 className="w-3.5 h-3.5" />
                Conectar
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ContasSociais() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: accounts, isLoading, isError } = useSocialAccounts();
  const connect = useConnectSocialAccount();
  const disconnect = useDisconnectSocialAccount();

  // Handle OAuth callback result from URL params
  useEffect(() => {
    const connected = searchParams.get("connected");
    const platform = searchParams.get("platform");
    const error = searchParams.get("error");

    if (connected === "true" && platform) {
      const platformLabel = PLATFORMS.find(p => p.key === platform)?.label ?? platform;
      toast.success(`${platformLabel} conectado com sucesso!`);
      setSearchParams({}, { replace: true });
    } else if (error) {
      const errorMessages: Record<string, string> = {
        access_denied: "Permissão negada pelo usuário.",
        token_exchange_failed: "Falha ao obter token de acesso.",
        missing_org: "Organização não identificada.",
        invalid_state: "Sessão inválida. Tente novamente.",
      };
      toast.error(errorMessages[error] ?? `Erro ao conectar: ${error}`);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Map accounts by platform for easy lookup
  const accountByPlatform = (accounts ?? []).reduce<Partial<Record<SocialAccount["platform"], SocialAccount>>>(
    (acc, item) => {
      // Keep the most recent/active entry per platform
      const existing = acc[item.platform];
      if (!existing || item.status === "active" || new Date(item.created_at) > new Date(existing.created_at)) {
        acc[item.platform] = item;
      }
      return acc;
    },
    {}
  );

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="Contas Sociais"
        subtitle="Conecte suas redes sociais para publicar e acompanhar métricas"
        icon={<Share2 className="w-5 h-5 text-primary" />}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PLATFORMS.map(p => (
            <Skeleton key={p.key} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Erro ao carregar contas sociais. Tente recarregar a página.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PLATFORMS.map(config => (
            <PlatformCard
              key={config.key}
              config={config}
              account={accountByPlatform[config.key]}
              onConnect={connect}
              onDisconnect={(id) => disconnect.mutate(id)}
              isDisconnecting={disconnect.isPending}
            />
          ))}
        </div>
      )}

      {/* Info note */}
      <p className="text-xs text-muted-foreground">
        As conexões com redes sociais permitem publicar conteúdo diretamente e visualizar métricas de engajamento no dashboard.
        Google Ads e TikTok estarão disponíveis em breve.
      </p>
    </div>
  );
}
