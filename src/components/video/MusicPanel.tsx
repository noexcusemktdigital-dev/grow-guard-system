import { useRef } from "react";
import { Music, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { MusicTrack } from "@/hooks/useVideoEditor";

interface Props {
  music: MusicTrack | null;
  onSet: (file: File) => void;
  onUpdate: (updates: Partial<MusicTrack>) => void;
  onRemove: () => void;
}

export function MusicPanel({ music, onSet, onUpdate, onRemove }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onSet(f);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Música de Fundo</h4>
        {!music && (
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="gap-1.5">
            <Upload className="h-3.5 w-3.5" /> Upload
          </Button>
        )}
        <input ref={fileRef} type="file" accept="audio/mp3,audio/wav,audio/mpeg" className="hidden" onChange={handleFile} />
      </div>

      {!music ? (
        <div className="text-center py-8 space-y-2">
          <Music className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-xs text-muted-foreground">
            Faça upload de um arquivo MP3 ou WAV (máx 20MB)
          </p>
        </div>
      ) : (
        <div className="bg-muted/50 rounded-lg p-3 space-y-3">
          <div className="flex items-center gap-2">
            <Music className="h-4 w-4 text-primary" />
            <span className="text-xs truncate flex-1">{music.file.name}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRemove}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground">Volume: {music.volume}%</label>
            <Slider value={[music.volume]} min={0} max={100} step={5}
              onValueChange={v => onUpdate({ volume: v[0] })} />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground">Modo de Áudio</label>
            <Select value={music.mode} onValueChange={v => onUpdate({ mode: v as MusicTrack["mode"] })}>
              <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mix">Manter original + música</SelectItem>
                <SelectItem value="replace">Substituir áudio original</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <audio src={music.previewUrl} controls className="w-full h-8" />
        </div>
      )}
    </div>
  );
}
