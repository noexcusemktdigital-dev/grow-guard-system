import { useNavigate } from "react-router-dom";
import { Cpu, AlertTriangle, Zap, CreditCard, ArrowUpRight, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NetworkAIUsage } from "@/hooks/useNetworkAIUsage";

const COST_PER_TOKEN_BRL = 0.000019; // ~R$ 0,019 por 1k tokens (média ponderada input/output)

interface Props {
  data: NetworkAIUsage;
}

export function HomeAICreditsAlert({ data }: Props) {
  const navigate = useNavigate();
  const estimatedCost7d = (data.tokens_7d * COST_PER_TOKEN_BRL).toFixed(2);
  const hasZero = data.orgs_zero_credits > 0;
  const hasLow = data.orgs_low_credits > 0;

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Cpu className="w-4 h-4 text-primary" />
          Controle IA &amp; Créditos da Rede
        </h3>
        <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate("/franqueadora/saas")}>
          Gerenciar SaaS →
        </Button>
      </div>

      {/* Critical alerts */}
      {hasZero && (
        <button
          onClick={() => navigate("/franqueadora/saas")}
          className="w-full flex items-center gap-3 p-3 rounded-xl border bg-destructive/5 border-destructive/20 hover:bg-destructive/10 transition-colors text-left group"
        >
          <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">
              {data.orgs_zero_credits} organização{data.orgs_zero_credits > 1 ? "ões" : ""} com créditos zerados
            </p>
            <p className="text-[11px] text-muted-foreground">
              IA pausada — {(data.zero_credit_orgs ?? []).slice(0, 3).map(o => o.name).join(", ")}
              {(data.zero_credit_orgs ?? []).length > 3 && ` +${(data.zero_credit_orgs ?? []).length - 3}`}
            </p>
          </div>
          <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      )}

      {hasLow && (
        <button
          onClick={() => navigate("/franqueadora/saas")}
          className="w-full flex items-center gap-3 p-3 rounded-xl border bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10 transition-colors text-left group"
        >
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">
              {data.orgs_low_credits} organização{data.orgs_low_credits > 1 ? "ões" : ""} com créditos abaixo de 10%
            </p>
            <p className="text-[11px] text-muted-foreground">
              {(data.low_credit_orgs ?? []).slice(0, 3).map(o => `${o.name} (${o.percent}%)`).join(", ")}
            </p>
          </div>
          <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground">{data.total_credits.toLocaleString("pt-BR")}</p>
          <p className="text-[11px] text-muted-foreground mt-1">Créditos na Rede</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground">{data.ai_messages_24h}</p>
          <p className="text-[11px] text-muted-foreground mt-1">Msgs IA (24h)</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground">{data.ai_messages_7d}</p>
          <p className="text-[11px] text-muted-foreground mt-1">Msgs IA (7d)</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground">R$ {estimatedCost7d}</p>
          <p className="text-[11px] text-muted-foreground mt-1">Custo IA est. (7d)</p>
        </div>
      </div>

      {/* Platform reminder */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border/50">
        <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            <strong>Lembrete:</strong> O saldo de créditos de IA da rede deve ser monitorado regularmente. Se o saldo zerar, todas as funções de IA da rede serão pausadas automaticamente. Entre em contato com o suporte para recargas.
          </p>
        </div>
      </div>
    </div>
  );
}
