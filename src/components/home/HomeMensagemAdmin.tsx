import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Archive } from "lucide-react";
import { type MensagemDoDia, type MensagemCategoria, type MensagemStatus, MENSAGEM_CATEGORIAS, mockMensagens } from "@/types/home";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function HomeMensagemAdmin({ open, onOpenChange }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [mensagens, setMensagens] = useState<MensagemDoDia[]>(mockMensagens);

  const statusColor: Record<MensagemStatus, string> = {
    Ativo: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    Programado: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
    Arquivado: "bg-muted text-muted-foreground",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Mensagens do Dia</DialogTitle>
        </DialogHeader>

        {!showForm ? (
          <div className="space-y-3">
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-1" /> Nova Mensagem
            </Button>
            <div className="space-y-2">
              {mensagens.map(m => (
                <div key={m.id} className="flex items-start gap-3 p-3 rounded-lg border border-border">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm line-clamp-2">"{m.texto}"</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge className={statusColor[m.status]} variant="outline">{m.status}</Badge>
                      <Badge variant="outline" className="text-[10px]">{m.categoria}</Badge>
                      <span className="text-[10px] text-muted-foreground">{m.dataPublicacao}</span>
                    </div>
                  </div>
                  {m.status !== "Arquivado" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMensagens(prev => prev.map(x => x.id === m.id ? { ...x, status: "Arquivado" } : x))}
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <MensagemForm
            onSave={(m) => {
              setMensagens(prev => [m, ...prev]);
              setShowForm(false);
            }}
            onCancel={() => setShowForm(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function MensagemForm({ onSave, onCancel }: { onSave: (m: MensagemDoDia) => void; onCancel: () => void }) {
  const [texto, setTexto] = useState("");
  const [categoria, setCategoria] = useState<MensagemCategoria>("Mentalidade");
  const [data, setData] = useState("");
  const [status, setStatus] = useState<MensagemStatus>("Programado");

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Texto da mensagem</label>
        <Textarea value={texto} onChange={e => setTexto(e.target.value)} placeholder="Mensagem motivacional..." />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium">Categoria</label>
          <Select value={categoria} onValueChange={v => setCategoria(v as MensagemCategoria)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {MENSAGEM_CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">Status</label>
          <Select value={status} onValueChange={v => setStatus(v as MensagemStatus)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Ativo">Ativo</SelectItem>
              <SelectItem value="Programado">Programado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">Data de publicação</label>
        <Input type="date" value={data} onChange={e => setData(e.target.value)} />
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button
          disabled={!texto || !data}
          onClick={() =>
            onSave({
              id: `msg-${Date.now()}`,
              texto,
              categoria,
              autor: "Davi",
              publico: ["Todos"],
              dataPublicacao: data,
              status,
              criadoEm: new Date().toISOString(),
            })
          }
        >
          Salvar
        </Button>
      </div>
    </div>
  );
}
