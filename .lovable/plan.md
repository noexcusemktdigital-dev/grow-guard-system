

# Espelhamento completo do WhatsApp — Mensagens históricas

## Problema atual

O sync atual importa **557 contatos** corretamente, mas nenhuma mensagem histórica. Quando o usuário abre uma conversa, vê apenas mensagens capturadas pelo webhook (tempo real). O WhatsApp tem centenas de conversas com histórico que não aparecem no sistema.

## Limitação técnica

O endpoint `GET /chat-messages/{phone}` da Z-API retornou "Does not work in multi device version" anteriormente. No entanto, a documentação oficial mostra esse endpoint como disponível. A abordagem correta é tentar novamente com parâmetros corretos (`amount` para limitar mensagens) e tratar o erro graciosamente caso falhe.

## Solução: Sync de mensagens sob demanda + batch

### 1. Nova edge function `whatsapp-load-history/index.ts`
- Recebe `contactPhone` e `amount` (default 50)
- Chama `GET /chat-messages/{phone}?amount=50` da Z-API
- Converte cada mensagem para o formato `whatsapp_messages` e faz upsert (usando `message_id_zapi` como chave de deduplicação)
- Se o endpoint falhar com erro multi-device, retorna `{ fallback: true }` sem quebrar
- Retorna contagem de mensagens importadas

### 2. Atualizar `whatsapp-sync-chats/index.ts` — Sync parcial de mensagens
- Após criar/atualizar cada contato, buscar as últimas 10 mensagens via `/chat-messages/{phone}?amount=10`
- Processar em lotes de 10 contatos por vez para evitar timeout
- Se o endpoint falhar, continuar normalmente (só contatos, sem mensagens)
- Priorizar contatos com `lastMessageTime` recente (últimos 7 dias)

### 3. Atualizar `ChatConversation.tsx` — Auto-load ao abrir conversa
- Quando o usuário selecionar um contato e a conversa estiver vazia (0 mensagens no DB), disparar automaticamente `whatsapp-load-history` para aquele contato
- Mostrar loading "Carregando histórico..." enquanto busca
- Botão "Carregar mais mensagens" no topo da conversa para buscar mensagens anteriores

### 4. Atualizar `ClienteChat.tsx`
- Passar a instance para o ChatConversation para que ele possa chamar load-history
- Invalidar queries de mensagens após o load

### 5. Webhook — manter `attending_mode: "human"` para novos contatos
- No webhook (`whatsapp-webhook/index.ts`), alterar o default de novos contatos de `"ai"` para `"human"` (agente IA desativado)

### Arquivos
- **Criar**: `supabase/functions/whatsapp-load-history/index.ts`
- **Editar**: `supabase/functions/whatsapp-sync-chats/index.ts` — sync parcial de mensagens recentes
- **Editar**: `supabase/functions/whatsapp-webhook/index.ts` — default `attending_mode: "human"`
- **Editar**: `src/components/cliente/ChatConversation.tsx` — auto-load history + botão carregar mais
- **Editar**: `src/pages/cliente/ClienteChat.tsx` — passar instance ao componente

