import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUserOrgId } from "./useUserOrgId";

export interface AcademyUnitReport {
  unit_id: string;
  unit_name: string;
  users_count: number;
  avg_completion: number;
  quizzes_passed: number;
  certificates_count: number;
}

export function useAcademyReports() {
  const { data: orgId } = useUserOrgId();

  return useQuery({
    queryKey: ["academy-reports", orgId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_academy_reports" as any, {
        _org_id: orgId!,
      });
      if (error) throw error;
      return (data ?? []) as unknown as AcademyUnitReport[];
    },
    enabled: !!orgId,
    staleTime: 1000 * 60 * 5,
  });
}
