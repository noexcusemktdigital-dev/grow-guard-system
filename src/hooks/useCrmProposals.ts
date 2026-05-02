import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUserOrgId } from "./useUserOrgId";
import { useAuth } from "@/contexts/AuthContext";
import type { TablesInsert } from "@/integrations/supabase/typed";

export interface ProposalItem {
  product_id: string | null;
  name: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
}

export interface CrmProposal {
  id: string;
  organization_id: string;
  lead_id: string | null;
  title: string;
  value: number | null;
  status: string;
  content: Record<string, unknown> | null;
  items: ProposalItem[];
  partner_company_id: string | null;
  notes: string | null;
  valid_until: string | null;
  payment_terms: string | null;
  discount_total: number;
  created_by: string | null;
  sent_at: string | null;
  accepted_at: string | null;
  rejected_at: string | null;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export function useCrmProposals(leadId?: string) {
  const { data: orgId } = useUserOrgId();

  return useQuery({
    queryKey: ["crm-proposals", orgId, leadId],
    queryFn: async () => {
      let q = supabase
        .from("crm_proposals")
        .select("*")
        .eq("organization_id", orgId!)
        .order("created_at", { ascending: false });
      if (leadId) q = q.eq("lead_id", leadId);
      const { data, error } = await q;
      if (error) throw error;
      return (data as Record<string, unknown>[]).map(d => ({
        ...d,
        items: Array.isArray(d.items) ? d.items : [],
        discount_total: d.discount_total ?? 0,
      })) as CrmProposal[];
    },
    enabled: !!orgId,
  });
}

export function useCrmProposalMutations() {
  const qc = useQueryClient();
  const { data: orgId } = useUserOrgId();
  const { user } = useAuth();

  const createProposal = useMutation({
    mutationFn: async (proposal: Partial<CrmProposal> & { title: string }) => {
      const payload: TablesInsert<"crm_proposals"> = {
        ...proposal,
        organization_id: orgId!,
        created_by: user?.id ?? null,
        items: JSON.stringify(proposal.items ?? []) as TablesInsert<"crm_proposals">["items"],
      };
      const { data, error } = await supabase
        .from("crm_proposals")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-proposals"] }),
  });

  const updateProposal = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: unknown }) => {
      const payload = { ...updates };
      if (payload.items) payload.items = JSON.stringify(payload.items);
      const { data, error } = await supabase
        .from("crm_proposals")
        .update(payload)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-proposals"] }),
  });

  const deleteProposal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("crm_proposals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-proposals"] }),
  });

  const duplicateProposal = useMutation({
    mutationFn: async (proposal: CrmProposal) => {
      const { data, error } = await supabase
        .from("crm_proposals")
        .insert({
          organization_id: orgId!,
          lead_id: proposal.lead_id,
          title: `${proposal.title} (cópia)`,
          value: proposal.value,
          status: "draft",
          items: JSON.stringify(proposal.items) as TablesInsert<"crm_proposals">["items"],
          partner_company_id: proposal.partner_company_id,
          notes: proposal.notes,
          valid_until: proposal.valid_until,
          payment_terms: proposal.payment_terms,
          discount_total: proposal.discount_total,
          created_by: user?.id ?? null,
        } satisfies TablesInsert<"crm_proposals">)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-proposals"] }),
  });

  return { createProposal, updateProposal, deleteProposal, duplicateProposal };
}
