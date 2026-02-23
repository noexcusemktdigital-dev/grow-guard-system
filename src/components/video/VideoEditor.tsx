import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VideoPlayer } from "./VideoPlayer";
import { EditorTimeline } from "./EditorTimeline";
import { SubtitlePanel } from "./SubtitlePanel";
import { InsertPanel } from "./InsertPanel";
import { MusicPanel } from "./MusicPanel";
import { VideoExporter } from "./VideoExporter";
import { Button } from "@/components/ui/button";
import { X, Type, Image, Music } from "lucide-react";
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

  const handleSeek = (time: number) => {
    editor.setCurrentTime(time);
    if (editor.videoRef.current) {
      editor.videoRef.current.currentTime = time;
    }
  };

  return (
    <div className="flex flex-col h-full gap-2">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Editor de Vídeo</h2>
        <div className="flex items-center gap-2">
          <VideoExporter videoFile={editor.videoFile} />
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main layout: Player + Side Panel */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-3 min-h-0 overflow-hidden">
        {/* Left: Player */}
        <div className="flex flex-col gap-2 min-h-0 overflow-y-auto">
          <VideoPlayer
            videoUrl={editor.videoUrl}
            videoRef={editor.videoRef}
            currentTime={editor.currentTime}
            duration={editor.duration}
            isPlaying={editor.isPlaying}
            subtitles={editor.subtitles}
            inserts={editor.inserts}
            segments={editor.segments}
            onTimeUpdate={editor.setCurrentTime}
            onDurationLoaded={editor.onDurationLoaded}
            onPlayingChange={editor.setIsPlaying}
            isTimeInSegment={editor.isTimeInSegment}
            getNextSegmentStart={editor.getNextSegmentStart}
          />
        </div>

        {/* Right: Edit panels */}
        <div className="flex flex-col gap-2 min-h-0 overflow-y-auto border-l border-border pl-3">
          <Tabs defaultValue="subtitles" className="flex-1 flex flex-col min-h-0">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="subtitles" className="gap-1 text-xs"><Type className="h-3.5 w-3.5" /> Legendas</TabsTrigger>
              <TabsTrigger value="inserts" className="gap-1 text-xs"><Image className="h-3.5 w-3.5" /> Inserts</TabsTrigger>
              <TabsTrigger value="music" className="gap-1 text-xs"><Music className="h-3.5 w-3.5" /> Música</TabsTrigger>
            </TabsList>
            <TabsContent value="subtitles" className="flex-1 overflow-y-auto mt-3">
              <SubtitlePanel
                subtitles={editor.subtitles}
                duration={editor.duration}
                videoFile={editor.videoFile}
                isGenerating={editor.isGeneratingSubtitles}
                onAdd={editor.addSubtitle}
                onUpdate={editor.updateSubtitle}
                onRemove={editor.removeSubtitle}
                onSetSubtitles={editor.setSubtitlesList}
                onSetGenerating={editor.setIsGeneratingSubtitles}
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
        </div>
      </div>

      {/* Bottom: Timeline */}
      <div className="flex-shrink-0">
        <EditorTimeline
          duration={editor.duration}
          currentTime={editor.currentTime}
          segments={editor.segments}
          subtitles={editor.subtitles}
          inserts={editor.inserts}
          music={editor.music}
          selectedSegmentId={editor.selectedSegmentId}
          onSeek={handleSeek}
          onSplit={editor.splitAtCurrentTime}
          onDeleteSegment={editor.deleteSelectedSegment}
          onSelectSegment={editor.setSelectedSegmentId}
        />
      </div>
    </div>
  );
}
