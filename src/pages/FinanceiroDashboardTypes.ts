import type { AsaasPayment } from "@/hooks/useClientPayments";

export interface NetworkContract {
  id: string;
  title: string;
  status: string;
  organization_id: string;
  signer_name: string | null;
  monthly_value?: number;
  payment_day?: number;
  start_date?: string;
  end_date?: string;
  org_name?: string;
  [key: string]: unknown;
}

export interface RevenueRow {
  id: string;
  description: string;
  amount: number;
  date: string;
  status: string;
  category?: string;
  payment_method?: string;
  [key: string]: unknown;
}

export interface ExpenseRow {
  id: string;
  description: string;
  amount: number;
  date: string;
  status: string;
  category?: string;
  is_recurring?: boolean;
  [key: string]: unknown;
}

export interface UnitRow {
  id: string;
  name: string;
  unit_org_id?: string;
  system_fee?: number;
  [key: string]: unknown;
}

export interface ClosingRow {
  id: string;
  title: string;
  month: number;
  year: number;
  status: string;
  file_url?: string;
  unit_id?: string;
  [key: string]: unknown;
}

export interface ChargeRow {
  id: string;
  month: string;
  status: string;
  total_amount: number;
  royalty_amount: number;
  system_fee: number;
  asaas_payment_id?: string;
  paid_at?: string;
  franchisee_org?: { name: string } | null;
  [key: string]: unknown;
}

export interface MonthOption {
  value: string;
  label: string;
}

export interface ChargeResult {
  status: string;
  [key: string]: unknown;
}

export const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
export const expCategories = ["Pessoas", "Plataformas", "Estrutura", "Empréstimos", "Investimentos", "Eventos", "Treinamentos", "Impostos"];
export const ASAAS_PAID_STATUSES = ["CONFIRMED", "RECEIVED", "RECEIVED_IN_CASH"];
export const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(var(--muted-foreground))"];

export function getMonthOptions() {
  const now = new Date();
  const opts: { value: string; label: string }[] = [{ value: "all", label: "Todos os meses" }];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    opts.push({ value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: `${months[d.getMonth()]} ${d.getFullYear()}` });
  }
  return opts;
}

export function asaasStatusLabel(s: string): { label: string; cls: string } {
  const map: Record<string, { label: string; cls: string }> = {
    CONFIRMED: { label: "Confirmado", cls: "bg-emerald-500/15 text-emerald-600" },
    RECEIVED: { label: "Recebido", cls: "bg-emerald-500/15 text-emerald-600" },
    RECEIVED_IN_CASH: { label: "Recebido", cls: "bg-emerald-500/15 text-emerald-600" },
    PENDING: { label: "Pendente", cls: "bg-yellow-500/15 text-yellow-600" },
    OVERDUE: { label: "Vencido", cls: "bg-destructive/15 text-destructive" },
    REFUNDED: { label: "Estornado", cls: "bg-muted text-muted-foreground" },
  };
  return map[s] || { label: s, cls: "bg-muted text-muted-foreground" };
}

export const revCategories = ["Serviço", "Consultoria", "Licença", "Comissão", "Outros"];
