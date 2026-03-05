import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useOrgProfile } from "@/hooks/useOrgProfile";
import { Skeleton } from "@/components/ui/skeleton";

interface FinanceSettings {
  impostoPercent: number;
  repasseFranqueado: number;
  repasseParceiro: number;
  capacidade: number;
  runwayMinimo: number;
  margemMinima: number;
}

const DEFAULTS: FinanceSettings = {
  impostoPercent: 10,
  repasseFranqueado: 20,
  repasseParceiro: 10,
  capacidade: 30,
  runwayMinimo: 2,
  margemMinima: 15,
};

export default function FinanceiroConfiguracoes() {
  const { toast } = useToast();
  const { data: org, isLoading, update } = useOrgProfile();

  const [settings, setSettings] = useState<FinanceSettings>(DEFAULTS);

  useEffect(() => {
    if (org?.finance_settings && typeof org.finance_settings === "object") {
      const saved = org.finance_settings as Record<string, unknown>;
      setSettings({
        impostoPercent: (saved.impostoPercent as number) ?? DEFAULTS.impostoPercent,
        repasseFranqueado: (saved.repasseFranqueado as number) ?? DEFAULTS.repasseFranqueado,
        repasseParceiro: (saved.repasseParceiro as number) ?? DEFAULTS.repasseParceiro,
        capacidade: (saved.capacidade as number) ?? DEFAULTS.capacidade,
        runwayMinimo: (saved.runwayMinimo as number) ?? DEFAULTS.runwayMinimo,
        margemMinima: (saved.margemMinima as number) ?? DEFAULTS.margemMinima,
      });
    }
  }, [org]);

  const handleSave = () => {
    update.mutate(
      { finance_settings: settings } as any,
      {
        onSuccess: () => toast({ title: "Configurações salvas com sucesso!" }),
        onError: () => toast({ title: "Erro ao salvar configurações", variant: "destructive" }),
      }
    );
  };

  const set = (key: keyof FinanceSettings, value: number) =>
    setSettings(prev => ({ ...prev, [key]: value }));

  if (isLoading) return <div className="space-y-6"><Skeleton className="h-12 w-full" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header-title">Configurações Financeiro</h1>
          <p className="text-sm text-muted-foreground mt-1">Motor do sistema — Regras e parâmetros</p>
        </div>
        <Button size="sm" className="gap-2" onClick={handleSave} disabled={update.isPending}>
          {update.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar
        </Button>
      </div>

      <div className="glass-card p-6 space-y-4">
        <h3 className="font-semibold text-foreground">Regra de Imposto</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Percentual de imposto</label>
            <div className="flex items-center gap-2">
              <input type="number" value={settings.impostoPercent} onChange={(e) => set("impostoPercent", Number(e.target.value))} className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-24 text-foreground" />
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
              <input type="number" value={settings.repasseFranqueado} onChange={(e) => set("repasseFranqueado", Number(e.target.value))} className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-24 text-foreground" />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">% Repasse Parceiro</label>
            <div className="flex items-center gap-2">
              <input type="number" value={settings.repasseParceiro} onChange={(e) => set("repasseParceiro", Number(e.target.value))} className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-24 text-foreground" />
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
            <input type="number" value={settings.capacidade} onChange={(e) => set("capacidade", Number(e.target.value))} className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-32 text-foreground" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Runway mínimo (meses)</label>
            <input type="number" value={settings.runwayMinimo} onChange={(e) => set("runwayMinimo", Number(e.target.value))} className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-24 text-foreground" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Margem mínima (%)</label>
            <input type="number" value={settings.margemMinima} onChange={(e) => set("margemMinima", Number(e.target.value))} className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-24 text-foreground" />
          </div>
        </div>
      </div>
    </div>
  );
}
