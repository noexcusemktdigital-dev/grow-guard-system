

# Metas como aba dentro de Plano de Vendas

## Resumo

Mover todo o conteudo da pagina separada `ClienteMetas.tsx` para dentro de `ClientePlanoVendas.tsx` como uma segunda aba. A pagina tera duas abas: **Diagnostico** e **Metas**.

---

## Mudancas

### 1. `ClientePlanoVendas.tsx` -- Adicionar sistema de abas

Usar `<Tabs>` com duas abas:
- **Diagnostico**: conteudo atual da pagina (consultoria interativa, resultados, historico)
- **Metas**: todo o conteudo que esta em `ClienteMetas.tsx` (filtros de escopo, KPIs, graficos, goal cards, historico de metas, dialog nova meta)

O header "Plano de Vendas" fica acima das abas. As abas ficam logo abaixo.

### 2. Remover pagina separada e rota

- Remover rota `/cliente/metas` do `App.tsx`
- Remover import de `ClienteMetas`
- Deletar arquivo `src/pages/cliente/ClienteMetas.tsx`

### 3. Remover "Metas" da sidebar

- Remover o item `{ label: "Metas", icon: BarChart3, path: "/cliente/metas" }` de `vendasSection` em `ClienteSidebar.tsx`

---

## Detalhes Tecnicos

### Arquivos

| Arquivo | Acao |
|---------|------|
| `src/pages/cliente/ClientePlanoVendas.tsx` | Adicionar `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent`, importar hooks e componentes de metas, mover todo o conteudo de `ClienteMetas` para dentro da aba "Metas" |
| `src/pages/cliente/ClienteMetas.tsx` | **DELETAR** |
| `src/components/ClienteSidebar.tsx` | Remover item "Metas" da `vendasSection` |
| `src/App.tsx` | Remover rota `/cliente/metas` e import de `ClienteMetas` |

### Imports adicionais em ClientePlanoVendas

Trazer de `ClienteMetas.tsx`:
- `useActiveGoals`, `useHistoricGoals`, `useGoalMutations` de `useGoals`
- `useGoalProgress` de `useGoalProgress`
- `useCrmTeams` de `useCrmTeams`
- `useCrmTeam` de `useCrmTeam`
- `GoalCard` de `metas/GoalCard`
- `GoalProgressRing` de `metas/GoalProgressRing`
- `BarChart`, `Bar`, `Cell`, `Legend`, `ReferenceLine` de `recharts`

### Layout final

```text
+--------------------------------------------+
| PLANO DE VENDAS                            |
| [Diagnostico]  [Metas]   <-- abas          |
+--------------------------------------------+
|                                            |
|  (conteudo da aba selecionada)             |
|                                            |
+--------------------------------------------+
```

