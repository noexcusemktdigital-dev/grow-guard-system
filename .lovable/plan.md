

## Plano: Corrigir duplicação de cards e sincronização do Kanban de Atendimento

### Problema raiz

1. **Query key errada**: `useSupportTicketMutations` invalida `["support-tickets"]` no `onSuccess`, mas a página Atendimento usa `useSupportTicketsNetwork` com key `["support-tickets-network"]`. Resultado: após mudar status ou enviar mensagem, a lista **não recarrega**, o card fica na coluna antiga e ao recarregar aparece na nova — gerando "duplicação" visual.

2. **`selectedTicket` é estado local desconectado**: Após mudar o status via Select, o `selectedTicket` mantém o status antigo. O card continua renderizado na coluna antiga do Kanban.

3. **DialogContent sem DialogTitle**: Gera warning de acessibilidade no console.

### Mudanças

| Arquivo | O que muda |
|---------|-----------|
| `src/hooks/useSupportTickets.ts` | `updateTicket.onSuccess` e `sendMessage.onSuccess` também invalidam `["support-tickets-network"]` |
| `src/pages/Atendimento.tsx` | (1) `handleStatusChange` atualiza `selectedTicket` com novo status localmente. (2) Adiciona `useEffect` para sincronizar `selectedTicket` quando `tickets` muda. (3) Adiciona `DialogTitle` no dialog de detalhe. |

### Detalhes

**`useSupportTickets.ts`** — Nas mutações `updateTicket` e `sendMessage`, adicionar:
```ts
onSuccess: () => {
  qc.invalidateQueries({ queryKey: ["support-tickets"] });
  qc.invalidateQueries({ queryKey: ["support-tickets-network"] });
}
```

**`Atendimento.tsx`**:
- `handleStatusChange`: após chamar `updateTicket.mutate`, fazer `setSelectedTicket(prev => prev ? {...prev, status: newStatus} : null)` para atualizar imediatamente o estado local
- Adicionar `useEffect` que sincroniza `selectedTicket` com os dados atualizados da query quando `tickets` muda
- Envolver o conteúdo do dialog de detalhe com `<DialogHeader><DialogTitle>` para eliminar o warning

