import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUserOrgId } from "./useUserOrgId";
import type { TablesInsert } from "@/integrations/supabase/typed";

export interface CalculatorSettings {
  surplus_type: "fixed" | "percentage";
  surplus_value: number;
}

export function useCalculatorSettings() {
  const { data: orgId } = useUserOrgId();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["calculator-settings", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("calculator_settings")
        .select("*")
        .eq("organization_id", orgId!)
        .maybeSingle();
      if (error) throw error;
      return data as { surplus_type: string; surplus_value: number } | null;
    },
    enabled: !!orgId,
  });

  const upsert = useMutation({
    mutationFn: async (settings: CalculatorSettings) => {
      const { error } = await supabase
        .from("calculator_settings")
        .upsert(
          {
            organization_id: orgId!,
            surplus_type: settings.surplus_type,
            surplus_value: settings.surplus_value,
            updated_at: new Date().toISOString(),
          } satisfies TablesInsert<"calculator_settings">,
          { onConflict: "organization_id" }
        );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["calculator-settings"] }),
  });

  const surplusType = (query.data?.surplus_type as "fixed" | "percentage") || "percentage";
  const surplusValue = query.data?.surplus_value ?? 0;

  return { surplusType, surplusValue, isLoaded: !query.isLoading, upsert };
}
