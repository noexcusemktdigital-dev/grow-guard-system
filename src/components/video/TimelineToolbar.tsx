import { Scissors, Trash2, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface Props {
  canSplit: boolean;
  canDelete: boolean;
  zoom: number;
  onSplit: () => void;
  onDelete: () => void;
  onZoomChange: (zoom: number) => void;
}

export function TimelineToolbar({ canSplit, canDelete, zoom, onSplit, onDelete, onZoomChange }: Props) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 bg-muted/50 rounded-lg border border-border">
      <Button variant="outline" size="sm" onClick={onSplit} disabled={!canSplit} className="gap-1.5 text-xs">
        <Scissors className="h-3.5 w-3.5" /> Cortar
      </Button>
      <Button variant="outline" size="sm" onClick={onDelete} disabled={!canDelete} className="gap-1.5 text-xs text-destructive hover:text-destructive">
        <Trash2 className="h-3.5 w-3.5" /> Deletar
      </Button>
      <div className="ml-auto flex items-center gap-2">
        <ZoomOut className="h-3.5 w-3.5 text-muted-foreground" />
        <Slider
          value={[zoom]}
          min={10}
          max={80}
          step={2}
          onValueChange={v => onZoomChange(v[0])}
          className="w-24"
        />
        <ZoomIn className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
    </div>
  );
}
