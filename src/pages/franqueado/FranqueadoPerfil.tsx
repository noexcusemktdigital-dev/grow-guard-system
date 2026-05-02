// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import { Mail, Phone, Briefcase, Calendar, Target, FileText, Users, Edit2, Camera } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useContracts } from "@/hooks/useContracts";
import { useCrmLeads } from "@/hooks/useCrmLeads";
import { supabase } from "@/lib/supabase";
import { differenceInDays } from "date-fns";
import { toast } from "sonner";
import { reportError } from "@/lib/error-toast";

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

export default function FranqueadoPerfil() {
  const { user } = useAuth();
  const { data: profile, isLoading, update } = useUserProfile();
  const { data: contracts } = useContracts();
  const { data: leads } = useCrmLeads();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "", job_title: "" });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        job_title: profile.job_title || "",
      });
    }
  }, [profile]);

  if (isLoading) return <Skeleton className="h-96 rounded-xl" />;

  const displayName = form.full_name || "Usuário";
  const initials = displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const email = user?.email || "";
  const activeContracts = contracts?.filter((c) => c.status === "active" || c.status === "signed")?.length ?? 0;
  const totalLeads = leads?.length ?? 0;
  const proposalsSent = contracts?.filter((c) => c.status === "sent")?.length ?? 0;
  const daysInNetwork = profile?.created_at ? differenceInDays(new Date(), new Date(profile.created_at)) : 0;

  const handleSave = () => {
    update.mutate(form);
    setEditing(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      reportError(new Error("A imagem deve ter no máximo 2MB"), { title: "A imagem deve ter no máximo 2MB", category: "perfil.avatar_size" });
      return;
    }

    const ext = file.name.split(".").pop() || "png";
    const path = `${user.id}/avatar.${ext}`;

    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) {
      reportError(error, { title: "Erro ao enviar imagem", category: "perfil.avatar_upload" });
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const avatar_url = `${urlData.publicUrl}?t=${Date.now()}`;
    update.mutate({ avatar_url });
  };

  return (
    <div className="w-full space-y-6">
      {/* Banner + Avatar */}
      <div className="relative">
        <div className="h-48 bg-gradient-to-br from-sidebar via-sidebar/90 to-primary/30 rounded-2xl overflow-hidden" />
        <div className="absolute -bottom-12 left-8 flex items-end gap-5 z-10">
          <div
            className="relative group cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
              {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={displayName} />}
              <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>
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
        <StatCard icon={FileText} label="Contratos Ativos" value={activeContracts} />
        <StatCard icon={Target} label="Leads no CRM" value={totalLeads} />
        <StatCard icon={Users} label="Propostas Enviadas" value={proposalsSent} />
        <StatCard icon={Calendar} label="Dias na Rede" value={daysInNetwork} />
      </div>

      {/* Edit Form */}
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
                <Input value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} placeholder="Sócio / Gestor" />
              </div>
            </div>
            <Button onClick={handleSave} disabled={update.isPending}>
              {update.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
