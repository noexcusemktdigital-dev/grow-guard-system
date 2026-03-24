import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Shield, Inbox, Users, UserPlus, Building2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import MatrizEmpresa from "@/components/matriz/MatrizEmpresa";
import { EditMemberDialog } from "@/components/EditMemberDialog";
import { TeamSelector, TEAM_COLORS } from "@/components/TeamSelector";
import { useOrgMembers } from "@/hooks/useOrgMembers";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { useOrgTeams, useTeamMemberships, useTeamMutations } from "@/hooks/useOrgTeams";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Administrador",
  cliente_user: "Usuário",
};

const TEAM_COLORS_LOCAL = TEAM_COLORS;

export default function Matriz() {
  const { data: members, isLoading: loadingMembers } = useOrgMembers();
  const { data: orgId } = useUserOrgId();
  const { data: teams, isLoading: loadingTeams } = useOrgTeams();
  const { data: teamMemberships } = useTeamMemberships();
  const { setUserTeams } = useTeamMutations();
  const { toast } = useToast();
  const qc = useQueryClient();

  // Invite state
  const [showInvite, setShowInvite] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("admin");
  const [inviteTeamIds, setInviteTeamIds] = useState<string[]>([]);
  const [inviteLoading, setInviteLoading] = useState(false);

  // Edit member state
  const [editingMember, setEditingMember] = useState<typeof members extends (infer T)[] | undefined ? T | null : never>(null);
  const [editTeamIds, setEditTeamIds] = useState<string[]>([]);
  const { user } = useAuth();

  const getUserTeams = (userId: string) => {
    if (!teamMemberships || !teams) return [];
    const userTeamIds = teamMemberships.filter((tm) => tm.user_id === userId).map((tm) => tm.team_id);
    return teams.filter((t) => userTeamIds.includes(t.id));
  };

  const toggleTeam = (teamId: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.includes(teamId) ? list.filter((id) => id !== teamId) : [...list, teamId]);
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast({ title: "Informe o e-mail", variant: "destructive" });
      return;
    }
    if (!orgId) {
      toast({ title: "Erro: organização não encontrada. Recarregue a página.", variant: "destructive" });
      return;
    }
    setInviteLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("invite-user", {
        body: {
          email: inviteEmail,
          full_name: inviteName,
          role: inviteRole,
          organization_id: orgId,
          team_ids: inviteTeamIds,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: "Convite enviado! O membro receberá um e-mail para definir sua senha." });
      setShowInvite(false);
      setInviteName("");
      setInviteEmail("");
      setInviteRole("admin");
      setInviteTeamIds([]);
      qc.invalidateQueries({ queryKey: ["org-members"] });
    } catch (err: any) {
      toast({ title: "Erro ao convidar", description: err.message, variant: "destructive" });
    } finally {
      setInviteLoading(false);
    }
  };

  const handleSaveTeams = async () => {
    if (!editingMember) return;
    try {
      await setUserTeams.mutateAsync({ userId: editingMember.user_id, teamIds: editTeamIds });
      toast({ title: "Times atualizados!" });
    } catch (err: any) {
      toast({ title: "Erro ao atualizar times", description: err.message, variant: "destructive" });
    }
  };

  const openEditMember = (m: any) => {
    const current = getUserTeams(m.user_id).map((t) => t.id);
    setEditTeamIds(current);
    setEditingMember(m);
  };

  const MATRIZ_ROLE_OPTIONS = [
    { value: "super_admin", label: "Super Admin" },
    { value: "admin", label: "Administrador" },
    { value: "cliente_user", label: "Usuário" },
  ];

  if (loadingMembers || loadingTeams) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // TeamSelector is now imported from @/components/TeamSelector

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="page-header-title">Matriz</h1>
              <Badge variant="secondary">Franqueadora</Badge>
            </div>
            <p className="text-sm text-muted-foreground">Gestão de usuários, times e dados da franqueadora</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="empresa">
        <TabsList>
          <TabsTrigger value="empresa" className="gap-1.5">
            <Building2 className="w-3.5 h-3.5" /> Empresa
          </TabsTrigger>
          <TabsTrigger value="equipe" className="gap-1.5">
            <Users className="w-3.5 h-3.5" /> Equipe
          </TabsTrigger>
        </TabsList>

        <TabsContent value="empresa" className="mt-4">
          <MatrizEmpresa />
        </TabsContent>

        <TabsContent value="equipe" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">Membros da equipe e seus times</p>
            <Button size="sm" onClick={() => setShowInvite(true)}>
              <UserPlus className="w-4 h-4 mr-1" /> Convidar Membro
            </Button>
          </div>

          {(members ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Inbox className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-1">Nenhum membro</h3>
              <p className="text-sm text-muted-foreground mb-4">Convide membros para a equipe da franqueadora.</p>
              <Button onClick={() => setShowInvite(true)}>
                <UserPlus className="w-4 h-4 mr-1" /> Convidar Primeiro Membro
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {members?.map((m) => {
                const userTeams = getUserTeams(m.user_id);
                return (
                  <Card key={m.user_id} className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                          {(m.full_name || "?").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{m.full_name || "Sem nome"}</p>
                        {m.job_title && <p className="text-xs text-muted-foreground truncate">{m.job_title}</p>}
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {ROLE_LABELS[m.role] || m.role}
                      </Badge>
                    </div>

                    {/* Team badges */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {userTeams.length > 0 ? (
                        userTeams.map((t) => (
                          <span key={t.id} className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${TEAM_COLORS[t.slug] || "bg-muted text-muted-foreground"}`}>
                            {t.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-muted-foreground italic">Sem time atribuído</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <p className="text-xs text-muted-foreground">
                        Desde {new Date(m.created_at).toLocaleDateString("pt-BR")}
                      </p>
                      {m.user_id !== user?.id && (
                        <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => openEditMember(m)}>
                          Editar
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Invite Dialog */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Convidar Membro</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome Completo</Label>
              <Input value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="Nome do membro" />
            </div>
            <div>
              <Label>E-mail *</Label>
              <Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="email@exemplo.com" />
            </div>
            <div>
              <Label>Papel</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="cliente_user">Usuário</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground mt-1">
                {inviteRole === "super_admin" && "Acesso total: pode editar tudo, configurar e gerenciar permissões."}
                {inviteRole === "admin" && "Acesso intermediário: gerencia operações mas não altera configurações críticas."}
                {inviteRole === "cliente_user" && "Acesso operacional: utiliza as ferramentas do dia a dia."}
              </p>
            </div>
            <TeamSelector selectedIds={inviteTeamIds} onToggle={(id) => toggleTeam(id, inviteTeamIds, setInviteTeamIds)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvite(false)}>
              Cancelar
            </Button>
            <Button onClick={handleInvite} disabled={inviteLoading}>
              {inviteLoading ? "Convidando..." : "Convidar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Member Dialog */}
      <EditMemberDialog
        open={!!editingMember}
        onOpenChange={(open) => { if (!open) setEditingMember(null); }}
        member={editingMember}
        organizationId={orgId || ""}
        roleOptions={MATRIZ_ROLE_OPTIONS}
        onSuccess={() => {
          handleSaveTeams();
          setEditingMember(null);
        }}
        extraContent={
          <TeamSelector selectedIds={editTeamIds} onToggle={(id) => toggleTeam(id, editTeamIds, setEditTeamIds)} />
        }
      />
    </div>
  );
}
