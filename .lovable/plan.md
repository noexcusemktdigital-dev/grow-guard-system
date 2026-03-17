

## Plano: Arrastar lead de qualquer lugar do card (não só pelo ícone)

### Problema atual

Nos 3 CRMs (Cliente, Franqueado, Expansão) e no Kanban de Atendimento, o drag-and-drop só funciona clicando no pequeno ícone `GripVertical` (≈14px). Os `{...attributes} {...listeners}` do dnd-kit estão aplicados apenas nesse ícone, tornando difícil arrastar.

### Solução

Mover `{...attributes} {...listeners}` do ícone `GripVertical` para o `div` externo do card (o que já tem `ref={setNodeRef}`). Isso torna o card inteiro arrastável. O `onClick` do card continua funcionando normalmente porque o `PointerSensor` já tem `activationConstraint` que distingue clique de arrasto. O ícone GripVertical permanece como indicador visual.

### Mudanças

| Arquivo | Mudança |
|---------|---------|
| `src/pages/cliente/ClienteCRM.tsx` | Mover `attributes`/`listeners` para o div externo do card |
| `src/pages/franqueado/FranqueadoCRM.tsx` | Idem |
| `src/pages/CrmExpansao.tsx` | Idem |
| `src/components/atendimento/AtendimentoKanban.tsx` | Idem (se aplicável) |

### Código (padrão para todos os arquivos)

**Antes:**
```tsx
<div ref={setNodeRef} style={style} className={`group ${isDragging ? "..." : ""}`}>
  <Card onClick={() => { if (!isDragging) onClick(); }}>
    <CardContent>
      <div {...attributes} {...listeners} className="cursor-grab ...">
        <GripVertical />
      </div>
```

**Depois:**
```tsx
<div ref={setNodeRef} style={style} {...attributes} {...listeners}
     className={`group touch-none ${isDragging ? "..." : ""}`}>
  <Card onClick={() => { if (!isDragging) onClick(); }}>
    <CardContent>
      <div className="cursor-grab ...">
        <GripVertical />
      </div>
```

O `touch-none` no div externo é necessário para que o drag funcione em dispositivos touch. Os botões de ação (menu, temperatura) já têm `e.stopPropagation()` que impede conflito com o drag.

