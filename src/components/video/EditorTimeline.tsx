import { useRef, useCallback, useEffect, useState } from "react";
import { TimelineTrack } from "./TimelineTrack";
import { TimelineToolbar } from "./TimelineToolbar";
import type { VideoSegment, Subtitle, ImageInsert, MusicTrack } from "@/hooks/useVideoEditor";

interface Props {
  duration: number;
  currentTime: number;
  segments: VideoSegment[];
  subtitles: Subtitle[];
  inserts: ImageInsert[];
  music: MusicTrack | null;
  selectedSegmentId: string | null;
  onSeek: (time: number) => void;
  onSplit: () => void;
  onDeleteSegment: () => void;
  onSelectSegment: (id: string | null) => void;
}

export function EditorTimeline({
  duration, currentTime, segments, subtitles, inserts, music,
  selectedSegmentId, onSeek, onSplit, onDeleteSegment, onSelectSegment,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [pixelsPerSecond, setPixelsPerSecond] = useState(30);

  const totalWidth = duration * pixelsPerSecond;
  const playheadPos = currentTime * pixelsPerSecond;

  const handleTimelineClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const scrollLeft = e.currentTarget.scrollLeft;
    const x = e.clientX - rect.left + scrollLeft;
    const time = Math.max(0, Math.min(x / pixelsPerSecond, duration));
    onSeek(time);
  }, [pixelsPerSecond, duration, onSeek]);

  // Auto-scroll to keep playhead visible
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const viewLeft = el.scrollLeft;
    const viewRight = viewLeft + el.clientWidth;
    if (playheadPos < viewLeft + 40 || playheadPos > viewRight - 40) {
      el.scrollLeft = playheadPos - el.clientWidth / 3;
    }
  }, [playheadPos]);

  const canSplit = currentTime > 0 && currentTime < duration && segments.some(s => currentTime > s.startTime && currentTime < s.endTime);
  const canDelete = !!selectedSegmentId && segments.length > 1;

  // Time ruler ticks
  const ticks: number[] = [];
  const interval = pixelsPerSecond >= 40 ? 1 : pixelsPerSecond >= 20 ? 5 : 10;
  for (let t = 0; t <= duration; t += interval) ticks.push(t);

  const formatTick = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const segmentItems = segments.map((s, i) => ({
    id: s.id,
    startTime: s.startTime,
    endTime: s.endTime,
    label: `Seg ${i + 1}`,
  }));

  const subtitleItems = subtitles.map(s => ({
    id: s.id,
    startTime: s.startTime,
    endTime: s.endTime,
    label: s.text,
  }));

  const insertItems = inserts.map(i => ({
    id: i.id,
    startTime: i.startTime,
    endTime: i.endTime,
    label: "Img",
  }));

  const musicItems = music ? [{
    id: "music",
    startTime: 0,
    endTime: duration,
    label: "♪ Música",
  }] : [];

  return (
    <div className="flex flex-col gap-2">
      <TimelineToolbar
        canSplit={canSplit}
        canDelete={canDelete}
        zoom={pixelsPerSecond}
        onSplit={onSplit}
        onDelete={onDeleteSegment}
        onZoomChange={setPixelsPerSecond}
      />

      <div
        ref={scrollRef}
        className="relative overflow-x-auto bg-muted/30 rounded-lg border border-border p-2"
        onClick={handleTimelineClick}
        style={{ cursor: "crosshair" }}
      >
        {/* Time ruler */}
        <div className="relative h-5 mb-1" style={{ width: totalWidth }}>
          {ticks.map(t => (
            <div key={t} className="absolute top-0 flex flex-col items-center" style={{ left: t * pixelsPerSecond }}>
              <div className="w-px h-2 bg-muted-foreground/40" />
              <span className="text-[8px] text-muted-foreground">{formatTick(t)}</span>
            </div>
          ))}
        </div>

        {/* Tracks container */}
        <div className="relative space-y-1" style={{ width: totalWidth }}>
          <TimelineTrack
            label="Vídeo"
            items={segmentItems}
            duration={duration}
            pixelsPerSecond={pixelsPerSecond}
            selectedId={selectedSegmentId}
            onSelect={(id) => onSelectSegment(id)}
            colorClass="bg-primary/30"
          />
          <TimelineTrack
            label="Legendas"
            items={subtitleItems}
            duration={duration}
            pixelsPerSecond={pixelsPerSecond}
            colorClass="bg-yellow-500/30"
          />
          <TimelineTrack
            label="Música"
            items={musicItems}
            duration={duration}
            pixelsPerSecond={pixelsPerSecond}
            colorClass="bg-green-500/30"
          />
          <TimelineTrack
            label="Inserts"
            items={insertItems}
            duration={duration}
            pixelsPerSecond={pixelsPerSecond}
            colorClass="bg-blue-500/30"
          />

          {/* Playhead */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-destructive z-20 pointer-events-none"
            style={{ left: playheadPos }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-destructive rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
