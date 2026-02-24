import { Package, RefreshCcw, Check } from 'lucide-react';
import type { Duration, PaymentOption, SelectedService } from '@/hooks/useCalculator';
import type { Module, Service } from '@/data/services';

interface ProposalSummaryProps {
  duration: Duration | null;
  selectedByModule: Record<string, { module: Module; selections: (SelectedService & { service: Service; price: number })[] }>;
  totals: { oneTime: number; monthly: number };
  paymentOption: PaymentOption;
}

export const ProposalSummary = ({ duration, selectedByModule, totals, paymentOption }: ProposalSummaryProps) => {
  const formatPrice = (price: number) => price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const getDilutedMonthly = (installments: number) => totals.monthly + (totals.oneTime / installments);

  const getPaymentDetails = () => {
    switch (paymentOption) {
      case 'upfront':
        return { label: 'À Vista', firstMonths: `Mês 1: ${formatPrice(totals.oneTime + totals.monthly)}`, afterMonths: `Mês 2+: ${formatPrice(totals.monthly)}` };
      case 'installment_3':
        return { label: '3x', firstMonths: `Mês 1-3: ${formatPrice(getDilutedMonthly(3))}`, afterMonths: `Mês 4+: ${formatPrice(totals.monthly)}` };
      case 'installment_6':
        return { label: '6x', firstMonths: `Mês 1-6: ${formatPrice(getDilutedMonthly(6))}`, afterMonths: `Mês 7+: ${formatPrice(totals.monthly)}` };
    }
  };

  const paymentDetails = getPaymentDetails();
  if (Object.keys(selectedByModule).length === 0) return null;

  return (
    <div className="w-full">
      <div className="mb-4 md:mb-6 text-center">
        <h2 className="text-lg md:text-xl font-bold text-foreground">Resumo da Proposta</h2>
        <p className="mt-1 text-xs md:text-sm text-muted-foreground">Confira todos os serviços selecionados e o investimento final</p>
      </div>

      <div className="rounded-2xl border-2 border-primary/20 bg-card p-4 md:p-6 shadow-xl max-w-4xl mx-auto">
        <div className="space-y-4 md:space-y-6 mb-6 md:mb-8">
          {Object.values(selectedByModule).map(({ module, selections }) => (
            <div key={module.id}>
              <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                <div className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground flex-shrink-0">
                  <span className="text-xs md:text-sm font-bold">{selections.length}</span>
                </div>
                <h3 className="text-base md:text-lg font-bold text-foreground">{module.name}</h3>
              </div>
              <div className="grid gap-2 pl-0 md:pl-10">
                {selections.map((sel) => (
                  <div key={sel.serviceId} className="flex items-center justify-between rounded-lg bg-muted/50 p-2.5 md:p-3 gap-2">
                    <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="font-medium text-sm md:text-base text-foreground block truncate">{sel.service.name}</span>
                        <div className="flex flex-wrap items-center gap-1 md:gap-2 text-[10px] md:text-xs text-muted-foreground">
                          {sel.service.type === 'one_time' ? (
                            <span className="flex items-center gap-0.5"><Package className="h-3 w-3" /> Unitário</span>
                          ) : (
                            <span className="flex items-center gap-0.5 text-primary"><RefreshCcw className="h-3 w-3" /> Mensal</span>
                          )}
                          {sel.quantity > 1 && <span>• {sel.quantity}x</span>}
                          {sel.packageSize && <span>• {sel.packageSize} un</span>}
                          {sel.youtubeMinutes && <span>• {sel.youtubeMinutes} min</span>}
                        </div>
                      </div>
                    </div>
                    <span className="font-bold text-sm md:text-base text-foreground whitespace-nowrap flex-shrink-0">{formatPrice(sel.price)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t-2 border-dashed border-border my-4 md:my-6" />

        <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
          <div className="rounded-xl border border-border bg-muted/50 p-3 md:p-4 text-center">
            <p className="text-xs md:text-sm text-muted-foreground">Total Unitário</p>
            <p className="text-lg md:text-2xl font-bold text-foreground">{formatPrice(totals.oneTime)}</p>
            <p className="text-[10px] md:text-xs text-muted-foreground">Setup / Implementação</p>
          </div>
          <div className="rounded-xl border-2 border-primary bg-primary/5 p-3 md:p-4 text-center">
            <p className="text-xs md:text-sm text-primary">Total Mensal</p>
            <p className="text-lg md:text-2xl font-bold text-primary">{formatPrice(totals.monthly)}</p>
            <p className="text-[10px] md:text-xs text-muted-foreground">Recorrência</p>
          </div>
        </div>

        {duration && (
          <div className="rounded-xl bg-primary/5 p-3 md:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Duração do Projeto</p>
                <p className="text-base md:text-lg font-bold text-foreground">
                  {duration} {duration === 1 ? 'mês' : 'meses'} ({duration === 1 ? 'Entrega única' : duration === 6 ? 'Semestral' : 'Anual'})
                </p>
              </div>
              <div className="sm:text-right">
                <p className="text-xs md:text-sm text-muted-foreground">Forma de Pagamento: {paymentDetails.label}</p>
                <p className="text-xs md:text-sm font-semibold text-primary">{paymentDetails.firstMonths}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground">{paymentDetails.afterMonths}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
