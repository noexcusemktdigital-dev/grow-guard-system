// @ts-nocheck
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Users, Shield, UserX, Building2, Search, Eye, Pencil } from "lucide-react";
import { MatrizUser, MatrizArea, getAreaColor, areas, perfisPreConfigurados, getUserModulosHabilitados } from "@/types/matriz";

interface Props {
  users: MatrizUser[];
  onViewUser: (id: string) => void;
  onEditUser: (id: string) => void;
}

export function MatrizUserList({ users, onViewUser, onEditUser }: Props) {
  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const ativos = users.filter(u => u.status === "Ativo");
  const inativos = users.filter(u => u.status === "Inativo");
  const superAdmins = users.filter(u => u.perfilBase === "super_admin" && u.status === "Ativo");
  const areasRepresentadas = new Set(ativos.map(u => u.area)).size;

  const filtered = users.filter(u => {
    if (search && !u.nome.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    if (areaFilter !== "all" && u.area !== areaFilter) return false;
    if (statusFilter !== "all" && u.status !== statusFilter) return false;
    return true;
  });

  const stats = [
    { label: "Usuários Ativos", value: ativos.length, icon: Users, color: "text-emerald-500" },
    { label: "Áreas Representadas", value: areasRepresentadas, icon: Building2, color: "text-blue-500" },
    { label: "Super Admins", value: superAdmins.length, icon: Shield, color: "text-amber-500" },
    { label: "Usuários Inativos", value: inativos.length, icon: UserX, color: "text-muted-foreground" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`w-8 h-8 ${s.color}`} />
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou email..." value={search} onChange={e => setSearch(e.target.value)} aria-label="Buscar por nome ou email" className="pl-9" />
        </div>
        <Select value={areaFilter} onValueChange={setAreaFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Área" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as áreas</SelectItem>
            {areas.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="Ativo">Ativo</SelectItem>
            <SelectItem value="Inativo">Inativo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Área</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Último Login</TableHead>
                <TableHead>Módulos</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(user => {
                const habilitados = getUserModulosHabilitados(user);
                const perfil = perfisPreConfigurados.find(p => p.id === user.perfilBase);
                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.nome}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{user.email}</TableCell>
                    <TableCell>{user.cargo}</TableCell>
                    <TableCell><Badge variant="secondary" className={getAreaColor(user.area)}>{user.area}</Badge></TableCell>
                    <TableCell>
                      <Badge variant={user.status === "Ativo" ? "default" : "secondary"}
                        className={user.status === "Ativo" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : ""}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{user.lastLogin}</TableCell>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge variant="outline">{habilitados.length}</Badge>
                        </TooltipTrigger>
                        <TooltipContent><p className="text-xs max-w-[200px]">{habilitados.join(", ") || "Nenhum"}</p></TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="text-sm">{perfil?.nome || "Personalizado"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => onViewUser(user.id)} aria-label="Visualizar"><Eye className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => onEditUser(user.id)} aria-label="Editar"><Pencil className="w-4 h-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Nenhum usuário encontrado</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
