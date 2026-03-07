import { useState, useEffect } from "react";
import { Settings, Building2, Users, FileSignature, UserPlus, Shield, Download, Link2, Copy, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useUnits, useUnitMutations } from "@/hooks/useUnits";
import { useOrgMembers } from "@/hooks/useOrgMembers";
import { useContracts } from "@/hooks/useContracts";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

/* ── Aba Dados da Unidade ── */
function UnitDataTab() {
  const { data: units, isLoading } = useUnits();
  const { updateUnit } = useUnitMutations();
  const unit = units?.[0]; // franqueado tem 1 unidade

  const [form, setForm] = useState({
    name: "", city: "", state: "", address: "", phone: "", email: "",
  });

  useEffect(() => {
    if (unit) {
      setForm({
        name: unit.name || "",
        city: unit.city || "",
        state: unit.state || "",
        address: unit.address || "",
        phone: unit.phone || "",
        email: unit.email || "",
      });
    }
  }, [unit]);

  if (isLoading) return <Skeleton className="h-64 rounded-xl" />;
  if (!unit) return <p className="text-muted-foreground text-sm">Nenhuma unidade vinculada.</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados da Unidade</CardTitle>
        <CardDescription>Informações cadastrais da sua unidade</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nome da Unidade</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="unidade@empresa.com" />
          </div>
          <div className="space-y-2">
            <Label>Telefone</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(41) 3333-0000" />
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
            <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="PR" />
          </div>
        </div>

        {/* Readonly financial fields */}
        {(unit as any).cnpj && (
          <div className="pt-4 border-t border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Dados Financeiros (somente leitura)</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">CNPJ</Label>
                <Input value={(unit as any).cnpj || ""} readOnly className="bg-muted" />
              </div>
            </div>
          </div>
        )}

        <Button
          onClick={() => updateUnit.mutate({ id: unit.id, ...form })}
          disabled={updateUnit.isPending}
        >
          {updateUnit.isPending ? "Salvando..." : "Salvar Dados"}
        </Button>
      </CardContent>
    </Card>
  );
}

/* ── Aba Equipe ── */
function TeamTab() {
  const { data: members, isLoading } = useOrgMembers();
  const { data: orgId } = useUserOrgId();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", full_name: "", role: "cliente_user" });
  const qc = useQueryClient();

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("invite-user", {
        body: {
          email: inviteForm.email,
          full_name: inviteForm.full_name,
          role: inviteForm.role,
          organization_id: orgId,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      toast.success("Convite enviado! O funcionário receberá um e-mail para definir sua senha.");
      setInviteOpen(false);
      setInviteForm({ email: "", full_name: "", role: "cliente_user" });
      qc.invalidateQueries({ queryKey: ["org-members"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const roleLabels: Record<string, string> = {
    franqueado: "Admin",
    cliente_user: "Operador",
    super_admin: "Super Admin",
    admin: "Admin",
    cliente_admin: "Admin",
  };

  if (isLoading) return <Skeleton className="h-64 rounded-xl" />;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Equipe da Unidade</CardTitle>
              <CardDescription>{members?.length ?? 0} membro(s)</CardDescription>
            </div>
            <Button size="sm" className="gap-1.5" onClick={() => setInviteOpen(true)}>
              <UserPlus className="w-4 h-4" /> Convidar Funcionário
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
                <Badge variant="outline" className="gap-1">
                  <Shield className="w-3 h-3" />
                  {roleLabels[m.role] || m.role}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Convidar Funcionário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} placeholder="funcionario@empresa.com" />
            </div>
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={inviteForm.full_name} onChange={(e) => setInviteForm({ ...inviteForm, full_name: e.target.value })} placeholder="Nome completo" />
            </div>
            <div className="space-y-2">
              <Label>Permissão</Label>
              <Select value={inviteForm.role} onValueChange={(v) => setInviteForm({ ...inviteForm, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="franqueado">Admin (Franqueado)</SelectItem>
                  <SelectItem value="cliente_user">Operador</SelectItem>
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

/* ── Aba Contrato de Franquia ── */
function ContractTab() {
  const { data: contracts, isLoading } = useContracts();

  if (isLoading) return <Skeleton className="h-64 rounded-xl" />;

  const franchiseContracts = contracts?.filter(
    (c) => c.title?.toLowerCase().includes("franquia") || c.title?.toLowerCase().includes("franchise")
  ) ?? contracts?.slice(0, 3) ?? [];

  if (franchiseContracts.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileSignature className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">Nenhum contrato de franquia encontrado.</p>
          <p className="text-xs text-muted-foreground mt-1">Entre em contato com a franqueadora.</p>
        </CardContent>
      </Card>
    );
  }

  const statusLabels: Record<string, string> = {
    draft: "Rascunho",
    sent: "Enviado",
    signed: "Assinado",
    active: "Ativo",
    expired: "Expirado",
    cancelled: "Cancelado",
  };

  const statusColors: Record<string, string> = {
    active: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    signed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    draft: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    sent: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    expired: "bg-red-500/10 text-red-600 border-red-500/20",
    cancelled: "bg-red-500/10 text-red-600 border-red-500/20",
  };

  return (
    <div className="space-y-4">
      {franchiseContracts.map((contract) => (
        <Card key={contract.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{contract.title}</CardTitle>
              <Badge variant="outline" className={statusColors[contract.status] || ""}>
                {statusLabels[contract.status] || contract.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {contract.start_date && (
                <div>
                  <p className="text-xs text-muted-foreground">Início</p>
                  <p className="font-medium text-foreground">{format(new Date(contract.start_date), "dd/MM/yyyy")}</p>
                </div>
              )}
              {contract.end_date && (
                <div>
                  <p className="text-xs text-muted-foreground">Término</p>
                  <p className="font-medium text-foreground">{format(new Date(contract.end_date), "dd/MM/yyyy")}</p>
                </div>
              )}
              {contract.monthly_value != null && (
                <div>
                  <p className="text-xs text-muted-foreground">Valor Mensal</p>
                  <p className="font-medium text-foreground">
                    {Number(contract.monthly_value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </p>
                </div>
              )}
              {contract.duration_months && (
                <div>
                  <p className="text-xs text-muted-foreground">Duração</p>
                  <p className="font-medium text-foreground">{contract.duration_months} meses</p>
                </div>
              )}
            </div>
            {contract.service_description && (
              <p className="text-sm text-muted-foreground mt-4 border-t border-border pt-3">{contract.service_description}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ── Página Principal ── */
export default function FranqueadoConfiguracoes() {
  return (
    <div className="w-full space-y-6">
      <PageHeader title="Configurações" subtitle="Gerencie sua unidade, equipe e contratos" icon={<Settings className="w-5 h-5 text-primary" />} />

      <Tabs defaultValue="unidade">
        <TabsList className="grid grid-cols-3 w-full max-w-lg">
          <TabsTrigger value="unidade" className="gap-1.5 text-xs sm:text-sm"><Building2 className="w-4 h-4" /> Unidade</TabsTrigger>
          <TabsTrigger value="equipe" className="gap-1.5 text-xs sm:text-sm"><Users className="w-4 h-4" /> Equipe</TabsTrigger>
          <TabsTrigger value="contrato" className="gap-1.5 text-xs sm:text-sm"><FileSignature className="w-4 h-4" /> Contrato</TabsTrigger>
        </TabsList>

        <TabsContent value="unidade"><UnitDataTab /></TabsContent>
        <TabsContent value="equipe"><TeamTab /></TabsContent>
        <TabsContent value="contrato"><ContractTab /></TabsContent>
      </Tabs>
    </div>
  );
}