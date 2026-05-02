import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUserOrgId } from "./useUserOrgId";
import type { Tables, TablesInsert } from "@/integrations/supabase/typed";

type CrmLeadProductRow = Tables<"crm_lead_products"> & {
  crm_products: { name: string } | null;
};
type CrmLeadProductInsert = TablesInsert<"crm_lead_products">;

export interface CrmLeadProduct {
  id: string;
  lead_id: string;
  product_id: string;
  organization_id: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  notes: string | null;
  created_at: string;
  product_name?: string;
}

export function useCrmLeadProducts(leadId: string | null) {
  const { data: orgId } = useUserOrgId();

  return useQuery({
    queryKey: ["crm-lead-products", leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_lead_products")
        .select("*, crm_products(name)")
        .eq("lead_id", leadId!)
        .order("created_at");
      if (error) throw error;
      return (data as CrmLeadProductRow[] || []).map((row) => ({
        ...row,
        product_name: row.crm_products?.name || "Produto removido",
      })) as CrmLeadProduct[];
    },
    enabled: !!leadId && !!orgId,
  });
}

export function useCrmLeadProductMutations() {
  const qc = useQueryClient();
  const { data: orgId } = useUserOrgId();

  const addProduct = useMutation({
    mutationFn: async (input: {
      lead_id: string;
      product_id: string;
      quantity?: number;
      unit_price: number;
      discount_percent?: number;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from("crm_lead_products")
        .insert({
          lead_id: input.lead_id,
          product_id: input.product_id,
          organization_id: orgId!,
          quantity: input.quantity || 1,
          unit_price: input.unit_price,
          discount_percent: input.discount_percent || 0,
          notes: input.notes || null,
        } satisfies CrmLeadProductInsert)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: ["crm-lead-products", vars.lead_id] }),
  });

  const updateProduct = useMutation({
    mutationFn: async ({ id, lead_id, ...updates }: { id: string; lead_id: string; [k: string]: unknown }) => {
      const { error } = await supabase
        .from("crm_lead_products")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: ["crm-lead-products", vars.lead_id] }),
  });

  const removeProduct = useMutation({
    mutationFn: async ({ id, lead_id }: { id: string; lead_id: string }) => {
      const { error } = await supabase
        .from("crm_lead_products")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: ["crm-lead-products", vars.lead_id] }),
  });

  return { addProduct, updateProduct, removeProduct };
}
