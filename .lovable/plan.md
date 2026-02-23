

# Controle de Comportamento do Agente + Recarga de Creditos via Asaas

## 3 Problemas a Resolver

### 1. Controle de Quando o Agente Responde

Hoje, toda mensagem recebida dispara o agente automaticamente, sem nenhum filtro. Problemas:
- Contato que voltou depois de semanas recebe resposta da IA como se fosse conversa nova
- Agente pode ficar respondendo infinitamente, gastando tokens
- Nao existe limite de mensagens por conversa

**Solucao: Regras de Engajamento no Agente**

Adicionar configuracoes na aba "Prompt e Objetivos" do AgentFormSheet:

| Regra | Campo | Padrao |
|-------|-------|--------|
| Limite de mensagens por conversa | `max_messages_per_conversation` | 30 |
| Timeout de inatividade (horas) | `inactivity_timeout_hours` | 48 |
| Acao apos timeout | `timeout_action` | "handoff" (ou "restart" ou "ignore") |
| Acao apos limite de mensagens | `limit_action` | "handoff" |
| Horario de funcionamento | `working_hours` | { start: "08:00", end: "18:00", timezone: "America/Sao_Paulo" } |

**Na edge function `ai-agent-reply`:**
- Antes de responder, contar mensagens da conversa e checar se ultrapassou o limite
- Verificar tempo desde a ultima mensagem -- se > timeout, tratar conforme acao configurada
- Verificar horario de funcionamento -- fora do horario, enviar mensagem padrao ou ignorar
- Verificar saldo de creditos da organizacao -- se zerado, nao responde

### 2. Follow-ups e Quebra de Objecao

**Follow-ups automaticos:**

| Campo | Descricao |
|-------|-----------|
| `followup_enabled` | Ativar/desativar follow-up |
| `followup_delay_hours` | Tempo sem resposta para disparar (ex: 24h) |
| `followup_max_attempts` | Maximo de follow-ups (ex: 3) |
| `followup_message_style` | "ai_generated" ou "template" |

A execucao dos follow-ups sera via um **cron job** que roda periodicamente (a cada hora), verifica contatos sem resposta e dispara a IA para gerar a mensagem de follow-up.

**Quebra de objecao:**
- Campo "Objecoes comuns" na aba de Prompt e Objetivos do agente
- A IA usa essas objecoes como parte do system prompt
- Integra com os scripts de objecao ja criados no modulo de Scripts

### 3. Recarga de Creditos via Asaas (Gerenciado pela Franqueadora)

O gerenciamento de creditos dos clientes SaaS sera feito **pela Franqueadora**, com duas vias:

**Via A -- Recarga manual (imediato):**
- Nova secao "Gestao de Creditos SaaS" dentro da area de Unidades da Franqueadora
- O admin da franqueadora visualiza todas as organizacoes-cliente, seus saldos e planos
- Botao "Recarregar Creditos" que incrementa o saldo diretamente
- Historico de transacoes (compras, consumos, bonus) visivel para ambos os lados

**Via B -- Integracao Asaas (fase 2):**
- A integracao Asaas ja esta prevista no modulo de Contratos (campos `asaasCustomerId`, `asaasSubscriptionId` ja existem no sistema)
- Webhook do Asaas notifica pagamento confirmado
- Edge function `asaas-webhook` recebe a confirmacao e automaticamente incrementa `credit_wallets.balance`
- Cada cliente SaaS tera um `asaas_customer_id` vinculado a sua organizacao
- Cobran;as recorrentes (plano mensal) renovam creditos automaticamente
- Compras avulsas de creditos extras tambem sao processadas

**Fluxo completo de billing:**

```text
Cliente paga no Asaas
       |
       v
Webhook Asaas -> Edge Function
       |
       v
Identifica org pelo asaas_customer_id
       |
       v
Incrementa credit_wallets.balance
       |
       v
Registra em credit_transactions
       |
       v
Cliente ve saldo atualizado no app
```

**Na Franqueadora, a tela de gestao mostrara:**
- Lista de organizacoes-cliente com saldo atual, plano e status
- Botao de recarga manual (para casos de pagamento fora do Asaas)
- Historico de todas as transacoes de creditos
- Alertas de clientes com saldo zerado ou critico

---

## Implementacao Tecnica

### Migracao de Banco

Todas as regras de engajamento e follow-up ficam no campo JSONB `prompt_config` da tabela `client_ai_agents` (sem migracao de schema):

```text
prompt_config: {
  system_prompt: "...",
  engagement_rules: {
    max_messages: 30,
    inactivity_timeout_hours: 48,
    timeout_action: "handoff",
    limit_action: "handoff",
    working_hours: { enabled: false, start: "08:00", end: "18:00" }
  },
  followup: {
    enabled: false,
    delay_hours: 24,
    max_attempts: 3,
    style: "ai_generated"
  },
  objections: []
}
```

Nova tabela `credit_transactions`:

```text
credit_transactions
  - id (UUID, PK)
  - organization_id (UUID, NOT NULL)
  - type (TEXT: purchase, consumption, bonus, renewal)
  - amount (INTEGER)
  - balance_after (INTEGER)
  - description (TEXT)
  - created_by (UUID, nullable -- admin que fez recarga manual)
  - metadata (JSONB -- asaas_payment_id, invoice_id, etc)
  - created_at (TIMESTAMPTZ)
```

Adicionar coluna na tabela `organizations` (se existir) ou `subscriptions`:
- `asaas_customer_id` (TEXT, nullable) -- vinculo com Asaas

### Arquivos a Criar/Editar

| Arquivo | Acao |
|---------|------|
| `supabase/functions/ai-agent-reply/index.ts` | **Editar** -- adicionar checagens de limite, timeout, horario, saldo |
| `supabase/functions/agent-followup-cron/index.ts` | **Criar** -- cron job para follow-ups |
| `supabase/functions/recharge-credits/index.ts` | **Criar** -- edge function para recarga manual (usada pela Franqueadora) |
| `supabase/functions/asaas-webhook/index.ts` | **Criar** -- webhook para receber confirmacoes de pagamento do Asaas |
| `src/components/cliente/AgentFormSheet.tsx` | **Editar** -- adicionar secao "Regras de Engajamento" e "Follow-up" na aba Prompt |
| `src/pages/cliente/ClientePlanoCreditos.tsx` | **Editar** -- mostrar historico de transacoes, funcionalizar botao de compra |
| `src/pages/Unidades.tsx` | **Editar** -- adicionar aba/secao "Creditos SaaS" na gestao de unidades-cliente |

### Logica na Edge Function ai-agent-reply

Antes de chamar a IA, verificacoes em ordem:

```text
1. Checar saldo de creditos da org -> se zero, retorna skipped
2. Checar horario de funcionamento -> se fora, envia msg padrao ou ignora
3. Contar mensagens na conversa -> se > max_messages, executa limit_action (handoff)
4. Checar tempo desde ultima msg do contato -> se > timeout, executa timeout_action
5. Se tudo OK -> chama a IA normalmente
6. Apos resposta -> debita tokens de credit_wallets e registra em credit_transactions
```

### Follow-up Cron

O cron job roda a cada hora e:
1. Busca agentes com `followup.enabled = true`
2. Para cada agente, busca contatos onde a ultima mensagem foi do agente (outbound) e o tempo sem resposta >= `followup_delay_hours` e follow-ups enviados < `followup_max_attempts`
3. Gera mensagem de follow-up via IA e envia pelo Z-API
4. Registra o follow-up nos logs e debita creditos

### Webhook Asaas (fase 2)

- Endpoint publico (verify_jwt = false)
- Valida assinatura do webhook do Asaas
- Identifica organizacao pelo `asaas_customer_id`
- Eventos tratados: `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`
- Incrementa saldo e registra transacao

### Gestao pela Franqueadora

Na pagina de Unidades, adicionar uma visao de "Creditos dos Clientes":
- Tabela com: Nome da org, Plano, Saldo atual, Status, Ultima recarga
- Botao "Recarregar" abre dialog com campo de quantidade e descricao
- Chama edge function `recharge-credits` que so aceita roles `super_admin` ou `admin`

