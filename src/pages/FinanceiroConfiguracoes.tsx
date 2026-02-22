import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function FinanceiroConfiguracoes() {
  const { toast } = useToast();
  const [impostoPercent, setImpostoPercent] = useState(10);
  const [repasseFranqueado, setRepasseFranqueado] = useState(20);
  const [repasseParceiro, setRepasseParceiro] = useState(10);
  const [capacidade, setCapacidade] = useState(30);
  const [runwayMinimo, setRunwayMinimo] = useState(2);
  const [margemMinima, setMargemMinima] = useState(15);

  const handleSave = () => {
    toast({ title: "Configurações salvas com sucesso!" });
  };

  return (
    <div className="space-y-6 max-w-[900px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header-title">Configurações Financeiro</h1>
          <p className="text-sm text-muted-foreground mt-1">Motor do sistema — Regras e parâmetros</p>
        </div>
        <Button size="sm" className="gap-2" onClick={handleSave}><Save className="w-4 h-4" /> Salvar</Button>
      </div>

      <div className="glass-card p-6 space-y-4">
        <h3 className="font-semibold text-foreground">Regra de Imposto</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Percentual de imposto</label>
            <div className="flex items-center gap-2">
              <input type="number" value={impostoPercent} onChange={(e) => setImpostoPercent(Number(e.target.value))} className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-24 text-foreground" />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Base de cálculo</label>
            <p className="text-sm text-foreground">Faturamento com NF + Folha Operacional</p>
          </div>
        </div>
      </div>

      <div className="glass-card p-6 space-y-4">
        <h3 className="font-semibold text-foreground">Repasse</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">% Repasse Franqueado</label>
            <div className="flex items-center gap-2">
              <input type="number" value={repasseFranqueado} onChange={(e) => setRepasseFranqueado(Number(e.target.value))} className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-24 text-foreground" />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">% Repasse Parceiro</label>
            <div className="flex items-center gap-2">
              <input type="number" value={repasseParceiro} onChange={(e) => setRepasseParceiro(Number(e.target.value))} className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-24 text-foreground" />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card p-6 space-y-4">
        <h3 className="font-semibold text-foreground">Capacidade e Limiares</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Capacidade máxima clientes</label>
            <input type="number" value={capacidade} onChange={(e) => setCapacidade(Number(e.target.value))} className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-32 text-foreground" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Runway mínimo (meses)</label>
            <input type="number" value={runwayMinimo} onChange={(e) => setRunwayMinimo(Number(e.target.value))} className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-24 text-foreground" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Margem mínima (%)</label>
            <input type="number" value={margemMinima} onChange={(e) => setMargemMinima(Number(e.target.value))} className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-24 text-foreground" />
          </div>
        </div>
      </div>
    </div>
  );
}
