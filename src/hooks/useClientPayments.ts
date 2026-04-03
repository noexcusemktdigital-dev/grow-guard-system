// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUserOrgId } from "./useUserOrgId";
import { toast } from "sonner";
import { startOfMonth, endOfMonth, format } from "date-fns";

export interface ClientPayment {
  id: string;
  organization_id: string;
  contract_id: string;
  month: string;
  amount: number;
  franchisee_share: number;
  franqueadora_share: number | null;
  surplus_amount: number | null;
  billing_type: string;
  asaas_payment_id: string | null;
  asaas_customer_id: string | null;
  invoice_url: string | null;
  status: string;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useClientPayments(month?: string) {
  const { data: orgId } = useUserOrgId();

  return useQuery({
    queryKey: ["client-payments", orgId, month],
    queryFn: async () => {
      let q = supabase
        .from("client_payments" as unknown as "contracts")
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
        .from("client_payments" as unknown as "contracts")
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
      // Refresh session to ensure fresh token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão expirada. Faça login novamente.");
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
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === "already_paid") {
        toast.info("Já pago neste mês");
      } else if (msg.includes("Unauthorized") || msg.includes("401")) {
        toast.error("Sessão expirada. Recarregue a página e tente novamente.");
      } else if (msg.includes("not_allowed_ip")) {
        toast.error("IP não autorizado no Asaas. Configure o proxy.");
      } else {
        toast.error(msg);
      }
    },
  });
}

export interface AsaasPayment {
  id: string;
  value: number;
  netValue: number;
  status: string;
  dueDate: string | null;
  paymentDate: string | null;
  billingType: string;
  description: string | null;
  invoiceUrl: string | null;
  bankSlipUrl: string | null;
  pixQrCode: string | null;
  externalReference: string | null;
  customerAsaasId: string | null;
  orgName: string;
  orgId: string | null;
}

export function useAsaasNetworkPayments() {
  // Fetch last 12 months for full overview
  const now = new Date();
  const start = format(new Date(now.getFullYear(), now.getMonth() - 11, 1), "yyyy-MM-dd");
  const end = format(endOfMonth(now), "yyyy-MM-dd");

  return useQuery({
    queryKey: ["asaas-network-payments", start],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("asaas-list-payments", {
        body: { all: true, startDate: start, endDate: end },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return (data?.payments || []) as AsaasPayment[];
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useManagePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { action: "cancel" | "update"; payment_id: string; value?: number; dueDate?: string; description?: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão expirada. Faça login novamente.");
      const { data, error } = await supabase.functions.invoke("asaas-manage-payment", { body: params });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["asaas-network-payments"] });
      if (variables.action === "cancel") {
        toast.success("Cobrança cancelada com sucesso!");
      } else {
        toast.success("Cobrança atualizada com sucesso!");
      }
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Erro ao processar ação");
    },
  });
}
