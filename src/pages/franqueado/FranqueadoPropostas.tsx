import { useState, useRef } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { KpiCard } from "@/components/KpiCard";
import {
  FileText,
  DollarSign,
  Inbox,
  Calculator,
  Copy,
  Trash2,
  Send,
  Eye,
} from "lucide-react";
import { useCrmProposals, useCrmProposalMutations } from "@/hooks/useCrmProposals";
import { useCrmLeads } from "@/hooks/useCrmLeads";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";

// Calculator imports
import { useCalculator } from "@/hooks/useCalculator";
import { modules } from "@/data/services";
import { ModuleAccordion } from "@/components/calculator/ModuleAccordion";
import { DurationSelector } from "@/components/calculator/DurationSelector";
import { PaymentSimulation } from "@/components/calculator/PaymentSimulation";
import { ProposalSummary } from "@/components/calculator/ProposalSummary";
import { ProposalGenerator } from "@/components/calculator/ProposalGenerator";
import { SummaryDrawer } from "@/components/calculator/SummaryDrawer";

// ── Calculator Tab ──────────────────────────────────────────────

function CalculadoraTab() {
  const [searchParams] = useSearchParams();
  const leadIdFromUrl = searchParams.get("lead_id");
  const { data: leads } = useCrmLeads();
  const { createProposal } = useCrmProposalMutations();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showProposal, setShowProposal] = useState(false);
  const [leadId, setLeadId] = useState(leadIdFromUrl || "");
  const proposalRef = useRef<HTMLDivElement>(null);

  const {
    duration,
    selectedServices,
    clientName,
    paymentOption,
    setDuration,
    setClientName,
    setPaymentOption,
    toggleService,
    updateServiceQuantity,
    updateServicePackage,
    updateYoutubeMinutes,
    clearSelection,
    isServiceSelected,
    getServiceSelection,
    totals,
    getSelectedServicesByModule,
  } = useCalculator();

  const scrollToProposal = () => {
    setShowProposal(true);
    setTimeout(() => {
      proposalRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleClear = () => {
    clearSelection();
    setShowProposal(false);
  };

  const handleSave = () => {
    const title = clientName
      ? `Proposta - ${clientName}`
      : `Proposta - ${new Date().toLocaleDateString("pt-BR")}`;

    const selectedByModule = getSelectedServicesByModule();
    const items = Object.values(selectedByModule).flatMap(({ selections }) =>
      selections.map((s) => ({
        product_id: null,
        name: s.service.name,
        quantity: s.quantity,
        unit_price: s.price,
        discount: 0,
        total: s.price,
      }))
    );

    createProposal.mutate(
      {
        title,
        value: totals.totalPeriod,
        status: "draft",
        lead_id: leadId || null,
        items,
        payment_terms: paymentOption,
        content: {
          client_name: clientName,
          duration,
          payment_option: paymentOption,
          services: selectedServices,
        } as any,
      },
      {
        onSuccess: () => toast.success("Proposta salva com sucesso!"),
        onError: (e: any) => toast.error(e.message || "Erro ao salvar proposta"),
      }
    );
  };

  const hasSelections = selectedServices.length > 0;

  return (
    <div className="space-y-8">
      {/* Lead selector */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Vincular ao Lead (opcional)</label>
        <Select value={leadId} onValueChange={setLeadId}>
          <SelectTrigger className="h-9 max-w-sm">
            <SelectValue placeholder="Sem vínculo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sem vínculo</SelectItem>
            {(leads ?? []).map((l: any) => (
              <SelectItem key={l.id} value={l.id}>
                {l.name} {l.company ? `- ${l.company}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Section 1: Modules and Services */}
      <section>
        <div className="mb-4 text-center">
          <h2 className="text-lg md:text-xl font-bold text-foreground">Selecione os Serviços</h2>
          <p className="mt-1 text-xs md:text-sm text-muted-foreground">Escolha os serviços por módulo para montar sua proposta</p>
        </div>
        <ModuleAccordion
          modules={modules}
          isServiceSelected={isServiceSelected}
          getServiceSelection={getServiceSelection}
          onToggleService={toggleService}
          onUpdateQuantity={updateServiceQuantity}
          onUpdatePackage={updateServicePackage}
          onUpdateYoutubeMinutes={updateYoutubeMinutes}
        />
      </section>

      {/* Section 2: Proposal Summary */}
      {hasSelections && (
        <section>
          <ProposalSummary
            duration={duration}
            selectedByModule={getSelectedServicesByModule()}
            totals={totals}
            paymentOption={paymentOption}
          />
        </section>
      )}

      {/* Section 3: Duration Selection */}
      {hasSelections && (
        <section>
          <DurationSelector selected={duration} onSelect={setDuration} />
        </section>
      )}

      {/* Section 4: Payment Options */}
      {hasSelections && duration && duration > 1 && (
        <section>
          <PaymentSimulation
            totals={totals}
            duration={duration}
            selectedOption={paymentOption}
            onSelectOption={setPaymentOption}
          />
        </section>
      )}

      {/* Section 5: Action Buttons */}
      {hasSelections && duration && (
        <section className="flex flex-col sm:flex-row justify-center gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setDrawerOpen(true)}
            className="gap-2"
          >
            <Eye className="h-5 w-5" />
            Ver Detalhe
          </Button>
          <Button
            size="lg"
            className="gap-2"
            onClick={scrollToProposal}
          >
            <FileText className="h-5 w-5" />
            Gerar Proposta
          </Button>
        </section>
      )}

      {/* Section 6: Proposal Generator */}
      {showProposal && hasSelections && duration && (
        <section ref={proposalRef}>
          <ProposalGenerator
            duration={duration}
            clientName={clientName}
            onClientNameChange={setClientName}
            selectedByModule={getSelectedServicesByModule()}
            totals={totals}
            paymentOption={paymentOption}
            onClear={handleClear}
            onSave={handleSave}
            saving={createProposal.isPending}
          />
        </section>
      )}

      {/* Empty State */}
      {!hasSelections && (
        <div className="text-center py-12">
          <div className="mx-auto max-w-md">
            <div className="mb-4 flex justify-center">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="h-10 w-10 text-primary" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-foreground">Nenhum serviço selecionado</h3>
            <p className="mt-2 text-muted-foreground">Selecione os serviços nos módulos acima para começar a montar sua proposta.</p>
          </div>
        </div>
      )}

      <SummaryDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        duration={duration}
        selectedByModule={getSelectedServicesByModule()}
        totals={totals}
        onGoToPayment={scrollToProposal}
      />
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
