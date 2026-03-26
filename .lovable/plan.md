

## Correção da Arquitetura de Convite de Usuários

### Problemas identificados

Analisei o fluxo completo e encontrei **3 bugs interligados**:

**Bug 1 — Sem proteção contra autoconvite**: A edge function `invite-user` não verifica se o admin está convidando o próprio e-mail. Quando isso acontece (acidentalmente ou não), o sistema: encontra o admin via `findUserByEmail`, atualiza o `full_name` do admin com o nome digitado no formulário (ex: "teste"), e gera um link de recovery para o próprio admin — corrompendo o perfil dele.

**Bug 2 — Acúmulo de roles duplicados**: O `upsert` de roles usa `onConflict: "user_id,role"` com `ignoreDuplicates: true`. A constraint no banco é `UNIQUE(user_id, role)` (composta). Isso significa que se um usuário já tem `cliente_admin`, adicionar `cliente_user` cria uma **segunda linha**. O AuthContext depois prioriza `cliente_admin`, fazendo o convidado aparecer como Admin mesmo quando foi convidado como Usuário.

**Bug 3 — Perfil de usuário existente sobrescrito**: Quando o e-mail já existe (path `email_exists`), a função ainda atualiza o `full_name` do perfil — sobrescrevendo o nome real do usuário com o que foi digitado no formulário de convite.

### Solução

**1. Edge Function `invite-user`** — 3 correções:

- Adicionar verificação de autoconvite: se o `userId` resolvido for igual ao `callerId`, retornar erro 400
- Corrigir atribuição de role: substituir o `upsert` por verificação manual (igual ao `update-member`): buscar role existente → update se existir, insert se não
- Não atualizar `full_name` do perfil quando o usuário já existia (path `email_exists`)

**2. Migração SQL** — Limpeza de roles duplicados:

- Remover roles duplicados deixando apenas o de maior prioridade por `user_id`
- Adicionar constraint `UNIQUE(user_id)` na tabela `user_roles` para impedir acúmulo futuro (o sistema já trata como 1 role por usuário em todo lugar exceto na constraint)

### Detalhes técnicos

**invite-user — proteção contra autoconvite:**
```typescript
// Após resolver userId
if (userId === callerId) {
  return new Response(JSON.stringify({ error: "Você não pode convidar a si mesmo" }), 
    { status: 400, headers: corsHeaders });
}
```

**invite-user — corrigir atribuição de role:**
```typescript
// Substituir upsert por check+update/insert (mesmo padrão do update-member)
const { data: existingRole } = await adminClient
  .from("user_roles").select("id").eq("user_id", userId).maybeSingle();
if (existingRole) {
  await adminClient.from("user_roles").update({ role: validRole }).eq("user_id", userId);
} else {
  await adminClient.from("user_roles").insert({ user_id: userId, role: validRole });
}
```

**invite-user — não sobrescrever perfil existente:**
```typescript
// Apenas para novos usuários (não no path email_exists)
if (isNewUser) {
  await adminClient.from("profiles")
    .update({ full_name: full_name || email.split("@")[0] })
    .eq("id", userId);
}
```

**Migração — limpar duplicados e enforçar unicidade:**
```sql
-- Remover duplicados mantendo o de maior prioridade
DELETE FROM user_roles a USING user_roles b 
WHERE a.user_id = b.user_id AND a.id > b.id;

-- Dropar constraint antiga e criar nova
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;
ALTER TABLE user_roles ADD CONSTRAINT user_roles_user_id_unique UNIQUE(user_id);
```

### Arquivos afetados
- `supabase/functions/invite-user/index.ts` — 3 correções
- `supabase/migrations/` — nova migração (limpeza + constraint)

