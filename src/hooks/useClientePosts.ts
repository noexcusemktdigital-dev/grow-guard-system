import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { extractEdgeFunctionError } from "@/lib/edgeFunctionError";
import { supabase } from "@/lib/supabase";
import { invokeEdge } from "@/lib/edge";
import { useUserOrgId } from "./useUserOrgId";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useClienteWallet } from "./useClienteWallet";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/typed";

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
  result_data: Record<string, unknown> | null;
  status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  caption: string | null;
}

export function usePostHistory() {
  const { data: orgId } = useUserOrgId();

  return useQuery({
    queryKey: ["client-posts", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_posts")
        .select("*")
        .eq("organization_id", orgId ?? "")
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
      identidade_visual?: Record<string, unknown>;
      // Structured fields
      tipo_postagem?: string;
      headline?: string;
      subheadline?: string;
      cta?: string;
      cena?: string;
      elementos_visuais?: string;
      movimento?: string;
      mensagem?: string;
      manual_colors?: string;
      manual_style?: string;
      brand_name?: string;
      supporting_text?: string;
      bullet_points?: string;
      // Layout + Logo fields
      layout_type?: string;
      logo_url?: string;
      primary_ref_index?: number;
      objective?: string;
      photo_image_urls?: string[];
      // Print mode fields
      output_mode?: "digital" | "print";
      print_format?: string;
      // Art direction engine fields
      topic?: string;
      audience?: string;
      text_mode?: "ai" | "manual";
      restrictions?: string;
      elements?: string[];
      base_image_url?: string;
      character_image_url?: string;
      background_image_url?: string;
      caption?: string;
      // Layout customization (Step 8)
      logo_position?: "top_left" | "top_right" | "bottom_left" | "bottom_right" | "none";
      title_position?: "top" | "center" | "bottom";
      background_type?: "ai_photo" | "solid_color" | "gradient" | "clean";
      color_tone?: "brand" | "neutral" | "vibrant" | "dark" | "pastel";
      primary_color?: string;
      secondary_color?: string;
      // Video-specific structured fields
      plataforma?: string;
      estilo_visual?: string;
      acao_cena?: string;
    }) => {
      if (!orgId) throw new Error("Org not found");

      let result_url: string | null = null;
      let result_data: Record<string, unknown> | null = null;

      if (payload.type === "art") {
        const file_path = `posts/${orgId}/${Date.now()}.png`;
        const resp = await invokeEdge("generate-social-image", {
          body: {
            prompt: payload.input_text,
            format: payload.format || "feed",
            file_path,
            nivel: "elaborado",
            identidade_visual: payload.identidade_visual,
            organization_id: orgId,
            reference_images: payload.reference_image_urls,
            art_style: payload.style || "grafica_moderna",
            // Structured fields for better prompt
            tipo_postagem: payload.tipo_postagem,
            headline: payload.headline,
            subheadline: payload.subheadline,
            cta: payload.cta,
            cena: payload.cena,
            elementos_visuais: payload.elementos_visuais,
            manual_colors: payload.manual_colors,
            manual_style: payload.manual_style,
            brand_name: payload.brand_name,
            supporting_text: payload.supporting_text,
            bullet_points: payload.bullet_points,
            // Layout + Logo
            layout_type: payload.layout_type,
            logo_url: payload.logo_url,
            primary_ref_index: payload.primary_ref_index,
            objective: payload.objective,
            photo_images: payload.photo_image_urls,
            // Print mode
            output_mode: payload.output_mode,
            print_format: payload.print_format,
            // Art direction engine
            topic: payload.topic,
            audience: payload.audience,
            text_mode: payload.text_mode,
            restrictions: payload.restrictions,
            elements: payload.elements,
            base_image_url: payload.base_image_url,
            character_image_url: payload.character_image_url,
            background_image_url: payload.background_image_url,
            // Layout customization (Step 8)
            logo_position: payload.logo_position,
            title_position: payload.title_position,
            background_type: payload.background_type,
            color_tone: payload.color_tone,
            primary_color: payload.primary_color,
            secondary_color: payload.secondary_color,
          },
        });
        if (resp.error) throw await extractEdgeFunctionError(resp.error);
        if (resp.data?.error) throw new Error(resp.data.error);
        result_url = resp.data?.url;
      } else {
        const resp = await invokeEdge("generate-social-video-frames", {
          body: {
            video_description: payload.cena || payload.input_text,
            identidade_visual: payload.identidade_visual,
            organization_id: orgId,
            art_id: Date.now().toString(),
            num_frames: payload.duration === "8s" ? 5 : 3,
            reference_images: payload.reference_image_urls,
            video_style: payload.style || "slideshow",
            // Structured fields
            movimento: payload.movimento,
            mensagem: payload.mensagem,
            cta: payload.cta,
            format: payload.format,
            // New structured fields
            plataforma: payload.plataforma,
            estilo_visual: payload.estilo_visual,
            acao_cena: payload.acao_cena,
          },
        });
        if (resp.error) throw await extractEdgeFunctionError(resp.error);
        if (resp.data?.error) throw new Error(resp.data.error);
        result_url = resp.data?.frameUrls?.[0] || null;
        result_data = resp.data;
      }

      // Save to DB
      const { data, error } = await supabase
        .from("client_posts")
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
          caption: payload.caption || null,
        } satisfies TablesInsert<"client_posts">)
        .select()
        .single();

      if (error) throw error;
      return { post: data as unknown as PostItem, result_url, result_data };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client-posts"] });
      qc.invalidateQueries({ queryKey: ["credit-wallet"] });
    },
  });
}

export function useGenerateBriefing() {
  return useMutation({
    mutationFn: async (payload: {
      briefing_text?: string;
      content_data?: Record<string, unknown>;
      identidade_visual?: Record<string, unknown>;
      persona?: Record<string, unknown>;
    }) => {
      const resp = await invokeEdge("generate-social-briefing", {
        body: payload,
      });
      if (resp.error) throw await extractEdgeFunctionError(resp.error);
      if (resp.data?.error) throw new Error(resp.data.error);
      return resp.data as {
        headline: string;
        subheadline: string;
        headlines?: string[];
        subheadlines?: string[];
        cta: string;
        cena: string;
        elementos_visuais: string;
        supporting_text: string;
        bullet_points: string;
        suggested_format: string;
        suggested_tipo: string;
      };
    },
  });
}

export function useGenerateVideoBriefing() {
  return useMutation({
    mutationFn: async (payload: {
      briefing_text?: string;
      content_data?: Record<string, unknown>;
      identidade_visual?: Record<string, unknown>;
      persona?: Record<string, unknown>;
    }) => {
      const resp = await invokeEdge("generate-video-briefing", {
        body: payload,
      });
      if (resp.error) throw await extractEdgeFunctionError(resp.error);
      if (resp.data?.error) throw new Error(resp.data.error);
      return resp.data as {
        plataforma: string;
        formato_video: string;
        duracao: string;
        descricao_cena: string;
        acao_cena: string;
        mensagem_video: string;
        estilo_visual: string;
        suggested_cta: string;
      };
    },
  });
}

export function useDeletePost() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from("client_posts")
        .delete()
        .eq("id", postId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client-posts"] });
      toast({ title: "Postagem apagada com sucesso." });
    },
  });
}

export function useBulkDeletePosts() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (postIds: string[]) => {
      const { error } = await supabase
        .from("client_posts")
        .delete()
        .in("id", postIds);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client-posts"] });
      toast({ title: "Postagens apagadas com sucesso." });
    },
  });
}

export function useBulkApprovePosts() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (postIds: string[]) => {
      const { error } = await supabase
        .from("client_posts")
        .update({ status: "approved" } satisfies TablesUpdate<"client_posts">)
        .in("id", postIds);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client-posts"] });
      qc.invalidateQueries({ queryKey: ["approval-stats"] });
      toast({ title: "Postagens aprovadas com sucesso!" });
    },
  });
}

export function useApprovePost() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      postId,
      result_url,
    }: {
      postId: string;
      type?: "art" | "video";
      numFrames?: number;
      result_url?: string | null;
    }) => {
      const updatePayload: Record<string, unknown> = {
        status: "approved",
        updated_at: new Date().toISOString(),
      };
      // Persist the generated art URL when provided so it survives reloads
      if (result_url) updatePayload.result_url = result_url;

      const { data, error } = await supabase
        .from("client_posts")
        .update(updatePayload as TablesUpdate<"client_posts">)
        .eq("id", postId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client-posts"] });
      qc.invalidateQueries({ queryKey: ["approval-stats"] });
      toast({ title: "Arte salva com sucesso!" });
    },
  });
}

/** Credit-based quota for posts — aligned with edge function costs */
export const CREDIT_COST_ART = 25;
export const CREDIT_COST_VIDEO_PER_FRAME = 25;
/** Legacy alias kept for simpler checks (3-frame minimum) */
export const CREDIT_COST_VIDEO = CREDIT_COST_VIDEO_PER_FRAME * 3;

export function getVideoCost(duration: string): number {
  const frames = duration === "8s" ? 5 : 3;
  return CREDIT_COST_VIDEO_PER_FRAME * frames;
}

export function usePostQuota() {
  const { data: wallet } = useClienteWallet();

  const creditBalance = wallet?.balance ?? 0;
  const maxArts = Math.floor(creditBalance / CREDIT_COST_ART);
  const maxVideos = Math.floor(creditBalance / CREDIT_COST_VIDEO);

  return {
    creditBalance,
    maxArts,
    maxVideos,
    costArt: CREDIT_COST_ART,
    costVideo: CREDIT_COST_VIDEO,
    canAffordArt: creditBalance >= CREDIT_COST_ART,
    canAffordVideo: creditBalance >= CREDIT_COST_VIDEO,
  };
}
