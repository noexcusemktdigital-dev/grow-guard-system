import { Check, CheckCheck, Bot, User, Image as ImageIcon } from "lucide-react";
import type { WhatsAppMessage } from "@/hooks/useWhatsApp";

interface Props {
  message: WhatsAppMessage;
  isGrouped?: boolean;
}

const statusIcon: Record<string, React.ReactNode> = {
  sent: <Check className="w-3 h-3 text-primary-foreground/50" />,
  delivered: <CheckCheck className="w-3 h-3 text-primary-foreground/50" />,
  read: <CheckCheck className="w-3 h-3 text-blue-300" />,
};

export function ChatMessageBubble({ message, isGrouped = false }: Props) {
  const isOutbound = message.direction === "outbound";
  const time = new Date(message.created_at).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const metadata = (message.metadata || {}) as Record<string, unknown>;
  const isAiGenerated = !!metadata.ai_generated;

  return (
    <div className={`flex ${isOutbound ? "justify-end" : "justify-start"} ${isGrouped ? "mb-[2px]" : "mb-2"}`}>
      <div className={`relative max-w-[75%] ${isGrouped ? "" : isOutbound ? "chat-bubble-out" : "chat-bubble-in"}`}>
        <div
          className={`rounded-lg px-3 py-1.5 text-[13px] leading-relaxed shadow-sm ${
            isOutbound
              ? "bg-[hsl(var(--primary)/0.9)] text-primary-foreground"
              : "bg-card text-card-foreground border border-border/50"
          } ${!isGrouped && isOutbound ? "rounded-tr-none" : ""} ${!isGrouped && !isOutbound ? "rounded-tl-none" : ""}`}
        >
          {/* Media preview */}
          {message.media_url && (
            <a href={message.media_url} target="_blank" rel="noopener noreferrer" className="block mb-1.5">
              <div className={`w-48 h-32 rounded-md flex items-center justify-center ${isOutbound ? "bg-primary-foreground/10" : "bg-muted"}`}>
                <ImageIcon className={`w-8 h-8 ${isOutbound ? "text-primary-foreground/40" : "text-muted-foreground/40"}`} />
              </div>
            </a>
          )}

          {message.content && <p className="whitespace-pre-wrap break-words">{message.content}</p>}

          {/* Footer: time + status + ai badge inline */}
          <div className={`flex items-center gap-1.5 mt-0.5 ${isOutbound ? "justify-end" : "justify-start"}`}>
            {isOutbound && isAiGenerated && (
              <span className={`text-[9px] font-medium flex items-center gap-0.5 ${isOutbound ? "text-primary-foreground/50" : "text-muted-foreground"}`}>
                <Bot className="w-2.5 h-2.5" />IA
              </span>
            )}
            {isOutbound && !isAiGenerated && (
              <span className={`text-[9px] font-medium flex items-center gap-0.5 ${isOutbound ? "text-primary-foreground/50" : "text-muted-foreground"}`}>
                <User className="w-2.5 h-2.5" />
              </span>
            )}
            <span className={`text-[10px] ${isOutbound ? "text-primary-foreground/50" : "text-muted-foreground"}`}>
              {time}
            </span>
            {isOutbound && statusIcon[message.status]}
          </div>
        </div>
      </div>
    </div>
  );
}
