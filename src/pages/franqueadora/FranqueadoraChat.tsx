import { useEffect, useState } from "react";
import { Hash, User, Plus, MessageCircle } from "lucide-react";
import { useTeamChat, type TeamChannel } from "@/hooks/useTeamChat";
import { TeamChatConversation } from "@/components/teamchat/TeamChatConversation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export default function FranqueadoraChat() {
  const {
    channels,
    channelsLoading,
    members,
    ensureGeneralChannel,
    getOrCreateDM,
    useChannelMessages,
    sendMessage,
    subscribeToChannel,
    getDMPartnerName,
    user,
  } = useTeamChat();

  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);

  // Ensure general channel on mount
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

  // Subscribe to realtime
  useEffect(() => {
    subscribeToChannel(selectedChannelId);
  }, [selectedChannelId, subscribeToChannel]);

  const messagesQuery = useChannelMessages(selectedChannelId);

  const selectedChannel = channels.find((c) => c.id === selectedChannelId);

  const getChannelDisplayName = (ch: TeamChannel) => {
    if (ch.type === "group") return `# ${ch.name || "Canal"}`;
    return getDMPartnerName(ch);
  };

  const handleStartDM = async (otherUserId: string) => {
    if (otherUserId === user?.id) return;
    try {
      const channelId = await getOrCreateDM(otherUserId);
      if (channelId) {
        setSelectedChannelId(channelId);
      }
    } catch {
      toast.error("Erro ao iniciar conversa");
    }
  };

  const handleSend = (content: string) => {
    if (!selectedChannelId) return;
    sendMessage.mutate({ channelId: selectedChannelId, content });
  };

  const groupChannels = channels.filter((c) => c.type === "group");
  const dmChannels = channels.filter((c) => c.type === "direct");
  const otherMembers = members.filter((m) => m.user_id !== user?.id);

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="flex h-[calc(100vh-120px)] border rounded-xl bg-card overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 border-r flex flex-col bg-muted/30">
        <div className="px-4 py-3 border-b">
          <h3 className="font-semibold text-sm flex items-center gap-2 text-foreground">
            <MessageCircle className="h-4 w-4 text-primary" />
            Chat da Equipe
          </h3>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {/* Group channels */}
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1">
              Canais
            </p>
            {groupChannels.map((ch) => (
              <button
                key={ch.id}
                onClick={() => setSelectedChannelId(ch.id)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
                  selectedChannelId === ch.id
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                <Hash className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{ch.name || "Canal"}</span>
              </button>
            ))}

            <Separator className="my-2" />

            {/* DM channels */}
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1">
              Mensagens Diretas
            </p>
            {dmChannels.map((ch) => {
              const name = getDMPartnerName(ch);
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
                  <User className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">{name}</span>
                </button>
              );
            })}

            <Separator className="my-2" />

            {/* Start new DM */}
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1">
              Membros
            </p>
            {otherMembers.map((m) => (
              <button
                key={m.user_id}
                onClick={() => handleStartDM(m.user_id)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-foreground hover:bg-muted transition-colors"
              >
                <Avatar className="h-5 w-5">
                  <AvatarImage src={m.avatar_url || undefined} />
                  <AvatarFallback className="text-[8px] bg-muted">
                    {getInitials(m.full_name)}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{m.full_name}</span>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Conversation */}
      <div className="flex-1 flex flex-col">
        {selectedChannelId && selectedChannel ? (
          <TeamChatConversation
            messages={messagesQuery.data || []}
            isLoading={messagesQuery.isLoading}
            currentUserId={user?.id || ""}
            onSend={handleSend}
            channelName={
              selectedChannel.type === "group"
                ? `# ${selectedChannel.name || "Canal"}`
                : getDMPartnerName(selectedChannel)
            }
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
