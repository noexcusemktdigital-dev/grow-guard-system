import React, { useRef } from "react";
import { Send, Loader2, Paperclip, Smile, Mic, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ChatQuickReplies } from "./ChatQuickReplies";
import type { WhatsAppMessage } from "@/hooks/useWhatsApp";

const EMOJI_CATEGORIES: { label: string; icon: string; emojis: string[] }[] = [
  { label: "Carinhas", icon: "😀", emojis: ["😀","😂","😅","🤣","😊","😍","🥰","😘","😁","😎","🤔","🤗","🤩","😏","😢","😭","😤","🤯","🥳","😴","🙄","😬","🤐","😇","🫡","🥹","😮‍💨","🫠"] },
  { label: "Mãos", icon: "👍", emojis: ["👍","👎","👏","🙌","🤝","✌️","🤞","💪","👋","🙏","👀","👆","👇","👉","👈","✋","🤙","🫶","🫰","✊"] },
  { label: "Símbolos", icon: "❤️", emojis: ["❤️","🔥","✅","⭐","💯","✨","⚡","🚀","🎯","💡","📌","💬","📱","📞","⏰","📅","💰","🏠","🎉","🎊","⚠️","❌","🔗","📎","🏷️","📊","🔔","💎","🌟","♻️"] },
];

interface ChatConversationInputProps {
  text: string;
  setText: (text: string) => void;
  replyingTo: WhatsAppMessage | null;
  setReplyingTo: (msg: WhatsAppMessage | null) => void;
  contactName: string;
  isRecording: boolean;
  recordingTime: number;
  sendingAudio: boolean;
  uploading: boolean;
  sendPending: boolean;
  onSend: () => void;
  onTextChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onStartRecording: () => void;
  onStopRecording: (cancel?: boolean) => void;
  onInsertEmoji: (emoji: string) => void;
  inputRef: React.RefObject<HTMLTextAreaElement>;
}

export function ChatConversationInput({
  text, setText, replyingTo, setReplyingTo, contactName,
  isRecording, recordingTime, sendingAudio, uploading, sendPending,
  onSend, onTextChange, onKeyDown, onFileUpload,
  onStartRecording, onStopRecording, onInsertEmoji, inputRef,
}: ChatConversationInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatRecordingTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <>
      {/* Reply preview */}
      {replyingTo && (
        <div className="px-3 pt-2 pb-0 border-t border-border bg-card/95 shrink-0">
          <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 border-l-4 border-primary">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-primary">
                {replyingTo.direction === "outbound" ? "Você" : contactName}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                {replyingTo.type === "audio" ? "🎤 Áudio" : replyingTo.type === "image" ? "📷 Imagem" : (replyingTo.content || "Mídia")}
              </p>
            </div>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0" onClick={() => setReplyingTo(null)}>
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}

      {/* WhatsApp-style Input */}
      <div className={`px-3 py-2.5 border-t border-border bg-card/95 shrink-0 ${replyingTo ? "border-t-0 pt-1.5" : ""}`}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,audio/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,text/csv,application/zip,application/x-rar-compressed"
          className="hidden"
          onChange={onFileUpload}
        />

        {isRecording ? (
          <div className="flex items-center gap-3">
            <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-full text-destructive hover:bg-destructive/10" onClick={() => onStopRecording(true)} aria-label="Excluir">
              <Trash2 className="w-4 h-4" />
            </Button>
            <div className="flex-1 flex items-center gap-2 bg-muted/50 rounded-2xl px-4 py-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-mono text-foreground">{formatRecordingTime(recordingTime)}</span>
              <span className="text-xs text-muted-foreground">Gravando...</span>
            </div>
            <Button type="button" size="icon" className="rounded-full h-9 w-9 shrink-0 shadow-md bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => onStopRecording(false)} aria-label="Enviar">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); onSend(); }} className="flex items-end gap-2">
            <ChatQuickReplies onSelect={(t) => setText(t)} />

            <Popover>
              <PopoverTrigger asChild>
                <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-full text-muted-foreground" aria-label="Emoji">
                  <Smile className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="start" side="top">
                <Tabs defaultValue="Carinhas" className="w-full">
                  <TabsList className="w-full h-8 rounded-none border-b border-border bg-muted/30">
                    {EMOJI_CATEGORIES.map((cat) => (
                      <TabsTrigger key={cat.label} value={cat.label} className="text-sm px-3 py-1 data-[state=active]:bg-background">{cat.icon}</TabsTrigger>
                    ))}
                  </TabsList>
                  {EMOJI_CATEGORIES.map((cat) => (
                    <TabsContent key={cat.label} value={cat.label} className="p-2 mt-0">
                      <div className="grid grid-cols-8 gap-1 max-h-[200px] overflow-y-auto">
                        {cat.emojis.map((emoji) => (
                          <button key={emoji} type="button" className="h-8 w-8 flex items-center justify-center text-lg hover:bg-muted rounded transition-colors" onClick={() => onInsertEmoji(emoji)}>
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </PopoverContent>
            </Popover>

            <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-full text-muted-foreground" onClick={() => fileInputRef.current?.click()} disabled={uploading} aria-label="Carregando">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
            </Button>
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                placeholder="Digite uma mensagem..."
                className="w-full resize-none rounded-2xl bg-muted/50 border-0 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground min-h-[36px] max-h-[120px]"
                rows={1}
                value={text}
                onChange={onTextChange}
                onKeyDown={onKeyDown}
                disabled={sendPending}
              />
            </div>

            {text.trim() ? (
              <Button type="submit" size="icon" className="rounded-full h-9 w-9 shrink-0 shadow-md bg-emerald-600 hover:bg-emerald-700 text-white" disabled={sendPending} aria-label="Carregando">
                {sendPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            ) : (
              <Button type="button" size="icon" className="rounded-full h-9 w-9 shrink-0 shadow-md bg-emerald-600 hover:bg-emerald-700 text-white" onClick={onStartRecording} disabled={sendingAudio} aria-label="Carregando">
                {sendingAudio ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
              </Button>
            )}
          </form>
        )}
      </div>
    </>
  );
}
