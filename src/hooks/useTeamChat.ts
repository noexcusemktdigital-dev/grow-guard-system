import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { useEffect, useCallback, useRef, useMemo } from "react";

export interface TeamChannel {
  id: string;
  organization_id: string;
  type: "group" | "direct" | "custom";
  name: string | null;
  description: string | null;
  avatar_url: string | null;
  created_by: string | null;
  team_id: string | null;
  created_at: string;
}

export interface TeamMessage {
  id: string;
  channel_id: string;
  sender_id: string;
  content: string | null;
  type: string;
  file_url: string | null;
  file_name: string | null;
  created_at: string;
  sender_name?: string;
  sender_avatar?: string;
}

export interface TeamMember {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
}

export interface ChannelMembership {
  channel_id: string;
  user_id: string;
  last_read_at: string | null;
  role: string;
}

export function useTeamChat() {
  const { user } = useAuth();
  const { data: orgId } = useUserOrgId();
  const qc = useQueryClient();
  const channelSubRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Fetch channels user is a member of
  const channelsQuery = useQuery({
    queryKey: ["team-chat-channels", orgId],
    queryFn: async () => {
      // Get channels the user is member of
      const { data: memberOf } = await supabase
        .from("team_chat_members")
        .select("channel_id")
        .eq("user_id", user!.id);

      const channelIds = (memberOf || []).map((m) => m.channel_id);

      if (channelIds.length === 0) {
        // Also get org-wide channels
        const { data, error } = await supabase
          .from("team_chat_channels")
          .select("*")
          .eq("organization_id", orgId!)
          .order("created_at");
        if (error) throw error;
        return (data || []) as TeamChannel[];
      }

      const { data, error } = await supabase
        .from("team_chat_channels")
        .select("*")
        .eq("organization_id", orgId!)
        .order("created_at");
      if (error) throw error;
      return (data || []) as TeamChannel[];
    },
    enabled: !!orgId && !!user,
  });

  // Fetch org members
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

  // Fetch all channel memberships (for unread + DM names)
  const channelMembersQuery = useQuery({
    queryKey: ["team-chat-all-members", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_chat_members")
        .select("channel_id, user_id, last_read_at, role");
      if (error) throw error;
      return (data || []) as ChannelMembership[];
    },
    enabled: !!orgId,
  });

  // Fetch last message timestamp per channel (for unread calc)
  const lastMessagesQuery = useQuery({
    queryKey: ["team-chat-last-messages", orgId],
    queryFn: async () => {
      const channels = channelsQuery.data || [];
      if (channels.length === 0) return {};

      const result: Record<string, { created_at: string; count: number }> = {};

      for (const ch of channels) {
        const { count } = await supabase
          .from("team_chat_messages")
          .select("*", { count: "exact", head: true })
          .eq("channel_id", ch.id);

        const myMembership = channelMembersQuery.data?.find(
          (m) => m.channel_id === ch.id && m.user_id === user?.id
        );

        if (myMembership?.last_read_at) {
          const { count: unreadCount } = await supabase
            .from("team_chat_messages")
            .select("*", { count: "exact", head: true })
            .eq("channel_id", ch.id)
            .gt("created_at", myMembership.last_read_at);

          result[ch.id] = { created_at: myMembership.last_read_at, count: unreadCount || 0 };
        } else {
          result[ch.id] = { created_at: "", count: count || 0 };
        }
      }

      return result;
    },
    enabled: !!orgId && !!user && (channelsQuery.data?.length ?? 0) > 0 && (channelMembersQuery.data?.length ?? 0) > 0,
    refetchInterval: 30000,
  });

  // Unread counts map
  const unreadCounts = useMemo(() => {
    const data = lastMessagesQuery.data || {};
    const counts: Record<string, number> = {};
    for (const [chId, info] of Object.entries(data)) {
      counts[chId] = info.count;
    }
    return counts;
  }, [lastMessagesQuery.data]);

  // Ensure general channel + sync team channels
  const ensureGeneralChannel = useMutation({
    mutationFn: async () => {
      if (!orgId || !user) return null;

      // Sync team-based channels
      await supabase.rpc("sync_team_chat_channels", { _org_id: orgId });

      // Ensure #Geral exists
      const { data: existing } = await supabase
        .from("team_chat_channels")
        .select("id")
        .eq("organization_id", orgId)
        .eq("type", "group")
        .eq("name", "Geral")
        .is("team_id", null)
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
      }

      // Add all org members to Geral
      const members = membersQuery.data || [];
      if (members.length > 0) {
        await supabase.from("team_chat_members").upsert(
          members.map((m) => ({ channel_id: channelId!, user_id: m.user_id })),
          { onConflict: "channel_id,user_id" }
        );
      }

      qc.invalidateQueries({ queryKey: ["team-chat-channels"] });
      return channelId;
    },
  });

  // Create custom group
  const createCustomGroup = useMutation({
    mutationFn: async ({ name, description, memberIds }: { name: string; description?: string; memberIds: string[] }) => {
      if (!orgId || !user) throw new Error("Not authenticated");

      const { data: ch, error } = await supabase
        .from("team_chat_channels")
        .insert({
          organization_id: orgId,
          type: "group",
          name,
          description: description || null,
          created_by: user.id,
        })
        .select("id")
        .single();
      if (error) throw error;

      // Add creator as admin + selected members
      const allMembers = [
        { channel_id: ch.id, user_id: user.id, role: "admin" },
        ...memberIds.filter((id) => id !== user.id).map((id) => ({
          channel_id: ch.id,
          user_id: id,
          role: "member",
        })),
      ];

      await supabase.from("team_chat_members").insert(allMembers);

      qc.invalidateQueries({ queryKey: ["team-chat-channels"] });
      return ch.id;
    },
  });

  // Get or create DM channel
  const getOrCreateDM = useCallback(
    async (otherUserId: string) => {
      if (!orgId || !user) return null;

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
    mutationFn: async ({ channelId, content, type = "text", fileUrl, fileName }: {
      channelId: string;
      content?: string;
      type?: string;
      fileUrl?: string;
      fileName?: string;
    }) => {
      const { error } = await supabase
        .from("team_chat_messages")
        .insert({
          channel_id: channelId,
          sender_id: user?.id ?? "",
          content: content || null,
          type,
          file_url: fileUrl || null,
          file_name: fileName || null,
        });
      if (error) {
        console.error("[TeamChat] sendMessage error:", error);
        throw error;
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["team-chat-messages", vars.channelId] });
      qc.invalidateQueries({ queryKey: ["team-chat-last-messages"] });
    },
  });

  // Mark channel as read
  const markAsRead = useCallback(
    async (channelId: string) => {
      if (!user) return;
      await supabase
        .from("team_chat_members")
        .update({ last_read_at: new Date().toISOString() })
        .eq("channel_id", channelId)
        .eq("user_id", user.id);
      qc.invalidateQueries({ queryKey: ["team-chat-last-messages"] });
    },
    [user, qc]
  );

  // Upload file to chat-media bucket
  const uploadFile = useCallback(
    async (file: File, channelId: string) => {
      const ext = file.name.split(".").pop();
      const path = `${orgId}/${channelId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("chat-media").upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("chat-media").getPublicUrl(path);
      return { url: urlData.publicUrl, name: file.name };
    },
    [orgId]
  );

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
            qc.invalidateQueries({ queryKey: ["team-chat-last-messages"] });
          }
        )
        .subscribe();

      channelSubRef.current = sub;
    },
    [qc]
  );

  useEffect(() => {
    return () => {
      if (channelSubRef.current) {
        supabase.removeChannel(channelSubRef.current);
      }
    };
  }, []);

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

  // Get channel members
  const getChannelMembers = useCallback(
    (channelId: string) => {
      const memberIds = channelMembersQuery.data?.filter((m) => m.channel_id === channelId).map((m) => m.user_id) || [];
      return membersQuery.data?.filter((m) => memberIds.includes(m.user_id)) || [];
    },
    [channelMembersQuery.data, membersQuery.data]
  );

  return {
    channels: channelsQuery.data || [],
    channelsLoading: channelsQuery.isLoading,
    members: membersQuery.data || [],
    channelMemberships: channelMembersQuery.data || [],
    unreadCounts,
    ensureGeneralChannel,
    createCustomGroup,
    getOrCreateDM,
    useChannelMessages,
    sendMessage,
    subscribeToChannel,
    getDMPartnerName,
    getChannelMembers,
    markAsRead,
    uploadFile,
    user,
  };
}
