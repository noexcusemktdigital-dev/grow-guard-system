import { useState } from "react";
import { Inbox, Plus, Eye, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useContracts } from "@/hooks/useContracts";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-emerald-500/15 text-emerald-500",
  signed: "bg-blue-500/15 text-blue-500",
  expired: "bg-red-500/15 text-red-500",
};

export default function ContratosGerenciamento() {
  const { data: contracts, isLoading } = useContracts();

  if (isLoading) return <div className="space-y-6"><Skeleton className="h-12 w-full" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header-title">Gerenciamento de Contratos</h1>
          <Badge variant="secondary" className="mt-1">Franqueadora</Badge>
        </div>
      </div>

      {(contracts ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Inbox className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-1">Nenhum contrato</h3>
          <p className="text-sm text-muted-foreground mb-4">Crie seu primeiro contrato.</p>
          <Button onClick={() => window.location.href = "/franqueadora/contratos/criar"}>
            <Plus className="w-4 h-4 mr-1" /> Criar Contrato
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left py-3 px-4 font-medium">Título</th>
                <th className="text-left py-3 px-4 font-medium">Signatário</th>
                <th className="text-center py-3 px-4 font-medium">Status</th>
                <th className="text-left py-3 px-4 font-medium">Data</th>
              </tr>
            </thead>
            <tbody>
              {contracts!.map(c => (
                <tr key={c.id} className="border-b hover:bg-muted/30">
                  <td className="py-3 px-4 font-medium">{c.title}</td>
                  <td className="py-3 px-4 text-muted-foreground">{c.signer_name || "—"}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded ${statusColors[c.status] || "bg-muted"}`}>{c.status}</span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{new Date(c.created_at).toLocaleDateString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
