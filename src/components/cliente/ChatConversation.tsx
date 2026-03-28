import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { MessageCircle } from "lucide-react";
import { ChatForwardDialog } from "./ChatForwardDialog";
import { ImageLightbox } from "./ImageLightbox";
import { ChatConversationHeader } from "./ChatConversationHeader";
import { ChatConversationMessages } from "./ChatConversationMessages";
import { ChatConversationInput } from "./ChatConversationInput";
import {
  useSendWhatsAppMessage,
  useUpdateAttendingMode,
  useFindLeadByPhone,
  useLinkContactToCrmLead,
  useUpdateContactAgent,
  useSendTypingIndicator,
  useMarkWhatsAppRead,
  useMarkContactRead,
  useStarMessage,
  useDeleteMessage,
  useWhatsAppContacts,
} from "@/hooks/useWhatsApp";
import { useCrmLeadMutations, useCrmFunnels } from "@/hooks/useClienteCrm";
import type { WhatsAppContact, WhatsAppMessage } from "@/hooks/useWhatsApp";
import { toast } from "@/hooks/use-toast";
import { playSound } from "@/lib/sounds";
import { useNavigate } from "react-router-dom";
// date-fns no longer needed in parent (moved to ChatConversationMessages)
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
  const [forwardMsg, setForwardMsg] = useState<WhatsAppMessage | null>(null);
  const [showStarred, setShowStarred] = useState(false);

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
  const starMessage = useStarMessage();
  const deleteMessage = useDeleteMessage();
  const { data: allContacts } = useWhatsAppContacts();
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

  const contactAny = contact as Record<string, unknown>;
  const attendingMode = contactAny?.attending_mode || null;
  const crmLeadId = contactAny?.crm_lead_id || null;
  const agentId = contactAny?.agent_id || null;

  const { data: matchedLead } = useFindLeadByPhone(contact?.phone ?? null);

  const stages = useMemo(() => {
    if (!funnelsData || funnelsData.length === 0) return [];
    const defaultFunnel = funnelsData.find((f) => f.is_default) || funnelsData[0];
    const dbStages = defaultFunnel.stages as Array<{ key?: string; label?: string; color?: string; icon?: string }>;
    if (!Array.isArray(dbStages)) return [];
    return dbStages.map((s: { key?: string; label?: string; color?: string; icon?: string }) => ({
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
        { onError: () => { /* mark read error ignored */ } }
      );
    } catch (e) {
      // Mark read exception ignored
    }
  }, [contact?.id]);

  // Subscribe to typing broadcast from webhook
  useEffect(() => {
    if (!orgId || !contact?.phone) return;
    const channel = supabase.channel(`whatsapp-typing-${orgId}`);
    channel.on("broadcast", { event: "typing" }, (payload: { payload: Record<string, unknown> }) => {
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
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "auto" }), 30);
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
      if (blob.size < 100 || !contact) { setIsRecording(false); setRecordingTime(0); toast({ title: "Áudio muito curto", description: "Grave por mais tempo.", variant: "destructive" }); return; }
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
            onError: (err: unknown) => toast({ title: "Erro ao enviar áudio", description: err instanceof Error ? err.message : String(err), variant: "destructive" }),
          }
        );
      } catch (err: unknown) {
        toast({ title: "Erro no upload do áudio", description: err.message, variant: "destructive" });
      } finally {
        setSendingAudio(false);
      }
      setIsRecording(false);
      setRecordingTime(0);
    };
    recorder.stop();
  };

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
        onError: (err: unknown) => {
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
          onError: (err: unknown) => toast({ title: "Erro ao enviar mídia", description: err instanceof Error ? err.message : String(err), variant: "destructive" }),
        }
      );
    } catch (err: unknown) {
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
      const dbStages = defaultFunnel?.stages as Array<{ key?: string; label?: string }> | undefined;
      const firstStage = Array.isArray(dbStages) && dbStages.length > 0 ? (dbStages[0].key || "novo") : "novo";
      const lead = await createLead.mutateAsync({
        name: contact.name || contact.phone, phone: contact.phone, source: "whatsapp", tags: ["whatsapp"],
        funnel_id: defaultFunnel?.id, stage: firstStage,
      });
      if (lead?.id) {
        await linkMutation.mutateAsync({ contactId: contact.id, leadId: lead.id });
        toast({ title: "Lead criado e vinculado!" });
      }
    } catch (err: unknown) {
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

  const handleForward = useCallback((message: WhatsAppMessage) => {
    setForwardMsg(message);
  }, []);

  const handleStar = useCallback((message: WhatsAppMessage) => {
    const currentlyStarred = !!((message as Record<string, unknown>).is_starred);
    starMessage.mutate(
      { messageId: message.id, starred: !currentlyStarred },
      { onSuccess: () => toast({ title: currentlyStarred ? "Estrela removida" : "Mensagem marcada ⭐" }) }
    );
  }, [starMessage]);

  const handleDelete = useCallback((message: WhatsAppMessage, forEveryone: boolean) => {
    deleteMessage.mutate(
      { messageId: message.id, forEveryone },
      { onSuccess: () => toast({ title: "Mensagem apagada" }) }
    );
  }, [deleteMessage]);

  const handleReact = useCallback((message: WhatsAppMessage, emoji: string) => {
    // Store reaction in metadata - update optimistically
    const currentReactions = (((message.metadata as Record<string, unknown>)?.reactions || []) as Array<{ emoji: string; from: string }>;
    const newReactions = [...currentReactions, { emoji, from: "user" }];
    // Update via supabase directly
    supabase
      .from("whatsapp_messages" as unknown as "profiles")
      .update({ metadata: { ...message.metadata, reactions: newReactions } } as Record<string, unknown>)
      .eq("id", message.id)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["whatsapp-messages"] });
      });
    toast({ title: `Reação ${emoji} enviada` });
  }, [queryClient]);

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
      <ChatConversationHeader
        contact={contact}
        contactTyping={contactTyping}
        linkedLead={linkedLead}
        attendingMode={attendingMode as string | null}
        agentId={agentId as string | null}
        agents={agents}
        stages={stages}
        actionsOpen={actionsOpen}
        setActionsOpen={setActionsOpen}
        searchOpen={searchOpen}
        searchQuery={searchQuery}
        searchResultsCount={searchResults ? searchResults.length : null}
        onToggleSearch={() => { setSearchOpen(!searchOpen); setSearchQuery(""); }}
        onSearchChange={setSearchQuery}
        onCloseSearch={() => { setSearchOpen(false); setSearchQuery(""); }}
        onToggleMode={handleToggleMode}
        onCreateLead={handleCreateLead}
        onChangeAgent={handleChangeAgent}
        onChangeStage={handleChangeStage}
        onNavigateCrm={() => navigate("/cliente/crm")}
        onBack={onBack}
        isHandoffAlert={isHandoffAlert}
        updateModePending={updateMode.isPending}
        createLeadPending={createLead.isPending}
        linkMutationPending={linkMutation.isPending}
      />

      <ChatConversationMessages
        allMessages={allMessages}
        displayedMessages={displayedMessages}
        hasMore={hasMore}
        isLoading={isLoading}
        loadingHistory={loadingHistory}
        contactTyping={contactTyping}
        attendingMode={attendingMode as string | null}
        searchQuery={searchQuery}
        showScrollBtn={showScrollBtn}
        newMsgCount={newMsgCount}
        onLoadMore={() => setDisplayCount((c) => c + DISPLAY_STEP)}
        onScrollToBottom={scrollToBottom}
        onReply={handleReply}
        onRetry={handleRetry}
        onImageClick={handleImageClick}
        onForward={handleForward}
        onStar={handleStar}
        onDelete={handleDelete}
        onReact={handleReact}
        onScroll={handleScroll}
        scrollAreaRef={scrollAreaRef}
        bottomRef={bottomRef}
      />

      <ChatConversationInput
        text={text}
        setText={setText}
        replyingTo={replyingTo}
        setReplyingTo={setReplyingTo}
        contactName={contact?.name || contact?.phone || "Contato"}
        isRecording={isRecording}
        recordingTime={recordingTime}
        sendingAudio={sendingAudio}
        uploading={uploading}
        sendPending={sendMutation.isPending}
        onSend={handleSend}
        onTextChange={handleTextChange}
        onKeyDown={handleKeyDown}
        onFileUpload={handleFileUpload}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
        onInsertEmoji={handleInsertEmoji}
        inputRef={inputRef}
      />

      {/* Image Lightbox */}
      {lightboxImages.length > 0 && (
        <ImageLightbox
          images={lightboxImages}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxImages([])}
          onNavigate={setLightboxIndex}
        />
      )}

      {/* Forward Dialog */}
      <ChatForwardDialog
        open={!!forwardMsg}
        onOpenChange={(open) => { if (!open) setForwardMsg(null); }}
        message={forwardMsg}
        contacts={allContacts || []}
      />
    </div>
  );
}
