// @ts-nocheck
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { reportError } from "@/lib/error-toast";
import type { MetaAdsInsights } from "./use-meta-ads";

// Threshold: CPL acima deste valor por 2 consultas seguidas dispara alerta
const CPL_ALERT_THRESHOLD = 50;

/**
 * FUNC-ADS-002 — Alertas proativos de performance Meta Ads
 *
 * Monitora o CPL e dispara toast de alerta (via sonner) quando o CPL
 * ultrapassa R$50 em 2 consultas seguidas.
 */
export function useAdsAlerts(data: MetaAdsInsights | undefined) {
  // Guarda as últimas 2 leituras de CPL para detectar tendência
  const cplHistory = useRef<number[]>([]);

  useEffect(() => {
    if (!data?.account) return;

    const cpl = data.account.cpl;
    const spend = data.account.spend;
    const leads = data.account.leads;

    // Sem gasto não há alerta
    if (spend === 0) return;

    // Atualiza histórico (mantém apenas as últimas 2 leituras)
    cplHistory.current = [...cplHistory.current, cpl].slice(-2);

    // Só avalia quando tem 2+ leituras
    if (cplHistory.current.length < 2) return;

    const [prev, curr] = cplHistory.current;

    // CPL > R$50 por 2 consultas seguidas
    if (prev > CPL_ALERT_THRESHOLD && curr > CPL_ALERT_THRESHOLD) {
      reportError(
        new Error(`CPL em R$${curr.toFixed(2)} (acima de R$${CPL_ALERT_THRESHOLD} por 2 consultas seguidas). Revise suas campanhas.`),
        { title: "CPL crítico — Meta Ads", category: "ads.cpl_threshold" }
      );
      return;
    }

    // Gasto alto sem nenhum lead gerado
    if (leads === 0 && spend >= 50 && curr === 0) {
      toast.warning("Sem leads com gasto alto — Meta Ads", {
        description: `R$${spend.toFixed(2)} gastos sem nenhum lead gerado. Verifique as configurações de conversão.`,
        duration: 8000,
        id: "ads-no-leads-alert",
      });
    }
  }, [data]);
}
