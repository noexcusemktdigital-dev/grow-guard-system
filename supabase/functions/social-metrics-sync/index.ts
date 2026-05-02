// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { newRequestContext, makeLogger, withCorrelationHeader } from "../_shared/correlation.ts";

// ============================================================
// social-metrics-sync
// Phase 4 — Pull engagement metrics from Meta (Instagram/Facebook)
// and LinkedIn for published posts (last 30 days).
// Called by pg_cron daily — no JWT, verify_jwt = false.
// Auth: Authorization: Bearer {CRON_SECRET}
// ============================================================

interface SocialPost {
  id: string;
  organization_id: string;
  platform: string;
  platform_post_id: string;
  social_account_id: string;
  published_at: string;
}

interface SocialAccount {
  id: string;
  platform: string;
  access_token: string;
  metadata: Record<string, unknown>;
}

interface PostMetrics {
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  engagement_rate: number;
}

interface SyncError {
  post_id: string;
  error: string;
}

// -------------------------------------------------------
// Instagram Insights
// GET /v25.0/{media_id}/insights?metric=...
// -------------------------------------------------------
async function fetchInstagramMetrics(
  platformPostId: string,
  accessToken: string,
): Promise<PostMetrics> {
  const metricNames = "impressions,reach,likes,comments,saved,shares";
  const url =
    `https://graph.facebook.com/v25.0/${platformPostId}/insights` +
    `?metric=${metricNames}&access_token=${encodeURIComponent(accessToken)}`;

  const res = await fetch(url);
  const body = await res.json();

  if (!res.ok) {
    const msg = body?.error?.message ?? `HTTP ${res.status}`;
    throw new Error(`Instagram insights error: ${msg}`);
  }

  // Response: { data: [{name: "impressions", values: [{value: N, end_time: "..."}]}, ...] }
  const metricMap: Record<string, number> = {};
  for (const item of body.data ?? []) {
    // values is an array; take the last (most recent) entry
    const values = item.values ?? [];
    const last = values[values.length - 1];
    metricMap[item.name] = typeof last?.value === "number" ? last.value : 0;
  }

  const likes = metricMap["likes"] ?? 0;
  const comments = metricMap["comments"] ?? 0;
  const shares = metricMap["shares"] ?? 0;
  const saves = metricMap["saved"] ?? 0;
  const reach = metricMap["reach"] ?? 0;

  const engagementRate =
    reach > 0
      ? Math.round(((likes + comments + shares + saves) / reach) * 10000) / 100
      : 0;

  return {
    impressions: metricMap["impressions"] ?? 0,
    reach,
    likes,
    comments,
    shares,
    saves,
    clicks: 0,
    engagement_rate: engagementRate,
  };
}

// -------------------------------------------------------
// Facebook Page post insights
// GET /v25.0/{post_id}/insights?metric=...
// Uses page_access_token from account metadata
// -------------------------------------------------------
async function fetchFacebookMetrics(
  platformPostId: string,
  pageAccessToken: string,
): Promise<PostMetrics> {
  const metricNames =
    "post_impressions,post_impressions_unique,post_engaged_users," +
    "post_reactions_like_total,post_comments,post_shares";
  const url =
    `https://graph.facebook.com/v25.0/${platformPostId}/insights` +
    `?metric=${metricNames}&access_token=${encodeURIComponent(pageAccessToken)}`;

  const res = await fetch(url);
  const body = await res.json();

  if (!res.ok) {
    const msg = body?.error?.message ?? `HTTP ${res.status}`;
    throw new Error(`Facebook insights error: ${msg}`);
  }

  const metricMap: Record<string, number> = {};
  for (const item of body.data ?? []) {
    const values = item.values ?? [];
    const last = values[values.length - 1];
    metricMap[item.name] = typeof last?.value === "number" ? last.value : 0;
  }

  const likes = metricMap["post_reactions_like_total"] ?? 0;
  const comments = metricMap["post_comments"] ?? 0;
  const shares = metricMap["post_shares"] ?? 0;
  const reach = metricMap["post_impressions_unique"] ?? 0;

  const engagementRate =
    reach > 0
      ? Math.round(((likes + comments + shares) / reach) * 10000) / 100
      : 0;

  return {
    impressions: metricMap["post_impressions"] ?? 0,
    reach,
    likes,
    comments,
    shares,
    saves: 0,
    clicks: metricMap["post_engaged_users"] ?? 0,
    engagement_rate: engagementRate,
  };
}

// -------------------------------------------------------
// LinkedIn post metrics
// Uses two endpoints:
//   1. organizationalEntityShareStatistics for impressions/clicks/likes/shares
//   2. socialActions/{urn}/comments for comment count
// Tries both urn:li:share and urn:li:ugcPost URN formats
// -------------------------------------------------------
async function fetchLinkedInMetrics(
  platformPostId: string,
  accessToken: string,
  organizationId?: string,
): Promise<PostMetrics> {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Linkedin-Version": "202503",
    "X-Restli-Protocol-Version": "2.0.0",
  };

  // Try both URN formats: share first, then ugcPost
  const urnFormats = [
    `urn:li:share:${platformPostId}`,
    `urn:li:ugcPost:${platformPostId}`,
  ];

  let statsData: Record<string, number> = {};
  let statsError: string | null = null;

  for (const postUrn of urnFormats) {
    if (!organizationId) break;

    const encodedUrn = encodeURIComponent(postUrn);
    const orgUrn = `urn:li:organization:${organizationId}`;
    const statsUrl =
      `https://api.linkedin.com/rest/organizationalEntityShareStatistics` +
      `?q=organizationalEntity&organizationalEntity=${encodeURIComponent(orgUrn)}` +
      `&shares=List(${encodedUrn})`;

    const statsRes = await fetch(statsUrl, { headers });
    const statsBody = await statsRes.json();

    if (statsRes.ok) {
      const elements = statsBody.elements ?? [];
      if (elements.length > 0) {
        const s = elements[0].totalShareStatistics ?? {};
        statsData = {
          impressionCount: s.impressionCount ?? 0,
          clickCount: s.clickCount ?? 0,
          likeCount: s.likeCount ?? 0,
          shareCount: s.shareCount ?? 0,
          uniqueImpressionsCount: s.uniqueImpressionsCount ?? 0,
        };
        break; // Found the right URN format
      }
    } else {
      statsError = statsBody?.message ?? `HTTP ${statsRes.status}`;
    }
  }

  // Fetch comment count using socialActions (try both URN formats)
  let commentCount = 0;
  for (const postUrn of urnFormats) {
    const encodedUrn = encodeURIComponent(postUrn);
    const commentsUrl =
      `https://api.linkedin.com/rest/socialActions/${encodedUrn}/comments?count=0`;

    const commentsRes = await fetch(commentsUrl, { headers });
    if (commentsRes.ok) {
      const commentsBody = await commentsRes.json();
      commentCount = commentsBody.paging?.total ?? 0;
      break;
    }
  }

  if (Object.keys(statsData).length === 0 && statsError) {
    throw new Error(`LinkedIn stats error: ${statsError}`);
  }

  const likes = statsData.likeCount ?? 0;
  const shares = statsData.shareCount ?? 0;
  const impressions = statsData.impressionCount ?? 0;
  const reach = statsData.uniqueImpressionsCount ?? impressions;

  const engagementRate =
    reach > 0
      ? Math.round(((likes + commentCount + shares) / reach) * 10000) / 100
      : 0;

  return {
    impressions,
    reach,
    likes,
    comments: commentCount,
    shares,
    saves: 0,
    clicks: statsData.clickCount ?? 0,
    engagement_rate: engagementRate,
  };
}

// -------------------------------------------------------
// Main handler
// -------------------------------------------------------
serve(async (req) => {
  const ctx = newRequestContext(req, 'social-metrics-sync');
  const log = makeLogger(ctx);
  log.info('request_received', { method: req.method });

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: withCorrelationHeader(ctx, getCorsHeaders(req)) });
  }

  // Fail-closed: validate CRON_SECRET
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (!cronSecret) {
    console.error("social-metrics-sync: CRON_SECRET env var not set — fail-closed");
    return new Response(
      JSON.stringify({ error: "Server misconfigured" }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } },
    );
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (token !== cronSecret) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } },
    );
  }

  // Require env vars
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("social-metrics-sync: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    return new Response(
      JSON.stringify({ error: "Server misconfigured" }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } },
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  let synced = 0;
  const errors: SyncError[] = [];

  try {
    // ---------------------------------------------------
    // 1. Fetch all published posts from the last 30 days
    // ---------------------------------------------------
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: posts, error: postsError } = await supabase
      .from("social_posts")
      .select("id, organization_id, platform, platform_post_id, social_account_id, published_at")
      .eq("status", "published")
      .not("platform_post_id", "is", null)
      .gt("published_at", thirtyDaysAgo);

    if (postsError) {
      console.error("social-metrics-sync: failed to fetch posts:", postsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch posts", detail: postsError.message }),
        { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } },
      );
    }

    if (!posts || posts.length === 0) {
      console.log("social-metrics-sync: no published posts found in last 30 days");
      return new Response(
        JSON.stringify({ synced: 0, errors: [] }),
        { status: 200, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } },
      );
    }

    console.log(`social-metrics-sync: found ${posts.length} posts to sync`);

    // ---------------------------------------------------
    // 2. Group posts by social_account_id
    // ---------------------------------------------------
    const postsByAccount = new Map<string, SocialPost[]>();
    for (const post of posts as SocialPost[]) {
      const existing = postsByAccount.get(post.social_account_id) ?? [];
      existing.push(post);
      postsByAccount.set(post.social_account_id, existing);
    }

    // ---------------------------------------------------
    // 3. Fetch accounts and process each group
    // ---------------------------------------------------
    const accountIds = Array.from(postsByAccount.keys());

    const { data: accounts, error: accountsError } = await supabase
      .from("social_accounts")
      .select("id, platform, access_token, metadata")
      .in("id", accountIds)
      .eq("status", "active");

    if (accountsError) {
      console.error("social-metrics-sync: failed to fetch accounts:", accountsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch accounts", detail: accountsError.message }),
        { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } },
      );
    }

    // Build account lookup map
    const accountMap = new Map<string, SocialAccount>();
    for (const acc of (accounts ?? []) as SocialAccount[]) {
      accountMap.set(acc.id, acc);
    }

    // ---------------------------------------------------
    // 4. Process each post — fetch metrics, upsert to DB
    // ---------------------------------------------------
    for (const [accountId, accountPosts] of postsByAccount) {
      const account = accountMap.get(accountId);

      if (!account) {
        // Account not found or not active — skip all posts for this account
        for (const post of accountPosts) {
          const msg = `Account ${accountId} not found or inactive`;
          console.warn(`social-metrics-sync: ${msg} (post ${post.id})`);
          errors.push({ post_id: post.id, error: msg });
        }
        continue;
      }

      for (const post of accountPosts) {
        try {
          let metrics: PostMetrics;

          if (post.platform === "instagram") {
            metrics = await fetchInstagramMetrics(post.platform_post_id, account.access_token);
          } else if (post.platform === "facebook") {
            // Page posts require the page access token
            const pageAccessToken =
              (account.metadata?.page_access_token as string) ?? account.access_token;
            metrics = await fetchFacebookMetrics(post.platform_post_id, pageAccessToken);
          } else if (post.platform === "linkedin") {
            // Organization ID may be stored in account metadata
            const orgId = account.metadata?.organization_id as string | undefined;
            metrics = await fetchLinkedInMetrics(
              post.platform_post_id,
              account.access_token,
              orgId,
            );
          } else {
            // Unsupported platform for metrics — skip silently
            console.log(
              `social-metrics-sync: platform '${post.platform}' not supported, skipping post ${post.id}`,
            );
            continue;
          }

          // Upsert into social_engagement_metrics (UNIQUE constraint on social_post_id, date)
          const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

          const { error: upsertError } = await supabase
            .from("social_engagement_metrics")
            .upsert(
              {
                organization_id: post.organization_id,
                social_post_id: post.id,
                platform: post.platform,
                likes: metrics.likes,
                comments: metrics.comments,
                shares: metrics.shares,
                saves: metrics.saves,
                reach: metrics.reach,
                impressions: metrics.impressions,
                engagement_rate: metrics.engagement_rate,
                clicks: metrics.clicks,
                date: today,
                synced_at: new Date().toISOString(),
              },
              { onConflict: "social_post_id,date" },
            );

          if (upsertError) {
            const msg = `DB upsert failed: ${upsertError.message}`;
            console.error(`social-metrics-sync: post ${post.id} — ${msg}`);
            errors.push({ post_id: post.id, error: msg });
          } else {
            synced++;
            console.log(
              `social-metrics-sync: synced post ${post.id} (${post.platform}) — ` +
                `reach=${metrics.reach} likes=${metrics.likes} eng=${metrics.engagement_rate}%`,
            );
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`social-metrics-sync: error on post ${post.id}:`, msg);
          errors.push({ post_id: post.id, error: msg });
          // Continue with next post — don't abort the batch
        }
      }
    }

    console.log(
      `social-metrics-sync done: synced=${synced} errors=${errors.length}`,
    );

    return new Response(
      JSON.stringify({ synced, errors }),
      { status: 200, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("social-metrics-sync unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Unexpected error", detail: String(err) }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } },
    );
  }
});
