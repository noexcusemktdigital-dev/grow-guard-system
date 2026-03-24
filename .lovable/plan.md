

# Corrigir ordenação da lista de conversas

## Problema
Ao abrir uma conversa, o `unread_count` vai para 0 e o contato "desce" na lista porque a ordenação atual prioriza mensagens não lidas no topo. Isso quebra a experiência — o usuário perde de vista a conversa que acabou de abrir.

## Solução
Remover a priorização por `unread_count` na ordenação. A lista deve ser **puramente cronológica** — ordenada por `last_message_at` (mais recente no topo). Abrir a conversa apenas remove o badge de não lida, sem mudar a posição.

## Alteração

**`src/components/cliente/ChatContactList.tsx`** (linhas 48-56):
- Remover as linhas que comparam `unread_count` na função de sort
- Manter apenas a ordenação por `last_message_at` (descendente)

```typescript
const sortedContacts = useMemo(() => {
  return [...filtered].sort((a, b) => {
    const da = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
    const db = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
    return db - da;
  });
}, [filtered]);
```

Resultado: ordem cronológica fixa, conversa não se move ao ser aberta, apenas perde o badge.

