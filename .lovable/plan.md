

# Remover botão de Refresh/Sync do Conversas

## Problema
O botão de refresh (ícone ↻) na lista de conversas é desnecessário — o sistema já espelha as conversas em tempo real via Realtime + polling fallback.

## Alterações

**`src/components/cliente/ChatContactList.tsx`**:
- Remover o import de `RefreshCw`
- Remover `onSync` e `isSyncing` da interface Props e do destructuring
- Remover o bloco `{onSync && (<Button>...</Button>)}` (linhas 92-96)

**`src/pages/cliente/ClienteChat.tsx`**:
- Remover as props `onSync={handleSyncChats}` e `isSyncing={isSyncing}` do `<ChatContactList>`
- Remover a função `handleSyncChats` e o estado `isSyncing` (já que não serão mais usados em nenhum lugar)

O sync automático no `useEffect` de mount continua funcionando normalmente em background — apenas o botão manual é removido.

