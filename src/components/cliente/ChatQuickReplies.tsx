import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquareText, Plus, X, Send, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Template {
  id: string;
  label: string;
  text: string;
  position: number;
}

interface Props {
  onSelect: (text: string) => void;
}

export function ChatQuickReplies({ onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newText, setNewText] = useState("");
  const [adding, setAdding] = useState(false);
  const { data: orgId } = useUserOrgId();
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["quick-reply-templates", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("quick_reply_templates")
        .select("*")
        .eq("organization_id", orgId)
        .order("position", { ascending: true });
      if (error) throw error;
      return (data || []) as Template[];
    },
    enabled: !!orgId,
  });

  const addMutation = useMutation({
    mutationFn: async ({ label, text }: { label: string; text: string }) => {
      if (!orgId) return;
      const { error } = await supabase
        .from("quick_reply_templates")
        .insert({ organization_id: orgId, label, text, position: templates.length });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quick-reply-templates"] });
      setNewLabel("");
      setNewText("");
      setAdding(false);
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("quick_reply_templates")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quick-reply-templates"] });
    },
  });

  const handleAdd = () => {
    if (!newLabel.trim() || !newText.trim()) return;
    addMutation.mutate({ label: newLabel.trim(), text: newText.trim() });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-full text-muted-foreground" title="Respostas rápidas" aria-label="Respostas rápidas">
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
              <Button size="sm" className="h-6 text-[10px]" onClick={handleAdd} disabled={addMutation.isPending}>
                {addMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Salvar"}
              </Button>
            </div>
          </div>
        )}

        <ScrollArea className="max-h-60">
          {isLoading ? (
            <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
          ) : templates.length === 0 ? (
            <div className="text-center py-4 text-xs text-muted-foreground">Nenhuma resposta rápida. Clique em "+ Nova" para criar.</div>
          ) : (
            <div className="p-1.5 space-y-0.5">
              {templates.map((t) => (
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
                    <button onClick={(e) => { e.stopPropagation(); removeMutation.mutate(t.id); }} className="p-0.5 hover:text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
