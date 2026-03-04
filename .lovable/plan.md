

# Conversas WhatsApp em Tempo Real

## Diagnóstico
O sistema já tem Realtime habilitado para `whatsapp_messages` e `whatsapp_contacts`, e uma subscription em `ClienteChat.tsx` (linha 178-195). Porém há problemas:

1. **Listener de contatos só escuta `UPDATE`** — novos contatos criados pelo webhook (`INSERT`) não aparecem até refresh manual
2. **Closure stale de `selectedContactId`** — o callback captura o valor no momento da criação do channel; ao trocar de contato, o channel é recriado (gera flickering e gaps)
3. **Sem refetch periódico** — se o Realtime desconectar silenciosamente, as conversas ficam paradas
4. **Sem notificação sonora** — novas mensagens inbound não tocam som

## Mudanças

### 1. Corrigir subscription Realtime (`ClienteChat.tsx`)
- Trocar `event: "UPDATE"` para `event: "*"` no listener de `whatsapp_contacts` para capturar INSERT+UPDATE+DELETE
- Usar `useRef` para `selectedContactId` no callback (evitar closure stale sem recriar channel)
- Remover `selectedContactId` do array de dependências do useEffect — o channel fica estável

### 2. Adicionar refetch automático por intervalo
- Adicionar `refetchInterval: 15000` (15s) no `useWhatsAppContacts` hook para garantir atualização mesmo se Realtime desconectar
- Adicionar `refetchInterval: 10000` no `useWhatsAppMessages` para a conversa ativa

### 3. Som de nova mensagem
- No callback de Realtime para `whatsapp_messages`, se o evento for INSERT e direction for `inbound`, tocar `playSound("notification")`

### 4. Atualizar contato selecionado ao vivo
- Quando o Realtime atualiza contatos, garantir que o `selectedContact` (derivado de `contacts`) reflita os novos dados (já faz via useMemo, mas o invalidate precisa estar correto)

## Arquivos

| Arquivo | Mudança |
|---------|---------|
| `src/pages/cliente/ClienteChat.tsx` | Fix Realtime subscription (*, useRef, som) |
| `src/hooks/useWhatsApp.ts` | Adicionar refetchInterval nos queries |

