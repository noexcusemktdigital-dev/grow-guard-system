import { useState } from "react";
import { Building2, ArrowLeft, Users, FileText, Settings, ClipboardList, Inbox, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUnits, useUnitMutations } from "@/hooks/useUnits";

export default function Unidades() {
  const { data: units, isLoading } = useUnits();
  const { createUnit } = useUnitMutations();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = (units ?? []).find(u => u.id === selectedId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        {selected && (
          <Button variant="ghost" size="icon" onClick={() => setSelectedId(null)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" />
            <h1 className="page-header-title">{selected ? selected.name : "Unidades da Rede"}</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {selected ? "Gerenciamento da unidade" : "Cadastro e gerenciamento das franquias da rede"}
          </p>
        </div>
      </div>

      {!selected ? (
        <>
          {(units ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Inbox className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-1">Nenhuma unidade cadastrada</h3>
              <p className="text-sm text-muted-foreground mb-4">Cadastre a primeira unidade da rede.</p>
              <Button onClick={() => createUnit.mutate({ name: "Nova Unidade" })}>
                <Plus className="w-4 h-4 mr-1" /> Nova Unidade
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {units!.map(u => (
                <Card key={u.id} className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedId(u.id)}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{u.name}</h3>
                    <Badge variant={u.status === "active" ? "default" : "secondary"} className="text-[10px]">{u.status === "active" ? "Ativa" : u.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{u.city}{u.state ? `, ${u.state}` : ""}</p>
                  {u.manager_name && <p className="text-xs text-muted-foreground mt-1">Responsável: {u.manager_name}</p>}
                </Card>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="animate-fade-in">
          <Tabs defaultValue="dados">
            <TabsList className="mb-6">
              <TabsTrigger value="dados" className="gap-2"><ClipboardList className="w-4 h-4" /> Dados</TabsTrigger>
              <TabsTrigger value="usuarios" className="gap-2"><Users className="w-4 h-4" /> Usuários</TabsTrigger>
              <TabsTrigger value="documentos" className="gap-2"><FileText className="w-4 h-4" /> Documentos</TabsTrigger>
              <TabsTrigger value="financeiro" className="gap-2"><Settings className="w-4 h-4" /> Financeiro</TabsTrigger>
            </TabsList>
            <TabsContent value="dados">
              <Card className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground">Nome:</span> <span className="font-medium">{selected.name}</span></div>
                  <div><span className="text-muted-foreground">Status:</span> <span className="font-medium">{selected.status}</span></div>
                  <div><span className="text-muted-foreground">Cidade:</span> <span className="font-medium">{selected.city || "—"}</span></div>
                  <div><span className="text-muted-foreground">Estado:</span> <span className="font-medium">{selected.state || "—"}</span></div>
                  <div><span className="text-muted-foreground">Telefone:</span> <span className="font-medium">{selected.phone || "—"}</span></div>
                  <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{selected.email || "—"}</span></div>
                  <div><span className="text-muted-foreground">Responsável:</span> <span className="font-medium">{selected.manager_name || "—"}</span></div>
                </div>
              </Card>
            </TabsContent>
            <TabsContent value="usuarios"><Card className="p-6 text-center text-muted-foreground">Nenhum usuário vinculado a esta unidade.</Card></TabsContent>
            <TabsContent value="documentos"><Card className="p-6 text-center text-muted-foreground">Nenhum documento cadastrado.</Card></TabsContent>
            <TabsContent value="financeiro"><Card className="p-6 text-center text-muted-foreground">Configuração financeira não definida.</Card></TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
