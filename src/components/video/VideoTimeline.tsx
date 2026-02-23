import { Scissors, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { VideoSegment } from "@/hooks/useVideoEditor";

interface Props {
  segments: VideoSegment[];
  duration: number;
  currentTime: number;
  onAddCut: () => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<VideoSegment>) => void;
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function VideoTimeline({ segments, duration, currentTime, onAddCut, onRemove, onUpdate }: Props) {
  return (
    <div className="space-y-3">
      {/* Visual bar */}
      <div className="relative h-10 bg-muted rounded-lg overflow-hidden">
        {segments.map((seg, i) => {
          const left = (seg.startTime / duration) * 100;
          const width = ((seg.endTime - seg.startTime) / duration) * 100;
          return (
            <div
              key={seg.id}
              className="absolute top-0 h-full bg-primary/30 border-r border-background"
              style={{ left: `${left}%`, width: `${width}%` }}
            >
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-foreground/70">
                {i + 1}
              </span>
            </div>
          );
        })}
        {/* playhead */}
        <div
          className="absolute top-0 w-0.5 h-full bg-destructive z-10"
          style={{ left: `${(currentTime / (duration || 1)) * 100}%` }}
        />
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onAddCut} className="gap-1.5">
          <Scissors className="h-3.5 w-3.5" /> Cortar em {formatTime(currentTime)}
        </Button>
        <span className="text-xs text-muted-foreground">{segments.length} segmento(s)</span>
      </div>

      {/* Segment list */}
      <div className="space-y-1.5 max-h-40 overflow-y-auto">
        {segments.map((seg, i) => (
          <div key={seg.id} className="flex items-center gap-2 bg-muted/50 rounded-md px-2 py-1.5 text-xs">
            <span className="font-medium w-6 text-center">{i + 1}</span>
            <span className="text-muted-foreground">
              {formatTime(seg.startTime)} → {formatTime(seg.endTime)}
            </span>
            <span className="text-muted-foreground ml-auto">
              {formatTime(seg.endTime - seg.startTime)}
            </span>
            {segments.length > 1 && (
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onRemove(seg.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
