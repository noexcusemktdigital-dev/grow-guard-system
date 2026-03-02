import { useState, useEffect } from "react";
import { User, Mail, Phone, Briefcase, Calendar, Building2, Users, Edit2, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useOrgProfile } from "@/hooks/useOrgProfile";
import { useUnits } from "@/hooks/useUnits";
import { useOrgMembers } from "@/hooks/useOrgMembers";
import { useCrmLeads } from "@/hooks/useCrmLeads";
import { differenceInDays } from "date-fns";

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) {
  return (
    <Card className="hover:shadow-lg hover:border-primary/20 transition-all duration-300">
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 flex-shrink-0">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function FranqueadoraPerfil() {
  const { user } = useAuth();
  const { data: profile, isLoading, update } = useUserProfile();
  const { data: org, isLoading: orgLoading, update: updateOrg } = useOrgProfile();
  const { data: units } = useUnits();
  const { data: members } = useOrgMembers();
  const { data: leads } = useCrmLeads();

  const [editing, setEditing] = useState(false);
  const [editingOrg, setEditingOrg] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "", job_title: "" });
  const [orgForm, setOrgForm] = useState({ name: "", cnpj: "", email: "", phone: "", address: "", city: "", state: "" });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        job_title: profile.job_title || "",
      });
    }
  }, [profile]);

  useEffect(() => {
    if (org) {
      setOrgForm({
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

  if (isLoading || orgLoading) return <Skeleton className="h-96 rounded-xl" />;

  const displayName = form.full_name || "Usuário";
  const initials = displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const email = user?.email || "";
  const activeUnits = units?.filter((u) => u.status === "active")?.length ?? units?.length ?? 0;
  const totalLeads = leads?.length ?? 0;
  const totalMembers = members?.length ?? 0;
  const daysOperating = profile?.created_at ? differenceInDays(new Date(), new Date(profile.created_at)) : 0;

  const handleSave = () => {
    update.mutate(form);
    setEditing(false);
  };

  const handleSaveOrg = () => {
    updateOrg.mutate(orgForm);
    setEditingOrg(false);
  };

  return (
    <div className="w-full space-y-6">
      {/* Banner + Avatar */}
      <div className="relative">
        <div className="h-48 bg-gradient-to-br from-sidebar via-sidebar/90 to-primary/30 rounded-2xl overflow-hidden" />
        <div className="absolute -bottom-12 left-8 flex items-end gap-5 z-10">
          <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
            {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={displayName} />}
            <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="absolute top-4 right-4">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 bg-background/80 backdrop-blur-sm border-border/50"
            onClick={() => setEditing(!editing)}
          >
            <Edit2 className="w-3.5 h-3.5" />
            {editing ? "Cancelar" : "Editar Perfil"}
          </Button>
        </div>
      </div>

      {/* Profile Info */}
      <div className="pt-8 px-2">
        <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          {displayName}
        </h1>
        <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
          {form.job_title && (
            <span className="flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5" /> {form.job_title}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Mail className="w-3.5 h-3.5" /> {email}
          </span>
          {form.phone && (
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" /> {form.phone}
            </span>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Building2} label="Unidades Ativas" value={activeUnits} />
        <StatCard icon={Target} label="Leads da Rede" value={totalLeads} />
        <StatCard icon={Users} label="Membros da Equipe" value={totalMembers} />
        <StatCard icon={Calendar} label="Dias de Operação" value={daysOperating} />
      </div>

      {/* Edit Personal Form */}
      {editing && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informações Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input value={email} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(41) 99999-0000" />
              </div>
              <div className="space-y-2">
                <Label>Cargo</Label>
                <Input value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} placeholder="Diretor / CEO" />
              </div>
            </div>
            <Button onClick={handleSave} disabled={update.isPending}>
              {update.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Organization Data */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Dados da Organização</CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setEditingOrg(!editingOrg)}
          >
            <Edit2 className="w-3.5 h-3.5" />
            {editingOrg ? "Cancelar" : "Editar"}
          </Button>
        </CardHeader>
        <CardContent>
          {editingOrg ? (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome Fantasia</Label>
                  <Input value={orgForm.name} onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>CNPJ</Label>
                  <Input value={orgForm.cnpj} onChange={(e) => setOrgForm({ ...orgForm, cnpj: e.target.value })} placeholder="00.000.000/0000-00" />
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input value={orgForm.email} onChange={(e) => setOrgForm({ ...orgForm, email: e.target.value })} placeholder="contato@empresa.com" />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input value={orgForm.phone} onChange={(e) => setOrgForm({ ...orgForm, phone: e.target.value })} placeholder="(41) 3333-0000" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Endereço</Label>
                  <Input value={orgForm.address} onChange={(e) => setOrgForm({ ...orgForm, address: e.target.value })} placeholder="Rua, número, bairro" />
                </div>
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input value={orgForm.city} onChange={(e) => setOrgForm({ ...orgForm, city: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Input value={orgForm.state} onChange={(e) => setOrgForm({ ...orgForm, state: e.target.value })} placeholder="PR" />
                </div>
              </div>
              <Button onClick={handleSaveOrg} disabled={updateOrg.isPending}>
                {updateOrg.isPending ? "Salvando..." : "Salvar Dados da Organização"}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Nome Fantasia</p>
                <p className="font-medium text-foreground">{orgForm.name || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">CNPJ</p>
                <p className="font-medium text-foreground">{orgForm.cnpj || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">E-mail</p>
                <p className="font-medium text-foreground">{orgForm.email || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Telefone</p>
                <p className="font-medium text-foreground">{orgForm.phone || "—"}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-muted-foreground text-xs">Endereço</p>
                <p className="font-medium text-foreground">
                  {[orgForm.address, orgForm.city, orgForm.state].filter(Boolean).join(", ") || "—"}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
