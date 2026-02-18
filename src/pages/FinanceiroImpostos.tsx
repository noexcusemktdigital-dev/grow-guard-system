import { useState } from "react";
import { getMonthSummary, getFolhaForMonth, getReceitasForMonth } from "@/data/mockData";
import { KpiCard } from "@/components/KpiCard";

const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function FinanceiroImpostos() {
  const [mes, setMes] = useState("2026-02");

  const summary = getMonthSummary(mes);
  const folha = getFolhaForMonth(mes);
  const receitas = getReceitasForMonth(mes);

  const receitasComNF = receitas.filter(r => r.notaFiscalEmitida);
  const receitasSemNF = receitas.filter(r => !r.notaFiscalEmitida);
  const faturamentoComNF = receitasComNF.reduce((s, r) => s + r.valorBruto, 0);
  const baseCalculo = faturamentoComNF + folha.operacional;

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
        <p className="text-xs text-muted-foreground">
          Só entra no imposto se a Nota Fiscal estiver emitida (NF = Sim).
        </p>
      </div>

      {/* Cálculo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Faturamento c/ NF" value={formatBRL(faturamentoComNF)} />
        <KpiCard label="Folha Operacional" value={formatBRL(folha.operacional)} sublabel="Exclui pró-labore" />
        <KpiCard label="Base de Cálculo" value={formatBRL(baseCalculo)} />
        <KpiCard label="Imposto (10%)" value={formatBRL(summary.impostos)} accent />
      </div>

      {/* Breakdown */}
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
                    <span className="text-xs px-2 py-0.5 rounded bg-kpi-negative/15 text-kpi-negative">Sem NF</span>
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
    </div>
  );
}
