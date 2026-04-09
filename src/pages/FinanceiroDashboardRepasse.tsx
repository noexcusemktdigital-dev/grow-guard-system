// @ts-nocheck
import { useState, useMemo } from "react";
import { formatBRL } from "@/lib/formatting";
import { Inbox, Search, Clock, CheckCircle, AlertTriangle, Loader2, Send, QrCode, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast as sonnerToast } from "sonner";
import { type ChargeRow, type ChargeResult } from "./FinanceiroDashboardTypes";

export interface RepasseTabProps {
  orgId: string | null | undefined;
}

export function RepasseTab({ orgId }: RepasseTabProps) {
  const qc = useQueryClient();
  const [billingType, setBillingType] = useState("BOLETO");
  const [pixDialog, setPixDialog] = useState<{ open: boolean; paymentId: string | null }>({ open: false, paymentId: null });
  const [copied, setCopied] = useState(false);
  const [searchFranqueado, setSearchFranqueado] = useState("");
  const [filterRepasseStatus, setFilterRepasseStatus] = useState("all");
  const [filterRepasseMonth, setFilterRepasseMonth] = useState("all");

  const { data: charges, isLoading } = useQuery({
    queryKey: ["franchisee-charges", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("franchisee_charges")
        .select("*, franchisee_org:organizations!franchisee_charges_franchisee_org_id_fkey(name)")
        .eq("organization_id", orgId ?? "")
        .order("month", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  const repasseMonthOptions = useMemo(() => {
    const ms = new Set<string>();
    (charges ?? []).forEach((c: ChargeRow) => { if (c.month) ms.add(c.month); });
    return [...ms].sort().reverse();
  }, [charges]);

  const filteredCharges = useMemo(() => {
    let list = charges ?? [];
    if (searchFranqueado) list = list.filter((c: ChargeRow) => (c.franchisee_org?.name || "").toLowerCase().includes(searchFranqueado.toLowerCase()));
    if (filterRepasseStatus !== "all") list = list.filter((c: ChargeRow) => c.status === filterRepasseStatus);
    if (filterRepasseMonth !== "all") list = list.filter((c: ChargeRow) => c.month === filterRepasseMonth);
    return list;
  }, [charges, searchFranqueado, filterRepasseStatus, filterRepasseMonth]);

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const generateCharges = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("asaas-charge-franchisee", {
        body: { organization_id: orgId, month: currentMonth, billing_type: billingType },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      const created = data.results?.filter((r: ChargeResult) => r.status === "created").length || 0;
      const skipped = data.results?.filter((r: ChargeResult) => r.status === "skipped").length || 0;
      sonnerToast.success(`${created} cobranças geradas, ${skipped} ignoradas`);
      qc.invalidateQueries({ queryKey: ["franchisee-charges"] });
    },
    onError: (err: unknown) => sonnerToast.error(`Erro: ${err instanceof Error ? err.message : String(err)}`),
  });

  const fetchPix = useQuery({
    queryKey: ["pix-qr", pixDialog.paymentId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("asaas-get-pix", { body: { payment_id: pixDialog.paymentId } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { encoded_image: string | null; copy_paste: string | null };
    },
    enabled: !!pixDialog.paymentId && pixDialog.open,
  });

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    sonnerToast.success("Código PIX copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) return <div className="space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-64 w-full" /></div>;

  const totalPending = charges?.filter((c: ChargeRow) => c.status === "pending").reduce((s: number, c: ChargeRow) => s + Number(c.total_amount), 0) ?? 0;
  const totalPaid = charges?.filter((c: ChargeRow) => c.status === "paid").reduce((s: number, c: ChargeRow) => s + Number(c.total_amount), 0) ?? 0;

  const statusConfig: Record<string, { label: string; icon: React.ReactNode; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending: { label: "Pendente", icon: <Clock className="w-3 h-3" />, variant: "outline" },
    paid: { label: "Pago", icon: <CheckCircle className="w-3 h-3" />, variant: "default" },
    overdue: { label: "Vencido", icon: <AlertTriangle className="w-3 h-3" />, variant: "destructive" },
  };

  return (
    <>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar franqueado..." className="pl-9" value={searchFranqueado} onChange={e => setSearchFranqueado(e.target.value)} aria-label="Buscar franqueado" />
        </div>
        <Select value={filterRepasseStatus} onValueChange={setFilterRepasseStatus}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="paid">Pago</SelectItem>
            <SelectItem value="overdue">Vencido</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterRepasseMonth} onValueChange={setFilterRepasseMonth}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Mês" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Meses</SelectItem>
            {repasseMonthOptions.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={billingType} onValueChange={setBillingType}>
          <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="BOLETO">Boleto</SelectItem>
            <SelectItem value="PIX">PIX</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => generateCharges.mutate()} disabled={generateCharges.isPending} className="gap-2">
          {generateCharges.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Gerar Cobranças
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Pendente</CardTitle></CardHeader><CardContent><span className="text-2xl font-bold text-foreground">{formatBRL(totalPending)}</span></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Recebido</CardTitle></CardHeader><CardContent><span className="text-2xl font-bold text-emerald-600">{formatBRL(totalPaid)}</span></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Cobranças Geradas</CardTitle></CardHeader><CardContent><span className="text-2xl font-bold text-foreground">{charges?.length ?? 0}</span></CardContent></Card>
      </div>

      {filteredCharges.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Inbox className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-1">Nenhuma cobrança encontrada</h3>
          <p className="text-sm text-muted-foreground">{!charges || charges.length === 0 ? 'Clique em "Gerar Cobranças" para criar cobranças automáticas.' : "Nenhum resultado para os filtros selecionados."}</p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Franqueado</TableHead>
                  <TableHead>Mês</TableHead>
                  <TableHead className="text-right">Royalties</TableHead>
                  <TableHead className="text-right">Sistema</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pago em</TableHead>
                  <TableHead className="text-center">PIX</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCharges.map((charge: ChargeRow) => {
                  const st = statusConfig[charge.status] || statusConfig.pending;
                  const franchiseeName = charge.franchisee_org?.name || "—";
                  const canShowPix = charge.asaas_payment_id && charge.status === "pending";
                  return (
                    <TableRow key={charge.id}>
                      <TableCell className="font-medium">{franchiseeName}</TableCell>
                      <TableCell>{charge.month}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatBRL(Number(charge.royalty_amount))}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatBRL(Number(charge.system_fee))}</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">{formatBRL(Number(charge.total_amount))}</TableCell>
                      <TableCell><Badge variant={st.variant} className="gap-1">{st.icon} {st.label}</Badge></TableCell>
                      <TableCell className="text-muted-foreground text-sm">{charge.paid_at ? new Date(charge.paid_at).toLocaleDateString("pt-BR") : "—"}</TableCell>
                      <TableCell className="text-center">
                        {canShowPix ? (
                          <Button variant="ghost" size="sm" className="gap-1" onClick={() => { setCopied(false); setPixDialog({ open: true, paymentId: charge.asaas_payment_id }); }}>
                            <QrCode className="w-4 h-4" /> Ver PIX
                          </Button>
                        ) : <span className="text-muted-foreground text-xs">—</span>}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* PIX QR Code Dialog */}
      <Dialog open={pixDialog.open} onOpenChange={(open) => setPixDialog({ open, paymentId: open ? pixDialog.paymentId : null })}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><QrCode className="w-5 h-5" /> QR Code PIX</DialogTitle></DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {fetchPix.isLoading ? (
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            ) : fetchPix.data?.encoded_image ? (
              <>
                <img src={`data:image/png;base64,${fetchPix.data.encoded_image}`} alt="QR Code PIX" className="w-56 h-56 rounded-lg border" />
                {fetchPix.data.copy_paste && (
                  <Button variant="outline" className="w-full gap-2" onClick={() => handleCopy(fetchPix.data?.copy_paste ?? "")}>
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copiado!" : "Copiar código PIX"}
                  </Button>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center">QR Code não disponível.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
