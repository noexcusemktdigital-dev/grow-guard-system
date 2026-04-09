// @ts-nocheck
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { subDays } from "date-fns";

export interface SocialMetricRow {
  id: string;
  social_post_id: string;
  organization_id: string;
  date: string;
  platform: string;
  reach: number;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  engagement_rate: number;
  spend_cents: number;
  // Joined from social_posts
  caption: string | null;
  published_at: string | null;
  platform_post_id: string | null;
}

export interface SocialSummary {
  totalReach: number;
  totalLikes: number;
  totalImpressions: number;
  avgEngagementRate: number;
  totalSpendCents: number;
}

export function useSocialMetrics(
  orgId: string | null | undefined,
  opts?: { from?: Date; to?: Date },
) {
  const from = opts?.from ?? subDays(new Date(), 30);
  const to = opts?.to ?? new Date();

  return useQuery<SocialMetricRow[]>({
    queryKey: ["social_metrics", orgId, from.toISOString(), to.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_engagement_metrics" as "social_engagement_metrics")
        .select(
          `*, social_posts!inner(platform, caption, published_at, platform_post_id)`,
        )
        .eq("organization_id", orgId!)
        .gte("date", from.toISOString().split("T")[0])
        .lte("date", to.toISOString().split("T")[0])
        .order("date", { ascending: false });

      if (error) throw error;

      return ((data ?? []) as unknown[]).map((row) => {
        const r = row as Record<string, unknown>;
        const sp = r.social_posts as Record<string, unknown> | null;
        return {
          id: r.id as string,
          social_post_id: r.social_post_id as string,
          organization_id: r.organization_id as string,
          date: r.date as string,
          platform: (sp?.platform ?? r.platform ?? "unknown") as string,
          reach: (r.reach as number) ?? 0,
          impressions: (r.impressions as number) ?? 0,
          likes: (r.likes as number) ?? 0,
          comments: (r.comments as number) ?? 0,
          shares: (r.shares as number) ?? 0,
          clicks: (r.clicks as number) ?? 0,
          engagement_rate: (r.engagement_rate as number) ?? 0,
          spend_cents: (r.spend_cents as number) ?? 0,
          caption: (sp?.caption ?? null) as string | null,
          published_at: (sp?.published_at ?? null) as string | null,
          platform_post_id: (sp?.platform_post_id ?? null) as string | null,
        } satisfies SocialMetricRow;
      });
    },
    enabled: !!orgId,
    staleTime: 60_000,
  });
}

export function usePostMetrics(postId: string | null | undefined) {
  return useQuery<SocialMetricRow[]>({
    queryKey: ["social_metrics_post", postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_engagement_metrics" as "social_engagement_metrics")
        .select(
          `*, social_posts!inner(platform, caption, published_at, platform_post_id)`,
        )
        .eq("social_post_id", postId!)
        .order("date", { ascending: false });

      if (error) throw error;

      return ((data ?? []) as unknown[]).map((row) => {
        const r = row as Record<string, unknown>;
        const sp = r.social_posts as Record<string, unknown> | null;
        return {
          id: r.id as string,
          social_post_id: r.social_post_id as string,
          organization_id: r.organization_id as string,
          date: r.date as string,
          platform: (sp?.platform ?? r.platform ?? "unknown") as string,
          reach: (r.reach as number) ?? 0,
          impressions: (r.impressions as number) ?? 0,
          likes: (r.likes as number) ?? 0,
          comments: (r.comments as number) ?? 0,
          shares: (r.shares as number) ?? 0,
          clicks: (r.clicks as number) ?? 0,
          engagement_rate: (r.engagement_rate as number) ?? 0,
          spend_cents: (r.spend_cents as number) ?? 0,
          caption: (sp?.caption ?? null) as string | null,
          published_at: (sp?.published_at ?? null) as string | null,
          platform_post_id: (sp?.platform_post_id ?? null) as string | null,
        } satisfies SocialMetricRow;
      });
    },
    enabled: !!postId,
    staleTime: 60_000,
  });
}

export function useSocialSummary(
  orgId: string | null | undefined,
  days = 30,
): { data: SocialSummary; isLoading: boolean; error: unknown } {
  const from = subDays(new Date(), days);
  const { data: metrics, isLoading, error } = useSocialMetrics(orgId, { from });

  const summary: SocialSummary = {
    totalReach: 0,
    totalLikes: 0,
    totalImpressions: 0,
    avgEngagementRate: 0,
    totalSpendCents: 0,
  };

  if (metrics && metrics.length > 0) {
    summary.totalReach = metrics.reduce((s, m) => s + (m.reach ?? 0), 0);
    summary.totalLikes = metrics.reduce((s, m) => s + (m.likes ?? 0), 0);
    summary.totalImpressions = metrics.reduce(
      (s, m) => s + (m.impressions ?? 0),
      0,
    );
    summary.totalSpendCents = metrics.reduce(
      (s, m) => s + (m.spend_cents ?? 0),
      0,
    );
    const nonZeroEngagement = metrics.filter((m) => m.engagement_rate > 0);
    summary.avgEngagementRate =
      nonZeroEngagement.length > 0
        ? nonZeroEngagement.reduce((s, m) => s + m.engagement_rate, 0) /
          nonZeroEngagement.length
        : 0;
  }

  return { data: summary, isLoading, error };
}
