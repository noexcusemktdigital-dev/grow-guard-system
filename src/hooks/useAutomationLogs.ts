import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUserOrgId } from "./useUserOrgId";
import type { Tables } from "@/integrations/supabase/typed";

type AutomationLogRow = Tables<"automation_execution_logs"> & {
  crm_automations: { name: string } | null;
  crm_leads: { name: string } | null;
};

export interface AutomationLog {
  id: string;
  organization_id: string;
  automation_id: string | null;
  event_id: string | null;
  lead_id: string | null;
  action_type: string | null;
  status: string;
  error_message: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  // joined
  automation_name?: string;
  lead_name?: string;
}

export function useAutomationLogs(filters?: { status?: string; automationId?: string }) {
  const { data: orgId } = useUserOrgId();

  return useQuery({
    queryKey: ["automation-execution-logs", orgId, filters],
    queryFn: async () => {
      let query = supabase
        .from("automation_execution_logs")
        .select(`
          *,
          crm_automations ( name ),
          crm_leads ( name )
        `)
        .eq("organization_id", orgId!)
        .order("created_at", { ascending: false })
        .limit(100);

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.automationId) {
        query = query.eq("automation_id", filters.automationId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data as AutomationLogRow[] || []).map((row) => ({
        ...row,
        automation_name: row.crm_automations?.name || null,
        lead_name: row.crm_leads?.name || null,
      })) as AutomationLog[];
    },
    enabled: !!orgId,
  });
}
