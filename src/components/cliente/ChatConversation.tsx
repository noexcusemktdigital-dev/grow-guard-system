import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Send, Loader2, MessageCircle, Bot, User, UserPlus, ExternalLink,
  ArrowRight, AlertTriangle, RefreshCw, ChevronDown, ChevronUp, Paperclip, Smile,
  ArrowDown, Search, X, Mic, Square, Trash2, ArrowLeft, WifiOff,
} from "lucide-react";
import { ChatQuickReplies } from "./ChatQuickReplies";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ChatMessageBubble } from "./ChatMessageBubble";
import { ImageLightbox } from "./ImageLightbox";
import {
  useSendWhatsAppMessage,
  useUpdateAttendingMode,
  useFindLeadByPhone,
  useLinkContactToCrmLead,
  useUpdateContactAgent,
  useSendTypingIndicator,
  useMarkWhatsAppRead,
  useMarkContactRead,
} from "@/hooks/useWhatsApp";
import { useCrmLeadMutations, useCrmFunnels } from "@/hooks/useClienteCrm";
import type { WhatsAppContact, WhatsAppMessage } from "@/hooks/useWhatsApp";
import { toast } from "@/hooks/use-toast";
import { playSound } from "@/lib/sounds";
import { useNavigate } from "react-router-dom";
import { isToday, isYesterday, format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { useUserOrgId } from "@/hooks/useUserOrgId";

interface Props {
  contact: WhatsAppContact | null;
  messages: WhatsAppMessage[];
  isLoading: boolean;
  agents?: { id: string; name: string }[];
  instanceId?: string | null;
  onBack?: () => void;
}

interface PendingMessage extends WhatsAppMessage {
  _pending: true;
  _retryCount?: number;
}

const DISPLAY_STEP = 100;

const EMOJI_CATEGORIES: { label: string; icon: string; emojis: string[] }[] = [
  { label: "Carinhas", icon: "😀", emojis: ["😀","😂","😅","🤣","😊","😍","🥰","😘","😁","😎","🤔","🤗","🤩","😏","😢","😭","😤","🤯","🥳","😴","🙄","😬","🤐","😇","🫡","🥹","😮‍💨","🫠"] },
  { label: "Mãos", icon: "👍", emojis: ["👍","👎","👏","🙌","🤝","✌️","🤞","💪","👋","🙏","👀","👆","👇","👉","👈","✋","🤙","🫶","🫰","✊"] },
  { label: "Símbolos", icon: "❤️", emojis: ["❤️","🔥","✅","⭐","💯","✨","⚡","🚀","🎯","💡","📌","💬","📱","📞","⏰","📅","💰","🏠","🎉","🎊","⚠️","❌","🔗","📎","🏷️","📊","🔔","💎","🌟","♻️"] },
];

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

export function ChatConversation({ contact, messages, isLoading, agents = [], instanceId, onBack }: Props) {
  const [text, setText] = useState("");
  const [actionsOpen, setActionsOpen] = useState(false);
  const [displayCount, setDisplayCount] = useState(DISPLAY_STEP);
  const [uploading, setUploading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [newMsgCount, setNewMsgCount] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [contactTyping, setContactTyping] = useState(false);
  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([]);

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [sendingAudio, setSendingAudio] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Reply/quote state
  const [replyingTo, setReplyingTo] = useState<WhatsAppMessage | null>(null);

  // Lightbox state
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const queryClient = useQueryClient();
  const { data: orgId } = useUserOrgId();
  const sendMutation = useSendWhatsAppMessage();
  const updateMode = useUpdateAttendingMode();
  const updateAgent = useUpdateContactAgent();
  const linkMutation = useLinkContactToCrmLead();
  const { createLead, updateLead } = useCrmLeadMutations();
  const { data: funnelsData } = useCrmFunnels();
  const sendTyping = useSendTypingIndicator();
  const markWhatsAppRead = useMarkWhatsAppRead();
  const markContactRead = useMarkContactRead();
  const navigate = useNavigate();
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastSeenIdRef = useRef<string | null>(null);
  const isNearBottomRef = useRef(true);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingDismissRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const readSentRef = useRef<string | null>(null);
  const prevMsgCountRef = useRef(0);

  const contactAny = contact as any;
  const attendingMode = contactAny?.attending_mode || null;
  const crmLeadId = contactAny?.crm_lead_id || null;
  const agentId = contactAny?.agent_id || null;

  const { data: matchedLead } = useFindLeadByPhone(contact?.phone ?? null);

  const stages = useMemo(() => {
    if (!funnelsData || funnelsData.length === 0) return [];
    const defaultFunnel = funnelsData.find((f) => f.is_default) || funnelsData[0];
    const dbStages = defaultFunnel.stages as any[];
    if (!Array.isArray(dbStages)) return [];
    return dbStages.map((s: any) => ({
      key: s.key || s.label?.toLowerCase().replace(/\s+/g, "_") || "stage",
      label: s.label || "Etapa",
    }));
  }, [funnelsData]);

  // Reset state when contact changes
  useEffect(() => {
    setDisplayCount(DISPLAY_STEP);
    lastSeenIdRef.current = null;
    isNearBottomRef.current = true;
    setSearchOpen(false);
    setSearchQuery("");
    setReplyingTo(null);
    setContactTyping(false);
    readSentRef.current = null;
    setPendingMessages([]);
    setNewMsgCount(0);
    prevMsgCountRef.current = 0;
    stopRecording(true);
  }, [contact?.id]);

  // Mark as read on WhatsApp when opening a conversation
  useEffect(() => {
    if (!contact?.id || !contact?.phone) return;
    if (readSentRef.current === contact.id) return;
    readSentRef.current = contact.id;
    markContactRead.mutate(contact.id);
    try {
      markWhatsAppRead.mutate(
        { contactId: contact.id, contactPhone: contact.phone },
        { onError: (err) => console.warn("[chat] Mark read error (ignored):", err) }
      );
    } catch (e) {
      console.warn("[chat] Mark read exception (ignored):", e);
    }
  }, [contact?.id]);

  // Subscribe to typing broadcast from webhook
  useEffect(() => {
    if (!orgId || !contact?.phone) return;
    const channel = supabase.channel(`whatsapp-typing-${orgId}`);
    channel.on("broadcast", { event: "typing" }, (payload: any) => {
      const data = payload.payload;
      if (data?.phone === contact.phone) {
        setContactTyping(data.isTyping);
        if (typingDismissRef.current) clearTimeout(typingDismissRef.current);
        if (data.isTyping) {
          typingDismissRef.current = setTimeout(() => setContactTyping(false), 5000);
        }
      }
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
      if (typingDismissRef.current) clearTimeout(typingDismissRef.current);
    };
  }, [orgId, contact?.phone]);

  // Remove pending messages once they appear in the server messages
  useEffect(() => {
    if (pendingMessages.length === 0) return;
    setPendingMessages(prev =>
      prev.filter(pm => !messages.some(m => m.content === pm.content && m.direction === "outbound"))
    );
  }, [messages]);

  // Smart scroll: track if user is near bottom
  const handleScroll = useCallback(() => {
    const el = scrollAreaRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isNearBottomRef.current = distanceFromBottom < 100;
    setShowScrollBtn(distanceFromBottom > 300);
    if (isNearBottomRef.current) setNewMsgCount(0);
  }, []);

  const scrollToBottom = useCallback(() => {
    // Use setTimeout to ensure DOM has rendered
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      isNearBottomRef.current = true;
      setShowScrollBtn(false);
      setNewMsgCount(0);
    }, 50);
  }, []);

  // Auto-scroll only when near bottom + track new msg count
  useEffect(() => {
    if (messages.length === 0) { prevMsgCountRef.current = 0; return; }
    const newCount = messages.length - prevMsgCountRef.current;
    if (prevMsgCountRef.current > 0 && newCount > 0 && !isNearBottomRef.current) {
      setNewMsgCount(prev => prev + newCount);
    }
    if (isNearBottomRef.current) {
      const el = scrollAreaRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }
    prevMsgCountRef.current = messages.length;
  }, [messages.length]);

  // Sound effect on new inbound message
  useEffect(() => {
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.direction === "inbound" && lastSeenIdRef.current && lastMsg.id !== lastSeenIdRef.current) {
      if (document.hidden || !isNearBottomRef.current) {
        playSound("notification");
      }
    }
    lastSeenIdRef.current = lastMsg.id;
  }, [messages]);

  // Auto-resize textarea + debounced typing indicator
  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
    if (contact?.phone && e.target.value.trim()) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        sendTyping.mutate(contact.phone);
      }, 1500);
    }
  }, [contact?.phone, sendTyping]);

  // === Audio Recording ===
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4" });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch {
      toast({ title: "Microfone não disponível", description: "Permita o acesso ao microfone.", variant: "destructive" });
    }
  };

  const stopRecording = (cancel = false) => {
    if (recordingTimerRef.current) { clearInterval(recordingTimerRef.current); recordingTimerRef.current = null; }
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") { setIsRecording(false); return; }
    if (cancel) {
      recorder.stop();
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      mediaRecorderRef.current = null;
      audioChunksRef.current = [];
      setIsRecording(false);
      setRecordingTime(0);
      return;
    }
    recorder.onstop = async () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      const mimeType = recorder.mimeType || "audio/webm";
      const blob = new Blob(audioChunksRef.current, { type: mimeType });
      audioChunksRef.current = [];
      mediaRecorderRef.current = null;
      if (blob.size < 500 || !contact) { setIsRecording(false); setRecordingTime(0); return; }
      setSendingAudio(true);
      try {
        const ext = mimeType.includes("mp4") ? "mp4" : "webm";
        const path = `${contact.organization_id}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("chat-media").upload(path, blob, { contentType: mimeType });
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage.from("chat-media").getPublicUrl(path);
        sendMutation.mutate(
          { contactId: contact.id, contactPhone: contact.phone, message: "", mediaUrl: urlData.publicUrl, type: "audio" },
          {
            onSuccess: () => { isNearBottomRef.current = true; },
            onError: (err: any) => toast({ title: "Erro ao enviar áudio", description: err.message, variant: "destructive" }),
          }
        );
      } catch (err: any) {
        toast({ title: "Erro no upload do áudio", description: err.message, variant: "destructive" });
      } finally {
        setSendingAudio(false);
      }
      setIsRecording(false);
      setRecordingTime(0);
    };
    recorder.stop();
  };

  const formatRecordingTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  // === Send with optimistic UI ===
  const handleSend = () => {
    if (!text.trim() || !contact) return;
    const msgText = text.trim();
    const quotedMessageId = replyingTo?.message_id_zapi || undefined;

    // Create optimistic message
    const tempId = `pending-${Date.now()}`;
    const optimisticMsg: PendingMessage = {
      id: tempId,
      organization_id: contact.organization_id,
      contact_id: contact.id,
      message_id_zapi: null,
      direction: "outbound",
      type: "text",
      content: msgText,
      media_url: null,
      status: "sending",
      metadata: quotedMessageId ? { quotedMessageId } : {},
      created_at: new Date().toISOString(),
      _pending: true,
    };

    setPendingMessages(prev => [...prev, optimisticMsg]);
    setText("");
    setReplyingTo(null);
    isNearBottomRef.current = true;
    if (inputRef.current) inputRef.current.style.height = "auto";

    // Scroll immediately
    setTimeout(() => {
      const el = scrollAreaRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }, 50);

    sendMutation.mutate(
      { contactId: contact.id, contactPhone: contact.phone, message: msgText, quotedMessageId },
      {
        onSuccess: () => {
          // Remove from pending (will be replaced by real message via Realtime)
          setPendingMessages(prev => prev.filter(m => m.id !== tempId));
        },
        onError: (err: any) => {
          // Mark as failed
          setPendingMessages(prev =>
            prev.map(m => m.id === tempId ? { ...m, status: "failed" } : m)
          );
          toast({ title: "Erro ao enviar", description: err.message, variant: "destructive" });
        },
      }
    );
  };

  // Retry failed message
  const handleRetry = useCallback((msg: WhatsAppMessage) => {
    if (!contact || !msg.content) return;
    const pendingMsg = msg as PendingMessage;

    // Mark as sending again
    setPendingMessages(prev =>
      prev.map(m => m.id === msg.id ? { ...m, status: "sending", _retryCount: (pendingMsg._retryCount || 0) + 1 } : m)
    );

    sendMutation.mutate(
      { contactId: contact.id, contactPhone: contact.phone, message: msg.content },
      {
        onSuccess: () => {
          setPendingMessages(prev => prev.filter(m => m.id !== msg.id));
        },
        onError: () => {
          setPendingMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: "failed" } : m));
        },
      }
    );
  }, [contact, sendMutation]);

  // Auto-retry failed messages once after 5s
  useEffect(() => {
    const failedMsgs = pendingMessages.filter(m => m.status === "failed" && (!m._retryCount || m._retryCount < 1));
    if (failedMsgs.length === 0) return;
    const timer = setTimeout(() => {
      failedMsgs.forEach(m => handleRetry(m));
    }, 5000);
    return () => clearTimeout(timer);
  }, [pendingMessages, handleRetry]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !contact) return;
    e.target.value = "";
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "Máximo 10MB", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const ext = (file.name.split(".").pop() || "bin").toLowerCase();
      const path = `${contact.organization_id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("chat-media").upload(path, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("chat-media").getPublicUrl(path);
      const imageExts = ["jpg","jpeg","png","gif","webp","bmp","svg"];
      const videoExts = ["mp4","avi","mov","mkv","webm"];
      const audioExts = ["mp3","ogg","m4a","wav","aac","wma"];
      const docExts = ["pdf","doc","docx","xls","xlsx","ppt","pptx","txt","csv","zip","rar"];
      let fileType = "image";
      if (docExts.includes(ext)) fileType = "document";
      else if (videoExts.includes(ext)) fileType = "video";
      else if (audioExts.includes(ext)) fileType = "audio";
      else if (imageExts.includes(ext)) fileType = "image";
      sendMutation.mutate(
        { contactId: contact.id, contactPhone: contact.phone, message: "", mediaUrl: urlData.publicUrl, type: fileType },
        {
          onSuccess: () => { isNearBottomRef.current = true; },
          onError: (err: any) => toast({ title: "Erro ao enviar mídia", description: err.message, variant: "destructive" }),
        }
      );
    } catch (err: any) {
      toast({ title: "Erro no upload", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleToggleMode = () => {
    if (!contact) return;
    const newMode = attendingMode === "ai" ? "human" : "ai";
    updateMode.mutate(
      { contactId: contact.id, mode: newMode },
      { onSuccess: () => toast({ title: newMode === "human" ? "Você assumiu o atendimento" : "IA reativada para este contato" }) }
    );
  };

  const handleCreateLead = async () => {
    if (!contact) return;
    try {
      const defaultFunnel = funnelsData?.find(f => f.is_default) || funnelsData?.[0];
      const dbStages = defaultFunnel?.stages as any[] | undefined;
      const firstStage = Array.isArray(dbStages) && dbStages.length > 0 ? (dbStages[0].key || "novo") : "novo";
      const lead = await createLead.mutateAsync({
        name: contact.name || contact.phone, phone: contact.phone, source: "whatsapp", tags: ["whatsapp"],
        funnel_id: defaultFunnel?.id, stage: firstStage,
      });
      if (lead?.id) {
        await linkMutation.mutateAsync({ contactId: contact.id, leadId: lead.id });
        toast({ title: "Lead criado e vinculado!" });
      }
    } catch (err: any) {
      toast({ title: "Erro ao criar lead", description: err.message, variant: "destructive" });
    }
  };

  const handleChangeAgent = (newAgentId: string) => {
    if (!contact) return;
    updateAgent.mutate({ contactId: contact.id, agentId: newAgentId }, { onSuccess: () => toast({ title: "Agente alterado" }) });
  };

  const handleChangeStage = (newStage: string) => {
    if (!linkedLead) return;
    updateLead.mutate(
      { id: linkedLead.id, stage: newStage },
      { onSuccess: () => toast({ title: `Etapa alterada para "${stages.find(s => s.key === newStage)?.label || newStage}"` }) }
    );
  };

  useEffect(() => {
    if (matchedLead && contact && !crmLeadId && !linkMutation.isPending) {
      linkMutation.mutate({ contactId: contact.id, leadId: matchedLead.id });
    }
  }, [matchedLead?.id, contact?.id, crmLeadId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleInsertEmoji = (emoji: string) => {
    setText(prev => prev + emoji);
    inputRef.current?.focus();
  };

  const handleReply = useCallback((message: WhatsAppMessage) => {
    setReplyingTo(message);
    inputRef.current?.focus();
  }, []);

  // Lightbox: collect all images in conversation
  const allImageUrls = useMemo(() => {
    return messages.filter(m => m.media_url && (m.type === "image" || /\.(jpe?g|png|gif|webp)(\?|$)/i.test(m.media_url))).map(m => m.media_url!);
  }, [messages]);

  const handleImageClick = useCallback((url: string) => {
    const idx = allImageUrls.indexOf(url);
    setLightboxImages(allImageUrls);
    setLightboxIndex(idx >= 0 ? idx : 0);
  }, [allImageUrls]);

  const linkedLead = crmLeadId ? matchedLead : null;
  const isHandoffAlert = attendingMode === "human" && (contact?.unread_count ?? 0) > 0;

  // Combine real messages + pending messages
  const allMessages = useMemo(() => {
    return [...messages, ...pendingMessages];
  }, [messages, pendingMessages]);

  // Paginated messages
  const displayedMessages = useMemo(() => {
    if (allMessages.length <= displayCount) return allMessages;
    return allMessages.slice(allMessages.length - displayCount);
  }, [allMessages, displayCount]);

  const hasMore = allMessages.length > displayCount;

  // Search filtering
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    return displayedMessages.filter(m => m.content?.toLowerCase().includes(q));
  }, [displayedMessages, searchQuery]);

  // Group messages by date + timestamp grouping (hide timestamp for consecutive same-direction within 1 min)
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
      // Hide timestamp if next message is from same direction within 1 min
      const hideTimestamp = next && next.direction === msg.direction && (new Date(next.created_at).getTime() - msgDate.getTime()) < 60000;
      items.push({ type: "message", message: msg, isGrouped, hideTimestamp });
    });

    return items;
  }, [displayedMessages]);

  if (!contact) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6 whatsapp-bg">
        <div className="w-20 h-20 rounded-full bg-muted/20 flex items-center justify-center mb-5">
          <MessageCircle className="w-10 h-10 text-muted-foreground/20" />
        </div>
        <p className="text-base font-semibold text-foreground/80">Conversas WhatsApp</p>
        <p className="text-xs text-muted-foreground mt-2 max-w-sm">
          Selecione uma conversa à esquerda para visualizar e responder mensagens em tempo real
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* WhatsApp-style Header */}
      <div className="flex items-center gap-2 px-3 md:px-4 py-3 wa-header shrink-0">
        {onBack && (
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-white hover:bg-white/10 md:hidden shrink-0" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
        )}
        <Avatar className="h-10 w-10 border-2 border-white/20">
          <AvatarImage src={contact.photo_url || undefined} />
          <AvatarFallback className="bg-white/20 text-white text-xs font-semibold">
            {(contact.name || contact.phone).substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate text-white">{contact.name || contact.phone}</p>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-white/70">{contact.phone}</span>
            {contactTyping && <span className="text-[11px] text-emerald-300 animate-pulse">digitando...</span>}
            {linkedLead && <Badge className="text-[8px] px-1.5 py-0 bg-emerald-600/80 text-white border-0">{linkedLead.stage}</Badge>}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-full text-white hover:bg-white/10" onClick={() => { setSearchOpen(!searchOpen); setSearchQuery(""); }}>
            <Search className="w-3.5 h-3.5" />
          </Button>
          {attendingMode && (
            <Badge variant="outline" className={`text-[10px] gap-1 rounded-full border-white/30 ${attendingMode === "ai" ? "text-purple-200" : "text-emerald-200"}`}>
              {attendingMode === "ai" ? <><Bot className="w-3 h-3" /> IA</> : <><User className="w-3 h-3" /> Humano</>}
            </Badge>
          )}
          {attendingMode && (
            <Button variant="ghost" size="sm" className={`h-7 text-[11px] gap-1 rounded-full text-white hover:bg-white/10 ${attendingMode !== "ai" ? "border border-white/30" : ""}`} onClick={handleToggleMode} disabled={updateMode.isPending}>
              {attendingMode === "ai" ? <><User className="w-3 h-3" /> Assumir</> : <><RefreshCw className="w-3 h-3" /> IA</>}
            </Button>
          )}
          {!linkedLead && (
            <Button size="sm" className="h-7 text-[11px] gap-1 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-md" onClick={handleCreateLead} disabled={createLead.isPending || linkMutation.isPending}>
              <UserPlus className="w-3 h-3" /> Criar Lead
            </Button>
          )}
          <Collapsible open={actionsOpen} onOpenChange={setActionsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-full text-white hover:bg-white/10">
                {actionsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </div>
      </div>

      {/* Search bar */}
      {searchOpen && (
        <div className="px-4 py-2 border-b border-border bg-muted/30 flex items-center gap-2">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <Input autoFocus placeholder="Buscar na conversa..." className="h-7 text-xs border-0 bg-transparent focus-visible:ring-0" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          {searchResults && <span className="text-[10px] text-muted-foreground whitespace-nowrap">{searchResults.length} resultado{searchResults.length !== 1 ? "s" : ""}</span>}
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { setSearchOpen(false); setSearchQuery(""); }}>
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}

      {/* Collapsible Actions Panel */}
      <Collapsible open={actionsOpen} onOpenChange={setActionsOpen}>
        <CollapsibleContent>
          <div className="px-4 py-2.5 border-b border-border bg-muted/30 space-y-2">
            {isHandoffAlert && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <p className="text-[11px] font-medium">IA solicitou transbordo — atendimento humano necessário</p>
              </div>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              {linkedLead ? (
                <Card className="flex-1 min-w-[200px] border-border/50">
                  <CardContent className="p-2 flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold truncate">{linkedLead.name}</p>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[8px] px-1 py-0">{linkedLead.stage}</Badge>
                        {linkedLead.value != null && <span className="text-[10px] font-medium text-primary">R$ {Number(linkedLead.value).toLocaleString()}</span>}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => navigate("/cliente/crm")}>
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1 rounded-full" onClick={handleCreateLead} disabled={createLead.isPending || linkMutation.isPending}>
                  <UserPlus className="w-3 h-3" /> Criar Lead
                </Button>
              )}
              {linkedLead && stages.length > 0 && (
                <Select value={linkedLead.stage} onValueChange={handleChangeStage}>
                  <SelectTrigger className="h-7 text-[10px] w-32 rounded-full"><ArrowRight className="w-3 h-3 mr-1" /><SelectValue placeholder="Etapa" /></SelectTrigger>
                  <SelectContent>{stages.map((s) => <SelectItem key={s.key} value={s.key} className="text-xs">{s.label}</SelectItem>)}</SelectContent>
                </Select>
              )}
              {agents.length > 0 && (
                <Select value={agentId || ""} onValueChange={handleChangeAgent}>
                  <SelectTrigger className="h-7 text-[10px] w-32 rounded-full"><Bot className="w-3 h-3 mr-1" /><SelectValue placeholder="Agente" /></SelectTrigger>
                  <SelectContent>{agents.map((a) => <SelectItem key={a.id} value={a.id} className="text-xs">{a.name}</SelectItem>)}</SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Messages area with WhatsApp background */}
      <div className="flex-1 min-h-0 overflow-y-auto whatsapp-bg relative" ref={scrollAreaRef} onScroll={handleScroll}>
        <div className="px-4 py-3">
          <div className="flex justify-center mb-3 gap-2">
            {hasMore && (
              <Button variant="ghost" size="sm" className="text-[11px] text-muted-foreground rounded-full bg-muted/60 hover:bg-muted" onClick={() => setDisplayCount((c) => c + DISPLAY_STEP)}>
                Carregar anteriores
              </Button>
            )}
          </div>
          {contact && allMessages.length === 0 && !isLoading && (
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
                  <div key={item.message!.id} className={isHighlighted ? "ring-2 ring-primary/50 rounded-xl" : ""}>
                    <ChatMessageBubble
                      message={item.message!}
                      isGrouped={item.isGrouped}
                      hideTimestamp={item.hideTimestamp}
                      onReply={handleReply}
                      onRetry={(item.message as any)?._pending ? handleRetry : undefined}
                      onImageClick={handleImageClick}
                      allMessages={allMessages}
                    />
                  </div>
                );
              })}
              {/* AI typing indicator */}
              {attendingMode === "ai" && messages.length > 0 && (() => {
                const lastMsg = messages[messages.length - 1];
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
            onClick={scrollToBottom}
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

      {/* Reply preview */}
      {replyingTo && (
        <div className="px-3 pt-2 pb-0 border-t border-border bg-card/95 shrink-0">
          <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 border-l-4 border-primary">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-primary">
                {replyingTo.direction === "outbound" ? "Você" : (contact?.name || contact?.phone || "Contato")}
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
          onChange={handleFileUpload}
        />

        {isRecording ? (
          <div className="flex items-center gap-3">
            <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-full text-destructive hover:bg-destructive/10" onClick={() => stopRecording(true)}>
              <Trash2 className="w-4 h-4" />
            </Button>
            <div className="flex-1 flex items-center gap-2 bg-muted/50 rounded-2xl px-4 py-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-mono text-foreground">{formatRecordingTime(recordingTime)}</span>
              <span className="text-xs text-muted-foreground">Gravando...</span>
            </div>
            <Button type="button" size="icon" className="rounded-full h-9 w-9 shrink-0 shadow-md bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => stopRecording(false)}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-end gap-2">
            <ChatQuickReplies onSelect={(t) => setText(t)} />

            <Popover>
              <PopoverTrigger asChild>
                <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-full text-muted-foreground">
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
                          <button key={emoji} type="button" className="h-8 w-8 flex items-center justify-center text-lg hover:bg-muted rounded transition-colors" onClick={() => handleInsertEmoji(emoji)}>
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </PopoverContent>
            </Popover>

            <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-full text-muted-foreground" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
            </Button>
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                placeholder="Digite uma mensagem..."
                className="w-full resize-none rounded-2xl bg-muted/50 border-0 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground min-h-[36px] max-h-[120px]"
                rows={1}
                value={text}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                disabled={sendMutation.isPending}
              />
            </div>

            {text.trim() ? (
              <Button type="submit" size="icon" className="rounded-full h-9 w-9 shrink-0 shadow-md bg-emerald-600 hover:bg-emerald-700 text-white" disabled={sendMutation.isPending}>
                {sendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            ) : (
              <Button type="button" size="icon" className="rounded-full h-9 w-9 shrink-0 shadow-md bg-emerald-600 hover:bg-emerald-700 text-white" onClick={startRecording} disabled={sendingAudio}>
                {sendingAudio ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
              </Button>
            )}
          </form>
        )}
      </div>

      {/* Image Lightbox */}
      {lightboxImages.length > 0 && (
        <ImageLightbox
          images={lightboxImages}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxImages([])}
          onNavigate={setLightboxIndex}
        />
      )}
    </div>
  );
}
