

## Adicionar "Selecionar toda a coluna" no Kanban de todos os CRMs

### O que será feito

Adicionar um checkbox no header de cada coluna do Kanban que, quando ativado no modo seleção, seleciona/deseleciona todos os leads daquela coluna de uma vez. O checkbox só aparece quando `selectionMode` está ativo.

### Arquivos a modificar (3 arquivos)

**1. `src/pages/cliente/ClienteCRM.tsx`** (linhas ~838-844)
- No header da coluna Kanban, ao lado do Badge de contagem, adicionar um `Checkbox` visível apenas quando `selectionMode === true`
- O checkbox verifica se todos os leads da coluna estão selecionados (checked/indeterminate)
- Ao clicar, adiciona ou remove todos os IDs da coluna do `selectedLeadIds`

**2. `src/pages/CrmExpansao.tsx`** (linhas ~474-480)
- Mesma alteração: checkbox no header da coluna Kanban, visível em modo seleção

**3. `src/pages/franqueado/FranqueadoCRM.tsx`** (linhas ~474-480)
- Mesma alteração: checkbox no header da coluna Kanban, visível em modo seleção

### Lógica do checkbox de coluna

```text
Para cada coluna (stage):
  - stageLeadIds = stageLeads.map(l => l.id)
  - allSelected = stageLeads.length > 0 && stageLeadIds.every(id => selectedLeadIds.has(id))
  - someSelected = stageLeadIds.some(id => selectedLeadIds.has(id))
  
  onClick:
    if (allSelected) → remover todos os stageLeadIds do Set
    else → adicionar todos os stageLeadIds ao Set
```

O checkbox ficará posicionado entre o label da etapa e o Badge de contagem, com estilo discreto (`w-3.5 h-3.5`), e só aparece quando `selectionMode` está habilitado.

