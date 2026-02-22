import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserOrgId } from "./useUserOrgId";

export function useCrmLeads(funnelId?: string, stage?: string) {
  const { data: orgId } = useUserOrgId();

  const query = useQuery({
    queryKey: ["crm-leads", orgId, funnelId, stage],
    queryFn: async () => {
      let q = supabase
        .from("crm_leads")
        .select("*")
        .eq("organization_id", orgId!)
        .order("created_at", { ascending: false });
      if (funnelId) q = q.eq("funnel_id", funnelId);
      if (stage) q = q.eq("stage", stage);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  return query;
}

export function useCrmLeadById(id: string | undefined) {
  const { data: orgId } = useUserOrgId();

  return useQuery({
    queryKey: ["crm-lead", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_leads")
        .select("*")
        .eq("id", id!)
        .eq("organization_id", orgId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!orgId,
  });
}

export function useCrmLeadMutations() {
  const qc = useQueryClient();
  const { data: orgId } = useUserOrgId();

  const createLead = useMutation({
    mutationFn: async (lead: {
      name: string;
      email?: string;
      phone?: string;
      company?: string;
      stage?: string;
      source?: string;
      value?: number;
      funnel_id?: string;
      tags?: string[];
    }) => {
      const { data, error } = await supabase
        .from("crm_leads")
        .insert({ ...lead, organization_id: orgId! })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-leads"] }),
  });

  const updateLead = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { data, error } = await supabase
        .from("crm_leads")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-leads"] });
      qc.invalidateQueries({ queryKey: ["crm-lead"] });
    },
  });

  const markAsWon = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("crm_leads")
        .update({ won_at: new Date().toISOString(), stage: "fechado" })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-leads"] });
      qc.invalidateQueries({ queryKey: ["crm-lead"] });
    },
  });

  const markAsLost = useMutation({
    mutationFn: async ({ id, lost_reason }: { id: string; lost_reason?: string }) => {
      const { data, error } = await supabase
        .from("crm_leads")
        .update({ lost_at: new Date().toISOString(), lost_reason, stage: "perdido" })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-leads"] });
      qc.invalidateQueries({ queryKey: ["crm-lead"] });
    },
  });

  const deleteLead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("crm_leads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-leads"] }),
  });

  return { createLead, updateLead, deleteLead, markAsWon, markAsLost };
}
