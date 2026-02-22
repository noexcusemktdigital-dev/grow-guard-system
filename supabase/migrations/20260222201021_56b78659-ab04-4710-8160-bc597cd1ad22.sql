
-- Fix: drop the overly permissive insert policy since service_role bypasses RLS anyway
DROP POLICY IF EXISTS "Service can insert ai logs" ON public.ai_conversation_logs;
