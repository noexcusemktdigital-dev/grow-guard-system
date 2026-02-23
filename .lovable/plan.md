
# Alerta de Consumo de Tokens para o Usuario Final

## Contexto

O usuario final (cliente SaaS) nao tem acesso ao Lovable. Os tokens sao registrados na tabela `ai_conversation_logs` (coluna `tokens_used`) e os creditos ficam na tabela `credit_wallets` (coluna `balance`). Atualmente, o saldo de creditos aparece na pagina "Plano e Creditos" mas **nao existe nenhum alerta** quando o consumo esta alto.

## Estrategia

Criar um sistema de alertas em 3 camadas, tudo dentro do proprio app:

1. **Banner global** no layout do cliente quando os creditos atingem niveis criticos
2. **Card de consumo** na pagina de Plano e Creditos com grafico de uso por modulo
3. **Alerta na aba Agentes IA** do Dashboard mostrando tokens consumidos vs limite

## Regras de Alerta

| Nivel | Condicao | Visual |
|-------|----------|--------|
| Normal | Saldo > 30% do plano | Nenhum alerta |
| Atencao | Saldo entre 10% e 30% | Banner amarelo + badge no menu |
| Critico | Saldo <= 10% | Banner vermelho persistente |
| Zerado | Saldo = 0 | Banner vermelho + funcoes IA bloqueadas (ja existe via FeatureGate) |

## Implementacao

### 1. Hook `useCreditAlert` (novo)

Centraliza a logica de calculo do nivel de alerta:
- Recebe dados de `useClienteWallet` e `useClienteSubscription`
- Calcula percentual de creditos restantes com base no plano ativo
- Retorna `{ level: "normal" | "warning" | "critical" | "zero", percent, balance, total }`

### 2. Componente `CreditAlertBanner` (novo)

Banner fino no topo do layout do cliente:
- **Atencao (amarelo)**: "Voce tem X% dos creditos restantes. Considere fazer upgrade."
- **Critico (vermelho)**: "Creditos quase esgotados! Apenas X creditos restantes."
- **Zerado**: "Creditos esgotados. Funcoes de IA estao pausadas."
- Botao "Ver Plano" que redireciona para `/cliente/plano-creditos`
- Pode ser dispensado temporariamente (volta apos 24h ou novo login)

### 3. Card de Consumo na pagina Plano e Creditos

Adicionar um card novo mostrando:
- Grafico de barras horizontal com consumo por modulo (dados de `ai_conversation_logs` agrupados por `agent_id`)
- Total de tokens usados no periodo atual
- Barra de progresso com cores dinamicas (verde > amarelo > vermelho)

### 4. Badge no menu lateral

No `ClienteSidebar`, exibir um ponto vermelho ou badge numerico ao lado de "Plano e Creditos" quando o nivel for `warning` ou `critical`.

## Arquivos a criar/editar

| Arquivo | Acao |
|---------|------|
| `src/hooks/useCreditAlert.ts` | **Criar** -- hook com logica de niveis |
| `src/components/cliente/CreditAlertBanner.tsx` | **Criar** -- banner de alerta |
| `src/components/ClienteLayout.tsx` | **Editar** -- inserir banner acima do conteudo |
| `src/components/ClienteSidebar.tsx` | **Editar** -- badge no item "Plano e Creditos" |
| `src/pages/cliente/ClientePlanoCreditos.tsx` | **Editar** -- card de consumo por modulo |

## Detalhes Tecnicos

- O hook `useCreditAlert` usa os dados ja carregados de `useClienteWallet` e `useClienteSubscription`, sem queries adicionais
- O percentual e calculado como `(balance / totalCreditsDePlano) * 100`
- Os planos ja estao definidos no array `PLANS` em `ClientePlanoCreditos.tsx` -- extrair para constante compartilhada
- O banner usa `localStorage` para guardar timestamp de dismiss, respeitando 24h
- O card de consumo faz uma query em `ai_conversation_logs` agrupando `SUM(tokens_used)` por agente, reusando o pattern ja existente no Dashboard
- Nao precisa de migracao no banco -- todos os dados necessarios ja existem
