import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { invokeEdge } from "@/lib/edge";
import { useUserOrgId } from "./useUserOrgId";
import { toast } from "sonner";
import { reportError } from "@/lib/error-toast";
import type { Tables } from "@/integrations/supabase/typed";

export type SystemPayment = Tables<"franchisee_system_payments">;

export function useFranqueadoSystemPayments() {
  const { data: orgId } = useUserOrgId();

  const payments = useQuery({
    queryKey: ["franchisee-system-payments", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("franchisee_system_payments")
        .select("*")
        .eq("organization_id", orgId!)
        .order("month", { ascending: false })
        .limit(12);
      if (error) throw error;
      return (data ?? []) as SystemPayment[];
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
      // Refresh session to ensure fresh token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão expirada. Faça login novamente.");
      const { data, error } = await invokeEdge("asaas-charge-system-fee", {
        body: { organization_id: orgId, billing_type: billingType },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["franchisee-system-payments"] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Erro ao gerar cobrança";
      if (msg === "already_paid") {
        toast.info("Sistema já pago neste mês");
      } else if (msg.includes("Unauthorized") || msg.includes("401")) {
        reportError(err, { title: "Sessão expirada. Recarregue a página e tente novamente.", category: "asaas.auth" });
      } else if (msg.includes("not_allowed_ip")) {
        reportError(err, { title: "IP não autorizado no Asaas. Configure o proxy.", category: "asaas.ip_blocked" });
      } else {
        reportError(err, { title: "Erro ao gerar cobrança do sistema", category: "asaas.system_fee" });
      }
    },
  });
}
