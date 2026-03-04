import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserOrgId } from "./useUserOrgId";
import { useAuth } from "@/contexts/AuthContext";
import type { AiAgent } from "@/types/cliente";

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
      const { data, error } = await supabase
        .from("client_ai_agents")
        .insert({
          name: agent.name!,
          description: agent.description ?? null,
          avatar_url: agent.avatar_url ?? null,
          status: agent.status ?? "draft",
          persona: agent.persona ?? {},
          knowledge_base: agent.knowledge_base ?? [],
          prompt_config: agent.prompt_config ?? {},
          channel: agent.channel ?? "whatsapp",
          tags: agent.tags ?? [],
          role: agent.role ?? "sdr",
          gender: agent.gender ?? null,
          objectives: agent.objectives ?? [],
          crm_actions: agent.crm_actions ?? {},
          whatsapp_instance_ids: agent.whatsapp_instance_ids ?? [],
          organization_id: orgId!,
          created_by: user?.id,
        } as any)
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
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;

      // When agent is paused/disabled, unlock all its contacts to human mode
      if (updates.status && updates.status !== "active" && orgId) {
        await supabase
          .from("whatsapp_contacts" as any)
          .update({ attending_mode: "human" } as any)
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
      const { data, error } = await supabase
        .from("client_ai_agents")
        .insert({
          name: `${agent.name} (cópia)`,
          description: agent.description,
          avatar_url: agent.avatar_url,
          status: "draft",
          persona: agent.persona,
          knowledge_base: agent.knowledge_base,
          prompt_config: agent.prompt_config,
          channel: agent.channel,
          tags: agent.tags,
          role: agent.role ?? "sdr",
          gender: agent.gender ?? null,
          objectives: agent.objectives ?? [],
          crm_actions: agent.crm_actions ?? {},
          whatsapp_instance_ids: agent.whatsapp_instance_ids ?? [],
          organization_id: orgId!,
          created_by: user?.id,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client-ai-agents"] }),
  });

  return { createAgent, updateAgent, deleteAgent, duplicateAgent };
}
