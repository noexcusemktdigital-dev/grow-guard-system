// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUserOrgId } from "./useUserOrgId";

export function useFinanceMonths() {
  const { data: orgId } = useUserOrgId();
  return useQuery({
    queryKey: ["finance-months", orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from("finance_months").select("*").eq("organization_id", orgId!).order("year", { ascending: false }).order("month", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}

export function useFinanceRevenues(monthId?: string) {
  const { data: orgId } = useUserOrgId();
  return useQuery({
    queryKey: ["finance-revenues", orgId, monthId],
    queryFn: async () => {
      // DATA-003: limite de 500 lançamentos — filtro por mês já reduz volume na maioria dos casos
      let q = supabase.from("finance_revenues").select("*").eq("organization_id", orgId!).order("date", { ascending: false }).limit(500);
      if (monthId) q = q.eq("finance_month_id", monthId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}

export function useFinanceExpenses(monthId?: string) {
  const { data: orgId } = useUserOrgId();
  return useQuery({
    queryKey: ["finance-expenses", orgId, monthId],
    queryFn: async () => {
      let q = supabase.from("finance_expenses").select("*").eq("organization_id", orgId!).order("date", { ascending: false }).limit(500);
      if (monthId) q = q.eq("finance_month_id", monthId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}

export function useFinanceClients() {
  const { data: orgId } = useUserOrgId();
  return useQuery({
    queryKey: ["finance-clients", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("finance_clients")
        .select("*")
        .eq("organization_id", orgId!)
        .is("deleted_at", null) // LGPD-002: exclui registros soft-deleted
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}

export function useFinanceEmployees() {
  const { data: orgId } = useUserOrgId();
  return useQuery({
    queryKey: ["finance-employees", orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from("finance_employees").select("*").eq("organization_id", orgId!).order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}

export function useFinanceFranchisees() {
  const { data: orgId } = useUserOrgId();
  return useQuery({
    queryKey: ["finance-franchisees", orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from("finance_franchisees").select("*").eq("organization_id", orgId!).order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}

export function useFinanceInstallments() {
  const { data: orgId } = useUserOrgId();
  return useQuery({
    queryKey: ["finance-installments", orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from("finance_installments").select("*").eq("organization_id", orgId!).order("start_date").limit(500);
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}

export function useFinanceClosings() {
  const { data: orgId } = useUserOrgId();
  return useQuery({
    queryKey: ["finance-closings", orgId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_closings_with_parent", {
        _org_id: orgId!,
      });
      if (error) throw error;
      return data as Record<string, unknown>[];
    },
    enabled: !!orgId,
  });
}

export function useFinanceMutations() {
  const qc = useQueryClient();
  const { data: orgId } = useUserOrgId();

  const createRevenue = useMutation({
    mutationFn: async (rev: { description: string; amount: number; date?: string; category?: string; status?: string; client_id?: string; finance_month_id?: string; payment_method?: string }) => {
      const { data, error } = await supabase.from("finance_revenues").insert({ ...rev, organization_id: orgId! }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["finance-revenues"] }),
  });

  const updateRevenue = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: unknown }) => {
      const { data, error } = await supabase.from("finance_revenues").update(updates).eq("id", id).eq("organization_id", orgId!).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["finance-revenues"] }),
  });

  const deleteRevenue = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("finance_revenues").delete().eq("id", id).eq("organization_id", orgId!);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["finance-revenues"] }),
  });

  const createExpense = useMutation({
    mutationFn: async (exp: { description: string; amount: number; date?: string; category?: string; status?: string; finance_month_id?: string; is_recurring?: boolean }) => {
      const { data, error } = await supabase.from("finance_expenses").insert({ ...exp, organization_id: orgId! }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["finance-expenses"] }),
  });

  const updateExpense = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: unknown }) => {
      const { data, error } = await supabase.from("finance_expenses").update(updates).eq("id", id).eq("organization_id", orgId!).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["finance-expenses"] }),
  });

  const deleteExpense = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("finance_expenses").delete().eq("id", id).eq("organization_id", orgId!);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["finance-expenses"] }),
  });

  return { createRevenue, updateRevenue, deleteRevenue, createExpense, updateExpense, deleteExpense };
}
