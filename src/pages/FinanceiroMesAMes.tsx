import { useState } from "react";
import { getMonthSummary, getReceitasForMonth, getDespesasForMonth, getFolhaForMonth } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const mesesDisponiveis = [
  { value: "2026-01", label: "Jan/2026" },
  { value: "2026-02", label: "Fev/2026" },
  { value: "2026-03", label: "Mar/2026" },
  { value: "2026-04", label: "Abr/2026" },
];

type SubTab = "resumo" | "receitas" | "despesas" | "impostos" | "repasse";

export default function FinanceiroMesAMes() {
  const [mes, setMes] = useState("2026-02");
  const [subTab, setSubTab] = useState<SubTab>("resumo");

  const summary = getMonthSummary(mes);
  const receitas = getReceitasForMonth(mes);
  const despesas = getDespesasForMonth(mes);
  const folha = getFolhaForMonth(mes);

  const receitasFranqueado = receitas.filter(r => r.aplicaRepasse);

  const tabs: { key: SubTab; label: string }[] = [
    { key: "resumo", label: "Resumo" },
    { key: "receitas", label: "Receitas" },
    { key: "despesas", label: "Despesas" },
    { key: "impostos", label: "Impostos & Regra" },
    { key: "repasse", label: "Repasse Franqueados" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Financeiro • Mês a Mês</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestão mensal detalhada</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            className="bg-secondary text-foreground border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {mesesDisponiveis.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <Button variant="outline" size="sm" className="gap-2 border-border text-foreground hover:bg-secondary">
            <Lock className="w-3.5 h-3.5" />
            Fechar Mês
          </Button>
        </div>
      </div>

      {/* Sub tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setSubTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-[1px] ${
              subTab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="animate-fade-in">
        {subTab === "resumo" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="kpi-card"><span className="text-xs text-muted-foreground">Receita Bruta</span><span className="text-xl font-bold text-foreground">{formatBRL(summary.receitaBruta)}</span></div>
              <div className="kpi-card"><span className="text-xs text-muted-foreground">(-) Repasse</span><span className="text-xl font-bold text-kpi-negative">{formatBRL(summary.totalRepasse)}</span></div>
              <div className="kpi-card"><span className="text-xs text-muted-foreground">Receita Líquida</span><span className="text-xl font-bold text-foreground">{formatBRL(summary.receitaLiquida)}</span></div>
              <div className="kpi-card"><span className="text-xs text-muted-foreground">Resultado</span><span className={`text-xl font-bold ${summary.resultado >= 0 ? "text-kpi-positive" : "text-kpi-negative"}`}>{formatBRL(summary.resultado)}</span></div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="kpi-card"><span className="text-xs text-muted-foreground">Folha Total</span><span className="text-lg font-bold text-foreground">{formatBRL(folha.total)}</span><span className="text-xs text-muted-foreground">Op: {formatBRL(folha.operacional)} | PL: {formatBRL(folha.proLabore)}</span></div>
              <div className="kpi-card"><span className="text-xs text-muted-foreground">Impostos (10%)</span><span className="text-lg font-bold text-foreground">{formatBRL(summary.impostos)}</span></div>
              <div className="kpi-card"><span className="text-xs text-muted-foreground">Custos Totais</span><span className="text-lg font-bold text-foreground">{formatBRL(summary.custosTotal)}</span></div>
            </div>
          </div>
        )}

        {subTab === "receitas" && (
          <div className="glass-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Cliente</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Tipo</th>
                  <th className="text-right py-3 px-4 text-muted-foreground font-medium">Valor Bruto</th>
                  <th className="text-center py-3 px-4 text-muted-foreground font-medium">Repasse?</th>
                  <th className="text-right py-3 px-4 text-muted-foreground font-medium">Repasse</th>
                  <th className="text-right py-3 px-4 text-muted-foreground font-medium">Líquido</th>
                </tr>
              </thead>
              <tbody>
                {receitas.map(r => (
                  <tr key={r.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="py-3 px-4 text-foreground">{r.clienteNome}</td>
                    <td className="py-3 px-4 text-muted-foreground">{r.tipo}</td>
                    <td className="py-3 px-4 text-right text-foreground">{formatBRL(r.valorBruto)}</td>
                    <td className="py-3 px-4 text-center">{r.aplicaRepasse ? <span className="text-primary text-xs font-medium">Sim</span> : <span className="text-muted-foreground text-xs">Não</span>}</td>
                    <td className="py-3 px-4 text-right text-kpi-negative">{r.valorRepasse > 0 ? formatBRL(r.valorRepasse) : "—"}</td>
                    <td className="py-3 px-4 text-right font-medium text-foreground">{formatBRL(r.valorLiquido)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border bg-secondary/20">
                  <td colSpan={2} className="py-3 px-4 font-semibold text-foreground">Total</td>
                  <td className="py-3 px-4 text-right font-bold text-foreground">{formatBRL(summary.receitaBruta)}</td>
                  <td />
                  <td className="py-3 px-4 text-right font-bold text-kpi-negative">{formatBRL(summary.totalRepasse)}</td>
                  <td className="py-3 px-4 text-right font-bold text-foreground">{formatBRL(summary.receitaLiquida)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {subTab === "despesas" && (
          <div className="glass-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Categoria</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Subcategoria</th>
                  <th className="text-right py-3 px-4 text-muted-foreground font-medium">Valor</th>
                  <th className="text-center py-3 px-4 text-muted-foreground font-medium">Recorrente</th>
                  <th className="text-center py-3 px-4 text-muted-foreground font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {despesas.map(d => (
                  <tr key={d.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="py-3 px-4"><span className="text-xs font-medium px-2 py-0.5 rounded bg-secondary text-secondary-foreground">{d.categoria}</span></td>
                    <td className="py-3 px-4 text-foreground">{d.subcategoria}</td>
                    <td className="py-3 px-4 text-right text-foreground">{formatBRL(d.valor)}</td>
                    <td className="py-3 px-4 text-center text-muted-foreground text-xs">{d.recorrente ? "Sim" : "Não"}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded ${d.status === "Pago" ? "bg-kpi-positive/15 text-kpi-positive" : "bg-chart-orange/15 text-chart-orange"}`}>
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border bg-secondary/20">
                  <td colSpan={2} className="py-3 px-4 font-semibold text-foreground">Total Despesas</td>
                  <td className="py-3 px-4 text-right font-bold text-foreground">{formatBRL(summary.custosDespesas)}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {subTab === "impostos" && (
          <div className="space-y-4">
            <div className="glass-card p-6 space-y-4">
              <h3 className="font-semibold text-foreground">Regra de Imposto Atual</h3>
              <p className="text-sm text-muted-foreground">10% sobre (Faturamento Bruto + Folha Operacional), excluindo Pró-labore.</p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                <div><span className="text-xs text-muted-foreground block">Faturamento Bruto</span><span className="text-lg font-bold text-foreground">{formatBRL(summary.receitaBruta)}</span></div>
                <div><span className="text-xs text-muted-foreground block">Folha Operacional</span><span className="text-lg font-bold text-foreground">{formatBRL(folha.operacional)}</span></div>
                <div><span className="text-xs text-muted-foreground block">Base de Cálculo</span><span className="text-lg font-bold text-foreground">{formatBRL(summary.receitaBruta + folha.operacional)}</span></div>
                <div><span className="text-xs text-muted-foreground block">Imposto (10%)</span><span className="text-lg font-bold text-primary">{formatBRL(summary.impostos)}</span></div>
              </div>
            </div>
          </div>
        )}

        {subTab === "repasse" && (
          <div className="space-y-4">
            <div className="glass-card p-6">
              <h3 className="font-semibold text-foreground mb-4">Repasse por Cliente Franqueado — {mesesDisponiveis.find(m => m.value === mes)?.label}</h3>
              {receitasFranqueado.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum cliente de franqueado neste mês.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium">Cliente</th>
                      <th className="text-right py-2 px-3 text-muted-foreground font-medium">Valor Bruto</th>
                      <th className="text-center py-2 px-3 text-muted-foreground font-medium">%</th>
                      <th className="text-right py-2 px-3 text-muted-foreground font-medium">Repasse</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receitasFranqueado.map(r => (
                      <tr key={r.id} className="border-b border-border/50">
                        <td className="py-2 px-3 text-foreground">{r.clienteNome}</td>
                        <td className="py-2 px-3 text-right text-foreground">{formatBRL(r.valorBruto)}</td>
                        <td className="py-2 px-3 text-center text-muted-foreground">{r.percentualRepasse}%</td>
                        <td className="py-2 px-3 text-right font-medium text-primary">{formatBRL(r.valorRepasse)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-border"><td colSpan={3} className="py-2 px-3 font-semibold text-foreground">Total Repasse</td><td className="py-2 px-3 text-right font-bold text-primary">{formatBRL(summary.totalRepasse)}</td></tr>
                  </tfoot>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
