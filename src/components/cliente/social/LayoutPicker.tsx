import { LAYOUT_TYPES } from "./constants";
import { Card, CardContent } from "@/components/ui/card";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LayoutMockupSvg } from "./LayoutMockupSvg";

interface LayoutPickerProps {
  selected: string[];
  onSelect: (value: string[]) => void;
  max?: number;
}

export function LayoutPicker({ selected, onSelect, max = 2 }: LayoutPickerProps) {
  const toggleLayout = (value: string) => {
    if (selected.includes(value)) {
      if (selected.length > 1) {
        onSelect(selected.filter(v => v !== value));
      }
    } else {
      if (selected.length < max) {
        onSelect([...selected, value]);
      } else {
        onSelect([...selected.slice(0, max - 1), value]);
      }
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-[10px]">Máx. {max}</Badge>
        {selected.length === 2 && (
          <p className="text-[10px] text-muted-foreground">2 layouts = 2 variações geradas por peça</p>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {LAYOUT_TYPES.map((layout) => {
          const isSelected = selected.includes(layout.value);
          const selectionOrder = selected.indexOf(layout.value) + 1;
          return (
            <Card
              key={layout.value}
              className={`cursor-pointer transition-all hover:shadow-md overflow-hidden ${isSelected ? "ring-2 ring-primary bg-primary/5" : ""}`}
              onClick={() => toggleLayout(layout.value)}
            >
              <CardContent className="p-0">
                <div className="relative aspect-square bg-muted/30 p-2">
                  <LayoutMockupSvg type={layout.value} />
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      {selected.length > 1 ? (
                        <span className="text-[10px] font-bold text-primary-foreground">{selectionOrder}</span>
                      ) : (
                        <Check className="w-3 h-3 text-primary-foreground" />
                      )}
                    </div>
                  )}
                </div>
                <div className="p-2.5">
                  <p className="font-semibold text-xs">{layout.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{layout.desc}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
