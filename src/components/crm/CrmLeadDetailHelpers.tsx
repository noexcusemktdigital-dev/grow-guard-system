// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import {
  Phone, Mail, Building2, DollarSign, Tag, Clock, CheckCircle, XCircle,
  MessageCircle, ExternalLink, CircleDot, Plus, Trash2, CalendarDays,
  PhoneCall, Video, Send, StickyNote, AlertTriangle, FileText, Copy,
  MoreHorizontal, ArrowRight, Loader2, Package
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCrmProducts, type CrmProduct } from "@/hooks/useCrmProducts";
import { useCrmLeadProducts, useCrmLeadProductMutations } from "@/hooks/useCrmLeadProducts";
import { useCrmProposals, useCrmProposalMutations, type CrmProposal, type ProposalItem } from "@/hooks/useCrmProposals";
import { useCrmLeadHistory } from "@/hooks/useCrmLeadHistory";
import { useWhatsAppMessages, useSendWhatsAppMessage } from "@/hooks/useWhatsApp";
import { ChatMessageBubble } from "@/components/cliente/ChatMessageBubble";
import { useToast } from "@/hooks/use-toast";
import React from "react";

interface LeadRow {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  company: string | null;
  value: number | null;
  stage: string;
  source: string | null;
  tags: string[] | null;
  created_at: string;
  won_at?: string | null;
  lost_at?: string | null;
  lost_reason?: string | null;
  whatsapp_contact_id?: string | null;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft: { label: "Rascunho", color: "bg-muted text-muted-foreground" },
  sent: { label: "Enviada", color: "bg-blue-500/15 text-blue-600 border-blue-500/30" },
  accepted: { label: "Aceita", color: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" },
  rejected: { label: "Rejeitada", color: "bg-red-500/15 text-red-600 border-red-500/30" },
};

const HISTORY_ICONS: Record<string, React.ReactNode> = {
  created: <Plus className="w-3 h-3" />,
  stage_change: <ArrowRight className="w-3 h-3" />,
  won: <CheckCircle className="w-3 h-3 text-emerald-500" />,
  lost: <XCircle className="w-3 h-3 text-red-500" />,
  tag_added: <Tag className="w-3 h-3" />,
  tag_removed: <Tag className="w-3 h-3" />,
  field_updated: <StickyNote className="w-3 h-3" />,
  funnel_change: <ArrowRight className="w-3 h-3" />,
};

/* ========== LEAD PRODUCTS TAB COMPONENT ========== */

export function LeadProductsTab({ leadId }: { leadId: string }) {
  const { toast } = useToast();
  const { data: leadProducts, isLoading } = useCrmLeadProducts(leadId);
  const { data: availableProducts } = useCrmProducts(true);
  const { addProduct, removeProduct } = useCrmLeadProductMutations();

  const [showAdd, setShowAdd] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [qty, setQty] = useState("1");
  const [discount, setDiscount] = useState("0");

  const selectedProduct = availableProducts?.find(p => p.id === selectedProductId);

  const handleAdd = () => {
    if (!selectedProductId || !selectedProduct) return;
    addProduct.mutate(
      {
        lead_id: leadId,
        product_id: selectedProductId,
        quantity: parseInt(qty) || 1,
        unit_price: selectedProduct.price,
        discount_percent: parseFloat(discount) || 0,
      },
      {
        onSuccess: () => {
          toast({ title: "Produto vinculado" });
          setShowAdd(false);
          setSelectedProductId("");
          setQty("1");
          setDiscount("0");
        },
        onError: (err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err); toast({ title: "Erro", description: msg.includes("duplicate") ? "Produto já vinculado a este lead" : msg, variant: "destructive" });
        },
      }
    );
  };

  const calcSubtotal = (item: { quantity: number; unit_price: number; discount_percent: number }) =>
    item.quantity * item.unit_price * (1 - item.discount_percent / 100);

  const total = (leadProducts || []).reduce((sum, lp) => sum + calcSubtotal(lp), 0);

  // Filter out products already linked
  const linkedIds = new Set((leadProducts || []).map(lp => lp.product_id));
  const unlinkedProducts = (availableProducts || []).filter(p => !linkedIds.has(p.id));

  if (isLoading) return <div className="text-center py-6 text-xs text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold">Produtos ({leadProducts?.length || 0})</p>
        <Button size="sm" className="h-7 text-xs gap-1" onClick={() => setShowAdd(true)} disabled={unlinkedProducts.length === 0}>
          <Plus className="w-3 h-3" /> Adicionar
        </Button>
      </div>

      {(!leadProducts || leadProducts.length === 0) && !showAdd && (
        <div className="text-center py-8">
          <Package className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum produto vinculado</p>
          <p className="text-xs text-muted-foreground mt-1">Adicione produtos cadastrados a este lead.</p>
        </div>
      )}

      {leadProducts && leadProducts.length > 0 && (
        <div className="border rounded-lg overflow-hidden overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px] h-8">Produto</TableHead>
                <TableHead className="text-[10px] h-8 text-right">Qtd</TableHead>
                <TableHead className="text-[10px] h-8 text-right">Preço</TableHead>
                <TableHead className="text-[10px] h-8 text-right">Desc%</TableHead>
                <TableHead className="text-[10px] h-8 text-right">Subtotal</TableHead>
                <TableHead className="text-[10px] h-8 w-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leadProducts.map(lp => (
                <TableRow key={lp.id}>
                  <TableCell className="text-xs py-2">{lp.product_name}</TableCell>
                  <TableCell className="text-xs py-2 text-right">{lp.quantity}</TableCell>
                  <TableCell className="text-xs py-2 text-right">
                    {lp.unit_price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </TableCell>
                  <TableCell className="text-xs py-2 text-right">{lp.discount_percent}%</TableCell>
                  <TableCell className="text-xs py-2 text-right font-medium">
                    {calcSubtotal(lp).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </TableCell>
                  <TableCell className="py-2">
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive" onClick={() => { removeProduct.mutate({ id: lp.id, lead_id: leadId }); toast({ title: "Produto removido" }); }}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-between items-center px-4 py-2 bg-muted/30 border-t">
            <span className="text-xs font-semibold">Total</span>
            <span className="text-sm font-bold text-primary">
              {total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </span>
          </div>
        </div>
      )}

      {/* Add product dialog */}
      <Dialog open={showAdd} onOpenChange={o => { if (!o) setShowAdd(false); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Adicionar Produto</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Produto</Label>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {unlinkedProducts.map(p => (
                    <SelectItem key={p.id} value={p.id} className="text-sm">
                      {p.name} — {p.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="produto-qty" className="text-xs">Quantidade</Label>
                <Input id="produto-qty" type="number" min="1" value={qty} onChange={e => setQty(e.target.value)} className="h-8 text-sm" />
              </div>
              <div>
                <Label htmlFor="produto-desconto" className="text-xs">Desconto (%)</Label>
                <Input id="produto-desconto" type="number" min="0" max="100" value={discount} onChange={e => setDiscount(e.target.value)} className="h-8 text-sm" />
              </div>
            </div>
            {selectedProduct && (
              <p className="text-xs text-muted-foreground">
                Subtotal: {(
                  (parseInt(qty) || 1) * selectedProduct.price * (1 - (parseFloat(discount) || 0) / 100)
                ).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowAdd(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleAdd} disabled={!selectedProductId || addProduct.isPending}>
              {addProduct.isPending && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ========== PROPOSALS TAB COMPONENT ========== */

export function ProposalsTab({ leadId, onValueSync }: { leadId: string; onValueSync?: (value: number) => void }) {
  const { toast } = useToast();
  const { data: proposals, isLoading } = useCrmProposals(leadId);
  const { createProposal, updateProposal, deleteProposal, duplicateProposal } = useCrmProposalMutations();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const resetForm = () => {
    setTitle(""); setValue(""); setFile(null);
  };

  const handleAttach = async () => {
    if (!title.trim()) return;
    setUploading(true);
    try {
      let fileUrl: string | null = null;
      if (file) {
        const ext = file.name.split(".").pop() || "pdf";
        const path = `proposals/${leadId}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("crm-files").upload(path, file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("crm-files").getPublicUrl(path);
        fileUrl = urlData.publicUrl;
      }
      const proposalValue = value ? parseFloat(value) : 0;
      createProposal.mutate({
        title,
        lead_id: leadId,
        value: proposalValue,
        status: "draft",
        items: [],
        discount_total: 0,
        notes: fileUrl ? `Arquivo: ${fileUrl}` : null,
      });
      // Sync proposal value to lead value
      if (proposalValue > 0 && onValueSync) {
        onValueSync(proposalValue);
      }
      toast({ title: "Proposta anexada" });
      setShowForm(false);
      resetForm();
    } catch (err: unknown) {
      toast({ title: "Erro ao anexar", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleStatusChange = (id: string, status: string) => {
    const now = new Date().toISOString();
    const extra: Record<string, unknown> = { status };
    if (status === "sent") extra.sent_at = now;
    if (status === "accepted") extra.accepted_at = now;
    if (status === "rejected") extra.rejected_at = now;
    updateProposal.mutate({ id, ...extra });
    toast({ title: `Status alterado para ${STATUS_MAP[status]?.label || status}` });
  };

  if (isLoading) return <div className="text-center py-6 text-xs text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold">Propostas ({proposals?.length || 0})</p>
        <Button size="sm" className="h-7 text-xs gap-1" onClick={() => { resetForm(); setShowForm(true); }}><Plus className="w-3 h-3" /> Anexar Proposta</Button>
      </div>

      {(!proposals || proposals.length === 0) && !showForm && (
        <div className="text-center py-8">
          <FileText className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nenhuma proposta</p>
          <p className="text-xs text-muted-foreground mt-1">Anexe propostas em PDF ou imagem para este lead.</p>
        </div>
      )}

      {proposals?.map(p => {
        const st = STATUS_MAP[p.status] || STATUS_MAP.draft;
        const fileUrl = p.notes?.startsWith("Arquivo:") ? p.notes.replace("Arquivo: ", "").trim() : null;
        return (
          <Card key={p.id} className="overflow-hidden">
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{p.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className={`text-[10px] ${st.color}`}>{st.label}</Badge>
                    <span className="text-xs font-semibold text-primary">
                      R$ {(p.value || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {new Date(p.created_at).toLocaleDateString("pt-BR")}
                  </p>
                  {fileUrl && (
                    <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline flex items-center gap-1 mt-1">
                      <ExternalLink className="w-3 h-3" /> Ver arquivo
                    </a>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" aria-label="Mais opções"><MoreHorizontal className="w-4 h-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="text-xs">
                    {p.status === "draft" && <DropdownMenuItem onClick={() => handleStatusChange(p.id, "sent")}>Marcar como Enviada</DropdownMenuItem>}
                    {(p.status === "sent" || p.status === "draft") && <DropdownMenuItem onClick={() => handleStatusChange(p.id, "accepted")}>Marcar como Aceita</DropdownMenuItem>}
                    {(p.status === "sent" || p.status === "draft") && <DropdownMenuItem onClick={() => handleStatusChange(p.id, "rejected")}>Marcar como Rejeitada</DropdownMenuItem>}
                    <DropdownMenuItem onClick={() => { duplicateProposal.mutate(p); toast({ title: "Proposta duplicada" }); }}>Duplicar</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => { deleteProposal.mutate(p.id); toast({ title: "Proposta excluída" }); }}>Excluir</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Attach Form Dialog */}
      <Dialog open={showForm} onOpenChange={o => { if (!o) { setShowForm(false); resetForm(); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Anexar Proposta</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="proposta-titulo" className="text-xs">Título *</Label>
              <Input id="proposta-titulo" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Proposta comercial..." className="h-8 text-sm" />
            </div>

            <div>
              <Label htmlFor="proposta-valor" className="text-xs">Valor (R$)</Label>
              <Input id="proposta-valor" type="number" step="0.01" value={value} onChange={e => setValue(e.target.value)} placeholder="0,00" className="h-8 text-sm" />
            </div>

            <div>
              <Label htmlFor="proposta-arquivo" className="text-xs">Arquivo (PDF, imagem)</Label>
              <Input
                id="proposta-arquivo"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={e => setFile(e.target.files?.[0] || null)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => { setShowForm(false); resetForm(); }}>Cancelar</Button>
            <Button size="sm" onClick={handleAttach} disabled={!title.trim() || uploading}>
              {uploading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
              Anexar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ========== WHATSAPP TAB COMPONENT ========== */

export function WhatsAppTab({ lead }: { lead: LeadRow }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const whatsappContactId = lead.whatsapp_contact_id;
  const { data: messages = [], isLoading } = useWhatsAppMessages(whatsappContactId || null);
  const sendMutation = useSendWhatsAppMessage();
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!text.trim() || !whatsappContactId) return;
    sendMutation.mutate(
      { contactId: whatsappContactId, contactPhone: lead.phone || "", message: text.trim() },
      {
        onSuccess: () => setText(""),
        onError: (err: unknown) =>
          toast({ title: "Erro ao enviar", description: err instanceof Error ? err.message : String(err), variant: "destructive" }),
      }
    );
  };

  if (!whatsappContactId) {
    return (
      <div className="text-center py-8">
        <MessageCircle className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Nenhuma conversa vinculada</p>
        <p className="text-xs text-muted-foreground mt-1">
          {lead.phone ? "Quando este número enviar uma mensagem, será vinculado automaticamente." : "Adicione um telefone ao lead para vincular ao WhatsApp."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-xl overflow-hidden border" style={{ maxHeight: "450px" }}>
      {/* WhatsApp-style header */}
      <div className="flex items-center gap-3 px-3 py-2.5 bg-[#075e54] dark:bg-[#1f2c34] text-white">
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold flex-shrink-0">
          {lead.name?.charAt(0)?.toUpperCase() || "?"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{lead.name}</p>
          {lead.phone && <p className="text-[10px] opacity-70">{lead.phone}</p>}
        </div>
        <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 text-white/80 hover:text-white hover:bg-white/10" onClick={() => navigate("/cliente/chat")}>
          <ExternalLink className="w-3 h-3" /> Chat
        </Button>
      </div>

      {/* Messages area with WhatsApp background */}
      <div className="flex-1 overflow-y-auto p-3 min-h-[200px] max-h-[300px] whatsapp-bg">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-8">Nenhuma mensagem</p>
        ) : (
          messages.map((msg) => <ChatMessageBubble key={msg.id} message={msg} />)
        )}
        <div ref={bottomRef} />
      </div>

      {/* WhatsApp-style input */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        className="flex items-center gap-2 px-3 py-2 bg-[#f0f0f0] dark:bg-[#1f2c34] border-t"
      >
        <Input
          placeholder="Mensagem..."
          className="flex-1 h-9 text-xs rounded-full bg-white dark:bg-[#2a3942] border-0 px-4"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={sendMutation.isPending}
        />
        <Button
          type="submit"
          size="icon"
          className="h-9 w-9 rounded-full shrink-0 bg-[#25d366] hover:bg-[#1ebe57] text-white"
          disabled={!text.trim() || sendMutation.isPending}
         aria-label="Enviar">
          {sendMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
        </Button>
      </form>
    </div>
  );
}

/* ── Lead History Timeline ── */
const HISTORY_ICONS_2: Record<string, React.ReactNode> = {
  created: <Plus className="w-3 h-3" />,
  stage_change: <ArrowRight className="w-3 h-3" />,
  won: <CheckCircle className="w-3 h-3 text-emerald-500" />,
  lost: <XCircle className="w-3 h-3 text-red-500" />,
  tag_added: <Tag className="w-3 h-3" />,
  tag_removed: <Tag className="w-3 h-3" />,
  field_updated: <StickyNote className="w-3 h-3" />,
  funnel_change: <ArrowRight className="w-3 h-3" />,
};

export function LeadHistoryTimeline({ leadId }: { leadId: string }) {
  const { data: history, isLoading } = useCrmLeadHistory(leadId);
  const [showAll, setShowAll] = useState(false);

  if (isLoading) return <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>;
  if (!history || history.length === 0) return null;

  const items = showAll ? history : history.slice(0, 5);

  return (
    <div className="space-y-2">
      <p className="text-[10px] text-muted-foreground uppercase font-medium">Histórico</p>
      <div className="space-y-0">
        {items.map((entry, i) => (
          <div key={entry.id} className="flex gap-2 pb-2">
            <div className="flex flex-col items-center">
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                {HISTORY_ICONS[entry.event_type] || <Clock className="w-3 h-3" />}
              </div>
              {i < items.length - 1 && <div className="w-px flex-1 bg-border mt-0.5" />}
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <p className="text-xs">{entry.description}</p>
              <p className="text-[10px] text-muted-foreground">
                {new Date(entry.created_at).toLocaleDateString("pt-BR")} · {new Date(entry.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        ))}
      </div>
      {history.length > 5 && !showAll && (
        <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setShowAll(true)}>
          Ver mais ({history.length - 5})
        </Button>
      )}
    </div>
  );
}
