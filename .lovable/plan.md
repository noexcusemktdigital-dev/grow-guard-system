

## Plano — Corrigir convites pendentes e erro de "link expirado" no Welcome

### Problema 1: Convites pendentes não aparecem

A query `usePendingInvitations` filtra com `.gte("expires_at", new Date().toISOString())`, mas o `invite-user` não envia `expires_at` no upsert. No INSERT inicial, o DEFAULT `now() + 7 days` funciona. Porém, ao reenviar (upsert ON CONFLICT UPDATE), o `expires_at` antigo é mantido — e se já passou dos 7 dias, o convite some da lista.

Além disso, a query `invalidateQueries` no `inviteMutation.onSuccess` invalida `["org-members"]` mas **não invalida** `["pending-invitations"]`, então a lista de pendentes não atualiza após enviar o convite.

### Problema 2: "Link expirado" ao criar conta

A página `/welcome` não está mapeada em `getPortalStorageKey()` do `src/lib/supabase.ts`. O path `/welcome` cai no else → `noe-franchise-auth`. Para clientes SaaS que recebem o link com `?portal=saas`, a sessão de recovery é armazenada na storageKey errada, fazendo com que `onAuthStateChange` nunca detecte o evento `PASSWORD_RECOVERY`, o timeout de 15s dispara, e aparece "Link expirado".

### Correções

#### 1. Adicionar `/welcome` ao `getPortalStorageKey()` (`src/lib/supabase.ts`)
Tratar `/welcome` da mesma forma que `/reset-password` — ler o `?portal=` param para determinar a storageKey correta.

#### 2. Corrigir `expires_at` no upsert do `invite-user` (`supabase/functions/invite-user/index.ts`)
Incluir `expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()` no upsert, garantindo que o reenvio renove a validade.

#### 3. Invalidar cache de pendentes após convite (`src/pages/cliente/ClienteConfiguracoes.tsx`)
Adicionar `qc.invalidateQueries({ queryKey: ["pending-invitations"] })` no `onSuccess` do `inviteMutation`.

#### 4. Adicionar policy de UPDATE na `pending_invitations`
A página Welcome tenta atualizar `accepted_at` mas não existe policy de UPDATE. Criar uma migration com policy permitindo UPDATE para membros da org.

### Arquivos

| Arquivo | Ação |
|---------|------|
| `src/lib/supabase.ts` | Mapear `/welcome` para storageKey correta via `?portal=` |
| `supabase/functions/invite-user/index.ts` | Incluir `expires_at` no upsert |
| `src/pages/cliente/ClienteConfiguracoes.tsx` | Invalidar `pending-invitations` no onSuccess |
| Migração SQL | Policy UPDATE para `pending_invitations` |

### Resultado

- Convites pendentes aparecem imediatamente após envio
- Reenvios renovam a validade do convite
- Usuários convidados conseguem criar senha sem erro de "link expirado"
- Welcome page marca `accepted_at` corretamente

