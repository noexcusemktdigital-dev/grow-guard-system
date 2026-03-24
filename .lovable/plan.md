

# Diagnóstico Completo — Criação de Contas, Vínculo e Gestão de Usuários

## Arquitetura Atual

O sistema opera em 3 portais com isolamento de sessão via `storageKey` dinâmico (`noe-saas-auth` vs `noe-franchise-auth`), dois clientes Supabase (`src/lib/supabase.ts` e `src/integrations/supabase/client.ts`), e uma Edge Function central `invite-user` compartilhada entre todos os portais.

```text
┌─────────────────────────────────────────────────────────┐
│                    Fluxos de Criação                     │
├──────────────┬───────────────────┬───────────────────────┤
│  FRANQUEADORA │    FRANQUEADO     │       CLIENTE SaaS    │
│ (Matriz.tsx)  │ (FranqConfig.tsx) │  (SaasAuth.tsx)       │
│  invite-user  │  invite-user      │  signUp + signup-saas │
│  role: admin  │  role: franq/user │  role: cliente_admin  │
└──────┬───────┴────────┬──────────┴──────────┬────────────┘
       │                │                     │
       ▼                ▼                     ▼
   invite-user EF    invite-user EF      signup-saas EF
   (cria user +      (cria user +        (cria org +
    membership +      membership +         subscription +
    role + email)     role + email)        wallet + role)
```

---

## BUGS IDENTIFICADOS (7)

### BUG 1 — `invite-user`: listUsers limitado a 50 registros
**Gravidade: Alta**
Linha 145 de `invite-user/index.ts`:
```javascript
const { data: { users } } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 50 });
const existing = users?.find((u) => u.email === email);
```
Se o sistema tiver mais de 50 usuários e o e-mail existente estiver além da primeira página, o convite falhará com "Usuário existe mas não foi encontrado na listagem". Deve usar `getUserByEmail` ou paginação.

### BUG 2 — `update-member`: deleta `user_roles` globalmente
**Gravidade: Alta**
Linha 46 de `update-member/index.ts`:
```javascript
await admin.from("user_roles").delete().eq("user_id", user_id);
```
Ao remover um membro de uma organização, apaga TODOS os roles do usuário — mesmo que ele pertença a outra organização. Se um usuário for membro de 2 orgs, remover de uma apaga o role usado na outra.

### BUG 3 — `org_team_memberships` delete usa `organization_id` mas a tabela provavelmente não tem essa coluna
**Gravidade: Média**
Linha 45 de `update-member/index.ts`:
```javascript
await admin.from("org_team_memberships").delete().eq("user_id", user_id).eq("organization_id", organization_id);
```
A tabela `org_team_memberships` tem colunas `team_id` e `user_id` — não `organization_id`. O filtro por `organization_id` silenciosamente não deleta nada, deixando registros órfãos de team membership.

### BUG 4 — `invite-user`: redirect hardcoded para `/acessofranquia`
**Gravidade: Média**
Linha 177: O link de recuperação redireciona SEMPRE para `/acessofranquia`, mesmo quando o convite é para o portal SaaS (cliente). Um cliente convidado recebe um link que leva ao login da franquia, não do SaaS (`/app`).

### BUG 5 — `signup-saas`: não tem autenticação do chamador
**Gravidade: Média**
A função `signup-saas` aceita qualquer `user_id` no body sem validar quem está chamando. Qualquer requisição com o anon key pode provisionar organizações para qualquer user_id. Na prática o risco é baixo porque requer um user_id válido, mas viola o princípio de menor privilégio.

### BUG 6 — Fallback de role no `AuthContext` mascara problemas
**Gravidade: Baixa**
Linhas 128-129: Se o fetch de roles falhar por timeout, o sistema atribui `cliente_admin` ou `franqueado` como fallback. Isso pode dar acesso administrativo indevido a um usuário que deveria ser `cliente_user`.

### BUG 7 — `useOrgMembers` não retorna e-mail
**Gravidade: Baixa**
Linha 54: `email: ""` — o hook retorna string vazia para email porque `auth.users` não é acessível via client SDK. Os administradores não conseguem ver o e-mail dos membros na interface de gestão.

---

## MELHORIAS IDENTIFICADAS (5)

### MELHORIA 1 — Roles devem ser vinculados à organização, não globais
A tabela `user_roles` tem `(user_id, role)` sem referência à organização. Um usuário com múltiplas organizações (ex: admin de franquia E cliente SaaS) não pode ter roles diferentes por org. A solução ideal é mover role para `organization_memberships.role` ou adicionar `organization_id` em `user_roles`.

### MELHORIA 2 — Link de convite deveria ser contextual
O `invite-user` deve receber um parâmetro `portal` ou derivar do tipo da organização para gerar o `redirectTo` correto (`/app` para SaaS, `/acessofranquia` para franquia).

### MELHORIA 3 — Plano de limites deveria checar na Franqueadora/Franqueado
O `invite-user` valida limite de usuários apenas via `subscriptions`, que existe para orgs tipo `cliente`. Franqueadoras e Franqueados não têm subscription — o limite fica `planLimits[undefined] ?? 10`, aplicando 10 como fallback arbitrário.

### MELHORIA 4 — Email do membro acessível na UI
Criar uma RPC `get_org_members_with_email` (SECURITY DEFINER) que cruza `organization_memberships` com `auth.users` para retornar emails, evitando o problema do BUG 7.

### MELHORIA 5 — Super admin check na remoção deveria ser scoped
Em `update-member`, a verificação do "último super_admin" conta TODOS os super_admins globais, não os da organização atual. Deveria filtrar por `organization_memberships` da org em questão.

---

## PLANO DE CORREÇÃO

### Fase 1: Bugs Críticos (invite-user + update-member)

1. **`invite-user/index.ts`**: Substituir `listUsers` por busca filtrada ou iteração paginada para encontrar usuários existentes
2. **`invite-user/index.ts`**: Derivar `redirectTo` do tipo da organização (SaaS → `/app`, franchise → `/acessofranquia`)
3. **`update-member/index.ts`**: Corrigir deleção de roles para ser scoped à organização (deletar apenas se não pertence a outra org)
4. **`update-member/index.ts`**: Corrigir deleção de team memberships para usar `team_id IN (teams da org)` ao invés de `organization_id`

### Fase 2: Segurança

5. **`signup-saas/index.ts`**: Adicionar validação de que o `user_id` corresponde ao chamador autenticado
6. **`AuthContext.tsx`**: Usar fallback role mais conservador (`cliente_user` ao invés de `cliente_admin`)

### Fase 3: Melhorias de UX

7. **`useOrgMembers.ts`**: Criar RPC para retornar emails dos membros
8. **`invite-user`**: Melhorar limite de usuários para franqueadoras (sem subscription)

### Arquivos Afetados

| Arquivo | Ação |
|---|---|
| `supabase/functions/invite-user/index.ts` | Editar — Bugs 1, 4 |
| `supabase/functions/update-member/index.ts` | Editar — Bugs 2, 3, Melhoria 5 |
| `supabase/functions/signup-saas/index.ts` | Editar — Bug 5 |
| `src/contexts/AuthContext.tsx` | Editar — Bug 6 |
| `src/hooks/useOrgMembers.ts` | Editar — Bug 7 (se RPC criada) |
| Migration SQL | Nova — RPC `get_org_members_with_email` |

