import { useState, useEffect, useRef } from "react";
import { usePermissionProfiles, usePermissionProfileMutations } from "@/hooks/useMemberPermissions";
import { useSearchParams } from "react-router-dom";
import { Settings, User, Building2, Users, Bell, UserPlus, Shield, Camera, Crown, ChevronRight, Clock, RefreshCw, Trash2, Lock } from "lucide-react";
import { PasswordInput } from "@/components/ui/password-input";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { reportError } from "@/lib/error-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useOrgProfile } from "@/hooks/useOrgProfile";
import { useOrgMembers, usePendingInvitations, type OrgMember } from "@/hooks/useOrgMembers";
import { useClienteSubscription } from "@/hooks/useClienteSubscription";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useOrgTeams, useTeamMemberships, useTeamMutations } from "@/hooks/useOrgTeams";
import { EditMemberDialog } from "@/components/EditMemberDialog";
import { TeamSelector } from "@/components/TeamSelector";
import { OrgPermissionsTab } from "@/components/cliente/OrgPermissionsTab";
import { LGPDSettings } from "@/components/cliente/LGPDSettings";
import { getEffectiveLimits } from "@/constants/plans";
import { supabase } from "@/lib/supabase";
import { invokeEdge } from "@/lib/edge";
import { useMutation, useQueryClient } from "@tanstack/react-query";

function SetPasswordSection() {
  const { user } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  const isGoogleUser = user?.app_metadata?.provider === "google";
  if (!isGoogleUser) return null;

  const handleSetPassword = async () => {
    if (password.length < 8) return reportError(new Error("A senha deve ter pelo menos 8 caracteres"), { title: "A senha deve ter pelo menos 8 caracteres", category: "configuracoes.validation" });
    if (password !== confirm) return reportError(new Error("As senhas não coincidem"), { title: "As senhas não coincidem", category: "configuracoes.validation" });
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Senha definida! Agora você pode fazer login por e-mail também.");
      setPassword("");
      setConfirm("");
    } catch (err: unknown) { reportError(err, { title: err instanceof Error ? err.message : "Erro ao definir senha", category: "configuracoes.set_password" }); }
    finally { setSaving(false); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Definir Senha de Acesso</CardTitle>
        <CardDescription>Você entrou via Google. Defina uma senha para também poder fazer login por e-mail.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Nova Senha</Label><PasswordInput value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" /></div>
          <div className="space-y-2"><Label>Confirmar Senha</Label><PasswordInput value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repita a senha" /></div>
        </div>
        <Button onClick={handleSetPassword} disabled={saving || !password}>{saving ? "Salvando..." : "Definir Senha"}</Button>
      </CardContent>
    </Card>
  );
}

function ProfileTab() {
  const { user } = useAuth();
  const { data: profile, isLoading, update } = useUserProfile();
  const [form, setForm] = useState({ full_name: "", phone: "", job_title: "" });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) setForm({ full_name: profile.full_name || "", phone: profile.phone || "", job_title: profile.job_title || "" });
  }, [profile]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) return reportError(new Error("Imagem deve ter no máximo 2MB"), { title: "Imagem deve ter no máximo 2MB", category: "configuracoes.validation" });
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      update.mutate({ avatar_url: `${publicUrl}?t=${Date.now()}` });
    } catch (err: unknown) { reportError(err, { title: err instanceof Error ? err.message : "Erro ao enviar foto", category: "configuracoes.upload_photo" }); }
    finally { setUploading(false); }
  };

  if (isLoading) return <Skeleton className="h-64 rounded-xl" />;
  const initials = (form.full_name || "U").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Seu Perfil</CardTitle><CardDescription>Informações pessoais da sua conta</CardDescription></CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Avatar className="h-16 w-16">
                {profile?.avatar_url ? <AvatarImage src={profile.avatar_url} alt="Foto" /> : null}
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">{initials}</AvatarFallback>
              </Avatar>
              <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="w-5 h-5 text-white" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>
            <div>
              <p className="font-medium text-foreground">{form.full_name || "Usuário"}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              {uploading && <p className="text-xs text-primary animate-pulse">Enviando foto...</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Nome</Label><Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} /></div>
            <div className="space-y-2"><Label>E-mail</Label><Input value={user?.email || ""} readOnly className="bg-muted" /></div>
            <div className="space-y-2"><Label>Telefone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="(11) 99999-0000" /></div>
            <div className="space-y-2"><Label>Cargo</Label><Input value={form.job_title} onChange={e => setForm({ ...form, job_title: e.target.value })} placeholder="CEO" /></div>
          </div>
          <Button onClick={() => update.mutate(form)} disabled={update.isPending}>{update.isPending ? "Salvando..." : "Salvar Alterações"}</Button>
        </CardContent>
      </Card>
      <SetPasswordSection />
    </div>
  );
}

function OrgTab() {
  const { data: org, isLoading, update } = useOrgProfile();
  const [form, setForm] = useState({ name: "", cnpj: "", email: "", phone: "", address: "", city: "", state: "" });
  useEffect(() => {
    if (org) setForm({ name: org.name || "", cnpj: org.cnpj || "", email: org.email || "", phone: org.phone || "", address: org.address || "", city: org.city || "", state: org.state || "" });
  }, [org]);
  if (isLoading) return <Skeleton className="h-64 rounded-xl" />;
  return (
    <Card>
      <CardHeader><CardTitle>Dados da Organização</CardTitle><CardDescription>Informações da empresa</CardDescription></CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Nome da Empresa</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div className="space-y-2"><Label>CNPJ</Label><Input value={form.cnpj} onChange={e => setForm({ ...form, cnpj: e.target.value })} placeholder="00.000.000/0001-00" /></div>
          <div className="space-y-2"><Label>E-mail</Label><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
          <div className="space-y-2"><Label>Telefone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
          <div className="space-y-2 md:col-span-2"><Label>Endereço</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
          <div className="space-y-2"><Label>Cidade</Label><Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></div>
          <div className="space-y-2"><Label>Estado</Label><Input value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} placeholder="SP" /></div>
        </div>
        <Button onClick={() => update.mutate(form)} disabled={update.isPending}>{update.isPending ? "Salvando..." : "Salvar Dados"}</Button>
      </CardContent>
    </Card>
  );
}

function UsersAndTeamsTab() {
  const { user } = useAuth();
  const { data: members, isLoading } = useOrgMembers();
  const { data: pendingInvitations, isLoading: pendingLoading } = usePendingInvitations();
  const { data: subscription } = useClienteSubscription();
  const { data: orgId } = useUserOrgId();
  const { data: teams } = useOrgTeams();
  const { data: memberships } = useTeamMemberships();
  const { setUserTeams } = useTeamMutations();
  const limits = getEffectiveLimits(subscription?.plan, subscription?.status === "trial");
  const maxUsers = limits.maxUsers || 2;
  const currentCount = members?.length ?? 0;
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", full_name: "", role: "cliente_user" });
  const [inviteTeamIds, setInviteTeamIds] = useState<string[]>([]);
  const [editMember, setEditMember] = useState<OrgMember | null>(null);
  const qc = useQueryClient();
  const [profileManagerOpen, setProfileManagerOpen] = useState(false);
  const { data: permProfiles } = usePermissionProfiles();
  const { createProfile, deleteProfile } = usePermissionProfileMutations();
  const [newProfileName, setNewProfileName] = useState("");

  const CLIENTE_ROLE_OPTIONS = [
    { value: "cliente_admin", label: "Admin" },
    { value: "cliente_user", label: "Usuário" },
  ];

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await invokeEdge("invite-user", {
        body: { email: inviteForm.email, full_name: inviteForm.full_name, role: inviteForm.role, organization_id: orgId, team_ids: inviteTeamIds },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast.success("Convite enviado!");
      setInviteOpen(false);
      setInviteForm({ email: "", full_name: "", role: "cliente_user" });
      setInviteTeamIds([]);
      qc.invalidateQueries({ queryKey: ["org-members"] });
      qc.invalidateQueries({ queryKey: ["pending-invitations"] });
    },
    onError: (err: unknown) => reportError(err, { title: err instanceof Error ? err.message : "Erro ao enviar convite", category: "configuracoes.invite" }),
  });

  const resendMutation = useMutation({
    mutationFn: async (inv: { email: string; full_name: string | null; role: string; team_ids: string[] }) => {
      const { data, error } = await invokeEdge("invite-user", {
        body: { email: inv.email, full_name: inv.full_name, role: inv.role, organization_id: orgId, team_ids: inv.team_ids },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast.success("Convite reenviado!");
      qc.invalidateQueries({ queryKey: ["pending-invitations"] });
    },
    onError: (err: unknown) => reportError(err, { title: err instanceof Error ? err.message : "Erro ao reenviar convite", category: "configuracoes.invite" }),
  });

  const cancelInviteMutation = useMutation({
    mutationFn: async (invId: string) => {
      const { error } = await supabase.from("pending_invitations").delete().eq("id", invId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Convite cancelado");
      qc.invalidateQueries({ queryKey: ["pending-invitations"] });
    },
    onError: () => reportError(new Error("Erro ao cancelar convite"), { title: "Erro ao cancelar convite", category: "configuracoes.invite" }),
  });

  const roleLabels: Record<string, string> = { cliente_admin: "Admin", cliente_user: "Usuário", super_admin: "Super Admin", admin: "Admin" };
  const roleColors: Record<string, string> = { cliente_admin: "bg-primary/10 text-primary border-primary/20", cliente_user: "bg-muted text-muted-foreground border-muted" };

  const getUserTeams = (userId: string) => {
    if (!memberships || !teams) return [];
    const teamIds = memberships.filter(m => m.user_id === userId).map(m => m.team_id);
    return teams.filter(t => teamIds.includes(t.id));
  };

  // Filter out members who still have a pending invitation (not yet accepted)
  const pendingEmails = new Set(
    (pendingInvitations ?? []).filter(inv => !inv.accepted_at).map(inv => inv.email.toLowerCase())
  );
  const activeMembers = members?.filter(m => !pendingEmails.has(m.email?.toLowerCase())) ?? [];

  const admins = activeMembers.filter(m => m.role === "cliente_admin" || m.role === "admin" || m.role === "super_admin");
  const users = activeMembers.filter(m => m.role === "cliente_user");

  if (isLoading) return <Skeleton className="h-64 rounded-xl" />;

  return (
    <div className="space-y-6">
      {/* Hierarchy View */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">Hierarquia da Organização</CardTitle>
              <CardDescription>{currentCount}/{maxUsers} usuários</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setProfileManagerOpen(true)}>
                <Shield className="w-4 h-4" /> Perfis
              </Button>
              <Button size="sm" className="gap-1.5" onClick={() => setInviteOpen(true)} disabled={currentCount >= maxUsers}>
                <UserPlus className="w-4 h-4" /> Convidar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Admins section */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Administradores ({admins.length})</span>
            </div>
            <div className="space-y-2 ml-6">
              {admins.map(m => (
                <div key={m.user_id} className="flex items-center justify-between p-3 rounded-lg border border-primary/10 bg-primary/5">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                        {(m.full_name || "U").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{m.full_name || "Sem nome"}</p>
                      <p className="text-[10px] text-muted-foreground">{m.job_title || "Administrador"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getUserTeams(m.user_id).map(t => (
                      <Badge key={t.id} variant="secondary" className="text-[9px]">{t.name}</Badge>
                    ))}
                    <Badge variant="outline" className="gap-1 bg-primary/10 text-primary border-primary/20">
                      <Shield className="w-3 h-3" />{roleLabels[m.role] || m.role}
                    </Badge>
                    {m.user_id !== user?.id && (
                      <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setEditMember(m)}>Editar</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Users section */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Usuários ({users.length})</span>
            </div>
            <div className="space-y-2 ml-6">
              {users.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">Nenhum usuário convidado</p>
              ) : users.map(m => (
                <div key={m.user_id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-muted text-muted-foreground text-xs font-bold">
                        {(m.full_name || "U").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{m.full_name || "Sem nome"}</p>
                      <p className="text-[10px] text-muted-foreground">{m.job_title || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getUserTeams(m.user_id).map(t => (
                      <Badge key={t.id} variant="secondary" className="text-[9px]">{t.name}</Badge>
                    ))}
                    <Badge variant="outline" className="gap-1"><Shield className="w-3 h-3" />Usuário</Badge>
                    {m.user_id !== user?.id && (
                      <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setEditMember(m)}>Editar</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Invitations section */}
          {pendingInvitations && pendingInvitations.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Convites Pendentes ({pendingInvitations.length})</span>
              </div>
              <div className="space-y-2 ml-6">
                {pendingInvitations.map(inv => (
                  <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg border border-amber-200/50 bg-amber-50/30 dark:border-amber-500/20 dark:bg-amber-500/5">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 text-xs font-bold">
                          {(inv.full_name || inv.email[0] || "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{inv.full_name || inv.email}</p>
                        {inv.full_name && <p className="text-[10px] text-muted-foreground">{inv.email}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="gap-1 bg-amber-100/50 text-amber-700 border-amber-300/50 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30">
                        <Clock className="w-3 h-3" />Pendente
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7 gap-1"
                        disabled={resendMutation.isPending}
                        onClick={() => resendMutation.mutate({ email: inv.email, full_name: inv.full_name, role: inv.role, team_ids: inv.team_ids })}
                      >
                        <RefreshCw className="w-3 h-3" />Reenviar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7 text-destructive hover:text-destructive"
                        disabled={cancelInviteMutation.isPending}
                        onClick={() => cancelInviteMutation.mutate(inv.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Permissions summary */}
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Permissões por Papel</p>
              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div>
                  <p className="font-semibold text-primary flex items-center gap-1"><Crown className="w-3 h-3" /> Admin</p>
                  <p className="text-muted-foreground">Acesso total: financeiro, integrações, disparos, configurações, usuários</p>
                </div>
                <div>
                  <p className="font-semibold flex items-center gap-1"><User className="w-3 h-3" /> Usuário</p>
                  <p className="text-muted-foreground">Operacional: CRM, chat, conteúdos, scripts, tarefas pessoais</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Teams */}
      {teams && teams.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Times</CardTitle>
            <CardDescription>Organize membros por equipe</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {teams.map(t => {
                const teamMembers = memberships?.filter(m => m.team_id === t.id) ?? [];
                return (
                  <div key={t.id} className="p-3 rounded-xl border bg-muted/10 text-center">
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-[10px] text-muted-foreground">{teamMembers.length} membro{teamMembers.length !== 1 ? "s" : ""}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {currentCount >= maxUsers && (
        <p className="text-xs text-muted-foreground text-center">Limite de usuários atingido. Faça upgrade para adicionar mais.</p>
      )}

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Convidar Usuário</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>E-mail</Label><Input value={inviteForm.email} onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })} placeholder="usuario@empresa.com" /></div>
            <div className="space-y-2"><Label>Nome</Label><Input value={inviteForm.full_name} onChange={e => setInviteForm({ ...inviteForm, full_name: e.target.value })} placeholder="Nome completo" /></div>
            <div className="space-y-2">
              <Label>Permissão</Label>
              <Select value={inviteForm.role} onValueChange={v => setInviteForm({ ...inviteForm, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cliente_admin">Admin</SelectItem>
                  <SelectItem value="cliente_user">Usuário</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <TeamSelector selectedIds={inviteTeamIds} onToggle={(id) => setInviteTeamIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancelar</Button>
            <Button onClick={() => inviteMutation.mutate()} disabled={inviteMutation.isPending || !inviteForm.email}>
              {inviteMutation.isPending ? "Enviando..." : "Convidar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EditMemberDialog
        open={!!editMember}
        onOpenChange={(open) => { if (!open) setEditMember(null); }}
        member={editMember}
        organizationId={orgId || ""}
        roleOptions={CLIENTE_ROLE_OPTIONS}
        onSuccess={() => setEditMember(null)}
      />

      {/* Profile Manager Dialog */}
      <Dialog open={profileManagerOpen} onOpenChange={setProfileManagerOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Perfis de Permissão</DialogTitle>
          </DialogHeader>

          <p className="text-xs text-muted-foreground">
            Crie perfis reutilizáveis para aplicar o mesmo conjunto de permissões a múltiplos usuários ou times.
          </p>

          {/* Lista de perfis existentes */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {permProfiles?.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">Nenhum perfil criado ainda</p>
            )}
            {permProfiles?.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    CRM: {p.crm_visibility === 'all' ? 'Todos' : p.crm_visibility === 'team' ? 'Time' : 'Próprios'} ·
                    {p.can_generate_content ? ' Roteiros ✓' : ''}
                    {p.can_generate_posts ? ' Artes ✓' : ''}
                    {p.can_generate_scripts ? ' Scripts ✓' : ''}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive h-7"
                  onClick={() => deleteProfile.mutate(p.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>

          {/* Criar novo perfil */}
          <div className="space-y-2 pt-2 border-t">
            <p className="text-xs font-semibold">Novo Perfil</p>
            <Input
              placeholder="Nome do perfil (ex: Vendedor)"
              value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
              className="h-8 text-xs"
            />
            <Button
              size="sm"
              className="w-full"
              disabled={!newProfileName.trim() || createProfile.isPending}
              onClick={() => {
                createProfile.mutate({
                  name: newProfileName.trim(),
                  crm_visibility: "own",
                  can_generate_content: false,
                  can_generate_posts: false,
                  can_generate_scripts: false,
                  can_use_whatsapp: true,
                  can_manage_crm: false,
                });
                setNewProfileName("");
              }}
            >
              Criar perfil
            </Button>
            <p className="text-[10px] text-muted-foreground">
              Após criar, edite as permissões de um usuário e selecione este perfil para configurar os detalhes.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NotificationsTab() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useUserProfile();
  const [notifications, setNotifications] = useState({ novosLeads: true, creditosBaixos: true, renovacao: true, whatsapp: false, relatorios: true });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (profile && !loaded) {
      const prefs = (profile as unknown as { notification_preferences?: Record<string, boolean> }).notification_preferences;
      if (prefs && typeof prefs === "object") setNotifications(prev => ({ ...prev, ...prefs }));
      setLoaded(true);
    }
  }, [profile, loaded]);

  const savePreference = async (key: string, value: boolean) => {
    const updated = { ...notifications, [key]: value };
    setNotifications(updated);
    try {
      const { error } = await supabase.from("profiles").update({ notification_preferences: updated } as Record<string, unknown>).eq("id", user?.id ?? "");
      if (error) throw error;
      toast.success(`${value ? "Ativado" : "Desativado"}`);
    } catch (err) { reportError(err, { title: "Erro ao salvar preferência", category: "configuracoes.preferences" }); }
  };

  if (isLoading) return <Skeleton className="h-64 rounded-xl" />;

  return (
    <Card>
      <CardHeader><CardTitle>Notificações</CardTitle><CardDescription>Escolha quais alertas deseja receber</CardDescription></CardHeader>
      <CardContent className="space-y-5">
        {[
          { key: "novosLeads", label: "Novos leads", desc: "Alerta quando um novo lead for captado" },
          { key: "creditosBaixos", label: "Créditos baixos", desc: "Aviso quando créditos estiverem abaixo de 20%" },
          { key: "renovacao", label: "Renovação de plano", desc: "Lembrete antes da renovação" },
          { key: "whatsapp", label: "Mensagens WhatsApp", desc: "Notificar novas mensagens" },
          { key: "relatorios", label: "Relatórios semanais", desc: "Relatório semanal por e-mail" },
        ].map(item => (
          <div key={item.key} className="flex items-center justify-between py-2">
            <div><p className="text-sm font-medium text-foreground">{item.label}</p><p className="text-xs text-muted-foreground">{item.desc}</p></div>
            <Switch checked={notifications[item.key as keyof typeof notifications]} onCheckedChange={v => savePreference(item.key, v)} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function ClienteConfiguracoes() {
  const { isAdmin } = useRoleAccess();

  return (
    <div className="w-full space-y-6">
      <PageHeader title="Configurações" subtitle="Preferências da conta e organização" icon={<Settings className="w-5 h-5 text-primary" />} />
      <Tabs defaultValue={new URLSearchParams(window.location.search).get("tab") || "perfil"}>
        <TabsList className={`grid w-full ${isAdmin ? "grid-cols-6" : "grid-cols-2"}`}>
          <TabsTrigger value="perfil" className="gap-1.5 text-xs sm:text-sm"><User className="w-4 h-4" /> Perfil</TabsTrigger>
          {isAdmin && <TabsTrigger value="organizacao" className="gap-1.5 text-xs sm:text-sm"><Building2 className="w-4 h-4" /> Organização</TabsTrigger>}
          {isAdmin && <TabsTrigger value="usuarios" className="gap-1.5 text-xs sm:text-sm"><Users className="w-4 h-4" /> Usuários</TabsTrigger>}
          {isAdmin && <TabsTrigger value="permissoes" className="gap-1.5 text-xs sm:text-sm"><Shield className="w-4 h-4" /> Permissões</TabsTrigger>}
          {isAdmin && <TabsTrigger value="notificacoes" className="gap-1.5 text-xs sm:text-sm"><Bell className="w-4 h-4" /> Alertas</TabsTrigger>}
          <TabsTrigger value="privacidade" className="gap-1.5 text-xs sm:text-sm"><Lock className="w-4 h-4" /> Privacidade</TabsTrigger>
        </TabsList>
        <TabsContent value="perfil"><ProfileTab /></TabsContent>
        {isAdmin && <TabsContent value="organizacao"><OrgTab /></TabsContent>}
        {isAdmin && <TabsContent value="usuarios"><UsersAndTeamsTab /></TabsContent>}
        {isAdmin && <TabsContent value="permissoes"><OrgPermissionsTab /></TabsContent>}
        {isAdmin && <TabsContent value="notificacoes"><NotificationsTab /></TabsContent>}
        <TabsContent value="privacidade"><LGPDSettings /></TabsContent>
      </Tabs>
    </div>
  );
}
