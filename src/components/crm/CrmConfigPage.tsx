// @ts-nocheck
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Layers, Users2, Shuffle, Bell, Plug, Zap, Package, Building2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CrmFunnelManager } from "./CrmFunnelManager";
import { CrmTeamManager } from "./CrmTeamManager";
import { CrmRouletteConfig } from "./CrmRouletteConfig";
import { CrmSlaConfig } from "./CrmSlaConfig";
import { CrmIntegrations } from "./CrmIntegrations";
import { CrmAutomations } from "./CrmAutomations";
import { CrmProductsManager } from "./CrmProductsManager";
import { CrmPartnersManager } from "./CrmPartnersManager";
import { CrmLossReasonsConfig } from "./CrmLossReasonsConfig";

export default function CrmConfigPage() {
  const navigate = useNavigate();

  return (
    <div className="w-full space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>
        <div>
          <h1 className="text-lg font-bold">Configurações do CRM</h1>
          <p className="text-xs text-muted-foreground">Gerencie funis, equipe, produtos, parceiros e automações</p>
        </div>
      </div>

      <Tabs defaultValue="funnels" className="w-full">
        <TabsList className="grid grid-cols-8 w-full">
          <TabsTrigger value="funnels" className="text-xs gap-1"><Layers className="w-3 h-3" /> Funis</TabsTrigger>
          <TabsTrigger value="team" className="text-xs gap-1"><Users2 className="w-3 h-3" /> Equipe</TabsTrigger>
          <TabsTrigger value="products" className="text-xs gap-1"><Package className="w-3 h-3" /> Produtos</TabsTrigger>
          <TabsTrigger value="partners" className="text-xs gap-1"><Building2 className="w-3 h-3" /> Parceiros</TabsTrigger>
          <TabsTrigger value="roulette" className="text-xs gap-1"><Shuffle className="w-3 h-3" /> Roleta</TabsTrigger>
          <TabsTrigger value="sla" className="text-xs gap-1"><Bell className="w-3 h-3" /> SLA</TabsTrigger>
          <TabsTrigger value="integrations" className="text-xs gap-1"><Plug className="w-3 h-3" /> Integ.</TabsTrigger>
          <TabsTrigger value="automations" className="text-xs gap-1"><Zap className="w-3 h-3" /> Autom.</TabsTrigger>
        </TabsList>

        <TabsContent value="funnels"><CrmFunnelManager embedded /></TabsContent>
        <TabsContent value="team"><CrmTeamManager /></TabsContent>
        <TabsContent value="products"><CrmProductsManager /></TabsContent>
        <TabsContent value="partners"><CrmPartnersManager /></TabsContent>
        <TabsContent value="roulette"><CrmRouletteConfig /></TabsContent>
        <TabsContent value="sla"><CrmSlaConfig /></TabsContent>
        <TabsContent value="integrations"><CrmIntegrations /></TabsContent>
        <TabsContent value="automations"><CrmAutomations /></TabsContent>
      </Tabs>
    </div>
  );
}
