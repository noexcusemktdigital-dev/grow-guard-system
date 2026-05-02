import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUserOrgId } from "./useUserOrgId";
import { useAuth } from "@/contexts/AuthContext";
import type { TablesInsert } from "@/integrations/supabase/typed";

/** Resolves to parent_org_id if franchisee, otherwise own org_id */
export function useContentSourceOrgId() {
  const { data: orgId } = useUserOrgId();
  return useQuery({
    queryKey: ["content-source-org", orgId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_parent_org_id", { _org_id: orgId! });
      if (error) throw error;
      return data as string;
    },
    enabled: !!orgId,
    staleTime: 1000 * 60 * 10,
  });
}

export function useMarketingFolders(sourceOrgId?: string) {
  const { data: orgId } = useUserOrgId();
  const effectiveOrgId = sourceOrgId || orgId;
  return useQuery({
    queryKey: ["marketing-folders", effectiveOrgId],
    queryFn: async () => {
      const { data, error } = await supabase.from("marketing_folders").select("*").eq("organization_id", effectiveOrgId!).order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!effectiveOrgId,
  });
}

export function useMarketingAssets(folderId?: string, sourceOrgId?: string) {
  const { data: orgId } = useUserOrgId();
  const effectiveOrgId = sourceOrgId || orgId;
  return useQuery({
    queryKey: ["marketing-assets", effectiveOrgId, folderId],
    queryFn: async () => {
      let q = supabase.from("marketing_assets").select("*").eq("organization_id", effectiveOrgId!).order("created_at", { ascending: false });
      if (folderId) q = q.eq("folder_id", folderId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!effectiveOrgId,
  });
}

export function useMarketingMutations() {
  const qc = useQueryClient();
  const { data: orgId } = useUserOrgId();
  const { user } = useAuth();

  const createFolder = useMutation({
    mutationFn: async (folder: { name: string; parent_id?: string; category?: string }) => {
      const { data, error } = await supabase.from("marketing_folders").insert({ ...folder, organization_id: orgId ?? "" } satisfies TablesInsert<"marketing_folders">).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["marketing-folders"] }),
  });

  const deleteFolder = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("marketing_folders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["marketing-folders"] });
      qc.invalidateQueries({ queryKey: ["marketing-assets"] });
    },
  });

  const createAsset = useMutation({
    mutationFn: async (asset: { name: string; type?: string; url: string; folder_id?: string; tags?: string[] }) => {
      const { data, error } = await supabase.from("marketing_assets").insert({ ...asset, organization_id: orgId!, created_by: user?.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["marketing-assets"] }),
  });

  const deleteAsset = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("marketing_assets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["marketing-assets"] }),
  });

  const uploadAsset = useMutation({
    mutationFn: async ({ file, folderId, tags }: { file: File; folderId?: string; tags?: string[] }) => {
      const ext = file.name.split(".").pop();
      const path = `${orgId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from("marketing-assets").upload(path, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("marketing-assets").getPublicUrl(path);
      const { data, error } = await supabase.from("marketing_assets").insert({
        name: file.name,
        type: ext || "file",
        url: urlData.publicUrl,
        folder_id: folderId || null,
        tags: tags || [],
        organization_id: orgId!,
        created_by: user?.id,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["marketing-assets"] }),
  });

  const updateFolder = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data, error } = await supabase.from("marketing_folders").update({ name }).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["marketing-folders"] }),
  });

  const updateAsset = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data, error } = await supabase.from("marketing_assets").update({ name }).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["marketing-assets"] }),
  });

  return { createFolder, deleteFolder, createAsset, deleteAsset, uploadAsset, updateFolder, updateAsset };
}
