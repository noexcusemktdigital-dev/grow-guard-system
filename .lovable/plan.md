

# Corrigir Integração Google Agenda para Todos os Portais

## Problemas Identificados

1. **`google-calendar-sync` hardcoda `_portal: "saas"`** (linha 45) -- Franqueados e Matriz nunca encontram sua organização, recebendo erro "Organização não encontrada"
2. **`google-calendar-sync` exige `client_id`/`client_secret` na tabela `google_calendar_tokens`** (linhas 56-58) -- Mas o `google-calendar-oauth` salva os tokens sem essas colunas. Resultado: sync sempre falha com "Credenciais do Google não configuradas"
3. **Hook `useGoogleCalendarConnect` não envia `portal`** -- O edge function usa `portal || "saas"` como fallback, então Franqueado/Matriz sempre registra como "saas"
4. **Hook `useGoogleCalendarSync` não envia `portal`** -- Mesmo problema no sync

## Correções

### 1. Edge Function `google-calendar-sync/index.ts`
- Aceitar `portal` no body do request e usar na RPC `get_user_org_id`
- Remover a verificação de `tokenRow.client_id` / `tokenRow.client_secret` (as credenciais vêm dos env vars `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`, não da tabela)
- Usar `Deno.env.get("GOOGLE_CLIENT_ID")` e `GOOGLE_CLIENT_SECRET` para refresh de token

### 2. Hook `useGoogleCalendar.ts`
- `useGoogleCalendarConnect`: aceitar parâmetro `portal` e enviá-lo no body
- `useGoogleCalendarSync`: aceitar parâmetro `portal` e enviá-lo no body

### 3. Component `GoogleConnectButton.tsx`
- Aceitar prop `portal` (default: detectar automaticamente pelo pathname)
- Passar `portal` para o hook

### 4. Páginas de Agenda (3 arquivos)
- `ClienteAgenda.tsx`: passa `portal="saas"` (ou omite, default funciona)
- `FranqueadoAgenda.tsx`: passa `portal="franchise"`
- `Agenda.tsx` (Matriz): passa `portal="franchise"`

## Detalhes Técnicos

**`google-calendar-sync` -- refresh de token corrigido:**
```typescript
// ANTES (quebrado): usa tokenRow.client_id que não existe
const refreshed = await refreshAccessToken(tokenRow.refresh_token, tokenRow.client_id, tokenRow.client_secret);

// DEPOIS: usa env vars
const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!;
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!;
const refreshed = await refreshAccessToken(tokenRow.refresh_token, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
```

**`google-calendar-sync` -- portal dinâmico:**
```typescript
// ANTES: hardcoded
const { data: orgId } = await serviceClient.rpc("get_user_org_id", { _user_id: userId, _portal: "saas" });

// DEPOIS: dinâmico
const { action, event, portal } = await req.json();
const { data: orgId } = await serviceClient.rpc("get_user_org_id", { _user_id: userId, _portal: portal || "saas" });
```

## Arquivos Modificados
1. `supabase/functions/google-calendar-sync/index.ts` -- fix portal + fix credenciais
2. `src/hooks/useGoogleCalendar.ts` -- aceitar e enviar portal
3. `src/components/agenda/GoogleConnectButton.tsx` -- aceitar prop portal, auto-detect
4. `src/pages/franqueado/FranqueadoAgenda.tsx` -- passar portal="franchise"
5. `src/pages/Agenda.tsx` -- passar portal="franchise"

