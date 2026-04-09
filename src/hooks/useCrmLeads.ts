import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUserOrgId } from "./useUserOrgId";
import { playSound } from "@/lib/sounds";
import { useState, useCallback } from "react";

const PAGE_SIZE = 200;

export function useCrmLeads(funnelId?: string, stage?: string) {
  const { data: orgId } = useUserOrgId();
  const [page, setPage] = useState(0);

  const query = useQuery({
    queryKey: ["crm-leads", orgId, funnelId, stage, page],
    queryFn: async () => {
      let q = supabase
        .from("crm_leads")
        .select("id, name, phone, email, company, value, stage, source, tags, created_at, won_at, lost_at, lost_reason, assigned_to, funnel_id, temperature, whatsapp_contact_id, updated_at", { count: "exact" })
        .eq("organization_id", orgId!)
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      if (funnelId) q = q.eq("funnel_id", funnelId);
      if (stage) q = q.eq("stage", stage);
      const { data, error, count } = await q;
      if (error) throw error;
      return { data: data ?? [], count: count ?? 0, page, pageSize: PAGE_SIZE };
    },
    enabled: !!orgId,
    staleTime: 1000 * 60 * 2,
    placeholderData: keepPreviousData,
  });

  const nextPage = useCallback(() => {
    const total = query.data?.count ?? 0;
    if ((page + 1) * PAGE_SIZE < total) setPage(p => p + 1);
  }, [page, query.data?.count]);

  const prevPage = useCallback(() => {
    if (page > 0) setPage(p => p - 1);
  }, [page]);

  const resetPage = useCallback(() => setPage(0), []);

  return {
    ...query,
    // Flatten for backward compat — consumers use `data` as array
    data: query.data?.data,
    totalCount: query.data?.count ?? 0,
    page,
    pageSize: PAGE_SIZE,
    nextPage,
    prevPage,
    resetPage,
    hasNextPage: query.data ? (page + 1) * PAGE_SIZE < query.data.count : false,
    hasPrevPage: page > 0,
  };
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
      _maxLeads?: number; // injected by caller to enforce limit
    }) => {
      // Enforce lead limit if provided
      if (lead._maxLeads && lead._maxLeads > 0) {
        const { count, error: countErr } = await supabase
          .from("crm_leads")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", orgId!)
          .is("archived_at", null);
        if (countErr) throw countErr;
        if ((count ?? 0) >= lead._maxLeads) {
          throw new Error("LEAD_LIMIT_REACHED");
        }
      }
      const { _maxLeads, ...leadData } = lead;

      const { data, error } = await supabase
        .from("crm_leads")
        .insert({ ...leadData, organization_id: orgId! })
        .select()
        .single();
      if (error) throw error;

      // Round-robin roulette logic
      try {
        const { data: settings } = await supabase
          .from("crm_settings")
          .select("*")
          .eq("organization_id", orgId!)
          .maybeSingle();

        if (settings) {
          const settingsRecord = settings as unknown as Record<string, unknown>;
          const rouletteEnabled = settingsRecord.lead_roulette_enabled;
          const members = settingsRecord.roulette_members as string[] | null;
          const lastIndex = (settingsRecord.roulette_last_index as number) || 0;

          if (rouletteEnabled && members && members.length > 0) {
            const nextIndex = lastIndex % members.length;
            const assignedTo = members[nextIndex];

            await supabase
              .from("crm_leads")
              .update({ assigned_to: assignedTo })
              .eq("id", data.id);

            await supabase
              .from("crm_settings")
              .update({ roulette_last_index: nextIndex + 1 } as Record<string, unknown>)
              .eq("id", settings.id);

            data.assigned_to = assignedTo;
          }
        }
      } catch (e) {
        // Roulette assignment failed
      }

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-leads"] });
      qc.invalidateQueries({ queryKey: ["crm-lead-count"] });
      qc.invalidateQueries({ queryKey: ["goal-progress"] });
      playSound("success");
    },
  });

  const updateLead = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: unknown }) => {
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
      qc.invalidateQueries({ queryKey: ["goal-progress"] });
    },
  });

  const markAsWon = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("crm_leads")
        .update({ won_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-leads"] });
      qc.invalidateQueries({ queryKey: ["crm-lead"] });
      qc.invalidateQueries({ queryKey: ["goal-progress"] });
    },
  });

  const markAsLost = useMutation({
    mutationFn: async ({ id, lost_reason }: { id: string; lost_reason?: string }) => {
      const { data, error } = await supabase
        .from("crm_leads")
        .update({ lost_at: new Date().toISOString(), lost_reason })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-leads"] });
      qc.invalidateQueries({ queryKey: ["crm-lead"] });
      qc.invalidateQueries({ queryKey: ["goal-progress"] });
    },
  });

  const deleteLead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("crm_leads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-leads"] });
      qc.invalidateQueries({ queryKey: ["crm-lead-count"] });
      qc.invalidateQueries({ queryKey: ["goal-progress"] });
    },
  });

  const bulkUpdateLeads = useMutation({
    mutationFn: async ({ ids, fields }: { ids: string[]; fields: Record<string, unknown> }) => {
      const { error } = await supabase.from("crm_leads").update(fields).in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-leads"] });
      qc.invalidateQueries({ queryKey: ["crm-lead"] });
      qc.invalidateQueries({ queryKey: ["goal-progress"] });
    },
  });

  const bulkDeleteLeads = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("crm_leads").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-leads"] });
      qc.invalidateQueries({ queryKey: ["crm-lead-count"] });
      qc.invalidateQueries({ queryKey: ["goal-progress"] });
    },
  });

  const bulkAddTag = useMutation({
    mutationFn: async ({ ids, tag }: { ids: string[]; tag: string }) => {
      const { error } = await supabase.rpc("bulk_add_tag" as unknown as "get_parent_org_id", { _ids: ids, _tag: tag } as Record<string, unknown>);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-leads"] });
      qc.invalidateQueries({ queryKey: ["goal-progress"] });
    },
  });

  const archiveOldLeads = useMutation({
    mutationFn: async () => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 90);
      const { error } = await supabase
        .from("crm_leads")
        .update({ archived_at: new Date().toISOString() } as Record<string, unknown>)
        .eq("organization_id", orgId!)
        .not("lost_at", "is", null)
        .lt("lost_at", cutoff.toISOString());
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-leads"] });
      qc.invalidateQueries({ queryKey: ["crm-lead-count"] });
      qc.invalidateQueries({ queryKey: ["goal-progress"] });
    },
  });

  return { createLead, updateLead, deleteLead, markAsWon, markAsLost, bulkUpdateLeads, bulkDeleteLeads, bulkAddTag, archiveOldLeads };
}
