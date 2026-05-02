// @ts-nocheck
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/PageHeader";
import { AssessoriaPopup } from "@/components/shared/AssessoriaPopup";
import { Share2, BarChart3, Send, Link2 } from "lucide-react";
import { toast } from "sonner";
import { reportError } from "@/lib/error-toast";
import { useSocialAccounts } from "@/hooks/useSocialAccounts";
import { SocialAccountsTab, PLATFORMS } from "@/components/social/SocialAccountsTab";
import { SocialAnalyticsTab } from "@/components/social/SocialAnalyticsTab";
import { SocialPublishTab } from "@/components/social/SocialPublishTab";

export default function ClienteRedesSociaisHub() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: accounts, isLoading, isError } = useSocialAccounts();

  // Normaliza tab — aceita "contas" (legacy) e "accounts"
  const rawTab = searchParams.get("tab") ?? "accounts";
  const tab = rawTab === "contas" ? "accounts" : rawTab === "publicacoes" ? "publish" : rawTab;

  useEffect(() => {
    const connected = searchParams.get("connected");
    const platform = searchParams.get("platform");
    const warning = searchParams.get("warning");
    const error = searchParams.get("error");
    if (connected === "true" && platform) {
      const platformLabel = PLATFORMS.find((p) => p.key === platform)?.label ?? platform;
      if (warning === "no_pages") {
        toast.warning(
          `Login Meta concluído, mas nenhuma Página do Facebook foi encontrada nesta conta. Crie/selecione uma Página com Instagram Business vinculado e reconecte.`,
        );
      } else {
        toast.success(`${platformLabel} conectado com sucesso!`);
      }
      const params = new URLSearchParams(searchParams);
      params.delete("connected");
      params.delete("platform");
      params.delete("warning");
      setSearchParams(params, { replace: true });
    } else if (error) {
      const errorMessages: Record<string, string> = {
        access_denied: "Permissão negada pelo usuário.",
        token_exchange_failed: "Falha ao obter token de acesso.",
        account_info_failed: "Não foi possível obter os dados da conta no Meta. Verifique se o app tem permissões corretas.",
        missing_org_id: "Organização não identificada.",
        invalid_state: "Sessão inválida. Tente novamente.",
        state_expired: "A sessão expirou. Tente conectar novamente.",
        provider_not_configured: "Integração Meta não configurada no servidor.",
        server_misconfigured: "Servidor não configurado corretamente.",
        save_failed: "Falha ao salvar a conexão. Tente novamente.",
      };
      reportError(new Error(errorMessages[error] ?? `Erro ao conectar: ${error}`), { title: "Erro ao conectar conta social", category: "social.oauth_callback" });
      const params = new URLSearchParams(searchParams);
      params.delete("error");
      setSearchParams(params, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", value);
    setSearchParams(params, { replace: true });
  };

  return (
    <div className="w-full space-y-6">
      <AssessoriaPopup storageKey="noexcuse_popup_redes_v1" servico="Gestão de Redes Sociais" />
      <PageHeader
        title="Redes Sociais"
        subtitle="Conecte, analise e publique nas suas redes em um só lugar"
        icon={<Share2 className="w-5 h-5 text-primary" />}
      />

      <Tabs value={tab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="accounts" className="gap-1.5">
            <Link2 className="w-3.5 h-3.5" /> Contas
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" /> Analytics
          </TabsTrigger>
          <TabsTrigger value="publish" className="gap-1.5">
            <Send className="w-3.5 h-3.5" /> Publicações
          </TabsTrigger>
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
