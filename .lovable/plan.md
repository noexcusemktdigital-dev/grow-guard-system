

# Corrigir redirect_uri_mismatch — Google Calendar OAuth

## Problema
O frontend envia `redirect_uri = window.location.origin + pathname` (ex: `https://grow-guard-system.lovable.app/cliente/agenda`). Essa URL precisa estar cadastrada no Google Cloud Console, mas muda conforme a página e o domínio (preview vs published).

## Solução
Usar a **edge function como callback fixo**. O Google redireciona para a edge function (GET), ela troca o code por tokens e depois redireciona o usuário de volta para o frontend.

```text
Frontend → Google OAuth (redirect_uri = edge function URL)
Google → Edge Function GET ?code=...&state=...
Edge Function troca code → salva tokens → redireciona para frontend
```

## Alterações

### 1. Edge Function `google-calendar-oauth`
- A `redirect_uri` será **fixa**: `{SUPABASE_URL}/functions/v1/google-calendar-oauth`
- No `get_auth_url`: o `state` carregará `userId + origin` (base64) para saber para onde redirecionar depois
- Adicionar handler **GET** que:
  1. Recebe `?code=...&state=...`
  2. Troca o code por tokens (usando a mesma redirect_uri fixa)
  3. Salva tokens no banco
  4. Redireciona (302) o usuário para `{origin}/cliente/agenda?google_connected=true`

### 2. Frontend (`GoogleConnectButton.tsx`)
- Não enviar mais `redirect_uri` — a edge function usa a fixa
- O hook `useGoogleCalendarConnect` passa apenas `action: "get_auth_url"` + `origin` (para o redirect de volta)

### 3. Hook (`useGoogleCalendar.ts`)
- `useGoogleCalendarConnect`: enviar `origin` em vez de `redirect_uri`
- Remover `redirect_uri` do `exchange_code` (não é mais chamado pelo frontend — a edge function faz tudo no callback GET)
- Manter `useGoogleCalendarExchangeCode` mas simplificado (ou remover, já que o GET handler faz a troca)

### 4. Páginas (`ClienteAgenda.tsx`, `Agenda.tsx`)
- Em vez de detectar `?code=` e chamar `exchange_code`, detectar `?google_connected=true` e mostrar toast de sucesso + invalidar query

### 5. Google Cloud Console (ação do usuário)
- Cadastrar **uma única** URI autorizada: `https://gxrhdpbbxfipeopdyygn.supabase.co/functions/v1/google-calendar-oauth`

## Configuração necessária no `config.toml`
- A edge function precisa de `verify_jwt = false` para aceitar o GET do Google (sem Authorization header)

## Resumo
Uma única URI fixa resolve o mismatch para qualquer domínio (preview, published, custom domain). O fluxo fica mais robusto e o usuário só precisa cadastrar uma URL no Google Cloud Console.

