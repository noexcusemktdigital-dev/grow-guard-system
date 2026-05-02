import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { invokeEdge } from "@/lib/edge";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/typed";
import type { Json } from "@/integrations/supabase/types";

// ── New 5-Step + GPS schema ──────────────────────────────────────

export interface EtapaEstrategica {
  titulo: string;
  diagnostico: string;
  score: number;
  problemas: string[];
  acoes: string[];
  metricas_alvo: Record<string, string>;
  entregaveis: string[];
}

export interface StrategyResult {
  // GPS Diagnosis
  resumo_executivo: string;
  resumo_cliente?: {
    nome_empresa: string;
    segmento: string;
    proposta_valor: string;
    diferencial: string;
    modelo_negocio: string;
  };
  diagnostico_gps?: {
    score_geral: number;
    nivel: string;
    descricao: string;
    radar_data: { eixo: string; score: number; max: number }[];
    problemas_por_etapa: Record<string, string[]>;
    gargalos_ece: {
      infraestrutura?: string;
      estrutura?: string;
      coleta: string;
      escala: string;
    };
    insights: string[];
  };

  // 5-Step Strategic Plan
  etapas?: {
    conteudo: EtapaEstrategica;
    trafego: EtapaEstrategica;
    web: EtapaEstrategica;
    sales: EtapaEstrategica;
    validacao: EtapaEstrategica;
  };

  // Projections
  projecoes?: {
    unit_economics: {
      cac: string;
      ltv: string;
      ltv_cac_ratio: string;
      ticket_medio: string;
      margem: string;
    };
    funil_conversao: {
      etapa: string;
      volume: number;
      taxa: string;
    }[];
    projecao_mensal: {
      mes: number;
      leads: number;
      clientes: number;
      receita: number;
      investimento: number;
    }[];
    crescimento_acumulado: {
      mes: number;
      receita_acumulada: number;
      clientes_acumulados: number;
    }[];
  };

  // Calculator deliverables
  entregaveis_calculadora?: {
    service_id: string;
    service_name: string;
    quantity: number;
    justificativa: string;
    etapa?: string;
  }[];

  // Scores separados
  score_marketing?: number;
  score_comercial?: number;

  // Persona
  persona?: {
    descricao: string;
    faixa_etaria: string;
    genero: string;
    canais: string[];
    dor_principal: string;
    decisao_compra: string;
    poder_aquisitivo: string;
  };

  // Análise de Concorrência
  analise_concorrencia?: {
    concorrentes: Array<{
      nome: string;
      pontos_fortes: string[];
      pontos_fracos: string[];
      oportunidades: string[];
    }>;
    diferencial_empresa: string;
    posicionamento_recomendado: string;
  };

  // KPIs Hero
  kpis_hero?: {
    meta_faturamento: string;
    ticket_medio: string;
    recorrencia: string;
    ltv_cac: string;
  };

  // Legacy fields for backward compatibility
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
  projecoes_legacy?: {
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
  diagnostic_answers: Record<string, unknown>;
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
      answers: Record<string, unknown>;
      leadId?: string | null;
    }) => {
      if (!orgId || !user) throw new Error("Não autenticado");

      const { data: row, error: insertErr } = await supabase
        .from("franqueado_strategies")
        .insert({
          organization_id: orgId,
          title,
          diagnostic_answers: answers as unknown as Json,
          status: "draft",
          created_by: user.id,
          lead_id: leadId || null,
        } satisfies TablesInsert<"franqueado_strategies">)
        .select()
        .single();
      if (insertErr) throw insertErr;

      const { data: fnData, error: fnError, requestId } = await invokeEdge(
        "generate-strategy",
        { body: { answers } }
      );

      if (fnError) {
        await supabase
          .from("franqueado_strategies")
          .update({ status: "error" })
          .eq("id", row.id);
        throw new Error(`${fnError.message || "Erro ao gerar estratégia"} (id: ${requestId.slice(0, 8)})`);
      }

      if (fnData?.error) {
        await supabase
          .from("franqueado_strategies")
          .update({ status: "error" })
          .eq("id", row.id);
        throw new Error(`${fnData.error} (id: ${requestId.slice(0, 8)})`);
      }

      const { data: updated, error: updateErr } = await supabase
        .from("franqueado_strategies")
        .update({ result: fnData.result as unknown as Json, status: "completed" } satisfies TablesUpdate<"franqueado_strategies">)
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
      answers: Record<string, unknown>;
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

      const { data: fnData, error: fnError, requestId } = await invokeEdge(
        "generate-strategy",
        { body: { answers } }
      );

      if (fnError) {
        await supabase
          .from("franqueado_strategies")
          .update({ status: "error" })
          .eq("id", id);
        throw new Error(`${fnError.message || "Erro ao regenerar estratégia"} (id: ${requestId.slice(0, 8)})`);
      }

      if (fnData?.error) {
        await supabase
          .from("franqueado_strategies")
          .update({ status: "error" })
          .eq("id", id);
        throw new Error(`${fnData.error} (id: ${requestId.slice(0, 8)})`);
      }

      const { data: updated, error: updateErr } = await supabase
        .from("franqueado_strategies")
        .update({ result: fnData.result as unknown as Json, status: "completed" } satisfies TablesUpdate<"franqueado_strategies">)
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
