// @ts-nocheck
import { useEffect, useState } from "react";
import { Hash, MessageCircle, Users, Briefcase } from "lucide-react";
import { useTeamChat, type TeamChannel } from "@/hooks/useTeamChat";
import { TeamChatConversation } from "@/components/teamchat/TeamChatConversation";
import { CreateGroupDialog } from "@/components/teamchat/CreateGroupDialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { reportError } from "@/lib/error-toast";

export default function FranqueadoraChat() {
  const {
    channels,
    channelsLoading,
    members,
    channelMemberships,
    unreadCounts,
    typingUsers,
    ensureGeneralChannel,
    createCustomGroup,
    getOrCreateDM,
    useChannelMessages,
    useChannelReactions,
    sendMessage,
    toggleReaction,
    subscribeToChannel,
    getDMPartnerName,
    getChannelMembers,
    markAsRead,
    uploadFile,
    broadcastTyping,
    user,
  } = useTeamChat();

  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);

  // Ensure general + team channels on mount
  useEffect(() => {
    if (members.length > 0) {
      ensureGeneralChannel.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members.length]);

  // Auto-select first channel
  useEffect(() => {
    if (!selectedChannelId && channels.length > 0) {
      setSelectedChannelId(channels[0].id);
    }
  }, [channels, selectedChannelId]);

  // Subscribe to realtime + mark as read
  useEffect(() => {
    subscribeToChannel(selectedChannelId);
    if (selectedChannelId) {
      markAsRead(selectedChannelId);
    }
  }, [selectedChannelId, subscribeToChannel, markAsRead]);

  const messagesQuery = useChannelMessages(selectedChannelId);
  const reactionsQuery = useChannelReactions(selectedChannelId);
  const selectedChannel = channels.find((c) => c.id === selectedChannelId);
  const selectedMembers = selectedChannelId ? getChannelMembers(selectedChannelId) : [];
  const selectedMemberships = channelMemberships.filter((m) => m.channel_id === selectedChannelId);
  const currentTypingUsers = selectedChannelId ? (typingUsers[selectedChannelId] || []) : [];

  const handleStartDM = async (otherUserId: string) => {
    if (otherUserId === user?.id) return;
    try {
      const channelId = await getOrCreateDM(otherUserId);
      if (channelId) setSelectedChannelId(channelId);
    } catch (err) {
      reportError(err, { title: "Erro ao iniciar conversa", category: "chat.dm_create" });
    }
  };

  const handleSend = (content: string, replyToId?: string) => {
    if (!selectedChannelId) return;
    sendMessage.mutate({ channelId: selectedChannelId, content, replyToId });
  };

  const handleSendFile = async (file: File, caption?: string) => {
    if (!selectedChannelId) return;
    try {
      const { url, name } = await uploadFile(file, selectedChannelId);
      const type = file.type.startsWith("image/") ? "image" : "file";
      sendMessage.mutate({ channelId: selectedChannelId, type, fileUrl: url, fileName: name, content: caption });
    } catch (err) {
      reportError(err, { title: "Erro ao enviar arquivo", category: "chat.file_upload" });
    }
  };

  const handleReact = (messageId: string, emoji: string) => {
    if (!selectedChannelId) return;
    toggleReaction.mutate({ messageId, emoji, channelId: selectedChannelId });
  };

  const handleTyping = () => {
    if (!selectedChannelId) return;
    broadcastTyping(selectedChannelId);
  };

  const handleCreateGroup = async (name: string, description: string, memberIds: string[]) => {
    try {
      const channelId = await createCustomGroup.mutateAsync({ name, description, memberIds });
      if (channelId) setSelectedChannelId(channelId);
      toast.success("Grupo criado!");
    } catch (err) {
      reportError(err, { title: "Erro ao criar grupo", category: "chat.group_create" });
    }
  };

  // Categorize channels
  const geralChannel = channels.find((c) => c.type === "group" && c.name === "Geral" && !c.team_id);
  const teamChannels = channels.filter((c) => c.type === "group" && c.team_id);
  const customGroups = channels.filter((c) => c.type === "group" && c.created_by && !c.team_id && c.name !== "Geral");
  const dmChannels = channels.filter((c) => c.type === "direct");
  const otherMembers = members.filter((m) => m.user_id !== user?.id);

  const getInitials = (name: string) =>
    name.split(" ").filter(Boolean).map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  const renderChannelButton = (ch: TeamChannel, label: string, icon: React.ReactNode) => {
    const unread = unreadCounts[ch.id] || 0;
    return (
      <button
        key={ch.id}
        onClick={() => setSelectedChannelId(ch.id)}
        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
          selectedChannelId === ch.id
            ? "bg-primary/10 text-primary font-medium"
            : "text-foreground hover:bg-muted"
        }`}
      >
        {icon}
        <span className="truncate flex-1 text-left">{label}</span>
        {unread > 0 && (
          <Badge variant="destructive" className="h-5 min-w-[20px] px-1 text-[10px] font-bold">
            {unread > 99 ? "99+" : unread}
          </Badge>
        )}
      </button>
    );
  };

  return (
    <div className="flex h-[calc(100vh-120px)] border rounded-xl bg-card overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 shrink-0 border-r flex flex-col bg-muted/30">
        <div className="px-4 py-3 border-b">
          <h3 className="font-semibold text-sm flex items-center gap-2 text-foreground">
            <MessageCircle className="h-4 w-4 text-primary" />
            Chat da Equipe
          </h3>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {geralChannel && (
              <>
                {renderChannelButton(geralChannel, "# Geral", <Hash className="h-3.5 w-3.5 shrink-0" />)}
                <Separator className="my-2" />
              </>
            )}

            {teamChannels.length > 0 && (
              <>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1 flex items-center gap-1">
                  <Briefcase className="h-3 w-3" /> Times
                </p>
                {teamChannels.map((ch) =>
                  renderChannelButton(ch, `# ${ch.name || "Canal"}`, <Hash className="h-3.5 w-3.5 shrink-0" />)
                )}
                <Separator className="my-2" />
              </>
            )}

            <div className="flex items-center justify-between px-2 py-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" /> Grupos
              </p>
              <CreateGroupDialog
                members={members}
                onCreateGroup={handleCreateGroup}
                currentUserId={user?.id || ""}
              />
            </div>
            {customGroups.map((ch) =>
              renderChannelButton(ch, `# ${ch.name || "Grupo"}`, <Hash className="h-3.5 w-3.5 shrink-0" />)
            )}
            {customGroups.length === 0 && (
              <p className="text-[11px] text-muted-foreground px-2 py-1">Nenhum grupo criado</p>
            )}

            <Separator className="my-2" />

            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1">
              Membros
            </p>
            {otherMembers.map((m) => {
              const existingDm = dmChannels.find((ch) => {
                const partner = channelMemberships.filter((cm) => cm.channel_id === ch.id);
                return partner.some((p) => p.user_id === m.user_id);
              });
              const unread = existingDm ? (unreadCounts[existingDm.id] || 0) : 0;
              const isSelected = existingDm?.id === selectedChannelId;
              return (
                <button
                  key={m.user_id}
                  onClick={() => handleStartDM(m.user_id)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
                    isSelected
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={m.avatar_url || undefined} />
                    <AvatarFallback className="text-[8px] bg-muted">
                      {getInitials(m.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate flex-1 text-left">{m.full_name}</span>
                  {unread > 0 && (
                    <Badge variant="destructive" className="h-5 min-w-[20px] px-1 text-[10px] font-bold">
                      {unread > 99 ? "99+" : unread}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Conversation */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {selectedChannelId && selectedChannel ? (
          <TeamChatConversation
            messages={messagesQuery.data || []}
            isLoading={messagesQuery.isLoading}
            currentUserId={user?.id || ""}
            onSend={handleSend}
            onSendFile={handleSendFile}
            onReact={handleReact}
            onTyping={handleTyping}
            channelName={
              selectedChannel.type === "group"
                ? `# ${selectedChannel.name || "Canal"}`
                : getDMPartnerName(selectedChannel)
            }
            channelDescription={selectedChannel.description}
            memberCount={selectedChannel.type !== "direct" ? selectedMembers.length : undefined}
            reactions={reactionsQuery.data || []}
            channelMemberships={selectedMemberships}
            members={members}
            typingUsers={currentTypingUsers}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            {channelsLoading ? "Carregando..." : "Selecione um canal ou membro para conversar"}
          </div>
        )}
      </div>
    </div>
  );
}
