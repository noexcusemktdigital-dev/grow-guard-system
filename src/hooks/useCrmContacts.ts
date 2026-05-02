import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUserOrgId } from "./useUserOrgId";
import { useState, useCallback } from "react";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/typed";

const PAGE_SIZE = 200;

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
  custom_fields: Record<string, unknown>;
  document: string | null;
  address: string | null;
  birth_date: string | null;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export function useCrmContacts(search?: string) {
  const { data: orgId } = useUserOrgId();
  const [page, setPage] = useState(0);

  const query = useQuery({
    queryKey: ["crm-contacts", orgId, search, page],
    queryFn: async () => {
      let q = supabase
        .from("crm_contacts")
        .select("*", { count: "exact" })
        .eq("organization_id", orgId!)
        .order("name")
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      if (search) {
        q = q.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
      }
      const { data, error, count } = await q;
      if (error) throw error;
      return { data: (data as CrmContact[]) ?? [], count: count ?? 0 };
    },
    enabled: !!orgId,
    placeholderData: keepPreviousData,
  });

  const nextPage = useCallback(() => {
    const total = query.data?.count ?? 0;
    if ((page + 1) * PAGE_SIZE < total) setPage(p => p + 1);
  }, [page, query.data?.count]);

  const prevPage = useCallback(() => {
    if (page > 0) setPage(p => p - 1);
  }, [page]);

  return {
    ...query,
    data: query.data?.data,
    totalCount: query.data?.count ?? 0,
    page,
    nextPage,
    prevPage,
    hasNextPage: query.data ? (page + 1) * PAGE_SIZE < query.data.count : false,
    hasPrevPage: page > 0,
  };
}

export function useCrmContactMutations() {
  const qc = useQueryClient();
  const { data: orgId } = useUserOrgId();

  const createContact = useMutation({
    mutationFn: async (contact: Partial<CrmContact> & { name: string }) => {
      const payload: TablesInsert<"crm_contacts"> = { ...contact, organization_id: orgId ?? "" };
      const { data, error } = await supabase
        .from("crm_contacts")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-contacts"] }),
  });

  const updateContact = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & TablesUpdate<"crm_contacts">) => {
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

  const bulkUpdateContacts = useMutation({
    mutationFn: async ({ ids, fields }: { ids: string[]; fields: TablesUpdate<"crm_contacts"> }) => {
      const { error } = await supabase.from("crm_contacts").update(fields).in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-contacts"] }),
  });

  const bulkDeleteContacts = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("crm_contacts").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-contacts"] }),
  });

  return { createContact, updateContact, deleteContact, bulkUpdateContacts, bulkDeleteContacts };
}
