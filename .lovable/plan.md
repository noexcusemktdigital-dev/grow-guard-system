

# Sync completo e espelhamento do WhatsApp 554491129613

## Situação atual
- A função `whatsapp-sync-chats` sincroniza **contatos** via `GET /chats` da Z-API (funciona)
- O webhook captura mensagens em tempo real (funciona)
- Problema: novos contatos sincronizados são criados com `attending_mode: "ai"`, mas o agente IA está desativado
- Não há sync automático ao abrir a página — depende de clique manual no botão 🔄

## Mudanças

### 1. Corrigir `whatsapp-sync-chats/index.ts`
- Novos contatos criados com `attending_mode: "human"` (agente IA desativado)
- Adicionar parâmetro opcional `phone` para sincronizar contato específico (ex: 554491129613)

### 2. Sync automático ao abrir o chat (`ClienteChat.tsx`)
- Disparar `handleSyncChats` automaticamente ao montar a página (além do check-status que já existe)
- Isso garante que a lista de contatos está sempre atualizada sem precisar clicar manualmente

### 3. Atualizar contatos existentes com `attending_mode: "ai"` → `"human"` na sync
- Na atualização de contatos existentes, forçar `attending_mode: "human"` quando não há agente ativo

### Arquivos modificados
- `supabase/functions/whatsapp-sync-chats/index.ts` — attending_mode human por padrão
- `src/pages/cliente/ClienteChat.tsx` — sync automático ao montar

