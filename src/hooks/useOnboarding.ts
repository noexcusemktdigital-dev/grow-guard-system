import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
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
    mutationFn: async (unit: { name: string; start_date?: string; target_date?: string; unit_org_id?: string; responsible?: string }) => {
      const { data, error } = await supabase.from("onboarding_units").insert({ ...unit, organization_id: orgId! }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["onboarding-units"] }),
  });

  const updateUnit = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: unknown }) => {
      const { data, error } = await supabase.from("onboarding_units").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["onboarding-units"] }),
  });

  const toggleChecklistItem = useMutation({
    mutationFn: async ({ id, is_completed }: { id: string; is_completed: boolean }) => {
      const { error } = await supabase.from("onboarding_checklist").update({ is_completed, completed_at: is_completed ? new Date().toISOString() : null }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["onboarding-checklist"] }),
  });

  const createChecklistItem = useMutation({
    mutationFn: async (item: { title: string; onboarding_unit_id: string; phase?: string; sort_order?: number }) => {
      const { data, error } = await supabase.from("onboarding_checklist").insert({ ...item, organization_id: orgId! }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["onboarding-checklist"] }),
  });

  const createMeeting = useMutation({
    mutationFn: async (meeting: { title: string; onboarding_unit_id: string; date?: string; type?: string; notes?: string; status?: string }) => {
      const { data, error } = await supabase.from("onboarding_meetings").insert({ ...meeting, organization_id: orgId! }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["onboarding-meetings"] }),
  });

  const updateMeeting = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: unknown }) => {
      const { error } = await supabase.from("onboarding_meetings").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["onboarding-meetings"] }),
  });

  const createTask = useMutation({
    mutationFn: async (task: { title: string; onboarding_unit_id: string; due_date?: string; assigned_to?: string }) => {
      const { data, error } = await supabase.from("onboarding_tasks").insert({ ...task, organization_id: orgId! }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["onboarding-tasks"] }),
  });

  const toggleTask = useMutation({
    mutationFn: async ({ id, is_completed }: { id: string; is_completed: boolean }) => {
      const { error } = await supabase.from("onboarding_tasks").update({ is_completed, completed_at: is_completed ? new Date().toISOString() : null }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["onboarding-tasks"] }),
  });

  return { createUnit, updateUnit, toggleChecklistItem, createChecklistItem, createMeeting, updateMeeting, createTask, toggleTask };
}
