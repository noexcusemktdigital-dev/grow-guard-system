import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserOrgId } from "./useUserOrgId";

export interface CrmContact {
  id: string;
  organization_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  position: string | null;
  notes: string | null;
  tags: string[];
  source: string | null;
  custom_fields: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export function useCrmContacts(search?: string) {
  const { data: orgId } = useUserOrgId();

  return useQuery({
    queryKey: ["crm-contacts", orgId, search],
    queryFn: async () => {
      let q = supabase
        .from("crm_contacts")
        .select("*")
        .eq("organization_id", orgId!)
        .order("name");
      if (search) {
        q = q.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data as CrmContact[];
    },
    enabled: !!orgId,
  });
}

export function useCrmContactMutations() {
  const qc = useQueryClient();
  const { data: orgId } = useUserOrgId();

  const createContact = useMutation({
    mutationFn: async (contact: Partial<CrmContact> & { name: string }) => {
      const { data, error } = await supabase
        .from("crm_contacts")
        .insert({ ...contact, organization_id: orgId! } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-contacts"] }),
  });

  const updateContact = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { data, error } = await supabase
        .from("crm_contacts")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-contacts"] }),
  });

  const deleteContact = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("crm_contacts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-contacts"] }),
  });

  return { createContact, updateContact, deleteContact };
}
