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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  mockOrganization, mockTeamMembers, mockPlans, mockSubscription,
  roleDescriptions, type UserRole, type TeamMember,
} from "@/data/clienteData";

export default function ClienteConfiguracoes() {
  const [profile, setProfile] = useState({ name: "Admin", phone: "(11) 99999-0000", cargo: "CEO" });
  const [org, setOrg] = useState({ ...mockOrganization });
  const [members, setMembers] = useState<TeamMember[]>([...mockTeamMembers]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [newInvite, setNewInvite] = useState({ email: "", role: "operador" as UserRole });
  const [notifications, setNotifications] = useState({
    novosLeads: true, creditosBaixos: true, renovacao: true, whatsapp: false, relatorios: true,
  });
  const [rolesOpen, setRolesOpen] = useState(false);

  const currentPlan = mockPlans.find(p => p.id === mockSubscription.planId);
  const maxUsers = currentPlan?.maxUsers || 5;

  const handleInvite = () => {
    if (!newInvite.email) return;
    const member: TeamMember = {
      id: `u${members.length + 1}`,
      name: newInvite.email.split("@")[0],
      email: newInvite.email,
      role: newInvite.role,
      status: "convidado",
      lastLogin: "—",
    };
    setMembers([...members, member]);
    setNewInvite({ email: "", role: "operador" });
    setInviteOpen(false);
    toast.success("Convite enviado com sucesso!");
  };

  const removeMember = (id: string) => {
    setMembers(members.filter(m => m.id !== id));
    toast.success("Membro removido");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader title="Configurações" subtitle="Preferências da conta e organização" icon={<Settings className="w-5 h-5 text-primary" />} />

      <Tabs defaultValue="perfil">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="perfil" className="gap-1.5 text-xs sm:text-sm"><User className="w-4 h-4" /> Perfil</TabsTrigger>
          <TabsTrigger value="organizacao" className="gap-1.5 text-xs sm:text-sm"><Building2 className="w-4 h-4" /> Organização</TabsTrigger>
          <TabsTrigger value="equipe" className="gap-1.5 text-xs sm:text-sm"><Users className="w-4 h-4" /> Equipe</TabsTrigger>
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
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">AD</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-foreground">{profile.name}</p>
                  <p className="text-sm text-muted-foreground">admin@minhaempresa.com</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input value="admin@minhaempresa.com" readOnly className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Cargo</Label>
                  <Input value={profile.cargo} onChange={e => setProfile({ ...profile, cargo: e.target.value })} />
                </div>
              </div>
              <Button onClick={() => toast.success("Perfil salvo com sucesso!")}>Salvar Alterações</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Organização */}
        <TabsContent value="organizacao">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Organização</CardTitle>
                  <CardDescription>Dados da sua empresa</CardDescription>
                </div>
                <Badge variant={org.status === "trial" ? "outline" : "default"}>
                  {org.status === "trial" ? "🧪 Trial" : org.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome da empresa</Label>
                  <Input value={org.name} onChange={e => setOrg({ ...org, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>CNPJ</Label>
                  <Input value={org.cnpj} onChange={e => setOrg({ ...org, cnpj: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Segmento</Label>
                  <Input value={org.segmento} onChange={e => setOrg({ ...org, segmento: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Fuso horário</Label>
                  <Select value={org.fusoHorario} onValueChange={v => setOrg({ ...org, fusoHorario: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Sao_Paulo">São Paulo (GMT-3)</SelectItem>
                      <SelectItem value="America/Manaus">Manaus (GMT-4)</SelectItem>
                      <SelectItem value="America/Bahia">Bahia (GMT-3)</SelectItem>
                      <SelectItem value="America/Fortaleza">Fortaleza (GMT-3)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={() => toast.success("Organização salva!")}>Salvar</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Equipe */}
        <TabsContent value="equipe">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <CardTitle>Equipe</CardTitle>
                  <CardDescription>{members.length} de {maxUsers} usuários</CardDescription>
                </div>
                <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-1.5" disabled={members.length >= maxUsers}>
                      <Plus className="w-4 h-4" /> Convidar Membro
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Convidar Membro</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-2">
                      <div className="space-y-2">
                        <Label>E-mail</Label>
                        <Input placeholder="email@empresa.com" value={newInvite.email} onChange={e => setNewInvite({ ...newInvite, email: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Role</Label>
                        <Select value={newInvite.role} onValueChange={v => setNewInvite({ ...newInvite, role: v as UserRole })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {(Object.keys(roleDescriptions) as UserRole[]).map(r => (
                              <SelectItem key={r} value={r}>{roleDescriptions[r].label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleInvite} disabled={!newInvite.email}>Enviar Convite</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Último acesso</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map(m => {
                    const rd = roleDescriptions[m.role];
                    return (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium text-foreground">{m.name}</TableCell>
                        <TableCell className="text-sm">{m.email}</TableCell>
                        <TableCell><Badge className={rd.color}>{rd.label}</Badge></TableCell>
                        <TableCell>
                          <Badge variant={m.status === "ativo" ? "default" : m.status === "convidado" ? "outline" : "secondary"}>
                            {m.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{m.lastLogin}</TableCell>
                        <TableCell>
                          {m.role !== "admin" && (
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeMember(m.id)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <Collapsible open={rolesOpen} onOpenChange={setRolesOpen}>
                <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  <ChevronDown className={`w-4 h-4 transition-transform ${rolesOpen ? "rotate-180" : ""}`} />
                  Descrição dos Roles
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(Object.entries(roleDescriptions) as [UserRole, typeof roleDescriptions[UserRole]][]).map(([key, rd]) => (
                      <div key={key} className="p-3 rounded-lg border bg-card">
                        <Badge className={rd.color}>{rd.label}</Badge>
                        <p className="text-sm text-muted-foreground mt-1.5">{rd.description}</p>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
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
