import { LAYOUT_TYPES } from "./constants";
import { Card, CardContent } from "@/components/ui/card";
import { Check } from "lucide-react";
import { LayoutMockupSvg } from "./LayoutMockupSvg";

interface LayoutPickerProps {
  selected: string[];
  onSelect: (value: string[]) => void;
}

export function LayoutPicker({ selected, onSelect }: LayoutPickerProps) {
  const selectLayout = (value: string) => {
    // Single-select only — always replace with the clicked one
    onSelect([value]);
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {LAYOUT_TYPES.map((layout) => {
          const isSelected = selected.includes(layout.value);
          return (
            <Card
              key={layout.value}
              className={`cursor-pointer transition-all hover:shadow-md overflow-hidden ${isSelected ? "ring-2 ring-primary bg-primary/5" : ""}`}
              onClick={() => selectLayout(layout.value)}
            >
              <CardContent className="p-0">
                <div className="relative aspect-square bg-muted/30 p-2">
                  <LayoutMockupSvg type={layout.value} />
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
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
