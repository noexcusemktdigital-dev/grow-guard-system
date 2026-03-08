

## Plano: Melhorias no Metas & Ranking (Franqueadora + Franqueado)

A base já está implementada (3 abas, hooks de progresso real, troféus). Este plano foca nas lacunas identificadas.

---

### O que já funciona
- Campanhas e Configurações já foram removidas
- 3 abas (Dashboard, Metas, Ranking) na franqueadora
- Seletor de mês (`type="month"`) no formulário de criação
- Progresso real via CRM (faturamento, leads, contratos, contratos_ativos)
- Troféus com desbloqueio real no franqueado

### O que falta implementar

#### 1. Franqueadora — Aba Ranking: troféus por unidade + time interno

**Problema atual**: O Ranking só mostra uma lista de posições. Não exibe os troféus de cada unidade nem o time interno da matriz.

**Solução**: Expandir `renderRanking()` em `MetasRanking.tsx`:
- Adicionar seção **"Troféus da Rede"**: para cada unidade, mostrar quais dos 6 troféus estão desbloqueados (ícones com estado locked/unlocked)
- Criar hook ou função que chama `useTrophyProgress` passando o `orgId` de cada unidade (ou uma versão batch)
- Adicionar seção **"Time Interno"**: usar `useOrgMembers()` para listar membros da matriz com métricas individuais (leads atribuídos, contratos fechados) via `goalProgress` filtrado por `assigned_to`

#### 2. Franqueadora — Aba Metas: gestão completa

**Problema atual**: Só tem criação. Falta editar, arquivar e ver detalhes.

**Solução**: Em `MetasRanking.tsx`:
- Adicionar botão de menu (3 dots) em cada card de meta com opções: **Editar** e **Arquivar**
- Reutilizar o Dialog de criação em modo edição (preencher campos com valores existentes)
- Usar `updateGoal` e `archiveGoal` já existentes no `useGoalMutations()`

#### 3. Franqueado — Dashboard básico

**Problema atual**: Tem apenas Metas + Troféus, sem visão geral.

**Solução**: Em `FranqueadoMetasRanking.tsx`:
- Adicionar aba **"Visão Geral"** como default, com KPIs: Metas Ativas, Atingimento Médio, Troféus Desbloqueados, Dias Restantes
- Manter abas Metas do Mês e Troféus como estão

---

### Arquivos

| Arquivo | Ação |
|---------|------|
| `src/pages/MetasRanking.tsx` | Expandir Ranking (troféus por unidade + time interno), adicionar editar/arquivar nas metas |
| `src/pages/franqueado/FranqueadoMetasRanking.tsx` | Adicionar aba Visão Geral com KPIs |
| `src/hooks/useTrophyProgress.ts` | Adicionar parâmetro opcional `orgId` para consultar troféus de outras orgs (rede) |

