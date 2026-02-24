import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ProspectionInputs {
  regiao: string;
  nicho: string;
  porte: string;
  desafio: string;
  objetivo: string;
  nome_empresa?: string;
  site?: string;
  redes_sociais?: string;
  conhecimento_previo?: string;
  nivel_contato?: 'frio' | 'morno' | 'quente';
  contato_decisor?: string;
  cargo_decisor?: string;
}

export interface ProspectionResult {
  estrategia_abordagem: {
    titulo: string;
    descricao: string;
    passos: string[];
    dicas: string[];
  };
  avaliacao_inicial: {
    titulo: string;
    descricao: string;
    perguntas: { pergunta: string; objetivo: string }[];
  };
  roteiro_contato: {
    titulo: string;
    descricao: string;
    script_telefone: string;
    script_whatsapp: string;
  };
  quebra_objecoes: {
    titulo: string;
    descricao: string;
    objecoes: { objecao: string; resposta: string }[];
  };
  passo_a_passo_reuniao: {
    titulo: string;
    descricao: string;
    checklist: string[];
  };
}

export interface Prospection {
  id: string;
  organization_id: string;
  lead_id: string | null;
  title: string;
  inputs: ProspectionInputs;
  result: ProspectionResult | null;
  status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useProspections() {
  const { data: orgId } = useUserOrgId();

  return useQuery({
    queryKey: ["prospections", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("franqueado_prospections")
        .select("*")
        .eq("organization_id", orgId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Prospection[];
    },
    enabled: !!orgId,
  });
}

export function useCreateProspection() {
  const qc = useQueryClient();
  const { data: orgId } = useUserOrgId();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (inputs: ProspectionInputs) => {
      if (!orgId || !user) throw new Error("Não autenticado");

      // 1. Insert draft
      const title = `${inputs.nicho} - ${inputs.regiao}`;
      const { data: row, error: insertErr } = await supabase
        .from("franqueado_prospections")
        .insert({
          organization_id: orgId,
          title,
          inputs: inputs as any,
          status: "draft",
          created_by: user.id,
        })
        .select()
        .single();
      if (insertErr) throw insertErr;

      // 2. Call edge function
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        "generate-prospection",
        { body: inputs }
      );

      if (fnError) {
        // Mark as error but keep the record
        await supabase
          .from("franqueado_prospections")
          .update({ status: "error" })
          .eq("id", row.id);
        throw new Error(fnError.message || "Erro ao gerar prospecção");
      }

      // Check for application-level errors
      if (fnData?.error) {
        await supabase
          .from("franqueado_prospections")
          .update({ status: "error" })
          .eq("id", row.id);
        throw new Error(fnData.error);
      }

      // 3. Update with result
      const { data: updated, error: updateErr } = await supabase
        .from("franqueado_prospections")
        .update({ result: fnData.result as any, status: "completed" })
        .eq("id", row.id)
        .select()
        .single();
      if (updateErr) throw updateErr;

      return updated as unknown as Prospection;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["prospections"] });
    },
  });
}

export function useUpdateProspection() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: { id: string; title?: string; lead_id?: string | null }) => {
      const { error } = await supabase
        .from("franqueado_prospections")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["prospections"] });
      toast.success("Prospecção atualizada");
    },
  });
}

export function useDeleteProspection() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("franqueado_prospections")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["prospections"] });
      toast.success("Prospecção excluída");
    },
  });
}
