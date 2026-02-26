import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useSaasClients() {
  return useQuery({
    queryKey: ["saas-clients"],
    queryFn: async () => {
      const { data: orgs, error } = await supabase
        .from("organizations")
        .select("id, name, type, created_at")
        .eq("type", "cliente")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const orgIds = orgs.map((o) => o.id);
      if (!orgIds.length) return [];

      const [subsRes, walletsRes, membersRes] = await Promise.all([
        supabase.from("subscriptions").select("*").in("organization_id", orgIds),
        supabase.from("credit_wallets").select("*").in("organization_id", orgIds),
        supabase.from("organization_memberships").select("organization_id").in("organization_id", orgIds),
      ]);

      const subsMap = new Map((subsRes.data || []).map((s) => [s.organization_id, s]));
      const walletsMap = new Map((walletsRes.data || []).map((w) => [w.organization_id, w]));

      const memberCounts = new Map<string, number>();
      (membersRes.data || []).forEach((m) => {
        memberCounts.set(m.organization_id, (memberCounts.get(m.organization_id) || 0) + 1);
      });

      return orgs.map((org) => ({
        ...org,
        subscription: subsMap.get(org.id) || null,
        wallet: walletsMap.get(org.id) || null,
        memberCount: memberCounts.get(org.id) || 0,
      }));
    },
  });
}

export function useSaasCostDashboard() {
  return useQuery({
    queryKey: ["saas-costs"],
    queryFn: async () => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const [txRes, subsRes] = await Promise.all([
        supabase
          .from("credit_transactions")
          .select("organization_id, amount, type, created_at")
          .eq("type", "consumption")
          .gte("created_at", startOfMonth),
        supabase.from("subscriptions").select("organization_id, plan, status").eq("status", "active"),
      ]);

      const consumptionByOrg = new Map<string, number>();
      (txRes.data || []).forEach((tx) => {
        const current = consumptionByOrg.get(tx.organization_id) || 0;
        consumptionByOrg.set(tx.organization_id, current + Math.abs(tx.amount));
      });

      const activeSubs = subsRes.data || [];
      const totalCreditsConsumed = Array.from(consumptionByOrg.values()).reduce((a, b) => a + b, 0);

      return {
        activeSubscriptions: activeSubs.length,
        totalCreditsConsumed,
        estimatedAiCost: totalCreditsConsumed * 0.002,
        consumptionByOrg: Object.fromEntries(consumptionByOrg),
      };
    },
  });
}

export function usePlatformErrors(filters?: { severity?: string; source?: string }) {
  return useQuery({
    queryKey: ["platform-errors", filters],
    queryFn: async () => {
      let query = supabase
        .from("platform_error_logs" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (filters?.severity) {
        query = query.eq("severity", filters.severity);
      }
      if (filters?.source) {
        query = query.eq("source", filters.source);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as any[];
    },
  });
}

export function useResolveError() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (errorId: string) => {
      const { error } = await supabase
        .from("platform_error_logs" as any)
        .update({ resolved: true, resolved_at: new Date().toISOString() } as any)
        .eq("id", errorId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["platform-errors"] }),
  });
}

export function useAllSupportTickets() {
  return useQuery({
    queryKey: ["all-support-tickets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });
}

export function useAdjustCredits() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ orgId, amount, description }: { orgId: string; amount: number; description: string }) => {
      const { data: wallet, error: wErr } = await supabase
        .from("credit_wallets")
        .select("id, balance")
        .eq("organization_id", orgId)
        .single();
      if (wErr) throw wErr;

      const newBalance = wallet.balance + amount;
      const { error: uErr } = await supabase
        .from("credit_wallets")
        .update({ balance: newBalance })
        .eq("id", wallet.id);
      if (uErr) throw uErr;

      const { error: tErr } = await supabase.from("credit_transactions").insert({
        organization_id: orgId,
        type: amount > 0 ? "manual_credit" : "manual_debit",
        amount,
        balance_after: newBalance,
        description,
      } as any);
      if (tErr) throw tErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["saas-clients"] });
      qc.invalidateQueries({ queryKey: ["saas-costs"] });
    },
  });
}
