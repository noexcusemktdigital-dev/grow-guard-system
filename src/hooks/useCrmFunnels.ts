// @ts-nocheck
import { useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUserOrgId } from "./useUserOrgId";
import { DEFAULT_STAGES, FunnelStage } from "@/components/crm/CrmStageSystem";

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
    }) => {
      if (funnel.is_default && orgId) {
        await supabase
          .from("crm_funnels")
          .update({ is_default: false })
          .eq("organization_id", orgId);
      }
      const { data, error } = await supabase
        .from("crm_funnels")
        .insert({
          ...funnel,
          organization_id: orgId!,
          stages: funnel.stages ?? DEFAULT_STAGES,
        })
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
        .update(updates)
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
    if (funnels && funnels.length === 0) {
      created.current = true;
      createFunnel.mutate({
        name: "Funil de Vendas",
        description: "Funil padrão do CRM",
        stages: DEFAULT_STAGES,
        is_default: true,
      });
    }
  }, [funnels, isLoading]);
}
