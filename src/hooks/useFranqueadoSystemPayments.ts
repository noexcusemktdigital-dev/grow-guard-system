import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserOrgId } from "./useUserOrgId";
import { toast } from "sonner";

export interface SystemPayment {
  id: string;
  organization_id: string;
  month: string;
  amount: number;
  billing_type: string;
  asaas_payment_id: string | null;
  invoice_url: string | null;
  status: string;
  paid_at: string | null;
  created_at: string;
}

export function useFranqueadoSystemPayments() {
  const { data: orgId } = useUserOrgId();

  const payments = useQuery({
    queryKey: ["franchisee-system-payments", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("franchisee_system_payments" as any)
        .select("*")
        .eq("organization_id", orgId!)
        .order("month", { ascending: false })
        .limit(12);
      if (error) throw error;
      return (data || []) as unknown as SystemPayment[];
    },
    enabled: !!orgId,
  });

  const currentMonth = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  })();

  const currentPayment = payments.data?.find(p => p.month === currentMonth) || null;

  return { payments, currentPayment, currentMonth, orgId };
}

export function useChargeSystemFee() {
  const queryClient = useQueryClient();
  const { data: orgId } = useUserOrgId();

  return useMutation({
    mutationFn: async (billingType: string) => {
      const { data, error } = await supabase.functions.invoke("asaas-charge-system-fee", {
        body: { organization_id: orgId, billing_type: billingType },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["franchisee-system-payments"] });
    },
    onError: (err: any) => {
      const msg = err?.message || "Erro ao gerar cobrança";
      if (msg === "already_paid") {
        toast.info("Sistema já pago neste mês");
      } else {
        toast.error(msg);
      }
    },
  });
}
