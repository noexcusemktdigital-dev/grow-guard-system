import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUserOrgId } from "./useUserOrgId";
import { toast } from "sonner";

export interface FollowupAnalise {
  entregas_realizadas?: { nome: string; status: "feito" | "pendente" | "cancelado" }[];
  metricas?: { leads?: number; conversoes?: number; trafego?: number; engajamento?: number; faturamento?: number };
  destaques?: string[];
  gaps?: string[];
  observacoes?: string;
}

export interface FollowupPlano {
  conteudo?: { acoes: string[]; entregas: string[] };
  trafego?: { acoes: string[]; budget?: number; plataformas: string[] };
  web?: { acoes: string[]; entregas: string[] };
  sales?: { acoes: string[]; entregas: string[] };
}

export interface ClientFollowup {
  id: string;
  organization_id: string;
  strategy_id: string;
  month_ref: string;
  status: string;
  analise: FollowupAnalise;
  plano_proximo: FollowupPlano;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useClientFollowups(strategyId: string | null) {
  const { data: orgId } = useUserOrgId();

  return useQuery({
    queryKey: ["client-followups", orgId, strategyId],
    queryFn: async () => {
      if (!orgId || !strategyId) return [];
      const { data, error } = await supabase
        .from("client_followups")
        .select("*")
        .eq("organization_id", orgId)
        .eq("strategy_id", strategyId)
        .order("month_ref", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as ClientFollowup[];
    },
    enabled: !!orgId && !!strategyId,
  });
}

export function useSaveFollowup() {
  const qc = useQueryClient();
  const { data: orgId } = useUserOrgId();

  return useMutation({
    mutationFn: async (input: {
      id?: string;
      strategy_id: string;
      month_ref: string;
      status?: string;
      analise: FollowupAnalise;
      plano_proximo: FollowupPlano;
    }) => {
      if (!orgId) throw new Error("Organização não encontrada");

      const payload = {
        organization_id: orgId,
        strategy_id: input.strategy_id,
        month_ref: input.month_ref,
        status: input.status || "draft",
        analise: input.analise as any,
        plano_proximo: input.plano_proximo as any,
      };

      if (input.id) {
        const { data, error } = await supabase
          .from("client_followups")
          .update(payload)
          .eq("id", input.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("client_followups")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client-followups"] });
      toast.success("Ciclo salvo com sucesso!");
    },
    onError: (e: any) => {
      toast.error(e.message || "Erro ao salvar ciclo");
    },
  });
}
