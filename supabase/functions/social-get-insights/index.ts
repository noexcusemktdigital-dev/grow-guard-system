// social-get-insights — busca métricas de conta + posts recentes via Graph API
// Suporta plataforma 'facebook' (Page) e 'instagram' (IG Business via Page)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getCorsHeaders } from "../_shared/cors.ts";
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';
import { parseOrThrow, validationErrorResponse, UUID } from "../_shared/schemas.ts";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

// social-get-insights uses social_account_id (not organization_id) — permissive schema
const GetInsightsBodySchema = z.object({
  social_account_id: UUID,
  period: z.string().optional(),
});

const GRAPH = "https://graph.facebook.com/v21.0";

interface InsightPayload {
  account: {
    name: string | null;
    picture: string | null;
    followers: number;
    reach_30d: number;
    impressions_30d: number;
    avg_engagement: number;
    avg_engagement_rate: number;
  };
  recent_posts: Array<{
    id: string;
    message: string;
    created_at: string;
    permalink: string | null;
    image_url: string | null;
    likes: number;
    comments: number;
    reach: number;
    impressions: number;
    engagement_rate: number;
  }>;
  best_day_to_post: string;
  followers_growth_hint: string;
}

const WEEKDAYS_PT = [
  "domingo",
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
];

function enrichPayload(base: Omit<InsightPayload, "best_day_to_post" | "followers_growth_hint">): InsightPayload {
  const followers = Math.max(base.account.followers, 1);

  // engagement_rate por post
  const enrichedPosts = base.recent_posts.map((p) => ({
    ...p,
    engagement_rate: Number((((p.likes + p.comments) / followers) * 100).toFixed(2)),
  }));

  // taxa de engajamento média
  const avgER =
    enrichedPosts.length > 0
      ? Number(
          (enrichedPosts.reduce((s, p) => s + p.engagement_rate, 0) / enrichedPosts.length).toFixed(2),
        )
      : 0;

  // melhor dia para postar
  const byDay = new Map<number, { total: number; count: number }>();
  for (const p of enrichedPosts) {
    const d = new Date(p.created_at);
    if (isNaN(d.getTime())) continue;
    const day = d.getDay();
    const eng = p.likes + p.comments;
    const cur = byDay.get(day) ?? { total: 0, count: 0 };
    cur.total += eng;
    cur.count += 1;
    byDay.set(day, cur);
  }
  let bestDay = "—";
  let bestAvg = -1;
  for (const [day, { total, count }] of byDay.entries()) {
    const avg = count > 0 ? total / count : 0;
    if (avg > bestAvg) {
      bestAvg = avg;
      bestDay = WEEKDAYS_PT[day];
    }
  }

  // hint de crescimento (placeholder simples baseado no engajamento médio)
  const growthHint =
    avgER >= 3
      ? "Engajamento acima da média do mercado — continue postando neste ritmo."
      : avgER >= 1
        ? "Engajamento dentro da média. Teste novos formatos para crescer mais rápido."
        : "Engajamento abaixo da média. Foque em conteúdos com pergunta e CTA claros.";

  return {
    account: { ...base.account, avg_engagement_rate: avgER },
    recent_posts: enrichedPosts,
    best_day_to_post: bestDay,
    followers_growth_hint: growthHint,
  };
}

async function gget(url: string): Promise<any> {
  const r = await fetch(url);
  const j = await r.json();
  if (!r.ok) {
    console.error("[graph] error", j);
    throw new Error(j?.error?.message ?? `Graph API ${r.status}`);
  }
  return j;
}

function sumActions(_actions: unknown): number {
  return 0;
}

async function fetchFacebook(accountId: string, accessToken: string): Promise<Omit<InsightPayload, "best_day_to_post" | "followers_growth_hint">> {
  // Page metadata - fan_count foi removido em versões recentes da Graph API; usar followers_count
  let meta: any = {};
  try {
    meta = await gget(
      `${GRAPH}/${accountId}?fields=name,picture{url},followers_count&access_token=${accessToken}`,
    );
  } catch (e) {
    console.warn("[fb] meta with followers_count failed, retrying minimal", e);
    try {
      meta = await gget(
        `${GRAPH}/${accountId}?fields=name,picture{url}&access_token=${accessToken}`,
      );
    } catch (e2) {
      console.warn("[fb] meta minimal failed", e2);
    }
  }
  const followers = Number(meta?.followers_count ?? 0) || 0;

  // Page insights (last 30 days)
  let reach_30d = 0;
  let impressions_30d = 0;
  try {
    const insights = await gget(
      `${GRAPH}/${accountId}/insights?metric=page_impressions,page_impressions_unique&period=days_28&access_token=${accessToken}`,
    );
    for (const m of insights.data ?? []) {
      const v = m.values?.[m.values.length - 1]?.value ?? 0;
      if (m.name === "page_impressions") impressions_30d = Number(v) || 0;
      if (m.name === "page_impressions_unique") reach_30d = Number(v) || 0;
    }
  } catch (e) {
    console.warn("[fb] insights failed", e);
  }

  // Recent posts
  const posts = await gget(
    `${GRAPH}/${accountId}/posts?fields=id,message,created_time,permalink_url,full_picture,likes.summary(true),comments.summary(true),insights.metric(post_impressions,post_impressions_unique)&limit=10&access_token=${accessToken}`,
  );

  const recent_posts = (posts.data ?? []).map((p: any) => {
    const ins = p.insights?.data ?? [];
    const impressions = ins.find((x: any) => x.name === "post_impressions")?.values?.[0]?.value ?? 0;
    const reach = ins.find((x: any) => x.name === "post_impressions_unique")?.values?.[0]?.value ?? 0;
    return {
      id: p.id,
      message: p.message ?? "",
      created_at: p.created_time,
      permalink: p.permalink_url ?? null,
      image_url: p.full_picture ?? null,
      likes: p.likes?.summary?.total_count ?? 0,
      comments: p.comments?.summary?.total_count ?? 0,
      reach: Number(reach) || 0,
      impressions: Number(impressions) || 0,
    };
  });

  const avg_engagement = recent_posts.length
    ? recent_posts.reduce((s: number, p: any) => s + p.likes + p.comments, 0) / recent_posts.length
    : 0;

  return {
    account: {
      name: meta.name ?? null,
      picture: meta.picture?.data?.url ?? null,
      followers,
      reach_30d,
      impressions_30d,
      avg_engagement,
      avg_engagement_rate: 0,
    },
    recent_posts: recent_posts.map((p: any) => ({ ...p, engagement_rate: 0 })),
  };
}

async function fetchInstagram(igUserId: string, accessToken: string): Promise<Omit<InsightPayload, "best_day_to_post" | "followers_growth_hint">> {
  const meta = await gget(
    `${GRAPH}/${igUserId}?fields=name,username,profile_picture_url,followers_count,media_count&access_token=${accessToken}`,
  );

  let reach_30d = 0;
  let impressions_30d = 0;
  try {
    const insights = await gget(
      `${GRAPH}/${igUserId}/insights?metric=reach,impressions&period=days_28&access_token=${accessToken}`,
    );
    for (const m of insights.data ?? []) {
      const v = m.values?.[m.values.length - 1]?.value ?? 0;
      if (m.name === "reach") reach_30d = Number(v) || 0;
      if (m.name === "impressions") impressions_30d = Number(v) || 0;
    }
  } catch (e) {
    console.warn("[ig] insights failed", e);
  }

  const media = await gget(
    `${GRAPH}/${igUserId}/media?fields=id,caption,timestamp,permalink,media_url,thumbnail_url,like_count,comments_count,insights.metric(reach,impressions)&limit=10&access_token=${accessToken}`,
  );

  const recent_posts = (media.data ?? []).map((p: any) => {
    const ins = p.insights?.data ?? [];
    const impressions = ins.find((x: any) => x.name === "impressions")?.values?.[0]?.value ?? 0;
    const reach = ins.find((x: any) => x.name === "reach")?.values?.[0]?.value ?? 0;
    return {
      id: p.id,
      message: p.caption ?? "",
      created_at: p.timestamp,
      permalink: p.permalink ?? null,
      image_url: p.media_url ?? p.thumbnail_url ?? null,
      likes: p.like_count ?? 0,
      comments: p.comments_count ?? 0,
      reach: Number(reach) || 0,
      impressions: Number(impressions) || 0,
    };
  });

  const avg_engagement = recent_posts.length
    ? recent_posts.reduce((s: number, p: any) => s + p.likes + p.comments, 0) / recent_posts.length
    : 0;

  return {
    account: {
      name: meta.name ?? meta.username ?? null,
      picture: meta.profile_picture_url ?? null,
      followers: meta.followers_count ?? 0,
      reach_30d,
      impressions_30d,
      avg_engagement,
      avg_engagement_rate: 0,
    },
    recent_posts: recent_posts.map((p: any) => ({ ...p, engagement_rate: 0 })),
  };
}

Deno.serve(async (req) => {
  const ctx = newRequestContext(req, 'social-get-insights');
  const log = makeLogger(ctx);
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: cors });
    }

    const supaUrl = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supaUrl, anon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: cErr } = await userClient.auth.getUser();
    if (cErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: cors });
    }
    const userId = userData.user.id;

    let body: { social_account_id: string; period?: string };
    try {
      const raw = await req.json().catch(() => ({}));
      body = parseOrThrow(GetInsightsBodySchema, raw);
    } catch (err) {
      const vr = validationErrorResponse(err, cors);
      if (vr) return vr;
      return new Response(JSON.stringify({ error: "Invalid request body" }), { status: 400, headers: cors });
    }
    const social_account_id = body.social_account_id;

    const admin = createClient(supaUrl, service);

    // Buscar conta + verificar membership
    const { data: account, error: accErr } = await admin
      .from("social_accounts")
      .select("*")
      .eq("id", social_account_id)
      .maybeSingle();

    if (accErr || !account) {
      return new Response(JSON.stringify({ error: "Account not found" }), { status: 404, headers: cors });
    }

    const { data: isMember } = await admin.rpc("is_member_of_org", {
      _user_id: userId,
      _org_id: account.organization_id,
    });
    if (!isMember) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: cors });
    }

    // Cache check (1h)
    const period = body.period ?? "30d";
    const { data: cached } = await admin
      .from("social_account_insights_cache")
      .select("payload, expires_at")
      .eq("social_account_id", social_account_id)
      .eq("period", period)
      .maybeSingle();

    if (cached && new Date(cached.expires_at) > new Date()) {
      return new Response(JSON.stringify({ data: cached.payload, cached: true }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const meta = (account.metadata ?? {}) as Record<string, any>;
    // User token (long-lived) deve estar salvo em metadata.user_token (preferencial) ou access_token
    const userToken: string | undefined =
      meta.user_token ?? account.access_token ?? meta.access_token;
    // Page token salvo separadamente (caso já exista)
    let pageToken: string | undefined = meta.page_access_token;

    if (!userToken && !pageToken) {
      return new Response(JSON.stringify({ error: "Missing access token. Please reconnect this account." }), {
        status: 400,
        headers: cors,
      });
    }

    // Para Facebook e Instagram, derivamos sempre o page token a partir do user token
    // pois ele expira diferentemente e precisamos do token correto da Página
    let pageId: string | null = null;
    if (account.platform === "facebook") {
      pageId = account.account_id;
    } else if (account.platform === "instagram") {
      // IG Business está vinculado a uma Page. Tentamos pegar de metadata
      pageId = meta.page_id ?? meta.facebook_page_id ?? null;
    }

    if (userToken && pageId) {
      try {
        const accountsRes = await fetch(
          `${GRAPH}/me/accounts?fields=id,name,access_token&limit=200&access_token=${userToken}`,
        );
        const accountsJson = await accountsRes.json();
        if (accountsRes.ok) {
          const pageEntry = (accountsJson.data ?? []).find((p: any) => p.id === pageId);
          if (pageEntry?.access_token) {
            pageToken = pageEntry.access_token;
          }
        } else {
          console.warn("[insights] /me/accounts failed", accountsJson);
        }
      } catch (e) {
        console.warn("[insights] failed to derive page token", e);
      }
    }

    const effectiveToken = pageToken ?? userToken!;

    let basePayload: Omit<InsightPayload, "best_day_to_post" | "followers_growth_hint">;
    if (account.platform === "facebook") {
      basePayload = await fetchFacebook(account.account_id, effectiveToken);
    } else if (account.platform === "instagram") {
      basePayload = await fetchInstagram(account.account_id, effectiveToken);
    } else {
      return new Response(JSON.stringify({ error: "Unsupported platform" }), { status: 400, headers: cors });
    }

    const payload: InsightPayload = enrichPayload(basePayload);

    // Save cache (1h)
    await admin.from("social_account_insights_cache").upsert(
      {
        organization_id: account.organization_id,
        social_account_id,
        period,
        payload: payload as unknown as Record<string, unknown>,
        fetched_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      },
      { onConflict: "social_account_id,period" },
    );

    // Update last_synced_at
    await admin
      .from("social_accounts")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("id", social_account_id);

    return new Response(JSON.stringify({ data: payload, cached: false }), {
      headers: { ...withCorrelationHeader(ctx, cors), "Content-Type": "application/json" },
    });
  } catch (e) {
    log.error("social-get-insights error", { error: String(e) });
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }
});
