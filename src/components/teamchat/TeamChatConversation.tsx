import { useEffect, useRef, useState } from "react";
import { Send, Paperclip, Image as ImageIcon, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { TeamMessage } from "@/hooks/useTeamChat";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  messages: TeamMessage[];
  isLoading: boolean;
  currentUserId: string;
  onSend: (content: string) => void;
  onSendFile?: (file: File) => void;
  channelName: string;
  channelDescription?: string | null;
  memberCount?: number;
}

function isImageFile(url: string) {
  return /\.(jpe?g|png|gif|webp|svg|bmp)(\?|$)/i.test(url);
}

export function TeamChatConversation({
  messages,
  isLoading,
  currentUserId,
  onSend,
  onSendFile,
  channelName,
  channelDescription,
  memberCount,
}: Props) {
  const [text, setText] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = () => {
    if (pendingFile && onSendFile) {
      onSendFile(pendingFile);
      setPendingFile(null);
      setText("");
      return;
    }
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPendingFile(file);
    }
    e.target.value = "";
  };

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const renderMessageContent = (msg: TeamMessage) => {
    if (msg.type === "image" && msg.file_url) {
      return (
        <div>
          <img src={msg.file_url} alt={msg.file_name || "Imagem"} className="max-w-[280px] max-h-[200px] rounded-md object-cover cursor-pointer" loading="lazy" />
          {msg.content && <p className="mt-1 text-sm">{msg.content}</p>}
        </div>
      );
    }
    if (msg.type === "file" && msg.file_url) {
      return (
        <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-md bg-background/50 hover:bg-background/80 transition-colors">
          <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium truncate">{msg.file_name || "Arquivo"}</span>
        </a>
      );
    }
    return msg.content ? <p className="whitespace-pre-wrap break-words">{msg.content}</p> : null;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b px-4 py-3 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-foreground">{channelName}</h2>
          {channelDescription && (
            <p className="text-xs text-muted-foreground">{channelDescription}</p>
          )}
        </div>
        {memberCount !== undefined && (
          <span className="text-xs text-muted-foreground">{memberCount} membros</span>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">Carregando...</div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            Nenhuma mensagem ainda. Comece a conversa!
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg, idx) => {
              const isMine = msg.sender_id === currentUserId;
              const showAvatar = idx === 0 || messages[idx - 1].sender_id !== msg.sender_id;

              return (
                <div key={msg.id} className={`flex gap-2 ${isMine ? "flex-row-reverse" : ""}`}>
                  {showAvatar ? (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={msg.sender_avatar || undefined} />
                      <AvatarFallback className="text-[10px] bg-muted">
                        {getInitials(msg.sender_name || "U")}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="w-8 flex-shrink-0" />
                  )}

                  <div className={`max-w-[70%] ${isMine ? "items-end" : "items-start"}`}>
                    {showAvatar && (
                      <p className={`text-[11px] font-medium mb-0.5 ${isMine ? "text-right" : ""} text-muted-foreground`}>
                        {isMine ? "Você" : msg.sender_name}
                      </p>
                    )}
                    <div
                      className={`rounded-xl px-3 py-2 text-sm leading-relaxed ${
                        isMine
                          ? "bg-primary text-primary-foreground rounded-tr-sm"
                          : "bg-muted text-foreground rounded-tl-sm"
                      }`}
                    >
                      {renderMessageContent(msg)}
                    </div>
                    <p className={`text-[10px] text-muted-foreground mt-0.5 ${isMine ? "text-right" : ""}`}>
                      {format(new Date(msg.created_at), "HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      {/* Pending file preview */}
      {pendingFile && (
        <div className="border-t px-4 py-2 flex items-center gap-2 bg-muted/30">
          {pendingFile.type.startsWith("image/") ? (
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          ) : (
            <FileText className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-sm text-foreground truncate flex-1">{pendingFile.name}</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setPendingFile(null)}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Input */}
      <div className="border-t px-4 py-3">
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          {onSendFile && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                onChange={handleFileSelect}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
            </>
          )}
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1"
            autoFocus
          />
          <Button type="submit" size="icon" disabled={!text.trim() && !pendingFile}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
