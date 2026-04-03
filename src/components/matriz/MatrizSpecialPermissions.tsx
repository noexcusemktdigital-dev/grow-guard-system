import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { AlertTriangle } from "lucide-react";
import { PermissoesEspeciais, permissoesEspeciaisConfig } from "@/types/matriz";

interface Props {
  permissoes: PermissoesEspeciais;
  onChange: (permissoes: PermissoesEspeciais) => void;
  readOnly?: boolean;
}

export function MatrizSpecialPermissions({ permissoes, onChange, readOnly }: Props) {
  const toggle = (key: keyof PermissoesEspeciais) => {
    if (readOnly) return;
    onChange({ ...permissoes, [key]: !permissoes[key] });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Permissões Especiais</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {permissoesEspeciaisConfig.map(cfg => (
          <div key={cfg.key} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
            <div className="flex items-start gap-3 flex-1">
              {cfg.critica && <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />}
              <div>
                <p className="text-sm font-medium">{cfg.label}</p>
                <p className="text-xs text-muted-foreground">{cfg.descricao}</p>
              </div>
            </div>
            <Switch checked={permissoes[cfg.key]} onCheckedChange={() => toggle(cfg.key)} disabled={readOnly} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
