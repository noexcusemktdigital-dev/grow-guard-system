import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Shield, Plus, Inbox, Users, UserPlus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { usePermissionProfiles, usePermissionMutations } from "@/hooks/usePermissions";
import { useOrgMembers } from "@/hooks/useOrgMembers";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Administrador",
  franqueado: "Franqueado",
  cliente_admin: "Cliente Admin",
  cliente_user: "Cliente",
};

export default function Matriz() {
  const { data: profiles, isLoading: loadingProfiles } = usePermissionProfiles();
  const { data: members, isLoading: loadingMembers } = useOrgMembers();
  const { createProfile } = usePermissionMutations();
  const { data: orgId } = useUserOrgId();
  const { toast } = useToast();
  const qc = useQueryClient();

  // Invite state
  const [showInvite, setShowInvite] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("admin");
  const [inviteLoading, setInviteLoading] = useState(false);

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !orgId) {
      toast({ title: "Informe o e-mail", variant: "destructive" });
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
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: "Membro convidado com sucesso!" });
      setShowInvite(false);
      setInviteName(""); setInviteEmail(""); setInviteRole("admin");
      qc.invalidateQueries({ queryKey: ["org-members"] });
    } catch (err: any) {
      toast({ title: "Erro ao convidar", description: err.message, variant: "destructive" });
    } finally {
      setInviteLoading(false);
    }
  };

  if (loadingProfiles || loadingMembers) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

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
            <p className="text-sm text-muted-foreground">Gestão de usuários e permissões da franqueadora</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="membros">
        <TabsList>
          <TabsTrigger value="membros" className="gap-1.5"><Users className="w-3.5 h-3.5" /> Equipe</TabsTrigger>
          <TabsTrigger value="perfis" className="gap-1.5"><Shield className="w-3.5 h-3.5" /> Perfis de Permissão</TabsTrigger>
        </TabsList>

        {/* Members Tab */}
        <TabsContent value="membros" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">Membros da equipe da franqueadora</p>
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
              {members!.map(m => (
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
                  <p className="text-xs text-muted-foreground mt-2">
                    Desde {new Date(m.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Permission Profiles Tab */}
        <TabsContent value="perfis" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">Perfis de permissão para a equipe</p>
            <Button size="sm" onClick={() => createProfile.mutate({ name: "Novo Perfil" })}>
              <Plus className="w-4 h-4 mr-1" /> Novo Perfil
            </Button>
          </div>

          {(profiles ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Inbox className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-1">Nenhum perfil de permissão</h3>
              <p className="text-sm text-muted-foreground mb-4">Crie perfis para gerenciar permissões da equipe.</p>
              <Button onClick={() => createProfile.mutate({ name: "Super Admin", description: "Acesso total ao sistema" })}>
                <Plus className="w-4 h-4 mr-1" /> Criar Primeiro Perfil
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {profiles!.map(p => (
                <Card key={p.id} className="p-4 cursor-pointer hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{p.name}</h3>
                    {p.is_system && <Badge variant="outline" className="text-[10px]">Sistema</Badge>}
                  </div>
                  {p.description && <p className="text-sm text-muted-foreground">{p.description}</p>}
                  <p className="text-xs text-muted-foreground mt-2">Criado em {new Date(p.created_at).toLocaleDateString("pt-BR")}</p>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Invite Dialog */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Convidar Membro</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome Completo</Label><Input value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="Nome do membro" /></div>
            <div><Label>E-mail *</Label><Input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="email@exemplo.com" /></div>
            <div>
              <Label>Papel</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvite(false)}>Cancelar</Button>
            <Button onClick={handleInvite} disabled={inviteLoading}>
              {inviteLoading ? "Convidando..." : "Convidar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
