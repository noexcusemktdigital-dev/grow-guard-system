// @ts-nocheck
import { useState } from "react";
import { DollarSign, Percent, Monitor, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Unidade } from "@/types/unidades";

interface Props {
  unidade: Unidade;
  onUpdate: (u: Unidade) => void;
}

export function UnidadeFinanceiro({ unidade, onUpdate }: Props) {
  const [form, setForm] = useState({
    repassePercent: unidade.repassePercent,
    royaltiesPercent: unidade.royaltiesPercent,
    mensalidadeSistema: unidade.mensalidadeSistema,
    sistemaAtivo: unidade.sistemaAtivo,
    observacoesFinanceiras: unidade.observacoesFinanceiras,
  });
  const { toast } = useToast();

  const handleSave = () => {
    onUpdate({ ...unidade, ...form });
    toast({ title: "Configuração financeira salva!" });
  };

  const cards = [
    { label: "% Repasse", icon: Percent, value: form.repassePercent, key: "repassePercent" as const, suffix: "%" },
    { label: "% Royalties", icon: Percent, value: form.royaltiesPercent, key: "royaltiesPercent" as const, suffix: "%" },
    { label: "Mensalidade Sistema", icon: DollarSign, value: form.mensalidadeSistema, key: "mensalidadeSistema" as const, prefix: "R$" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map(c => {
          const Icon = c.icon;
          return (
            <div key={c.key} className="rounded-lg border bg-card p-5 space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{c.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {c.prefix && <span className="text-sm text-muted-foreground">{c.prefix}</span>}
                <Input
                  type="number"
                  className="text-lg font-bold"
                  value={c.value}
                  onChange={e => setForm(f => ({ ...f, [c.key]: Number(e.target.value) }))}
                />
                {c.suffix && <span className="text-sm text-muted-foreground">{c.suffix}</span>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Monitor className="w-4 h-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Sistema ativo</Label>
          </div>
          <Switch checked={form.sistemaAtivo} onCheckedChange={v => setForm(f => ({ ...f, sistemaAtivo: v }))} />
        </div>
        <div className="space-y-1.5">
          <Label>Observações financeiras</Label>
          <Textarea rows={3} value={form.observacoesFinanceiras} onChange={e => setForm(f => ({ ...f, observacoesFinanceiras: e.target.value }))} />
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-blue-500/20 bg-blue-500/5 p-4 text-sm text-muted-foreground">
        <Info className="w-4 h-4 mt-0.5 text-blue-500 flex-shrink-0" />
        <span>Estas configurações alimentam automaticamente Repasse, DRE e Fechamentos do módulo Financeiro.</span>
      </div>

      <div className="flex justify-end"><Button onClick={handleSave}>Salvar</Button></div>
    </div>
  );
}
