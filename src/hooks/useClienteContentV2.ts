// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { invokeEdge } from "@/lib/edge";
import { extractEdgeFunctionError } from "@/lib/edgeFunctionError";
import { useUserOrgId } from "./useUserOrgId";
import { useAuth } from "@/contexts/AuthContext";
import { useClienteSubscription } from "./useClienteSubscription";
import { useClienteWallet } from "./useClienteWallet";
import { CREDIT_COSTS } from "@/constants/plans";
import { analytics } from "@/lib/analytics";
import { ANALYTICS_EVENTS } from "@/lib/analytics-events";

const CREDIT_COST_PER_CONTENT = CREDIT_COSTS["generate-content"].cost;
export const CREDIT_COST_APPROVE_CONTENT = CREDIT_COSTS["approve-content"].cost;

export interface ContentItem {
  id: string;
  title: string;
  format: string | null;
  objective: string | null;
  cta: string | null;
  main_message: string | null;
  result: Record<string, unknown> | null;
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

/** Quota: based on credit balance. Each content costs 30 credits. */
export function useContentQuota() {
  const { data: orgId } = useUserOrgId();
  const { data: wallet, isLoading: walletLoading } = useClienteWallet();

  const creditBalance = wallet?.balance ?? 0;
  const maxByCredits = Math.floor(creditBalance / CREDIT_COST_PER_CONTENT);

  const query = useQuery({
    queryKey: ["content-quota", orgId],
    queryFn: async () => {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const { count, error } = await supabase
        .from("client_content")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId!)
        .gte("created_at", monthStart);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!orgId,
  });

  return {
    ...query,
    used: query.data ?? 0,
    max: maxByCredits,
    remaining: maxByCredits,
    creditBalance,
    costPerContent: CREDIT_COST_PER_CONTENT,
    isWalletLoading: walletLoading,
  };
}

export function useGenerateContent() {
  const { data: orgId } = useUserOrgId();
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      quantidade: number;
      formatos: { tipo: string; qtd: number }[];
      objetivos: string[];
      tema?: string;
      plataforma: string;
      tom?: string;
      publico?: string;
      estrategia: Record<string, unknown> | null;
      // New fields
      funilMomento?: string;
      contextoEspecial?: string;
      contextoDetalhe?: string;
      estiloLote?: string;
      nomeEmpresa?: string;
      produto?: string;
      diferencial?: string;
      doresPublico?: string;
      desejosPublico?: string;
    }) => {
      if (!orgId) throw new Error("Org not found");

      const resp = await invokeEdge("generate-content", {
        body: {
          organization_id: orgId,
          quantidade: payload.quantidade,
          formatos: payload.formatos,
          objetivos: payload.objetivos,
          tema: payload.tema || "",
          plataforma: payload.plataforma,
          tom: payload.tom || "",
          publico: payload.publico || "",
          estrategia: payload.estrategia,
          funilMomento: payload.funilMomento || "",
          contextoEspecial: payload.contextoEspecial || "",
          contextoDetalhe: payload.contextoDetalhe || "",
          estiloLote: payload.estiloLote || "",
          nomeEmpresa: payload.nomeEmpresa || "",
          produto: payload.produto || "",
          diferencial: payload.diferencial || "",
          doresPublico: payload.doresPublico || "",
          desejosPublico: payload.desejosPublico || "",
        },
      });

      if (resp.error) {
        const realError = await extractEdgeFunctionError(resp.error);
        throw realError;
      }
      const result = resp.data as any;
      if (result?.error) throw new Error(result.error as string);

      const conteudos = (result.conteudos || []) as any[];
      if (conteudos.length === 0) throw new Error("Nenhum conteúdo gerado");

      // Batch insert
      const rows = conteudos.map((c) => ({
        organization_id: orgId,
        title: (c.titulo as string) || "Conteúdo",
        format: c.formato,
        objective: c.objetivo,
        result: c as any,
        status: "pending",
        created_by: user?.id,
        platform: payload.plataforma,
      }));

      const { data, error } = await supabase
        .from("client_content")
        .insert(rows as any[])
        .select();

      if (error) throw error;
      return { dbRecords: data, conteudos };
    },
    onSuccess: (_, payload) => {
      analytics.track(ANALYTICS_EVENTS.AI_CONTENT_GENERATED, { feature: "generate-content", prompt_version: payload.plataforma });
      qc.invalidateQueries({ queryKey: ["client-content-v2"] });
      qc.invalidateQueries({ queryKey: ["content-quota"] });
    },
    onError: (err: unknown) => {
      analytics.track(ANALYTICS_EVENTS.AI_CONTENT_FAILED, { feature: "generate-content", error_code: err instanceof Error ? err.message : String(err) });
    },
  });
}

export function useApproveContent() {
  const qc = useQueryClient();
  const { data: orgId } = useUserOrgId();

  return useMutation({
    mutationFn: async (contentId: string) => {
      if (!orgId) throw new Error("Org not found");

      // Verifica se já está aprovado para não debitar duas vezes
      const { data: existing } = await supabase
        .from("client_content")
        .select("status")
        .eq("id", contentId)
        .maybeSingle();

      if (existing?.status === "approved") return; // Já aprovado, sem débito

      const { error: debitError } = await supabase.rpc("debit_credits" as any, {
        _org_id: orgId,
        _amount: CREDIT_COST_APPROVE_CONTENT,
        _description: "Conteúdo aprovado",
        _source: "approve-content",
      });
      if (debitError) throw debitError;

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

export function useApproveBatch() {
  const qc = useQueryClient();
  const { data: orgId } = useUserOrgId();

  return useMutation({
    mutationFn: async (contentIds: string[]) => {
      if (!orgId) throw new Error("Org not found");

      // Busca status atual de todos os itens para filtrar já aprovados
      const { data: existing } = await supabase
        .from("client_content")
        .select("id, status")
        .in("id", contentIds);

      const alreadyApproved = new Set(
        (existing || []).filter(c => c.status === "approved").map(c => c.id)
      );

      // Processa apenas os que ainda não foram aprovados
      const pendingIds = contentIds.filter(id => !alreadyApproved.has(id));

      for (const id of pendingIds) {
        const { error: debitError } = await supabase.rpc("debit_credits" as any, {
          _org_id: orgId,
          _amount: CREDIT_COST_APPROVE_CONTENT,
          _description: "Conteúdo aprovado (lote)",
          _source: "approve-content",
        });
        if (debitError) throw new Error(`Erro ao debitar créditos: ${debitError.message}`);

        const { error } = await supabase
          .from("client_content")
          .update({ status: "approved" } as any)
          .eq("id", id);
        if (error) throw new Error(`Erro ao aprovar conteúdo ${id}: ${error.message}`);
      }

      return { approved: pendingIds.length, skipped: alreadyApproved.size };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client-content-v2"] });
      qc.invalidateQueries({ queryKey: ["credit-wallet"] });
      qc.invalidateQueries({ queryKey: ["content-quota"] });
    },
  });
}

export function useDeleteContent() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (contentId: string) => {
      const { error } = await supabase
        .from("client_content")
        .delete()
        .eq("id", contentId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client-content-v2"] });
      qc.invalidateQueries({ queryKey: ["content-quota"] });
    },
  });
}
