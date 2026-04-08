-- Migration: tabela de solicitações de exclusão de dados (Meta Data Deletion Callback)
-- Obrigatório pela plataforma Meta para Apps com acesso a dados de usuários

CREATE TABLE IF NOT EXISTS public.data_deletion_requests (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  platform        text NOT NULL,                    -- 'meta', 'google', etc.
  platform_user_id text NOT NULL,                   -- UID do usuário na plataforma
  requested_at    timestamptz NOT NULL DEFAULT now(),
  completed_at    timestamptz,
  status          text NOT NULL DEFAULT 'pending'   -- 'pending' | 'completed' | 'failed'
    CHECK (status IN ('pending', 'completed', 'failed')),
  notes           text,
  UNIQUE (platform, platform_user_id)
);

-- Apenas service_role pode acessar (dados sensíveis de exclusão)
ALTER TABLE public.data_deletion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_only"
  ON public.data_deletion_requests
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Índice para busca por plataforma + status
CREATE INDEX IF NOT EXISTS idx_data_deletion_platform_status
  ON public.data_deletion_requests (platform, status);

COMMENT ON TABLE public.data_deletion_requests IS
  'Registro de solicitações de exclusão de dados enviadas pela Meta (e outros providers OAuth) via Data Deletion Callback';
