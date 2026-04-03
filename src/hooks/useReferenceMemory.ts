import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface ReferenceMemory {
  frequentRefs: string[];
  approvedArts: string[];
  lastLogoUrl: string | null;
  isLoading: boolean;
}

export function useReferenceMemory(orgId: string | undefined): ReferenceMemory {
  const { data, isLoading } = useQuery({
    queryKey: ["reference-memory", orgId],
    queryFn: async () => {
      if (!orgId) return { frequentRefs: [], approvedArts: [], lastLogoUrl: null };

      const { data: posts } = await supabase
        .from("client_posts")
        .select("reference_image_urls, result_url, result_data, created_at")
        .eq("organization_id", orgId)
        .in("status", ["approved", "completed"])
        .order("created_at", { ascending: false })
        .limit(50);

      if (!posts?.length) return { frequentRefs: [], approvedArts: [], lastLogoUrl: null };

      // Count reference URL frequency
      const refCount: Record<string, number> = {};
      posts.forEach((p) => {
        (p.reference_image_urls || []).forEach((url: string) => {
          if (url) refCount[url] = (refCount[url] || 0) + 1;
        });
      });

      const frequentRefs = Object.entries(refCount)
        .filter(([, count]) => count >= 2)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12)
        .map(([url]) => url);

      // Approved arts (result_url)
      const approvedArts = posts
        .map((p) => p.result_url)
        .filter((u): u is string => !!u)
        .slice(0, 12);

      // Last logo
      let lastLogoUrl: string | null = null;
      for (const p of posts) {
        const rd = p.result_data as Record<string, unknown> | null;
        if (rd?.logoUrl && typeof rd.logoUrl === "string") {
          lastLogoUrl = rd.logoUrl;
          break;
        }
      }

      return { frequentRefs, approvedArts, lastLogoUrl };
    },
    enabled: !!orgId,
    staleTime: 1000 * 60 * 10,
  });

  return {
    frequentRefs: data?.frequentRefs || [],
    approvedArts: data?.approvedArts || [],
    lastLogoUrl: data?.lastLogoUrl || null,
    isLoading,
  };
}
