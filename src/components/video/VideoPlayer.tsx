import { useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import type { Subtitle, ImageInsert } from "@/hooks/useVideoEditor";

interface VideoPlayerProps {
  videoUrl: string;
  videoRef: React.MutableRefObject<HTMLVideoElement | null>;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  subtitles: Subtitle[];
  inserts: ImageInsert[];
  onTimeUpdate: (time: number) => void;
  onDurationLoaded: (dur: number) => void;
  onPlayingChange: (playing: boolean) => void;
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function VideoPlayer({
  videoUrl, videoRef, currentTime, duration, isPlaying,
  subtitles, inserts,
  onTimeUpdate, onDurationLoaded, onPlayingChange,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) onTimeUpdate(videoRef.current.currentTime);
  }, [onTimeUpdate, videoRef]);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) onDurationLoaded(videoRef.current.duration);
  }, [onDurationLoaded, videoRef]);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      onPlayingChange(false);
    } else {
      videoRef.current.play();
      onPlayingChange(true);
    }
  }, [isPlaying, onPlayingChange, videoRef]);

  const handleSeek = useCallback((val: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = val[0];
      onTimeUpdate(val[0]);
    }
  }, [onTimeUpdate, videoRef]);

  const restart = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      onTimeUpdate(0);
    }
  }, [onTimeUpdate, videoRef]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.addEventListener("ended", () => onPlayingChange(false));
    return () => v.removeEventListener("ended", () => onPlayingChange(false));
  }, [onPlayingChange, videoRef]);

  const activeSubtitles = subtitles.filter(
    s => currentTime >= s.startTime && currentTime <= s.endTime
  );
  const activeInserts = inserts.filter(
    i => currentTime >= i.startTime && currentTime <= i.endTime
  );

  const getSubtitleStyles = (sub: Subtitle): React.CSSProperties => {
    const posMap = { top: "8%", center: "50%", bottom: "85%" };
    const base: React.CSSProperties = {
      position: "absolute", left: "50%", transform: "translateX(-50%)",
      top: posMap[sub.position], padding: "4px 12px", borderRadius: 6,
      fontSize: "1rem", fontWeight: 700, textAlign: "center", maxWidth: "90%",
      pointerEvents: "none", zIndex: 10,
    };
    if (sub.style === "classic") return { ...base, color: "#fff", textShadow: "1px 1px 4px rgba(0,0,0,0.8)" };
    if (sub.style === "highlight") return { ...base, color: "#fff", background: "rgba(139,92,246,0.85)" };
    return { ...base, color: "#fff", background: "rgba(0,0,0,0.5)", fontSize: "0.875rem", fontWeight: 500 };
  };

  const getInsertPosition = (pos: ImageInsert["position"]): React.CSSProperties => {
    const map: Record<string, React.CSSProperties> = {
      "top-left": { top: 8, left: 8 },
      "top-right": { top: 8, right: 8 },
      "bottom-left": { bottom: 48, left: 8 },
      "bottom-right": { bottom: 48, right: 8 },
      center: { top: "50%", left: "50%", transform: "translate(-50%,-50%)" },
      fullscreen: { inset: 0, width: "100%", height: "100%" },
    };
    return map[pos] ?? {};
  };

  return (
    <div className="flex flex-col gap-2">
      <div ref={containerRef} className="relative bg-black rounded-lg overflow-hidden aspect-video">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-contain"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          playsInline
        />
        {activeSubtitles.map(sub => (
          <div key={sub.id} style={getSubtitleStyles(sub)}>{sub.text}</div>
        ))}
        {activeInserts.map(ins => (
          <img
            key={ins.id}
            src={ins.previewUrl}
            alt="insert"
            className="absolute pointer-events-none"
            style={{
              ...getInsertPosition(ins.position),
              opacity: ins.opacity / 100,
              maxWidth: ins.position === "fullscreen" ? "100%" : "30%",
              maxHeight: ins.position === "fullscreen" ? "100%" : "30%",
              objectFit: "contain",
            }}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={restart}>
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={togglePlay}>
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <span className="text-xs text-muted-foreground tabular-nums w-20 text-center">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
        <Slider
          value={[currentTime]}
          max={duration || 1}
          step={0.1}
          onValueChange={handleSeek}
          className="flex-1"
        />
      </div>
    </div>
  );
}
