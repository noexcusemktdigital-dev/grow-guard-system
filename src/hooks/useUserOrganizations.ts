// @ts-nocheck
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

function getPortalContext(): string {
  const path = window.location.pathname;
  if (path.startsWith("/cliente") || path === "/") return "saas";
  return "franchise";
}

export interface UserOrganization {
  org_id: string;
  org_name: string;
  org_type: string;
  logo_url: string | null;
}

export function useUserOrganizations() {
  const { user } = useAuth();
  const portal = getPortalContext();

  return useQuery({
    queryKey: ["user-organizations", user?.id, portal],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.rpc("get_user_organizations", {
        _user_id: user.id,
        _portal: portal,
      });
      if (error) throw error;
      return (data ?? []) as UserOrganization[];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });
}
