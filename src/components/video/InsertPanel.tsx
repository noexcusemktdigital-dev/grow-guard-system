import { useRef } from "react";
import { Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import type { ImageInsert } from "@/hooks/useVideoEditor";

interface Props {
  inserts: ImageInsert[];
  onAdd: (file: File) => void;
  onUpdate: (id: string, updates: Partial<ImageInsert>) => void;
  onRemove: (id: string) => void;
}

export function InsertPanel({ inserts, onAdd, onUpdate, onRemove }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onAdd(f);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Inserts de Imagem</h4>
        <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="gap-1.5">
          <Upload className="h-3.5 w-3.5" /> Upload
        </Button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>

      {inserts.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">
          Adicione logos, selos ou watermarks ao vídeo.
        </p>
      )}

      <div className="space-y-2 max-h-60 overflow-y-auto">
        {inserts.map(ins => (
          <div key={ins.id} className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <img src={ins.previewUrl} alt="" className="w-10 h-10 rounded object-cover" />
              <span className="text-xs truncate flex-1">{ins.file.name}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onRemove(ins.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-muted-foreground">Início (s)</label>
                <Input type="number" min={0} step={0.1} value={ins.startTime}
                  onChange={e => onUpdate(ins.id, { startTime: Number(e.target.value) })}
                  className="text-xs h-7" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground">Fim (s)</label>
                <Input type="number" min={0} step={0.1} value={ins.endTime}
                  onChange={e => onUpdate(ins.id, { endTime: Number(e.target.value) })}
                  className="text-xs h-7" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground">Posição</label>
                <Select value={ins.position} onValueChange={v => onUpdate(ins.id, { position: v as ImageInsert["position"] })}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top-left">↖ Sup. Esq.</SelectItem>
                    <SelectItem value="top-right">↗ Sup. Dir.</SelectItem>
                    <SelectItem value="bottom-left">↙ Inf. Esq.</SelectItem>
                    <SelectItem value="bottom-right">↘ Inf. Dir.</SelectItem>
                    <SelectItem value="center">Centro</SelectItem>
                    <SelectItem value="fullscreen">Tela Cheia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">Opacidade: {ins.opacity}%</label>
              <Slider value={[ins.opacity]} min={5} max={100} step={5}
                onValueChange={v => onUpdate(ins.id, { opacity: v[0] })} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
