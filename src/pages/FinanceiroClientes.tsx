import { useState } from "react";
import { clientes, franqueados, type Cliente } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Plus, Pencil } from "lucide-react";

const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type OrigemFilter = "todos" | "Venda Interna" | "Franqueado" | "Parceiro";
type TipoFilter = "todos" | "Recorrente" | "Unitária" | "Sistema";

export default function FinanceiroClientes() {
  const [origemFiltro, setOrigemFiltro] = useState<OrigemFilter>("todos");
  const [tipoFiltro, setTipoFiltro] = useState<TipoFilter>("todos");

  const filtered = clientes.filter(c => {
    if (origemFiltro !== "todos" && c.origem !== origemFiltro) return false;
    if (tipoFiltro !== "todos" && c.tipoReceita !== tipoFiltro) return false;
    return true;
  });

  const getFranqueadoNome = (id?: string) => {
    if (!id) return "—";
    return franqueados.find(f => f.id === id)?.nomeUnidade || "—";
  };

  const statusColor = (s: string) => {
    if (s === "Ativo") return "bg-kpi-positive/15 text-kpi-positive";
    if (s === "Pausado") return "bg-chart-orange/15 text-chart-orange";
    return "bg-kpi-negative/15 text-kpi-negative";
  };

  const origemColor = (o: string) => {
    if (o === "Venda Interna") return "bg-kpi-positive/15 text-kpi-positive";
    if (o === "Franqueado") return "bg-kpi-negative/15 text-kpi-negative";
    if (o === "Parceiro") return "bg-chart-orange/15 text-chart-orange";
    return "bg-secondary text-muted-foreground";
  };

  const totalReceita = filtered.reduce((s, c) => s + c.valor, 0);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1400px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Financeiro • Clientes</h1>
          <p className="text-sm text-muted-foreground mt-1">Organizados por tipo e origem</p>
        </div>
        <Button size="sm" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Adicionar Cliente
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div>
          <span className="text-xs text-muted-foreground block mb-1.5">Origem</span>
          <div className="flex gap-1">
            {(["todos", "Venda Interna", "Franqueado", "Parceiro"] as const).map(f => (
              <button key={f} onClick={() => setOrigemFiltro(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                  origemFiltro === f ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >{f}</button>
            ))}
          </div>
        </div>
        <div>
          <span className="text-xs text-muted-foreground block mb-1.5">Tipo de Receita</span>
          <div className="flex gap-1">
            {(["todos", "Recorrente", "Unitária", "Sistema"] as const).map(f => (
              <button key={f} onClick={() => setTipoFiltro(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  tipoFiltro === f ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >{f}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="flex gap-4 text-sm">
        <span className="text-muted-foreground">{filtered.length} clientes</span>
        <span className="text-foreground font-semibold">Total: {formatBRL(totalReceita)}/mês</span>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Cliente</th>
              <th className="text-right py-3 px-4 text-muted-foreground font-medium">Valor</th>
              <th className="text-center py-3 px-4 text-muted-foreground font-medium">Tipo</th>
              <th className="text-center py-3 px-4 text-muted-foreground font-medium">Origem</th>
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Produto</th>
              <th className="text-center py-3 px-4 text-muted-foreground font-medium">Repasse</th>
              <th className="text-center py-3 px-4 text-muted-foreground font-medium">%</th>
              <th className="text-center py-3 px-4 text-muted-foreground font-medium">Status</th>
              <th className="text-center py-3 px-4 text-muted-foreground font-medium">NF</th>
              <th className="text-center py-3 px-4 text-muted-foreground font-medium">Pago</th>
              <th className="text-center py-3 px-4 text-muted-foreground font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                <td className="py-3 px-4 text-foreground font-medium">{c.nome}</td>
                <td className="py-3 px-4 text-right text-foreground">{c.valor > 0 ? formatBRL(c.valor) : <span className="text-muted-foreground text-xs">A definir</span>}</td>
                <td className="py-3 px-4 text-center"><span className="text-xs font-medium px-2 py-0.5 rounded bg-secondary text-secondary-foreground">{c.tipoReceita}</span></td>
                <td className="py-3 px-4 text-center"><span className={`text-xs font-medium px-2 py-0.5 rounded ${origemColor(c.origem)}`}>{c.origem}</span></td>
                <td className="py-3 px-4 text-muted-foreground text-xs">{c.produto}</td>
                <td className="py-3 px-4 text-center">
                  {c.geraRepasse ? <span className="text-primary text-xs font-medium">Sim</span> : <span className="text-muted-foreground text-xs">Não</span>}
                </td>
                <td className="py-3 px-4 text-center text-muted-foreground text-xs">{c.geraRepasse ? `${c.percentualRepasse}%` : "—"}</td>
                <td className="py-3 px-4 text-center"><span className={`text-xs px-2 py-0.5 rounded ${statusColor(c.status)}`}>{c.status}</span></td>
                <td className="py-3 px-4 text-center">
                  <span className={`text-xs px-2 py-0.5 rounded ${c.notaFiscalEmitida ? "bg-kpi-positive/15 text-kpi-positive" : "bg-kpi-negative/15 text-kpi-negative"}`}>
                    {c.notaFiscalEmitida ? "Sim" : "Não"}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className={`text-xs px-2 py-0.5 rounded ${c.pago ? "bg-kpi-positive/15 text-kpi-positive" : "bg-kpi-negative/15 text-kpi-negative"}`}>
                    {c.pago ? "Sim" : "Não"}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <button className="p-1.5 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
