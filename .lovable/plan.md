

## Espelhamento completo do WhatsApp — remover filtros restritivos

### Problema
Existem filtros em 3 camadas que impedem o espelhamento completo das conversas do WhatsApp:

1. **`useWhatsApp.ts` (frontend)** — filtra contatos `@lid`, `@broadcast`, `status` na query dos contatos (linhas 109-116)
2. **`whatsapp-webhook/index.ts` (webhook)** — descarta mensagens de contatos `@lid` e broadcasts (linhas 136-143 implicitamente via filtro no frontend)
3. **`whatsapp-sync-chats/index.ts` (sync)** — filtra chats `broadcast` e `status` (linhas 199-205)

O filtro de `@lid` no frontend é o mais prejudicial — contatos do tipo "lid" são contatos legítimos do WhatsApp (lead IDs gerados pelo WhatsApp Business) que deveriam aparecer normalmente.

### Correções

#### 1. `src/hooks/useWhatsApp.ts`
- **Remover o filtro `@lid`** da lista de contatos (linha 112) — contatos lid são conversas legítimas
- **Manter apenas** os filtros de `@broadcast` e `status@broadcast` que são listas de transmissão (não conversas reais)
- **Remover `enabled: !!filterInstanceId`** — permitir carregar contatos mesmo sem filtro de instância (linha 119), usar apenas `!!orgId`

#### 2. `supabase/functions/whatsapp-webhook/index.ts`
- Sem mudanças — o webhook já aceita tudo exceto broadcast/status, que é correto

#### 3. `supabase/functions/whatsapp-sync-chats/index.ts`
- Sem mudanças — já mantém tudo exceto broadcast/status

### Resumo de arquivos
- `src/hooks/useWhatsApp.ts` — remover filtro `@lid`, ajustar `enabled` condition

