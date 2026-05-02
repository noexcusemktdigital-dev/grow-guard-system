import { useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUserOrgId } from "./useUserOrgId";
import { DEFAULT_STAGES, FunnelStage } from "@/components/crm/CrmStageSystem";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/typed";

// ─── Stage format normalization ──────────────────────────────────────────────
// Old format: { name: string, color: string (hex), order: number }
// New format: { key: string, label: string, color: string (name), icon: string }

const HEX_TO_COLOR: Record<string, string> = {
  "#6366f1": "indigo",
  "#f59e0b": "amber",
  "#10b981": "emerald",
  "#ef4444": "red",
  "#8b5cf6": "purple",
  "#06b6d4": "cyan",
  "#3b82f6": "blue",
  "#f97316": "orange",
  "#ec4899": "pink",
  "#14b8a6": "teal",
  "#a855f7": "purple",
  "#22c55e": "emerald",
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

function isOldFormat(stage: Record<string, unknown>): boolean {
  return "name" in stage && !("key" in stage);
}

function normalizeStage(stage: Record<string, unknown>, index: number): FunnelStage {
  if (!isOldFormat(stage)) {
    return {
      key: (stage.key as string) || `stage_${index}`,
      label: (stage.label as string) || `Etapa ${index + 1}`,
      color: (stage.color as string) || "blue",
      icon: (stage.icon as string) || "circle-dot",
    };
  }
  const name = (stage.name as string) || `Etapa ${index + 1}`;
  const hexColor = ((stage.color as string) || "").toLowerCase();
  const resolvedColor = HEX_TO_COLOR[hexColor] || "blue";

  return {
    key: slugify(name) || `stage_${index}`,
    label: name,
    color: resolvedColor,
    icon: "circle-dot",
  };
}

function normalizeStages(stages: unknown): FunnelStage[] {
  if (!Array.isArray(stages) || stages.length === 0) return DEFAULT_STAGES;
  return (stages as Record<string, unknown>[]).map((s, i) => normalizeStage(s, i));
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CrmFunnel {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  stages: FunnelStage[];
  is_default: boolean;
  allow_backtrack?: boolean;
  backtrack_mode?: "allow" | "warn" | "block";
  created_at: string;
  updated_at: string;
}

// ─── Hook: useCrmFunnels ──────────────────────────────────────────────────────

export function useCrmFunnels() {
  const { data: orgId } = useUserOrgId();

  return useQuery<CrmFunnel[]>({
    queryKey: ["crm-funnels", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_funnels")
        .select("*")
        .eq("organization_id", orgId!)
        .order("created_at");
      if (error) throw error;

      // Normalize any funnels that still use the old {name, color, order} stage format
      return (data ?? []).map((funnel) => ({
        ...funnel,
        stages: normalizeStages(funnel.stages),
      }));
    },
    enabled: !!orgId,
  });
}

// ─── Hook: useCrmFunnelMutations ──────────────────────────────────────────────

export function useCrmFunnelMutations() {
  const qc = useQueryClient();
  const { data: orgId } = useUserOrgId();

  const createFunnel = useMutation({
    mutationFn: async (funnel: {
      name: string;
      description?: string;
      stages?: FunnelStage[];
      is_default?: boolean;
      goal_type?: string;
      win_label?: string;
      loss_label?: string;
    }) => {
      if (funnel.is_default && orgId) {
        await supabase
          .from("crm_funnels")
          .update({ is_default: false })
          .eq("organization_id", orgId);
      }
      const payload: TablesInsert<"crm_funnels"> = {
        ...funnel,
        organization_id: orgId!,
        stages: (funnel.stages ?? DEFAULT_STAGES) as TablesInsert<"crm_funnels">["stages"],
      };
      const { data, error } = await supabase
        .from("crm_funnels")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-funnels"] }),
  });

  const updateFunnel = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: { id: string } & Partial<Omit<CrmFunnel, "id" | "organization_id" | "created_at" | "updated_at">>) => {
      if (updates.is_default === true && orgId) {
        await supabase
          .from("crm_funnels")
          .update({ is_default: false })
          .eq("organization_id", orgId)
          .neq("id", id);
      }
      const { data, error } = await supabase
        .from("crm_funnels")
        .update(updates as TablesUpdate<"crm_funnels">)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-funnels"] }),
  });

  const deleteFunnel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("crm_funnels").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-funnels"] }),
  });

  return { createFunnel, updateFunnel, deleteFunnel };
}

// ─── Hook: useEnsureDefaultFunnel ─────────────────────────────────────────────

export function useEnsureDefaultFunnel() {
  const { data: funnels, isLoading } = useCrmFunnels();
  const { createFunnel } = useCrmFunnelMutations();
  const created = useRef(false);

  useEffect(() => {
    if (isLoading || created.current) return;
    if (!funnels || funnels.length > 0) return;

    created.current = true;

    // Tenta buscar dados do GPS para criar funil inteligente
    const createSmartFunnel = async () => {
      let stages = DEFAULT_STAGES;
      let funnelName = "Funil de Vendas";

      try {
        // Busca o sales_plan do usuário
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: orgData } = await supabase.rpc("get_user_org_id", { _user_id: user.id, _portal: "saas" });
          if (orgData) {
            const { data: plan } = await supabaseClient
              .from("sales_plans")
              .select("answers")
              .eq("organization_id", orgData)
              .maybeSingle();

            if (plan?.answers) {
              const answers = plan.answers as Record<string, any>;
              const etapasFunil = answers.etapas_funil || "";
              const segmento = answers.segmento || "";

              // Prioridade 1: etapas descritas pelo próprio cliente no GPS
              if (etapasFunil && etapasFunil.length > 15) {
                const rawStages = etapasFunil
                  .split(/→|->|,|\n|\//)
                  .map((s: string) => s.trim())
                  .filter((s: string) => s.length > 1 && s.length < 40);

                if (rawStages.length >= 2) {
                  const colors = ["blue", "amber", "cyan", "purple", "orange", "emerald", "red"];
                  stages = rawStages.map((label: string, i: number) => ({
                    key: label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, ""),
                    label,
                    color: colors[i % colors.length],
                    icon: i === rawStages.length - 1 ? "shield-check" : i === 0 ? "circle-plus" : "circle-dot",
                  }));
                  // Garante etapa de perdido no final se não tiver
                  if (!stages.some(s => s.label.toLowerCase().includes("perd"))) {
                    stages.push({ key: "perdido", label: "Perdido", color: "red", icon: "ban" });
                  }
                  funnelName = "Meu Funil de Vendas";
                }
              }

              // Prioridade 2: padrão por segmento
              if (stages === DEFAULT_STAGES && segmento) {
                const segmentStages: Record<string, FunnelStage[]> = {
                  advocacia: [
                    { key: "contato", label: "Primeiro Contato", color: "blue", icon: "circle-plus" },
                    { key: "consulta", label: "Consulta Inicial", color: "amber", icon: "phone-outgoing" },
                    { key: "proposta", label: "Proposta Enviada", color: "purple", icon: "clipboard" },
                    { key: "contrato", label: "Contrato Assinado", color: "cyan", icon: "handshake" },
                    { key: "cliente", label: "Cliente Ativo", color: "emerald", icon: "shield-check" },
                    { key: "perdido", label: "Perdido", color: "red", icon: "ban" },
                  ],
                  saude: [
                    { key: "contato", label: "Contato", color: "blue", icon: "circle-plus" },
                    { key: "agendamento", label: "Agendamento", color: "amber", icon: "phone-outgoing" },
                    { key: "avaliacao", label: "Avaliação", color: "cyan", icon: "search-check" },
                    { key: "proposta", label: "Proposta", color: "purple", icon: "clipboard" },
                    { key: "paciente", label: "Paciente Ativo", color: "emerald", icon: "shield-check" },
                    { key: "perdido", label: "Perdido", color: "red", icon: "ban" },
                  ],
                  odontologia: [
                    { key: "contato", label: "Contato", color: "blue", icon: "circle-plus" },
                    { key: "agendamento", label: "Agendamento", color: "amber", icon: "phone-outgoing" },
                    { key: "avaliacao", label: "Avaliação", color: "cyan", icon: "search-check" },
                    { key: "orcamento", label: "Orçamento", color: "purple", icon: "clipboard" },
                    { key: "tratamento", label: "Em Tratamento", color: "emerald", icon: "shield-check" },
                    { key: "perdido", label: "Perdido", color: "red", icon: "ban" },
                  ],
                  psicologia: [
                    { key: "contato", label: "Primeiro Contato", color: "blue", icon: "circle-plus" },
                    { key: "triagem", label: "Triagem", color: "amber", icon: "search-check" },
                    { key: "sessao_inicial", label: "Sessão Inicial", color: "cyan", icon: "phone-outgoing" },
                    { key: "paciente", label: "Paciente Regular", color: "emerald", icon: "shield-check" },
                    { key: "perdido", label: "Encerrado", color: "red", icon: "ban" },
                  ],
                  consultoria: [
                    { key: "contato", label: "Primeiro Contato", color: "blue", icon: "circle-plus" },
                    { key: "diagnostico", label: "Diagnóstico", color: "amber", icon: "search-check" },
                    { key: "proposta", label: "Proposta", color: "purple", icon: "clipboard" },
                    { key: "negociacao", label: "Negociação", color: "orange", icon: "handshake" },
                    { key: "cliente", label: "Cliente", color: "emerald", icon: "shield-check" },
                    { key: "perdido", label: "Perdido", color: "red", icon: "ban" },
                  ],
                  varejo: [
                    { key: "interesse", label: "Interesse", color: "blue", icon: "circle-plus" },
                    { key: "demonstracao", label: "Demonstração", color: "amber", icon: "search-check" },
                    { key: "proposta", label: "Proposta", color: "purple", icon: "clipboard" },
                    { key: "venda", label: "Venda Fechada", color: "emerald", icon: "shield-check" },
                    { key: "perdido", label: "Perdido", color: "red", icon: "ban" },
                  ],
                  educacao: [
                    { key: "contato", label: "Contato", color: "blue", icon: "circle-plus" },
                    { key: "apresentacao", label: "Apresentação", color: "amber", icon: "phone-outgoing" },
                    { key: "matricula", label: "Em Matrícula", color: "purple", icon: "clipboard" },
                    { key: "aluno", label: "Aluno", color: "emerald", icon: "shield-check" },
                    { key: "perdido", label: "Desistente", color: "red", icon: "ban" },
                  ],
                  imobiliario: [
                    { key: "contato", label: "Contato", color: "blue", icon: "circle-plus" },
                    { key: "visita", label: "Visita Agendada", color: "amber", icon: "phone-outgoing" },
                    { key: "proposta", label: "Proposta", color: "purple", icon: "clipboard" },
                    { key: "negociacao", label: "Negociação", color: "orange", icon: "handshake" },
                    { key: "fechado", label: "Contrato Assinado", color: "emerald", icon: "shield-check" },
                    { key: "perdido", label: "Perdido", color: "red", icon: "ban" },
                  ],
                };

                if (segmentStages[segmento]) {
                  stages = segmentStages[segmento];
                  funnelName = `Funil ${segmento.charAt(0).toUpperCase() + segmento.slice(1)}`;
                }
              }
            }
          }
        }
      } catch (e) {
        // Falha silenciosa — usa padrão genérico
      }

      createFunnel.mutate({
        name: funnelName,
        description: stages === DEFAULT_STAGES ? "Funil padrão do CRM" : "Criado automaticamente com base no seu GPS",
        stages,
        is_default: true,
      });
    };

    createSmartFunnel();
  }, [funnels, isLoading]);
}
