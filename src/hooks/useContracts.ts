import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserOrgId } from "./useUserOrgId";
import { useAuth } from "@/contexts/AuthContext";

export function useContractTemplates() {
  const { data: orgId } = useUserOrgId();
  return useQuery({
    queryKey: ["contract-templates", orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from("contract_templates").select("*").eq("organization_id", orgId!).order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}

export function useContracts() {
  const { data: orgId } = useUserOrgId();
  return useQuery({
    queryKey: ["contracts", orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from("contracts").select("*").eq("organization_id", orgId!).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}

export function useContractMutations() {
  const qc = useQueryClient();
  const { data: orgId } = useUserOrgId();
  const { user } = useAuth();

  const createTemplate = useMutation({
    mutationFn: async (t: { name: string; content?: string; variables?: any[] }) => {
      const { data, error } = await supabase.from("contract_templates").insert({ ...t, organization_id: orgId! }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contract-templates"] }),
  });

  const createContract = useMutation({
    mutationFn: async (c: { title: string; content?: string; template_id?: string; signer_name?: string; signer_email?: string }) => {
      const { data, error } = await supabase.from("contracts").insert({ ...c, organization_id: orgId!, created_by: user?.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contracts"] }),
  });

  const updateContract = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { data, error } = await supabase.from("contracts").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contracts"] }),
  });

  return { createTemplate, createContract, updateContract };
}
