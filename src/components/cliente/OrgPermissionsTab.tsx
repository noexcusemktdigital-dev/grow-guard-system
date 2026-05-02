import { Shield, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PERMISSIONS,
  PERMISSION_GROUPS,
  useOrgPermissionsAdmin,
} from "@/hooks/useOrgPermissions";

interface OrgMember {
  user_id: string;
  role: string;
  full_name: string | null;
  email: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  cliente_admin: "Admin",
  cliente_user: "Usuário",
  admin: "Admin",
  super_admin: "Super Admin",
  franqueado: "Franqueado",
};

export function OrgPermissionsTab() {
  const { members, togglePermission } = useOrgPermissionsAdmin();

  if (members.isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const users = members.data?.users ?? [];
  const permsByUser = members.data?.permsByUser ?? {};

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <div>
            <CardTitle>Permissões avançadas</CardTitle>
            <CardDescription>
              Controle granular do que cada usuário pode fazer. Admins têm acesso total automaticamente.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhum usuário na organização ainda.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-background z-10 min-w-[220px]">
                    Usuário
                  </TableHead>
                  {PERMISSION_GROUPS.map((group) => {
                    const perms = PERMISSIONS.filter((p) => p.group === group);
                    return (
                      <TableHead
                        key={group}
                        colSpan={perms.length}
                        className="text-center border-l text-xs uppercase tracking-wide text-primary"
                      >
                        {group}
                      </TableHead>
                    );
                  })}
                </TableRow>
                <TableRow>
                  <TableHead className="sticky left-0 bg-background z-10" />
                  {PERMISSIONS.map((p, idx) => {
                    const isFirstOfGroup =
                      idx === 0 || PERMISSIONS[idx - 1].group !== p.group;
                    return (
                      <TableHead
                        key={p.key}
                        className={`text-center text-xs font-normal min-w-[110px] ${
                          isFirstOfGroup ? "border-l" : ""
                        }`}
                      >
                        {p.label}
                      </TableHead>
                    );
                  })}
                </TableRow>
              </TableHeader>
              <TableBody>
                {(users as OrgMember[]).map((u) => {
                  const isAdmin =
                    u.role === "cliente_admin" ||
                    u.role === "admin" ||
                    u.role === "super_admin";
                  const userPerms = permsByUser[u.user_id] ?? new Set<string>();
                  return (
                    <TableRow key={u.user_id}>
                      <TableCell className="sticky left-0 bg-background z-10">
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">
                            {u.full_name || "Sem nome"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {u.email}
                          </span>
                          <Badge
                            variant={isAdmin ? "default" : "outline"}
                            className="mt-1 w-fit text-xs"
                          >
                            {ROLE_LABELS[u.role] || u.role}
                          </Badge>
                        </div>
                      </TableCell>
                      {PERMISSIONS.map((p, idx) => {
                        const isFirstOfGroup =
                          idx === 0 || PERMISSIONS[idx - 1].group !== p.group;
                        const checked = isAdmin || userPerms.has(p.key);
                        return (
                          <TableCell
                            key={p.key}
                            className={`text-center ${
                              isFirstOfGroup ? "border-l" : ""
                            }`}
                          >
                            <Switch
                              checked={checked}
                              disabled={isAdmin || togglePermission.isPending}
                              onCheckedChange={(v) =>
                                togglePermission.mutate({
                                  userId: u.user_id,
                                  permission: p.key,
                                  granted: v,
                                })
                              }
                            />
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-4">
          💡 As alterações são salvas automaticamente. Administradores sempre têm acesso completo.
        </p>
      </CardContent>
    </Card>
  );
}
