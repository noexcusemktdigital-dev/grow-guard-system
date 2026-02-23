

# Finalizar Integração Asaas

## O que ja esta pronto

- Webhook configurado no painel Asaas apontando para a edge function
- Edge function `asaas-webhook` processando `PAYMENT_CONFIRMED` e `PAYMENT_RECEIVED`
- Creditos sendo adicionados automaticamente na wallet da organizacao

## Proximos passos

### 1. Salvar o Token da API como Secret

Armazenar o token `$aact_prod_...` como `ASAAS_API_KEY` de forma segura. Isso permite uso futuro para criar cobranças programaticamente.

### 2. Atualizar a edge function para tratar eventos extras

Adicionar tratamento para os 3 eventos recomendados:

| Evento | Acao |
|--------|------|
| `PAYMENT_OVERDUE` | Registrar transacao de alerta + notificar admin |
| `PAYMENT_REFUNDED` | Debitar creditos da wallet + registrar transacao de estorno |
| `PAYMENT_DELETED` | Registrar log da cobranca cancelada |

### 3. Vincular clientes

Adicionar campo editavel de `asaas_customer_id` na aba "Creditos SaaS" da pagina Unidades, para que o admin possa facilmente vincular cada organizacao-cliente ao seu ID no Asaas (formato `cus_...`).

---

## Detalhes Tecnicos

### Secret

| Nome | Valor |
|------|-------|
| `ASAAS_API_KEY` | Token fornecido pelo usuario |

### Alteracoes de codigo

| Arquivo | Mudanca |
|---------|---------|
| `supabase/functions/asaas-webhook/index.ts` | Adicionar tratamento para `PAYMENT_OVERDUE`, `PAYMENT_REFUNDED`, `PAYMENT_DELETED` |
| `src/pages/Unidades.tsx` | Adicionar campo para editar `asaas_customer_id` por organizacao na aba Creditos SaaS |

### Logica do estorno (PAYMENT_REFUNDED)

1. Buscar organizacao pelo `asaas_customer_id`
2. Calcular creditos a debitar (mesmo calculo: valor x 100)
3. Subtrair do saldo da wallet
4. Registrar transacao tipo `refund` com saldo negativo

### Logica de inadimplencia (PAYMENT_OVERDUE)

1. Buscar organizacao pelo `asaas_customer_id`
2. Inserir notificacao para todos os membros da organizacao
3. Registrar transacao informativa (sem alterar saldo)

### Campo asaas_customer_id na UI

Adicionar um botao "Vincular Asaas" em cada linha da tabela de Creditos SaaS, abrindo um dialog para inserir o ID `cus_...` e salvar na coluna `asaas_customer_id` da tabela `organizations`.

