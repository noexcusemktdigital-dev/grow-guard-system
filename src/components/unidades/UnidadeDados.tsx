import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Unidade, UnidadeStatus } from "@/types/unidades";

interface Props {
  unidade: Unidade;
  onUpdate: (u: Unidade) => void;
}

export function UnidadeDados({ unidade, onUpdate }: Props) {
  const [form, setForm] = useState<Unidade>({ ...unidade });
  const { toast } = useToast();

  const handleSave = () => {
    onUpdate(form);
    toast({ title: "Dados salvos com sucesso!" });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5"><Label>Nome da Unidade</Label><Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} /></div>
          <div className="space-y-1.5"><Label>Responsável</Label><Input value={form.responsavel} onChange={e => setForm(f => ({ ...f, responsavel: e.target.value }))} /></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5"><Label>Cidade</Label><Input value={form.cidade} onChange={e => setForm(f => ({ ...f, cidade: e.target.value }))} /></div>
          <div className="space-y-1.5"><Label>Estado</Label><Input value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value }))} /></div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as UnidadeStatus }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Ativa">Ativa</SelectItem>
                <SelectItem value="Suspensa">Suspensa</SelectItem>
                <SelectItem value="Encerrada">Encerrada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5"><Label>E-mail</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
          <div className="space-y-1.5"><Label>Telefone</Label><Input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} /></div>
        </div>
        <div className="space-y-1.5"><Label>Data de Início</Label><Input type="date" value={form.dataInicio} onChange={e => setForm(f => ({ ...f, dataInicio: e.target.value }))} /></div>
        <div className="space-y-1.5"><Label>Observações</Label><Textarea rows={3} value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} /></div>
        <div className="flex justify-end"><Button onClick={handleSave}>Salvar</Button></div>
      </div>
    </div>
  );
}
