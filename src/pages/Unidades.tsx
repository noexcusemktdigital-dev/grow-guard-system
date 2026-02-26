import { useState } from "react";
import { Building2, ArrowLeft, Users, FileText, Settings, ClipboardList, Inbox, Plus, LayoutGrid, List } from "lucide-react";
import { UnidadeDadosEdit } from "@/components/unidades/UnidadeDadosEdit";
import { UnidadeUsuariosReal } from "@/components/unidades/UnidadeUsuariosReal";
import { UnidadeDocumentosReal } from "@/components/unidades/UnidadeDocumentosReal";
import { UnidadeFinanceiroReal } from "@/components/unidades/UnidadeFinanceiroReal";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUnits, useUnitMutations } from "@/hooks/useUnits";

export default function Unidades() {
  const { data: units, isLoading } = useUnits();
  const { createUnit } = useUnitMutations();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"card" | "list">("card");

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
      <div className="flex items-center justify-between">
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
        {!selected && (
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5 p-0.5 rounded-lg bg-muted/50 border">
              <Button variant={viewMode === "card" ? "default" : "ghost"} size="sm" className="h-7 px-2" onClick={() => setViewMode("card")}>
                <LayoutGrid className="w-3.5 h-3.5" />
              </Button>
              <Button variant={viewMode === "list" ? "default" : "ghost"} size="sm" className="h-7 px-2" onClick={() => setViewMode("list")}>
                <List className="w-3.5 h-3.5" />
              </Button>
            </div>
            <Button size="sm" onClick={() => createUnit.mutate({ name: "Nova Unidade" })}>
              <Plus className="w-4 h-4 mr-1" /> Nova Unidade
            </Button>
          </div>
        )}
      </div>

      {!selected ? (
        (units ?? []).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Inbox className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">Nenhuma unidade cadastrada</h3>
            <p className="text-sm text-muted-foreground mb-4">Cadastre a primeira unidade da rede.</p>
            <Button onClick={() => createUnit.mutate({ name: "Nova Unidade" })}>
              <Plus className="w-4 h-4 mr-1" /> Nova Unidade
            </Button>
          </div>
        ) : viewMode === "card" ? (
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
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cidade/Estado</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {units!.map(u => (
                  <TableRow key={u.id} className="cursor-pointer hover:bg-muted/30" onClick={() => setSelectedId(u.id)}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell>{u.city}{u.state ? `, ${u.state}` : ""}</TableCell>
                    <TableCell>{u.manager_name || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={u.status === "active" ? "default" : "secondary"} className="text-[10px]">
                        {u.status === "active" ? "Ativa" : u.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )
      ) : (
        <div className="animate-fade-in">
          <Tabs defaultValue="dados">
            <TabsList className="mb-6">
              <TabsTrigger value="dados" className="gap-2"><ClipboardList className="w-4 h-4" /> Dados</TabsTrigger>
              <TabsTrigger value="usuarios" className="gap-2"><Users className="w-4 h-4" /> Usuários</TabsTrigger>
              <TabsTrigger value="documentos" className="gap-2"><FileText className="w-4 h-4" /> Documentos</TabsTrigger>
              <TabsTrigger value="financeiro" className="gap-2"><Settings className="w-4 h-4" /> Financeiro</TabsTrigger>
            </TabsList>
            <TabsContent value="dados"><UnidadeDadosEdit unit={selected} /></TabsContent>
            <TabsContent value="usuarios"><UnidadeUsuariosReal unitOrgId={selected.unit_org_id} /></TabsContent>
            <TabsContent value="documentos"><UnidadeDocumentosReal unitId={selected.id} /></TabsContent>
            <TabsContent value="financeiro"><UnidadeFinanceiroReal unit={selected} /></TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
