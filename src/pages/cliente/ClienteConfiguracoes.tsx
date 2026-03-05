import { useState, useEffect, useRef } from "react";
import { Settings, User, Building2, Users, Bell, UserPlus, Copy, Shield, Camera } from "lucide-react";
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
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useOrgProfile } from "@/hooks/useOrgProfile";
import { useOrgMembers } from "@/hooks/useOrgMembers";
import { useClienteSubscription } from "@/hooks/useClienteSubscription";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { getPlanBySlug } from "@/constants/plans";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

function ProfileTab() {
  const { user } = useAuth();
  const { data: profile, isLoading, update } = useUserProfile();
  const [form, setForm] = useState({ full_name: "", phone: "", job_title: "" });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        job_title: profile.job_title || "",
      });
    }
  }, [profile]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) return toast.error("Imagem deve ter no máximo 2MB");

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      const urlWithCacheBuster = `${publicUrl}?t=${Date.now()}`;
      update.mutate({ avatar_url: urlWithCacheBuster });
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar foto");
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) return <Skeleton className="h-64 rounded-xl" />;

  const initials = (form.full_name || "U").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seu Perfil</CardTitle>
        <CardDescription>Informações pessoais da sua conta</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Avatar className="h-16 w-16">
              {profile?.avatar_url ? (
                <AvatarImage src={profile.avatar_url} alt="Foto de perfil" />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">{initials}</AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
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
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input value={user?.email || ""} readOnly className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label>Telefone</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(11) 99999-0000" />
          </div>
          <div className="space-y-2">
            <Label>Cargo</Label>
            <Input value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} placeholder="CEO" />
          </div>
        </div>
        <Button onClick={() => update.mutate(form)} disabled={update.isPending}>
          {update.isPending ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </CardContent>
    </Card>
  );
}

function OrgTab() {
  const { data: org, isLoading, update } = useOrgProfile();
  const [form, setForm] = useState({ name: "", cnpj: "", email: "", phone: "", address: "", city: "", state: "" });

  useEffect(() => {
    if (org) {
      setForm({
        name: org.name || "",
        cnpj: org.cnpj || "",
        email: org.email || "",
        phone: org.phone || "",
        address: org.address || "",
        city: org.city || "",
        state: org.state || "",
      });
    }
  }, [org]);

  if (isLoading) return <Skeleton className="h-64 rounded-xl" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados da Organização</CardTitle>
        <CardDescription>Informações da empresa</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nome da Empresa</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>CNPJ</Label>
            <Input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} placeholder="00.000.000/0001-00" />
          </div>
          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="contato@empresa.com" />
          </div>
          <div className="space-y-2">
            <Label>Telefone</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(11) 3333-0000" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Endereço</Label>
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Rua, número, bairro" />
          </div>
          <div className="space-y-2">
            <Label>Cidade</Label>
            <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Estado</Label>
            <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="SP" />
          </div>
        </div>
        <Button onClick={() => update.mutate(form)} disabled={update.isPending}>
          {update.isPending ? "Salvando..." : "Salvar Dados"}
        </Button>
      </CardContent>
    </Card>
  );
}

function UsersTab() {
  const { data: members, isLoading, refetch } = useOrgMembers();
  const { data: subscription } = useClienteSubscription();
  const { data: orgId } = useUserOrgId();
  const plan = getPlanBySlug(subscription?.plan);
  const maxUsers = plan?.maxUsers ?? 2;
  const currentCount = members?.length ?? 0;
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", full_name: "", role: "cliente_user" });
  const qc = useQueryClient();

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("invite-user", {
        body: { email: inviteForm.email, full_name: inviteForm.full_name, role: inviteForm.role, organization_id: orgId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      toast.success("Convite enviado! O usuário receberá um e-mail para definir sua senha.");
      setInviteOpen(false);
      setInviteForm({ email: "", full_name: "", role: "cliente_user" });
      qc.invalidateQueries({ queryKey: ["org-members"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const roleLabels: Record<string, string> = { cliente_admin: "Admin", cliente_user: "Usuário", super_admin: "Super Admin", admin: "Admin" };

  if (isLoading) return <Skeleton className="h-64 rounded-xl" />;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Usuários</CardTitle>
              <CardDescription>{currentCount}/{maxUsers} usuários · {maxUsers - currentCount > 0 ? `${maxUsers - currentCount} disponíveis` : "Limite atingido"}</CardDescription>
            </div>
            <Button size="sm" className="gap-1.5" onClick={() => setInviteOpen(true)} disabled={currentCount >= maxUsers}>
              <UserPlus className="w-4 h-4" /> Convidar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {members?.map((m) => (
              <div key={m.user_id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                      {(m.full_name || "U").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-foreground">{m.full_name || "Sem nome"}</p>
                    <p className="text-xs text-muted-foreground">{m.job_title || "—"}</p>
                  </div>
                </div>
                <Badge variant="outline" className="gap-1"><Shield className="w-3 h-3" />{roleLabels[m.role] || m.role}</Badge>
              </div>
            ))}
          </div>
          {currentCount >= maxUsers && (
            <p className="text-xs text-muted-foreground mt-4 text-center">Limite de usuários do plano atingido. Faça upgrade ou compre usuários adicionais (R$ 29/mês cada).</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Convidar Usuário</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>E-mail</Label><Input value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} placeholder="usuario@empresa.com" /></div>
            <div className="space-y-2"><Label>Nome</Label><Input value={inviteForm.full_name} onChange={(e) => setInviteForm({ ...inviteForm, full_name: e.target.value })} placeholder="Nome completo" /></div>
            <div className="space-y-2">
              <Label>Permissão</Label>
              <Select value={inviteForm.role} onValueChange={(v) => setInviteForm({ ...inviteForm, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cliente_admin">Admin</SelectItem>
                  <SelectItem value="cliente_user">Usuário</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancelar</Button>
            <Button onClick={() => inviteMutation.mutate()} disabled={inviteMutation.isPending || !inviteForm.email}>
              {inviteMutation.isPending ? "Enviando..." : "Convidar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function NotificationsTab() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useUserProfile();
  const [notifications, setNotifications] = useState({
    novosLeads: true, creditosBaixos: true, renovacao: true, whatsapp: false, relatorios: true,
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (profile && !loaded) {
      const prefs = (profile as any).notification_preferences;
      if (prefs && typeof prefs === "object") {
        setNotifications((prev) => ({ ...prev, ...prefs }));
      }
      setLoaded(true);
    }
  }, [profile, loaded]);

  const savePreference = async (key: string, value: boolean) => {
    const updated = { ...notifications, [key]: value };
    setNotifications(updated);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ notification_preferences: updated } as any)
        .eq("id", user!.id);
      if (error) throw error;
      toast.success(`${value ? "Ativado" : "Desativado"}`);
    } catch {
      toast.error("Erro ao salvar preferência");
    }
  };

  if (isLoading) return <Skeleton className="h-64 rounded-xl" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notificações</CardTitle>
        <CardDescription>Escolha quais alertas deseja receber</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {[
          { key: "novosLeads", label: "Novos leads", desc: "Receber alerta quando um novo lead for captado" },
          { key: "creditosBaixos", label: "Créditos baixos", desc: "Avisar quando créditos estiverem abaixo de 20%" },
          { key: "renovacao", label: "Renovação de plano", desc: "Lembrete antes da renovação automática" },
          { key: "whatsapp", label: "Mensagens WhatsApp", desc: "Notificar novas mensagens no WhatsApp" },
          { key: "relatorios", label: "Relatórios semanais", desc: "Receber relatório semanal por e-mail" },
        ].map((item) => (
          <div key={item.key} className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
            <Switch
              checked={notifications[item.key as keyof typeof notifications]}
              onCheckedChange={(v) => savePreference(item.key, v)}
            />
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
      <Tabs defaultValue="perfil">
        <TabsList className={`grid w-full ${isAdmin ? "grid-cols-4" : "grid-cols-1"}`}>
          <TabsTrigger value="perfil" className="gap-1.5 text-xs sm:text-sm"><User className="w-4 h-4" /> Perfil</TabsTrigger>
          {isAdmin && <TabsTrigger value="organizacao" className="gap-1.5 text-xs sm:text-sm"><Building2 className="w-4 h-4" /> Organização</TabsTrigger>}
          {isAdmin && <TabsTrigger value="usuarios" className="gap-1.5 text-xs sm:text-sm"><Users className="w-4 h-4" /> Usuários</TabsTrigger>}
          {isAdmin && <TabsTrigger value="notificacoes" className="gap-1.5 text-xs sm:text-sm"><Bell className="w-4 h-4" /> Alertas</TabsTrigger>}
        </TabsList>
        <TabsContent value="perfil"><ProfileTab /></TabsContent>
        {isAdmin && <TabsContent value="organizacao"><OrgTab /></TabsContent>}
        {isAdmin && <TabsContent value="usuarios"><UsersTab /></TabsContent>}
        {isAdmin && <TabsContent value="notificacoes"><NotificationsTab /></TabsContent>}
      </Tabs>
    </div>
  );
}
