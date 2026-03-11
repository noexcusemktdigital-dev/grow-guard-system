

## Plano: Alertas de Créditos e IA para Administradores da Matriz

### Contexto

Atualmente, o dashboard Home da franqueadora (`src/pages/Home.tsx`) exibe alertas inteligentes (tickets urgentes, comunicados críticos, leads parados), mas **não possui nenhum alerta sobre créditos da rede ou uso de IA**. O `useNetworkClientStats` já retorna `total_credits` da rede, mas esse dado não é usado para gerar alertas.

### O que será feito

**1. Novo hook `useNetworkAIUsage`** — Consulta agregada que retorna:
- Total de créditos da rede (todas as orgs clientes)
- Orgs com créditos zerados ou abaixo de 10%
- Total de mensagens IA nas últimas 24h/7d (da tabela `ai_conversation_logs`)
- Tokens consumidos no período (para calcular custo real estimado)

**2. Componente `AICreditsAlertPanel`** — Painel de alertas no Home da franqueadora com:
- Alerta vermelho se alguma org cliente tem créditos **zerados** (IA pausada)
- Alerta amarelo se orgs têm créditos **abaixo de 10%**
- KPI cards: Total créditos rede, msgs IA 24h, custo estimado IA (R$), orgs em risco
- Link direto para o gerenciamento SaaS

**3. Integrar no `smartAlerts` do Home.tsx** — Adicionar alertas de créditos ao sistema de prioridades inteligentes existente, aparecendo como alerta destrutivo quando há orgs com créditos zerados.

**4. Alerta de saldo Lovable (informativo)** — Banner fixo no topo do painel admin lembrando que o saldo Lovable Cloud deve ser monitorado em Settings → Cloud & AI balance, com link para a documentação. Como não é possível consultar o saldo Lovable programaticamente, será um alerta estático/informativo configurável.

### Arquivos

| Arquivo | Ação |
|---|---|
| `src/hooks/useNetworkAIUsage.ts` | Criar — hook com queries agregadas |
| `src/components/home/HomeAICreditsAlert.tsx` | Criar — painel de alertas IA/créditos |
| `src/pages/Home.tsx` | Editar — integrar alertas no smartAlerts e adicionar o painel |

### Dados consultados (já existem no banco)

- `credit_wallets` — saldo por org
- `ai_conversation_logs` — msgs IA com `tokens_used`
- `organizations` — filtro por `parent_org_id` e `type = 'cliente'`
- `subscriptions` — plano ativo para calcular % de créditos restantes

