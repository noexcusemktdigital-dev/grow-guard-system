import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { UnidadeUser, UserRole, UserPermission, UserStatus } from "@/types/unidades";

const roles: UserRole[] = ["Franqueado", "Comercial", "Atendimento", "Performance", "Criativo", "Financeiro"];
const permissions: UserPermission[] = ["Admin da Unidade", "Operador", "Somente leitura"];

interface Props {
  users: UnidadeUser[];
  unidadeId: string;
  onUpdate: (users: UnidadeUser[]) => void;
}

const emptyUser = (unidadeId: string): Omit<UnidadeUser, "id"> => ({
  unidadeId, nome: "", email: "", funcao: "Comercial", permissao: "Operador", status: "Ativo",
});

export function UnidadeUsuarios({ users, unidadeId, onUpdate }: Props) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<UnidadeUser | null>(null);
  const [form, setForm] = useState<Omit<UnidadeUser, "id">>(emptyUser(unidadeId));
  const { toast } = useToast();

  const openNew = () => { setEditing(null); setForm(emptyUser(unidadeId)); setOpen(true); };
  const openEdit = (u: UnidadeUser) => { setEditing(u); setForm(u); setOpen(true); };

  const handleSave = () => {
    if (!form.nome || !form.email) {
      toast({ title: "Preencha nome e e-mail", variant: "destructive" });
      return;
    }
    if (editing) {
      onUpdate(users.map(u => u.id === editing.id ? { ...form, id: editing.id } : u));
    } else {
      onUpdate([...users, { ...form, id: `uu${Date.now()}` }]);
    }
    setOpen(false);
    toast({ title: editing ? "Usuário atualizado!" : "Usuário adicionado!" });
  };

  const handleRemove = (user: UnidadeUser) => {
    const admins = users.filter(u => u.permissao === "Admin da Unidade" && u.id !== user.id);
    if (user.permissao === "Admin da Unidade" && admins.length === 0) {
      toast({ title: "Não é possível remover", description: "A unidade precisa ter pelo menos 1 Admin.", variant: "destructive" });
      return;
    }
    onUpdate(users.filter(u => u.id !== user.id));
    toast({ title: "Usuário removido." });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-end">
        <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> Novo Usuário</Button>
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Função</TableHead>
              <TableHead>Permissão</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map(u => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.nome}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell><Badge variant="secondary">{u.funcao}</Badge></TableCell>
                <TableCell><Badge variant="outline">{u.permissao}</Badge></TableCell>
                <TableCell>
                  <Badge variant="outline" className={u.status === "Ativo" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"}>
                    {u.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(u)} aria-label="Editar"><Pencil className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleRemove(u)} aria-label="Excluir"><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar Usuário" : "Novo Usuário"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5"><Label>Nome</Label><Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>E-mail</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Função</Label>
                <Select value={form.funcao} onValueChange={v => setForm(f => ({ ...f, funcao: v as UserRole }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Permissão</Label>
                <Select value={form.permissao} onValueChange={v => setForm(f => ({ ...f, permissao: v as UserPermission }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{permissions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as UserStatus }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
