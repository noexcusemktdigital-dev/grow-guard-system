// @ts-nocheck
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUserOrgId } from "./useUserOrgId";

export interface ApprovalStats {
  contents: { pending: number; approved: number };
  posts: { pending: number; approved: number };
  sites: { pending: number; approved: number };
  totalPending: number;
  totalApproved: number;
}

export function useApprovalStats() {
  const { data: orgId } = useUserOrgId();

  return useQuery({
    queryKey: ["approval-stats", orgId],
    queryFn: async (): Promise<ApprovalStats> => {
      const [contentsRes, postsRes, sitesRes] = await Promise.all([
        supabase
          .from("client_content" as any)
          .select("status")
          .eq("organization_id", orgId!),
        supabase
          .from("client_posts" as any)
          .select("status")
          .eq("organization_id", orgId!),
        supabase
          .from("client_sites")
          .select("status")
          .eq("organization_id", orgId!),
      ]);

      const countStatus = (rows: { status: string }[] | null, pendingVals: string[], approvedVals: string[]) => {
        const items = rows || [];
        return {
          pending: items.filter(r => pendingVals.includes(r.status)).length,
          approved: items.filter(r => approvedVals.includes(r.status)).length,
        };
      };

      const contents = countStatus(contentsRes.data as any, ["pending"], ["approved"]);
      const posts = countStatus(postsRes.data as any, ["pending"], ["approved"]);
      const sites = countStatus(sitesRes.data as any, ["Rascunho", "pending"], ["Aprovado", "approved", "Publicado", "published"]);

      return {
        contents,
        posts,
        sites,
        totalPending: contents.pending + posts.pending + sites.pending,
        totalApproved: contents.approved + posts.approved + sites.approved,
      };
    },
    enabled: !!orgId,
    staleTime: 1000 * 30,
  });
}
