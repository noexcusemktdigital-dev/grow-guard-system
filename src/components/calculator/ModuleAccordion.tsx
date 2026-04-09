// @ts-nocheck
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ServiceCard } from './ServiceCard';
import { Palette, Share2, TrendingUp, Globe, Database } from 'lucide-react';
import type { Module } from '@/data/services';
import type { SelectedService } from '@/hooks/useCalculator';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Palette,
  Share2,
  TrendingUp,
  Globe,
  Database,
};

interface ModuleAccordionProps {
  modules: Module[];
  isServiceSelected: (serviceId: string) => boolean;
  getServiceSelection: (serviceId: string) => SelectedService | undefined;
  onToggleService: (moduleId: string, serviceId: string) => void;
  onUpdateQuantity: (serviceId: string, quantity: number) => void;
  onUpdatePackage: (serviceId: string, packageSize: number) => void;
  onUpdateYoutubeMinutes: (serviceId: string, minutes: number) => void;
}

export const ModuleAccordion = ({
  modules,
  isServiceSelected,
  getServiceSelection,
  onToggleService,
  onUpdateQuantity,
  onUpdatePackage,
  onUpdateYoutubeMinutes,
}: ModuleAccordionProps) => {
  const getSelectedCount = (module: Module) => {
    return module.services.filter((s) => isServiceSelected(s.id)).length;
  };

  return (
    <div className="w-full">
      <Accordion type="multiple" className="space-y-4" defaultValue={modules.map(m => m.id)}>
        {modules.map((module) => {
          const Icon = iconMap[module.icon] || Palette;
          const selectedCount = getSelectedCount(module);

          return (
            <AccordionItem
              key={module.id}
              value={module.id}
              className="rounded-xl border-0 overflow-hidden shadow-lg"
            >
              <AccordionTrigger className="px-4 md:px-6 py-4 md:py-5 hover:no-underline bg-primary text-primary-foreground [&[data-state=open]]:bg-primary [&>svg]:text-primary-foreground transition-all duration-300 hover:bg-primary/90">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="flex h-10 w-10 md:h-12 md:w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary-foreground/20">
                    <Icon className="h-5 w-5 md:h-6 md:w-6 text-primary-foreground" />
                  </div>
                  <div className="text-left min-w-0 flex-1">
                    <h3 className="text-base md:text-xl font-bold text-primary-foreground truncate">{module.name}</h3>
                    <p className="text-xs md:text-sm text-primary-foreground/80 line-clamp-1">{module.description}</p>
                  </div>
                  {selectedCount > 0 && (
                    <span className="ml-1 md:ml-2 flex h-7 w-7 md:h-8 md:w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-foreground text-xs md:text-sm font-bold text-primary shadow-lg">
                      {selectedCount}
                    </span>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-3 md:px-6 pb-4 md:pb-6 bg-muted/50">
                <div className="grid gap-3 md:gap-4 pt-3 md:pt-4">
                  {module.services.map((service) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      isSelected={isServiceSelected(service.id)}
                      selection={getServiceSelection(service.id)}
                      onToggle={() => onToggleService(module.id, service.id)}
                      onUpdateQuantity={(qty) => onUpdateQuantity(service.id, qty)}
                      onUpdatePackage={(pkg) => onUpdatePackage(service.id, pkg)}
                      onUpdateYoutubeMinutes={(min) => onUpdateYoutubeMinutes(service.id, min)}
                    />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
};
