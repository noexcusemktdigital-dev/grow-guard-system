// @ts-nocheck
import { useState, useEffect } from "react";
import { Shield, Users, FileText, Image, MessageCircle, Settings2, ChevronDown, ChevronUp, User, UserCheck } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  usePermissionProfiles,
  useMemberPermissionById,
  useSaveMemberPermission,
  type MemberPermissions,
} from "@/hooks/useMemberPermissions";
import { useToast } from "@/hooks/use-toast";

interface MemberPermissionsEditorProps {
  userId: string;
  userName: string;
}

const VISIBILITY_OPTIONS = [
  {
    value: "all" as const,
    label: "Todos os leads",
    desc: "Vê todos os leads da organização",
    icon: Users,
  },
  {
    value: "own" as const,
    label: "Apenas os próprios",
    desc: "Vê somente leads atribuídos a ele",
    icon: User,
  },
  {
    value: "team" as const,
    label: "Próprios + sem dono",
    desc: "Vê os seus leads e leads sem responsável",
    icon: UserCheck,
  },
];

const DEFAULT_PERMISSIONS: MemberPermissions = {
  crm_visibility: "own",
  can_generate_content: false,
  can_generate_posts: false,
  can_generate_scripts: false,
  can_use_whatsapp: true,
  can_manage_crm: false,
};

export function MemberPermissionsEditor({ userId, userName }: MemberPermissionsEditorProps) {
  const { toast } = useToast();
  const { data: profiles } = usePermissionProfiles();
  const { data: existing } = useMemberPermissionById(userId);
  const saveMutation = useSaveMemberPermission();

  const [selectedProfileId, setSelectedProfileId] = useState("custom");
  const [perms, setPerms] = useState(DEFAULT_PERMISSIONS);
  const [expanded, setExpanded] = useState(true);
  const [dirty, setDirty] = useState(false);

  // Carrega permissões existentes
  useEffect(() => {
    if (existing) {
      setSelectedProfileId(existing.profile_id || "custom");
      setPerms({
        crm_visibility: existing.crm_visibility || "own",
        can_generate_content: existing.can_generate_content ?? false,
        can_generate_posts: existing.can_generate_posts ?? false,
        can_generate_scripts: existing.can_generate_scripts ?? false,
        can_use_whatsapp: existing.can_use_whatsapp ?? true,
        can_manage_crm: existing.can_manage_crm ?? false,
      });
    }
  }, [existing]);

  const handleProfileChange = (profileId: string) => {
    setSelectedProfileId(profileId);
    if (profileId !== "custom") {
      const profile = profiles?.find(p => p.id === profileId);
      if (profile) {
        setPerms({
          crm_visibility: profile.crm_visibility,
          can_generate_content: profile.can_generate_content,
          can_generate_posts: profile.can_generate_posts,
          can_generate_scripts: profile.can_generate_scripts,
          can_use_whatsapp: profile.can_use_whatsapp,
          can_manage_crm: profile.can_manage_crm,
        });
      }
    }
    setDirty(true);
  };

  const handlePermChange = (key: keyof MemberPermissions, value: MemberPermissions[keyof MemberPermissions]) => {
    setSelectedProfileId("custom");
    setPerms(prev => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const handleSave = async () => {
    try {
      await saveMutation.mutateAsync({
        user_id: userId,
        profile_id: selectedProfileId !== "custom" ? selectedProfileId : null,
        crm_visibility: perms.crm_visibility,
        can_generate_content: perms.can_generate_content,
        can_generate_posts: perms.can_generate_posts,
        can_generate_scripts: perms.can_generate_scripts,
        can_use_whatsapp: perms.can_use_whatsapp,
        can_manage_crm: perms.can_manage_crm,
      });
      toast({ title: "Permissões salvas!", description: `Permissões de ${userName} atualizadas com sucesso.` });
      setDirty(false);
    } catch (err: unknown) {
      toast({ title: "Erro ao salvar", description: err instanceof Error ? err.message : "Erro desconhecido", variant: "destructive" });
    }
  };

  const crmVisibilityLabel = {
    all: "Todos os leads",
    team: "Próprios + sem dono",
    own: "Apenas os próprios",
  };

  return (
    <div className="mt-3">
      <Separator className="mb-3" />

      <button
        className="w-full flex items-center justify-between py-2 px-1 rounded hover:bg-muted/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Permissões de acesso</span>
          {!expanded && (
            <Badge variant="outline" className="text-xs font-normal">
              CRM: {crmVisibilityLabel[perms.crm_visibility]}
            </Badge>
          )}
        </div>

        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {expanded && (
        <Card className="mt-2">
          <CardContent className="pt-4 space-y-5">

            {/* Perfil reutilizável */}
            {profiles && profiles.length > 0 && (
              <div className="space-y-1">
                <Label className="text-xs">Usar perfil de permissões</Label>
                <Select value={selectedProfileId} onValueChange={handleProfileChange}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Personalizado</SelectItem>
                    {profiles.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Selecione um perfil para aplicar permissões pré-definidas
                </p>
              </div>
            )}

            {/* CRM */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-semibold">CRM</span>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Visibilidade de leads</Label>
                <RadioGroup
                  value={perms.crm_visibility}
                  onValueChange={(v: "all" | "team" | "own") => handlePermChange("crm_visibility", v)}
                  className="grid gap-2"
                >
                  {VISIBILITY_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const selected = perms.crm_visibility === opt.value;
                    return (
                      <label
                        key={opt.value}
                        htmlFor={`vis-${opt.value}`}
                        className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-all ${
                          selected
                            ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                            : "border-border hover:border-primary/40 hover:bg-muted/40"
                        }`}
                      >
                        <RadioGroupItem id={`vis-${opt.value}`} value={opt.value} className="mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                            <span className="text-sm font-medium">{opt.label}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                        </div>
                      </label>
                    );
                  })}
                </RadioGroup>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">Gerenciar CRM</p>
                  <p className="text-xs text-muted-foreground">Criar funis, automações e configurações</p>
                </div>
                <Switch
                  checked={perms.can_manage_crm}
                  onCheckedChange={(v) => handlePermChange("can_manage_crm", v)}
                />
              </div>
            </div>

            {/* Geração com créditos */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-semibold">Geração com créditos</span>
              </div>
              <p className="text-xs text-muted-foreground -mt-1">
                O usuário pode usar as ferramentas mas só gera conteúdo se habilitado
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm">Gerar Roteiros</p>
                    <p className="text-xs text-muted-foreground">Scripts e conteúdos de texto</p>
                  </div>
                </div>
                <Switch
                  checked={perms.can_generate_content}
                  onCheckedChange={(v) => handlePermChange("can_generate_content", v)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Image className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm">Gerar Postagens / Artes</p>
                    <p className="text-xs text-muted-foreground">Imagens e artes para redes sociais</p>
                  </div>
                </div>
                <Switch
                  checked={perms.can_generate_posts}
                  onCheckedChange={(v) => handlePermChange("can_generate_posts", v)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm">Gerar Scripts de Venda</p>
                    <p className="text-xs text-muted-foreground">Scripts personalizados pelo GPS</p>
                  </div>
                </div>
                <Switch
                  checked={perms.can_generate_scripts}
                  onCheckedChange={(v) => handlePermChange("can_generate_scripts", v)}
                />
              </div>
            </div>

            {/* WhatsApp */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm">Usar WhatsApp</p>
                    <p className="text-xs text-muted-foreground">Conversar com contatos (não pode comprar/configurar)</p>
                  </div>
                </div>
                <Switch
                  checked={perms.can_use_whatsapp}
                  onCheckedChange={(v) => handlePermChange("can_use_whatsapp", v)}
                />
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending || !dirty}
              className={`w-full ${dirty ? "opacity-100" : "opacity-50"}`}
              variant={dirty ? "default" : "outline"}
            >
              {saveMutation.isPending ? "Salvando..." : dirty ? "Salvar permissões ●" : "Permissões salvas ✓"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
