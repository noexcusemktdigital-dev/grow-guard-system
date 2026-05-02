// @ts-nocheck
import { useState, useRef, useEffect } from "react";
import { formatBRL } from "@/lib/formatting";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { KpiCard } from "@/components/KpiCard";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import {
  FileText, DollarSign, Inbox, Calculator, Copy, Trash2, Send, Eye, Pencil, Download, Link, CheckCircle, FileSignature, Settings, Percent,
} from "lucide-react";
import { useCrmProposals, useCrmProposalMutations } from "@/hooks/useCrmProposals";
import { useStrategies } from "@/hooks/useFranqueadoStrategies";
import { useCalculatorSettings } from "@/hooks/useCalculatorSettings";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useSearchParams, useNavigate } from "react-router-dom";
import { EmptyState } from "@/components/ui/empty-state";

// Calculator imports
import { useCalculator } from "@/hooks/useCalculator";
import { modules } from "@/data/services";
import { ModuleAccordion } from "@/components/calculator/ModuleAccordion";
import { DurationSelector } from "@/components/calculator/DurationSelector";
import { PaymentSimulation } from "@/components/calculator/PaymentSimulation";
import { ProposalSummary } from "@/components/calculator/ProposalSummary";
import { ProposalGenerator } from "@/components/calculator/ProposalGenerator";
import { SummaryDrawer } from "@/components/calculator/SummaryDrawer";


// ── Proposal Viewer Sheet ───────────────────────────────────────
function ProposalViewerSheet({ proposal, open, onClose }: { proposal: Record<string, unknown>; open: boolean; onClose: () => void }) {
  const { data: strategies } = useStrategies();
  const { updateProposal } = useCrmProposalMutations();
  const navigate = useNavigate();
  const previewRef = useRef<HTMLDivElement>(null);
  const [linkStrategyId, setLinkStrategyId] = useState(proposal?.strategy_id || "");

  useEffect(() => {
    if (proposal) setLinkStrategyId(proposal.strategy_id || "");
  }, [proposal]);

  if (!proposal) return null;

  const content = proposal.content || {};
  const items = Array.isArray(proposal.items) ? proposal.items : [];
  const totalValue = Number(proposal.value || 0);

  const handleDownloadPdf = async () => {
    const el = previewRef.current;
    if (!el) return;
    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
      import("jspdf"),
      import("html2canvas"),
    ]);
    const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgW = pageW;
    const imgH = (canvas.height * imgW) / canvas.width;
    let y = 0;
    while (y < imgH) {
      if (y > 0) pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, -y, imgW, imgH);
      y += pageH;
    }
    pdf.save(`${proposal.title || "Proposta"}.pdf`);
    toast.success("PDF gerado!");
  };

  const handleLinkStrategy = () => {
    if (!linkStrategyId || linkStrategyId === "none") return;
    updateProposal.mutate({ id: proposal.id, strategy_id: linkStrategyId }, {
      onSuccess: () => toast.success("Estratégia vinculada!"),
    });
  };

  const handleAccept = () => {
    updateProposal.mutate({ id: proposal.id, status: "accepted", accepted_at: new Date().toISOString() }, {
      onSuccess: () => { toast.success("Proposta marcada como aceita!"); onClose(); },
    });
  };

  const handleGenerateContract = () => {
    const strategyId = proposal.strategy_id || linkStrategyId;
    navigate(`/franqueado/contratos?tab=novo&proposal_id=${proposal.id}${strategyId ? `&strategy_id=${strategyId}` : ""}`);
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {proposal.title}
          </SheetTitle>
        </SheetHeader>

        {/* Actions bar */}
        <div className="flex flex-wrap gap-2 my-4">
          <Button size="sm" variant="outline" onClick={handleDownloadPdf} className="gap-1.5">
            <Download className="w-4 h-4" /> Baixar PDF
          </Button>
          {proposal.status !== "accepted" && (
            <Button size="sm" variant="default" onClick={handleAccept} className="gap-1.5">
              <CheckCircle className="w-4 h-4" /> Marcar como Aceita
            </Button>
          )}
          <Button size="sm" variant="secondary" onClick={handleGenerateContract} className="gap-1.5">
            <FileSignature className="w-4 h-4" /> Gerar Contrato
          </Button>
        </div>

        {/* Link to Strategy */}
        <div className="flex items-end gap-2 mb-4">
          <div className="flex-1">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Vincular à Estratégia</label>
            <Select value={linkStrategyId} onValueChange={setLinkStrategyId}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Selecione uma estratégia" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem vínculo</SelectItem>
                {(strategies ?? []).filter(s => s.status === "completed").map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" variant="outline" onClick={handleLinkStrategy} disabled={!linkStrategyId || linkStrategyId === "none"} aria-label="Vincular estratégia">
            <Link className="w-4 h-4" />
          </Button>
        </div>

        {/* Proposal Preview A4 */}
        <div ref={previewRef} className="bg-white text-black rounded-lg border p-8 space-y-6" style={{ fontFamily: "Arial, sans-serif" }}>
          <div className="text-center border-b pb-4">
            <h1 className="text-2xl font-bold text-gray-900">{proposal.title}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {content.client_name ? `Cliente: ${content.client_name}` : ""} 
              {content.duration ? ` | Duração: ${content.duration} ${content.duration === 1 ? "mês" : "meses"}` : ""}
            </p>
            <p className="text-xs text-gray-400 mt-1">Gerada em {new Date(proposal.created_at).toLocaleDateString("pt-BR")}</p>
          </div>

          {/* Services */}
          {items.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Serviços Inclusos</h2>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-2 text-gray-600">Serviço</th>
                    <th className="text-center py-2 text-gray-600">Qtd</th>
                    <th className="text-right py-2 text-gray-600">Valor Unit.</th>
                    <th className="text-right py-2 text-gray-600">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item: Record<string, unknown>, i: number) => (
                    <tr key={item.id ?? `${item.name}-${i}`} className="border-b border-gray-100">
                      <td className="py-2 text-gray-800">{item.name}</td>
                      <td className="py-2 text-center text-gray-600">{item.quantity || 1}</td>
                      <td className="py-2 text-right text-gray-600">{formatBRL(Number(item.unit_price || 0))}</td>
                      <td className="py-2 text-right font-medium text-gray-800">{formatBRL(Number(item.total || 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Payment terms */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2">Condições de Pagamento</h3>
            <p className="text-sm text-gray-600">
              {content.payment_option === "a_vista" ? "Pagamento à vista" :
               content.payment_option === "2x" ? "2x sem juros" :
               content.payment_option === "3x" ? "3x sem juros" :
               content.payment_option || "A definir"}
            </p>
            {proposal.payment_terms && <p className="text-sm text-gray-600 mt-1">{proposal.payment_terms}</p>}
          </div>

          {/* Total */}
          <div className="text-right border-t pt-4">
            <p className="text-sm text-gray-500">Valor Total do Projeto</p>
            <p className="text-3xl font-bold text-gray-900">{formatBRL(totalValue)}</p>
          </div>

          {/* Notes */}
          {proposal.notes && (
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-800 mb-1">Observações</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{proposal.notes}</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Calculator Tab ──────────────────────────────────────────────

function CalculadoraTab({ editingProposal, onEditComplete }: { editingProposal?: Record<string, unknown>; onEditComplete?: () => void }) {
  const [searchParams] = useSearchParams();
  const strategyIdFromUrl = searchParams.get("strategy_id");
  const { data: strategies } = useStrategies();
  const { createProposal, updateProposal } = useCrmProposalMutations();
  const { surplusType, surplusValue, upsert: upsertSettings } = useCalculatorSettings();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showProposal, setShowProposal] = useState(false);
  const [strategyId, setStrategyId] = useState(strategyIdFromUrl || "");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [localSurplusType, setLocalSurplusType] = useState<"fixed" | "percentage">(surplusType);
  const [localSurplusValue, setLocalSurplusValue] = useState(String(surplusValue));
  const proposalRef = useRef<HTMLDivElement>(null);

  // Sync settings from DB
  useEffect(() => {
    setLocalSurplusType(surplusType);
    setLocalSurplusValue(String(surplusValue));
  }, [surplusType, surplusValue]);

  const {
    duration, selectedServices, clientName, paymentOption,
    setDuration, setClientName, setPaymentOption,
    toggleService, updateServiceQuantity, updateServicePackage,
    updateYoutubeMinutes, clearSelection, isServiceSelected,
    getServiceSelection, totals, getSelectedServicesByModule,
  } = useCalculator(surplusValue > 0 ? { type: surplusType, value: surplusValue } : undefined);

  // Auto-fill client name from strategy
  useEffect(() => {
    if (strategyId && strategyId !== "none" && strategies) {
      const strat = strategies.find(s => s.id === strategyId);
      if (strat?.title) {
        const name = strat.title.replace(/^Diagnóstico\s*-?\s*/i, "").trim();
        if (name) setClientName(name);
      }
    }
  }, [strategyId, strategies]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (editingProposal?.content) {
      const c = editingProposal.content;
      if (c.client_name) setClientName(c.client_name);
      if (c.duration) setDuration(c.duration);
      if (c.payment_option) setPaymentOption(c.payment_option);
      if (editingProposal.strategy_id) setStrategyId(editingProposal.strategy_id);
    } else if (!strategyIdFromUrl) {
      clearSelection();
    }
  }, [editingProposal]); // eslint-disable-line react-hooks/exhaustive-deps

  const scrollToProposal = () => {
    setShowProposal(true);
    setTimeout(() => { proposalRef.current?.scrollIntoView({ behavior: "smooth" }); }, 100);
  };

  const handleClear = () => { clearSelection(); setShowProposal(false); };

  const handleSaveSurplus = () => {
    const val = parseFloat(localSurplusValue) || 0;
    upsertSettings.mutate({ surplus_type: localSurplusType, surplus_value: val }, {
      onSuccess: () => { toast.success("Configuração de excedente salva!"); setSettingsOpen(false); },
      onError: () => toast.error("Erro ao salvar configuração"),
    });
  };

  const handleSave = () => {
    const title = clientName ? `Proposta - ${clientName}` : `Proposta - ${new Date().toLocaleDateString("pt-BR")}`;
    const selectedByModule = getSelectedServicesByModule();
    const items = Object.values(selectedByModule).flatMap(({ selections }) =>
      selections.map((s) => ({ product_id: null, name: s.service.name, quantity: s.quantity, unit_price: s.price, discount: 0, total: s.price }))
    );
    const payload = {
      title, value: totals.totalPeriod, status: "draft" as const,
      strategy_id: (strategyId && strategyId !== "none") ? strategyId : null,
      items, payment_terms: paymentOption,
      content: { client_name: clientName, duration, payment_option: paymentOption, services: selectedServices } as Record<string, unknown>,
    };
    if (editingProposal) {
      updateProposal.mutate({ id: editingProposal.id, ...payload }, {
        onSuccess: () => { toast.success("Proposta atualizada!"); onEditComplete?.(); },
        onError: (e: unknown) => toast.error(e instanceof Error ? e.message : String(e) || "Erro ao atualizar proposta"),
      });
    } else {
      createProposal.mutate(payload, {
        onSuccess: () => toast.success("Proposta salva com sucesso!"),
        onError: (e: unknown) => toast.error(e instanceof Error ? e.message : String(e) || "Erro ao salvar proposta"),
      });
    }
  };

  const hasSelections = selectedServices.length > 0;
  const completedStrategies = (strategies ?? []).filter(s => s.status === "completed");

  return (
    <div className="space-y-8">
      {/* Strategy link */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Vincular à Estratégia (opcional)</label>
        <Select value={strategyId} onValueChange={setStrategyId}>
          <SelectTrigger className="h-9 max-w-sm"><SelectValue placeholder="Sem vínculo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sem vínculo</SelectItem>
            {completedStrategies.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Surplus config panel */}
      <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
            <Settings className="w-4 h-4" />
            Configuração de Excedente
            {surplusValue > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {surplusType === "percentage" ? `${surplusValue}%` : formatBRL(surplusValue)} ativo
              </Badge>
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card className="p-4 mt-2 space-y-3 border-dashed">
            <p className="text-xs text-muted-foreground">Defina um valor de excedente que será aplicado invisível sobre todos os preços da calculadora.</p>
            <div className="flex items-end gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Tipo</label>
                <Select value={localSurplusType} onValueChange={(v) => setLocalSurplusType(v as "fixed" | "percentage")}>
                  <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage"><span className="flex items-center gap-1"><Percent className="w-3 h-3" /> Percentual</span></SelectItem>
                    <SelectItem value="fixed"><span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> Valor fixo (R$)</span></SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Valor</label>
                <Input
                  type="number"
                  min="0"
                  step={localSurplusType === "percentage" ? "1" : "0.01"}
                  value={localSurplusValue}
                  onChange={(e) => setLocalSurplusValue(e.target.value)}
                  className="h-9 w-32"
                  placeholder={localSurplusType === "percentage" ? "Ex: 15" : "Ex: 100"}
                />
              </div>
              <Button size="sm" onClick={handleSaveSurplus} disabled={upsertSettings.isPending}>
                Salvar
              </Button>
            </div>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      <section>
        <div className="mb-4 text-center">
          <h2 className="text-lg md:text-xl font-bold text-foreground">Selecione os Serviços</h2>
          <p className="mt-1 text-xs md:text-sm text-muted-foreground">Escolha os serviços por módulo para montar sua proposta</p>
        </div>
        <ModuleAccordion modules={modules} isServiceSelected={isServiceSelected} getServiceSelection={getServiceSelection}
          onToggleService={toggleService} onUpdateQuantity={updateServiceQuantity} onUpdatePackage={updateServicePackage} onUpdateYoutubeMinutes={updateYoutubeMinutes} />
      </section>

      {hasSelections && <section><ProposalSummary duration={duration} selectedByModule={getSelectedServicesByModule()} totals={totals} paymentOption={paymentOption} /></section>}
      {hasSelections && <section><DurationSelector selected={duration} onSelect={setDuration} /></section>}
      {hasSelections && duration && duration > 1 && <section><PaymentSimulation totals={totals} duration={duration} selectedOption={paymentOption} onSelectOption={setPaymentOption} /></section>}

      {hasSelections && duration && (
        <section className="flex flex-col sm:flex-row justify-center gap-3">
          <Button variant="outline" size="lg" onClick={() => setDrawerOpen(true)} className="gap-2"><Eye className="h-5 w-5" />Ver Detalhe</Button>
          <Button size="lg" className="gap-2" onClick={scrollToProposal}><FileText className="h-5 w-5" />Gerar Proposta</Button>
        </section>
      )}

      {showProposal && hasSelections && duration && (
        <section ref={proposalRef}>
          <ProposalGenerator duration={duration} clientName={clientName} onClientNameChange={setClientName}
            selectedByModule={getSelectedServicesByModule()} totals={totals} paymentOption={paymentOption}
            onClear={handleClear} onSave={handleSave} saving={createProposal.isPending || updateProposal.isPending} />
        </section>
      )}

      {!hasSelections && (
        <div className="text-center py-12">
          <div className="mx-auto max-w-md">
            <div className="mb-4 flex justify-center"><div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center"><FileText className="h-10 w-10 text-primary" /></div></div>
            <h3 className="text-xl font-bold text-foreground">Nenhum serviço selecionado</h3>
            <p className="mt-2 text-muted-foreground">Selecione os serviços nos módulos acima para começar a montar sua proposta.</p>
          </div>
        </div>
      )}

      <SummaryDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} duration={duration}
        selectedByModule={getSelectedServicesByModule()} totals={totals} onGoToPayment={scrollToProposal} />
    </div>
  );
}

// ── Proposals List Tab ──────────────────────────────────────────

function PropostasListTab({ onEdit, onView }: { onEdit: (proposal: Record<string, unknown>) => void; onView: (proposal: Record<string, unknown>) => void }) {
  const { data: proposals, isLoading } = useCrmProposals();
  const { deleteProposal, duplicateProposal, updateProposal } = useCrmProposalMutations();

  if (isLoading) return <Skeleton className="h-96" />;

  const items = proposals ?? [];
  const total = items.reduce((s, p) => s + Number(p.value || 0), 0);

  const statusLabels: Record<string, string> = { draft: "Rascunho", sent: "Enviada", accepted: "Aceita", rejected: "Rejeitada" };
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
        <EmptyState
          icon={<Inbox className="w-8 h-8" />}
          title="Nenhuma proposta encontrada"
          description="Use a calculadora para criar sua primeira proposta."
        />
      ) : (
        <Card className="glass-card">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="w-36"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((p) => (
                <TableRow key={p.id} className="cursor-pointer" onClick={() => onView(p)}>
                  <TableCell className="font-medium">{p.title}</TableCell>
                  <TableCell className="font-semibold">R$ {Number(p.value || 0).toLocaleString()}</TableCell>
                  <TableCell><Badge variant={statusVariant(p.status)}>{statusLabels[p.status] || p.status}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{new Date(p.created_at).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell onClick={e => e.stopPropagation()}>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onView(p)} title="Visualizar" aria-label="Visualizar"><Eye className="w-3.5 h-3.5" /></Button>
                      {p.status === "draft" && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(p)} title="Editar" aria-label="Editar"><Pencil className="w-3.5 h-3.5" /></Button>}
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => duplicateProposal.mutate(p)} title="Duplicar" aria-label="Copiar"><Copy className="w-3.5 h-3.5" /></Button>
                      {p.status === "draft" && (
                        <Button variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => updateProposal.mutate({ id: p.id, status: "sent", sent_at: new Date().toISOString() })} title="Marcar como enviada" aria-label="Enviar">
                          <Send className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteProposal.mutate(p.id)} title="Excluir" aria-label="Excluir"><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </Card>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────

export default function FranqueadoPropostas() {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("strategy_id") ? "calculadora" : "propostas";
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [editingProposal, setEditingProposal] = useState<Record<string, unknown> | null>(null);
  const [viewingProposal, setViewingProposal] = useState<Record<string, unknown> | null>(null);

  const handleEditProposal = (proposal: Record<string, unknown>) => { setEditingProposal(proposal); setActiveTab("calculadora"); };

  return (
    <div className="w-full space-y-6">
      <PageHeader title="Propostas" subtitle="Calculadora NOE e gerador de propostas comerciais" />

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); if (v === "propostas") setEditingProposal(null); }}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="propostas"><FileText className="w-4 h-4 mr-1" /> Propostas</TabsTrigger>
          <TabsTrigger value="calculadora"><Calculator className="w-4 h-4 mr-1" /> Calculadora</TabsTrigger>
        </TabsList>
        <TabsContent value="propostas" className="space-y-6">
          <PropostasListTab onEdit={handleEditProposal} onView={setViewingProposal} />
        </TabsContent>
        <TabsContent value="calculadora" className="space-y-6">
          <CalculadoraTab editingProposal={editingProposal} onEditComplete={() => { setEditingProposal(null); setActiveTab("propostas"); }} />
        </TabsContent>
      </Tabs>

      <ProposalViewerSheet proposal={viewingProposal} open={!!viewingProposal} onClose={() => setViewingProposal(null)} />
    </div>
  );
}
