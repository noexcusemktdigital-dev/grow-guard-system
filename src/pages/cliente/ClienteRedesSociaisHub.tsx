// @ts-nocheck
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/PageHeader";
import { Share2, BarChart2, Link2, Calendar } from "lucide-react";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

const ContasSociais = lazy(() => import("./ContasSociais"));
const SocialAnalytics = lazy(() => import("./SocialAnalytics"));

function TabFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function ClienteRedesSociaisHub() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "contas";
  const [activeTab, setActiveTab] = useState(initialTab);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value }, { replace: true });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Redes Sociais"
        subtitle="Gerencie suas contas, analise métricas e publique conteúdos"
        icon={<Share2 className="w-5 h-5 text-primary" />}
      />

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="contas" className="gap-1.5 text-xs">
            <Link2 className="w-3.5 h-3.5" />
            Contas
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5 text-xs">
            <BarChart2 className="w-3.5 h-3.5" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="publicacoes" className="gap-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5" />
            Publicações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contas" className="mt-6">
          <Suspense fallback={<TabFallback />}>
            <ContasSociais />
          </Suspense>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <Suspense fallback={<TabFallback />}>
            <SocialAnalytics />
          </Suspense>
        </TabsContent>

        <TabsContent value="publicacoes" className="mt-6">
          <PublicacoesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ─── Publicações Tab (placeholder with scheduled/published posts) ─── */
import { usePostHistory } from "@/hooks/useClientePosts";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Image, CheckCircle2, Clock } from "lucide-react";

function PublicacoesTab() {
  const { data: posts, isLoading } = usePostHistory();

  const publishedPosts = (posts ?? []).filter(
    (p) => p.status === "approved" || p.is_published
  );

  if (isLoading) return <TabFallback />;

  if (publishedPosts.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Calendar className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground font-medium">Nenhuma publicação ainda</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Crie postagens na ferramenta <strong>Postagem</strong> e publique aqui.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {publishedPosts.map((post) => (
        <Card key={post.id} className="overflow-hidden">
          {post.result_url ? (
            <img src={post.result_url} alt="" className="w-full h-40 object-cover" />
          ) : (
            <div className="w-full h-40 bg-muted flex items-center justify-center">
              <Image className="w-8 h-8 text-muted-foreground/30" />
            </div>
          )}
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Badge variant={post.is_published ? "default" : "secondary"} className="text-[10px]">
                {post.is_published ? (
                  <><CheckCircle2 className="w-3 h-3 mr-1" /> Publicado</>
                ) : (
                  <><Clock className="w-3 h-3 mr-1" /> Aprovado</>
                )}
              </Badge>
              <span className="text-[10px] text-muted-foreground">
                {post.created_at ? format(new Date(post.created_at), "dd MMM yyyy", { locale: ptBR }) : ""}
              </span>
            </div>
            {post.input_text && (
              <p className="text-xs text-muted-foreground line-clamp-2">{post.input_text}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
