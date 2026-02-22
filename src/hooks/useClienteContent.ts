import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserOrgId } from "./useUserOrgId";
import { useAuth } from "@/contexts/AuthContext";

export function useClienteContent() {
  const { data: orgId } = useUserOrgId();
  return useQuery({
    queryKey: ["client-content", orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from("client_content").select("*").eq("organization_id", orgId!).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}

export function useClienteCampaigns() {
  const { data: orgId } = useUserOrgId();
  return useQuery({
    queryKey: ["client-campaigns", orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from("client_campaigns").select("*").eq("organization_id", orgId!).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}

export function useClienteScripts() {
  const { data: orgId } = useUserOrgId();
  return useQuery({
    queryKey: ["client-scripts", orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from("client_scripts").select("*").eq("organization_id", orgId!).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}

export function useClienteDispatches() {
  const { data: orgId } = useUserOrgId();
  return useQuery({
    queryKey: ["client-dispatches", orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from("client_dispatches").select("*").eq("organization_id", orgId!).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}

export function useClienteSites() {
  const { data: orgId } = useUserOrgId();
  return useQuery({
    queryKey: ["client-sites", orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from("client_sites").select("*").eq("organization_id", orgId!).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}

export function useClienteNotifications() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["client-notifications", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("client_notifications").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useClienteChecklist(date?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["client-checklist", user?.id, date],
    queryFn: async () => {
      let q = supabase.from("client_checklist_items").select("*").eq("user_id", user!.id).order("created_at");
      if (date) q = q.eq("date", date);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useClienteGamification() {
  const { user } = useAuth();
  const { data: orgId } = useUserOrgId();
  return useQuery({
    queryKey: ["client-gamification", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("client_gamification").select("*").eq("user_id", user!.id).eq("organization_id", orgId!).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!orgId,
  });
}

export function useClienteContentMutations() {
  const qc = useQueryClient();
  const { data: orgId } = useUserOrgId();
  const { user } = useAuth();

  const createContent = useMutation({
    mutationFn: async (content: { title: string; body?: string; type?: string; platform?: string; scheduled_at?: string }) => {
      const { data, error } = await supabase.from("client_content").insert({ ...content, organization_id: orgId!, created_by: user?.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client-content"] }),
  });

  const createCampaign = useMutation({
    mutationFn: async (campaign: { name: string; type?: string; budget?: number; start_date?: string; end_date?: string }) => {
      const { data, error } = await supabase.from("client_campaigns").insert({ ...campaign, organization_id: orgId!, created_by: user?.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client-campaigns"] }),
  });

  const createScript = useMutation({
    mutationFn: async (script: { title: string; content?: string; category?: string; tags?: string[] }) => {
      const { data, error } = await supabase.from("client_scripts").insert({ ...script, organization_id: orgId!, created_by: user?.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client-scripts"] }),
  });

  const createDispatch = useMutation({
    mutationFn: async (dispatch: { title: string; channel?: string; message?: string; scheduled_at?: string }) => {
      const { data, error } = await supabase.from("client_dispatches").insert({ ...dispatch, organization_id: orgId!, created_by: user?.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client-dispatches"] }),
  });

  const createSite = useMutation({
    mutationFn: async (site: { name: string; type?: string; content?: any }) => {
      const { data, error } = await supabase.from("client_sites").insert({ ...site, organization_id: orgId!, created_by: user?.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client-sites"] }),
  });

  const createChecklistItem = useMutation({
    mutationFn: async (item: { title: string; date?: string }) => {
      const { data, error } = await supabase.from("client_checklist_items").insert({ ...item, organization_id: orgId!, user_id: user!.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client-checklist"] }),
  });

  const markNotificationRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("client_notifications").update({ is_read: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client-notifications"] }),
  });

  return { createContent, createCampaign, createScript, createDispatch, createSite, createChecklistItem, markNotificationRead };
}
