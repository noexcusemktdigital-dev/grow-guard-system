
## Diagnóstico

O erro não está na conta Google em si. O problema principal é o fluxo atual de OAuth abrindo a autorização do Google a partir do preview embutido da plataforma. O `accounts.google.com` não aceita esse tipo de carregamento e o navegador bloqueia com `ERR_BLOCKED_BY_RESPONSE`.

Também encontrei 2 problemas no fluxo atual:
1. O OAuth nem chega no backend hoje (não há logs da função `ads-oauth-callback`).
2. A scope do Google Ads está incorreta no frontend: o código usa `adwords.readonly`, mas a scope oficial é `https://www.googleapis.com/auth/adwords`.
3. O redirect URI informado antes está desalinhado com o código atual. Hoje o frontend usa `/cliente/trafego-pago?...`, mas a orientação passada foi cadastrar a URL da função backend.

## Plano de correção

### 1. Tirar o OAuth de dentro do preview embutido
Vou ajustar o botão “Conectar Google Ads” para:
- detectar quando o app está rodando embutido
- abrir uma aba/página standalone antes de iniciar o OAuth
- iniciar o Google OAuth apenas nessa janela top-level

Isso evita o bloqueio do `accounts.google.com`.

### 2. Padronizar o callback no backend
Vou mudar o fluxo para o Google redirecionar para uma URL estável do backend, e não mais para a página `/cliente/trafego-pago`.

Novo fluxo:
```text
Cliente clica em Conectar
→ abre aba standalone
→ vai para Google OAuth
→ Google redireciona para ads-oauth-callback
→ backend troca code por token
→ backend salva conexão
→ backend redireciona de volta para /cliente/trafego-pago com status=success
```

Assim:
- fica mais confiável
- precisa cadastrar só uma redirect URI estável no Google
- evita depender de URL dinâmica de preview

### 3. Corrigir a URL OAuth do Google
Vou ajustar o `getOAuthUrl()` para:
- usar a scope oficial `https://www.googleapis.com/auth/adwords`
- enviar `state` com dados mínimos para retorno seguro
- usar a redirect URI do backend

### 4. Atualizar a função `ads-oauth-callback`
A função passará a suportar o callback real do Google via `GET`, além de:
- validar `platform` e `state`
- trocar `code` por token
- buscar a conta acessível
- salvar em `ad_platform_connections`
- redirecionar o usuário de volta para a tela de Tráfego Pago com sucesso ou erro amigável

### 5. Melhorar feedback na interface
Na tela de Tráfego Pago, vou adicionar tratamento visual para:
- “Conexão iniciada em nova aba”
- “Conta conectada com sucesso”
- “Falha na autenticação”
- aviso contextual quando o usuário estiver no preview embutido

## Arquivos envolvidos

- `src/components/trafego/AdConnectionCards.tsx`
- `src/hooks/useAdPlatforms.ts`
- `supabase/functions/ads-oauth-callback/index.ts`

## Detalhes técnicos

- Motivo do erro atual: OAuth do Google sendo disparado a partir de contexto embutido/iframe.
- Scope correta do Google Ads: `https://www.googleapis.com/auth/adwords`
- Redirect URI a cadastrar no Google após a correção:
```text
https://gxrhdpbbxfipeopdyygn.supabase.co/functions/v1/ads-oauth-callback
```
- O backend continuará salvando tokens em `ad_platform_connections`, que já está com RLS habilitado.

## Resultado esperado

Depois da implementação:
- clicar em “Conectar Google Ads” não vai mais abrir a tela bloqueada
- o usuário será levado ao consentimento do Google em contexto permitido
- a conta será salva corretamente após o retorno
- a base ficará pronta para sincronizar métricas e alimentar o dashboard
