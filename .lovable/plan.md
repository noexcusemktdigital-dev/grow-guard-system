

## Plano — Correção drástica do fluxo de Usuários & Times

### Diagnóstico

Após análise do banco e do código, identifiquei 5 problemas interligados:

1. **Usuários fantasma**: A edge function `invite-user` cria o `organization_membership` **imediatamente** ao convidar. O convidado aparece como membro ativo na lista E como convite pendente ao mesmo tempo.

2. **Convites aceitos não atualizam**: A página Welcome tenta fazer `supabase.from("pending_invitations").update({ accepted_at })` direto pelo client SDK. Confirmei no banco que Juliana (`jmfferiato2@gmail.com`) tem `accepted_at: null` mesmo tendo criado a senha com sucesso. O update silenciosamente não afeta nenhuma linha (provavelmente a sessão de recovery não carrega o JWT completo para satisfazer a policy RLS).

3. **Usuários removidos permanecem**: O `manage-member` remove de `organization_memberships` e `user_roles`, mas **não limpa** a entrada de `pending_invitations`. O convidado removido continua aparecendo como "Pendente".

4. **HIBP rejeita senhas válidas**: A proteção Have I Been Pwned está ativa no servidor. Senhas como "Juliana12345@" são rejeitadas por estarem em bases de vazamentos, mesmo cumprindo todas as regras visuais. O usuário quer que qualquer senha que siga as regras definidas seja aceita.

5. **Sem invalidação cruzada de cache**: Ao remover membro, apenas `["org-members"]` é invalidado. O cache de `["pending-invitations"]` continua stale.

### Correções

#### 1. Desduplicar membros ativos vs pendentes no UI

**Arquivos**: `src/pages/cliente/ClienteConfiguracoes.tsx`, `src/pages/Matriz.tsx`

Na `UsersAndTeamsTab`, cruzar a lista de `members` com `pendingInvitations`:
- Se o email do membro aparece em `pendingInvitations` com `accepted_at = null` → **excluir** da lista ativa (admins/users)
- Esse membro já aparece na seção "Convites Pendentes"
- Resultado: sem duplicação

#### 2. Marcar accepted_at via edge function (não via client SDK)

**Arquivo**: `supabase/functions/invite-user/index.ts` (adicionar ação "accept"), ou criar endpoint dedicado

Em vez de o Welcome.tsx tentar `update` direto (que falha por RLS), criar uma ação `accept-invitation` na edge function `manage-member` (que já usa service role):
- Welcome.tsx chama `supabase.functions.invoke("manage-member", { body: { action: "accept_invitation" } })`
- A edge function usa adminClient para atualizar `accepted_at` e garantir que funcione

**Arquivo**: `src/pages/Welcome.tsx` — trocar o update direto pelo invoke da edge function

#### 3. Limpar pending_invitations na remoção de membro

**Arquivo**: `supabase/functions/manage-member/index.ts`

No bloco `action === "remove"`, adicionar:
- Buscar o email do user via `auth.admin.getUserById(user_id)`
- Deletar de `pending_invitations` onde `email = userEmail AND organization_id = organization_id`
- Invalidar cache de pending no frontend

#### 4. Desabilitar HIBP

Usar `cloud--configure_auth` para desabilitar a verificação de senhas vazadas, permitindo que qualquer senha que cumpra as regras de complexidade seja aceita.

#### 5. Invalidação completa de cache

**Arquivos**: `src/components/EditMemberDialog.tsx`, `src/pages/Matriz.tsx`

Em todos os pontos onde membros são modificados (save, remove, invite), invalidar AMBOS:
- `["org-members"]`
- `["pending-invitations"]`

#### 6. Mesma lógica na Matriz (franqueadora)

**Arquivo**: `src/pages/Matriz.tsx`

Aplicar a mesma deduplicação: importar `usePendingInvitations`, filtrar membros ativos excluindo emails pendentes, e mostrar seção "Convites Pendentes" com reenvio/cancelamento (como já existe em ClienteConfiguracoes).

### Arquivos

| Arquivo | Ação |
|---------|------|
| `src/pages/cliente/ClienteConfiguracoes.tsx` | Filtrar membros ativos excluindo pendentes |
| `src/pages/Matriz.tsx` | Adicionar seção pendentes + mesma deduplicação |
| `src/pages/Welcome.tsx` | Trocar update direto por invoke de edge function |
| `supabase/functions/manage-member/index.ts` | Adicionar ação `accept_invitation` + limpar pending na remoção |
| `src/components/EditMemberDialog.tsx` | Invalidar `pending-invitations` no remove |
| Auth config | Desabilitar HIBP |

### Resultado

- Convidados pendentes aparecem APENAS na seção "Pendentes", não como ativos
- Ao aceitar convite (criar senha), status muda para ativo automaticamente
- Ao remover membro, ele some completamente (de membros E de pendentes)
- Senhas que seguem as regras são sempre aceitas
- Cache sempre atualizado em todas as operações

