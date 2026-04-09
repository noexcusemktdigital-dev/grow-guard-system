

# Corrigir integrações Meta Ads e Redes Sociais (Instagram/Facebook)

## Problemas identificados

### 1. Erro `save_failed` no Meta Ads (Tráfego Pago)
**Causa raiz**: A tabela `ad_platform_connections` tem um CHECK constraint que só permite `status IN ('active', 'expired', 'disconnected')`. Quando o usuário tem múltiplas contas de anúncio, o callback tenta inserir com `status: 'pending'`, violando a constraint.

### 2. Secrets ausentes para Redes Sociais (Instagram/Facebook)
A edge function `social-oauth-meta` requer `META_CLIENT_ID`, `META_CLIENT_SECRET` e `OAUTH_STATE_SECRET`, mas nenhum desses secrets existe. Existem apenas `META_APP_ID` e `META_APP_SECRET`.

### 3. Dois fluxos OAuth duplicados e conflitantes
Existem dois caminhos paralelos:
- **Ads**: `ads-oauth-start` → `ads-oauth-callback` (usa `META_APP_ID`, tabelas `ads_connections` e `ad_platform_connections`)
- **Social**: `social-oauth-meta` → `social-oauth-callback` (usa `META_CLIENT_ID`, tabela `social_accounts`)

Ambos autenticam com o mesmo app Meta mas usam secrets com nomes diferentes e salvam em tabelas diferentes.

---

## Plano de correção

### Etapa 1: Corrigir constraint do banco de dados
Migração SQL para adicionar `'pending'` ao CHECK constraint de `ad_platform_connections`:
```sql
ALTER TABLE public.ad_platform_connections
  DROP CONSTRAINT ad_platform_connections_status_check;
ALTER TABLE public.ad_platform_connections
  ADD CONSTRAINT ad_platform_connections_status_check
  CHECK (status IN ('active', 'expired', 'disconnected', 'pending'));
```

### Etapa 2: Adicionar secrets ausentes
Criar 3 secrets reutilizando os valores do app Meta existente:
- `META_CLIENT_ID` → mesmo valor de `META_APP_ID`
- `META_CLIENT_SECRET` → mesmo valor de `META_APP_SECRET`
- `OAUTH_STATE_SECRET` → gerar um valor aleatório seguro

### Etapa 3: Corrigir redirect do `social-oauth-callback`
O `social-oauth-callback` redireciona para `/cliente/contas-sociais` (rota legada). Atualizar para redirecionar para `/cliente/redes-sociais` (hub unificado atual).

### Etapa 4: Deploy das edge functions atualizadas
Redeplorar `ads-oauth-callback` e `social-oauth-callback` após as correções.

---

## Configuração externa necessária (Facebook Developers)

Você precisa garantir no painel developers.facebook.com:

| Configuração | Valor |
|---|---|
| App Domains | `sistema.noexcusedigital.com.br`, `grow-guard-system.lovable.app` |
| Valid OAuth Redirect URIs | `https://gxrhdpbbxfipeopdyygn.supabase.co/functions/v1/ads-oauth-callback` |
| | `https://gxrhdpbbxfipeopdyygn.supabase.co/functions/v1/social-oauth-callback` |
| Permissões necessárias | `instagram_basic`, `instagram_content_publish`, `instagram_manage_insights`, `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`, `ads_read`, `ads_management` |

## Resumo

| Ação | Quem |
|---|---|
| Migração DB (adicionar 'pending' ao check) | Lovable |
| Adicionar 3 secrets | Você (informar valores) |
| Corrigir redirect no social-oauth-callback | Lovable |
| Deploy das funções | Lovable |
| Configurar URIs no Facebook Developers | Você |

