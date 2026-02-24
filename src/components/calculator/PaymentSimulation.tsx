import { cn } from '@/lib/utils';
import { CreditCard, Banknote, Calendar } from 'lucide-react';
import type { PaymentOption, Duration } from '@/hooks/useCalculator';

interface PaymentSimulationProps {
  totals: { oneTime: number; monthly: number };
  duration: Duration | null;
  selectedOption: PaymentOption;
  onSelectOption: (option: PaymentOption) => void;
}

export const PaymentSimulation = ({ totals, duration, selectedOption, onSelectOption }: PaymentSimulationProps) => {
  const formatPrice = (price: number) => price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const getDilutedMonthly = (installments: number) => {
    return totals.monthly + (totals.oneTime / installments);
  };

  const options: { value: PaymentOption; label: string; icon: typeof CreditCard; getDilutedDescription: () => string; getMonthlyAfter: () => string }[] = [
    {
      value: 'upfront',
      label: 'À Vista',
      icon: Banknote,
      getDilutedDescription: () => `Mês 1: ${formatPrice(totals.oneTime + totals.monthly)}`,
      getMonthlyAfter: () => totals.monthly > 0 ? `Mês 2+: ${formatPrice(totals.monthly)}` : 'Pagamento único',
    },
    {
      value: 'installment_3',
      label: '3x',
      icon: CreditCard,
      getDilutedDescription: () => `Mês 1-3: ${formatPrice(getDilutedMonthly(3))}`,
      getMonthlyAfter: () => totals.monthly > 0 ? `Mês 4+: ${formatPrice(totals.monthly)}` : 'Sem mensalidade após',
    },
    {
      value: 'installment_6',
      label: '6x',
      icon: Calendar,
      getDilutedDescription: () => `Mês 1-6: ${formatPrice(getDilutedMonthly(6))}`,
      getMonthlyAfter: () => totals.monthly > 0 ? `Mês 7+: ${formatPrice(totals.monthly)}` : 'Sem mensalidade após',
    },
  ];

  return (
    <div className="w-full">
      <div className="mb-6 text-center">
        <h2 className="text-lg md:text-xl font-bold text-foreground">Investimento em Marketing</h2>
        <p className="mt-1 text-xs md:text-sm text-muted-foreground">Escolha como deseja pagar o investimento inicial</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 max-w-5xl mx-auto">
        {options.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.value}
              onClick={() => onSelectOption(option.value)}
              className={cn(
                "group relative flex flex-col items-center justify-center rounded-2xl border-2 p-5 md:p-8 transition-all duration-300 min-h-[160px] md:min-h-0",
                selectedOption === option.value
                  ? "border-primary bg-primary/5 shadow-2xl md:scale-105"
                  : "border-border bg-card hover:border-primary/50 hover:shadow-lg"
              )}
            >
              <div
                className={cn(
                  "mb-3 md:mb-4 flex h-12 w-12 md:h-16 md:w-16 items-center justify-center rounded-full transition-all duration-300",
                  selectedOption === option.value
                    ? "bg-primary text-primary-foreground md:scale-110 shadow-lg"
                    : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                )}
              >
                <Icon className="h-6 w-6 md:h-8 md:w-8" />
              </div>
              
              <h3 className="text-xl md:text-2xl font-bold text-foreground mb-3 md:mb-4">{option.label}</h3>
              
              <div className={cn(
                "w-full rounded-xl p-3 md:p-4 mb-2 md:mb-3 transition-all duration-300",
                selectedOption === option.value 
                  ? "bg-primary text-primary-foreground shadow-inner" 
                  : "bg-muted"
              )}>
                <p className={cn(
                  "text-sm md:text-lg font-bold text-center",
                  selectedOption === option.value ? "text-primary-foreground" : "text-primary"
                )}>
                  {option.getDilutedDescription()}
                </p>
              </div>
              
              <div className="text-center">
                <p className={cn(
                  "text-xs md:text-sm font-medium",
                  selectedOption === option.value ? "text-foreground" : "text-muted-foreground"
                )}>
                  {option.getMonthlyAfter()}
                </p>
              </div>

              {selectedOption === option.value && (
                <div className="absolute -right-1 -top-1 md:-right-2 md:-top-2 flex h-6 w-6 md:h-8 md:w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg border-2 border-background">
                  <svg className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
