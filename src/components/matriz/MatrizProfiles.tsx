import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, DollarSign, TrendingUp, Headphones, Megaphone, Check } from "lucide-react";
import { perfisPreConfigurados, getUserModulosHabilitados, permissoesEspeciaisConfig, type PerfilPreConfigurado } from "@/data/matrizData";

const iconMap: Record<string, React.ElementType> = {
  Crown, DollarSign, TrendingUp, Headphones, Megaphone,
};

interface Props {
  onApply?: (perfilId: string) => void;
  activePerfilId?: string;
}

export function MatrizProfiles({ onApply, activePerfilId }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {perfisPreConfigurados.map(perfil => {
        const Icon = iconMap[perfil.icone] || Crown;
        const habilitados = perfil.permissoes.filter(p => p.nivel !== "sem_acesso").map(p => p.modulo);
        const especialAtivas = permissoesEspeciaisConfig.filter(c => perfil.permissoesEspeciais[c.key]);
        const isActive = activePerfilId === perfil.id;

        return (
          <Card key={perfil.id} className={`transition-all ${isActive ? "ring-2 ring-primary" : ""}`}>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{perfil.nome}</h3>
                  <p className="text-xs text-muted-foreground">{perfil.descricao}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Módulos com acesso ({habilitados.length})</p>
                <div className="flex flex-wrap gap-1">
                  {habilitados.slice(0, 6).map(m => <Badge key={m} variant="secondary" className="text-[10px]">{m}</Badge>)}
                  {habilitados.length > 6 && <Badge variant="outline" className="text-[10px]">+{habilitados.length - 6}</Badge>}
                </div>
              </div>

              {especialAtivas.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Permissões especiais</p>
                  <div className="space-y-0.5">
                    {especialAtivas.map(e => (
                      <div key={e.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span>{e.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {onApply && (
                <Button variant={isActive ? "secondary" : "outline"} size="sm" className="w-full" onClick={() => onApply(perfil.id)}>
                  {isActive ? "Perfil ativo" : "Aplicar este perfil"}
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
