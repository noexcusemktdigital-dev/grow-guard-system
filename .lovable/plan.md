

## Plano: Substituir SaaS por Central de Logs & Erros

### Contexto
A ferramenta "SaaS" será substituída por uma ferramenta de **gestão de erros e logs** do sistema. A tabela `platform_error_logs` já existe com campos adequados (severity, source, function_name, error_message, error_stack, metadata, resolved, etc.) e RLS restrita a super_admin/admin. Os hooks `usePlatformErrors` e `useResolveError` já funcionam.

### Mudanças

#### 1. Sidebar — Renomear item
**Arquivo**: `src/components/FranqueadoraSidebar.tsx`
- Trocar `{ label: "SaaS", icon: Cloud, path: "/franqueadora/saas" }` por `{ label: "Logs & Erros", icon: AlertTriangle, path: "/franqueadora/logs" }`

#### 2. Rota — Atualizar path
**Arquivo**: `src/App.tsx`
- Trocar `path="saas"` por `path="logs"`, mantendo o mesmo componente (renomeado)

#### 3. Reescrever a página — `SaasDashboard.tsx` → `LogsDashboard.tsx`
**Arquivo**: `src/pages/franqueadora/SaasDashboard.tsx` (renomear para LogsDashboard)

Nova estrutura com 3 abas:

**Aba "Visão Geral"** — Dashboard com KPIs:
- Total de erros abertos (não resolvidos)
- Erros críticos abertos
- Erros resolvidos este mês
- Erros nas últimas 24h
- Gráfico de barras: erros por dia (últimos 7 dias)
- Gráfico pizza: distribuição por source

**Aba "Erros"** — Tabela completa (evolução da ErrosTab existente):
- Filtros: severidade, source, status (aberto/resolvido), período
- Busca por mensagem ou função
- Expandir linha para ver stack trace e metadata
- Botão resolver com campo de nota
- Botão excluir erro (com confirmação)

**Aba "Atividade"** — Timeline/log de atividades recentes:
- Lista cronológica dos últimos 50 erros
- Cards compactos com severidade, source, hora e mensagem resumida
- Filtro rápido por severidade

#### 4. Hook — Expandir `useSaasAdmin.ts`
- Adicionar `useDeleteError` mutation (delete from platform_error_logs)
- Adicionar `useErrorStats` query (contagens agrupadas para KPIs)
- Manter `usePlatformErrors` e `useResolveError` existentes
- Remover hooks SaaS não mais usados: `useSaasClients`, `useSaasCostDashboard`, `useAllSupportTickets`, `useAdjustCredits` (ou manter se usados em outro lugar — verificar)

### Arquivos afetados

| Arquivo | Ação |
|---------|------|
| `src/components/FranqueadoraSidebar.tsx` | Renomear SaaS → Logs & Erros, trocar ícone e path |
| `src/App.tsx` | Atualizar rota saas → logs |
| `src/pages/franqueadora/SaasDashboard.tsx` | Reescrever como LogsDashboard com 3 abas |
| `src/hooks/useSaasAdmin.ts` | Adicionar useDeleteError, useErrorStats; limpar hooks não usados |

