import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUserOrgId } from "./useUserOrgId";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/typed";

export interface CrmProduct {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  price: number;
  unit: string;
  category: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useCrmProducts(onlyActive = true) {
  const { data: orgId } = useUserOrgId();

  return useQuery({
    queryKey: ["crm-products", orgId, onlyActive],
    queryFn: async () => {
      let q = supabase
        .from("crm_products")
        .select("*")
        .eq("organization_id", orgId!)
        .order("name");
      if (onlyActive) q = q.eq("is_active", true);
      const { data, error } = await q;
      if (error) throw error;
      return data as CrmProduct[];
    },
    enabled: !!orgId,
  });
}

export function useCrmProductMutations() {
  const qc = useQueryClient();
  const { data: orgId } = useUserOrgId();

  const createProduct = useMutation({
    mutationFn: async (product: Partial<CrmProduct> & { name: string }) => {
      const payload: TablesInsert<"crm_products"> = { ...product, organization_id: orgId ?? "" };
      const { data, error } = await supabase
        .from("crm_products")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-products"] }),
  });

  const updateProduct = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & TablesUpdate<"crm_products">) => {
      const { data, error } = await supabase
        .from("crm_products")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-products"] }),
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("crm_products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-products"] }),
  });

  return { createProduct, updateProduct, deleteProduct };
}
