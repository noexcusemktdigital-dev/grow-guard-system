// @ts-nocheck
import React, { useMemo } from "react";
import { Loader2, Bot, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChatMessageBubble } from "./ChatMessageBubble";
import { isToday, isYesterday, format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { WhatsAppMessage } from "@/hooks/useWhatsApp";

const DateSeparator = React.forwardRef<HTMLDivElement, { date: Date }>(({ date }, ref) => {
  let label: string;
  if (isToday(date)) label = "Hoje";
  else if (isYesterday(date)) label = "Ontem";
  else label = format(date, "dd 'de' MMM", { locale: ptBR });
  return (
    <div ref={ref} className="flex justify-center my-3">
      <span className="text-[10px] font-medium text-muted-foreground bg-muted/80 px-3 py-0.5 rounded-full shadow-sm">{label}</span>
    </div>
  );
});
DateSeparator.displayName = "DateSeparator";

interface ChatConversationMessagesProps {
  allMessages: WhatsAppMessage[];
  displayedMessages: WhatsAppMessage[];
  hasMore: boolean;
  isLoading: boolean;
  loadingHistory: boolean;
  contactTyping: boolean;
  attendingMode: string | null;
  searchQuery: string;
  showScrollBtn: boolean;
  newMsgCount: number;
  onLoadMore: () => void;
  onScrollToBottom: () => void;
  onReply: (msg: WhatsAppMessage) => void;
  onRetry: (msg: WhatsAppMessage) => void;
  onImageClick: (url: string) => void;
  onForward: (msg: WhatsAppMessage) => void;
  onStar: (msg: WhatsAppMessage) => void;
  onDelete: (msg: WhatsAppMessage, forEveryone: boolean) => void;
  onReact: (msg: WhatsAppMessage, emoji: string) => void;
  onScroll: () => void;
  scrollAreaRef: React.RefObject<HTMLDivElement>;
  bottomRef: React.RefObject<HTMLDivElement>;
}

export function ChatConversationMessages({
  allMessages, displayedMessages, hasMore, isLoading, loadingHistory,
  contactTyping, attendingMode, searchQuery, showScrollBtn, newMsgCount,
  onLoadMore, onScrollToBottom, onReply, onRetry, onImageClick,
  onForward, onStar, onDelete, onReact, onScroll,
  scrollAreaRef, bottomRef,
}: ChatConversationMessagesProps) {
  // Group messages by date + timestamp grouping
  const messagesWithSeparators = useMemo(() => {
    const items: { type: "date" | "message"; date?: Date; message?: WhatsAppMessage; isGrouped?: boolean; hideTimestamp?: boolean }[] = [];
    let lastDate: Date | null = null;

    displayedMessages.forEach((msg, i) => {
      const msgDate = new Date(msg.created_at);
      if (!lastDate || !isSameDay(lastDate, msgDate)) {
        items.push({ type: "date", date: msgDate });
        lastDate = msgDate;
      }
      const prev = displayedMessages[i - 1];
      const next = displayedMessages[i + 1];
      const isGrouped = prev && prev.direction === msg.direction && (msgDate.getTime() - new Date(prev.created_at).getTime()) < 60000;
      const hideTimestamp = next && next.direction === msg.direction && (new Date(next.created_at).getTime() - msgDate.getTime()) < 60000;
      items.push({ type: "message", message: msg, isGrouped, hideTimestamp });
    });

    return items;
  }, [displayedMessages]);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto whatsapp-bg relative" ref={scrollAreaRef} onScroll={onScroll}>
      <div className="px-4 py-3">
        <div className="flex justify-center mb-3 gap-2">
          {hasMore && (
            <Button variant="ghost" size="sm" className="text-[11px] text-muted-foreground rounded-full bg-muted/60 hover:bg-muted" onClick={onLoadMore}>
              Carregar anteriores
            </Button>
          )}
        </div>
        {allMessages.length === 0 && !isLoading && (
          <div className="text-center py-4 mb-2">
            <p className="text-xs text-muted-foreground bg-muted/60 inline-block px-4 py-2 rounded-xl max-w-xs">
              📱 Mensagens aparecerão aqui em tempo real conforme forem enviadas ou recebidas.
            </p>
          </div>
        )}
        {isLoading || loadingHistory ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              {loadingHistory && <span className="text-[11px] text-muted-foreground">Carregando histórico...</span>}
            </div>
          </div>
        ) : allMessages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xs text-muted-foreground bg-muted/60 inline-block px-3 py-1 rounded-full">Nenhuma mensagem ainda. Envie a primeira!</p>
          </div>
        ) : (
          <>
            {messagesWithSeparators.map((item, i) => {
              if (item.type === "date") return <DateSeparator key={`date-${i}`} date={item.date!} />;
              const isHighlighted = searchQuery && item.message?.content?.toLowerCase().includes(searchQuery.toLowerCase());
              return (
                <div key={item.message?.id ?? `msg-${i}`} className={isHighlighted ? "ring-2 ring-primary/50 rounded-xl" : ""}>
                  <ChatMessageBubble
                    message={item.message!}
                    isGrouped={item.isGrouped}
                    hideTimestamp={item.hideTimestamp}
                    onReply={onReply}
                    onRetry={((item.message as Record<string, unknown>)?._pending ? onRetry : undefined)}
                    onImageClick={onImageClick}
                    onForward={onForward}
                    onStar={onStar}
                    onDelete={onDelete}
                    onReact={onReact}
                    allMessages={allMessages}
                  />
                </div>
              );
            })}
            {/* AI typing indicator */}
            {attendingMode === "ai" && allMessages.length > 0 && (() => {
              const lastMsg = allMessages[allMessages.length - 1];
              if (lastMsg.direction !== "inbound") return false;
              return Date.now() - new Date(lastMsg.created_at).getTime() < 30000;
            })() && (
              <div className="flex justify-start mb-2">
                <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-2.5 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5 text-purple-400" />
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Contact typing indicator */}
            {contactTyping && (
              <div className="flex justify-start mb-2">
                <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-2.5 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground font-medium">digitando</span>
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Scroll to bottom button with new message count */}
      {showScrollBtn && (
        <Button
          variant="secondary"
          size="sm"
          className="absolute bottom-4 right-4 rounded-full shadow-lg z-10 bg-card border border-border gap-1.5 px-3 h-9"
          onClick={onScrollToBottom}
        >
          <ArrowDown className="w-4 h-4" />
          {newMsgCount > 0 && (
            <Badge className="h-5 min-w-5 px-1.5 text-[10px] bg-primary text-primary-foreground rounded-full">
              {newMsgCount}
            </Badge>
          )}
        </Button>
      )}
    </div>
  );
}
