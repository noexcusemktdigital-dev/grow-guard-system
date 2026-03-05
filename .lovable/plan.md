

# Correção: Drag-and-Drop do CRM + Realtime das Conversas

## Bug 1: Drag-and-Drop do CRM não funciona corretamente

**Causa**: O `DndContext` na linha 737 de `ClienteCRM.tsx` não tem a prop `sensors` configurada. Sem sensores com `activationConstraint`, o drag pode não ativar corretamente ou conflitar com cliques normais nos cards. O `AtendimentoKanban.tsx` funciona porque usa `useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))`.

**Correção**: Adicionar `PointerSensor` com `activationConstraint: { distance: 8 }` ao `DndContext` do CRM:
- Importar `PointerSensor, useSensor, useSensors` do `@dnd-kit/core`
- Criar `const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))` 
- Passar `sensors={sensors}` no `<DndContext>`

**Arquivo**: `src/pages/cliente/ClienteCRM.tsx` (linhas 31, ~220, 737)

---

## Bug 2: Realtime das Conversas WhatsApp

**Causa**: A subscription Realtime em `ClienteChat.tsx` (linha 176) filtra `whatsapp_messages` por `organization_id`, mas o filtro Realtime do Supabase só suporta filtros no formato `column=eq.value` e requer que a coluna esteja indexada. O problema é que quando novas mensagens chegam via webhook, a invalidação do query cache pode não estar sincronizando o estado visual em tempo real — especificamente, `queryClient.invalidateQueries` invalida mas não força um refetch imediato se a janela não está focada ou se há um `staleTime` configurado.

**Correção**:
- Trocar `invalidateQueries` por `refetchQueries` para forçar refresh imediato das mensagens do contato selecionado
- Garantir que o canal Realtime tenha um nome único por org para evitar conflitos

**Arquivo**: `src/pages/cliente/ClienteChat.tsx` (linhas 176-191)

---

## Resumo de Alterações

| Arquivo | Mudança |
|---|---|
| `src/pages/cliente/ClienteCRM.tsx` | Adicionar `PointerSensor` com `distance: 8` ao `DndContext` |
| `src/pages/cliente/ClienteChat.tsx` | Usar `refetchQueries` em vez de `invalidateQueries` para mensagens do contato ativo |

