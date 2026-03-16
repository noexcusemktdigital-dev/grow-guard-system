import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export function useUserOrgId() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-org-id", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.rpc("get_user_org_id", {
        _user_id: user.id,
      });
      if (error) throw error;
      return data as string | null;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });
}
