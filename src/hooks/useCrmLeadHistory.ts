// @ts-nocheck
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface CrmLeadHistoryEntry {
  id: string;
  lead_id: string;
  event_type: string;
  description: string;
  metadata: Record<string, any>;
  created_at: string;
}

export function useCrmLeadHistory(leadId: string | null, limit = 30) {
  return useQuery({
    queryKey: ["crm-lead-history", leadId, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_lead_history")
        .select("*")
        .eq("lead_id", leadId!)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as CrmLeadHistoryEntry[];
    },
    enabled: !!leadId,
  });
}
