import { useState } from "react";
import { Check, CheckCheck, Bot, User, Image as ImageIcon, FileText, Mic, Video } from "lucide-react";
import type { WhatsAppMessage } from "@/hooks/useWhatsApp";

interface Props {
  message: WhatsAppMessage;
  isGrouped?: boolean;
}

const statusIcon: Record<string, React.ReactNode> = {
  sent: <Check className="w-3 h-3 text-muted-foreground/50" />,
  delivered: <CheckCheck className="w-3 h-3 text-muted-foreground/50" />,
  read: <CheckCheck className="w-3 h-3 text-blue-400" />,
};

function isImageUrl(url: string, type?: string): boolean {
  if (type === "image") return true;
  return /\.(jpe?g|png|gif|webp|bmp|svg)(\?|$)/i.test(url);
}

export function ChatMessageBubble({ message, isGrouped = false }: Props) {
  const [imgError, setImgError] = useState(false);
  const isOutbound = message.direction === "outbound";
  const time = new Date(message.created_at).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const metadata = (message.metadata || {}) as Record<string, unknown>;
  const isAiGenerated = !!metadata.ai_generated;

  // Fallback: try to get audio URL from metadata for old messages saved without media_url
  const resolvedMediaUrl = message.media_url 
    || (message.type === "audio" && metadata.ptt ? ((metadata.ptt as any)?.audioUrl || (metadata.ptt as any)?.pttUrl) : null)
    || (message.type === "audio" && metadata.audio ? (metadata.audio as any)?.audioUrl : null)
    || null;

  const renderMedia = () => {
    // Audio messages — always render even without URL
    if (message.type === "audio") {
      if (resolvedMediaUrl) {
        return (
          <div className="flex items-center gap-2 mb-1.5 min-w-[200px]">
            <Mic className={`w-4 h-4 shrink-0 ${isOutbound ? "text-emerald-700/60" : "text-muted-foreground/60"}`} />
            <audio controls src={resolvedMediaUrl} className="w-full h-8" preload="metadata" />
          </div>
        );
      }
      return (
        <div className="flex items-center gap-2 mb-1.5 min-w-[160px] opacity-60">
          <Mic className={`w-4 h-4 shrink-0 ${isOutbound ? "text-emerald-700/60" : "text-muted-foreground/60"}`} />
          <span className="text-xs italic">Áudio não disponível</span>
        </div>
      );
    }

    if (!resolvedMediaUrl) return null;

    if (isImageUrl(resolvedMediaUrl, message.type) && !imgError) {
      return (
        <a href={resolvedMediaUrl} target="_blank" rel="noopener noreferrer" className="block mb-1.5">
          <img
            src={resolvedMediaUrl}
            alt="Mídia"
            className="w-48 max-h-48 rounded-md object-cover cursor-pointer"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        </a>
      );
    }

    const Icon = message.type === "video" ? Video : message.type === "document" ? FileText : ImageIcon;
    return (
      <a href={resolvedMediaUrl} target="_blank" rel="noopener noreferrer" className="block mb-1.5">
        <div className={`w-48 h-32 rounded-md flex items-center justify-center ${isOutbound ? "bg-[#d4edda]" : "bg-muted"}`}>
          <Icon className={`w-8 h-8 ${isOutbound ? "text-emerald-700/40" : "text-muted-foreground/40"}`} />
        </div>
      </a>
    );
  };

  return (
    <div className={`flex ${isOutbound ? "justify-end" : "justify-start"} ${isGrouped ? "mb-[2px]" : "mb-2"}`}>
      <div className={`relative max-w-[75%] lg:max-w-[520px] ${isGrouped ? "" : isOutbound ? "chat-bubble-out" : "chat-bubble-in"}`}>
        <div
          className={`rounded-lg px-3 py-1.5 text-[13px] leading-relaxed shadow-sm ${
            isOutbound
              ? "wa-bubble-out"
              : "wa-bubble-in"
          } ${!isGrouped && isOutbound ? "rounded-tr-none" : ""} ${!isGrouped && !isOutbound ? "rounded-tl-none" : ""}`}
        >
          {renderMedia()}

          {message.content && <p className="whitespace-pre-wrap break-words">{message.content}</p>}

          {/* Footer */}
          <div className={`flex items-center gap-1.5 mt-0.5 ${isOutbound ? "justify-end" : "justify-start"}`}>
            {isOutbound && isAiGenerated && (
              <span className="text-[9px] font-medium flex items-center gap-0.5 text-emerald-700/50 dark:text-emerald-300/50">
                <Bot className="w-2.5 h-2.5" />IA
              </span>
            )}
            {isOutbound && !isAiGenerated && (
              <span className="text-[9px] font-medium flex items-center gap-0.5 text-emerald-700/50 dark:text-emerald-300/50">
                <User className="w-2.5 h-2.5" />
              </span>
            )}
            <span className={`text-[10px] ${isOutbound ? "text-emerald-700/50 dark:text-emerald-300/50" : "text-muted-foreground"}`}>
              {time}
            </span>
            {isOutbound && statusIcon[message.status]}
          </div>
        </div>
      </div>
    </div>
  );
}
