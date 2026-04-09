// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUserOrgId } from "./useUserOrgId";
import { useAuth } from "@/contexts/AuthContext";

export function useUnitDocuments(unitId: string | undefined) {
  const { data: orgId } = useUserOrgId();

  return useQuery({
    queryKey: ["unit-documents", unitId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("unit_documents")
        .select("*")
        .eq("unit_id", unitId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!unitId && !!orgId,
  });
}

export function useUnitDocumentMutations(unitId: string | undefined) {
  const qc = useQueryClient();
  const { data: orgId } = useUserOrgId();
  const { user } = useAuth();

  const uploadAndCreate = useMutation({
    mutationFn: async ({
      file,
      name,
      type,
      visibility,
      notes,
    }: {
      file: File;
      name: string;
      type: string;
      visibility: string;
      notes: string;
    }) => {
      // Upload file to storage
      const filePath = `${orgId}/${unitId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("unit-documents")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("unit-documents")
        .getPublicUrl(filePath);

      // Insert document record
      const { data, error } = await supabase
        .from("unit_documents")
        .insert({
          unit_id: unitId!,
          organization_id: orgId!,
          name,
          type,
          file_url: urlData.publicUrl,
          visibility,
          notes,
          uploaded_by: user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["unit-documents", unitId] }),
  });

  const deleteDoc = useMutation({
    mutationFn: async (docId: string) => {
      const { error } = await supabase.from("unit_documents").delete().eq("id", docId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["unit-documents", unitId] }),
  });

  return { uploadAndCreate, deleteDoc };
}
