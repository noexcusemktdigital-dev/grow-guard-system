// @ts-nocheck
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import { useAllDailyMessages, useDailyMessageMutations } from "@/hooks/useDailyMessages";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { reportError } from "@/lib/error-toast";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function HomeMensagemAdmin({ open, onOpenChange }: Props) {
  const [showForm, setShowForm] = useState(false);
  const { data: allMessages, isLoading } = useAllDailyMessages();
  const { createMessage, archiveMessage } = useDailyMessageMutations();
  const { profile } = useAuth();

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
              {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
              {(allMessages ?? []).map(m => (
                <div key={m.id} className="flex items-start gap-3 p-3 rounded-lg border border-border">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm line-clamp-2">"{m.message}"</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant="outline" className="text-[10px]">{m.date}</Badge>
                      <span className="text-[10px] text-muted-foreground">— {m.author || "Admin"}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      archiveMessage.mutate(m.id, {
                        onSuccess: () => toast.success("Mensagem removida"),
                        onError: (e) => reportError(e, { title: "Erro ao remover", category: "mensagem_admin.delete" }),
                      });
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
              {!isLoading && (allMessages ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma mensagem cadastrada.</p>
              )}
            </div>
          </div>
        ) : (
          <MensagemForm
            authorName={profile?.full_name || "Admin"}
            onSave={(msg) => {
              createMessage.mutate(msg, {
                onSuccess: () => {
                  toast.success("Mensagem criada!");
                  setShowForm(false);
                },
                onError: (e) => reportError(e, { title: "Erro ao criar mensagem", category: "mensagem_admin.create" }),
              });
            }}
            onCancel={() => setShowForm(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function MensagemForm({ authorName, onSave, onCancel }: { authorName: string; onSave: (m: { message: string; author: string; date: string }) => void; onCancel: () => void }) {
  const [texto, setTexto] = useState("");
  const [data, setData] = useState("");

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Texto da mensagem</label>
        <Textarea value={texto} onChange={e => setTexto(e.target.value)} placeholder="Mensagem motivacional..." />
      </div>
      <div>
        <label className="text-sm font-medium">Data de publicação</label>
        <Input type="date" value={data} onChange={e => setData(e.target.value)} />
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button
          disabled={!texto || !data}
          onClick={() => onSave({ message: texto, author: authorName, date: data })}
        >
          Salvar
        </Button>
      </div>
    </div>
  );
}
