

# Corrigir client_id vazio no OAuth do Google Ads

## Problema

A variável `VITE_GOOGLE_ADS_CLIENT_ID` foi adicionada como secret do backend (Edge Functions), mas variáveis `VITE_*` precisam estar no `.env` do frontend para serem acessíveis via `import.meta.env`. Como o `.env` é auto-gerenciado pelo Lovable Cloud, o valor nunca chega ao frontend -- resultando em `client_id=` vazio na URL do Google.

## Solução

Criar uma Edge Function leve (`ads-get-config`) que retorna o `GOOGLE_ADS_CLIENT_ID` para o frontend. Assim o Client ID (que é um valor público) fica disponível sem precisar alterar o `.env`.

### 1. Nova Edge Function: `ads-get-config`
- Lê o secret `GOOGLE_ADS_CLIENT_ID` do ambiente
- Retorna `{ client_id: "..." }` como JSON
- CORS habilitado, sem autenticação obrigatória (Client ID é público)

### 2. Atualizar `getOAuthUrl` em `useAdPlatforms.ts`
- Transformar `getOAuthUrl` em função assíncrona
- Antes de montar a URL, chamar `ads-get-config` para obter o `client_id`
- Cachear o valor para não chamar a cada clique

### 3. Atualizar `AdConnectionCards.tsx`
- Ajustar `handleConnect` para usar `await getOAuthUrl(...)` (agora assíncrono)

## Arquivos envolvidos
- `supabase/functions/ads-get-config/index.ts` (novo)
- `src/hooks/useAdPlatforms.ts` (alterar `getOAuthUrl`)
- `src/components/trafego/AdConnectionCards.tsx` (ajustar chamada async)

