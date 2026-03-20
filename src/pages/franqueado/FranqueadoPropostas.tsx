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
import {
  FileText, DollarSign, Inbox, Calculator, Copy, Trash2, Send, Eye, Pencil, Download, Link, CheckCircle, FileSignature,
} from "lucide-react";
import { useCrmProposals, useCrmProposalMutations } from "@/hooks/useCrmProposals";
import { useCrmLeads } from "@/hooks/useCrmLeads";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useSearchParams, useNavigate } from "react-router-dom";

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
function ProposalViewerSheet({ proposal, open, onClose }: { proposal: any; open: boolean; onClose: () => void }) {
  const { data: leads } = useCrmLeads();
  const { updateProposal } = useCrmProposalMutations();
  const navigate = useNavigate();
  const previewRef = useRef<HTMLDivElement>(null);
  const [linkLeadId, setLinkLeadId] = useState(proposal?.lead_id || "");

  useEffect(() => {
    if (proposal) setLinkLeadId(proposal.lead_id || "");
  }, [proposal]);

  if (!proposal) return null;

  const content = proposal.content || {};
  const items = Array.isArray(proposal.items) ? proposal.items : [];
  const totalValue = Number(proposal.value || 0);

  const handleDownloadPdf = async () => {
    const el = previewRef.current;
    if (!el) return;
    const html2pdf = (await import("html2pdf.js")).default;
    html2pdf().set({
      margin: [10, 10, 10, 10],
      filename: `${proposal.title || "Proposta"}.pdf`,
      image: { type: "jpeg", quality: 0.95 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    }).from(el).save();
    toast.success("PDF gerado!");
  };

  const handleLinkLead = () => {
    if (!linkLeadId || linkLeadId === "none") return;
    updateProposal.mutate({ id: proposal.id, lead_id: linkLeadId }, {
      onSuccess: () => toast.success("Lead vinculado!"),
    });
  };

  const handleAccept = () => {
    updateProposal.mutate({ id: proposal.id, status: "accepted", accepted_at: new Date().toISOString() }, {
      onSuccess: () => { toast.success("Proposta marcada como aceita!"); onClose(); },
    });
  };

  const handleGenerateContract = () => {
    const leadId = proposal.lead_id || linkLeadId;
    navigate(`/franqueado/contratos?tab=novo&proposal_id=${proposal.id}${leadId ? `&lead_id=${leadId}` : ""}`);
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent className="sm:max-w-3xl overflow-y-auto">
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

        {/* Link to Lead */}
        <div className="flex items-end gap-2 mb-4">
          <div className="flex-1">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Vincular a Lead</label>
            <Select value={linkLeadId} onValueChange={setLinkLeadId}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Selecione um lead" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem vínculo</SelectItem>
                {(leads ?? []).map((l: any) => (
                  <SelectItem key={l.id} value={l.id}>{l.name} {l.company ? `- ${l.company}` : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" variant="outline" onClick={handleLinkLead} disabled={!linkLeadId || linkLeadId === "none"}>
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
                  {items.map((item: any, i: number) => (
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

function CalculadoraTab({ editingProposal, onEditComplete }: { editingProposal?: any; onEditComplete?: () => void }) {
  const [searchParams] = useSearchParams();
  const leadIdFromUrl = searchParams.get("lead_id");
  const { data: leads } = useCrmLeads();
  const { createProposal, updateProposal } = useCrmProposalMutations();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showProposal, setShowProposal] = useState(false);
  const [leadId, setLeadId] = useState(leadIdFromUrl || "");
  const proposalRef = useRef<HTMLDivElement>(null);

  const {
    duration, selectedServices, clientName, paymentOption,
    setDuration, setClientName, setPaymentOption,
    toggleService, updateServiceQuantity, updateServicePackage,
    updateYoutubeMinutes, clearSelection, isServiceSelected,
    getServiceSelection, totals, getSelectedServicesByModule,
  } = useCalculator();

  useEffect(() => {
    if (editingProposal?.content) {
      const c = editingProposal.content;
      if (c.client_name) setClientName(c.client_name);
      if (c.duration) setDuration(c.duration);
      if (c.payment_option) setPaymentOption(c.payment_option);
      if (editingProposal.lead_id) setLeadId(editingProposal.lead_id);
    } else if (!leadIdFromUrl) {
      clearSelection();
    }
  }, [editingProposal]); // eslint-disable-line react-hooks/exhaustive-deps

  const scrollToProposal = () => {
    setShowProposal(true);
    setTimeout(() => { proposalRef.current?.scrollIntoView({ behavior: "smooth" }); }, 100);
  };

  const handleClear = () => { clearSelection(); setShowProposal(false); };

  const handleSave = () => {
    const title = clientName ? `Proposta - ${clientName}` : `Proposta - ${new Date().toLocaleDateString("pt-BR")}`;
    const selectedByModule = getSelectedServicesByModule();
    const items = Object.values(selectedByModule).flatMap(({ selections }) =>
      selections.map((s) => ({ product_id: null, name: s.service.name, quantity: s.quantity, unit_price: s.price, discount: 0, total: s.price }))
    );
    const payload = {
      title, value: totals.totalPeriod, status: "draft" as const,
      lead_id: leadId || null, items, payment_terms: paymentOption,
      content: { client_name: clientName, duration, payment_option: paymentOption, services: selectedServices } as any,
    };
    if (editingProposal) {
      updateProposal.mutate({ id: editingProposal.id, ...payload }, {
        onSuccess: () => { toast.success("Proposta atualizada!"); onEditComplete?.(); },
        onError: (e: any) => toast.error(e.message || "Erro ao atualizar proposta"),
      });
    } else {
      createProposal.mutate(payload, {
        onSuccess: () => toast.success("Proposta salva com sucesso!"),
        onError: (e: any) => toast.error(e.message || "Erro ao salvar proposta"),
      });
    }
  };

  const hasSelections = selectedServices.length > 0;

  return (
    <div className="space-y-8">
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Vincular ao Lead (opcional)</label>
        <Select value={leadId} onValueChange={setLeadId}>
          <SelectTrigger className="h-9 max-w-sm"><SelectValue placeholder="Sem vínculo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sem vínculo</SelectItem>
            {(leads ?? []).map((l: any) => (
              <SelectItem key={l.id} value={l.id}>{l.name} {l.company ? `- ${l.company}` : ""}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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

function PropostasListTab({ onEdit, onView }: { onEdit: (proposal: any) => void; onView: (proposal: any) => void }) {
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
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onView(p)} title="Visualizar"><Eye className="w-3.5 h-3.5" /></Button>
                      {p.status === "draft" && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(p)} title="Editar"><Pencil className="w-3.5 h-3.5" /></Button>}
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => duplicateProposal.mutate(p)} title="Duplicar"><Copy className="w-3.5 h-3.5" /></Button>
                      {p.status === "draft" && (
                        <Button variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => updateProposal.mutate({ id: p.id, status: "sent", sent_at: new Date().toISOString() })} title="Marcar como enviada">
                          <Send className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteProposal.mutate(p.id)} title="Excluir"><Trash2 className="w-3.5 h-3.5" /></Button>
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
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [editingProposal, setEditingProposal] = useState<any>(null);
  const [viewingProposal, setViewingProposal] = useState<any>(null);

  const handleEditProposal = (proposal: any) => { setEditingProposal(proposal); setActiveTab("calculadora"); };

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
