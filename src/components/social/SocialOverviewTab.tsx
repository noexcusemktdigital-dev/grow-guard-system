import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  TrendingUp,
  Eye,
  Heart,
  ExternalLink,
  Sparkles,
  Calendar,
  Lightbulb,
  Instagram,
  Facebook,
  PenLine,
  Image as ImageIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useSocialInsights, type SocialInsights } from "@/hooks/useSocialPublishing";
import { useConnectSocialAccount, type SocialAccount } from "@/hooks/useSocialAccounts";
import { cn } from "@/lib/utils";

interface Props {
  accounts: SocialAccount[];
}

function fmt(n: number) {
  if (!Number.isFinite(n)) return "0";
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".", ",") + "M";
  if (Math.abs(n) >= 1000) return (n / 1000).toFixed(1).replace(".", ",") + "k";
  return String(Math.round(n));
}

function fmtPct(n: number) {
  return `${n.toFixed(2).replace(".", ",")}%`;
}

function PlatformBadge({ platform }: { platform: string }) {
  if (platform === "instagram") {
    return (
      <Badge className="bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white border-0 gap-1">
        <Instagram className="w-3 h-3" /> Instagram
      </Badge>
    );
  }
  return (
    <Badge className="bg-blue-600 text-white border-0 gap-1">
      <Facebook className="w-3 h-3" /> Facebook
    </Badge>
  );
}

function KpiCard({
  label,
  value,
  delta,
  icon,
}: {
  label: string;
  value: string;
  delta?: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="transition-all hover:shadow-md hover:-translate-y-0.5">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground truncate">{label}</div>
          <div className="text-2xl font-bold tabular-nums leading-tight">{value}</div>
          {delta && <div className="text-[11px] text-muted-foreground mt-0.5">{delta}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  const connect = useConnectSocialAccount();
  return (
    <Card className="border-dashed">
      <CardContent className="p-8 text-center space-y-6">
        <div className="mx-auto w-14 h-14 rounded-full bg-gradient-to-br from-fuchsia-500 to-blue-600 flex items-center justify-center text-white">
          <Sparkles className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Conecte suas redes para começar</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Em 3 passos você passa a ver alcance, engajamento, melhores horários e seus posts de melhor performance.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-xs text-muted-foreground max-w-lg mx-auto">
          {[
            { n: 1, t: "Conectar conta", d: "Autorize via Meta" },
            { n: 2, t: "Sincronizar dados", d: "Trazemos métricas reais" },
            { n: 3, t: "Acompanhar e crescer", d: "Insights automáticos" },
          ].map((s) => (
            <div key={s.n} className="rounded-lg border p-3 space-y-1">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center mx-auto">
                {s.n}
              </div>
              <div className="font-medium text-foreground">{s.t}</div>
              <div>{s.d}</div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          <Button onClick={() => connect("instagram")} className="bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white border-0 gap-2">
            <Instagram className="w-4 h-4" /> Conectar Instagram
          </Button>
          <Button onClick={() => connect("facebook")} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
            <Facebook className="w-4 h-4" /> Conectar Facebook
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function OverviewContent({ data }: { data: SocialInsights }) {
  const navigate = useNavigate();

  const chartData = useMemo(
    () =>
      [...data.recent_posts]
        .reverse()
        .map((p) => ({
          date: format(new Date(p.created_at), "dd/MM", { locale: ptBR }),
          engajamento: p.likes + p.comments,
          legenda: p.message?.slice(0, 80) ?? "",
        })),
    [data.recent_posts],
  );

  const avgEng = useMemo(() => {
    const arr = data.recent_posts;
    return arr.length ? arr.reduce((s, p) => s + p.likes + p.comments, 0) / arr.length : 0;
  }, [data.recent_posts]);

  const topPosts = useMemo(
    () =>
      [...data.recent_posts]
        .sort((a, b) => b.likes + b.comments - (a.likes + a.comments))
        .slice(0, 3),
    [data.recent_posts],
  );

  const postsWithImageReach = data.recent_posts.filter((p) => p.image_url).map((p) => p.reach);
  const postsNoImageReach = data.recent_posts.filter((p) => !p.image_url).map((p) => p.reach);
  const avg = (xs: number[]) => (xs.length ? xs.reduce((s, n) => s + n, 0) / xs.length : 0);
  const avgImg = avg(postsWithImageReach);
  const avgNoImg = avg(postsNoImageReach);
  const imageBoostPct = avgNoImg > 0 ? Math.round(((avgImg - avgNoImg) / avgNoImg) * 100) : null;

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Seguidores"
          value={fmt(data.account.followers)}
          icon={<Users className="w-5 h-5" />}
        />
        <KpiCard
          label="Alcance (28d)"
          value={fmt(data.account.reach_30d)}
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <KpiCard
          label="Impressões (28d)"
          value={fmt(data.account.impressions_30d)}
          icon={<Eye className="w-5 h-5" />}
        />
        <KpiCard
          label="Tx. engajamento média"
          value={fmtPct(data.account.avg_engagement_rate ?? 0)}
          icon={<Heart className="w-5 h-5" />}
        />
      </div>

      {/* Gráfico de engajamento */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Engajamento dos últimos 10 posts</CardTitle>
        </CardHeader>
        <CardContent className="h-[260px]">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
              Sem dados de posts recentes.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value: number, _n, item: { payload?: { legenda?: string } }) => [
                    `${fmt(value)} interações`,
                    item?.payload?.legenda ? `${item.payload.legenda}…` : "Engajamento",
                  ]}
                  labelFormatter={(label) => `Postado em ${label}`}
                />
                <Bar dataKey="engajamento" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Top posts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top posts</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {topPosts.length === 0 ? (
            <p className="text-sm text-muted-foreground col-span-full">Nenhum post recente encontrado.</p>
          ) : (
            topPosts.map((p) => {
              const eng = p.likes + p.comments;
              const isTop = avgEng > 0 && eng > avgEng;
              return (
                <div
                  key={p.id}
                  className="rounded-lg border border-border/60 overflow-hidden hover:border-border transition-colors flex flex-col"
                >
                  <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden">
                    {p.image_url ? (
                      <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="p-3 space-y-2 flex-1 flex flex-col">
                    <p className="text-xs line-clamp-2 min-h-[2.4em]">
                      {(p.message || "(sem legenda)").slice(0, 60)}
                      {p.message && p.message.length > 60 ? "…" : ""}
                    </p>
                    <div className="flex items-center justify-between gap-1 text-[11px] text-muted-foreground tabular-nums">
                      <span>👁 {fmt(p.reach)}</span>
                      <span>❤️ {fmt(p.likes)}</span>
                      <span>💬 {fmt(p.comments)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-auto pt-1">
                      {isTop ? (
                        <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/20 text-[10px]">
                          🔥 Top
                        </Badge>
                      ) : (
                        <span />
                      )}
                      {p.permalink && (
                        <a
                          href={p.permalink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Insights rápidos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" /> Insights rápidos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex gap-2">
            <Calendar className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <p>
              Seu melhor dia para postar é{" "}
              <strong className="capitalize">{data.best_day_to_post || "—"}</strong>
              {avgEng > 0 && (
                <>
                  {" "}com média de <strong>{fmt(avgEng)}</strong> engajamentos.
                </>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <ImageIcon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <p>
              {imageBoostPct === null ? (
                <>Posts com imagem ainda não têm comparação suficiente.</>
              ) : imageBoostPct > 0 ? (
                <>
                  Posts com imagem têm <strong>{imageBoostPct}%</strong> mais alcance que posts sem imagem.
                </>
              ) : (
                <>
                  Posts sem imagem têm tido alcance similar — vale testar carrosséis e vídeos.
                </>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <TrendingUp className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <p>{data.followers_growth_hint}</p>
          </div>
        </CardContent>
      </Card>

      {/* CTA cross-tool */}
      <Card className="bg-gradient-to-br from-primary/5 to-fuchsia-500/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-base">Use esses dados nas outras ferramentas</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => navigate("/cliente/roteiro")} className="gap-2">
            <PenLine className="w-4 h-4" /> Criar Roteiro baseado nos melhores posts
          </Button>
          <Button variant="outline" onClick={() => navigate("/cliente/postagem")} className="gap-2">
            <Sparkles className="w-4 h-4" /> Criar Post com o estilo que mais engaja
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function AccountPanel({ account }: { account: SocialAccount }) {
  const { data, isLoading, isError, error } = useSocialInsights(account.id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <Skeleton className="h-[260px]" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-destructive">
          {(error as Error)?.message ?? "Erro ao carregar métricas."}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
        <div
          className={cn(
            "w-12 h-12 rounded-full overflow-hidden flex items-center justify-center text-white shrink-0",
            account.platform === "instagram"
              ? "bg-gradient-to-br from-fuchsia-500 to-pink-500"
              : "bg-blue-600",
          )}
        >
          {data.account.picture ? (
            <img src={data.account.picture} alt="" className="w-full h-full object-cover" />
          ) : account.platform === "instagram" ? (
            <Instagram className="w-6 h-6" />
          ) : (
            <Facebook className="w-6 h-6" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold truncate">{data.account.name ?? account.account_name ?? "—"}</div>
          <div className="text-xs text-muted-foreground truncate">
            {account.account_username ? `@${account.account_username}` : "Conta conectada"}
          </div>
        </div>
        <PlatformBadge platform={account.platform} />
      </div>

      <OverviewContent data={data} />
    </div>
  );
}

export function SocialOverviewTab({ accounts }: Props) {
  const eligible = useMemo(
    () =>
      accounts.filter(
        (a) => a.status === "active" && (a.platform === "facebook" || a.platform === "instagram"),
      ),
    [accounts],
  );

  const [activeId, setActiveId] = useState<string | null>(eligible[0]?.id ?? null);

  if (eligible.length === 0) {
    return <EmptyState />;
  }

  const current = activeId ?? eligible[0].id;

  return (
    <Tabs value={current} onValueChange={setActiveId}>
      {eligible.length > 1 && (
        <TabsList className="mb-4">
          {eligible.map((a) => (
            <TabsTrigger key={a.id} value={a.id} className="capitalize gap-1.5">
              {a.platform === "instagram" ? (
                <Instagram className="w-3.5 h-3.5" />
              ) : (
                <Facebook className="w-3.5 h-3.5" />
              )}
              {a.account_name ?? a.account_username ?? a.platform}
            </TabsTrigger>
          ))}
        </TabsList>
      )}
      {eligible.map((a) => (
        <TabsContent key={a.id} value={a.id} className="mt-0">
          <AccountPanel account={a} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
