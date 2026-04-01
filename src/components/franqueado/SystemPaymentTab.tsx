// @ts-nocheck
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Clock, AlertCircle, CreditCard, QrCode, FileText, Copy, Inbox } from "lucide-react";
import { useFranqueadoSystemPayments, useChargeSystemFee } from "@/hooks/useFranqueadoSystemPayments";
import { toast } from "sonner";

const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function formatMonth(m: string) {
  const [y, mo] = m.split("-");
  return `${monthNames[parseInt(mo) - 1]} ${y}`;
}

export function SystemPaymentTab() {
  const { payments, currentPayment, currentMonth } = useFranqueadoSystemPayments();
  const chargeMutation = useChargeSystemFee();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [paymentResult, setPaymentResult] = useState<Record<string, unknown> | null>(null);

  const handlePay = async (method: string) => {
    setSelectedMethod(method);
    try {
      const result = await chargeMutation.mutateAsync(method);
      setPaymentResult(result);
    } catch {
      // error handled by mutation
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Código copiado!");
  };

  const isPaid = currentPayment?.status === "paid";
  const isPending = currentPayment?.status === "pending";

  if (payments.isLoading) {
    return <div className="space-y-4"><Skeleton className="h-32" /><Skeleton className="h-64" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Current month status */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Mensalidade do Sistema — {formatMonth(currentMonth)}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl font-bold">R$ 250,00</div>
              {isPaid && (
                <Badge className="gap-1 bg-emerald-500/15 text-emerald-700 border-emerald-500/30">
                  <CheckCircle className="w-3 h-3" />Pago
                </Badge>
              )}
              {isPending && (
                <Badge variant="secondary" className="gap-1">
                  <Clock className="w-3 h-3" />Pendente
                </Badge>
              )}
              {!currentPayment && (
                <Badge variant="destructive" className="gap-1">
                  <AlertCircle className="w-3 h-3" />Não gerado
                </Badge>
              )}
            </div>
            {!isPaid && (
              <Button onClick={() => { setDialogOpen(true); setPaymentResult(null); setSelectedMethod(null); }}>
                Pagar R$ 250
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* History */}
      {(payments.data?.length ?? 0) > 0 ? (
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Histórico de Pagamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mês</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pago em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.data?.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{formatMonth(p.month)}</TableCell>
                    <TableCell>R$ {Number(p.amount).toLocaleString("pt-BR")}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{p.billing_type}</Badge>
                    </TableCell>
                    <TableCell>
                      {p.status === "paid" && <Badge className="gap-1 bg-emerald-500/15 text-emerald-700 border-emerald-500/30"><CheckCircle className="w-3 h-3" />Pago</Badge>}
                      {p.status === "pending" && <Badge variant="secondary" className="gap-1"><Clock className="w-3 h-3" />Pendente</Badge>}
                      {p.status === "overdue" && <Badge variant="destructive" className="gap-1"><AlertCircle className="w-3 h-3" />Vencido</Badge>}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {p.paid_at ? new Date(p.paid_at).toLocaleDateString("pt-BR") : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-16">
          <Inbox className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum pagamento registrado ainda.</p>
        </div>
      )}

      {/* Payment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pagar Sistema — {formatMonth(currentMonth)}</DialogTitle>
          </DialogHeader>

          {!paymentResult ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Selecione o método de pagamento:</p>
              <div className="grid gap-2">
                <Button
                  variant="outline"
                  className="justify-start gap-3 h-14"
                  onClick={() => handlePay("PIX")}
                  disabled={chargeMutation.isPending}
                >
                  <QrCode className="w-5 h-5 text-primary" />
                  <div className="text-left">
                    <div className="font-medium">PIX</div>
                    <div className="text-xs text-muted-foreground">Pagamento instantâneo</div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start gap-3 h-14"
                  onClick={() => handlePay("BOLETO")}
                  disabled={chargeMutation.isPending}
                >
                  <FileText className="w-5 h-5 text-primary" />
                  <div className="text-left">
                    <div className="font-medium">Boleto</div>
                    <div className="text-xs text-muted-foreground">Vencimento em 5 dias</div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start gap-3 h-14"
                  onClick={() => handlePay("CREDIT_CARD")}
                  disabled={chargeMutation.isPending}
                >
                  <CreditCard className="w-5 h-5 text-primary" />
                  <div className="text-left">
                    <div className="font-medium">Cartão de Crédito</div>
                    <div className="text-xs text-muted-foreground">Aprovação imediata</div>
                  </div>
                </Button>
              </div>
              {chargeMutation.isPending && (
                <p className="text-xs text-center text-muted-foreground animate-pulse">Gerando cobrança...</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* PIX: show QR code inline */}
              {selectedMethod === "PIX" && paymentResult.pix_qr_code && (
                <div className="space-y-3 text-center">
                  <img
                    src={`data:image/png;base64,${paymentResult.pix_qr_code}`}
                    alt="QR Code PIX"
                    className="w-48 h-48 mx-auto rounded-lg border"
                  />
                  {paymentResult.pix_copy_paste && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Ou copie o código:</p>
                      <div className="flex gap-2">
                        <code className="flex-1 text-xs bg-muted p-2 rounded break-all max-h-20 overflow-auto">
                          {paymentResult.pix_copy_paste}
                        </code>
                        <Button size="icon" variant="outline" onClick={() => copyToClipboard(paymentResult.pix_copy_paste)} aria-label="Copiar">
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Boleto: iframe */}
              {selectedMethod === "BOLETO" && paymentResult.invoice_url && (
                <iframe
                  src={paymentResult.invoice_url}
                  className="w-full h-[400px] rounded-lg border"
                  title="Pagamento"
                />
              )}

              {/* Credit Card: open in new tab (iframe blocked by Asaas CSP) */}
              {selectedMethod === "CREDIT_CARD" && paymentResult.invoice_url && (
                <div className="space-y-3 text-center">
                  <p className="text-sm text-muted-foreground">Clique abaixo para completar o pagamento com cartão</p>
                  <Button className="w-full gap-2" onClick={() => window.open(paymentResult.invoice_url, "_blank")}>
                    <CreditCard className="w-4 h-4" />
                    Abrir página de pagamento
                  </Button>
                </div>
              )}

              {/* Fallback if no invoice */}
              {!paymentResult.pix_qr_code && !paymentResult.invoice_url && (
                <p className="text-sm text-center text-muted-foreground">
                  Cobrança gerada com sucesso! ID: {paymentResult.payment_id}
                </p>
              )}

              <Button variant="outline" className="w-full" onClick={() => setDialogOpen(false)}>
                Fechar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
