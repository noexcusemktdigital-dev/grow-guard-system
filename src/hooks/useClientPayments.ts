import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserOrgId } from "./useUserOrgId";
import { toast } from "sonner";

export interface ClientPayment {
  id: string;
  organization_id: string;
  contract_id: string;
  month: string;
  amount: number;
  franchisee_share: number;
  billing_type: string;
  asaas_payment_id: string | null;
  asaas_customer_id: string | null;
  invoice_url: string | null;
  status: string;
  paid_at: string | null;
  created_at: string;
}

export function useClientPayments(month?: string) {
  const { data: orgId } = useUserOrgId();

  return useQuery({
    queryKey: ["client-payments", orgId, month],
    queryFn: async () => {
      let q = supabase
        .from("client_payments" as any)
        .select("*")
        .eq("organization_id", orgId!)
        .order("created_at", { ascending: false });
      if (month) q = q.eq("month", month);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as ClientPayment[];
    },
    enabled: !!orgId,
  });
}

export function useAllClientPayments() {
  return useQuery({
    queryKey: ["all-client-payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_payments" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []) as unknown as ClientPayment[];
    },
  });
}

export function useChargeClient() {
  const queryClient = useQueryClient();
  const { data: orgId } = useUserOrgId();

  return useMutation({
    mutationFn: async ({ contract_id, billing_type, organization_id }: { contract_id: string; billing_type: string; organization_id?: string }) => {
      const { data, error } = await supabase.functions.invoke("asaas-charge-client", {
        body: { organization_id: organization_id || orgId, contract_id, billing_type },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-payments"] });
      toast.success("Cobrança gerada com sucesso!");
    },
    onError: (err: any) => {
      const msg = err?.message || "Erro ao gerar cobrança";
      if (msg === "already_paid") {
        toast.info("Já pago neste mês");
      } else {
        toast.error(msg);
      }
    },
  });
}
