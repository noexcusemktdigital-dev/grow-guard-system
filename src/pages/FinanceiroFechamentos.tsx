import { useState } from "react";
import { franqueados, getDREFranqueado, type DREFranqueado } from "@/data/mockData";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Download, Eye, ArrowLeft, FolderOpen } from "lucide-react";
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

  const lines: { label: string; value: number; type: "header" | "deduction" | "subtotal" | "result" }[] = [
    { label: "Receita Bruta (100%)", value: dre.receitaBruta, type: "header" },
    { label: "(-) Retenção Franqueadora (80%)", value: dre.retencaoFranqueadora, type: "deduction" },
    { label: "= Repasse Franqueado (20%)", value: dre.repasseFranqueado, type: "subtotal" },
    { label: "(-) Royalties (1%)", value: dre.royalties, type: "deduction" },
    { label: "(-) Imposto proporcional", value: dre.impostoProporcional, type: "deduction" },
    { label: "(-) Sistema (R$250)", value: dre.sistema, type: "deduction" },
    { label: "= Resultado Líquido do Franqueado", value: dre.resultadoLiquido, type: "result" },
  ];

  return (
    <div className="bg-background border border-border rounded-lg overflow-hidden">
      {/* Header planilha */}
      <div className="bg-secondary/50 px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Skillzy</p>
              <h3 className="text-lg font-bold text-foreground">DRE — {dre.franqueadoNome}</h3>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Competência</p>
            <p className="text-sm font-semibold text-foreground">{mesLabel}</p>
          </div>
        </div>
      </div>

      {/* Clientes */}
      {dre.clientesAtivos.length > 0 && (
        <div className="px-6 py-4 border-b border-border">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Clientes Ativos ({dre.clientesAtivos.length})
          </h4>
          <div className="space-y-0">
            {dre.clientesAtivos.map((c, i) => (
              <div key={i} className={`flex justify-between py-2 px-3 text-sm ${i % 2 === 0 ? "bg-secondary/30" : ""}`}>
                <span className="text-foreground">{c.nome}</span>
                <span className="font-medium text-foreground">{formatBRL(c.valor)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DRE Lines - estilo planilha */}
      <div className="px-6 py-4">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Demonstrativo
        </h4>
        <div className="border border-border rounded-lg overflow-hidden">
          {lines.map((line, i) => {
            const isEven = i % 2 === 0;
            const bgClass = line.type === "result"
              ? "bg-secondary/60"
              : line.type === "subtotal"
                ? "bg-secondary/40"
                : isEven ? "bg-secondary/20" : "";

            const textClass = line.type === "result"
              ? `text-base font-bold ${dre.resultadoLiquido >= 0 ? "text-emerald-500" : "text-red-500"}`
              : line.type === "subtotal"
                ? "text-sm font-bold text-primary"
                : line.type === "header"
                  ? "text-sm font-semibold text-foreground"
                  : "text-sm text-muted-foreground";

            const valueClass = line.type === "result"
              ? `text-base font-bold ${dre.resultadoLiquido >= 0 ? "text-emerald-500" : "text-red-500"}`
              : line.type === "subtotal"
                ? "text-sm font-bold text-primary"
                : line.type === "deduction"
                  ? "text-sm text-red-500"
                  : "text-sm font-bold text-foreground";

            return (
              <div key={i} className={`flex justify-between items-center py-3 px-4 border-b border-border last:border-0 ${bgClass}`}>
                <span className={textClass}>{line.label}</span>
                <span className={valueClass}>
                  {line.type === "deduction" ? `-${formatBRL(line.value)}` : formatBRL(line.value)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TodosFechamentosTab() {
  const [selectedDRE, setSelectedDRE] = useState<DREFranqueado | null>(null);
  const { toast } = useToast();

  const allDREs: (DREFranqueado & { mesLabel: string })[] = [];
  mesesDisponiveis.forEach(m => {
    franqueados.forEach(f => {
      const dre = getDREFranqueado(f.id, m.value);
      if (dre) allDREs.push({ ...dre, mesLabel: m.label });
    });
  });

  const handleExport = (tipo: string) => {
    toast({ title: "Em breve", description: `Exportação ${tipo} será implementada em fase futura.` });
  };

  if (selectedDRE) {
    const mesLabel = mesesDisponiveis.find(m => m.value === selectedDRE.mes)?.label || selectedDRE.mes;
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setSelectedDRE(null)} className="gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Voltar ao histórico
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleExport("Excel")} className="gap-2">
              <FileSpreadsheet className="w-4 h-4" /> Excel
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport("PDF")} className="gap-2">
              <Download className="w-4 h-4" /> PDF
            </Button>
          </div>
        </div>
        <DRECard dre={selectedDRE} />
      </div>
    );
  }

  // Agrupar por mês para visual de "drive"
  const mesesComDREs = mesesDisponiveis.map(m => ({
    ...m,
    dres: allDREs.filter(d => d.mes === m.value),
  })).filter(m => m.dres.length > 0);

  return (
    <div className="space-y-6">
      {mesesComDREs.map(mesGroup => (
        <div key={mesGroup.value} className="glass-card overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-3 bg-secondary/40 border-b border-border">
            <FolderOpen className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">{mesGroup.label}</h3>
            <span className="text-xs text-muted-foreground">({mesGroup.dres.length} fechamento{mesGroup.dres.length > 1 ? "s" : ""})</span>
          </div>
          <div className="divide-y divide-border/50">
            {mesGroup.dres.map((d, i) => {
              const deducoes = d.royalties + d.impostoProporcional + d.sistema;
              return (
                <div key={i}
                  onClick={() => setSelectedDRE(d)}
                  className="flex items-center justify-between px-5 py-3 hover:bg-secondary/30 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{d.franqueadoNome}</p>
                      <p className="text-xs text-muted-foreground">
                        Receita {formatBRL(d.receitaBruta)} • Repasse {formatBRL(d.repasseFranqueado)} • Deduções -{formatBRL(deducoes)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Resultado</p>
                      <p className={`text-sm font-bold ${d.resultadoLiquido >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                        {formatBRL(d.resultadoLiquido)}
                      </p>
                    </div>
                    <Eye className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
