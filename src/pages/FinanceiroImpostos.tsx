import { useState } from "react";
import { getMonthSummary, getFolhaForMonth, getReceitasForMonth } from "@/data/mockData";
import { KpiCard } from "@/components/KpiCard";

const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type Tab = "base" | "pagamentos" | "historico";

export default function FinanceiroImpostos() {
  const [mes, setMes] = useState("2026-02");
  const [tab, setTab] = useState<Tab>("base");

  const summary = getMonthSummary(mes);
  const folha = getFolhaForMonth(mes);
  const receitas = getReceitasForMonth(mes);

  const receitasComNF = receitas.filter(r => r.notaFiscalEmitida);
  const receitasSemNF = receitas.filter(r => !r.notaFiscalEmitida);
  const faturamentoComNF = receitasComNF.reduce((s, r) => s + r.valorBruto, 0);
  const baseCalculo = faturamentoComNF + folha.operacional;

  // Histórico de impostos
  const mesesList = ["2026-01", "2026-02", "2026-03"];
  const historico = mesesList.map(m => {
    const s = getMonthSummary(m);
    const f = getFolhaForMonth(m);
    const recs = getReceitasForMonth(m);
    const fatNF = recs.filter(r => r.notaFiscalEmitida).reduce((sum, r) => sum + r.valorBruto, 0);
    return {
      mes: m,
      label: m === "2026-01" ? "Jan/26" : m === "2026-02" ? "Fev/26" : "Mar/26",
      baseCalculo: fatNF + f.operacional,
      imposto: s.impostos,
      statusPagamento: m <= "2026-02" ? "Pago" as const : "Pendente" as const,
    };
  });

  const tabs: { key: Tab; label: string }[] = [
    { key: "base", label: "Base de Cálculo" },
    { key: "pagamentos", label: "Pagamentos" },
    { key: "historico", label: "Histórico" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1400px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Financeiro • Impostos</h1>
          <p className="text-sm text-muted-foreground mt-1">Cálculo e regras de tributação</p>
        </div>
        <select value={mes} onChange={(e) => setMes(e.target.value)} className="bg-secondary text-foreground border border-border rounded-lg px-3 py-2 text-sm">
          <option value="2026-01">Jan/2026</option>
          <option value="2026-02">Fev/2026</option>
          <option value="2026-03">Mar/2026</option>
        </select>
      </div>

      {/* Regra */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="font-semibold text-foreground">Regra de Imposto</h3>
        <p className="text-sm text-muted-foreground">
          <strong>10%</strong> sobre a soma de: Faturamento Bruto <strong>com NF emitida</strong> + Folha Operacional (excluindo pró-labore).
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Faturamento c/ NF" value={formatBRL(faturamentoComNF)} />
        <KpiCard label="Folha Operacional" value={formatBRL(folha.operacional)} sublabel="Exclui pró-labore" />
        <KpiCard label="Base de Cálculo" value={formatBRL(baseCalculo)} />
        <KpiCard label="Imposto (10%)" value={formatBRL(summary.impostos)} accent />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary/50 p-1 rounded-lg w-fit">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${tab === t.key ? "bg-background text-foreground font-medium shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Base de Cálculo */}
      {tab === "base" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Receitas com NF Emitida ({receitasComNF.length})</h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {receitasComNF.map(r => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <span className="text-sm text-foreground">{r.clienteNome}</span>
                  <span className="text-sm font-medium text-foreground">{formatBRL(r.valorBruto)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-border mt-3 pt-3 flex justify-between">
              <span className="text-sm font-semibold text-foreground">Total</span>
              <span className="text-sm font-bold text-foreground">{formatBRL(faturamentoComNF)}</span>
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Receitas SEM NF ({receitasSemNF.length})</h3>
            {receitasSemNF.length === 0 ? (
              <p className="text-sm text-muted-foreground">Todas as NFs estão emitidas ✓</p>
            ) : (
              <div className="space-y-2">
                {receitasSemNF.map(r => (
                  <div key={r.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <span className="text-sm text-foreground">{r.clienteNome}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-foreground">{formatBRL(r.valorBruto)}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-red-500/15 text-red-500">Sem NF</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-border mt-4 pt-4">
              <h4 className="text-sm font-semibold text-foreground mb-3">Composição da Folha</h4>
              <div className="space-y-2">
                <div className="flex justify-between py-1">
                  <span className="text-sm text-muted-foreground">Folha Operacional</span>
                  <span className="text-sm font-medium text-foreground">{formatBRL(folha.operacional)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-sm text-muted-foreground">Pró-labore (não entra)</span>
                  <span className="text-sm text-muted-foreground line-through">{formatBRL(folha.proLabore)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pagamentos */}
      {tab === "pagamentos" && (
        <div className="glass-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-secondary/20">
            <h3 className="text-sm font-semibold text-foreground">Status de Pagamento — {mes === "2026-01" ? "Jan/26" : mes === "2026-02" ? "Fev/26" : "Mar/26"}</h3>
          </div>
          <div className="p-5">
            <div className="flex items-center justify-between py-4 border-b border-border">
              <div>
                <p className="text-sm font-medium text-foreground">Imposto do mês</p>
                <p className="text-xs text-muted-foreground">Base: {formatBRL(baseCalculo)} × 10%</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-foreground">{formatBRL(summary.impostos)}</span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${mes <= "2026-02" ? "bg-emerald-500/15 text-emerald-500" : "bg-yellow-500/15 text-yellow-500"}`}>
                  {mes <= "2026-02" ? "Pago" : "Pendente"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Histórico */}
      {tab === "historico" && (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Mês</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Base de Cálculo</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Imposto (10%)</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {historico.map(h => (
                <tr key={h.mes} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="py-3 px-4 font-medium text-foreground">{h.label}</td>
                  <td className="py-3 px-4 text-right text-foreground">{formatBRL(h.baseCalculo)}</td>
                  <td className="py-3 px-4 text-right font-semibold text-foreground">{formatBRL(h.imposto)}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${h.statusPagamento === "Pago" ? "bg-emerald-500/15 text-emerald-500" : "bg-yellow-500/15 text-yellow-500"}`}>
                      {h.statusPagamento}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border bg-secondary/20">
                <td className="py-3 px-4 font-semibold text-foreground">Total</td>
                <td className="py-3 px-4 text-right font-bold text-foreground">{formatBRL(historico.reduce((s, h) => s + h.baseCalculo, 0))}</td>
                <td className="py-3 px-4 text-right font-bold text-foreground">{formatBRL(historico.reduce((s, h) => s + h.imposto, 0))}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
