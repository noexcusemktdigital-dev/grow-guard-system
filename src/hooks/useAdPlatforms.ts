import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { toast } from "@/hooks/use-toast";

export interface AdConnection {
  id: string;
  organization_id: string;
  platform: "google_ads" | "meta_ads";
  account_id: string | null;
  account_name: string | null;
  status: "active" | "expired" | "disconnected";
  last_synced_at: string | null;
  created_at: string;
}

export interface AdMetric {
  id: string;
  platform: string;
  campaign_id: string;
  campaign_name: string;
  campaign_status: string;
  date: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  ctr: number;
  cpc: number;
  cpl: number;
}

export interface AdAnalysis {
  resumo: string;
  pontos_fortes: string[];
  pontos_fracos: string[];
  recomendacoes: string[];
  campanhas_destaque: { nome: string; motivo: string; acao: string }[];
  projecao: string;
}

export function useAdConnections() {
  const { data: orgId } = useUserOrgId();
  return useQuery({
    queryKey: ["ad-connections", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ad_platform_connections")
        .select("id, organization_id, platform, account_id, account_name, status, last_synced_at, created_at")
        .eq("organization_id", orgId!)
        .neq("status", "disconnected");
      if (error) throw error;
      return (data || []) as AdConnection[];
    },
    enabled: !!orgId,
  });
}

export function useAdMetrics(period: number = 30) {
  const { data: orgId } = useUserOrgId();
  const sinceDate = new Date(Date.now() - period * 86400000).toISOString().split("T")[0];

  return useQuery({
    queryKey: ["ad-metrics", orgId, period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ad_campaign_metrics")
        .select("id, platform, campaign_id, campaign_name, campaign_status, date, impressions, clicks, spend, conversions, ctr, cpc, cpl")
        .eq("organization_id", orgId!)
        .gte("date", sinceDate)
        .order("date", { ascending: false });
      if (error) throw error;
      return (data || []) as AdMetric[];
    },
    enabled: !!orgId,
  });
}

export function useAdMetricsSummary(metrics: AdMetric[] | undefined) {
  if (!metrics || metrics.length === 0) {
    return { totalSpend: 0, totalImpressions: 0, totalClicks: 0, totalConversions: 0, avgCtr: 0, avgCpc: 0, avgCpl: 0 };
  }
  const totalSpend = metrics.reduce((s, m) => s + Number(m.spend), 0);
  const totalImpressions = metrics.reduce((s, m) => s + Number(m.impressions), 0);
  const totalClicks = metrics.reduce((s, m) => s + Number(m.clicks), 0);
  const totalConversions = metrics.reduce((s, m) => s + Number(m.conversions), 0);
  return {
    totalSpend,
    totalImpressions,
    totalClicks,
    totalConversions,
    avgCtr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
    avgCpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
    avgCpl: totalConversions > 0 ? totalSpend / totalConversions : 0,
  };
}

export function useSyncMetrics() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (connectionId: string) => {
      const { data, error } = await supabase.functions.invoke("ads-sync-metrics", {
        body: { connection_id: connectionId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ad-metrics"] });
      qc.invalidateQueries({ queryKey: ["ad-connections"] });
      toast({ title: "Métricas sincronizadas!" });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao sincronizar", description: err.message, variant: "destructive" });
    },
  });
}

export function useDisconnectAd() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (connectionId: string) => {
      const { data, error } = await supabase.functions.invoke("ads-disconnect", {
        body: { connection_id: connectionId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ad-connections"] });
      toast({ title: "Conta desconectada" });
    },
  });
}

export function useAnalyzeAds() {
  const { data: orgId } = useUserOrgId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (periodDays: number = 30) => {
      const { data, error } = await supabase.functions.invoke("ads-analyze", {
        body: { organization_id: orgId, period_days: periodDays },
      });
      if (error) throw error;
      return data as { analysis: AdAnalysis; summary: any };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["credit-wallet"] });
    },
    onError: (err: any) => {
      if (err.message?.includes("INSUFFICIENT")) {
        toast({ title: "Créditos insuficientes", description: "Você precisa de 30 créditos para a análise IA.", variant: "destructive" });
      } else {
        toast({ title: "Erro na análise", description: err.message, variant: "destructive" });
      }
    },
  });
}

export function getOAuthUrl(platform: "google_ads" | "meta_ads", redirectUri: string): string {
  if (platform === "google_ads") {
    const clientId = import.meta.env.VITE_GOOGLE_ADS_CLIENT_ID || "";
    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent("https://www.googleapis.com/auth/adwords.readonly")}&access_type=offline&prompt=consent`;
  } else {
    const appId = import.meta.env.VITE_META_APP_ID || "";
    return `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=ads_read&response_type=code`;
  }
}
