import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserOrgId } from "./useUserOrgId";

export function useOnboardingUnits() {
  const { data: orgId } = useUserOrgId();
  return useQuery({
    queryKey: ["onboarding-units", orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from("onboarding_units").select("*").eq("organization_id", orgId!).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}

export function useOnboardingChecklist(unitId?: string) {
  const { data: orgId } = useUserOrgId();
  return useQuery({
    queryKey: ["onboarding-checklist", orgId, unitId],
    queryFn: async () => {
      let q = supabase.from("onboarding_checklist").select("*").eq("organization_id", orgId!).order("sort_order");
      if (unitId) q = q.eq("onboarding_unit_id", unitId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}

export function useOnboardingMeetings(unitId?: string) {
  const { data: orgId } = useUserOrgId();
  return useQuery({
    queryKey: ["onboarding-meetings", orgId, unitId],
    queryFn: async () => {
      let q = supabase.from("onboarding_meetings").select("*").eq("organization_id", orgId!).order("date");
      if (unitId) q = q.eq("onboarding_unit_id", unitId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}

export function useOnboardingTasks(unitId?: string) {
  const { data: orgId } = useUserOrgId();
  return useQuery({
    queryKey: ["onboarding-tasks", orgId, unitId],
    queryFn: async () => {
      let q = supabase.from("onboarding_tasks").select("*").eq("organization_id", orgId!).order("due_date");
      if (unitId) q = q.eq("onboarding_unit_id", unitId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}

export function useOnboardingIndicators(unitId?: string) {
  const { data: orgId } = useUserOrgId();
  return useQuery({
    queryKey: ["onboarding-indicators", orgId, unitId],
    queryFn: async () => {
      let q = supabase.from("onboarding_indicators").select("*").eq("organization_id", orgId!);
      if (unitId) q = q.eq("onboarding_unit_id", unitId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}

export function useOnboardingMutations() {
  const qc = useQueryClient();
  const { data: orgId } = useUserOrgId();

  const createUnit = useMutation({
    mutationFn: async (unit: { name: string; start_date?: string; target_date?: string; unit_org_id?: string }) => {
      const { data, error } = await supabase.from("onboarding_units").insert({ ...unit, organization_id: orgId! }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["onboarding-units"] }),
  });

  return { createUnit };
}
