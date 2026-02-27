

## Plano: Corrigir erro 403 no convite de usuarios

### Causa raiz

A edge function `invite-user` usa `userClient.auth.getClaims(token)` para obter o ID do chamador. Esse metodo e instavel na versao do supabase-js usada no Deno runtime -- pode retornar erro silencioso ou um `sub` incorreto, fazendo a verificacao de permissao falhar com "Forbidden" mesmo quando o usuario tem acesso.

A funcao SQL `is_member_or_parent_of_org` funciona corretamente (testada direto no banco e retorna `true`), entao o problema esta exclusivamente na obtencao do caller ID.

### Correcao

Substituir `getClaims` por `getUser()` que e o metodo padrao e confiavel:

**Arquivo**: `supabase/functions/invite-user/index.ts`

Trocar:
```typescript
const userClient = createClient(supabaseUrl, anonKey, {
  global: { headers: { Authorization: authHeader } },
});
const token = authHeader.replace("Bearer ", "");
const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
if (claimsError || !claimsData?.claims) {
  return new Response(JSON.stringify({ error: "Unauthorized" }), { ... });
}
const callerId = claimsData.claims.sub as string;
```

Por:
```typescript
const token = authHeader.replace("Bearer ", "");
const { data: { user }, error: userError } = await adminClient.auth.getUser(token);
if (userError || !user) {
  return new Response(JSON.stringify({ error: "Unauthorized" }), { ... });
}
const callerId = user.id;
```

Usar `adminClient.auth.getUser(token)` com service role key para validar o token e obter o user ID de forma confiavel, eliminando a dependencia do `getClaims` e do `userClient` intermediario.

### Impacto

- Apenas 1 arquivo alterado
- Nenhuma mudanca no banco de dados
- Corrige o convite tanto na Matriz quanto nas Unidades

