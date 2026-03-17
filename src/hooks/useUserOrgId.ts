import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

function getPortalContext(): string {
  const path = window.location.pathname;
  if (path.startsWith("/cliente") || path.startsWith("/app")) return "saas";
  return "franchise";
}

export function useUserOrgId() {
  const { user } = useAuth();
  const portal = getPortalContext();

  return useQuery({
    queryKey: ["user-org-id", user?.id, portal],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.rpc("get_user_org_id", {
        _user_id: user.id,
        _portal: portal,
      });
      if (error) throw error;
      return data as string | null;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });
}
