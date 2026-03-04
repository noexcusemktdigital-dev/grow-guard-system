

# Auditoria Completa: Pagamentos e Financeiro (SaaS, Franqueado, Franqueadora)

## Resultado da Auditoria

Apos revisar todas as edge functions, webhook, hooks e paginas financeiras, o sistema esta **95% completo**. Identifiquei 5 lacunas que precisam ser corrigidas:

---

## Problemas Encontrados

### 1. `asaas-test-connection` — CORS incompleto
O header CORS esta incompleto (`authorization, x-client-info, apikey, content-type`) e nao inclui os headers do Supabase SDK (`x-supabase-client-platform`, etc). Isso pode causar falha silenciosa no navegador. Alem disso, a funcao nao tem autenticacao — qualquer pessoa pode testar a conexao.

### 2. Webhook nao trata `PAYMENT_UPDATED`
O Asaas envia `PAYMENT_UPDATED` quando o status de um pagamento muda (ex: de PIX gerado para expirado). Atualmente ignorado. Isso significa que pagamentos PIX expirados nao atualizam o status local.

### 3. Webhook nao trata `PAYMENT_CREDIT_CARD_CAPTURE_REFUSED`
Para assinaturas com cartao de credito, se a cobranca recorrente falhar, o Asaas envia este evento. Sem tratamento, a assinatura pode expirar sem notificacao.

### 4. Sem cancelamento de assinatura Asaas
Nao existe edge function para cancelar assinaturas no Asaas (`DELETE /subscriptions/{id}`). Se o usuario quiser cancelar, so muda o status local sem refletir no Asaas — as cobranças recorrentes continuam.

### 5. `ClientPayment` interface desatualizada no hook
O `useClientPayments.ts` define `ClientPayment` sem os campos novos (`surplus_amount`, `franqueadora_share`). Funciona via cast `as unknown`, mas a interface nao reflete a realidade.

---

## Plano de Correcao

### 1. Corrigir CORS do `asaas-test-connection`
- Atualizar os headers CORS para o padrao completo
- Adicionar autenticacao via `getClaims()`

### 2. Adicionar eventos ao webhook
- `PAYMENT_UPDATED` — sincronizar status (PIX expirado, etc)
- `PAYMENT_CREDIT_CARD_CAPTURE_REFUSED` — notificar admin + registrar log

### 3. Criar `asaas-cancel-subscription` edge function
- Endpoint que cancela no Asaas e atualiza `subscriptions.status = 'cancelled'`
- Registrar em `config.toml`

### 4. Atualizar interface `ClientPayment`
- Adicionar `surplus_amount`, `franqueadora_share` ao tipo

## Arquivos

| Arquivo | Acao |
|---------|------|
| `supabase/functions/asaas-test-connection/index.ts` | Corrigir CORS + adicionar auth |
| `supabase/functions/asaas-webhook/index.ts` | Adicionar `PAYMENT_UPDATED` e `PAYMENT_CREDIT_CARD_CAPTURE_REFUSED` |
| `supabase/functions/asaas-cancel-subscription/index.ts` | Nova funcao para cancelamento |
| `supabase/config.toml` | Registrar nova funcao |
| `src/hooks/useClientPayments.ts` | Atualizar interface |

