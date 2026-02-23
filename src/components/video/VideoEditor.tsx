import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VideoPlayer } from "./VideoPlayer";
import { VideoTimeline } from "./VideoTimeline";
import { SubtitlePanel } from "./SubtitlePanel";
import { InsertPanel } from "./InsertPanel";
import { MusicPanel } from "./MusicPanel";
import { VideoExporter } from "./VideoExporter";
import { Button } from "@/components/ui/button";
import { X, Scissors, Type, Image, Music } from "lucide-react";
import { useVideoEditor } from "@/hooks/useVideoEditor";

interface Props {
  videoFile: File;
  onClose: () => void;
}

export function VideoEditor({ videoFile, onClose }: Props) {
  const editor = useVideoEditor();

  // Load video on mount
  if (!editor.videoUrl) {
    editor.loadVideo(videoFile);
  }

  if (!editor.videoUrl) return null;

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Editor de Vídeo</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Main layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4 min-h-0 overflow-hidden">
        {/* Left: Player + Timeline */}
        <div className="flex flex-col gap-3 min-h-0 overflow-y-auto">
          <VideoPlayer
            videoUrl={editor.videoUrl}
            videoRef={editor.videoRef}
            currentTime={editor.currentTime}
            duration={editor.duration}
            isPlaying={editor.isPlaying}
            subtitles={editor.subtitles}
            inserts={editor.inserts}
            onTimeUpdate={editor.setCurrentTime}
            onDurationLoaded={editor.onDurationLoaded}
            onPlayingChange={editor.setIsPlaying}
          />
          <VideoTimeline
            segments={editor.segments}
            duration={editor.duration}
            currentTime={editor.currentTime}
            onAddCut={editor.addSegmentAtCurrentTime}
            onRemove={editor.removeSegment}
            onUpdate={editor.updateSegment}
          />
        </div>

        {/* Right: Edit panels */}
        <div className="flex flex-col gap-3 min-h-0 overflow-y-auto border-l border-border pl-4">
          <Tabs defaultValue="cuts" className="flex-1 flex flex-col min-h-0">
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="cuts" className="gap-1 text-xs"><Scissors className="h-3.5 w-3.5" /> Cortes</TabsTrigger>
              <TabsTrigger value="subtitles" className="gap-1 text-xs"><Type className="h-3.5 w-3.5" /> Legendas</TabsTrigger>
              <TabsTrigger value="inserts" className="gap-1 text-xs"><Image className="h-3.5 w-3.5" /> Inserts</TabsTrigger>
              <TabsTrigger value="music" className="gap-1 text-xs"><Music className="h-3.5 w-3.5" /> Música</TabsTrigger>
            </TabsList>
            <TabsContent value="cuts" className="flex-1 overflow-y-auto mt-3">
              <VideoTimeline
                segments={editor.segments}
                duration={editor.duration}
                currentTime={editor.currentTime}
                onAddCut={editor.addSegmentAtCurrentTime}
                onRemove={editor.removeSegment}
                onUpdate={editor.updateSegment}
              />
            </TabsContent>
            <TabsContent value="subtitles" className="flex-1 overflow-y-auto mt-3">
              <SubtitlePanel
                subtitles={editor.subtitles}
                onAdd={editor.addSubtitle}
                onUpdate={editor.updateSubtitle}
                onRemove={editor.removeSubtitle}
              />
            </TabsContent>
            <TabsContent value="inserts" className="flex-1 overflow-y-auto mt-3">
              <InsertPanel
                inserts={editor.inserts}
                onAdd={editor.addInsert}
                onUpdate={editor.updateInsert}
                onRemove={editor.removeInsert}
              />
            </TabsContent>
            <TabsContent value="music" className="flex-1 overflow-y-auto mt-3">
              <MusicPanel
                music={editor.music}
                onSet={editor.setMusicTrack}
                onUpdate={editor.updateMusic}
                onRemove={editor.removeMusic}
              />
            </TabsContent>
          </Tabs>

          <VideoExporter videoFile={editor.videoFile} />
        </div>
      </div>
    </div>
  );
}
