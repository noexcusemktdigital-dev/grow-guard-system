import { useState } from "react";
import { Users, Mail, Plus, Check, Pencil } from "lucide-react";
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
import { EditMemberDialog } from "@/components/EditMemberDialog";
import { TeamSelector } from "@/components/TeamSelector";
import { useUnitMembers } from "@/hooks/useUnitMembers";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { invokeEdge } from "@/lib/edge";
import { toast } from "sonner";
import { reportError } from "@/lib/error-toast";

interface Props {
  unitOrgId: string | null | undefined;
  isFranqueadoView?: boolean;
  maxUsers?: number;
}

export function UnidadeUsuariosReal({ unitOrgId, isFranqueadoView, maxUsers }: Props) {
  const { data: members, isLoading } = useUnitMembers(unitOrgId);
  const queryClient = useQueryClient();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [invName, setInvName] = useState("");
  const [invEmail, setInvEmail] = useState("");
  const [invRole, setInvRole] = useState("franqueado");
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [inviteTeamIds, setInviteTeamIds] = useState<string[]>([]);

  // Edit member state
  const [editOpen, setEditOpen] = useState(false);
  const [editMember, setEditMember] = useState<{
    user_id: string;
    full_name: string | null;
    job_title: string | null;
    role: string;
  } | null>(null);

  const canInvite = !maxUsers || !members || members.length < maxUsers;

  async function handleInvite() {
    if (!invEmail.trim() || !invName.trim()) { reportError(new Error("Preencha nome e email"), { title: "Preencha nome e email", category: "unidade.usuarios_validation" }); return; }
    if (!unitOrgId) { reportError(new Error("Unidade sem organização vinculada"), { title: "Unidade sem organização vinculada", category: "unidade.usuarios_validation" }); return; }
    if (maxUsers && members && members.length >= maxUsers) { reportError(new Error(`Limite de ${maxUsers} usuários atingido`), { title: `Limite de ${maxUsers} usuários atingido`, category: "unidade.usuarios_limit" }); return; }
    setInviting(true);
    try {
      const { data, error } = await invokeEdge("invite-user", {
        body: { email: invEmail.trim(), full_name: invName.trim(), role: invRole, organization_id: unitOrgId, team_ids: inviteTeamIds },
      });
      if (error) {
        const ctx = (error as { context?: unknown }).context;
        if (ctx instanceof Response) {
          const body = await ctx.json().catch(() => null);
          throw new Error(body?.error || error.message);
        }
        throw error;
      }
      if (data?.error) throw new Error(data.error);
      queryClient.invalidateQueries({ queryKey: ["unit-members", unitOrgId] });
      setInviteSuccess(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("já está cadastrado") || msg.includes("already been registered")) {
        reportError(new Error(msg), { title: "E-mail já cadastrado", category: "unidade.usuarios_duplicate" });
      } else if (msg.includes("Limite de")) {
        reportError(new Error(msg), { title: msg, category: "unidade.usuarios_limit" });
      } else {
        reportError(e, { title: "Erro ao convidar membro", category: "unidade.usuarios_invite" });
      }
    }
    setInviting(false);
  }

  function resetForm() {
    setInviteOpen(false);
    setInvName(""); setInvEmail(""); setInvRole("franqueado");
    setInviteSuccess(false);
    setInviteTeamIds([]);
  }

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  const roleOptions = isFranqueadoView
    ? [
        { value: "franqueado", label: "Administrador" },
      ]
    : [
        { value: "franqueado", label: "Franqueado (Admin)" },
        { value: "cliente_admin", label: "Administrador" },
        { value: "cliente_user", label: "Usuário" },
      ];

  function handleEditClick(m: { user_id: string; profiles?: { full_name?: string | null; job_title?: string | null }; role?: string }) {
    setEditMember({
      user_id: m.user_id,
      full_name: m.profiles?.full_name || null,
      job_title: m.profiles?.job_title || null,
      role: m.role || "cliente_user",
    });
    setEditOpen(true);
  }

  return (
    <>
      <Card className="animate-fade-in">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Users className="w-4 h-4" /> Membros
            {maxUsers && <span className="text-xs text-muted-foreground font-normal">({members?.length || 0}/{maxUsers})</span>}
          </h3>
          {unitOrgId && canInvite && (
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
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Membro</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Desde</TableHead>
                {!isFranqueadoView && <TableHead className="w-10" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m: { id: string; user_id: string; profiles?: { full_name?: string | null; avatar_url?: string | null }; role?: string; created_at: string }) => (
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
                  {!isFranqueadoView && (
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditClick(m)} aria-label="Editar">
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
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
                      {roleOptions.map(r => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <TeamSelector selectedIds={inviteTeamIds} onToggle={(id) => setInviteTeamIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])} />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={resetForm}>Cancelar</Button>
                <Button onClick={handleInvite} disabled={inviting}>{inviting ? "Convidando..." : "Convidar"}</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Member Dialog (Matriz view) */}
      {!isFranqueadoView && unitOrgId && (
        <EditMemberDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          member={editMember}
          organizationId={unitOrgId}
          roleOptions={roleOptions}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["unit-members", unitOrgId] })}
        />
      )}
    </>
  );
}
