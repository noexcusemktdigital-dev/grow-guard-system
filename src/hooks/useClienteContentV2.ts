import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserOrgId } from "./useUserOrgId";
import { useAuth } from "@/contexts/AuthContext";

export interface ContentItem {
  id: string;
  title: string;
  format: string | null;
  objective: string | null;
  cta: string | null;
  main_message: string | null;
  result: any | null;
  status: string;
  strategy_id: string | null;
  organization_id: string;
  created_at: string;
}

export function useContentHistory() {
  const { data: orgId } = useUserOrgId();

  return useQuery({
    queryKey: ["client-content-v2", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_content")
        .select("*")
        .eq("organization_id", orgId!)
        .not("result", "is", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as ContentItem[];
    },
    enabled: !!orgId,
  });
}

export function useGenerateContent() {
  const { data: orgId } = useUserOrgId();
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      tema: string;
      formato: string;
      objetivo: string;
      mensagem_principal: string;
      cta: string;
      estrategia: any | null;
    }) => {
      if (!orgId) throw new Error("Org not found");

      // Call edge function
      const resp = await supabase.functions.invoke("generate-content", {
        body: {
          tema: payload.tema,
          formato: payload.formato,
          objetivo: payload.objetivo,
          mensagem_principal: payload.mensagem_principal,
          cta: payload.cta,
          estrategia: payload.estrategia,
        },
      });

      if (resp.error) throw new Error(resp.error.message || "Erro ao gerar conteúdo");
      const result = resp.data as any;
      if (result?.error) throw new Error(result.error);

      // Save to DB
      const { data, error } = await supabase
        .from("client_content")
        .insert({
          organization_id: orgId,
          title: result.titulo || payload.tema,
          format: payload.formato,
          objective: payload.objetivo,
          cta: payload.cta,
          main_message: payload.mensagem_principal,
          result: result as any,
          status: "pending",
          created_by: user?.id,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return { dbRecord: data, result };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client-content-v2"] });
    },
  });
}

export function useApproveContent() {
  const qc = useQueryClient();
  const { data: orgId } = useUserOrgId();

  return useMutation({
    mutationFn: async (contentId: string) => {
      if (!orgId) throw new Error("Org not found");

      // Debit credits
      const { error: debitError } = await supabase.rpc("debit_credits" as any, {
        _org_id: orgId,
        _amount: 200,
        _description: "Conteúdo aprovado",
        _source: "generate-content",
      });
      if (debitError) throw debitError;

      // Update status
      const { error } = await supabase
        .from("client_content")
        .update({ status: "approved" } as any)
        .eq("id", contentId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client-content-v2"] });
      qc.invalidateQueries({ queryKey: ["credit-wallet"] });
    },
  });
}
