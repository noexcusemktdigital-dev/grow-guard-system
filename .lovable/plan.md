

## Plano — Corrigir exclusão de membros + melhorar fluxo de convite + status "Pendente"

### Problemas identificados

1. **Admin não consegue excluir usuários**: A edge function `manage-member` usa `getClaims()` para autenticar o caller, mas essa API pode não estar disponível em todas as versões do SDK do Supabase. Se falhar, retorna "Sessão inválida" silenciosamente (status 200). Além disso, a RPC `get_user_role` aceita parâmetro `_portal` mas o `manage-member` chama sem ele — pode retornar a role errada se o usuário tem roles multi-contexto.

2. **E-mail de convite leva para "Redefinir senha" em vez de "Criar conta"**: O convite atual gera um link de recovery (`type: "recovery"`) que redireciona para `/reset-password`. A experiência diz "Definir minha senha", mas a página diz "Redefinir senha" — confuso para novos usuários.

3. **Sem status "Pendente" para convites**: Não existe rastreamento de convites pendentes. Usuários convidados que nunca logaram aparecem como membros normais.

4. **Sem opção de reenviar convite**: Não há funcionalidade para reenviar o e-mail de convite.

---

### Mudanças

#### 1. Corrigir `manage-member` — autenticação e exclusão

**Arquivo**: `supabase/functions/manage-member/index.ts`

- Substituir `getClaims()` por `getUser()` com o token do header Authorization (mesmo padrão usado em `invite-user` que funciona)
- Passar `_portal` contextual na chamada de `get_user_role` para garantir que a role correta seja retornada

#### 2. Melhorar e-mail de convite — "Criar conta" em vez de "Redefinir senha"

**Arquivo**: `supabase/functions/invite-user/index.ts`

- Manter o fluxo técnico (recovery link), mas alterar o redirect para uma rota dedicada `/welcome` em vez de `/reset-password`
- Alterar o template HTML do e-mail: "Criar minha conta" em vez de "Definir minha senha"

**Novo arquivo**: `src/pages/Welcome.tsx`

- Página dedicada para novos usuários vindos do convite
- Título: "Bem-vindo! Crie sua senha para acessar a plataforma"
- Formulário de nova senha com validação (mesmas regras: 8+ chars, maiúscula, minúscula, número, especial)
- Após definir senha, redireciona para a tela de login com mensagem de sucesso

**Arquivo**: `src/App.tsx` — adicionar rota `/welcome`

#### 3. Rastrear convites pendentes

**Migração SQL**: Criar tabela `pending_invitations`

```sql
CREATE TABLE public.pending_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  invited_by uuid NOT NULL,
  role text NOT NULL DEFAULT 'cliente_user',
  team_ids text[] DEFAULT '{}',
  full_name text,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  UNIQUE(email, organization_id)
);
ALTER TABLE public.pending_invitations ENABLE ROW LEVEL SECURITY;
```

**Arquivo**: `supabase/functions/invite-user/index.ts`

- Após criar o convite com sucesso, inserir registro em `pending_invitations`
- Na rota `/welcome`, ao definir a senha, marcar `accepted_at = now()`

**Arquivo**: `src/hooks/useOrgMembers.ts`

- Buscar também os `pending_invitations` da organização (onde `accepted_at IS NULL` e `expires_at > now()`)
- Retornar com flag `status: "pending"` para diferenciar de membros ativos

#### 4. Exibir status "Pendente" + botão "Reenviar convite"

**Arquivo**: `src/pages/cliente/ClienteConfiguracoes.tsx` — `UsersAndTeamsTab`

- Adicionar seção "Convites Pendentes" abaixo dos usuários
- Cada convite pendente mostra: nome, e-mail, data do convite, badge "Pendente"
- Botão "Reenviar" que chama `invite-user` novamente com os mesmos dados (a edge function já trata `email_exists` e reenvia o link)
- Botão "Cancelar" que remove o registro de `pending_invitations`

#### 5. Ao aceitar convite, remover do pendente

**Arquivo**: `supabase/functions/invite-user/index.ts`

- Se o usuário já existe E já é membro (convite duplicado de reenvio), atualizar `pending_invitations` e reenviar o link de recovery

---

### Resumo de arquivos

| Arquivo | Ação |
|---------|------|
| `supabase/functions/manage-member/index.ts` | Trocar `getClaims` por `getUser`, fix portal param |
| `supabase/functions/invite-user/index.ts` | Redirect para `/welcome`, salvar em `pending_invitations` |
| `src/pages/Welcome.tsx` | Nova página de criação de senha para convidados |
| `src/App.tsx` | Adicionar rota `/welcome` |
| `src/hooks/useOrgMembers.ts` | Incluir convites pendentes na query |
| `src/pages/cliente/ClienteConfiguracoes.tsx` | Seção "Pendentes" com reenvio e cancelamento |
| Migração SQL | Criar tabela `pending_invitations` |

### Resultado esperado

- Admin consegue excluir membros sem erro
- Novos convidados recebem e-mail com "Criar minha conta" e veem página de boas-vindas
- Convites pendentes aparecem na aba Usuários & Times com badge "Pendente"
- Admin pode reenviar ou cancelar convites pendentes

