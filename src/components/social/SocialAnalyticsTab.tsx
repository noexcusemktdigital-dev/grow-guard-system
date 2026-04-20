// @ts-nocheck
import { useMemo, useState } from "react";
import { Loader2, TrendingUp, Users, Eye, Heart, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useSocialInsights } from "@/hooks/useSocialPublishing";
import type { SocialAccount } from "@/hooks/useSocialAccounts";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  accounts: SocialAccount[];
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">{icon}</div>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-xl font-bold">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return String(Math.round(n));
}

export function SocialAnalyticsTab({ accounts }: Props) {
  const eligible = useMemo(
    () => accounts.filter((a) => a.status === "active" && (a.platform === "facebook" || a.platform === "instagram")),
    [accounts],
  );
  const [activeId, setActiveId] = useState<string | null>(eligible[0]?.id ?? null);

  if (eligible.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          Conecte o Facebook ou Instagram na aba <strong>Contas</strong> para visualizar métricas.
        </CardContent>
      </Card>
    );
  }

  const current = activeId ?? eligible[0].id;
  const { data, isLoading, isError, error } = useSocialInsights(current);

  return (
    <div className="space-y-4">
      <Tabs value={current} onValueChange={setActiveId}>
        <TabsList>
          {eligible.map((a) => (
            <TabsTrigger key={a.id} value={a.id} className="capitalize">
              {a.platform} · {a.account_name ?? a.account_username ?? "—"}
            </TabsTrigger>
          ))}
        </TabsList>

        {eligible.map((a) => (
          <TabsContent key={a.id} value={a.id} className="space-y-4 mt-4">
            {isLoading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            ) : isError ? (
              <Card>
                <CardContent className="p-6 text-sm text-destructive">
                  {(error as Error)?.message ?? "Erro ao carregar métricas."}
                </CardContent>
              </Card>
            ) : data ? (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <StatCard label="Seguidores" value={fmt(data.account.followers)} icon={<Users className="w-5 h-5" />} />
                  <StatCard label="Alcance (28d)" value={fmt(data.account.reach_30d)} icon={<TrendingUp className="w-5 h-5" />} />
                  <StatCard label="Impressões (28d)" value={fmt(data.account.impressions_30d)} icon={<Eye className="w-5 h-5" />} />
                  <StatCard label="Engajamento médio" value={fmt(data.account.avg_engagement)} icon={<Heart className="w-5 h-5" />} />
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Últimas publicações</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {data.recent_posts.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhuma publicação encontrada.</p>
                    ) : (
                      data.recent_posts.map((p) => (
                        <div key={p.id} className="flex gap-3 p-3 rounded-lg border border-border/50 hover:border-border">
                          {p.image_url && (
                            <img src={p.image_url} alt="" className="w-16 h-16 rounded object-cover flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm line-clamp-2">{p.message || <em className="text-muted-foreground">(sem legenda)</em>}</p>
                            <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
                              <span>{formatDistanceToNow(new Date(p.created_at), { addSuffix: true, locale: ptBR })}</span>
                              <Badge variant="secondary" className="text-[10px]">❤ {fmt(p.likes)}</Badge>
                              <Badge variant="secondary" className="text-[10px]">💬 {fmt(p.comments)}</Badge>
                              <Badge variant="secondary" className="text-[10px]">👁 {fmt(p.reach)}</Badge>
                            </div>
                          </div>
                          {p.permalink && (
                            <a href={p.permalink} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </>
            ) : null}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
