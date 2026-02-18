import { useState } from "react";
import { getReceitasForMonth, franqueados, getMonthSummary } from "@/data/mockData";
import { KpiCard } from "@/components/KpiCard";

const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function FinanceiroRepasse() {
  const [mes, setMes] = useState("2026-02");

  const receitas = getReceitasForMonth(mes);
  const summary = getMonthSummary(mes);
  const comRepasse = receitas.filter(r => r.aplicaRepasse);

  // Group by origin
  const porOrigem: Record<string, typeof comRepasse> = {};
  comRepasse.forEach(r => {
    const key = r.origemRepasse || "Outro";
    if (!porOrigem[key]) porOrigem[key] = [];
    porOrigem[key].push(r);
  });

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1400px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Financeiro • Repasse</h1>
          <p className="text-sm text-muted-foreground mt-1">Franqueados e Parceiros</p>
        </div>
        <select value={mes} onChange={(e) => setMes(e.target.value)} className="bg-secondary text-foreground border border-border rounded-lg px-3 py-2 text-sm">
          <option value="2026-01">Jan/2026</option>
          <option value="2026-02">Fev/2026</option>
          <option value="2026-03">Mar/2026</option>
        </select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard label="Total Repasse" value={formatBRL(summary.totalRepasse)} accent />
        <KpiCard label="Clientes com Repasse" value={String(comRepasse.length)} />
        <KpiCard label="Receita Bruta c/ Repasse" value={formatBRL(comRepasse.reduce((s, r) => s + r.valorBruto, 0))} />
      </div>

      {/* Regra */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-2">Regra de Repasse</h3>
        <p className="text-sm text-muted-foreground">
          O repasse é aplicado automaticamente quando o cliente tem origem <strong>Franqueado</strong> (20%) ou <strong>Parceiro</strong> (10%), 
          ou quando marcado manualmente como "gera repasse". O cálculo é: <code className="bg-secondary px-1.5 py-0.5 rounded text-xs">Valor × % repasse</code>.
        </p>
      </div>

      {/* By origin */}
      {Object.entries(porOrigem).map(([origem, items]) => (
        <div key={origem} className="glass-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-secondary/20">
            <h3 className="text-sm font-semibold text-foreground">Origem: {origem}</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Cliente</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Valor Bruto</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">%</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Repasse</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Líquido</th>
              </tr>
            </thead>
            <tbody>
              {items.map(r => (
                <tr key={r.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="py-3 px-4 text-foreground">{r.clienteNome}</td>
                  <td className="py-3 px-4 text-right text-foreground">{formatBRL(r.valorBruto)}</td>
                  <td className="py-3 px-4 text-center text-muted-foreground">{r.percentualRepasse}%</td>
                  <td className="py-3 px-4 text-right font-medium text-primary">{formatBRL(r.valorRepasse)}</td>
                  <td className="py-3 px-4 text-right text-foreground">{formatBRL(r.valorLiquido)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border bg-secondary/20">
                <td className="py-3 px-4 font-semibold text-foreground">Subtotal</td>
                <td className="py-3 px-4 text-right font-bold text-foreground">{formatBRL(items.reduce((s, r) => s + r.valorBruto, 0))}</td>
                <td />
                <td className="py-3 px-4 text-right font-bold text-primary">{formatBRL(items.reduce((s, r) => s + r.valorRepasse, 0))}</td>
                <td className="py-3 px-4 text-right font-bold text-foreground">{formatBRL(items.reduce((s, r) => s + r.valorLiquido, 0))}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      ))}

      {comRepasse.length === 0 && (
        <div className="glass-card p-8 text-center text-muted-foreground">Nenhum cliente com repasse neste mês.</div>
      )}
    </div>
  );
}
