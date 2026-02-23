import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Subtitle } from "@/hooks/useVideoEditor";

interface Props {
  subtitles: Subtitle[];
  onAdd: () => void;
  onUpdate: (id: string, updates: Partial<Subtitle>) => void;
  onRemove: (id: string) => void;
}

export function SubtitlePanel({ subtitles, onAdd, onUpdate, onRemove }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Legendas</h4>
        <Button variant="outline" size="sm" onClick={onAdd} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Adicionar
        </Button>
      </div>

      {subtitles.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">
          Nenhuma legenda. Clique em "Adicionar" para criar.
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
