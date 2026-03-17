

## Plano: Corrigir precisão do drag-and-drop nos Kanbans CRM

### Problema
O `DragOverlay` do `@dnd-kit/core` não segue o cursor com precisão. Isso acontece porque o overlay é renderizado sem `dropAnimation` configurada corretamente ou sem a propriedade `modifiers` para ancorar ao cursor.

### Solução
Adicionar o modifier `snapCenterToCursor` (do `@dnd-kit/modifiers`) ao `DragOverlay` em todos os 4 Kanbans. Isso faz o overlay seguir exatamente o centro do cursor durante o arraste.

### Arquivos a editar

| Arquivo | Mudança |
|---------|---------|
| `src/pages/franqueado/FranqueadoCRM.tsx` | Importar `snapCenterToCursor` de `@dnd-kit/modifiers` e adicionar `modifiers={[snapCenterToCursor]}` no `<DragOverlay>` |
| `src/pages/cliente/ClienteCRM.tsx` | Mesmo ajuste |
| `src/pages/CrmExpansao.tsx` | Mesmo ajuste |
| `src/components/atendimento/AtendimentoKanban.tsx` | Mesmo ajuste |

### Exemplo da mudança
```tsx
import { snapCenterToCursor } from "@dnd-kit/modifiers";

// No DragOverlay:
<DragOverlay dropAnimation={null} zIndex={100} modifiers={[snapCenterToCursor]}>
  {/* overlay card */}
</DragOverlay>
```

Isso garante que o card arrastado segue o cursor em tempo real com precisão em todos os Kanbans do sistema.

