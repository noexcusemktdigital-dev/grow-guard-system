import { Check, CheckCheck } from "lucide-react";
import type { WhatsAppMessage } from "@/hooks/useWhatsApp";

interface Props {
  message: WhatsAppMessage;
}

const statusIcon: Record<string, React.ReactNode> = {
  sent: <Check className="w-3 h-3 text-muted-foreground" />,
  delivered: <CheckCheck className="w-3 h-3 text-muted-foreground" />,
  read: <CheckCheck className="w-3 h-3 text-blue-400" />,
};

export function ChatMessageBubble({ message }: Props) {
  const isOutbound = message.direction === "outbound";
  const time = new Date(message.created_at).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={`flex ${isOutbound ? "justify-end" : "justify-start"} mb-2`}>
      <div
        className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
          isOutbound
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted text-foreground rounded-bl-md"
        }`}
      >
        {message.content && <p className="whitespace-pre-wrap break-words">{message.content}</p>}
        {message.media_url && (
          <a href={message.media_url} target="_blank" rel="noopener noreferrer" className="text-xs underline">
            📎 Mídia
          </a>
        )}
        <div className={`flex items-center gap-1 mt-1 ${isOutbound ? "justify-end" : "justify-start"}`}>
          <span className={`text-[10px] ${isOutbound ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
            {time}
          </span>
          {isOutbound && statusIcon[message.status]}
        </div>
      </div>
    </div>
  );
}
