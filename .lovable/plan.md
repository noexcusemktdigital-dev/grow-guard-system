

# Corrigir erro "Missing authorization header" no OAuth Meta/Instagram

## Problema
A edge function `social-oauth-meta` constrói o `redirect_uri` usando `SITE_URL` (grow-guard-system.lovable.app), mas as edge functions são hospedadas no domínio do Supabase (`gxrhdpbbxfipeopdyygn.supabase.co`). Quando o Facebook redireciona de volta, ele envia o usuário para o domínio do app Lovable, que não tem a edge function — retornando "Missing authorization header".

O mesmo problema existe em `social-oauth-callback` (linha 161).

## Solução
Trocar `SITE_URL` por `SUPABASE_URL` para construir o `redirect_uri` nas duas funções:

### 1. `supabase/functions/social-oauth-meta/index.ts`
- Linha 63: Usar `Deno.env.get("SUPABASE_URL")` em vez de `SITE_URL` para o redirect URI
- Alterar: `const redirectUri = \`\${siteUrl}/functions/v1/social-oauth-callback\``
- Para: `const redirectUri = \`\${Deno.env.get("SUPABASE_URL")}/functions/v1/social-oauth-callback\``

### 2. `supabase/functions/social-oauth-callback/index.ts`
- Linha 161: Mesmo ajuste para que o redirect_uri no token exchange combine com o usado no início do fluxo
- Alterar: `const redirectUri = \`\${siteUrl}/functions/v1/social-oauth-callback\``
- Para: `const redirectUri = \`\${supabaseUrl}/functions/v1/social-oauth-callback\``

### 3. Atualizar URI no Facebook Developers
Você precisará garantir que a URI de redirecionamento cadastrada no painel do Facebook seja:
`https://gxrhdpbbxfipeopdyygn.supabase.co/functions/v1/social-oauth-callback`

### 4. Deploy das funções alteradas
- `social-oauth-meta`
- `social-oauth-callback`

## Detalhes técnicos
O `SUPABASE_URL` já está disponível automaticamente em todas as edge functions. O `SITE_URL` continua sendo usado apenas para os redirects finais ao frontend (após salvar os tokens).

