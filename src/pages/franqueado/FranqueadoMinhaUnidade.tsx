// @ts-nocheck
import { useState } from "react";
import { Building2, FileText, Users, DollarSign, AlertTriangle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { UnidadeDadosEdit } from "@/components/unidades/UnidadeDadosEdit";
import { UnidadeUsuariosReal } from "@/components/unidades/UnidadeUsuariosReal";
import { UnidadeDocumentosReal } from "@/components/unidades/UnidadeDocumentosReal";
import { UnidadeFinanceiroReal } from "@/components/unidades/UnidadeFinanceiroReal";

export default function FranqueadoMinhaUnidade() {
  const { data: orgId } = useUserOrgId();
  const [tab, setTab] = useState("dados");

  // Find the unit linked to this franchisee's org
  const { data: unit, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["my-unit", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("units")
        .select("*")
        .eq("unit_org_id", orgId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  if (isLoading) {
    return (
      <div className="w-full space-y-6">
        <PageHeader title="Minha Unidade" subtitle="Dados e gestão da sua unidade" icon={<Building2 className="w-5 h-5 text-primary" />} />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full space-y-6">
        <PageHeader title="Minha Unidade" subtitle="Dados e gestão da sua unidade" icon={<Building2 className="w-5 h-5 text-primary" />} />
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6">
          <h3 className="font-semibold text-destructive mb-1 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Erro ao carregar unidade
          </h3>
          <p className="text-sm text-muted-foreground">{error instanceof Error ? error.message : "Não foi possível carregar os dados da unidade."}</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={() => refetch()}>Tentar novamente</Button>
        </div>
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="w-full space-y-6">
        <PageHeader title="Minha Unidade" subtitle="Dados e gestão da sua unidade" icon={<Building2 className="w-5 h-5 text-primary" />} />
        <Card className="p-8 text-center text-muted-foreground">
          <Building2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>Nenhuma unidade vinculada à sua conta.</p>
          <p className="text-xs mt-1">Entre em contato com a franqueadora para vincular sua unidade.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full space-y-5">
      <PageHeader
        title="Minha Unidade"
        subtitle={unit.name || "Gestão da sua unidade"}
        icon={<Building2 className="w-5 h-5 text-primary" />}
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="dados" className="gap-1.5"><Building2 className="w-3.5 h-3.5" /> Dados</TabsTrigger>
          <TabsTrigger value="usuarios" className="gap-1.5"><Users className="w-3.5 h-3.5" /> Usuários</TabsTrigger>
          <TabsTrigger value="documentos" className="gap-1.5"><FileText className="w-3.5 h-3.5" /> Documentos</TabsTrigger>
          <TabsTrigger value="financeiro" className="gap-1.5"><DollarSign className="w-3.5 h-3.5" /> Financeiro</TabsTrigger>
        </TabsList>

        <TabsContent value="dados">
          <UnidadeDadosEdit unit={unit} readOnly />
        </TabsContent>

        <TabsContent value="usuarios">
          <UnidadeUsuariosReal unitOrgId={unit.unit_org_id} isFranqueadoView maxUsers={2} />
        </TabsContent>

        <TabsContent value="documentos">
          <UnidadeDocumentosReal unitId={unit.id} isFranqueadoView />
        </TabsContent>

        <TabsContent value="financeiro">
          <UnidadeFinanceiroReal unit={unit} readOnly />
        </TabsContent>
      </Tabs>
    </div>
  );
}
