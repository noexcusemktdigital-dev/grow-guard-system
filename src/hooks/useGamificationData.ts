// @ts-nocheck
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export interface GamificationData {
  org_id: string;
  profile: { full_name: string | null; phone: string | null; job_title: string | null; avatar_url: string | null } | null;
  org: { name: string | null; cnpj: string | null; address: string | null; phone: string | null; logo_url: string | null } | null;
  gamification: { xp: number; streak_days: number; points: number; title: string; last_activity_at: string | null };
  counts: {
    total_leads: number; won_leads: number; won_value: number; pipeline_value: number; complete_leads: number;
    contents: number; dispatches: number; sites: number; active_agents: number;
    members: number; teams: number;
    calendar_events: number; checklist_done: number; academy_done: number; custom_funnels: number;
  };
  flags: { wa_connected: boolean; has_strategy: boolean };
  avg_eval: number | null;
  evals_count: number;
  total_org_xp: number;
  team_ranking: Array<{ user_id: string; full_name: string; xp: number; title: string; streak_days: number }>;
  claimed_reward_ids: string[];
}

export function useGamificationData() {
  const { user } = useAuth();
  return useQuery<GamificationData>({
    queryKey: ["gamification-data", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("calculate-gamification");
      if (error) throw error;
      return data as GamificationData;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}
