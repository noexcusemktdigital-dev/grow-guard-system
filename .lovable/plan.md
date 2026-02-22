

# Corrigir Erro de Build + Finalizar Bloco 5 (Cliente SaaS)

## 1. Corrigir erro de tipagem em ClienteInicio.tsx

O array `kpiValues` usa `as const`, o que restringe o tipo `trend` a apenas `"up" | "neutral"`. Solucao: remover `as const` e tipar explicitamente com `trend: "up" | "down" | "neutral"`.

## 2. Migrar paginas restantes do Cliente SaaS (8 paginas)

As seguintes paginas ainda importam de `@/data/clienteData`:

| Pagina | Mock usado | Hook/Tabela real |
|---|---|---|
| `ClienteCRM.tsx` (1281 linhas) | `getCrmLeads`, `getChatConversations` | `useCrmLeads` + `useCrmFunnels` |
| `ClienteScripts.tsx` (438 linhas) | `getClienteScripts` | `useClienteScripts` (novo, tabela `client_scripts`) |
| `ClienteDisparos.tsx` (362 linhas) | `getWhatsAppDisparos`, `getFollowUpRules`, etc. | `useClienteDispatches` (novo, tabela `client_dispatches`) |
| `ClienteChat.tsx` | `getChatConversations` | Sem tabela de chat ainda -- usar empty state |
| `ClienteAgentesIA.tsx` | `getIAAgents`, `getChatAccounts` | Sem tabela de agentes IA -- usar empty state |
| `ClienteRelatorios.tsx` | `getRelatorioDashboardData` | Calcular de dados reais ou empty state |
| `ClienteConfiguracoes.tsx` | `mockOrganization`, `mockTeamMembers`, `mockPlans` | `useClienteSubscription` + dados de org |
| `ClientePlanoCreditos.tsx` | `mockPlans`, `getCreditConsumptionByModule` | Ja parcialmente migrado, remover ultimo mock |

### Para cada pagina:
1. Remover import de `@/data/clienteData`
2. Usar hooks existentes ou criar hooks simples inline
3. Adicionar loading skeleton
4. Adicionar empty state quando nao ha dados

## 3. Criar hooks faltantes

- `useClienteScripts` -- CRUD para tabela `client_scripts` (ja existe a tabela)
- `useClienteDispatches` -- CRUD para tabela `client_dispatches` (ja existe a tabela)

## 4. Paginas sem tabela backend

- **ClienteChat**: atualmente nao existe tabela de conversas de chat. Mostrar empty state "Em breve" ou manter interface sem dados reais.
- **ClienteAgentesIA**: nao existe tabela de agentes IA. Mostrar empty state "Configure seus agentes IA".

## Detalhes Tecnicos

- `ClienteCRM.tsx` e a maior pagina (1281 linhas). Sera reescrita para usar `useCrmLeads` + `useCrmFunnels` com Kanban drag-and-drop mantido.
- `ClienteScripts.tsx` usara query simples em `client_scripts` filtrando por `organization_id`.
- `ClienteDisparos.tsx` usara query em `client_dispatches`.
- Tipo do `kpiValues.trend` sera `string` em vez de `as const` para permitir comparacao com `"down"`.

