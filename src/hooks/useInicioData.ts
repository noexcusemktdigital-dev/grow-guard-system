// @ts-nocheck
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export interface InicioData {
  org_id: string;
  profile: { id: string; full_name: string | null; avatar_url: string | null; phone: string | null; job_title: string | null } | null;
  org: { id: string; name: string; cnpj: string | null; address: string | null; phone: string | null; logo_url: string | null } | null;
  gamification: { xp: number; streak_days: number; points: number; title: string; last_activity_at: string | null };
  leads_summary: {
    this_month: number; prev_month: number;
    won_this_month: number; won_prev_month: number;
    revenue_this_month: number; revenue_prev_month: number;
    my_count: number; my_won: number;
    leads_without_contact_48h: number;
    today_count: number;
    weekly_revenue: Array<{ week: string; receita: number }>;
    total: number;
  };
  active_goals: Array<{ id: string; title: string; target_value: number; metric: string | null; period_start: string; period_end: string }>;
  goal_progress: Record<string, { currentValue: number; percent: number; remaining: number }>;
  checklist_today: Array<{ id: string; title: string; is_completed: boolean; due_date: string }>;
  my_pending_tasks: number;
  announcements_unread: Array<{ id: string; title: string; priority: string | null; published_at: string | null }>;
  wa_status: string | null;
  wa_unread_conversations: number;
  active_agents_count: number;
  daily_message: { message: string; author: string | null } | null;
}

export function useInicioData() {
  const { user } = useAuth();
  return useQuery<InicioData>({
    queryKey: ["inicio-data", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("get-inicio-data");
      if (error) throw error;
      return data as InicioData;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });
}
