import { cn } from '@/lib/utils';
import { Calendar } from 'lucide-react';
import type { Duration } from '@/hooks/useCalculator';

interface DurationSelectorProps {
  selected: Duration | null;
  onSelect: (duration: Duration) => void;
}

export const DurationSelector = ({ selected, onSelect }: DurationSelectorProps) => {
  const options: { value: Duration; label: string; description: string }[] = [
    { value: 1, label: '01 Mês', description: 'Entrega única' },
    { value: 6, label: 'Semestral', description: '6 meses de projeto' },
    { value: 12, label: 'Anual', description: '12 meses de projeto' },
  ];

  return (
    <div className="w-full">
      <div className="mb-4 text-center">
        <h2 className="text-lg md:text-xl font-bold text-foreground">Duração do Projeto</h2>
        <p className="mt-1 text-xs md:text-sm text-muted-foreground">
          A duração define o período do investimento mensal
        </p>
      </div>

      <div className="mx-auto grid max-w-xl grid-cols-3 gap-2 md:gap-4">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onSelect(option.value)}
            className={cn(
              "group relative flex flex-col items-center justify-center rounded-xl border-2 p-4 md:p-6 transition-all duration-200 hover:border-primary/50 min-h-[120px] md:min-h-0",
              selected === option.value
                ? "border-primary bg-primary/5 shadow-md"
                : "border-border bg-card"
            )}
          >
            <div
              className={cn(
                "mb-2 md:mb-3 flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full transition-colors",
                selected === option.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
              )}
            >
              <Calendar className="h-5 w-5 md:h-6 md:w-6" />
            </div>
            
            <h3 className="text-base md:text-lg font-semibold text-foreground">{option.label}</h3>
            <p className="mt-1 text-xs md:text-sm text-muted-foreground text-center">{option.description}</p>

            {selected === option.value && (
              <div className="absolute right-2 top-2 md:right-3 md:top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
