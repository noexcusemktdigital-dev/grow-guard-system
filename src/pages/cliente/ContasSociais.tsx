// @ts-nocheck
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Share2, BarChart3, Send, Link2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useSocialAccounts } from "@/hooks/useSocialAccounts";
import { SocialAccountsTab, PLATFORMS } from "@/components/social/SocialAccountsTab";
import { SocialAnalyticsTab } from "@/components/social/SocialAnalyticsTab";
import { SocialPublishTab } from "@/components/social/SocialPublishTab";

export default function ContasSociais() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: accounts, isLoading, isError } = useSocialAccounts();

  useEffect(() => {
    const connected = searchParams.get("connected");
    const platform = searchParams.get("platform");
    const error = searchParams.get("error");
    if (connected === "true" && platform) {
      const platformLabel = PLATFORMS.find((p) => p.key === platform)?.label ?? platform;
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

  const tab = searchParams.get("tab") ?? "accounts";

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="Redes Sociais"
        subtitle="Conecte, analise e publique nas suas redes em um só lugar"
        icon={<Share2 className="w-5 h-5 text-primary" />}
      />

      <Tabs
        value={tab}
        onValueChange={(v) => {
          const params = new URLSearchParams(searchParams);
          params.set("tab", v);
          setSearchParams(params, { replace: true });
        }}
      >
        <TabsList>
          <TabsTrigger value="accounts" className="gap-1.5"><Link2 className="w-3.5 h-3.5" /> Contas</TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5"><BarChart3 className="w-3.5 h-3.5" /> Analytics</TabsTrigger>
          <TabsTrigger value="publish" className="gap-1.5"><Send className="w-3.5 h-3.5" /> Publicações</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="mt-4 space-y-4">
          <SocialAccountsTab accounts={accounts ?? []} isLoading={isLoading} isError={isError} />
          <p className="text-xs text-muted-foreground">
            As conexões com redes sociais permitem publicar conteúdo diretamente e visualizar métricas de engajamento. Google Ads e TikTok estarão disponíveis em breve.
          </p>
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <SocialAnalyticsTab accounts={accounts ?? []} />
        </TabsContent>

        <TabsContent value="publish" className="mt-4">
          <SocialPublishTab accounts={accounts ?? []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
