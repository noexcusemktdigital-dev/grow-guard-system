import { useState } from "react";
import { Quote, History, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { type MensagemDoDia, mockMensagens } from "@/types/home";
import { HomeMensagemAdmin } from "./HomeMensagemAdmin";

const categoriaColors: Record<string, string> = {
  Mentalidade: "bg-purple-500/15 text-purple-700 dark:text-purple-400",
  Vendas: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  "Gestão": "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  Marketing: "bg-pink-500/15 text-pink-700 dark:text-pink-400",
  "Liderança": "bg-amber-500/15 text-amber-700 dark:text-amber-400",
};

interface Props {
  mensagem: MensagemDoDia;
  isAdmin?: boolean;
}

export function HomeMensagemDia({ mensagem, isAdmin = true }: Props) {
  const [showHistory, setShowHistory] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  const historico = mockMensagens
    .filter(m => m.status === "Arquivado")
    .sort((a, b) => b.dataPublicacao.localeCompare(a.dataPublicacao))
    .slice(0, 7);

  return (
    <>
      <div className="glass-card p-6 flex flex-col h-full">
        <div className="flex items-start justify-between mb-4">
          <Quote className="w-8 h-8 text-primary/30" />
          <Badge className={categoriaColors[mensagem.categoria] || "bg-muted text-muted-foreground"}>
            {mensagem.categoria}
          </Badge>
        </div>
        <p className="text-lg italic text-foreground leading-relaxed flex-1">
          "{mensagem.texto}"
        </p>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">— {mensagem.autor}</span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => setShowHistory(true)}>
              <History className="w-3.5 h-3.5 mr-1" /> Histórico
            </Button>
            {isAdmin && (
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => setShowAdmin(true)}>
                <Settings className="w-3.5 h-3.5 mr-1" /> Gerenciar
              </Button>
            )}
          </div>
        </div>
      </div>

      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mensagens Anteriores</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {historico.map(m => (
              <div key={m.id} className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm italic">"{m.texto}"</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-[10px]">{m.categoria}</Badge>
                  <span className="text-[10px] text-muted-foreground">— {m.autor} · {m.dataPublicacao}</span>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <HomeMensagemAdmin open={showAdmin} onOpenChange={setShowAdmin} />
    </>
  );
}
