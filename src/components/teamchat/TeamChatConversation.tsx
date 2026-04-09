// @ts-nocheck
import { useEffect, useRef, useState, useCallback } from "react";
import { Send, Paperclip, Image as ImageIcon, FileText, X, Reply, Smile, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { TeamMessage, TeamReaction, ChannelMembership, TeamMember } from "@/hooks/useTeamChat";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TeamChatReactions } from "./TeamChatReactions";
import { TeamChatEmojiPicker } from "./TeamChatEmojiPicker";
import { TeamChatMentionPicker, renderWithMentions } from "./TeamChatMentionPicker";

interface Props {
  messages: TeamMessage[];
  isLoading: boolean;
  currentUserId: string;
  onSend: (content: string, replyToId?: string) => void;
  onSendFile?: (file: File, caption?: string) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onTyping?: () => void;
  channelName: string;
  channelDescription?: string | null;
  memberCount?: number;
  reactions?: TeamReaction[];
  channelMemberships?: ChannelMembership[];
  members?: TeamMember[];
  typingUsers?: string[];
}

export function TeamChatConversation({
  messages,
  isLoading,
  currentUserId,
  onSend,
  onSendFile,
  onReact,
  onTyping,
  channelName,
  channelDescription,
  memberCount,
  reactions = [],
  channelMemberships = [],
  members = [],
  typingUsers = [],
}: Props) {
  const [text, setText] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<TeamMessage | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mention state
  const [mentionActive, setMentionActive] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionStart, setMentionStart] = useState<number>(0);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [mentionPos, setMentionPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Auto-resize textarea
  const adjustTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, []);

  useEffect(() => {
    adjustTextarea();
  }, [text, adjustTextarea]);

  const handleSend = () => {
    if (pendingFile && onSendFile) {
      onSendFile(pendingFile, text.trim() || undefined);
      setPendingFile(null);
      setPendingPreview(null);
      setText("");
      setReplyingTo(null);
      return;
    }
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed, replyingTo?.id);
    setText("");
    setReplyingTo(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPendingFile(file);
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (ev) => setPendingPreview(ev.target?.result as string);
        reader.readAsDataURL(file);
      } else {
        setPendingPreview(null);
      }
    }
    e.target.value = "";
  };

  const handleTextChange = (value: string) => {
    setText(value);
    if (onTyping) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      onTyping();
      typingTimeoutRef.current = setTimeout(() => {}, 3000);
    }

    // Detect @mention
    const cursorPos = textareaRef.current?.selectionStart ?? value.length;
    const textBeforeCursor = value.slice(0, cursorPos);
    const atMatch = textBeforeCursor.match(/@(\w*)$/);
    if (atMatch) {
      setMentionActive(true);
      setMentionQuery(atMatch[1]);
      setMentionStart(cursorPos - atMatch[0].length);
      setMentionPos({ top: 8, left: 60 });
    } else {
      setMentionActive(false);
    }
  };

  // Filter to only show members that belong to this channel
  const channelMemberIds = new Set(channelMemberships.map((cm) => cm.user_id));
  const filteredMentionMembers = members.filter((m) =>
    m.user_id !== currentUserId &&
    channelMemberIds.has(m.user_id) &&
    m.full_name.toLowerCase().includes(mentionQuery.toLowerCase())
  ).slice(0, 6);

  const handleMentionSelect = (member: TeamMember) => {
    const before = text.slice(0, mentionStart);
    const after = text.slice(textareaRef.current?.selectionStart ?? text.length);
    const newText = `${before}@[${member.full_name}] ${after}`;
    setText(newText);
    setMentionActive(false);
    setMentionQuery("");
    setTimeout(() => {
      const newPos = before.length + `@[${member.full_name}] `.length;
      textareaRef.current?.setSelectionRange(newPos, newPos);
      textareaRef.current?.focus();
    }, 0);
  };

  const handleEmojiSelect = (emoji: string) => {
    setText((prev) => prev + emoji);
    textareaRef.current?.focus();
  };

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  // Read receipts: who has read a given message
  const getReadBy = (msg: TeamMessage) => {
    if (msg.sender_id !== currentUserId) return null;
    const otherMembers = channelMemberships.filter((m) => m.user_id !== currentUserId);
    const readMembers = otherMembers.filter(
      (m) => m.last_read_at && new Date(m.last_read_at) >= new Date(msg.created_at)
    );
    const allRead = readMembers.length === otherMembers.length && otherMembers.length > 0;
    const readNames = readMembers
      .map((rm) => members.find((m) => m.user_id === rm.user_id)?.full_name || "")
      .filter(Boolean);
    return { allRead, readNames, totalOthers: otherMembers.length };
  };

  // Find replied message
  const findReplyMessage = (replyToId: string | null) => {
    if (!replyToId) return null;
    return messages.find((m) => m.id === replyToId) || null;
  };

  // Group reactions by emoji for a message
  const getMessageReactions = (messageId: string) => {
    const msgReactions = reactions.filter((r) => r.message_id === messageId);
    const grouped: Record<string, { emoji: string; userIds: string[]; count: number }> = {};
    for (const r of msgReactions) {
      if (!grouped[r.emoji]) grouped[r.emoji] = { emoji: r.emoji, userIds: [], count: 0 };
      grouped[r.emoji].userIds.push(r.user_id);
      grouped[r.emoji].count++;
    }
    return Object.values(grouped);
  };

  const renderMessageContent = (msg: TeamMessage) => {
    if (msg.type === "image" && msg.file_url) {
      return (
        <div>
          <img src={msg.file_url} alt={msg.file_name || "Imagem"} className="max-w-[280px] max-h-[200px] rounded-md object-cover cursor-pointer" loading="lazy" />
          {msg.content && <p className="mt-1 text-sm">{renderWithMentions(msg.content)}</p>}
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
    return msg.content ? <p className="whitespace-pre-wrap break-words">{renderWithMentions(msg.content)}</p> : null;
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
              const repliedMsg = findReplyMessage(msg.reply_to_id);
              const msgReactions = getMessageReactions(msg.id);
              const readInfo = getReadBy(msg);

              return (
                <div key={msg.id} className={`group flex gap-2 ${isMine ? "flex-row-reverse" : ""}`}>
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

                    {/* Reply preview inside bubble */}
                    {repliedMsg && (
                      <div className={`text-[11px] px-2 py-1 mb-0.5 rounded-md border-l-2 border-primary/50 bg-muted/50 text-muted-foreground ${isMine ? "ml-auto" : ""}`} style={{ maxWidth: "100%" }}>
                        <span className="font-medium text-primary/80">{repliedMsg.sender_name}</span>
                        <p className="truncate">{repliedMsg.content || (repliedMsg.file_name ? `📎 ${repliedMsg.file_name}` : "Mídia")}</p>
                      </div>
                    )}

                    <div className="relative">
                      <div
                        className={`rounded-xl px-3 py-2 text-sm leading-relaxed ${
                          isMine
                            ? "bg-primary text-primary-foreground rounded-tr-sm"
                            : "bg-muted text-foreground rounded-tl-sm"
                        }`}
                      >
                        {renderMessageContent(msg)}
                      </div>

                      {/* Hover actions */}
                      <div className={`absolute top-0 ${isMine ? "left-0 -translate-x-full" : "right-0 translate-x-full"} opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 px-1`}>
                        <button
                          onClick={() => { setReplyingTo(msg); textareaRef.current?.focus(); }}
                          className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                          title="Responder"
                        >
                          <Reply className="h-3 w-3 text-muted-foreground" />
                        </button>
                        {onReact && (
                          <TeamChatEmojiPicker
                            onSelect={(emoji) => onReact(msg.id, emoji)}
                            trigger={
                              <button className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-muted transition-colors" title="Reagir">
                                <Smile className="h-3 w-3 text-muted-foreground" />
                              </button>
                            }
                          />
                        )}
                      </div>
                    </div>

                    {/* Reactions */}
                    {msgReactions.length > 0 && (
                      <TeamChatReactions
                        reactions={msgReactions}
                        currentUserId={currentUserId}
                        members={members}
                        onToggle={(emoji) => onReact?.(msg.id, emoji)}
                      />
                    )}

                    {/* Timestamp + Read receipts */}
                    <div className={`flex items-center gap-1 mt-0.5 ${isMine ? "justify-end" : ""}`}>
                      <p className="text-[10px] text-muted-foreground">
                        {format(new Date(msg.created_at), "HH:mm", { locale: ptBR })}
                      </p>
                      {isMine && readInfo && (
                        <span title={readInfo.allRead ? "Visto por todos" : readInfo.readNames.length > 0 ? `Visto por ${readInfo.readNames.join(", ")}` : "Enviado"}>
                          {readInfo.allRead ? (
                            <CheckCheck className="h-3 w-3 text-blue-500" />
                          ) : readInfo.readNames.length > 0 ? (
                            <CheckCheck className="h-3 w-3 text-muted-foreground" />
                          ) : (
                            <Check className="h-3 w-3 text-muted-foreground" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div className="px-4 py-1 text-xs text-muted-foreground animate-pulse">
          {typingUsers.length === 1
            ? `${typingUsers[0]} está digitando...`
            : `${typingUsers.join(", ")} estão digitando...`}
        </div>
      )}

      {/* Reply preview */}
      {replyingTo && (
        <div className="border-t px-4 py-2 flex items-center gap-2 bg-muted/30">
          <Reply className="h-4 w-4 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium text-primary">{replyingTo.sender_name}</p>
            <p className="text-xs text-muted-foreground truncate">{replyingTo.content || "Mídia"}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setReplyingTo(null)} aria-label="Cancelar resposta">
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Pending file preview */}
      {pendingFile && (
        <div className="border-t px-4 py-2 flex items-center gap-3 bg-muted/30">
          {pendingPreview ? (
            <img src={pendingPreview} alt="Preview" className="h-16 w-16 object-cover rounded-md" />
          ) : (
            <div className="h-12 w-12 flex items-center justify-center bg-muted rounded-md">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground truncate">{pendingFile.name}</p>
            <p className="text-[10px] text-muted-foreground">{(pendingFile.size / 1024).toFixed(0)} KB</p>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => { setPendingFile(null); setPendingPreview(null); }} aria-label="Remover arquivo">
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Input */}
      <div className="border-t px-4 py-3 relative">
        {/* Mention picker */}
        <TeamChatMentionPicker
          members={members.filter((m) => m.user_id !== currentUserId)}
          query={mentionQuery}
          onSelect={handleMentionSelect}
          position={mentionPos}
          visible={mentionActive && filteredMentionMembers.length > 0}
        />

        <form
          className="flex items-end gap-2"
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
                className="shrink-0 mb-0.5"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Anexar"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
            </>
          )}

          <TeamChatEmojiPicker
            onSelect={handleEmojiSelect}
            trigger={
              <Button type="button" variant="ghost" size="icon" className="shrink-0 mb-0.5" aria-label="Emoji">
                <Smile className="h-4 w-4" />
              </Button>
            }
          />

          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            onKeyDown={(e) => {
              if (mentionActive && filteredMentionMembers.length > 0) {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setMentionIndex((i) => Math.min(i + 1, filteredMentionMembers.length - 1));
                  return;
                }
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setMentionIndex((i) => Math.max(i - 1, 0));
                  return;
                }
                if (e.key === "Enter" || e.key === "Tab") {
                  e.preventDefault();
                  handleMentionSelect(filteredMentionMembers[mentionIndex]);
                  return;
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  setMentionActive(false);
                  return;
                }
              }
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={pendingFile ? "Adicione uma legenda..." : "Digite sua mensagem... Use @ para mencionar"}
            className="flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[40px] max-h-[120px]"
            rows={1}
            autoFocus
          />

          <Button type="submit" size="icon" disabled={!text.trim() && !pendingFile} className="shrink-0 mb-0.5" aria-label="Enviar">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
