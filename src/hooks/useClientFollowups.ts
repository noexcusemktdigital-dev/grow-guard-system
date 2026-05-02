import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUserOrgId } from "./useUserOrgId";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/typed";
import type { Json } from "@/integrations/supabase/types";

type ClientFollowupRow = Tables<"client_followups">;

/* ── Sub-seção de análise ── */
export interface AnaliseSubSection {
  metricas?: Record<string, number>;
  positivos?: string[];
  negativos?: string[];
  observacoes?: string;
  imagens?: string[];
  score?: number;
  indicadores?: Array<{ label: string; ideal: number; atual: number; unidade: string }>;
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

/* ── Pauta de conteúdo (cada post/criativo) ── */
export interface ConteudoPauta {
  titulo: string;
  formato: string;          // Reels, Stories, Carrossel, etc.
  objetivo: string;
  roteiro: string;
  tempo_duracao: string;     // ex: "30s", "1min", "60s"
  data_postagem: string;     // YYYY-MM-DD
  plataforma: string;        // Instagram, TikTok, YouTube, LinkedIn
  tipo: "organico" | "pago";
  cta: string;
  referencias: string;
  imagens_referencia?: string[];
  necessidades_cliente: string;
  observacoes: string;
}

export interface ConteudoSection {
  linha_editorial?: string;
  qtd_postagens?: number;
  tipo_conteudo?: string[];
  pautas?: ConteudoPauta[];
  necessidades_cliente?: string[];
  // Legacy fields for backwards compat
  roteiros?: string[];
  artes?: string[];
  referencias?: string[];
}

/* ── Campanha de tráfego pago (detalhada) ── */
export interface TrafegoCampanha {
  nome_campanha: string;
  plataforma: string;         // Meta Ads, Google Ads, TikTok Ads, LinkedIn Ads
  objetivo_campanha: string;  // Conversão, Tráfego, Reconhecimento, etc.
  tipo_campanha: string;      // Campanha de vendas, Remarketing, LAL, etc.
  formato_anuncio: string;    // Vídeo, Imagem, Carrossel, Coleção
  publico_alvo: string;
  segmentacao: string;        // Interesses, LAL, Custom Audience, etc.
  localizacao: string;
  faixa_etaria: string;
  investimento_diario: number;
  investimento_total: number;
  duracao_dias: number;
  data_inicio: string;
  data_fim: string;
  copy_principal: string;
  cta: string;
  url_destino: string;
  meta_cpl: number;
  meta_cpc: number;
  meta_ctr: number;
  meta_conversoes: number;
  meta_roas: number;
  observacoes: string;
}

// Legacy compat
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
  campanhas?: TrafegoCampanha[];
  plataformas?: TrafegoPlataforma[]; // legacy
}

/* ── Web / Landing Pages ── */
export interface WebSecao {
  titulo: string;
  tipo: string;               // Landing Page, Página Institucional, Blog, E-commerce
  objetivo: string;
  descricao: string;
  secoes_pagina: string[];     // Seções que a página terá
  expectativa_resultado: string;
  necessidades_cliente: string;
  prazo_estimado: string;
  status: string;              // A criar, Em alteração, Em revisão
  observacoes: string;
  // legacy
  motivo?: string;
}

export interface WebSection {
  secoes?: WebSecao[];
}

/* ── Vendas / CRM ── */
export interface VendasSection {
  analise_crm?: string;
  funil_atual?: string;
  taxa_conversao?: string;
  ticket_medio?: string;
  meta_vendas?: string;
  estrategias?: string[];
  melhorias?: string[];
  acoes_equipe?: string[];
  ferramentas?: string[];
  observacoes?: string;
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
  unit_org_id: string | null;
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
        .select("client_name, id, unit_org_id")
        .eq("organization_id", orgId)
        .order("client_name");
      if (error) throw error;
      const map = new Map<string, { count: number; unit_org_id: string | null }>();
      (data as Pick<ClientFollowupRow, "client_name" | "id" | "unit_org_id">[] || []).forEach((row) => {
        const name = row.client_name || "Sem nome";
        const existing = map.get(name);
        if (existing) {
          existing.count++;
        } else {
          map.set(name, { count: 1, unit_org_id: row.unit_org_id });
        }
      });
      return Array.from(map.entries()).map(([name, { count, unit_org_id }]) => ({ name, count, unit_org_id }));
    },
    enabled: !!orgId,
  });
}

/* ── List folders visible to a franqueado (their unit) ── */
export function useClientFoldersForUnit() {
  const { data: orgId } = useUserOrgId();
  return useQuery({
    queryKey: ["client-folders-unit", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("client_followups")
        .select("client_name, id, unit_org_id")
        .eq("unit_org_id", orgId)
        .order("client_name");
      if (error) throw error;
      const map = new Map<string, { count: number; unit_org_id: string | null }>();
      (data as Pick<ClientFollowupRow, "client_name" | "id" | "unit_org_id">[] || []).forEach((row) => {
        const name = row.client_name || "Sem nome";
        const existing = map.get(name);
        if (existing) {
          existing.count++;
        } else {
          map.set(name, { count: 1, unit_org_id: row.unit_org_id });
        }
      });
      return Array.from(map.entries()).map(([name, { count, unit_org_id }]) => ({ name, count, unit_org_id }));
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
      unit_org_id?: string | null;
      organization_id?: string;
    }) => {
      if (!orgId) throw new Error("Organização não encontrada");
      if (input.id) {
        // Update: don't overwrite organization_id — preserve the original
        const updatePayload = {
          client_name: input.client_name,
          month_ref: input.month_ref,
          status: input.status || "draft",
          analise: input.analise as unknown as Json,
          plano_proximo: input.plano_proximo as unknown as Json,
          unit_org_id: input.unit_org_id || null,
        };
        const { data, error } = await supabase.from("client_followups").update(updatePayload).eq("id", input.id).select().single();
        if (error) throw error;
        return data;
      } else {
        // Insert: set organization_id and unit_org_id
        const insertPayload = {
          organization_id: input.organization_id || orgId,
          client_name: input.client_name,
          month_ref: input.month_ref,
          status: input.status || "draft",
          analise: input.analise as unknown as Json,
          plano_proximo: input.plano_proximo as unknown as Json,
          unit_org_id: input.unit_org_id || orgId,
        };
        const { data, error } = await supabase.from("client_followups").insert(insertPayload).select().single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client-followups"] });
      qc.invalidateQueries({ queryKey: ["client-folders"] });
      qc.invalidateQueries({ queryKey: ["client-folders-unit"] });
      toast.success("Acompanhamento salvo com sucesso!");
    },
    onError: (e: unknown) => {
      toast.error(e.message || "Erro ao salvar acompanhamento");
    },
  });
}

/* ── Rename a client folder (updates client_name on all followups) ──
   Matriz (super_admin/admin) pode renomear pastas de qualquer unidade,
   por isso NÃO filtramos por organization_id aqui. Opcionalmente pode-se
   restringir a uma unidade específica via unitOrgId. */
export function useRenameFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      oldName,
      newName,
      unitOrgId,
    }: { oldName: string; newName: string; unitOrgId?: string | null }) => {
      const trimmed = newName.trim();
      if (!trimmed) throw new Error("Nome não pode ser vazio");

      let q = supabase
        .from("client_followups")
        .update({ client_name: trimmed })
        .eq("client_name", oldName);

      if (unitOrgId) {
        q = q.eq("unit_org_id", unitOrgId);
      }

      const { error } = await q;
      if (error) throw error;
      return trimmed;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client-folders"] });
      qc.invalidateQueries({ queryKey: ["client-folders-unit"] });
      qc.invalidateQueries({ queryKey: ["client-followups"] });
      toast.success("Nome do projeto atualizado!");
    },
    onError: (e: unknown) => {
      toast.error(e.message || "Erro ao renomear projeto");
    },
  });
}
