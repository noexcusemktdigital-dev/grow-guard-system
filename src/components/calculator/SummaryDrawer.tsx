// @ts-nocheck
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { ArrowRight, Package, RefreshCcw } from 'lucide-react';
import type { Duration, SelectedService } from '@/hooks/useCalculator';
import type { Module, Service } from '@/data/services';

interface SummaryDrawerProps {
  open: boolean;
  onClose: () => void;
  duration: Duration | null;
  selectedByModule: Record<string, { module: Module; selections: (SelectedService & { service: Service; price: number })[] }>;
  totals: { oneTime: number; monthly: number };
  onGoToPayment: () => void;
}

export const SummaryDrawer = ({ open, onClose, duration, selectedByModule, totals, onGoToPayment }: SummaryDrawerProps) => {
  const formatPrice = (price: number) => price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const hasSelections = Object.keys(selectedByModule).length > 0;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Resumo da Proposta</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {duration && (
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm text-muted-foreground">Duração do Projeto</p>
              <p className="text-lg font-semibold text-foreground">
                {duration} {duration === 1 ? 'mês' : 'meses'} ({duration === 1 ? 'Entrega única' : duration === 6 ? 'Semestral' : 'Anual'})
              </p>
            </div>
          )}

          {hasSelections ? (
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Serviços Selecionados</h3>
              {Object.values(selectedByModule).map(({ module, selections }) => (
                <div key={module.id} className="rounded-lg border border-border p-4">
                  <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-primary text-xs text-primary-foreground">
                      {selections.length}
                    </span>
                    {module.name}
                  </h4>
                  <div className="space-y-2">
                    {selections.map((sel) => (
                      <div key={sel.serviceId} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          {sel.service.type === 'one_time' ? (
                            <Package className="h-3 w-3 text-muted-foreground" />
                          ) : (
                            <RefreshCcw className="h-3 w-3 text-primary" />
                          )}
                          <span className="text-foreground">{sel.service.name}</span>
                        </div>
                        <span className="font-medium">{formatPrice(sel.price)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum serviço selecionado ainda.</p>
            </div>
          )}

          {hasSelections && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Unitário</span>
                  <span className="text-lg font-bold text-foreground">{formatPrice(totals.oneTime)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Mensal</span>
                  <span className="text-lg font-bold text-primary">{formatPrice(totals.monthly)}</span>
                </div>
              </div>

              <Button onClick={() => { onGoToPayment(); onClose(); }} className="w-full gap-2">
                Gerar Proposta
                <ArrowRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
