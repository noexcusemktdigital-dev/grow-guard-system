

## Plano — Corrigir eventos não aparecendo no calendário após sincronização Google

### Problema raiz

A edge function `google-calendar-sync` tem o mesmo bug que corrigimos no `google-calendar-oauth`: a chamada `get_user_org_id` na linha 44 não passa `_portal`, o que pode retornar `null` ou o org errado para clientes SaaS. Se `orgId` for `null`, os eventos são inseridos com `organization_id = null` ou simplesmente não são encontrados na busca.

Confirmação: o org `9a3bb183...` (p2y) tem apenas 1 evento manual e **zero eventos com google_event_id**, provando que o pull não importou nada.

### Mudanças

| Arquivo | Ação |
|---------|------|
| `supabase/functions/google-calendar-sync/index.ts` | Adicionar `_portal: "saas"` ao RPC `get_user_org_id` (linha 44). Adicionar validação se `orgId` é null. Adicionar logs de debug para contagem de eventos importados. |
| Deploy | `google-calendar-sync` |

### Detalhe técnico

```typescript
// Antes (linha 44):
const { data: orgId } = await serviceClient.rpc("get_user_org_id", { _user_id: userId });

// Depois:
const { data: orgId } = await serviceClient.rpc("get_user_org_id", { _user_id: userId, _portal: "saas" });
if (!orgId) return jsonRes({ error: "Organização não encontrada" }, 400);
```

Também adicionar `console.log` no resultado do pull para facilitar debug futuro:
```typescript
console.log(`Google sync pull: ${imported} imported, ${googleEvents.length} total from Google, org=${orgId}`);
```

### Fluxo após a correção

1. Usuário conecta Google Calendar (OAuth ok)
2. Clica "Sincronizar" → chama `google-calendar-sync` com `action: "pull"`
3. Function busca org com `_portal: "saas"` → retorna org correta
4. Busca eventos do Google API → insere na tabela `calendar_events` com org correto
5. Frontend recarrega eventos → aparecem no calendário

