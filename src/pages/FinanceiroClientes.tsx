import { useState } from "react";
import { clientes, franqueados, type Cliente } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, DollarSign } from "lucide-react";

const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function FinanceiroClientes() {
  const [filtro, setFiltro] = useState<"todos" | "ativo" | "pausado" | "cancelado">("todos");

  const filtered = clientes.filter(c => filtro === "todos" || c.status.toLowerCase() === filtro);

  const getFranqueadoNome = (id?: string) => {
    if (!id) return "—";
    return franqueados.find(f => f.id === id)?.nomeUnidade || "—";
  };

  const statusColor = (s: string) => {
    if (s === "Ativo") return "bg-kpi-positive/15 text-kpi-positive";
    if (s === "Pausado") return "bg-chart-orange/15 text-chart-orange";
    return "bg-kpi-negative/15 text-kpi-negative";
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1400px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Financeiro • Clientes</h1>
          <p className="text-sm text-muted-foreground mt-1">Receita e vínculo com franqueados</p>
        </div>
        <Button size="sm" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Adicionar Cliente
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(["todos", "ativo", "pausado", "cancelado"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
              filtro === f ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Cliente</th>
              <th className="text-center py-3 px-4 text-muted-foreground font-medium">Status</th>
              <th className="text-right py-3 px-4 text-muted-foreground font-medium">Mensalidade</th>
              <th className="text-center py-3 px-4 text-muted-foreground font-medium">Franqueado?</th>
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Franqueado</th>
              <th className="text-center py-3 px-4 text-muted-foreground font-medium">% Repasse</th>
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Início</th>
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Observações</th>
              <th className="text-center py-3 px-4 text-muted-foreground font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                <td className="py-3 px-4 text-foreground font-medium">{c.nome}</td>
                <td className="py-3 px-4 text-center">
                  <span className={`text-xs px-2 py-0.5 rounded ${statusColor(c.status)}`}>{c.status}</span>
                </td>
                <td className="py-3 px-4 text-right text-foreground">{formatBRL(c.mensalidade)}</td>
                <td className="py-3 px-4 text-center">
                  {c.isFranqueado ? <span className="text-primary text-xs font-medium">Sim</span> : <span className="text-muted-foreground text-xs">Não</span>}
                </td>
                <td className="py-3 px-4 text-muted-foreground text-xs">{getFranqueadoNome(c.franqueadoVinculado)}</td>
                <td className="py-3 px-4 text-center text-muted-foreground">{c.isFranqueado ? `${c.percentualRepasse}%` : "—"}</td>
                <td className="py-3 px-4 text-muted-foreground text-xs">{new Date(c.inicio).toLocaleDateString("pt-BR")}</td>
                <td className="py-3 px-4 text-muted-foreground text-xs max-w-[150px] truncate">{c.observacoes || "—"}</td>
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button className="p-1.5 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                    <button className="p-1.5 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-primary"><DollarSign className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
