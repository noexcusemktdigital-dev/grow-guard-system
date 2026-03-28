import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUserOrgId } from "./useUserOrgId";

export function useUnits() {
  const { data: orgId } = useUserOrgId();
  return useQuery({
    queryKey: ["units", orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from("units").select("*").eq("organization_id", orgId!).order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}

export function useUnitMutations() {
  const qc = useQueryClient();
  const { data: orgId } = useUserOrgId();

  const createUnit = useMutation({
    mutationFn: async (unit: { name: string; city?: string; state?: string; address?: string; phone?: string; email?: string; manager_name?: string; unit_org_id?: string }) => {
      const { data, error } = await supabase.from("units").insert({ ...unit, organization_id: orgId! }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["units"] }),
  });

  const updateUnit = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: unknown }) => {
      const { data, error } = await supabase.from("units").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["units"] }),
  });

  const deleteUnit = useMutation({
    mutationFn: async (unitId: string) => {
      const { data, error } = await supabase.functions.invoke("delete-unit", {
        body: { unit_id: unitId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["units"] }),
  });

  return { createUnit, updateUnit, deleteUnit };
}
