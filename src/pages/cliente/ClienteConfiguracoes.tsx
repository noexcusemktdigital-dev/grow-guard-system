import { useState } from "react";
import { Settings, User, Building2, Users, Bell, Plus, Trash2, ChevronDown } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useClienteSubscription } from "@/hooks/useClienteSubscription";
import { useAuth } from "@/contexts/AuthContext";

export default function ClienteConfiguracoes() {
  const { user } = useAuth();
  const { data: subscription, isLoading } = useClienteSubscription();
  const [profile, setProfile] = useState({ name: user?.user_metadata?.full_name || "Admin", phone: "", cargo: "" });
  const [notifications, setNotifications] = useState({
    novosLeads: true, creditosBaixos: true, renovacao: true, whatsapp: false, relatorios: true,
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader title="Configurações" subtitle="Preferências da conta" icon={<Settings className="w-5 h-5 text-primary" />} />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader title="Configurações" subtitle="Preferências da conta e organização" icon={<Settings className="w-5 h-5 text-primary" />} />

      <Tabs defaultValue="perfil">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="perfil" className="gap-1.5 text-xs sm:text-sm"><User className="w-4 h-4" /> Perfil</TabsTrigger>
          <TabsTrigger value="plano" className="gap-1.5 text-xs sm:text-sm"><Building2 className="w-4 h-4" /> Plano</TabsTrigger>
          <TabsTrigger value="notificacoes" className="gap-1.5 text-xs sm:text-sm"><Bell className="w-4 h-4" /> Notificações</TabsTrigger>
        </TabsList>

        {/* Perfil */}
        <TabsContent value="perfil">
          <Card>
            <CardHeader>
              <CardTitle>Seu Perfil</CardTitle>
              <CardDescription>Informações pessoais da sua conta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                    {profile.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-foreground">{profile.name}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input value={user?.email || ""} readOnly className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} placeholder="(11) 99999-0000" />
                </div>
                <div className="space-y-2">
                  <Label>Cargo</Label>
                  <Input value={profile.cargo} onChange={e => setProfile({ ...profile, cargo: e.target.value })} placeholder="CEO" />
                </div>
              </div>
              <Button onClick={() => toast.success("Perfil salvo com sucesso!")}>Salvar Alterações</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Plano */}
        <TabsContent value="plano">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Plano Atual</CardTitle>
                  <CardDescription>Informações da sua assinatura</CardDescription>
                </div>
                <Badge variant={subscription?.status === "trial" ? "outline" : "default"}>
                  {subscription?.status === "trial" ? "🧪 Trial" : subscription?.status || "Inativo"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border">
                  <p className="text-[10px] text-muted-foreground uppercase">Plano</p>
                  <p className="text-lg font-bold capitalize">{subscription?.plan || "Sem plano"}</p>
                </div>
                <div className="p-4 rounded-lg border">
                  <p className="text-[10px] text-muted-foreground uppercase">Status</p>
                  <p className="text-lg font-bold capitalize">{subscription?.status || "Inativo"}</p>
                </div>
                {subscription?.expires_at && (
                  <div className="p-4 rounded-lg border col-span-2">
                    <p className="text-[10px] text-muted-foreground uppercase">Expira em</p>
                    <p className="text-lg font-bold">{new Date(subscription.expires_at).toLocaleDateString("pt-BR")}</p>
                  </div>
                )}
              </div>
              {!subscription && (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">Nenhuma assinatura ativa encontrada.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notificações */}
        <TabsContent value="notificacoes">
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
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch
                    checked={notifications[item.key as keyof typeof notifications]}
                    onCheckedChange={v => {
                      setNotifications({ ...notifications, [item.key]: v });
                      toast.success(`${item.label} ${v ? "ativado" : "desativado"}`);
                    }}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
