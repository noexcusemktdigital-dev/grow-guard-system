import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserOrgId } from "./useUserOrgId";
import { useAuth } from "@/contexts/AuthContext";
import { useClienteSubscription } from "./useClienteSubscription";
import { getPlanBySlug } from "@/constants/plans";

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

/** Quota: how many contents generated this month vs plan limit */
export function useContentQuota() {
  const { data: orgId } = useUserOrgId();
  const { data: subscription } = useClienteSubscription();

  const plan = getPlanBySlug((subscription as any)?.plan_slug);
  const maxContents = plan?.maxContents ?? 8;

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
    max: maxContents,
    remaining: Math.max(0, maxContents - (query.data ?? 0)),
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
      estrategia: any | null;
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

      const resp = await supabase.functions.invoke("generate-content", {
        body: {
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

      if (resp.error) throw new Error(resp.error.message || "Erro ao gerar conteúdo");
      const result = resp.data as any;
      if (result?.error) throw new Error(result.error);

      const conteudos: any[] = result.conteudos || [];
      if (conteudos.length === 0) throw new Error("Nenhum conteúdo gerado");

      // Batch insert
      const rows = conteudos.map((c: any) => ({
        organization_id: orgId,
        title: c.titulo || "Conteúdo",
        format: c.formato,
        objective: c.objetivo,
        result: c as any,
        status: "pending",
        created_by: user?.id,
        platform: payload.plataforma,
      }));

      const { data, error } = await supabase
        .from("client_content")
        .insert(rows as any)
        .select();

      if (error) throw error;
      return { dbRecords: data, conteudos };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client-content-v2"] });
      qc.invalidateQueries({ queryKey: ["content-quota"] });
    },
  });
}

export function useApproveContent() {
  const qc = useQueryClient();
  const { data: orgId } = useUserOrgId();

  return useMutation({
    mutationFn: async (contentId: string) => {
      if (!orgId) throw new Error("Org not found");

      const { error: debitError } = await supabase.rpc("debit_credits" as any, {
        _org_id: orgId,
        _amount: 200,
        _description: "Conteúdo aprovado",
        _source: "generate-content",
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

      for (const id of contentIds) {
        const { error: debitError } = await supabase.rpc("debit_credits" as any, {
          _org_id: orgId,
          _amount: 200,
          _description: "Conteúdo aprovado (lote)",
          _source: "generate-content",
        });
        if (debitError) throw debitError;

        const { error } = await supabase
          .from("client_content")
          .update({ status: "approved" } as any)
          .eq("id", id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client-content-v2"] });
      qc.invalidateQueries({ queryKey: ["credit-wallet"] });
      qc.invalidateQueries({ queryKey: ["content-quota"] });
    },
  });
}
