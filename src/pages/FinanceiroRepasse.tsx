import { useState } from "react";
import { getReceitasForMonth, franqueados, getMonthSummary, clientes } from "@/data/mockData";
import { KpiCard } from "@/components/KpiCard";
import { Pencil, Check } from "lucide-react";

const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type Tab = "franqueado" | "pendentes" | "pagos" | "historico";
const statusOptions = ["Pendente", "Aprovado", "Pago", "Contestação"] as const;

export default function FinanceiroRepasse() {
  const [mes, setMes] = useState("2026-02");
  const [tab, setTab] = useState<Tab>("franqueado");
  const [editedStatus, setEditedStatus] = useState<Map<string, string>>(new Map());

  const receitas = getReceitasForMonth(mes);
  const summary = getMonthSummary(mes);
  const comRepasse = receitas.filter(r => r.aplicaRepasse);

  // Por Franqueado
  const porFranqueado: Record<string, typeof comRepasse> = {};
  comRepasse.forEach(r => {
    const fId = r.franqueadoId || "parceiros";
    if (!porFranqueado[fId]) porFranqueado[fId] = [];
    porFranqueado[fId].push(r);
  });

  const getFranqueadoName = (id: string) => {
    if (id === "parceiros") return "Parceiros";
    return franqueados.find(f => f.id === id)?.nomeUnidade || id;
  };

  const getRepasseStatus = (r: typeof comRepasse[0]) => {
    if (editedStatus.has(r.id)) return editedStatus.get(r.id)!;
    const cliente = clientes.find(c => c.id === r.clienteId);
    return cliente?.pago ? "Pago" : "Pendente";
  };

  const pendentes = comRepasse.filter(r => getRepasseStatus(r) === "Pendente");
  const pagos = comRepasse.filter(r => getRepasseStatus(r) === "Pago");

  const handleStatusChange = (id: string, status: string) => {
    setEditedStatus(prev => new Map(prev).set(id, status));
  };

  const handleAprovar = (id: string) => handleStatusChange(id, "Aprovado");
  const handlePagar = (id: string) => handleStatusChange(id, "Pago");

  // Histórico
  const mesesList = ["2026-01", "2026-02", "2026-03"];
  const historico = mesesList.map(m => {
    const recs = getReceitasForMonth(m).filter(r => r.aplicaRepasse);
    return {
      mes: m,
      label: m === "2026-01" ? "Jan/26" : m === "2026-02" ? "Fev/26" : "Mar/26",
      total: recs.reduce((s, r) => s + r.valorRepasse, 0),
      count: recs.length,
    };
  });

  const tabs: { key: Tab; label: string }[] = [
    { key: "franqueado", label: "Por Franqueado" },
    { key: "pendentes", label: `Pendentes (${pendentes.length})` },
    { key: "pagos", label: `Pagos (${pagos.length})` },
    { key: "historico", label: "Histórico" },
  ];

  const statusColor = (s: string) => {
    if (s === "Pago") return "bg-emerald-500/15 text-emerald-500";
    if (s === "Aprovado") return "bg-blue-500/15 text-blue-500";
    if (s === "Contestação") return "bg-red-500/15 text-red-500";
    return "bg-yellow-500/15 text-yellow-500";
  };

  const renderTable = (items: typeof comRepasse, showActions = true) => (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border">
          <th className="text-left py-3 px-4 text-muted-foreground font-medium">Cliente</th>
          <th className="text-left py-3 px-4 text-muted-foreground font-medium">Origem</th>
          <th className="text-right py-3 px-4 text-muted-foreground font-medium">Valor Bruto</th>
          <th className="text-center py-3 px-4 text-muted-foreground font-medium">%</th>
          <th className="text-right py-3 px-4 text-muted-foreground font-medium">Repasse</th>
          <th className="text-center py-3 px-4 text-muted-foreground font-medium">Status</th>
          {showActions && <th className="text-center py-3 px-4 text-muted-foreground font-medium">Ações</th>}
        </tr>
      </thead>
      <tbody>
        {items.map(r => {
          const status = getRepasseStatus(r);
          return (
            <tr key={r.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
              <td className="py-3 px-4 text-foreground">{r.clienteNome}</td>
              <td className="py-3 px-4 text-muted-foreground">{r.origemRepasse}</td>
              <td className="py-3 px-4 text-right text-foreground">{formatBRL(r.valorBruto)}</td>
              <td className="py-3 px-4 text-center text-muted-foreground">{r.percentualRepasse}%</td>
              <td className="py-3 px-4 text-right font-medium text-primary">{formatBRL(r.valorRepasse)}</td>
              <td className="py-3 px-4 text-center">
                <select value={status} onChange={e => handleStatusChange(r.id, e.target.value)}
                  className={`text-xs px-2 py-0.5 rounded border-0 cursor-pointer ${statusColor(status)}`}>
                  {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </td>
              {showActions && (
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    {status === "Pendente" && (
                      <button onClick={() => handleAprovar(r.id)} title="Aprovar" className="p-1.5 rounded hover:bg-blue-500/10 text-muted-foreground hover:text-blue-500 transition-colors">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {status === "Aprovado" && (
                      <button onClick={() => handlePagar(r.id)} title="Marcar pago" className="p-1.5 rounded hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-500 transition-colors">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
      {items.length > 0 && (
        <tfoot>
          <tr className="border-t border-border bg-secondary/20">
            <td colSpan={2} className="py-3 px-4 font-semibold text-foreground">Total</td>
            <td className="py-3 px-4 text-right font-bold text-foreground">{formatBRL(items.reduce((s, r) => s + r.valorBruto, 0))}</td>
            <td />
            <td className="py-3 px-4 text-right font-bold text-primary">{formatBRL(items.reduce((s, r) => s + r.valorRepasse, 0))}</td>
            <td colSpan={showActions ? 2 : 1} />
          </tr>
        </tfoot>
      )}
    </table>
  );

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-header-title">Repasse</h1>
          <p className="text-sm text-muted-foreground mt-1">Logbook CRUD — Franqueados e Parceiros</p>
        </div>
        <select value={mes} onChange={(e) => setMes(e.target.value)} className="bg-secondary text-foreground border border-border rounded-xl px-3 py-2 text-sm">
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
          Repasse automático: <strong>Franqueado</strong> (20%) e <strong>Parceiro</strong> (10%), editável por lançamento.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary/50 p-1 rounded-lg w-fit">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${tab === t.key ? "bg-background text-foreground font-medium shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "franqueado" && (
        <>
          {Object.entries(porFranqueado).map(([fId, items]) => (
            <div key={fId} className="glass-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-secondary/20">
                <h3 className="text-sm font-semibold text-foreground">{getFranqueadoName(fId)}</h3>
              </div>
              {renderTable(items)}
            </div>
          ))}
          {comRepasse.length === 0 && (
            <div className="glass-card p-8 text-center text-muted-foreground">Nenhum cliente com repasse neste mês.</div>
          )}
        </>
      )}

      {tab === "pendentes" && (
        <div className="glass-card overflow-hidden">
          {pendentes.length === 0 ? (
            <p className="p-8 text-center text-muted-foreground">Nenhum repasse pendente ✓</p>
          ) : renderTable(pendentes)}
        </div>
      )}

      {tab === "pagos" && (
        <div className="glass-card overflow-hidden">
          {pagos.length === 0 ? (
            <p className="p-8 text-center text-muted-foreground">Nenhum repasse pago neste mês.</p>
          ) : renderTable(pagos, false)}
        </div>
      )}

      {tab === "historico" && (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Mês</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Clientes</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Total Repasse</th>
              </tr>
            </thead>
            <tbody>
              {historico.map(h => (
                <tr key={h.mes} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="py-3 px-4 font-medium text-foreground">{h.label}</td>
                  <td className="py-3 px-4 text-center text-foreground">{h.count}</td>
                  <td className="py-3 px-4 text-right font-semibold text-primary">{formatBRL(h.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
