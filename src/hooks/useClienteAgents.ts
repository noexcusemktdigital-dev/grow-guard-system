import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUserOrgId } from "./useUserOrgId";
import { useAuth } from "@/contexts/AuthContext";
import type { AiAgent } from "@/types/cliente";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/typed";

export function useClienteAgents() {
  const { data: orgId } = useUserOrgId();
  return useQuery({
    queryKey: ["client-ai-agents", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_ai_agents")
        .select("*")
        .eq("organization_id", orgId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as AiAgent[];
    },
    enabled: !!orgId,
  });
}

export function useClienteAgentById(id: string | null) {
  const { data: orgId } = useUserOrgId();
  return useQuery({
    queryKey: ["client-ai-agent", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_ai_agents")
        .select("*")
        .eq("id", id!)
        .eq("organization_id", orgId!)
        .single();
      if (error) throw error;
      return data as unknown as AiAgent;
    },
    enabled: !!id && !!orgId,
  });
}

export function useClienteAgentMutations() {
  const qc = useQueryClient();
  const { data: orgId } = useUserOrgId();
  const { user } = useAuth();

  const createAgent = useMutation({
    mutationFn: async (agent: Partial<AiAgent>) => {
      const payload: TablesInsert<"client_ai_agents"> = {
        name: agent.name!,
        description: agent.description ?? null,
        avatar_url: agent.avatar_url ?? null,
        status: agent.status ?? "draft",
        persona: (agent.persona ?? {}) as TablesInsert<"client_ai_agents">["persona"],
        knowledge_base: (agent.knowledge_base ?? []) as TablesInsert<"client_ai_agents">["knowledge_base"],
        prompt_config: (agent.prompt_config ?? {}) as TablesInsert<"client_ai_agents">["prompt_config"],
        channel: agent.channel ?? "whatsapp",
        tags: agent.tags ?? [],
        role: agent.role ?? "sdr",
        gender: agent.gender ?? null,
        objectives: (agent.objectives ?? []) as TablesInsert<"client_ai_agents">["objectives"],
        crm_actions: (agent.crm_actions ?? {}) as TablesInsert<"client_ai_agents">["crm_actions"],
        whatsapp_instance_ids: (agent.whatsapp_instance_ids ?? []) as TablesInsert<"client_ai_agents">["whatsapp_instance_ids"],
        organization_id: orgId!,
        created_by: user?.id,
      };
      const { data, error } = await supabase
        .from("client_ai_agents")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client-ai-agents"] }),
  });

  const updateAgent = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AiAgent> & { id: string }) => {
      const { data, error } = await supabase
        .from("client_ai_agents")
        .update(updates as TablesUpdate<"client_ai_agents">)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;

      // When agent is paused/disabled, unlock all its contacts to human mode
      if (updates.status && updates.status !== "active" && orgId) {
        await supabase
          .from("whatsapp_contacts")
          .update({ attending_mode: "human" } satisfies TablesUpdate<"whatsapp_contacts">)
          .eq("agent_id", id)
          .eq("organization_id", orgId);
      }

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client-ai-agents"] });
      qc.invalidateQueries({ queryKey: ["whatsapp-contacts"] });
    },
  });

  const deleteAgent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("client_ai_agents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client-ai-agents"] }),
  });

  const duplicateAgent = useMutation({
    mutationFn: async (agent: AiAgent) => {
      // Strip existing " (cópia)" suffixes to avoid concatenation
      const baseName = agent.name.replace(/\s*\(cópia(?:\s*\d*)?\)\s*$/i, "");
      const payload: TablesInsert<"client_ai_agents"> = {
        name: `${baseName} (cópia)`,
        description: agent.description ?? null,
        avatar_url: agent.avatar_url ?? null,
        status: "draft",
        persona: (agent.persona ?? {}) as TablesInsert<"client_ai_agents">["persona"],
        knowledge_base: (agent.knowledge_base ?? []) as TablesInsert<"client_ai_agents">["knowledge_base"],
        prompt_config: (agent.prompt_config ?? {}) as TablesInsert<"client_ai_agents">["prompt_config"],
        channel: agent.channel ?? "whatsapp",
        tags: agent.tags ?? [],
        role: agent.role ?? "sdr",
        gender: agent.gender ?? null,
        objectives: (Array.isArray(agent.objectives) ? agent.objectives : []) as TablesInsert<"client_ai_agents">["objectives"],
        crm_actions: (agent.crm_actions && typeof agent.crm_actions === "object" ? agent.crm_actions : {}) as TablesInsert<"client_ai_agents">["crm_actions"],
        whatsapp_instance_ids: (agent.whatsapp_instance_ids ?? []) as TablesInsert<"client_ai_agents">["whatsapp_instance_ids"],
        organization_id: orgId!,
        created_by: user?.id,
      };
      const { data, error } = await supabase
        .from("client_ai_agents")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client-ai-agents"] }),
  });

  const reactivateAgentContacts = useMutation({
    mutationFn: async (agentId: string) => {
      if (!orgId) return;
      // Set all contacts that were previously assigned to this agent back to AI mode
      await supabase
        .from("whatsapp_contacts")
        .update({ attending_mode: "ai" } satisfies TablesUpdate<"whatsapp_contacts">)
        .eq("agent_id", agentId)
        .eq("organization_id", orgId)
        .eq("attending_mode", "human");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["whatsapp-contacts"] });
    },
  });

  return { createAgent, updateAgent, deleteAgent, duplicateAgent, reactivateAgentContacts };
}

export function useAgentStats(agentId: string | null) {
  const { data: orgId } = useUserOrgId();

  return useQuery({
    queryKey: ["agent-stats", agentId, orgId],
    queryFn: async () => {
      if (!agentId || !orgId) return null;

      const [contactsRes, messagesRes, logsRes] = await Promise.all([
        supabase
          .from("whatsapp_contacts")
          .select("id", { count: "exact", head: true })
          .eq("agent_id", agentId)
          .eq("organization_id", orgId)
          .eq("attending_mode", "ai"),
        supabase
          .from("whatsapp_messages")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", orgId)
          .eq("direction", "outbound")
          .gte("created_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
          .contains("metadata", { agent_id: agentId }),
        supabase
          .from("ai_conversation_logs")
          .select("id, created_at, input_message, output_message, contact_id")
          .eq("agent_id", agentId)
          .eq("organization_id", orgId)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

      return {
        activeContacts: contactsRes.count ?? 0,
        messagesToday: messagesRes.count ?? 0,
        recentLogs: logsRes.data ?? [],
      };
    },
    enabled: !!agentId && !!orgId,
    refetchInterval: 120000, // PERF: 30s → 2min
  });
}
