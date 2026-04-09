// @ts-nocheck
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { X, Eye, Pencil, Crown, AlertTriangle } from "lucide-react";
import { useState } from "react";
import {
  ModuloPermissao, NivelAcesso, getModulosBySection, getNivelAcessoLabel,
  perfisPreConfigurados,
} from "@/types/matriz";

interface Props {
  permissoes: ModuloPermissao[];
  onChange: (permissoes: ModuloPermissao[]) => void;
  readOnly?: boolean;
}

const niveis: { nivel: NivelAcesso; icon: React.ElementType; color: string }[] = [
  { nivel: "sem_acesso", icon: X, color: "bg-muted text-muted-foreground" },
  { nivel: "visualizacao", icon: Eye, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400" },
  { nivel: "edicao", icon: Pencil, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" },
  { nivel: "admin", icon: Crown, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" },
];

export function MatrizPermissions({ permissoes, onChange, readOnly }: Props) {
  const [showApplyAlert, setShowApplyAlert] = useState(false);
  const sections = getModulosBySection();

  const getNivel = (modulo: string): NivelAcesso => {
    return permissoes.find(p => p.modulo === modulo)?.nivel || "sem_acesso";
  };

  const setNivel = (modulo: string, nivel: NivelAcesso) => {
    if (readOnly) return;
    const updated = permissoes.map(p => p.modulo === modulo ? { ...p, nivel } : p);
    if (!updated.find(p => p.modulo === modulo)) {
      updated.push({ modulo, nivel });
    }
    onChange(updated);
  };

  const applyPerfil = (perfilId: string) => {
    const perfil = perfisPreConfigurados.find(p => p.id === perfilId);
    if (perfil) {
      onChange([...perfil.permissoes]);
      setShowApplyAlert(false);
    }
  };

  return (
    <div className="space-y-6">
      {!readOnly && (
        <div className="flex items-center gap-3">
          <Select onValueChange={v => { setShowApplyAlert(true); applyPerfil(v); }}>
            <SelectTrigger className="w-[220px]"><SelectValue placeholder="Aplicar perfil..." /></SelectTrigger>
            <SelectContent>
              {perfisPreConfigurados.map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
            </SelectContent>
          </Select>
          {showApplyAlert && (
            <Alert className="flex-1 py-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">Permissões substituídas pelo perfil selecionado.</AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {sections.map(section => (
        <Card key={section.secao}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{section.secao}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {section.modulos.map(modulo => {
              const current = getNivel(modulo);
              return (
                <div key={modulo} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <span className="text-sm font-medium">{modulo}</span>
                  <div className="flex gap-1">
                    {niveis.map(n => {
                      const Icon = n.icon;
                      const isActive = current === n.nivel;
                      return (
                        <button
                          key={n.nivel}
                          onClick={() => setNivel(modulo, n.nivel)}
                          disabled={readOnly}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                            isActive ? n.color : "text-muted-foreground/40 hover:text-muted-foreground"
                          } ${readOnly ? "cursor-default" : "cursor-pointer"}`}
                          title={getNivelAcessoLabel(n.nivel)}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{getNivelAcessoLabel(n.nivel)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
