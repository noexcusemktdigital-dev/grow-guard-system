import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserOrgId } from "./useUserOrgId";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface PostItem {
  id: string;
  organization_id: string;
  content_id: string | null;
  type: "art" | "video";
  format: string | null;
  style: string | null;
  duration: string | null;
  input_text: string | null;
  reference_image_urls: string[] | null;
  result_url: string | null;
  result_data: any;
  status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function usePostHistory() {
  const { data: orgId } = useUserOrgId();

  return useQuery({
    queryKey: ["client-posts", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_posts" as any)
        .select("*")
        .eq("organization_id", orgId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as PostItem[];
    },
    enabled: !!orgId,
  });
}

export function useGeneratePost() {
  const { data: orgId } = useUserOrgId();
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      type: "art" | "video";
      format?: string;
      style?: string;
      duration?: string;
      input_text: string;
      content_id?: string;
      reference_image_urls?: string[];
      identidade_visual?: any;
    }) => {
      if (!orgId) throw new Error("Org not found");

      let result_url: string | null = null;
      let result_data: any = null;

      if (payload.type === "art") {
        // Call generate-social-image
        const file_path = `posts/${orgId}/${Date.now()}.png`;
        const resp = await supabase.functions.invoke("generate-social-image", {
          body: {
            prompt: payload.input_text,
            format: payload.format === "story" ? "story" : "feed",
            file_path,
            nivel: "elaborado",
            identidade_visual: payload.identidade_visual,
            organization_id: orgId,
            reference_images: payload.reference_image_urls,
            art_style: payload.style || "grafica_moderna",
          },
        });
        if (resp.error) throw new Error(resp.error.message || "Erro ao gerar arte");
        if (resp.data?.error) throw new Error(resp.data.error);
        result_url = resp.data?.url;
      } else {
        // Call generate-social-video-frames
        const resp = await supabase.functions.invoke("generate-social-video-frames", {
          body: {
            video_description: payload.input_text,
            identidade_visual: payload.identidade_visual,
            organization_id: orgId,
            art_id: Date.now().toString(),
            num_frames: payload.duration === "60s" ? 8 : payload.duration === "30s" ? 5 : 3,
            reference_images: payload.reference_image_urls,
            video_style: payload.style || "slideshow",
          },
        });
        if (resp.error) throw new Error(resp.error.message || "Erro ao gerar vídeo");
        if (resp.data?.error) throw new Error(resp.data.error);
        result_url = resp.data?.frameUrls?.[0] || null;
        result_data = resp.data;
      }

      // Save to DB
      const { data, error } = await supabase
        .from("client_posts" as any)
        .insert({
          organization_id: orgId,
          content_id: payload.content_id || null,
          type: payload.type,
          format: payload.format || null,
          style: payload.style || null,
          duration: payload.duration || null,
          input_text: payload.input_text,
          reference_image_urls: payload.reference_image_urls || [],
          result_url,
          result_data,
          status: "pending",
          created_by: user?.id,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return { post: data as unknown as PostItem, result_url, result_data };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client-posts"] });
    },
  });
}

export function useApprovePost() {
  const qc = useQueryClient();
  const { data: orgId } = useUserOrgId();

  return useMutation({
    mutationFn: async ({ postId, type }: { postId: string; type: "art" | "video" }) => {
      if (!orgId) throw new Error("Org not found");

      const creditCost = type === "video" ? 200 : 100;

      const { error: debitError } = await supabase.rpc("debit_credits" as any, {
        _org_id: orgId,
        _amount: creditCost,
        _description: type === "video" ? "Vídeo aprovado" : "Arte aprovada",
        _source: "client-posts",
      });
      if (debitError) throw debitError;

      const { error } = await supabase
        .from("client_posts" as any)
        .update({ status: "approved" } as any)
        .eq("id", postId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client-posts"] });
      qc.invalidateQueries({ queryKey: ["credit-wallet"] });
      toast({ title: "Postagem aprovada!", description: "Créditos debitados com sucesso." });
    },
  });
}
