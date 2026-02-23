import { Check, CheckCheck, Bot, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

  const metadata = (message.metadata || {}) as Record<string, unknown>;
  const isAiGenerated = !!metadata.ai_generated;

  return (
    <div className={`flex ${isOutbound ? "justify-end" : "justify-start"} mb-2`}>
      <div
        className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
          isOutbound
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted text-foreground rounded-bl-md"
        }`}
      >
        {/* AI/Human badge for outbound messages */}
        {isOutbound && (
          <div className="mb-1">
            {isAiGenerated ? (
              <Badge variant="outline" className="text-[8px] px-1 py-0 gap-0.5 bg-purple-500/10 text-purple-300 border-purple-500/30">
                <Bot className="w-2.5 h-2.5" /> IA
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[8px] px-1 py-0 gap-0.5 bg-emerald-500/10 text-emerald-300 border-emerald-500/30">
                <User className="w-2.5 h-2.5" /> Humano
              </Badge>
            )}
          </div>
        )}
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
