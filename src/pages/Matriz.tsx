import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Shield, ArrowLeft, Plus, Inbox } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { usePermissionProfiles, usePermissionMutations } from "@/hooks/usePermissions";
import { toast } from "@/hooks/use-toast";

export default function Matriz() {
  const { data: profiles, isLoading } = usePermissionProfiles();
  const { createProfile } = usePermissionMutations();
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="page-header-title">Matriz</h1>
              <Badge variant="secondary">Franqueadora</Badge>
            </div>
            <p className="text-sm text-muted-foreground">Gestão de usuários e permissões da franqueadora</p>
          </div>
        </div>
        <Button onClick={() => createProfile.mutate({ name: "Novo Perfil" })}>
          <Plus className="w-4 h-4 mr-2" /> Novo Perfil
        </Button>
      </div>

      {(profiles ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Inbox className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-1">Nenhum perfil de permissão</h3>
          <p className="text-sm text-muted-foreground mb-4">Crie perfis para gerenciar permissões da equipe.</p>
          <Button onClick={() => createProfile.mutate({ name: "Super Admin", description: "Acesso total ao sistema" })}>
            <Plus className="w-4 h-4 mr-1" /> Criar Primeiro Perfil
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles!.map(p => (
            <Card key={p.id} className="p-4 cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{p.name}</h3>
                {p.is_system && <Badge variant="outline" className="text-[10px]">Sistema</Badge>}
              </div>
              {p.description && <p className="text-sm text-muted-foreground">{p.description}</p>}
              <p className="text-xs text-muted-foreground mt-2">Criado em {new Date(p.created_at).toLocaleDateString("pt-BR")}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
