// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { reportError } from "@/lib/error-toast";

export interface FranchiseCandidate {
  id: string;
  organization_id: string;
  name: string;
  email: string;
  phone: string | null;
  birth_date: string | null;
  marital_status: string | null;
  cep: string | null;
  city: string | null;
  address: string | null;
  cpf: string | null;
  rg: string | null;
  company_name: string | null;
  cnpj: string | null;
  company_address: string | null;
  doc_url: string | null;
  lgpd_consent: boolean;
  lgpd_consent_date: string | null;
  status: string;
  source_lead_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useFranchiseCandidates() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["franchise-candidates", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("franchise_candidates")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as FranchiseCandidate[];
    },
    enabled: !!user,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("franchise_candidates")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["franchise-candidates"] });
      toast.success("Status atualizado");
    },
    onError: (err: unknown) => reportError(err, { title: "Erro ao atualizar status", category: "franchise.candidate_status" }),
  });

  const updateNotes = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { error } = await supabase
        .from("franchise_candidates")
        .update({ notes })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["franchise-candidates"] });
      toast.success("Observações salvas");
    },
    onError: (err: unknown) => reportError(err, { title: "Erro ao salvar observações", category: "franchise.candidate_notes" }),
  });

  return { ...query, updateStatus, updateNotes };
}
