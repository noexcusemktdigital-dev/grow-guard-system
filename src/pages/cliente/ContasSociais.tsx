// @ts-nocheck
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Share2, LayoutDashboard, Send, Link2 } from "lucide-react";
import { toast } from "sonner";
import { reportError } from "@/lib/error-toast";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useSocialAccounts } from "@/hooks/useSocialAccounts";
import { SocialAccountsTab, PLATFORMS } from "@/components/social/SocialAccountsTab";
import { SocialOverviewTab } from "@/components/social/SocialOverviewTab";
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
      reportError(new Error(String(error)), { title: errorMessages[error] ?? `Erro ao conectar: ${error}`, category: "contas_sociais.connect" });
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const tab = searchParams.get("tab") ?? "overview";

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="Redes Sociais"
        subtitle="Acompanhe sua performance, publique conteúdo e gere insights para o resto do seu marketing"
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
          <TabsTrigger value="overview" className="gap-1.5"><LayoutDashboard className="w-3.5 h-3.5" /> Visão Geral</TabsTrigger>
          <TabsTrigger value="publish" className="gap-1.5"><Send className="w-3.5 h-3.5" /> Publicar</TabsTrigger>
          <TabsTrigger value="accounts" className="gap-1.5"><Link2 className="w-3.5 h-3.5" /> Contas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <SocialOverviewTab accounts={accounts ?? []} />
        </TabsContent>

        <TabsContent value="publish" className="mt-4">
          <SocialPublishTab accounts={accounts ?? []} />
        </TabsContent>

        <TabsContent value="accounts" className="mt-4 space-y-4">
          <SocialAccountsTab accounts={accounts ?? []} isLoading={isLoading} isError={isError} />
          <p className="text-xs text-muted-foreground">
            As conexões com redes sociais permitem publicar conteúdo diretamente e visualizar métricas de engajamento. Google Ads e TikTok estarão disponíveis em breve.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}

