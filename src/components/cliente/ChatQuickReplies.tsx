import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquareText, Plus, X, Send } from "lucide-react";

const DEFAULT_TEMPLATES = [
  { id: "1", label: "Saudação", text: "Olá! Tudo bem? Como posso ajudar? 😊" },
  { id: "2", label: "Obrigado", text: "Muito obrigado pelo contato! Qualquer dúvida, estou à disposição." },
  { id: "3", label: "Aguardando", text: "Vou verificar isso para você e retorno em breve!" },
  { id: "4", label: "Proposta", text: "Vou preparar uma proposta personalizada e envio em instantes!" },
  { id: "5", label: "Follow-up", text: "Olá! Passando para saber se teve alguma dúvida sobre nossa conversa." },
];

interface Props {
  onSelect: (text: string) => void;
}

export function ChatQuickReplies({ onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState(() => {
    const saved = localStorage.getItem("chat_quick_replies");
    return saved ? JSON.parse(saved) : DEFAULT_TEMPLATES;
  });
  const [newLabel, setNewLabel] = useState("");
  const [newText, setNewText] = useState("");
  const [adding, setAdding] = useState(false);

  const saveTemplates = (t: typeof templates) => {
    setTemplates(t);
    localStorage.setItem("chat_quick_replies", JSON.stringify(t));
  };

  const handleAdd = () => {
    if (!newLabel.trim() || !newText.trim()) return;
    const updated = [...templates, { id: Date.now().toString(), label: newLabel.trim(), text: newText.trim() }];
    saveTemplates(updated);
    setNewLabel("");
    setNewText("");
    setAdding(false);
  };

  const handleRemove = (id: string) => {
    saveTemplates(templates.filter((t: any) => t.id !== id));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-full text-muted-foreground" title="Respostas rápidas">
          <MessageSquareText className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" side="top" align="start">
        <div className="px-3 py-2 border-b border-border flex items-center justify-between">
          <span className="text-xs font-bold">Respostas Rápidas</span>
          <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={() => setAdding(!adding)}>
            <Plus className="w-3 h-3" /> Nova
          </Button>
        </div>

        {adding && (
          <div className="px-3 py-2 border-b border-border space-y-1.5">
            <Input placeholder="Nome (ex: Saudação)" value={newLabel} onChange={e => setNewLabel(e.target.value)} className="h-7 text-xs" />
            <Input placeholder="Mensagem..." value={newText} onChange={e => setNewText(e.target.value)} className="h-7 text-xs" />
            <div className="flex gap-1 justify-end">
              <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => setAdding(false)}>Cancelar</Button>
              <Button size="sm" className="h-6 text-[10px]" onClick={handleAdd}>Salvar</Button>
            </div>
          </div>
        )}

        <ScrollArea className="max-h-60">
          <div className="p-1.5 space-y-0.5">
            {templates.map((t: any) => (
              <div
                key={t.id}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 cursor-pointer group transition"
                onClick={() => { onSelect(t.text); setOpen(false); }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Badge variant="secondary" className="text-[8px] px-1 py-0 shrink-0">{t.label}</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">{t.text}</p>
                </div>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
                  <Send className="w-3 h-3 text-primary" />
                  <button onClick={(e) => { e.stopPropagation(); handleRemove(t.id); }} className="p-0.5 hover:text-destructive">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
