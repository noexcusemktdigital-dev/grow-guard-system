import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUserOrgId } from "./useUserOrgId";
import { useAuth } from "@/contexts/AuthContext";
import type { TablesInsert } from "@/integrations/supabase/typed";

export function useContractTemplates() {
  const { data: orgId } = useUserOrgId();
  return useQuery({
    queryKey: ["contract-templates", orgId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_contract_templates_with_parent", {
        _org_id: orgId!,
      });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!orgId,
  });
}

export function useContracts() {
  const { data: orgId } = useUserOrgId();
  return useQuery({
    queryKey: ["contracts", orgId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_contracts_for_unit", {
        _org_id: orgId!,
      });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!orgId,
  });
}

export function useNetworkContracts() {
  const { data: orgId } = useUserOrgId();
  return useQuery({
    queryKey: ["network-contracts", orgId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_network_contracts", { _org_id: orgId! });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!orgId,
  });
}

export function useContractMutations() {
  const qc = useQueryClient();
  const { data: orgId } = useUserOrgId();
  const { user } = useAuth();

  const createTemplate = useMutation({
    mutationFn: async (t: { name: string; content?: string; variables?: Record<string, unknown>[]; template_type?: string; description?: string }) => {
      const { data, error } = await supabase.from("contract_templates").insert({ ...t, organization_id: orgId! } satisfies TablesInsert<"contract_templates">).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contract-templates"] }),
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: unknown }) => {
      const { data, error } = await supabase.from("contract_templates").update(updates).eq("id", id).eq("organization_id", orgId!).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contract-templates"] }),
  });

  const createContract = useMutation({
    mutationFn: async (c: {
      title: string;
      content?: string;
      template_id?: string;
      signer_name?: string;
      signer_email?: string;
      status?: string;
      lead_id?: string;
      client_document?: string;
      client_phone?: string;
      client_address?: string;
      service_description?: string;
      monthly_value?: number;
      total_value?: number;
      duration_months?: number;
      start_date?: string;
      end_date?: string;
      payment_day?: number;
      contract_type?: string;
      owner_type?: string;
      unit_org_id?: string;
    }) => {
      const { data, error } = await supabase.from("contracts").insert({ ...c, organization_id: orgId!, created_by: user?.id } satisfies TablesInsert<"contracts">).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contracts"] });
      qc.invalidateQueries({ queryKey: ["network-contracts"] });
    },
  });

  const updateContract = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: unknown }) => {
      const { data, error } = await supabase.from("contracts").update(updates).eq("id", id).eq("organization_id", orgId!).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contracts"] });
      qc.invalidateQueries({ queryKey: ["network-contracts"] });
    },
  });

  const deleteContract = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contracts").delete().eq("id", id).eq("organization_id", orgId!);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contracts"] });
      qc.invalidateQueries({ queryKey: ["network-contracts"] });
    },
  });

  const seedDefaultTemplates = useMutation({
    mutationFn: async (templates: { name: string; template_type: string; description: string; content: string }[]) => {
      const { data: existing } = await supabase
        .from("contract_templates")
        .select("name")
        .eq("organization_id", orgId!)
        .in("name", templates.map(t => t.name));
      const existingNames = new Set((existing ?? []).map(e => e.name));
      const toInsert = templates
        .filter(t => !existingNames.has(t.name))
        .map(t => ({ ...t, organization_id: orgId! }));
      if (toInsert.length === 0) return { inserted: 0 };
      const { error } = await supabase.from("contract_templates").insert(toInsert as TablesInsert<"contract_templates">[]);
      if (error) throw error;
      return { inserted: toInsert.length };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contract-templates"] }),
  });

  return { createTemplate, updateTemplate, createContract, updateContract, deleteContract, seedDefaultTemplates };
}
