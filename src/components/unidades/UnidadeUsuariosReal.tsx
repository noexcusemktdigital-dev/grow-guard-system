import { Users, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUnitMembers } from "@/hooks/useUnitMembers";

interface Props {
  unitOrgId: string | null | undefined;
}

export function UnidadeUsuariosReal({ unitOrgId }: Props) {
  const { data: members, isLoading } = useUnitMembers(unitOrgId);

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  if (!members || members.length === 0) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p>Nenhum membro vinculado a esta unidade.</p>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-in">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Membro</TableHead>
            <TableHead>Função</TableHead>
            <TableHead>Desde</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((m: any) => (
            <TableRow key={m.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={m.profiles?.avatar_url} />
                    <AvatarFallback>{(m.profiles?.full_name || "?").charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{m.profiles?.full_name || "Sem nome"}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {m.user_id?.slice(0, 8)}...
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{m.role || "membro"}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground text-xs">
                {new Date(m.created_at).toLocaleDateString("pt-BR")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
