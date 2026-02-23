import { useState } from "react";
import { Plus, Trash2, Sparkles, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import type { Subtitle } from "@/hooks/useVideoEditor";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  subtitles: Subtitle[];
  duration: number;
  videoFile: File | null;
  isGenerating: boolean;
  onAdd: () => void;
  onUpdate: (id: string, updates: Partial<Subtitle>) => void;
  onRemove: (id: string) => void;
  onSetSubtitles: (subs: Subtitle[]) => void;
  onSetGenerating: (v: boolean) => void;
}

let subIdCounter = 0;
const genSubId = () => `sub_${++subIdCounter}_${Date.now()}`;

export function SubtitlePanel({ subtitles, duration, videoFile, isGenerating, onAdd, onUpdate, onRemove, onSetSubtitles, onSetGenerating }: Props) {

  const generateSubtitles = async () => {
    if (!videoFile) {
      toast.error("Nenhum vídeo carregado");
      return;
    }

    onSetGenerating(true);
    try {
      // Extract audio using FFmpeg.wasm
      const { FFmpeg } = await import("@ffmpeg/ffmpeg");
      const { fetchFile } = await import("@ffmpeg/util");

      const ffmpeg = new FFmpeg();
      await ffmpeg.load();

      const inputName = "input" + (videoFile.name.endsWith(".mp4") ? ".mp4" : ".webm");
      await ffmpeg.writeFile(inputName, await fetchFile(videoFile));
      await ffmpeg.exec(["-i", inputName, "-vn", "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1", "output.wav"]);
      const audioData = await ffmpeg.readFile("output.wav");

      // Convert to base64
      const audioBytes = audioData instanceof Uint8Array ? audioData : new TextEncoder().encode(audioData as string);
      let binary = "";
      for (let i = 0; i < audioBytes.length; i++) {
        binary += String.fromCharCode(audioBytes[i]);
      }
      const audioBase64 = btoa(binary);

      // Send to edge function
      const { data, error } = await supabase.functions.invoke("transcribe-video-audio", {
        body: { audioBase64, mimeType: "audio/wav" },
      });

      if (error) throw error;

      if (data?.subtitles && Array.isArray(data.subtitles)) {
        const newSubs: Subtitle[] = data.subtitles.map((s: any) => ({
          id: genSubId(),
          text: s.text || "",
          startTime: Number(s.startTime) || 0,
          endTime: Math.min(Number(s.endTime) || 0, duration),
          position: "bottom" as const,
          style: "classic" as const,
        }));
        onSetSubtitles(newSubs);
        toast.success(`${newSubs.length} legendas geradas com sucesso!`);
      } else {
        toast.error("Não foi possível transcrever o áudio");
      }
    } catch (err: any) {
      console.error("Transcription error:", err);
      toast.error("Erro ao gerar legendas: " + (err?.message || "erro desconhecido"));
    } finally {
      onSetGenerating(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Legendas</h4>
        <Button variant="outline" size="sm" onClick={onAdd} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Manual
        </Button>
      </div>

      {/* Auto generate button */}
      <Button
        variant="default"
        size="sm"
        className="w-full gap-2"
        onClick={generateSubtitles}
        disabled={isGenerating || !videoFile}
      >
        {isGenerating ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Transcrevendo áudio...</>
        ) : (
          <><Sparkles className="h-4 w-4" /> Gerar Legendas Automáticas</>
        )}
      </Button>

      {subtitles.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full gap-1.5 text-xs text-muted-foreground"
          onClick={() => { onSetSubtitles([]); }}
        >
          <RefreshCw className="h-3 w-3" /> Limpar todas
        </Button>
      )}

      {subtitles.length === 0 && !isGenerating && (
        <p className="text-xs text-muted-foreground text-center py-4">
          Clique em "Gerar Legendas Automáticas" para transcrever o áudio do vídeo, ou adicione manualmente.
        </p>
      )}

      <div className="space-y-2 max-h-60 overflow-y-auto">
        {subtitles.map(sub => (
          <div key={sub.id} className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="flex items-start gap-2">
              <Input
                value={sub.text}
                onChange={e => onUpdate(sub.id, { text: e.target.value })}
                placeholder="Texto da legenda"
                className="text-xs h-8 flex-1"
              />
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => onRemove(sub.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="text-[10px] text-muted-foreground">Início (s)</label>
                <Input
                  type="number" min={0} step={0.1}
                  value={sub.startTime}
                  onChange={e => onUpdate(sub.id, { startTime: Number(e.target.value) })}
                  className="text-xs h-7"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground">Fim (s)</label>
                <Input
                  type="number" min={0} step={0.1}
                  value={sub.endTime}
                  onChange={e => onUpdate(sub.id, { endTime: Number(e.target.value) })}
                  className="text-xs h-7"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground">Posição</label>
                <Select value={sub.position} onValueChange={v => onUpdate(sub.id, { position: v as Subtitle["position"] })}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top">Topo</SelectItem>
                    <SelectItem value="center">Centro</SelectItem>
                    <SelectItem value="bottom">Baixo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground">Estilo</label>
                <Select value={sub.style} onValueChange={v => onUpdate(sub.id, { style: v as Subtitle["style"] })}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="classic">Clássico</SelectItem>
                    <SelectItem value="highlight">Destaque</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
