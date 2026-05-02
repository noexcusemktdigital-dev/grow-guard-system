import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { useUnitMutations } from "@/hooks/useUnits";
import { toast } from "sonner";
import { reportError } from "@/lib/error-toast";

interface Props {
  unit: { id: string; name: string; city: string; state: string; phone: string; email: string; manager_name: string; address: string; status: string; opened_at: string; unit_org_id?: string };
  readOnly?: boolean;
}

export function UnidadeDadosEdit({ unit, readOnly }: Props) {
  const { updateUnit } = useUnitMutations();
  const [form, setForm] = useState({
    name: unit.name || "",
    city: unit.city || "",
    state: unit.state || "",
    phone: unit.phone || "",
    email: unit.email || "",
    manager_name: unit.manager_name || "",
    address: unit.address || "",
    status: unit.status || "active",
    opened_at: unit.opened_at || "",
  });

  const handleSave = () => {
    if (readOnly) {
      updateUnit.mutate(
        { id: unit.id, phone: form.phone, email: form.email, address: form.address },
        {
          onSuccess: () => toast.success("Dados salvos com sucesso!"),
          onError: (e) => reportError(e, { title: "Erro ao salvar dados da unidade", category: "unidade.dados_save" }),
        }
      );
    } else {
      updateUnit.mutate(
        { id: unit.id, ...form },
        {
          onSuccess: () => toast.success("Dados salvos com sucesso!"),
          onError: (e) => reportError(e, { title: "Erro ao salvar dados da unidade", category: "unidade.dados_save" }),
        }
      );
    }
  };

  return (
    <Card className="p-6 space-y-4 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Nome da Unidade</Label>
          <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} disabled={readOnly} />
        </div>
        <div className="space-y-1.5">
          <Label>Responsável</Label>
          <Input value={form.manager_name} onChange={(e) => setForm((f) => ({ ...f, manager_name: e.target.value }))} disabled={readOnly} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label>Cidade</Label>
          <Input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} disabled={readOnly} />
        </div>
        <div className="space-y-1.5">
          <Label>Estado</Label>
          <Input value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} disabled={readOnly} />
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))} disabled={readOnly}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Ativa</SelectItem>
              <SelectItem value="suspended">Suspensa</SelectItem>
              <SelectItem value="closed">Encerrada</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>E-mail</Label>
          <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label>Telefone</Label>
          <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Endereço</Label>
          <Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label>Data de Abertura</Label>
          <Input type="date" value={form.opened_at?.slice(0, 10) || ""} onChange={(e) => setForm((f) => ({ ...f, opened_at: e.target.value }))} disabled={readOnly} />
        </div>
      </div>
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateUnit.isPending}>
          {updateUnit.isPending ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>
    </Card>
  );
}
