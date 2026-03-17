

## Plano: Suporte a Dual-Role (Mesmo email na Franquia e no SaaS)

### Limitação técnica
O sistema de autenticação usa **um único registro por email**. Não é possível ter dois usuários separados com o mesmo email. Porém, **o mesmo usuário pode ter múltiplos roles** (ex: `franqueado` + `cliente_admin`) e múltiplas associações a organizações diferentes.

### Solução: Dual-Role com contexto de portal

O mesmo `auth.user` terá:
- Duas entradas em `user_roles` (ex: `franqueado` e `cliente_admin`)
- Duas entradas em `organization_memberships` (uma para org franqueado, outra para org cliente)
- O sistema escolhe o role e org corretos baseado no portal acessado

### Arquivos a editar

| Arquivo | Mudança |
|---------|---------|
| **DB: `get_user_org_id`** | Receber parâmetro `_portal` (`saas`/`franchise`) e filtrar pela org do tipo correto |
| **`src/hooks/useUserOrgId.ts`** | Passar contexto do portal ao chamar a RPC |
| **`src/contexts/AuthContext.tsx`** | Escolher o role baseado no portal atual (não apenas prioridade global) |
| **`src/lib/portalRoleGuard.ts`** | Permitir passagem quando o user tem role válido para aquele portal (já funciona) |

### Detalhes técnicos

**1. Nova RPC `get_user_org_id` (migration)**
```sql
CREATE OR REPLACE FUNCTION public.get_user_org_id(_user_id uuid, _portal text DEFAULT NULL)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT om.organization_id 
  FROM organization_memberships om
  JOIN organizations o ON o.id = om.organization_id
  WHERE om.user_id = _user_id
    AND (
      _portal IS NULL
      OR (_portal = 'saas' AND o.type = 'cliente')
      OR (_portal = 'franchise' AND o.type IN ('franqueadora', 'franqueado'))
    )
  LIMIT 1
$$;
```

**2. `useUserOrgId.ts`** — detectar portal pela URL e passar como parâmetro:
```ts
const portal = window.location.pathname.startsWith("/cliente") ? "saas" : "franchise";
const { data } = await supabase.rpc("get_user_org_id", { _user_id: user.id, _portal: portal });
```

**3. `AuthContext.tsx`** — escolher role pelo portal atual:
```ts
const isSaas = window.location.pathname.startsWith("/cliente") || window.location.pathname.startsWith("/app");
const portalRoles = isSaas 
  ? roles.filter(r => ["cliente_admin", "cliente_user"].includes(r))
  : roles.filter(r => ["super_admin", "admin", "franqueado"].includes(r));
const topRole = portalRoles[0] || roles[0]; // fallback to any role
```

**4. `portalRoleGuard.ts`** — já funciona corretamente (verifica se user tem role permitido para o portal)

### Fluxo resultante
1. Usuário franqueado acessa `/app` e faz cadastro SaaS → recebe role `cliente_admin` + org cliente
2. Agora tem 2 roles: `franqueado` + `cliente_admin`
3. Ao acessar `/acessofranquia` → sistema usa role `franqueado` e org da franquia
4. Ao acessar `/app` → sistema usa role `cliente_admin` e org do cliente
5. Sessões isoladas (storage keys separados) permitem login simultâneo nos dois portais

