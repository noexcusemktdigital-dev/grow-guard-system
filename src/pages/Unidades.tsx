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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUnits } from "@/hooks/useUnits";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Unidades() {
  const { data: units, isLoading } = useUnits();
  const { data: orgId } = useUserOrgId();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"card" | "list">("card");

  // Wizard state
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardLoading, setWizardLoading] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  // Step 1 — unit data
  const [unitName, setUnitName] = useState("");
  const [unitCity, setUnitCity] = useState("");
  const [unitState, setUnitState] = useState("");
  const [unitAddress, setUnitAddress] = useState("");
  const [unitPhone, setUnitPhone] = useState("");

  // Step 2 — manager data
  const [managerName, setManagerName] = useState("");
  const [managerEmail, setManagerEmail] = useState("");

  // Step 3 — financial config
  const [royaltyPercent, setRoyaltyPercent] = useState("5");
  const [systemFee, setSystemFee] = useState("299");

  const selected = (units ?? []).find(u => u.id === selectedId);

  const resetWizard = () => {
    setWizardStep(1);
    setUnitName(""); setUnitCity(""); setUnitState(""); setUnitAddress(""); setUnitPhone("");
    setManagerName(""); setManagerEmail("");
    setRoyaltyPercent("5"); setSystemFee("299");
    setTempPassword(null);
    setWizardLoading(false);
  };

  const handleProvision = async () => {
    if (!orgId) return;
    setWizardLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("provision-unit", {
        body: {
          unit_name: unitName,
          city: unitCity,
          state: unitState,
          address: unitAddress,
          phone: unitPhone,
          manager_name: managerName,
          manager_email: managerEmail,
          royalty_percent: parseFloat(royaltyPercent),
          system_fee: parseFloat(systemFee),
          parent_org_id: orgId,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setTempPassword(data.temp_password);
      setWizardStep(4); // success step
      qc.invalidateQueries({ queryKey: ["units"] });
      toast({ title: "Unidade provisionada com sucesso!" });
    } catch (err: any) {
      toast({ title: "Erro ao provisionar unidade", description: err.message, variant: "destructive" });
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
            <Button size="sm" onClick={() => { resetWizard(); setShowWizard(true); }}>
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
            <Button onClick={() => { resetWizard(); setShowWizard(true); }}>
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

      {/* Wizard Dialog */}
      <Dialog open={showWizard} onOpenChange={(open) => { if (!open) setShowWizard(false); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {wizardStep === 4 ? "Unidade Criada!" : `Nova Unidade — Passo ${wizardStep} de 3`}
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
            </div>
          )}

          {wizardStep === 2 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Dados do responsável que será o administrador da unidade.</p>
              <div><Label>Nome do Responsável *</Label><Input value={managerName} onChange={e => setManagerName(e.target.value)} placeholder="Nome completo" /></div>
              <div><Label>E-mail do Responsável *</Label><Input type="email" value={managerEmail} onChange={e => setManagerEmail(e.target.value)} placeholder="email@exemplo.com" /></div>
            </div>
          )}

          {wizardStep === 3 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Configurações financeiras da unidade.</p>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>% Royalties</Label><Input type="number" value={royaltyPercent} onChange={e => setRoyaltyPercent(e.target.value)} min="0" max="100" /></div>
                <div><Label>Mensalidade Sistema (R$)</Label><Input type="number" value={systemFee} onChange={e => setSystemFee(e.target.value)} min="0" /></div>
              </div>
            </div>
          )}

          {wizardStep === 4 && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">✅ Unidade provisionada com sucesso!</p>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">Organização, usuário e vinculação criados automaticamente.</p>
              </div>
              {tempPassword && (
                <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Credenciais temporárias</p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">E-mail: <strong>{managerEmail}</strong></p>
                  <p className="text-xs text-amber-700 dark:text-amber-300">Senha: <strong className="font-mono">{tempPassword}</strong></p>
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-2">⚠️ Compartilhe estas credenciais com o responsável. A senha deve ser alterada no primeiro acesso.</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            {wizardStep === 4 ? (
              <Button onClick={() => setShowWizard(false)}>Fechar</Button>
            ) : (
              <>
                {wizardStep > 1 && <Button variant="outline" onClick={() => setWizardStep(s => s - 1)}>Voltar</Button>}
                {wizardStep < 3 ? (
                  <Button
                    onClick={() => {
                      if (wizardStep === 1 && !unitName.trim()) { toast({ title: "Informe o nome da unidade", variant: "destructive" }); return; }
                      if (wizardStep === 2 && (!managerName.trim() || !managerEmail.trim())) { toast({ title: "Informe nome e email do responsável", variant: "destructive" }); return; }
                      setWizardStep(s => s + 1);
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
