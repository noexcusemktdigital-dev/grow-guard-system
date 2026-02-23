ALTER TABLE public.ai_conversation_logs
  DROP CONSTRAINT ai_conversation_logs_agent_id_fkey,
  ADD CONSTRAINT ai_conversation_logs_agent_id_fkey
    FOREIGN KEY (agent_id) REFERENCES public.client_ai_agents(id)
    ON DELETE CASCADE;