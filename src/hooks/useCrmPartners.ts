import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUserOrgId } from "./useUserOrgId";
import type { TablesInsert } from "@/integrations/supabase/typed";

export interface CrmPartner {
  id: string;
  organization_id: string;
  name: string;
  document: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useCrmPartners() {
  const { data: orgId } = useUserOrgId();

  return useQuery({
    queryKey: ["crm-partners", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_partner_companies")
        .select("*")
        .eq("organization_id", orgId!)
        .order("name");
      if (error) throw error;
      return data as CrmPartner[];
    },
    enabled: !!orgId,
  });
}

export function useCrmPartnerMutations() {
  const qc = useQueryClient();
  const { data: orgId } = useUserOrgId();

  const createPartner = useMutation({
    mutationFn: async (partner: Partial<CrmPartner> & { name: string }) => {
      const { data, error } = await supabase
        .from("crm_partner_companies")
        .insert({ ...partner, organization_id: orgId ?? "" } as TablesInsert<"crm_partner_companies">)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-partners"] }),
  });

  const updatePartner = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: unknown }) => {
      const { data, error } = await supabase
        .from("crm_partner_companies")
        .update(updates)
        .eq("id", id)
        .eq("organization_id", orgId!)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-partners"] }),
  });

  const deletePartner = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("crm_partner_companies").delete().eq("id", id).eq("organization_id", orgId!);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-partners"] }),
  });

  return { createPartner, updatePartner, deletePartner };
}
