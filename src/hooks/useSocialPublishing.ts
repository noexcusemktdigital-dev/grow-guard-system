// @ts-nocheck
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { invokeEdge } from "@/lib/edge";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { extractEdgeFunctionError } from "@/lib/edgeFunctionError";
import { toast } from "sonner";
import { reportError } from "@/lib/error-toast";

export interface SocialInsights {
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

export function useSocialInsights(socialAccountId: string | null | undefined) {
  return useQuery<SocialInsights | null>({
    queryKey: ["social_insights", socialAccountId],
    queryFn: async () => {
      if (!socialAccountId) return null;
      const { data, error } = await invokeEdge("social-get-insights", {
        body: { social_account_id: socialAccountId, period: "30d" },
      });
      if (error) throw await extractEdgeFunctionError(error);
      return (data as { data: SocialInsights }).data;
    },
    enabled: !!socialAccountId,
    staleTime: 10 * 60 * 1000,
  });
}

export interface ScheduledPost {
  id: string;
  organization_id: string;
  social_account_id: string;
  platform: "facebook" | "instagram";
  caption: string | null;
  image_url: string | null;
  scheduled_for: string;
  status: "scheduled" | "publishing" | "published" | "failed" | "canceled";
  platform_post_id: string | null;
  error_message: string | null;
  published_at: string | null;
  created_at: string;
}

export function useScheduledPosts() {
  const { data: orgId } = useUserOrgId();
  return useQuery<ScheduledPost[]>({
    queryKey: ["scheduled_posts", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_scheduled_posts")
        .select("*")
        .eq("organization_id", orgId!)
        .order("scheduled_for", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as ScheduledPost[];
    },
    enabled: !!orgId,
  });
}

export interface PublishInput {
  social_account_id: string;
  caption: string;
  image_url?: string;
  scheduled_for?: string; // ISO
}

export function usePublishOrSchedule() {
  const qc = useQueryClient();
  const { data: orgId } = useUserOrgId();
  return useMutation({
    mutationFn: async (input: PublishInput) => {
      const { data, error } = await invokeEdge("social-publish-post", {
        body: input,
      });
      if (error) throw await extractEdgeFunctionError(error);
      return data as { published?: boolean; scheduled?: boolean };
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["scheduled_posts", orgId] });
      qc.invalidateQueries({ queryKey: ["social_insights"] });
      if (data.scheduled) toast.success("Post agendado com sucesso!");
      else toast.success("Post publicado com sucesso!");
    },
    onError: (err: unknown) => {
      reportError(err, { title: 'Erro ao publicar post', category: 'social.publish' });
    },
  });
}

export function useCancelScheduledPost() {
  const qc = useQueryClient();
  const { data: orgId } = useUserOrgId();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("social_scheduled_posts")
        .update({ status: "canceled" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scheduled_posts", orgId] });
      toast.success("Agendamento cancelado.");
    },
    onError: (err: unknown) => {
      reportError(err, { title: 'Erro ao cancelar agendamento', category: 'social.cancel_scheduled' });
    },
  });
}

export async function uploadSocialMedia(orgId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${orgId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("social-media").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("social-media").getPublicUrl(path);
  return data.publicUrl;
}
