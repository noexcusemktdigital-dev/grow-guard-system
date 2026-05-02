// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUserOrgId } from "./useUserOrgId";
import { useAuth } from "@/contexts/AuthContext";

export function useCalendars() {
  const { data: orgId } = useUserOrgId();
  return useQuery({
    queryKey: ["calendars", orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from("calendars").select("*").eq("organization_id", orgId!).order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useCalendarEvents(startDate?: string, endDate?: string) {
  const { data: orgId } = useUserOrgId();
  return useQuery({
    queryKey: ["calendar-events", orgId, startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_calendar_events_with_parent", {
        _org_id: orgId!,
        _start: startDate ?? null,
        _end: endDate ?? null,
      });
      if (error) throw error;
      return data as Record<string, unknown>[];
    },
    enabled: !!orgId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useCalendarEventMutations() {
  const qc = useQueryClient();
  const { data: orgId } = useUserOrgId();
  const { user } = useAuth();

  const createEvent = useMutation({
    mutationFn: async (event: { title: string; start_at: string; end_at: string; description?: string; location?: string; calendar_id?: string; all_day?: boolean; color?: string }) => {
      const { data, error } = await supabase.from("calendar_events").insert({ ...event, organization_id: orgId!, created_by: user?.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["calendar-events"] }),
  });

  const updateEvent = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: unknown }) => {
      const { data, error } = await supabase.from("calendar_events").update(updates).eq("id", id).eq("organization_id", orgId!).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["calendar-events"] }),
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("calendar_events").delete().eq("id", id).eq("organization_id", orgId!);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["calendar-events"] }),
  });

  return { createEvent, updateEvent, deleteEvent };
}
