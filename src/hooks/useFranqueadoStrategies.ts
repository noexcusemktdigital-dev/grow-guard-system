import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// ── New SPIN + NOEXCUSE schema ──────────────────────────────────

export interface StrategyResult {
  // New SPIN+NOEXCUSE format
  diagnostico_negocio?: {
    modelo: string;
    momento: string;
    maturidade: {
      score: number;
      nivel: string;
      descricao: string;
    };
    radar_data: { eixo: string; score: number; max: number }[];
  };
  problemas_identificados?: string[];
  gargalos?: {
    aquisicao: string;
    conversao: string;
    estrutura: string;
    posicionamento: string;
  };
  projecao_crescimento?: {
    meta_faturamento: string;
    ticket_medio: string;
    vendas_necessarias: number;
    leads_necessarios: number;
    taxa_conversao: number;
    descricao: string;
  };
  estrategia_recomendada?: {
    estrutura: string[];
    aquisicao: string[];
    conversao: string[];
    escala: string[];
  };
  servicos_indicados?: {
    servico: string;
    justificativa: string;
    prioridade: string;
  }[];
  roadmap?: {
    fase: number;
    titulo: string;
    periodo: string;
    acoes: string[];
  }[];
  resumo_executivo: string;

  // Legacy fields for backward compatibility
  maturidade?: {
    score: number;
    nivel: string;
    descricao: string;
  };
  radar_data?: { eixo: string; score: number; max: number }[];
  plano_acao?: {
    fase: string;
    periodo: string;
    acoes: { acao: string; responsavel: string; prioridade: string }[];
  }[];
  projecoes?: {
    leads: { mes: string; sem_estrategia: number; com_estrategia: number }[];
    receita: { mes: string; sem_estrategia: number; com_estrategia: number }[];
  };
  entregas_recomendadas?: {
    servico: string;
    modulo: string;
    justificativa: string;
    prioridade: string;
  }[];
}

export interface Strategy {
  id: string;
  organization_id: string;
  lead_id: string | null;
  title: string;
  diagnostic_answers: Record<string, any>;
  result: StrategyResult | null;
  status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useStrategies() {
  const { data: orgId } = useUserOrgId();

  return useQuery({
    queryKey: ["strategies", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("franqueado_strategies")
        .select("*")
        .eq("organization_id", orgId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Strategy[];
    },
    enabled: !!orgId,
  });
}

export function useCreateStrategy() {
  const qc = useQueryClient();
  const { data: orgId } = useUserOrgId();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      title,
      answers,
      leadId,
    }: {
      title: string;
      answers: Record<string, any>;
      leadId?: string | null;
    }) => {
      if (!orgId || !user) throw new Error("Não autenticado");

      const { data: row, error: insertErr } = await supabase
        .from("franqueado_strategies")
        .insert({
          organization_id: orgId,
          title,
          diagnostic_answers: answers as any,
          status: "draft",
          created_by: user.id,
          lead_id: leadId || null,
        })
        .select()
        .single();
      if (insertErr) throw insertErr;

      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        "generate-strategy",
        { body: { answers } }
      );

      if (fnError) {
        await supabase
          .from("franqueado_strategies")
          .update({ status: "error" })
          .eq("id", row.id);
        throw new Error(fnError.message || "Erro ao gerar estratégia");
      }

      if (fnData?.error) {
        await supabase
          .from("franqueado_strategies")
          .update({ status: "error" })
          .eq("id", row.id);
        throw new Error(fnData.error);
      }

      const { data: updated, error: updateErr } = await supabase
        .from("franqueado_strategies")
        .update({ result: fnData.result as any, status: "completed" })
        .eq("id", row.id)
        .select()
        .single();
      if (updateErr) throw updateErr;

      return updated as unknown as Strategy;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["strategies"] });
    },
  });
}

export function useUpdateStrategy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: { id: string; title?: string; lead_id?: string | null }) => {
      const { error } = await supabase
        .from("franqueado_strategies")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["strategies"] });
      toast.success("Estratégia atualizada");
    },
  });
}

export function useRegenerateStrategy() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      id,
      title,
      answers,
    }: {
      id: string;
      title: string;
      answers: Record<string, any>;
    }) => {
      if (!user) throw new Error("Não autenticado");

      await supabase
        .from("franqueado_strategies")
        .update({
          title,
          diagnostic_answers: answers as any,
          status: "draft",
        })
        .eq("id", id);

      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        "generate-strategy",
        { body: { answers } }
      );

      if (fnError) {
        await supabase
          .from("franqueado_strategies")
          .update({ status: "error" })
          .eq("id", id);
        throw new Error(fnError.message || "Erro ao regenerar estratégia");
      }

      if (fnData?.error) {
        await supabase
          .from("franqueado_strategies")
          .update({ status: "error" })
          .eq("id", id);
        throw new Error(fnData.error);
      }

      const { data: updated, error: updateErr } = await supabase
        .from("franqueado_strategies")
        .update({ result: fnData.result as any, status: "completed" })
        .eq("id", id)
        .select()
        .single();
      if (updateErr) throw updateErr;

      return updated as unknown as Strategy;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["strategies"] });
      toast.success("Estratégia regenerada com sucesso!");
    },
  });
}

export function useDeleteStrategy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("franqueado_strategies")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["strategies"] });
      toast.success("Estratégia excluída");
    },
  });
}
