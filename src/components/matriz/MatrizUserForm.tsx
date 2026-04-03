import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import {
  MatrizUser, MatrizArea, MatrizUserStatus, areas, perfisPreConfigurados,
  todosModulos, getPerfilById, type PermissoesEspeciais, type ModuloPermissao,
} from "@/types/matriz";

interface Props {
  user?: MatrizUser;
  onSave: (user: MatrizUser) => void;
  onCancel: () => void;
}

const emptyEspeciais: PermissoesEspeciais = {
  podeVerFinanceiroCompleto: false, podeEditarRepasse: false, podeGerarDre: false,
  podeExcluirContratos: false, podeCriarCampanhas: false, podeEnviarComunicadoGlobal: false,
  podeAlterarPermissoes: false,
};

export function MatrizUserForm({ user, onSave, onCancel }: Props) {
  const [nome, setNome] = useState(user?.nome || "");
  const [email, setEmail] = useState(user?.email || "");
  const [telefone, setTelefone] = useState(user?.telefone || "");
  const [cargo, setCargo] = useState(user?.cargo || "");
  const [area, setArea] = useState<MatrizArea>(user?.area || "Direcao");
  const [status, setStatus] = useState<MatrizUserStatus>(user?.status || "Ativo");
  const [perfilBase, setPerfilBase] = useState(user?.perfilBase || "custom");
  const [showPerfilAlert, setShowPerfilAlert] = useState(false);

  const handlePerfilChange = (val: string) => {
    setPerfilBase(val);
    setShowPerfilAlert(val !== "custom");
  };

  const handleSave = () => {
    const perfil = getPerfilById(perfilBase);
    const permissoes: ModuloPermissao[] = perfil
      ? [...perfil.permissoes]
      : todosModulos.map(m => ({ modulo: m, nivel: "sem_acesso" as const }));
    const permissoesEspeciais = perfil ? { ...perfil.permissoesEspeciais } : { ...emptyEspeciais };

    onSave({
      id: user?.id || `m${Date.now()}`,
      nome, email, telefone, cargo, area, status,
      lastLogin: user?.lastLogin || "—",
      permissoes,
      permissoesEspeciais,
      perfilBase: perfilBase === "custom" ? undefined : perfilBase,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{user ? "Editar Usuário" : "Novo Usuário"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome completo" />
          </div>
          <div className="space-y-2">
            <Label>Email *</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@franqueadora.com" />
          </div>
          <div className="space-y-2">
            <Label>Telefone</Label>
            <Input value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(00) 00000-0000" />
          </div>
          <div className="space-y-2">
            <Label>Cargo</Label>
            <Input value={cargo} onChange={e => setCargo(e.target.value)} placeholder="Cargo na empresa" />
          </div>
          <div className="space-y-2">
            <Label>Área</Label>
            <Select value={area} onValueChange={v => setArea(v as MatrizArea)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{areas.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={v => setStatus(v as MatrizUserStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3">
          <Label>Perfil Base</Label>
          <Select value={perfilBase} onValueChange={handlePerfilChange}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="custom">Personalizado</SelectItem>
              {perfisPreConfigurados.map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
            </SelectContent>
          </Select>
          {showPerfilAlert && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>Permissões aplicadas do perfil. Você pode personalizar após salvar, na aba de Permissões.</AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!nome || !email}>Salvar</Button>
        </div>
      </CardContent>
    </Card>
  );
}
