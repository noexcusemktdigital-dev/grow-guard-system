

## Corrigir drag-and-drop do Kanban em todos os CRMs

### Problema

Dois bugs relacionados:

1. **Drop na coluna errada**: O algoritmo `closestCorners` calcula distância pelos 4 cantos do card arrastado, o que frequentemente seleciona a coluna adjacente em vez da que está sob o cursor.
2. **Limite visual de ~7 cards**: As colunas têm `max-h-[calc(100vh-300px)] overflow-y-auto`, mas o droppable fica dentro do scroll container. Quando a área de drop é cortada pelo overflow, o algoritmo `closestCorners` não consegue detectar drops abaixo do fold.

### Solução

**Trocar `closestCorners` por `pointerWithin`** em todos os 4 Kanbans. O `pointerWithin` detecta qual droppable está exatamente sob o ponteiro do mouse, resolvendo ambos os problemas de uma vez.

### Arquivos a modificar (4 arquivos)

1. **`src/pages/franqueado/FranqueadoCRM.tsx`** (linha 30, 466)
   - Trocar import de `closestCorners` para `pointerWithin`
   - Trocar `collisionDetection={closestCorners}` para `collisionDetection={pointerWithin}`

2. **`src/pages/cliente/ClienteCRM.tsx`** (linha 33, 831)
   - Mesma troca

3. **`src/pages/CrmExpansao.tsx`** (linha 31, 467)
   - Mesma troca

4. **`src/components/atendimento/AtendimentoKanban.tsx`** (linha 10, 167)
   - Mesma troca

Cada arquivo: apenas 2 linhas alteradas (import + uso). Zero risco de quebra, mesmo comportamento de handleDragEnd.

