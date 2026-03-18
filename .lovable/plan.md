

# Testes Completos — Início (Dashboard do Cliente)

## Contexto
A tela `ClienteInicio` é o hub principal do portal do cliente. Centraliza KPIs, checklist diário, metas, insights de CRM, gamificação, mensagem do dia, comunicados e próximos passos. Arquivo principal: `src/pages/cliente/ClienteInicio.tsx` (743 linhas).

## Bugs e Problemas Identificados no Código

### 1. Typo na frase padrão (linha 52)
`"Cada lead é uma oportunidade disfarçada. Não deixe nenhuma escapar."` — "nenhuma" deveria ser **"nenhuma → nenhuma"** ... na verdade **"nenhuma"** está errado, o correto é **"nenhuma"**. Peço desculpa: o correto é **"nenhuma → nenhuma"**. Na verdade: `nenhuma` → `nenhuma` — OK, vamos ser claros: o texto diz **"nenhuma"** mas deveria ser **"nenhuma"** — ambos parecem iguais. Relendo: `"Não deixe nenhuma escapar."` — o correto seria **"nenhum"** (referindo-se a "lead", masculino) ou **"nenhuma"** (referindo-se a "oportunidade", feminino). A concordância com "oportunidade" está correta. Sem bug aqui.

### 2. `prevMonthEnd` é inútil (linha 150)
```typescript
const prevMonthEnd = subMonths(monthStart, 0); // = monthStart — sem efeito
```
Isso faz `prevMonthEnd === monthStart`, o que funciona acidentalmente como delimitador correto, mas é confuso e deveria ser simplesmente `monthStart`.

### 3. AnimatedCounter nunca é usado (linhas 81-104)
O componente `AnimatedCounter` está definido mas **nunca chamado** na renderização. Os KPIs usam valores pré-formatados como strings. Código morto que pode ser removido.

### 4. Checklist sem geração automática
O dashboard mostra "Tarefas do Dia" do `client_checklist_items` filtrado por data de hoje. Se não houver itens gerados para hoje (via `generate-daily-checklist`), a seção fica vazia com "Nenhuma tarefa pendente" sem CTA para gerar/criar tarefas manualmente.

### 5. Gráfico de receita vazio sem feedback visual
Quando `wonThisMonth` está vazio, o `AreaChart` renderiza um gráfico com todos os valores zerados sem nenhuma mensagem orientando o usuário (ex: "Feche vendas no CRM para ver receita aqui").

### 6. Daily Score: peso do CRM é fraco
A fórmula do Daily Score (linha 271-276) usa `thisMonthLeads.length * 5`, significando que com 20 leads o score de CRM já atinge 100%. Isso não reflete atividade diária real — poderia usar leads/atividades criados **hoje**.

### 7. `backdrop-blur-sm` na hero (linha 330)
A mensagem do dia dentro do hero usa `bg-background/40 ... backdrop-blur-sm`, que pode contribuir para problemas de performance visual similares ao strobe dos Scripts.

### 8. Próximos Passos só para Admin
A seção "Próximos Passos" (Connect WhatsApp, Create Agent, Configure Goals) só aparece para admins (`isAdmin && nextSteps.length > 0`). Usuários normais (cliente_user) não recebem guidance de onboarding.

### 9. Sem `staleTime` em múltiplas queries
As queries de leads, goals, checklist, gamification, WhatsApp, agents, etc. não têm `staleTime`, causando refetches desnecessários e potencial flicker ao navegar de/para a página.

## Melhorias Propostas

| # | Correção/Melhoria | Impacto |
|---|---|---|
| 1 | Limpar `prevMonthEnd` → usar `monthStart` diretamente | Clareza de código |
| 2 | Remover `AnimatedCounter` (código morto) | Limpeza |
| 3 | Empty state no gráfico de receita com CTA para CRM | UX |
| 4 | Empty state no checklist com botão "Gerar Checklist" | UX |
| 5 | Remover `backdrop-blur-sm` da mensagem do dia | Performance |
| 6 | Ajustar Daily Score para usar atividade do dia atual | Precisão |
| 7 | Adicionar `staleTime: 2min` nas queries principais | Performance/Flicker |
| 8 | Mostrar "Próximos Passos" simplificados para `cliente_user` | UX |

## Arquivos a alterar
- `src/pages/cliente/ClienteInicio.tsx` — todas as correções acima
- `src/hooks/useCrmLeads.ts` — adicionar `staleTime`
- `src/hooks/useGoals.ts` — adicionar `staleTime`

