import { useState } from "react";
import { DollarSign, Percent, Monitor, Info, FileDown, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUnitMutations } from "@/hooks/useUnits";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { reportError } from "@/lib/error-toast";

interface Props {
  unit: { id: string; unit_org_id?: string | null; transfer_percent?: number; royalty_percent?: number; system_fee?: number; system_active?: boolean; financial_notes?: string; saas_commission_percent?: number };
  readOnly?: boolean;
}

export function UnidadeFinanceiroReal({ unit, readOnly }: Props) {
  const { updateUnit } = useUnitMutations();
  const [form, setForm] = useState({
    transfer_percent: unit.transfer_percent ?? 20,
    royalty_percent: unit.royalty_percent ?? 1,
    system_fee: unit.system_fee ?? 250,
    system_active: unit.system_active ?? true,
    financial_notes: unit.financial_notes || "",
    saas_commission_percent: unit.saas_commission_percent ?? 20,
  });

  const { data: payments, isLoading: loadingPayments } = useQuery({
    queryKey: ["unit-payments", unit.unit_org_id],
    queryFn: async () => {
      if (!unit.unit_org_id) return [];
      const { data, error } = await supabase
        .from("franchisee_system_payments")
        .select("*")
        .eq("organization_id", unit.unit_org_id)
        .order("created_at", { ascending: false })
        .limit(12);
      if (error) throw error;
      return data;
    },
    enabled: !!unit.unit_org_id,
  });

  const handleSave = async () => {
    updateUnit.mutate(
      { id: unit.id, ...form },
      {
        onSuccess: async () => {
          if (unit.unit_org_id) {
            await supabase
              .from("organizations")
              .update({ saas_commission_percent: form.saas_commission_percent } as Record<string, unknown>)
              .eq("id", unit.unit_org_id);
          }
          toast.success("Configuração financeira salva!");
        },
        onError: (e) => reportError(e, { title: "Erro ao salvar dados financeiros", category: "unidade.financeiro_save" }),
      }
    );
  };

  const cards = [
    { label: "% Repasse", icon: Percent, value: form.transfer_percent, key: "transfer_percent" as const, suffix: "%" },
    { label: "% Royalties", icon: Percent, value: form.royalty_percent, key: "royalty_percent" as const, suffix: "%" },
    { label: "Mensalidade Sistema", icon: DollarSign, value: form.system_fee, key: "system_fee" as const, prefix: "R$" },
    { label: "% Comissão SaaS", icon: Percent, value: form.saas_commission_percent, key: "saas_commission_percent" as const, suffix: "%" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.key} className="p-5 space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{c.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {c.prefix && <span className="text-sm text-muted-foreground">{c.prefix}</span>}
                <Input
                  type="number"
                  className="text-lg font-bold"
                  value={c.value}
                  onChange={(e) => setForm((f) => ({ ...f, [c.key]: Number(e.target.value) }))}
                  disabled={readOnly}
                />
                {c.suffix && <span className="text-sm text-muted-foreground">{c.suffix}</span>}
              </div>
            </Card>
          );
        })}
      </div>

      {!readOnly && (
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Sistema ativo</Label>
            </div>
            <Switch checked={form.system_active} onCheckedChange={(v) => setForm((f) => ({ ...f, system_active: v }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Observações financeiras</Label>
            <Textarea rows={3} value={form.financial_notes} onChange={(e) => setForm((f) => ({ ...f, financial_notes: e.target.value }))} />
          </div>
        </Card>
      )}

      {!readOnly && (
        <>
          <div className="flex items-start gap-2 rounded-lg border border-blue-500/20 bg-blue-500/5 p-4 text-sm text-muted-foreground">
            <Info className="w-4 h-4 mt-0.5 text-blue-500 flex-shrink-0" />
            <span>Estas configurações alimentam automaticamente Repasse, DRE e Fechamentos do módulo Financeiro.</span>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={updateUnit.isPending}>
              {updateUnit.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </>
      )}

      {/* Fechamentos / DREs */}
      <ClosingsSection unitId={unit.id} readOnly={readOnly} />

      {/* Payment history */}
      {unit.unit_org_id && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Histórico de Pagamentos do Sistema</h3>
          {loadingPayments ? (
            <Skeleton className="h-24 w-full" />
          ) : !payments || payments.length === 0 ? (
            <Card className="p-4 text-center text-sm text-muted-foreground">Nenhum pagamento registrado.</Card>
          ) : (
            <Card>
              <div className="overflow-x-auto">
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
                  {payments.map((p: { id: string; month: string; amount: number; billing_type?: string; status: string; paid_at?: string | null }) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.month}</TableCell>
                      <TableCell>R$ {Number(p.amount).toFixed(2)}</TableCell>
                      <TableCell className="text-xs">{p.billing_type || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={p.status === "paid" ? "default" : p.status === "overdue" ? "destructive" : "secondary"}>
                          {p.status === "paid" ? "Pago" : p.status === "overdue" ? "Vencido" : "Pendente"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {p.paid_at ? new Date(p.paid_at).toLocaleDateString("pt-BR") : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Closings sub-component ---------- */
const MONTH_NAMES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

function ClosingsSection({ unitId, readOnly }: { unitId: string; readOnly?: boolean }) {
  const { data: closings, isLoading } = useQuery({
    queryKey: ["unit-closings", unitId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("finance_closings")
        .select("*")
        .eq("unit_id", unitId)
        .eq("status", "published")
        .order("year", { ascending: false })
        .order("month", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!unitId,
  });

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Calendar className="w-4 h-4 text-muted-foreground" />
        Fechamentos / DREs
      </h3>

      {isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : !closings || closings.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          <FileDown className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p>Nenhum fechamento publicado para esta unidade.</p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {closings.map((cl) => (
            <Card key={cl.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileDown className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{cl.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {MONTH_NAMES[(cl.month ?? 1) - 1]}/{cl.year}
                    {cl.notes && ` · ${cl.notes}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="default">Publicado</Badge>
                {cl.file_url && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={cl.file_url} target="_blank" rel="noreferrer">
                      <FileDown className="w-4 h-4 mr-1" />Baixar
                    </a>
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
