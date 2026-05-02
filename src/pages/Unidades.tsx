// @ts-nocheck

import { useState } from "react";
import { Building2, ArrowLeft, Users, FileText, Settings, ClipboardList, Inbox, Plus, LayoutGrid, List, Check, Trash2 } from "lucide-react";
import { UnidadeDadosEdit } from "@/components/unidades/UnidadeDadosEdit";
import { UnidadeUsuariosReal } from "@/components/unidades/UnidadeUsuariosReal";
import { UnidadeDocumentosReal } from "@/components/unidades/UnidadeDocumentosReal";
import { UnidadeFinanceiroReal } from "@/components/unidades/UnidadeFinanceiroReal";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/NumericInput";
import { Label } from "@/components/ui/label";
import { useUnits, useUnitMutations } from "@/hooks/useUnits";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { supabase } from "@/lib/supabase";
import { invokeEdge } from "@/lib/edge";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Unidades() {
  const { data: units, isLoading } = useUnits();
  const { deleteUnit } = useUnitMutations();
  const { data: orgId } = useUserOrgId();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [deleting, setDeleting] = useState(false);

  // Wizard state
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardLoading, setWizardLoading] = useState(false);

  // Step 1 — unit data + manager info (optional)
  const [unitName, setUnitName] = useState("");
  const [unitCity, setUnitCity] = useState("");
  const [unitState, setUnitState] = useState("");
  const [unitAddress, setUnitAddress] = useState("");
  const [unitPhone, setUnitPhone] = useState("");
  const [managerName, setManagerName] = useState("");
  const [managerEmail, setManagerEmail] = useState("");

  // Step 2 — financial config
  const [royaltyPercent, setRoyaltyPercent] = useState("5");
  const [systemFee, setSystemFee] = useState("299");

  const selected = (units ?? []).find(u => u.id === selectedId);

  const resetWizard = () => {
    setWizardStep(1);
    setUnitName(""); setUnitCity(""); setUnitState(""); setUnitAddress(""); setUnitPhone("");
    setManagerName(""); setManagerEmail("");
    setRoyaltyPercent("5"); setSystemFee("299");
    setWizardLoading(false);
  };

  const handleProvision = async () => {
    if (!orgId) return;
    setWizardLoading(true);
    try {
      const { data, error } = await invokeEdge("provision-unit", {
        body: {
          unit_name: unitName,
          city: unitCity,
          state: unitState,
          address: unitAddress,
          phone: unitPhone,
          manager_name: managerName || undefined,
          manager_email: managerEmail || undefined,
          royalty_percent: parseFloat(royaltyPercent),
          system_fee: parseFloat(systemFee),
          parent_org_id: orgId,
        },
      });
      if (error) {
        const { extractEdgeFunctionError } = await import("@/lib/edgeFunctionError");
        throw await extractEdgeFunctionError(error);
      }
      if (data?.error) throw new Error(data.error);

      setWizardStep(3); // success step
      qc.invalidateQueries({ queryKey: ["units"] });
      toast({ title: "Unidade provisionada com sucesso!" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast({ title: "Erro ao provisionar unidade", description: msg, variant: "destructive" });
    } finally {
      setWizardLoading(false);
    }
  };

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
            <Button variant="ghost" size="icon" onClick={() => setSelectedId(null)} aria-label="Voltar">
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
        {selected ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={deleting}>
                <Trash2 className="w-4 h-4 mr-1" /> Excluir Unidade
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir unidade</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir a unidade <strong>{selected.name}</strong>? Todos os dados relacionados (usuários, documentos, financeiro, onboarding) serão removidos permanentemente. Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={async () => {
                    setDeleting(true);
                    try {
                      await deleteUnit.mutateAsync(selected.id);
                      setSelectedId(null);
                      toast({ title: "Unidade excluída com sucesso" });
                    } catch (err: unknown) {
                      toast({ title: "Erro ao excluir", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
                    } finally {
                      setDeleting(false);
                    }
                  }}
                >
                  {deleting ? "Excluindo..." : "Sim, excluir"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5 p-0.5 rounded-lg bg-muted/50 border">
              <Button variant={viewMode === "card" ? "default" : "ghost"} size="sm" className="h-7 px-2" onClick={() => setViewMode("card")}>
                <LayoutGrid className="w-3.5 h-3.5" />
              </Button>
              <Button variant={viewMode === "list" ? "default" : "ghost"} size="sm" className="h-7 px-2" onClick={() => setViewMode("list")}>
                <List className="w-3.5 h-3.5" />
              </Button>
            </div>
            <Button size="sm" onClick={() => { resetWizard(); setShowWizard(true); }}>
              <Plus className="w-4 h-4 mr-1" /> Nova Unidade
            </Button>
          </div>
        )}
      </div>

      {!selected ? (
        (units ?? []).length === 0 ? (
          <EmptyState
            icon={<Inbox className="w-8 h-8" />}
            title="Nenhuma unidade cadastrada"
            description="Cadastre a primeira unidade da rede."
            action={{ label: "Nova Unidade", onClick: () => { resetWizard(); setShowWizard(true); } }}
          />
        ) : viewMode === "card" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {units?.map(u => (
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
                {units?.map(u => (
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

      {/* Wizard Dialog */}
      <Dialog open={showWizard} onOpenChange={(open) => { if (!open) setShowWizard(false); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {wizardStep === 3 ? "Unidade Criada!" : `Nova Unidade — Passo ${wizardStep} de 2`}
            </DialogTitle>
          </DialogHeader>

          {wizardStep === 1 && (
            <div className="space-y-3">
              <div><Label>Nome da Unidade *</Label><Input value={unitName} onChange={e => setUnitName(e.target.value)} placeholder="Ex: Unidade Centro SP" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Cidade</Label><Input value={unitCity} onChange={e => setUnitCity(e.target.value)} placeholder="São Paulo" /></div>
                <div><Label>Estado</Label><Input value={unitState} onChange={e => setUnitState(e.target.value)} placeholder="SP" maxLength={2} /></div>
              </div>
              <div><Label>Endereço</Label><Input value={unitAddress} onChange={e => setUnitAddress(e.target.value)} placeholder="Rua, número, bairro" /></div>
              <div><Label>Telefone</Label><Input value={unitPhone} onChange={e => setUnitPhone(e.target.value)} placeholder="(11) 99999-0000" /></div>
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-2">Responsável (opcional — informativo)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Nome</Label><Input value={managerName} onChange={e => setManagerName(e.target.value)} placeholder="Nome do responsável" /></div>
                  <div><Label>E-mail</Label><Input type="email" value={managerEmail} onChange={e => setManagerEmail(e.target.value)} placeholder="email@exemplo.com" /></div>
                </div>
              </div>
            </div>
          )}

          {wizardStep === 2 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Configurações financeiras da unidade.</p>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>% Royalties</Label><NumericInput value={royaltyPercent === "" ? null : Number(royaltyPercent)} onChange={v => setRoyaltyPercent(v === null ? "" : String(v))} suffix="%" decimals={1} /></div>
                <div><Label>Mensalidade Sistema (R$)</Label><NumericInput value={systemFee === "" ? null : Number(systemFee)} onChange={v => setSystemFee(v === null ? "" : String(v))} prefix="R$ " decimals={2} /></div>
              </div>
            </div>
          )}

          {wizardStep === 3 && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center space-y-3">
                <Check className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="text-sm font-medium">Unidade provisionada com sucesso!</p>
                <p className="text-xs text-muted-foreground">A organização e o onboarding foram criados automaticamente.</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 border">
                <p className="text-xs text-muted-foreground">
                  <strong>Próximo passo:</strong> acesse a aba <strong>Usuários</strong> da unidade para convidar os membros que terão acesso ao sistema.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            {wizardStep === 3 ? (
              <Button onClick={() => setShowWizard(false)}>Fechar</Button>
            ) : (
              <>
                {wizardStep > 1 && <Button variant="outline" onClick={() => setWizardStep(s => s - 1)}>Voltar</Button>}
                {wizardStep < 2 ? (
                  <Button
                    onClick={() => {
                      if (!unitName.trim()) { toast({ title: "Informe o nome da unidade", variant: "destructive" }); return; }
                      setWizardStep(2);
                    }}
                  >
                    Próximo
                  </Button>
                ) : (
                  <Button onClick={handleProvision} disabled={wizardLoading}>
                    {wizardLoading ? "Provisionando..." : "Criar Unidade"}
                  </Button>
                )}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
