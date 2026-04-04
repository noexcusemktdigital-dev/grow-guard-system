import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUserOrgId } from "./useUserOrgId";
import { toast } from "sonner";

/* ── Sub-seção de análise (cada área tem métricas + positivos + negativos) ── */

export interface AnaliseSubSection {
  metricas?: Record<string, number>;
  positivos?: string[];
  negativos?: string[];
  observacoes?: string;
}

export interface FollowupAnalise {
  conteudo?: AnaliseSubSection;
  trafego?: AnaliseSubSection;
  web?: AnaliseSubSection;
  vendas?: AnaliseSubSection;
  resumo_geral?: string;
  avancos_mes?: string[];
  pontos_melhorar?: string[];
}

export interface ConteudoSection {
  roteiros?: string[];
  artes?: string[];
  qtd_postagens?: number;
  tipo_conteudo?: string[];
  linha_editorial?: string;
  referencias?: string[];
  necessidades_cliente?: string[];
}

export interface TrafegoPlataforma {
  nome: string;
  tipo_campanha: string;
  conteudo_campanha: string;
  publicos: string;
  objetivo: string;
  investimento: number;
  divisao_investimento: string;
  metricas_meta: string;
}

export interface TrafegoSection {
  plataformas?: TrafegoPlataforma[];
}

export interface WebSecao {
  titulo: string;
  motivo: string;
  necessidades_cliente: string;
}

export interface WebSection {
  secoes?: WebSecao[];
}

export interface VendasSection {
  analise_crm?: string;
  estrategias?: string[];
  melhorias?: string[];
}

export interface FollowupPlano {
  conteudo?: ConteudoSection;
  trafego?: TrafegoSection;
  web?: WebSection;
  vendas?: VendasSection;
}

export interface ClientFollowup {
  id: string;
  organization_id: string;
  strategy_id: string | null;
  client_name: string;
  month_ref: string;
  status: string;
  analise: FollowupAnalise;
  plano_proximo: FollowupPlano;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/* ── List distinct client folders ── */
export function useClientFolders() {
  const { data: orgId } = useUserOrgId();

  return useQuery({
    queryKey: ["client-folders", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("client_followups")
        .select("client_name, id")
        .eq("organization_id", orgId)
        .order("client_name");
      if (error) throw error;
      const map = new Map<string, number>();
      (data || []).forEach((row: any) => {
        const name = row.client_name || "Sem nome";
        map.set(name, (map.get(name) || 0) + 1);
      });
      return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
    },
    enabled: !!orgId,
  });
}

/* ── List cycles for a specific client ── */
export function useClientFollowups(clientName: string | null) {
  const { data: orgId } = useUserOrgId();

  return useQuery({
    queryKey: ["client-followups", orgId, clientName],
    queryFn: async () => {
      if (!orgId || !clientName) return [];
      const { data, error } = await supabase
        .from("client_followups")
        .select("*")
        .eq("organization_id", orgId)
        .eq("client_name", clientName)
        .order("month_ref", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as ClientFollowup[];
    },
    enabled: !!orgId && !!clientName,
  });
}

/* ── Save (create or update) ── */
export function useSaveFollowup() {
  const qc = useQueryClient();
  const { data: orgId } = useUserOrgId();

  return useMutation({
    mutationFn: async (input: {
      id?: string;
      client_name: string;
      month_ref: string;
      status?: string;
      analise: FollowupAnalise;
      plano_proximo: FollowupPlano;
    }) => {
      if (!orgId) throw new Error("Organização não encontrada");

      const payload = {
        organization_id: orgId,
        client_name: input.client_name,
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
      qc.invalidateQueries({ queryKey: ["client-folders"] });
      toast.success("Acompanhamento salvo com sucesso!");
    },
    onError: (e: any) => {
      toast.error(e.message || "Erro ao salvar acompanhamento");
    },
  });
}
