import React, { useState } from "react";
import { Copy, Forward, Star, Trash2, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import type { WhatsAppMessage } from "@/hooks/useWhatsApp";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

interface Props {
  message: WhatsAppMessage;
  onReply: (msg: WhatsAppMessage) => void;
  onForward: (msg: WhatsAppMessage) => void;
  onStar: (msg: WhatsAppMessage) => void;
  onDelete: (msg: WhatsAppMessage, forEveryone: boolean) => void;
  onReact: (msg: WhatsAppMessage, emoji: string) => void;
  isOutbound: boolean;
  isStarred: boolean;
}

export function ChatMessageMenu({ message, onReply, onForward, onStar, onDelete, onReact, isOutbound, isStarred }: Props) {
  const [showReactions, setShowReactions] = useState(false);

  const handleCopy = () => {
    if (message.content) {
      navigator.clipboard.writeText(message.content);
      toast({ title: "Texto copiado!" });
    }
  };

  return (
    <div className="relative">
      {/* Quick reactions bar */}
      {showReactions && (
        <div className={`absolute bottom-full mb-1 ${isOutbound ? "right-0" : "left-0"} bg-popover border border-border rounded-full shadow-lg px-1 py-0.5 flex items-center gap-0.5 z-50 animate-in fade-in-0 zoom-in-95`}>
          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              className="w-7 h-7 flex items-center justify-center text-base hover:bg-muted rounded-full transition-transform hover:scale-125"
              onClick={() => { onReact(message, emoji); setShowReactions(false); }}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      <DropdownMenu onOpenChange={(open) => { if (!open) setShowReactions(false); }}>
        <DropdownMenuTrigger asChild>
          <button
            className={`opacity-0 group-hover:opacity-100 transition-opacity absolute top-1 ${isOutbound ? "left-1" : "right-1"} w-6 h-6 rounded-full flex items-center justify-center bg-popover/90 border border-border/50 shadow-sm hover:bg-popover z-10`}
          >
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={isOutbound ? "end" : "start"} className="w-44">
          <DropdownMenuItem onClick={() => onReply(message)} className="text-xs gap-2">
            <span>↩</span> Responder
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowReactions(true)} className="text-xs gap-2">
            <span>😀</span> Reagir
          </DropdownMenuItem>
          {message.content && (
            <DropdownMenuItem onClick={handleCopy} className="text-xs gap-2">
              <Copy className="w-3.5 h-3.5" /> Copiar texto
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => onForward(message)} className="text-xs gap-2">
            <Forward className="w-3.5 h-3.5" /> Encaminhar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onStar(message)} className="text-xs gap-2">
            <Star className={`w-3.5 h-3.5 ${isStarred ? "fill-amber-400 text-amber-400" : ""}`} />
            {isStarred ? "Desmarcar estrela" : "Marcar com estrela"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onDelete(message, false)} className="text-xs gap-2 text-destructive focus:text-destructive">
            <Trash2 className="w-3.5 h-3.5" /> Apagar para mim
          </DropdownMenuItem>
          {isOutbound && (
            <DropdownMenuItem onClick={() => onDelete(message, true)} className="text-xs gap-2 text-destructive focus:text-destructive">
              <Trash2 className="w-3.5 h-3.5" /> Apagar para todos
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
