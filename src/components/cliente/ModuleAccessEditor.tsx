import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

export const MODULES = [
  { key: "crm", label: "CRM", icon: "👥" },
  { key: "whatsapp", label: "WhatsApp", icon: "💬" },
  { key: "trafego_pago", label: "Tráfego Pago", icon: "📊" },
  { key: "redes_sociais", label: "Redes Sociais", icon: "📱" },
  { key: "postagem", label: "Postagem", icon: "🎨" },
  { key: "roteiro", label: "Roteiro", icon: "📝" },
  { key: "sites", label: "Sites", icon: "🌐" },
  { key: "financeiro", label: "Financeiro", icon: "💰" },
  { key: "agentes_ia", label: "Agentes IA", icon: "🤖" },
  { key: "disparos", label: "Disparos", icon: "🚀" },
  { key: "relatorios", label: "Relatórios", icon: "📈" },
] as const;

export const CRM_SUB_PERMISSIONS = [
  { key: "crm.create_lead", label: "Criar leads" },
  { key: "crm.edit_lead", label: "Editar leads" },
  { key: "crm.delete_lead", label: "Excluir leads" },
  { key: "crm.mark_won", label: "Marcar como ganho" },
  { key: "crm.mark_lost", label: "Marcar como perdido" },
  { key: "crm.import", label: "Importar planilha" },
  { key: "crm.export", label: "Exportar leads" },
] as const;

interface Props {
  userId: string;
}

export function ModuleAccessEditor({ userId }: Props) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: orgId } = useUserOrgId();

  const { data: rows, isLoading } = useQuery({
    queryKey: ["module-access", userId, orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("org_user_permissions")
        .select("permission, granted")
        .eq("user_id", userId)
        .eq("organization_id", orgId);
      if (error) throw error;
      return (data ?? []) as Array<{ permission: string; granted: boolean }>;
    },
    enabled: !!orgId && !!userId,
  });

  const granted = useMemo(() => {
    const s = new Set<string>();
    (rows ?? []).forEach((r) => r.granted && s.add(r.permission));
    return s;
  }, [rows]);

  const toggle = useMutation({
    mutationFn: async ({ permission, value }: { permission: string; value: boolean }) => {
      if (!orgId) throw new Error("Org não encontrada");
      const { error } = await supabase
        .from("org_user_permissions")
        .upsert(
          {
            organization_id: orgId,
            user_id: userId,
            permission,
            granted: value,
            granted_by: user?.id ?? null,
          },
          { onConflict: "organization_id,user_id,permission" },
        );
      if (error) throw error;
    },
    onMutate: async ({ permission, value }) => {
      await qc.cancelQueries({ queryKey: ["module-access", userId, orgId] });
      const prev = qc.getQueryData(["module-access", userId, orgId]) as Array<{ permission: string; granted: boolean }>;
      const next = [...(prev ?? []).filter((r) => r.permission !== permission), { permission, granted: value }];
      qc.setQueryData(["module-access", userId, orgId], next);
      return { prev };
    },
    onError: (err: Error, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["module-access", userId, orgId], ctx.prev);
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["module-access", userId, orgId] });
      qc.invalidateQueries({ queryKey: ["org-user-permissions-self"] });
    },
  });

  const crmEnabled = granted.has("module.crm");

  return (
    <Card className="mt-3">
      <CardContent className="pt-4 space-y-4">
        <div>
          <Label className="text-sm font-semibold">Acesso aos módulos</Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Controle quais módulos do sistema este usuário pode visualizar.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {MODULES.map((m) => {
            const key = `module.${m.key}`;
            const checked = granted.has(key);
            return (
              <div
                key={m.key}
                className="flex items-center justify-between rounded-md border px-3 py-2 hover:bg-muted/40"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{m.icon}</span>
                  <span className="text-sm">{m.label}</span>
                </div>
                <Switch
                  checked={checked}
                  disabled={isLoading || toggle.isPending}
                  onCheckedChange={(v) => toggle.mutate({ permission: key, value: v })}
                />
              </div>
            );
          })}
        </div>

        {crmEnabled && (
          <>
            <Separator />
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Permissões do CRM
              </Label>
              <div className="mt-2 space-y-1.5">
                {CRM_SUB_PERMISSIONS.map((p) => {
                  const checked = granted.has(p.key);
                  return (
                    <div key={p.key} className="flex items-center justify-between py-1">
                      <span className="text-sm">{p.label}</span>
                      <Switch
                        checked={checked}
                        disabled={isLoading || toggle.isPending}
                        onCheckedChange={(v) => toggle.mutate({ permission: p.key, value: v })}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        <p className="text-[10px] text-muted-foreground text-center">
          💾 Alterações são salvas automaticamente.
        </p>
      </CardContent>
    </Card>
  );
}
