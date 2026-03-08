import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Service } from '@/data/services';
import { youtubeTimeOptions, getYoutubePrice } from '@/data/services';
import type { SelectedService } from '@/hooks/useCalculator';

interface ServiceCardProps {
  service: Service;
  isSelected: boolean;
  selection?: SelectedService;
  onToggle: () => void;
  onUpdateQuantity: (quantity: number) => void;
  onUpdatePackage: (packageSize: number) => void;
  onUpdateYoutubeMinutes: (minutes: number) => void;
}

export const ServiceCard = ({
  service,
  isSelected,
  selection,
  onToggle,
  onUpdateQuantity,
  onUpdatePackage,
  onUpdateYoutubeMinutes,
}: ServiceCardProps) => {
  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const calculateDisplayPrice = () => {
    if (!isSelected || !selection) return null;
    if (service.quantityType === 'youtube_time' && selection.youtubeMinutes) {
      return formatPrice(getYoutubePrice(selection.youtubeMinutes) * (selection.quantity || 1));
    }
    if (service.quantityType === 'package' && selection.packageSize) {
      return formatPrice(service.price * selection.packageSize);
    }
    if (service.quantityType === 'quantity') {
      return formatPrice(service.price * selection.quantity);
    }
    return formatPrice(service.price);
  };

  const displayPrice = calculateDisplayPrice();

  return (
    <div
      className={cn(
        "rounded-xl border p-3 md:p-4 transition-all duration-300",
        isSelected
          ? "border-primary shadow-lg bg-primary/5"
          : "border-border hover:border-primary/30 hover:shadow-md bg-card"
      )}
    >
      <div className="flex items-start justify-between gap-3 md:gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
            <h4 className="font-semibold text-sm md:text-base text-foreground">{service.name}</h4>
            <span
              className={cn(
                "rounded-full px-1.5 md:px-2 py-0.5 text-[10px] md:text-xs font-medium",
                service.type === 'one_time'
                  ? "bg-muted text-muted-foreground"
                  : "bg-primary/10 text-primary"
              )}
            >
              {service.type === 'one_time' ? 'Unitário' : 'Mensal'}
            </span>
          </div>
          <p className="mt-1 text-xs md:text-sm text-muted-foreground line-clamp-2">
            {service.description}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <Switch
            checked={isSelected}
            onCheckedChange={onToggle}
          />
          {isSelected && displayPrice && (
            <span className="text-base md:text-lg font-bold text-primary whitespace-nowrap">
              {displayPrice}
            </span>
          )}
        </div>
      </div>

      {isSelected && (
        <div className="mt-3 md:mt-4 border-t border-border pt-3 md:pt-4">
          {service.quantityType === 'quantity' && (
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <label className="text-xs md:text-sm text-muted-foreground">Quantidade:</label>
              <Input
                type="number"
                min={service.minQuantity || 1}
                max={service.maxQuantity || 100}
                value={selection?.quantity || service.minQuantity || 1}
                onChange={(e) => {
                  let value = parseInt(e.target.value) || (service.minQuantity || 1);
                  if (service.minQuantity && value < service.minQuantity) value = service.minQuantity;
                  if (service.maxQuantity && value > service.maxQuantity) value = service.maxQuantity;
                  onUpdateQuantity(value);
                }}
                className="w-20 md:w-24 h-10 text-base"
              />
              <span className="text-xs md:text-sm text-muted-foreground">{service.perUnit}(s)</span>
              {service.id === 'pagina-site' && selection && selection.quantity < 3 && (
                <span className="text-[10px] md:text-xs text-amber-600">Mínimo 3 páginas</span>
              )}
            </div>
          )}

          {service.quantityType === 'package' && service.packages && (
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-xs md:text-sm text-muted-foreground w-full md:w-auto">Pacote:</label>
              {service.packages.map((pkg) => (
                <button
                  key={pkg}
                  onClick={() => onUpdatePackage(pkg)}
                  className={cn(
                    "rounded-lg border px-3 py-2 md:py-1.5 text-sm font-medium transition-all duration-200 min-h-[44px] md:min-h-0",
                    selection?.packageSize === pkg
                      ? "border-primary bg-primary text-primary-foreground shadow-md"
                      : "border-border bg-card hover:border-primary/50 hover:bg-primary/5"
                  )}
                >
                  {pkg} {service.perUnit}s
                </button>
              ))}
            </div>
          )}

          {service.quantityType === 'youtube_time' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 md:gap-3">
                <label className="text-xs md:text-sm text-muted-foreground">Quantidade:</label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={selection?.quantity || 1}
                  onChange={(e) => {
                    let value = parseInt(e.target.value) || 1;
                    if (value < 1) value = 1;
                    if (value > 20) value = 20;
                    onUpdateQuantity(value);
                  }}
                  className="w-20 md:w-24 h-10 text-base"
                />
                <span className="text-xs md:text-sm text-muted-foreground">vídeo(s)</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 md:gap-3">
                <label className="text-xs md:text-sm text-muted-foreground">Duração do vídeo:</label>
                <Select
                  value={String(selection?.youtubeMinutes || 2)}
                  onValueChange={(value) => onUpdateYoutubeMinutes(parseInt(value))}
                >
                  <SelectTrigger className="w-28 md:w-32 h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {youtubeTimeOptions.map((minutes) => (
                      <SelectItem key={minutes} value={String(minutes)} className="py-3 md:py-2">
                        {minutes} minutos
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-lg bg-muted p-2 md:p-3">
                <p className="text-[10px] md:text-xs text-muted-foreground mb-2">Tabela de preços (por vídeo):</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 md:gap-2 text-[10px] md:text-xs">
                  {[2, 4, 6, 8, 10, 12].map((min) => (
                    <span key={min} className="text-muted-foreground">
                      {min}min = {formatPrice(getYoutubePrice(min))}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
