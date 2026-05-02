import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

function getPortalContext(): string {
  const path = window.location.pathname;
  if (path.startsWith("/cliente") || path === "/" || path.startsWith("/app")) return "saas";
  return "franchise";
}

function getActiveOrgKey(userId: string): string {
  return `noe_active_org_${userId}`;
}

export function getStoredOrgId(userId: string): string | null {
  try {
    return localStorage.getItem(getActiveOrgKey(userId));
  } catch {
    return null;
  }
}

export function setStoredOrgId(userId: string, orgId: string) {
  try {
    localStorage.setItem(getActiveOrgKey(userId), orgId);
  } catch { /* localStorage may be unavailable */ }
}

export function useUserOrgId() {
  const { user } = useAuth();
  const portal = getPortalContext();

  return useQuery({
    queryKey: ["user-org-id", user?.id, portal],
    queryFn: async () => {
      if (!user) return null;

      // Check localStorage for a previously selected org
      const stored = getStoredOrgId(user.id);
      if (stored) {
        // Validate that the user still belongs to this org
        const { data: orgs } = await supabase.rpc("get_user_organizations", {
          _user_id: user.id,
          _portal: portal,
        });
        if (orgs && orgs.some((o: { org_id: string }) => o.org_id === stored)) {
          return stored;
        }
        // Stored org is invalid, clear it
        localStorage.removeItem(getActiveOrgKey(user.id));
      }

      // Fallback to default RPC
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
