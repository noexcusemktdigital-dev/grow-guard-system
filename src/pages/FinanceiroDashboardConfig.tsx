import { useState, useMemo } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

interface FinanceSettings {
  impostoPercent: number;
  repasseFranqueado: number;
  repasseParceiro: number;
  capacidade: number;
  runwayMinimo: number;
  margemMinima: number;
}

const DEFAULTS: FinanceSettings = { impostoPercent: 10, repasseFranqueado: 20, repasseParceiro: 10, capacidade: 30, runwayMinimo: 2, margemMinima: 15 };

export interface ConfigTabProps {
  org: Record<string, unknown> | undefined;
  loadingOrg: boolean;
  updateOrg: { mutate: (data: Record<string, unknown>, opts?: Record<string, unknown>) => void; mutateAsync: (data: Record<string, unknown>) => Promise<unknown>; isPending: boolean };
  toast: (opts: { title: string; variant?: string }) => void;
}

export function ConfigTab({ org, loadingOrg, updateOrg, toast }: ConfigTabProps) {
  const [settings, setSettings] = useState<FinanceSettings>(DEFAULTS);

  useMemo(() => {
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
    updateOrg.mutate(
      { finance_settings: settings } as Record<string, unknown>,
      {
        onSuccess: () => toast({ title: "Configurações salvas com sucesso!" }),
        onError: () => toast({ title: "Erro ao salvar configurações", variant: "destructive" }),
      }
    );
  };

  const set = (key: keyof FinanceSettings, value: number) => setSettings(prev => ({ ...prev, [key]: value }));

  if (loadingOrg) return <Skeleton className="h-64 w-full" />;

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Motor do sistema — Regras e parâmetros financeiros</p>
        <Button size="sm" className="gap-2" onClick={handleSave} disabled={updateOrg.isPending}>
          {updateOrg.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar
        </Button>
      </div>

      <div className="glass-card p-6 space-y-4">
        <h3 className="font-semibold text-foreground">Regra de Imposto</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Percentual de imposto</label>
            <div className="flex items-center gap-2">
              <Input type="number" value={settings.impostoPercent} onChange={(e) => set("impostoPercent", Number(e.target.value))} className="w-24" />
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
              <Input type="number" value={settings.repasseFranqueado} onChange={(e) => set("repasseFranqueado", Number(e.target.value))} className="w-24" />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">% Repasse Parceiro</label>
            <div className="flex items-center gap-2">
              <Input type="number" value={settings.repasseParceiro} onChange={(e) => set("repasseParceiro", Number(e.target.value))} className="w-24" />
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
            <Input type="number" value={settings.capacidade} onChange={(e) => set("capacidade", Number(e.target.value))} className="w-32" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Runway mínimo (meses)</label>
            <Input type="number" value={settings.runwayMinimo} onChange={(e) => set("runwayMinimo", Number(e.target.value))} className="w-24" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Margem mínima (%)</label>
            <Input type="number" value={settings.margemMinima} onChange={(e) => set("margemMinima", Number(e.target.value))} className="w-24" />
          </div>
        </div>
      </div>
    </>
  );
}
