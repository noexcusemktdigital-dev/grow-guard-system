import { useState } from "react";
import { franqueados, getDREFranqueado, type DREFranqueado } from "@/data/mockData";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const mesesDisponiveis = [
  { value: "2026-01", label: "Jan/2026" },
  { value: "2026-02", label: "Fev/2026" },
  { value: "2026-03", label: "Mar/2026" },
  { value: "2026-04", label: "Abr/2026" },
];

export default function FinanceiroFechamentos() {
  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1400px]">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Financeiro • Fechamentos (DRE)</h1>
        <p className="text-sm text-muted-foreground mt-1">Demonstrativo de Resultado por franqueado</p>
      </div>

      <Tabs defaultValue="por-franqueado" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="por-franqueado">Por Franqueado</TabsTrigger>
          <TabsTrigger value="todos">Todos os Fechamentos</TabsTrigger>
        </TabsList>

        <TabsContent value="por-franqueado">
          <PorFranqueadoTab />
        </TabsContent>
        <TabsContent value="todos">
          <TodosFechamentosTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PorFranqueadoTab() {
  const [franqueadoId, setFranqueadoId] = useState(franqueados[0]?.id || "");
  const [mes, setMes] = useState("2026-02");
  const { toast } = useToast();

  const dre = franqueadoId ? getDREFranqueado(franqueadoId, mes) : null;

  const handleExport = (tipo: string) => {
    toast({ title: "Em breve", description: `Exportação ${tipo} será implementada em fase futura.` });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Franqueado</label>
          <select value={franqueadoId} onChange={e => setFranqueadoId(e.target.value)}
            className="bg-secondary text-foreground border border-border rounded-lg px-3 py-2 text-sm">
            {franqueados.map(f => <option key={f.id} value={f.id}>{f.nomeUnidade}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Mês</label>
          <select value={mes} onChange={e => setMes(e.target.value)}
            className="bg-secondary text-foreground border border-border rounded-lg px-3 py-2 text-sm">
            {mesesDisponiveis.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        <div className="flex items-end gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport("Excel")} className="gap-2">
            <FileSpreadsheet className="w-4 h-4" /> Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport("PDF")} className="gap-2">
            <Download className="w-4 h-4" /> PDF
          </Button>
        </div>
      </div>

      {dre && <DRECard dre={dre} />}
      {!dre && <p className="text-sm text-muted-foreground">Nenhum dado encontrado para esse franqueado/mês.</p>}
    </div>
  );
}

function DRECard({ dre }: { dre: DREFranqueado }) {
  const mesLabel = mesesDisponiveis.find(m => m.value === dre.mes)?.label || dre.mes;

  return (
    <div className="glass-card p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded bg-primary/15 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4 text-primary" />
            </div>
            <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Skillzy</span>
          </div>
          <h3 className="text-lg font-bold text-foreground">DRE — {dre.franqueadoNome}</h3>
          <p className="text-sm text-muted-foreground">Competência: {mesLabel}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Resultado Líquido</p>
          <p className={`text-2xl font-bold ${dre.resultadoLiquido >= 0 ? "text-emerald-500" : "text-red-500"}`}>
            {formatBRL(dre.resultadoLiquido)}
          </p>
        </div>
      </div>

      {/* Clientes */}
      {dre.clientesAtivos.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3">Clientes Ativos ({dre.clientesAtivos.length})</h4>
          <div className="space-y-1">
            {dre.clientesAtivos.map((c, i) => (
              <div key={i} className="flex justify-between py-1.5 border-b border-border/30 last:border-0">
                <span className="text-sm text-foreground">{c.nome}</span>
                <span className="text-sm font-medium text-foreground">{formatBRL(c.valor)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DRE Lines */}
      <div className="space-y-2">
        <div className="flex justify-between py-2 border-b border-border">
          <span className="text-sm font-semibold text-foreground">Receita Bruta</span>
          <span className="text-sm font-bold text-foreground">{formatBRL(dre.receitaBruta)}</span>
        </div>
        <div className="flex justify-between py-1.5 pl-4">
          <span className="text-sm text-muted-foreground">(-) Royalties (1%)</span>
          <span className="text-sm text-red-500">-{formatBRL(dre.royalties)}</span>
        </div>
        <div className="flex justify-between py-1.5 pl-4">
          <span className="text-sm text-muted-foreground">(-) Imposto proporcional</span>
          <span className="text-sm text-red-500">-{formatBRL(dre.impostoProporcional)}</span>
        </div>
        <div className="flex justify-between py-1.5 pl-4">
          <span className="text-sm text-muted-foreground">(-) Sistema (R$250)</span>
          <span className="text-sm text-red-500">-{formatBRL(dre.sistema)}</span>
        </div>
        {dre.repasseMatriz > 0 && (
          <div className="flex justify-between py-1.5 pl-4">
            <span className="text-sm text-muted-foreground">(-) Repasse matriz</span>
            <span className="text-sm text-red-500">-{formatBRL(dre.repasseMatriz)}</span>
          </div>
        )}
        <div className="flex justify-between py-2 border-t border-border mt-2">
          <span className="text-sm font-bold text-foreground">= Resultado Líquido</span>
          <span className={`text-sm font-bold ${dre.resultadoLiquido >= 0 ? "text-emerald-500" : "text-red-500"}`}>
            {formatBRL(dre.resultadoLiquido)}
          </span>
        </div>
      </div>
    </div>
  );
}

function TodosFechamentosTab() {
  const allDREs: (DREFranqueado & { mesLabel: string })[] = [];
  mesesDisponiveis.forEach(m => {
    franqueados.forEach(f => {
      const dre = getDREFranqueado(f.id, m.value);
      if (dre) allDREs.push({ ...dre, mesLabel: m.label });
    });
  });

  return (
    <div className="glass-card overflow-hidden overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 text-muted-foreground font-medium">Mês</th>
            <th className="text-left py-3 px-4 text-muted-foreground font-medium">Franqueado</th>
            <th className="text-right py-3 px-4 text-muted-foreground font-medium">Receita Bruta</th>
            <th className="text-right py-3 px-4 text-muted-foreground font-medium">Deduções</th>
            <th className="text-right py-3 px-4 text-muted-foreground font-medium">Resultado</th>
          </tr>
        </thead>
        <tbody>
          {allDREs.map((d, i) => {
            const deducoes = d.royalties + d.impostoProporcional + d.sistema + d.repasseMatriz;
            return (
              <tr key={i} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                <td className="py-3 px-4 text-foreground">{d.mesLabel}</td>
                <td className="py-3 px-4 font-medium text-foreground">{d.franqueadoNome}</td>
                <td className="py-3 px-4 text-right text-foreground">{formatBRL(d.receitaBruta)}</td>
                <td className="py-3 px-4 text-right text-red-500">-{formatBRL(deducoes)}</td>
                <td className={`py-3 px-4 text-right font-bold ${d.resultadoLiquido >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                  {formatBRL(d.resultadoLiquido)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
