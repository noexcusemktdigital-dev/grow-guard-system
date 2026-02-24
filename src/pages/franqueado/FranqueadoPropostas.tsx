import { useState, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { KpiCard } from "@/components/KpiCard";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  DollarSign,
  Inbox,
  Calculator,
  ChevronRight,
  ChevronLeft,
  Copy,
  Trash2,
  Send,
  CheckCircle2,
  Package,
} from "lucide-react";
import { useCrmProposals, useCrmProposalMutations, type CrmProposal } from "@/hooks/useCrmProposals";
import { useCrmLeads } from "@/hooks/useCrmLeads";
import { NOE_SERVICE_CATALOG, NOE_MODULES, type NoeService } from "@/constants/noeServices";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";

// ── Types ────────────────────────────────────────────────────────

interface SelectedService extends NoeService {
  quantity: number;
}

// ── Step 1: Service Selection ───────────────────────────────────

function StepServiceSelector({
  selected,
  onToggle,
  onQuantityChange,
}: {
  selected: SelectedService[];
  onToggle: (service: NoeService) => void;
  onQuantityChange: (id: string, qty: number) => void;
}) {
  const [activeModule, setActiveModule] = useState<string>(NOE_MODULES[0]);
  const selectedIds = new Set(selected.map((s) => s.id));

  const moduleServices = NOE_SERVICE_CATALOG.filter((s) => s.module === activeModule);
  const setupTotal = selected.filter((s) => s.type === "unitario").reduce((sum, s) => sum + s.basePrice * s.quantity, 0);
  const mensalTotal = selected.filter((s) => s.type === "mensal").reduce((sum, s) => sum + s.basePrice * s.quantity, 0);

  return (
    <div className="space-y-4">
      {/* Module tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {NOE_MODULES.map((m) => {
          const count = selected.filter((s) => s.module === m).length;
          return (
            <Button
              key={m}
              variant={activeModule === m ? "default" : "outline"}
              size="sm"
              className="text-xs"
              onClick={() => setActiveModule(m)}
            >
              {m}
              {count > 0 && (
                <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">
                  {count}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>

      {/* Services list */}
      <Card className="glass-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead>Serviço</TableHead>
              <TableHead className="w-20">Tipo</TableHead>
              <TableHead className="w-24">Valor</TableHead>
              <TableHead className="w-20">Qtd</TableHead>
              <TableHead className="w-24 text-right">Subtotal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {moduleServices.map((service) => {
              const isSelected = selectedIds.has(service.id);
              const sel = selected.find((s) => s.id === service.id);
              const qty = sel?.quantity ?? 1;
              return (
                <TableRow key={service.id} className={isSelected ? "bg-primary/5" : ""}>
                  <TableCell>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onToggle(service)}
                    />
                  </TableCell>
                  <TableCell className="font-medium text-sm">{service.name}</TableCell>
                  <TableCell>
                    <Badge variant={service.type === "unitario" ? "outline" : "secondary"} className="text-[10px]">
                      {service.type === "unitario" ? "Setup" : "Mensal"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">R$ {service.basePrice.toLocaleString()}</TableCell>
                  <TableCell>
                    {isSelected && (
                      <Input
                        type="number"
                        min={1}
                        value={qty}
                        onChange={(e) => onQuantityChange(service.id, Math.max(1, parseInt(e.target.value) || 1))}
                        className="h-7 w-16 text-xs"
                      />
                    )}
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium">
                    {isSelected ? `R$ ${(service.basePrice * qty).toLocaleString()}` : "—"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* Summary */}
      <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
        <div className="flex gap-6">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-semibold">Setup (unitário)</p>
            <p className="text-sm font-bold">R$ {setupTotal.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-semibold">Mensal (recorrente)</p>
            <p className="text-sm font-bold">R$ {mensalTotal.toLocaleString()}</p>
          </div>
        </div>
        <Badge variant="default" className="text-xs">
          {selected.length} serviço{selected.length !== 1 ? "s" : ""}
        </Badge>
      </div>
    </div>
  );
}

// ── Step 2: Payment Config ──────────────────────────────────────

function StepPaymentConfig({
  selected,
  duration,
  setDuration,
  setupInstallments,
  setSetupInstallments,
}: {
  selected: SelectedService[];
  duration: number;
  setDuration: (d: number) => void;
  setupInstallments: number;
  setSetupInstallments: (n: number) => void;
}) {
  const setupTotal = selected.filter((s) => s.type === "unitario").reduce((sum, s) => sum + s.basePrice * s.quantity, 0);
  const mensalTotal = selected.filter((s) => s.type === "mensal").reduce((sum, s) => sum + s.basePrice * s.quantity, 0);
  const setupPerMonth = setupInstallments > 0 ? setupTotal / setupInstallments : 0;

  const months = Array.from({ length: duration }, (_, i) => {
    const mes = i + 1;
    const hasSetup = mes <= setupInstallments;
    const mensal = mensalTotal;
    const setup = hasSetup ? setupPerMonth : 0;
    return { mes, mensal, setup, total: mensal + setup };
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Duração do Projeto</label>
          <Select value={String(duration)} onValueChange={(v) => setDuration(Number(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 Mês (entrega única)</SelectItem>
              <SelectItem value="6">6 Meses</SelectItem>
              <SelectItem value="12">12 Meses</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {setupTotal > 0 && duration > 1 && (
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Parcelamento do Setup</label>
            <Select value={String(setupInstallments)} onValueChange={(v) => setSetupInstallments(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">À vista (1x)</SelectItem>
                <SelectItem value="3">3x</SelectItem>
                <SelectItem value="6">6x</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Payment flow */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold">Fluxo de Pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mês</TableHead>
                <TableHead className="text-right">Mensal</TableHead>
                {setupTotal > 0 && <TableHead className="text-right">Setup</TableHead>}
                <TableHead className="text-right font-bold">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {months.map((m) => (
                <TableRow key={m.mes}>
                  <TableCell className="text-sm">Mês {m.mes}</TableCell>
                  <TableCell className="text-right text-sm">R$ {m.mensal.toLocaleString()}</TableCell>
                  {setupTotal > 0 && (
                    <TableCell className="text-right text-sm">
                      {m.setup > 0 ? `R$ ${Math.round(m.setup).toLocaleString()}` : "—"}
                    </TableCell>
                  )}
                  <TableCell className="text-right text-sm font-bold">R$ {Math.round(m.total).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase font-semibold">Setup Total</p>
          <p className="text-lg font-bold">R$ {setupTotal.toLocaleString()}</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase font-semibold">Mensal</p>
          <p className="text-lg font-bold">R$ {mensalTotal.toLocaleString()}</p>
        </div>
        <div className="bg-primary/10 rounded-lg p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase font-semibold">1º Mês</p>
          <p className="text-lg font-bold text-primary">R$ {Math.round(months[0]?.total || 0).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

// ── Step 3: Preview ─────────────────────────────────────────────

function StepPreview({
  selected,
  duration,
  setupInstallments,
  clientName,
  setClientName,
  clientCompany,
  setClientCompany,
  clientCnpj,
  setClientCnpj,
  onSave,
  saving,
}: {
  selected: SelectedService[];
  duration: number;
  setupInstallments: number;
  clientName: string;
  setClientName: (v: string) => void;
  clientCompany: string;
  setClientCompany: (v: string) => void;
  clientCnpj: string;
  setClientCnpj: (v: string) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const setupTotal = selected.filter((s) => s.type === "unitario").reduce((sum, s) => sum + s.basePrice * s.quantity, 0);
  const mensalTotal = selected.filter((s) => s.type === "mensal").reduce((sum, s) => sum + s.basePrice * s.quantity, 0);
  const setupPerMonth = setupInstallments > 0 ? setupTotal / setupInstallments : 0;

  return (
    <div className="space-y-4">
      {/* Client info */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold">Dados do Cliente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Nome</label>
              <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Nome do cliente" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Empresa</label>
              <Input value={clientCompany} onChange={(e) => setClientCompany(e.target.value)} placeholder="Empresa" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">CNPJ</label>
              <Input value={clientCnpj} onChange={(e) => setClientCnpj(e.target.value)} placeholder="00.000.000/0000-00" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Proposal preview */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" /> Resumo da Proposta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Duração</span>
            <span className="font-medium">{duration} {duration === 1 ? "mês" : "meses"}</span>
          </div>
          <Separator />

          {/* Services grouped by module */}
          {NOE_MODULES.map((mod) => {
            const modServices = selected.filter((s) => s.module === mod);
            if (modServices.length === 0) return null;
            return (
              <div key={mod}>
                <p className="text-xs font-bold uppercase text-muted-foreground mb-2">{mod}</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Serviço</TableHead>
                      <TableHead className="w-16">Tipo</TableHead>
                      <TableHead className="w-12 text-center">Qtd</TableHead>
                      <TableHead className="w-24 text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {modServices.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="text-sm">{s.name}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px]">{s.type === "unitario" ? "Setup" : "Mensal"}</Badge></TableCell>
                        <TableCell className="text-center text-sm">{s.quantity}</TableCell>
                        <TableCell className="text-right text-sm font-medium">R$ {(s.basePrice * s.quantity).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            );
          })}

          <Separator />

          {/* Investment summary */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Setup (unitário)</span>
              <span className="font-medium">R$ {setupTotal.toLocaleString()}</span>
            </div>
            {setupTotal > 0 && setupInstallments > 1 && (
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Parcelado em {setupInstallments}x</span>
                <span>R$ {Math.round(setupPerMonth).toLocaleString()}/mês</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span>Mensal (recorrente)</span>
              <span className="font-medium">R$ {mensalTotal.toLocaleString()}/mês</span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm font-bold">
              <span>1º Mês</span>
              <span className="text-primary">R$ {Math.round(mensalTotal + (setupInstallments > 0 ? setupPerMonth : 0)).toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-2">
        <Button className="flex-1" onClick={onSave} disabled={saving}>
          {saving ? "Salvando..." : "Salvar Proposta"}
        </Button>
      </div>
    </div>
  );
}

// ── Calculator Wizard ───────────────────────────────────────────

function CalculadoraTab() {
  const [searchParams] = useSearchParams();
  const leadIdFromUrl = searchParams.get("lead_id");
  const { data: leads } = useCrmLeads();
  const { createProposal } = useCrmProposalMutations();

  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<SelectedService[]>([]);
  const [duration, setDuration] = useState(6);
  const [setupInstallments, setSetupInstallments] = useState(3);
  const [leadId, setLeadId] = useState(leadIdFromUrl || "");
  const [clientName, setClientName] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [clientCnpj, setClientCnpj] = useState("");
  const [saved, setSaved] = useState(false);

  const toggleService = (service: NoeService) => {
    setSelected((prev) => {
      const exists = prev.find((s) => s.id === service.id);
      if (exists) return prev.filter((s) => s.id !== service.id);
      return [...prev, { ...service, quantity: 1 }];
    });
  };

  const changeQuantity = (id: string, qty: number) => {
    setSelected((prev) => prev.map((s) => (s.id === id ? { ...s, quantity: qty } : s)));
  };

  const setupTotal = selected.filter((s) => s.type === "unitario").reduce((sum, s) => sum + s.basePrice * s.quantity, 0);
  const mensalTotal = selected.filter((s) => s.type === "mensal").reduce((sum, s) => sum + s.basePrice * s.quantity, 0);
  const totalValue = setupTotal + mensalTotal * duration;

  const handleSave = () => {
    const title = clientCompany
      ? `Proposta - ${clientCompany}`
      : `Proposta - ${new Date().toLocaleDateString("pt-BR")}`;

    const items = selected.map((s) => ({
      product_id: null,
      name: s.name,
      quantity: s.quantity,
      unit_price: s.basePrice,
      discount: 0,
      total: s.basePrice * s.quantity,
    }));

    createProposal.mutate(
      {
        title,
        value: totalValue,
        status: "draft",
        lead_id: leadId || null,
        items,
        content: {
          client_name: clientName,
          client_company: clientCompany,
          client_cnpj: clientCnpj,
          duration,
          setup_installments: setupInstallments,
          services: selected.map((s) => ({
            id: s.id,
            module: s.module,
            name: s.name,
            type: s.type,
            basePrice: s.basePrice,
            quantity: s.quantity,
          })),
        } as any,
      },
      {
        onSuccess: () => {
          toast.success("Proposta salva com sucesso!");
          setSaved(true);
        },
        onError: (e: any) => toast.error(e.message || "Erro ao salvar proposta"),
      }
    );
  };

  if (saved) {
    return (
      <div className="text-center py-16 space-y-4">
        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
        <p className="text-sm font-medium">Proposta salva com sucesso!</p>
        <Button variant="outline" onClick={() => { setSaved(false); setStep(0); setSelected([]); }}>
          Criar Nova Proposta
        </Button>
      </div>
    );
  }

  const stepLabels = ["Serviços", "Pagamento", "Preview"];

  return (
    <div className="space-y-4">
      {/* Step indicator */}
      <div className="flex items-center gap-2 justify-center">
        {stepLabels.map((label, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                i <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {i + 1}
            </div>
            <span className={`text-xs ${i <= step ? "font-medium" : "text-muted-foreground"}`}>{label}</span>
            {i < stepLabels.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {/* Lead selector */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Vincular ao Lead (opcional)</label>
        <Select value={leadId} onValueChange={setLeadId}>
          <SelectTrigger className="h-9"><SelectValue placeholder="Sem vínculo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sem vínculo</SelectItem>
            {(leads ?? []).map((l: any) => (
              <SelectItem key={l.id} value={l.id}>{l.name} {l.company ? `- ${l.company}` : ""}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Steps */}
      {step === 0 && (
        <StepServiceSelector selected={selected} onToggle={toggleService} onQuantityChange={changeQuantity} />
      )}
      {step === 1 && (
        <StepPaymentConfig
          selected={selected}
          duration={duration}
          setDuration={setDuration}
          setupInstallments={setupInstallments}
          setSetupInstallments={setSetupInstallments}
        />
      )}
      {step === 2 && (
        <StepPreview
          selected={selected}
          duration={duration}
          setupInstallments={setupInstallments}
          clientName={clientName}
          setClientName={setClientName}
          clientCompany={clientCompany}
          setClientCompany={setClientCompany}
          clientCnpj={clientCnpj}
          setClientCnpj={setClientCnpj}
          onSave={handleSave}
          saving={createProposal.isPending}
        />
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={step === 0}>
          <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
        </Button>
        {step < 2 && (
          <Button onClick={() => setStep((s) => s + 1)} disabled={step === 0 && selected.length === 0}>
            Próximo <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Proposals List Tab ──────────────────────────────────────────

function PropostasListTab() {
  const { data: proposals, isLoading } = useCrmProposals();
  const { deleteProposal, duplicateProposal, updateProposal } = useCrmProposalMutations();

  if (isLoading) return <Skeleton className="h-96" />;

  const items = proposals ?? [];
  const total = items.reduce((s, p) => s + Number(p.value || 0), 0);

  const statusLabels: Record<string, string> = {
    draft: "Rascunho",
    sent: "Enviada",
    accepted: "Aceita",
    rejected: "Rejeitada",
  };

  const statusVariant = (s: string) => {
    if (s === "accepted") return "default" as const;
    if (s === "rejected") return "destructive" as const;
    return "secondary" as const;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total de Propostas" value={String(items.length)} icon={FileText} delay={0} />
        <KpiCard label="Valor Total" value={`R$ ${total.toLocaleString()}`} icon={DollarSign} delay={1} variant="accent" />
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <Inbox className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground font-medium">Nenhuma proposta encontrada</p>
          <p className="text-xs text-muted-foreground mt-1">Use a calculadora para criar sua primeira proposta.</p>
        </div>
      ) : (
        <Card className="glass-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.title}</TableCell>
                  <TableCell className="font-semibold">R$ {Number(p.value || 0).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(p.status)}>{statusLabels[p.status] || p.status}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{new Date(p.created_at).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => duplicateProposal.mutate(p)} title="Duplicar">
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                      {p.status === "draft" && (
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => updateProposal.mutate({ id: p.id, status: "sent", sent_at: new Date().toISOString() })}
                          title="Marcar como enviada"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteProposal.mutate(p.id)} title="Excluir">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────

export default function FranqueadoPropostas() {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("lead_id") ? "calculadora" : "propostas";

  return (
    <div className="w-full space-y-6">
      <PageHeader title="Propostas" subtitle="Calculadora NOE e gerador de propostas comerciais" />

      <Tabs defaultValue={defaultTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="propostas"><FileText className="w-4 h-4 mr-1" /> Propostas</TabsTrigger>
          <TabsTrigger value="calculadora"><Calculator className="w-4 h-4 mr-1" /> Calculadora</TabsTrigger>
        </TabsList>

        <TabsContent value="propostas" className="space-y-6">
          <PropostasListTab />
        </TabsContent>

        <TabsContent value="calculadora" className="space-y-6">
          <CalculadoraTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
