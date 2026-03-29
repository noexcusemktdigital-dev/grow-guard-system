// @ts-nocheck
import React, { useState, useRef, useEffect, useCallback } from "react";
import { Check, CheckCheck, Bot, User, Image as ImageIcon, FileText, Mic, Video, Reply, Sticker, Clock, AlertCircle, RotateCcw, Play, Pause, Star, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatMessageMenu } from "./ChatMessageMenu";
import type { WhatsAppMessage } from "@/hooks/useWhatsApp";

interface Props {
  message: WhatsAppMessage;
  isGrouped?: boolean;
  onReply?: (message: WhatsAppMessage) => void;
  allMessages?: WhatsAppMessage[];
  hideTimestamp?: boolean;
  onRetry?: (message: WhatsAppMessage) => void;
  onImageClick?: (url: string) => void;
  onForward?: (message: WhatsAppMessage) => void;
  onStar?: (message: WhatsAppMessage) => void;
  onDelete?: (message: WhatsAppMessage, forEveryone: boolean) => void;
  onReact?: (message: WhatsAppMessage, emoji: string) => void;
}

const URL_REGEX = /(https?:\/\/[^\s<]+[^\s<.,;:!?"')}\]])/gi;

function renderTextWithLinks(text: string) {
  const parts = text.split(URL_REGEX);
  return parts.map((part, i) => {
    if (URL_REGEX.test(part)) {
      URL_REGEX.lastIndex = 0;
      return (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline break-all hover:text-blue-700">
          {part}
        </a>
      );
    }
    return part;
  });
}

function ExpandableText({ text, maxLength = 500 }: { text: string; maxLength?: number }) {
  const [expanded, setExpanded] = useState(false);
  const needsTruncation = text.length > maxLength;
  const displayText = needsTruncation && !expanded ? text.substring(0, maxLength) + "..." : text;

  return (
    <p className="whitespace-pre-wrap break-words">
      {renderTextWithLinks(displayText)}
      {needsTruncation && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-[11px] font-medium text-primary/70 hover:text-primary ml-1"
        >
          {expanded ? "Ver menos" : "Ver mais"}
        </button>
      )}
    </p>
  );
}

function isImageUrl(url: string, type?: string): boolean {
  if (type === "image") return true;
  return /\.(jpe?g|png|gif|webp|bmp|svg)(\?|$)/i.test(url);
}

// Custom WhatsApp-style audio player
function WaAudioPlayer({ src, isOutbound }: { src: string; isOutbound: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const toggle = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) { el.pause(); } else { el.play(); }
    setPlaying(!playing);
  }, [playing]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onTime = () => setProgress(el.currentTime);
    const onMeta = () => setDuration(el.duration || 0);
    const onEnd = () => { setPlaying(false); setProgress(0); };
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("ended", onEnd);
    return () => { el.removeEventListener("timeupdate", onTime); el.removeEventListener("loadedmetadata", onMeta); el.removeEventListener("ended", onEnd); };
  }, []);

  const fmt = (s: number) => { const m = Math.floor(s / 60); return `${m}:${Math.floor(s % 60).toString().padStart(2, "0")}`; };
  const pct = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-2 min-w-[200px] mb-1">
      <audio ref={audioRef} src={src} preload="metadata" />
      <button onClick={toggle} className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isOutbound ? "bg-emerald-700/30 text-emerald-800 dark:text-emerald-300" : "bg-primary/10 text-primary"}`}>
        {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="relative h-1 rounded-full bg-black/10 dark:bg-white/10">
          <div className={`absolute left-0 top-0 h-full rounded-full transition-all ${isOutbound ? "bg-emerald-600" : "bg-primary"}`} style={{ width: `${pct}%` }} />
        </div>
        <span className={`text-[9px] mt-0.5 block ${isOutbound ? "text-emerald-700/60 dark:text-emerald-300/60" : "text-muted-foreground"}`}>
          {playing ? fmt(progress) : fmt(duration || 0)}
        </span>
      </div>
    </div>
  );
}

const statusIcon: Record<string, React.ReactNode> = {
  sending: <Clock className="w-3 h-3 text-muted-foreground/40" />,
  sent: <Check className="w-3 h-3 text-muted-foreground/50" />,
  delivered: <CheckCheck className="w-3 h-3 text-muted-foreground/50" />,
  read: <CheckCheck className="w-3 h-3 text-blue-400" />,
  failed: <AlertCircle className="w-3 h-3 text-destructive" />,
};

export const ChatMessageBubble = React.forwardRef<HTMLDivElement, Props>(function ChatMessageBubble(
  { message, isGrouped = false, onReply, allMessages = [], hideTimestamp = false, onRetry, onImageClick, onForward, onStar, onDelete, onReact },
  ref
) {
  const [imgError, setImgError] = useState(false);
  const isOutbound = message.direction === "outbound";
  const time = new Date(message.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const metadata = (message.metadata || {}) as Record<string, unknown>;
  const isAiGenerated = !!metadata.ai_generated;
  const senderName = (metadata.pushName || metadata.senderName) as string | undefined;
  const isFailed = message.status === "failed";
  const isSending = message.status === "sending";

  const quotedMessageId = (metadata.quotedMessageId || metadata.quotedMsg) as string | undefined;
  const quotedMessage = quotedMessageId
    ? allMessages.find(m => m.message_id_zapi === quotedMessageId || m.id === quotedMessageId)
    : null;

  const resolvedMediaUrl = message.media_url
    || (message.type === "audio" && metadata.ptt ? ((metadata.ptt as { audioUrl?: string })?.audioUrl || (metadata.ptt as { pttUrl?: string })?.pttUrl) : null)
    || (message.type === "audio" && metadata.audio ? (metadata.audio as { audioUrl?: string })?.audioUrl : null)
    || null;

  const isSticker = message.type === "sticker" || !!(metadata.stickerMessage);
  const stickerUrl = isSticker ? (resolvedMediaUrl || message.media_url) : null;

  const renderMedia = () => {
    if (isSticker && stickerUrl && !imgError) {
      return (
        <div className="mb-1">
          <img src={stickerUrl} alt="Sticker" className="w-32 h-32 object-contain" onError={() => setImgError(true)} loading="lazy" />
        </div>
      );
    }

    if (message.type === "audio") {
      if (resolvedMediaUrl) {
        return <WaAudioPlayer src={resolvedMediaUrl} isOutbound={isOutbound} />;
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
        <div
          className="block mb-1.5 cursor-pointer"
          onClick={(e) => { e.stopPropagation(); onImageClick?.(resolvedMediaUrl); }}
        >
          <img src={resolvedMediaUrl} alt="Mídia" className="w-48 max-h-48 rounded-md object-cover" onError={() => setImgError(true)} loading="lazy" />
        </div>
      );
    }

    const Icon = message.type === "video" ? Video : message.type === "document" ? FileText : ImageIcon;
    const label = message.type === "video" ? "Vídeo" : message.type === "document" ? "📄 Abrir documento" : "Mídia";
    return (
      <a href={resolvedMediaUrl} target="_blank" rel="noopener noreferrer" className="block mb-1.5">
        <div className={`w-52 rounded-md flex items-center gap-2 px-3 py-3 ${isOutbound ? "bg-[#d4edda]" : "bg-muted"}`}>
          <Icon className={`w-6 h-6 shrink-0 ${isOutbound ? "text-emerald-700/60" : "text-muted-foreground/60"}`} />
          <span className="text-xs font-medium truncate">{label}</span>
        </div>
      </a>
    );
  };

  const isDeleted = !!(message as unknown as { is_deleted?: boolean }).is_deleted;
  const isStarredMsg = !!(message as unknown as { is_starred?: boolean }).is_starred;
  const reactions = (metadata.reactions as Array<{ emoji: string; from: string }>) || [];

  if (isDeleted) {
    return (
      <div ref={ref} className={`group flex ${isOutbound ? "justify-end" : "justify-start"} ${isGrouped ? "mb-[2px]" : "mb-2"}`}>
        <div className={`max-w-[75%] lg:max-w-[520px] rounded-lg px-3 py-1.5 text-[13px] italic ${isOutbound ? "wa-bubble-out" : "wa-bubble-in"} opacity-60`}>
          <div className="flex items-center gap-1.5">
            <Ban className="w-3.5 h-3.5" />
            <span>Mensagem apagada</span>
          </div>
          {!hideTimestamp && (
            <span className={`text-[10px] block mt-0.5 ${isOutbound ? "text-emerald-700/50 dark:text-emerald-300/50 text-right" : "text-muted-foreground"}`}>{time}</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className={`group flex ${isOutbound ? "justify-end" : "justify-start"} ${isGrouped ? "mb-[2px]" : "mb-2"} ${isSending ? "opacity-70" : ""}`}>
      <div className={`relative max-w-[75%] lg:max-w-[520px] ${isGrouped ? "" : isOutbound ? "chat-bubble-out" : "chat-bubble-in"}`}>
        {/* Context menu */}
        {onReply && onForward && onStar && onDelete && onReact && (
          <ChatMessageMenu
            message={message}
            onReply={onReply}
            onForward={onForward}
            onStar={onStar}
            onDelete={onDelete}
            onReact={onReact}
            isOutbound={isOutbound}
            isStarred={isStarredMsg}
          />
        )}

        <div className={`rounded-lg px-3 py-1.5 text-[13px] leading-relaxed shadow-sm ${isOutbound ? "wa-bubble-out" : "wa-bubble-in"} ${!isGrouped && isOutbound ? "rounded-tr-none" : ""} ${!isGrouped && !isOutbound ? "rounded-tl-none" : ""} ${isFailed ? "ring-1 ring-destructive/50" : ""}`}>
          {!isOutbound && !isGrouped && senderName && (
            <p className="text-[10px] font-bold text-primary/80 mb-0.5 truncate">{senderName}</p>
          )}

          {quotedMessage && (
            <div className={`rounded-md px-2.5 py-1.5 mb-1.5 border-l-3 ${isOutbound ? "bg-emerald-800/10 border-emerald-600/50" : "bg-muted/50 border-primary/50"}`}>
              <p className={`text-[10px] font-semibold ${isOutbound ? "text-emerald-700/70" : "text-primary/70"}`}>
                {quotedMessage.direction === "outbound" ? "Você" : "Contato"}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                {quotedMessage.type === "audio" ? "🎤 Áudio" : quotedMessage.type === "image" ? "📷 Imagem" : (quotedMessage.content?.substring(0, 80) || "Mídia")}
              </p>
            </div>
          )}

          {renderMedia()}

          {message.content && !isSticker && (
            <ExpandableText text={message.content} maxLength={500} />
          )}

          {/* Footer */}
          {!hideTimestamp && (
            <div className={`flex items-center gap-1.5 mt-0.5 ${isOutbound ? "justify-end" : "justify-start"}`}>
              {isStarredMsg && <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />}
              {isOutbound && isAiGenerated && (
                <span className="text-[9px] font-medium flex items-center gap-0.5 text-emerald-700/50 dark:text-emerald-300/50">
                  <Bot className="w-2.5 h-2.5" />IA
                </span>
              )}
              {isOutbound && !isAiGenerated && !isSending && !isFailed && (
                <span className="text-[9px] font-medium flex items-center gap-0.5 text-emerald-700/50 dark:text-emerald-300/50">
                  <User className="w-2.5 h-2.5" />
                </span>
              )}
              <span className={`text-[10px] ${isOutbound ? "text-emerald-700/50 dark:text-emerald-300/50" : "text-muted-foreground"}`}>{time}</span>
              {isOutbound && statusIcon[message.status]}
            </div>
          )}

          {/* Retry button for failed messages */}
          {isFailed && onRetry && (
            <button
              onClick={(e) => { e.stopPropagation(); onRetry(message); }}
              className="flex items-center gap-1 mt-1 text-[10px] text-destructive hover:text-destructive/80 font-medium"
            >
              <RotateCcw className="w-3 h-3" /> Reenviar
            </button>
          )}
        </div>

        {/* Reactions display */}
        {reactions.length > 0 && (
          <div className={`flex gap-0.5 mt-0.5 ${isOutbound ? "justify-end" : "justify-start"}`}>
            {reactions.map((r, i) => (
              <span key={i} className="text-sm bg-muted/80 rounded-full px-1.5 py-0.5 border border-border/50 shadow-sm">
                {r.emoji}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
