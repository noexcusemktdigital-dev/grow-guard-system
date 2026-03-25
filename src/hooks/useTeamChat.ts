import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { useEffect, useCallback, useRef } from "react";

export interface TeamChannel {
  id: string;
  organization_id: string;
  type: "group" | "direct";
  name: string | null;
  created_at: string;
}

export interface TeamMessage {
  id: string;
  channel_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_name?: string;
  sender_avatar?: string;
}

export interface TeamMember {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
}

export function useTeamChat() {
  const { user } = useAuth();
  const { data: orgId } = useUserOrgId();
  const qc = useQueryClient();
  const channelSubRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Fetch channels
  const channelsQuery = useQuery({
    queryKey: ["team-chat-channels", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_chat_channels")
        .select("*")
        .eq("organization_id", orgId!)
        .order("created_at");
      if (error) throw error;
      return data as TeamChannel[];
    },
    enabled: !!orgId,
  });

  // Fetch org members (for DMs and sender names)
  const membersQuery = useQuery({
    queryKey: ["team-chat-org-members", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organization_memberships")
        .select("user_id, profiles(full_name, avatar_url)")
        .eq("organization_id", orgId!);
      if (error) throw error;
      return (data || []).map((m: any) => ({
        user_id: m.user_id,
        full_name: m.profiles?.full_name || "Usuário",
        avatar_url: m.profiles?.avatar_url || null,
      })) as TeamMember[];
    },
    enabled: !!orgId,
  });

  // Ensure general channel exists + user is member
  const ensureGeneralChannel = useMutation({
    mutationFn: async () => {
      if (!orgId || !user) return null;

      // Check if general channel exists
      const { data: existing } = await supabase
        .from("team_chat_channels")
        .select("id")
        .eq("organization_id", orgId)
        .eq("type", "group")
        .eq("name", "Geral")
        .maybeSingle();

      let channelId = existing?.id;

      if (!channelId) {
        const { data: created, error } = await supabase
          .from("team_chat_channels")
          .insert({ organization_id: orgId, type: "group", name: "Geral" })
          .select("id")
          .single();
        if (error) throw error;
        channelId = created.id;

        // Add all org members
        const members = membersQuery.data || [];
        if (members.length > 0) {
          await supabase.from("team_chat_members").upsert(
            members.map((m) => ({ channel_id: channelId!, user_id: m.user_id })),
            { onConflict: "channel_id,user_id" }
          );
        }
      } else {
        // Ensure current user is member
        await supabase.from("team_chat_members").upsert(
          { channel_id: channelId, user_id: user.id },
          { onConflict: "channel_id,user_id" }
        );
      }

      qc.invalidateQueries({ queryKey: ["team-chat-channels"] });
      return channelId;
    },
  });

  // Get or create DM channel
  const getOrCreateDM = useCallback(
    async (otherUserId: string) => {
      if (!orgId || !user) return null;

      // Find existing DM with this user
      const { data: myChannels } = await supabase
        .from("team_chat_members")
        .select("channel_id")
        .eq("user_id", user.id);

      if (myChannels && myChannels.length > 0) {
        const channelIds = myChannels.map((c) => c.channel_id);
        const { data: dmChannel } = await supabase
          .from("team_chat_channels")
          .select("id")
          .in("id", channelIds)
          .eq("type", "direct")
          .eq("organization_id", orgId);

        if (dmChannel) {
          for (const ch of dmChannel) {
            const { data: members } = await supabase
              .from("team_chat_members")
              .select("user_id")
              .eq("channel_id", ch.id);
            const memberIds = members?.map((m) => m.user_id) || [];
            if (memberIds.includes(otherUserId) && memberIds.includes(user.id) && memberIds.length === 2) {
              return ch.id;
            }
          }
        }
      }

      // Create new DM
      const { data: newCh, error } = await supabase
        .from("team_chat_channels")
        .insert({ organization_id: orgId, type: "direct", name: null })
        .select("id")
        .single();
      if (error) throw error;

      await supabase.from("team_chat_members").insert([
        { channel_id: newCh.id, user_id: user.id },
        { channel_id: newCh.id, user_id: otherUserId },
      ]);

      qc.invalidateQueries({ queryKey: ["team-chat-channels"] });
      return newCh.id;
    },
    [orgId, user, qc]
  );

  // Fetch messages for a channel
  const useChannelMessages = (channelId: string | null) => {
    return useQuery({
      queryKey: ["team-chat-messages", channelId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("team_chat_messages")
          .select("*")
          .eq("channel_id", channelId!)
          .order("created_at", { ascending: true })
          .limit(200);
        if (error) throw error;

        const members = membersQuery.data || [];
        return (data || []).map((msg) => {
          const sender = members.find((m) => m.user_id === msg.sender_id);
          return {
            ...msg,
            sender_name: sender?.full_name || "Usuário",
            sender_avatar: sender?.avatar_url || null,
          };
        }) as TeamMessage[];
      },
      enabled: !!channelId && (membersQuery.data?.length ?? 0) > 0,
    });
  };

  // Send message
  const sendMessage = useMutation({
    mutationFn: async ({ channelId, content }: { channelId: string; content: string }) => {
      const { error } = await supabase
        .from("team_chat_messages")
        .insert({ channel_id: channelId, sender_id: user!.id, content });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["team-chat-messages", vars.channelId] });
    },
  });

  // Realtime subscription
  const subscribeToChannel = useCallback(
    (channelId: string | null) => {
      if (channelSubRef.current) {
        supabase.removeChannel(channelSubRef.current);
        channelSubRef.current = null;
      }
      if (!channelId) return;

      const sub = supabase
        .channel(`team-chat-${channelId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "team_chat_messages", filter: `channel_id=eq.${channelId}` },
          () => {
            qc.invalidateQueries({ queryKey: ["team-chat-messages", channelId] });
          }
        )
        .subscribe();

      channelSubRef.current = sub;
    },
    [qc]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channelSubRef.current) {
        supabase.removeChannel(channelSubRef.current);
      }
    };
  }, []);

  // Get DM channel members (to show partner name)
  const getDMPartner = useCallback(
    (channel: TeamChannel) => {
      if (channel.type !== "direct" || !user) return null;
      // We'll need to fetch members for this channel — for now return null
      return null;
    },
    [user]
  );

  // Fetch channel members for DM name resolution
  const channelMembersQuery = useQuery({
    queryKey: ["team-chat-all-members", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_chat_members")
        .select("channel_id, user_id");
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const getDMPartnerName = useCallback(
    (channel: TeamChannel) => {
      if (channel.type !== "direct" || !user) return "DM";
      const members = channelMembersQuery.data?.filter((m) => m.channel_id === channel.id) || [];
      const partnerId = members.find((m) => m.user_id !== user.id)?.user_id;
      if (!partnerId) return "DM";
      const partner = membersQuery.data?.find((m) => m.user_id === partnerId);
      return partner?.full_name || "Usuário";
    },
    [user, channelMembersQuery.data, membersQuery.data]
  );

  return {
    channels: channelsQuery.data || [],
    channelsLoading: channelsQuery.isLoading,
    members: membersQuery.data || [],
    ensureGeneralChannel,
    getOrCreateDM,
    useChannelMessages,
    sendMessage,
    subscribeToChannel,
    getDMPartnerName,
    user,
  };
}
