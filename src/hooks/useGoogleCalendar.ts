import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

function detectPortal(): string {
  const path = window.location.pathname;
  if (path.startsWith("/cliente") || path === "/") return "saas";
  return "franchise";
}

export function useGoogleCalendarConnection() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["google-calendar-connection", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("google_calendar_tokens")
        .select("id, google_calendar_id, expires_at, updated_at, access_token")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      if (data && data.access_token) return data;
      return null;
    },
    enabled: !!user,
  });
}

export function useGoogleCalendarConnect(portal?: string) {
  const resolvedPortal = portal || detectPortal();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("google-calendar-oauth", {
        body: { action: "get_auth_url", portal: resolvedPortal },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data.url as string;
    },
  });
}

export function useGoogleCalendarDisconnect() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("google-calendar-oauth", {
        body: { action: "disconnect" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["google-calendar-connection"] });
      toast.success("Google Agenda desconectado");
    },
  });
}

export function useGoogleCalendarSync(portal?: string) {
  const qc = useQueryClient();
  const resolvedPortal = portal || detectPortal();

  return useMutation({
    mutationFn: async (action: "pull" | "push" | "delete", event?: Record<string, unknown>) => {
      const { data, error } = await supabase.functions.invoke("google-calendar-sync", {
        body: { action, event, portal: resolvedPortal },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["calendar-events"] });
    },
  });
}
