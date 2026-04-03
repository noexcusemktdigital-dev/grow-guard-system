

## Plano — Módulo de Acesso Temporário de Suporte (Enterprise)

### Visão Geral

Módulo que permite ao cliente autorizar temporariamente o suporte a visualizar/operar sua conta, com token seguro, auditoria completa e revogação em tempo real.

### Fase 1 — Backend (Database + Edge Functions)

#### 1.1 Migration SQL

Criar duas tabelas:

**`support_access_tokens`** — tokens de acesso temporário
- `id`, `organization_id`, `created_by_user_id`, `token_hash` (text, unique), `expires_at` (timestamptz), `is_active` (boolean default true), `revoked_at`, `access_level` (check: read_only/full), `ip_created`, `ticket_id` (nullable FK para support_tickets), `created_at`
- RLS: SELECT/UPDATE apenas para membros da org (`is_member_of_org`)

**`support_access_logs`** — auditoria imutável
- `id`, `token_id` (FK), `support_user_id`, `organization_id`, `action` (text), `metadata` (jsonb), `ip_address`, `created_at`
- RLS: SELECT para membros da org, INSERT via security definer

Trigger de expiração automática: função SQL que desativa tokens expirados (chamada via pg_cron a cada minuto).

#### 1.2 Edge Function: `generate-support-access`

- Valida JWT do usuário autenticado (cliente_admin)
- Recebe: `duration_minutes`, `access_level`, `ticket_id` (opcional)
- Gera token UUID + random bytes → SHA-256 hash
- Salva hash no banco, retorna token plain ao cliente
- Registra log de criação
- Envia notificação interna (`client_notifications`)

#### 1.3 Edge Function: `validate-support-access`

- Recebe token plain via query param
- Hash → busca no banco → valida ativo + não expirado
- Retorna dados da org + access_level para o frontend do suporte
- Registra log de acesso

#### 1.4 Edge Function: `revoke-support-access`

- Valida JWT do cliente
- Marca `is_active = false`, `revoked_at = now()`
- Registra log de revogação

#### 1.5 Cron Job

- A cada 1 minuto, `UPDATE support_access_tokens SET is_active = false WHERE expires_at < now() AND is_active = true`
- Via pg_cron chamando uma RPC security definer

### Fase 2 — Frontend Cliente

#### 2.1 Componente `SupportAccessManager` (em Configurações)

Nova aba "Acesso Suporte" na página de configurações (`ClienteConfiguracoes.tsx`):

- **Botão "Permitir acesso do suporte"** → Dialog com:
  - Seletor de duração (15min, 30min, 1h, custom até 24h)
  - Seletor de nível (read_only / full)
  - Input de senha para confirmação
  - Botão confirmar → chama `generate-support-access`
  - Exibe token gerado para copiar/compartilhar com suporte

- **Lista de acessos ativos** com:
  - Status (ativo/expirado/revogado)
  - Tempo restante
  - Botão "Revogar" para cada ativo

- **Histórico de acessos** com logs de auditoria

#### 2.2 Banner Global de Impersonação

No `ClienteLayout.tsx`, se houver flag `impersonating` no contexto:
- Banner fixo vermelho no topo: "Acesso de suporte ativo até HH:MM — [Encerrar]"
- Visível para o cliente que autorizou o acesso

### Fase 3 — Frontend Suporte (Franqueadora)

#### 3.1 Página de acesso via token

- Rota `/suporte/acesso-remoto` no portal da franqueadora
- Input para colar token → valida via `validate-support-access`
- Se válido, abre visualização read-only/full da org do cliente
- Banner fixo: "Acessando [Empresa X] — Acesso até HH:MM — [Encerrar]"

### Arquivos

| Arquivo | Ação |
|---------|------|
| Migration SQL | Criar `support_access_tokens` + `support_access_logs` + RLS + cron |
| `supabase/functions/generate-support-access/index.ts` | Nova edge function |
| `supabase/functions/revoke-support-access/index.ts` | Nova edge function |
| `supabase/functions/validate-support-access/index.ts` | Nova edge function |
| `src/pages/cliente/ClienteConfiguracoes.tsx` | Adicionar aba "Acesso Suporte" |
| `src/components/cliente/SupportAccessManager.tsx` | Novo componente |
| `src/components/cliente/SupportAccessBanner.tsx` | Banner global |
| `src/hooks/useSupportAccess.ts` | Hook para CRUD de tokens |
| `src/components/ClienteLayout.tsx` | Integrar banner |
| `supabase/config.toml` | Registrar novas edge functions |

### Observações

- A vinculação com tickets usa a tabela `support_tickets` existente
- Notificações usam `client_notifications` existente
- O relatório automático pós-sessão e a camada de IA serão implementados como fase futura após o core estar estável
- MFA será integrado se/quando o sistema de MFA do projeto for ativado

