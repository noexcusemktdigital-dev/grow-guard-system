import { cn } from "@/lib/utils";

interface TrackItem {
  id: string;
  startTime: number;
  endTime: number;
  label?: string;
  color?: string;
}

interface Props {
  label: string;
  items: TrackItem[];
  duration: number;
  pixelsPerSecond: number;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  colorClass?: string;
}

export function TimelineTrack({ label, items, duration, pixelsPerSecond, selectedId, onSelect, colorClass = "bg-primary/30" }: Props) {
  if (items.length === 0) return null;

  return (
    <div className="flex items-center gap-2 min-h-[28px]">
      <span className="text-[10px] text-muted-foreground w-16 flex-shrink-0 text-right pr-1">{label}</span>
      <div className="relative h-7 flex-1" style={{ width: duration * pixelsPerSecond }}>
        {items.map(item => {
          const left = item.startTime * pixelsPerSecond;
          const width = (item.endTime - item.startTime) * pixelsPerSecond;
          return (
            <div
              key={item.id}
              className={cn(
                "absolute top-0 h-full rounded-sm border border-border/50 cursor-pointer flex items-center justify-center overflow-hidden transition-all",
                item.color || colorClass,
                selectedId === item.id && "ring-2 ring-primary ring-offset-1"
              )}
              style={{ left, width: Math.max(width, 4) }}
              onClick={() => onSelect?.(item.id)}
            >
              {item.label && width > 30 && (
                <span className="text-[9px] font-medium text-foreground/80 truncate px-1">{item.label}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
