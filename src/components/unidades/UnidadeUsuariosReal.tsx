import { useState } from "react";
import { Users, Mail, Plus, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUnitMembers } from "@/hooks/useUnitMembers";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  unitOrgId: string | null | undefined;
}

export function UnidadeUsuariosReal({ unitOrgId }: Props) {
  const { data: members, isLoading } = useUnitMembers(unitOrgId);
  const queryClient = useQueryClient();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [invName, setInvName] = useState("");
  const [invEmail, setInvEmail] = useState("");
  const [invRole, setInvRole] = useState("cliente_user");
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  async function handleInvite() {
    if (!invEmail.trim() || !invName.trim()) { toast.error("Preencha nome e email"); return; }
    if (!unitOrgId) { toast.error("Unidade sem organização vinculada"); return; }
    setInviting(true);
    try {
      const { data, error } = await supabase.functions.invoke("invite-user", {
        body: { email: invEmail.trim(), full_name: invName.trim(), role: invRole, organization_id: unitOrgId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      queryClient.invalidateQueries({ queryKey: ["unit-members", unitOrgId] });
      setInviteSuccess(true);
    } catch (e: any) {
      toast.error(e.message || "Erro ao convidar membro");
    }
    setInviting(false);
  }

  function resetForm() {
    setInviteOpen(false);
    setInvName(""); setInvEmail(""); setInvRole("cliente_user");
    setInviteSuccess(false);
  }

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  return (
    <>
      <Card className="animate-fade-in">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-sm font-semibold flex items-center gap-2"><Users className="w-4 h-4" /> Membros</h3>
          {unitOrgId && (
            <Button size="sm" variant="outline" onClick={() => setInviteOpen(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Convidar Membro
            </Button>
          )}
        </div>

        {!members || members.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>Nenhum membro vinculado a esta unidade.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Membro</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Desde</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m: any) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={m.profiles?.avatar_url} />
                        <AvatarFallback>{(m.profiles?.full_name || "?").charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{m.profiles?.full_name || "Sem nome"}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {m.user_id?.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{m.role || "membro"}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {new Date(m.created_at).toLocaleDateString("pt-BR")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={(o) => { if (!o) resetForm(); else setInviteOpen(true); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Convidar Membro</DialogTitle>
            <DialogDescription>O membro receberá acesso à unidade com a função selecionada.</DialogDescription>
          </DialogHeader>

          {inviteSuccess ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center space-y-3">
                <Check className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="text-sm font-medium">Convite enviado com sucesso!</p>
                <p className="text-xs text-muted-foreground">O membro receberá um e-mail para definir sua senha e acessar o sistema.</p>
              </div>
              <DialogFooter>
                <Button onClick={resetForm}>Fechar</Button>
              </DialogFooter>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div><Label>Nome *</Label><Input value={invName} onChange={e => setInvName(e.target.value)} placeholder="Nome completo" /></div>
                <div><Label>Email *</Label><Input type="email" value={invEmail} onChange={e => setInvEmail(e.target.value)} placeholder="email@exemplo.com" /></div>
                <div>
                  <Label>Função</Label>
                  <Select value={invRole} onValueChange={setInvRole}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="franqueado">Franqueado (Admin)</SelectItem>
                      <SelectItem value="cliente_admin">Administrador</SelectItem>
                      <SelectItem value="cliente_user">Usuário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={resetForm}>Cancelar</Button>
                <Button onClick={handleInvite} disabled={inviting}>{inviting ? "Convidando..." : "Convidar"}</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
