import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserOrgId } from "./useUserOrgId";
import { useAuth } from "@/contexts/AuthContext";

export function useMarketingFolders() {
  const { data: orgId } = useUserOrgId();
  return useQuery({
    queryKey: ["marketing-folders", orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from("marketing_folders").select("*").eq("organization_id", orgId!).order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}

export function useMarketingAssets(folderId?: string) {
  const { data: orgId } = useUserOrgId();
  return useQuery({
    queryKey: ["marketing-assets", orgId, folderId],
    queryFn: async () => {
      let q = supabase.from("marketing_assets").select("*").eq("organization_id", orgId!).order("created_at", { ascending: false });
      if (folderId) q = q.eq("folder_id", folderId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}

export function useMarketingMutations() {
  const qc = useQueryClient();
  const { data: orgId } = useUserOrgId();
  const { user } = useAuth();

  const createFolder = useMutation({
    mutationFn: async (folder: { name: string; parent_id?: string }) => {
      const { data, error } = await supabase.from("marketing_folders").insert({ ...folder, organization_id: orgId! }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["marketing-folders"] }),
  });

  const createAsset = useMutation({
    mutationFn: async (asset: { name: string; type?: string; url: string; folder_id?: string; tags?: string[] }) => {
      const { data, error } = await supabase.from("marketing_assets").insert({ ...asset, organization_id: orgId!, created_by: user?.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["marketing-assets"] }),
  });

  return { createFolder, createAsset };
}
