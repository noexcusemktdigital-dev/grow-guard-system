import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUserOrgId } from "./useUserOrgId";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/typed";

export interface VisualIdentity {
  id: string;
  organization_id: string;
  palette: { hex: string; label?: string }[];
  fonts: string[];
  style: string | null;
  tone: string | null;
  logo_url: string | null;
  reference_links: string[];
  image_bank_urls: string[];
  updated_at: string;
  created_at: string;
}

export function useVisualIdentity() {
  const { data: orgId } = useUserOrgId();

  return useQuery({
    queryKey: ["visual-identity", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketing_visual_identities")
        .select("*")
        .eq("organization_id", orgId!)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as VisualIdentity | null;
    },
    enabled: !!orgId,
  });
}

export function useSaveVisualIdentity() {
  const qc = useQueryClient();
  const { data: orgId } = useUserOrgId();

  return useMutation({
    mutationFn: async (payload: Partial<Omit<VisualIdentity, "id" | "organization_id" | "created_at" | "updated_at">>) => {
      if (!orgId) throw new Error("Org not found");

      const { data: existing } = await supabase
        .from("marketing_visual_identities")
        .select("id")
        .eq("organization_id", orgId)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from("marketing_visual_identities")
          .update({ ...payload, updated_at: new Date().toISOString() } as TablesUpdate<"marketing_visual_identities">)
          .eq("organization_id", orgId)
          .select()
          .single();
        if (error) throw error;
        return data as unknown as VisualIdentity;
      } else {
        const { data, error } = await supabase
          .from("marketing_visual_identities")
          .insert({ ...payload, organization_id: orgId } as TablesInsert<"marketing_visual_identities">)
          .select()
          .single();
        if (error) throw error;
        return data as unknown as VisualIdentity;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["visual-identity"] });
    },
  });
}

export function isVisualIdentityComplete(vi: VisualIdentity | null | undefined): boolean {
  if (!vi) return false;
  const hasPalette = Array.isArray(vi.palette) && vi.palette.length > 0;
  const hasStyle = !!vi.style;
  return hasPalette && hasStyle;
}
