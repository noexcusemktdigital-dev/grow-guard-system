

# Pagamentos Automaticos via Asaas — Planos SaaS + Repasse Franqueado

Este plano implementa dois fluxos de cobranca automatica usando a API do Asaas, ambos conectados a mesma conta.

---

## Modulo 1: Pagamento Automatico dos Planos SaaS (Clientes)

### Fluxo completo

1. Cliente se cadastra no `/app/auth` (ja existe)
2. Trial de 7 dias e criado (ja existe via `signup-saas`)
3. Quando o cliente clica em "Escolher Plano" na pagina Plano e Creditos, o sistema:
   - Cria o cliente no Asaas (se ainda nao existe)
   - Cria uma assinatura recorrente (`POST /v3/subscriptions`)
   - Salva o `asaas_customer_id` e `asaas_subscription_id` na organizacao
4. O webhook ja existente processa `PAYMENT_CONFIRMED` e credita automaticamente

### O que sera criado/alterado

| Arquivo | Descricao |
|---------|-----------|
| `supabase/functions/asaas-create-subscription/index.ts` | Nova edge function que cria cliente + assinatura no Asaas |
| `src/pages/cliente/ClientePlanoCreditos.tsx` | Botao "Escolher Plano" chama a edge function em vez de toast |
| Migracao SQL | Adicionar colunas `asaas_subscription_id` e `asaas_billing_type` na tabela `subscriptions` |

### Logica da edge function `asaas-create-subscription`

1. Recebe: `organization_id`, `plan_id`, `billing_type` (CREDIT_CARD, BOLETO ou PIX)
2. Busca a organizacao para pegar dados (nome, email, CNPJ)
3. Se nao tem `asaas_customer_id`, cria cliente via `POST /v3/customers`
4. Cria assinatura via `POST /v3/subscriptions` com:
   - `customer`: ID do cliente Asaas
   - `billingType`: tipo escolhido pelo usuario
   - `value`: preco do plano (197, 497 ou 997)
   - `cycle`: MONTHLY
   - `nextDueDate`: hoje ou proximo dia util
   - `description`: nome do plano
5. Salva `asaas_customer_id` na organizacao e `asaas_subscription_id` na subscription
6. Atualiza status da subscription para `active`

### Alteracao na UI (ClientePlanoCreditos)

- Ao clicar "Escolher Plano", abre um dialog pedindo o metodo de pagamento (Cartao, Boleto ou PIX)
- Ao confirmar, chama `supabase.functions.invoke("asaas-create-subscription", ...)`
- Exibe loading e mensagem de sucesso/erro
- Se for cartao, o Asaas envia link de pagamento por email para o cliente inserir os dados do cartao

---

## Modulo 2: Cobranca Automatica Franqueado para Franqueadora

### Fluxo completo

1. Franqueadora cadastra a unidade franqueada (ja existe em Unidades)
2. Admin vincula o `asaas_customer_id` da unidade franqueada (ja existe o botao "Vincular Asaas")
3. Todo mes, um cron job calcula os valores devidos:
   - Royalties (1% da receita bruta)
   - Taxa de sistema (R$250 fixo)
   - Outros valores configuraveis
4. O sistema cria uma cobranca no Asaas automaticamente
5. Quando o pagamento e confirmado, registra no financeiro da franqueadora como receita

### O que sera criado/alterado

| Arquivo | Descricao |
|---------|-----------|
| `supabase/functions/asaas-charge-franchisee/index.ts` | Nova edge function que gera cobranças para franqueados |
| `supabase/functions/asaas-webhook/index.ts` | Adicionar tratamento para identificar cobranças de franqueado e registrar como receita |
| Migracao SQL | Criar tabela `franchisee_charges` para rastrear cobranças geradas |
| `src/pages/FinanceiroRepasse.tsx` | Exibir cobranças geradas e status de pagamento |

### Nova tabela `franchisee_charges`

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| `id` | uuid | PK |
| `organization_id` | uuid | Franqueadora |
| `franchisee_org_id` | uuid | Unidade franqueada |
| `month` | text | Mes referencia (2026-02) |
| `royalty_amount` | numeric | Valor royalties |
| `system_fee` | numeric | Taxa sistema |
| `total_amount` | numeric | Total cobrado |
| `asaas_payment_id` | text | ID da cobrança no Asaas |
| `status` | text | pending, paid, overdue |
| `created_at` / `paid_at` | timestamps | |

### Logica da edge function `asaas-charge-franchisee`

1. Pode ser chamada manualmente pelo admin ou via cron mensal
2. Para cada franqueado vinculado:
   - Busca receitas do mes via `finance_revenues`
   - Calcula royalties (% configurado em `finance_franchisees.royalty_percentage`)
   - Soma taxa fixa do sistema (R$250)
   - Cria cobrança no Asaas: `POST /v3/payments` com:
     - `customer`: `asaas_customer_id` da organizacao franqueada
     - `billingType`: BOLETO ou PIX
     - `value`: total calculado
     - `dueDate`: dia 10 do mes seguinte
     - `description`: "Royalties + Sistema — Ref. Fev/2026"
   - Registra na tabela `franchisee_charges`

### Alteracao no webhook

- Quando `PAYMENT_CONFIRMED` chega, verificar se o `asaas_payment_id` existe em `franchisee_charges`
- Se sim, atualizar status para `paid` e registrar como receita em `finance_revenues`
- Se nao, continua o fluxo atual (creditos na wallet)

### Alteracao na UI (FinanceiroRepasse)

- Substituir a tela vazia por uma tabela com as cobranças geradas
- Colunas: Franqueado, Mes, Royalties, Sistema, Total, Status, Ações
- Botao "Gerar Cobranças do Mes" para disparar manualmente
- Badge de status (Pendente, Pago, Vencido)

---

## Resumo das entregas

| Item | Tipo |
|------|------|
| Edge function `asaas-create-subscription` | Novo |
| Edge function `asaas-charge-franchisee` | Novo |
| Tabela `franchisee_charges` | Migracao |
| Colunas extras em `subscriptions` | Migracao |
| Pagina `ClientePlanoCreditos.tsx` | Alteracao |
| Pagina `FinanceiroRepasse.tsx` | Alteracao |
| Webhook `asaas-webhook` | Alteracao |
| Config TOML (2 novas functions) | Alteracao |

