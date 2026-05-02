// @ts-nocheck
import { useState } from "react";
import { Inbox, Send, Loader2, CheckCircle, Clock, AlertTriangle, QrCode, Copy, Check } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { reportError } from "@/lib/error-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { invokeEdge } from "@/lib/edge";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { formatBRL } from "@/lib/formatting";

const statusConfig: Record<string, { label: string; icon: React.ReactNode; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendente", icon: <Clock className="w-3 h-3" />, variant: "outline" },
  paid: { label: "Pago", icon: <CheckCircle className="w-3 h-3" />, variant: "default" },
  overdue: { label: "Vencido", icon: <AlertTriangle className="w-3 h-3" />, variant: "destructive" },
  chargeback: { label: "Chargeback", icon: <AlertTriangle className="w-3 h-3" />, variant: "destructive" },
  refunded: { label: "Estornado", icon: <AlertTriangle className="w-3 h-3" />, variant: "secondary" },
};

export default function FinanceiroRepasse() {
  const { data: orgId } = useUserOrgId();
  const qc = useQueryClient();
  const [billingType, setBillingType] = useState<string>("BOLETO");
  const [pixDialog, setPixDialog] = useState<{ open: boolean; paymentId: string | null }>({ open: false, paymentId: null });
  const [copied, setCopied] = useState(false);

  const { data: charges, isLoading } = useQuery({
    queryKey: ["franchisee-charges", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("franchisee_charges")
        .select("*, franchisee_org:organizations!franchisee_charges_franchisee_org_id_fkey(name)")
        .eq("organization_id", orgId!)
        .order("month", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const generateCharges = useMutation({
    mutationFn: async () => {
      const { data, error } = await invokeEdge("asaas-charge-franchisee", {
        body: { organization_id: orgId, month: currentMonth, billing_type: billingType },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      const created = data.results?.filter((r: { status: string }) => r.status === "created").length || 0;
      const skipped = data.results?.filter((r: { status: string }) => r.status === "skipped").length || 0;
      toast.success(`${created} cobranças geradas, ${skipped} ignoradas`);
      qc.invalidateQueries({ queryKey: ["franchisee-charges"] });
    },
    onError: (err: unknown) => {
      reportError(err, { title: `Erro ao gerar cobranças: ${err.message}`, category: "financeiro.repasse" });
    },
  });

  const fetchPix = useQuery({
    queryKey: ["pix-qr", pixDialog.paymentId],
    queryFn: async () => {
      const { data, error } = await invokeEdge("asaas-get-pix", {
        body: { payment_id: pixDialog.paymentId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { encoded_image: string | null; copy_paste: string | null };
    },
    enabled: !!pixDialog.paymentId && pixDialog.open,
  });

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Código PIX copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) return <div className="space-y-6"><Skeleton className="h-12 w-full" /><Skeleton className="h-64 w-full" /></div>;

  const totalPending = charges?.filter(c => c.status === "pending").reduce((s, c) => s + Number(c.total_amount), 0) ?? 0;
  const totalPaid = charges?.filter(c => c.status === "paid").reduce((s, c) => s + Number(c.total_amount), 0) ?? 0;

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-header-title">Repasse</h1>
          <p className="text-sm text-muted-foreground mt-1">Cobranças automáticas de royalties e sistema para franqueados</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={billingType} onValueChange={setBillingType}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BOLETO">Boleto</SelectItem>
              <SelectItem value="PIX">PIX</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => generateCharges.mutate()}
            disabled={generateCharges.isPending}
            className="gap-2"
          >
            {generateCharges.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Gerar Cobranças do Mês
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Pendente</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-foreground">{formatBRL(totalPending)}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Recebido</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-green-600">{formatBRL(totalPaid)}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Cobranças Geradas</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-foreground">{charges?.length ?? 0}</span>
          </CardContent>
        </Card>
      </div>

      {/* Charges table */}
      {!charges || charges.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Inbox className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-1">Nenhuma cobrança gerada</h3>
          <p className="text-sm text-muted-foreground">Clique em "Gerar Cobranças do Mês" para criar cobranças automáticas para franqueados vinculados.</p>
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
                {charges.map((charge) => {
                  const st = statusConfig[charge.status] || statusConfig.pending;
                  const franchiseeName = (charge as unknown as { franchisee_org?: { name?: string } }).franchisee_org?.name || "—";
                  const canShowPix = charge.asaas_payment_id && charge.status === "pending";
                  return (
                    <TableRow key={charge.id}>
                      <TableCell className="font-medium">{franchiseeName}</TableCell>
                      <TableCell>{charge.month}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatBRL(Number(charge.royalty_amount))}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatBRL(Number(charge.system_fee))}</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">{formatBRL(Number(charge.total_amount))}</TableCell>
                      <TableCell>
                        <Badge variant={st.variant} className="gap-1">
                          {st.icon} {st.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {charge.paid_at ? new Date(charge.paid_at).toLocaleDateString("pt-BR") : "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        {canShowPix ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1"
                            onClick={() => {
                              setCopied(false);
                              setPixDialog({ open: true, paymentId: charge.asaas_payment_id });
                            }}
                          >
                            <QrCode className="w-4 h-4" />
                            Ver PIX
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
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
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><QrCode className="w-5 h-5" /> QR Code PIX</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {fetchPix.isLoading ? (
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            ) : fetchPix.data?.encoded_image ? (
              <>
                <img
                  src={`data:image/png;base64,${fetchPix.data.encoded_image}`}
                  alt="QR Code PIX"
                  className="w-56 h-56 rounded-lg border"
                />
                {fetchPix.data.copy_paste && (
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => handleCopy(fetchPix.data?.copy_paste ?? "")}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copiado!" : "Copiar código PIX"}
                  </Button>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center">
                QR Code não disponível para esta cobrança. Verifique se o método de pagamento é PIX.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
