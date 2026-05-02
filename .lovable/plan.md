# Auditoria de pagamento, emails e tarefas diárias

## Diagnóstico do que JÁ existe

| Item do anexo | Status real |
|---|---|
| FeatureGateOverlay respeita `payment_blocked` | ✅ Já funciona (overlay vermelho + banner global) |
| Aviso D-3 antes do bloqueio | ✅ **Já existe** — cron `billing-reminder-cron` (diário 9h) → `send-billing-reminder` |
| Bloqueio após 2 dias de atraso | ✅ `asaas-webhook` seta `payment_blocked=true` com `reason="overdue_2_days"` |
| Email `< 15%` créditos | ⚠️ Existe (`credits-low-cron` 10h), mas threshold é fixo `≤50 créditos` (não 15% relativo) |
| Email de boas-vindas | ❌ Não existe |
| Email confirmação de pagamento (cliente) | ❌ Não existe |
| Email pagamento para franqueado (split 20%) | ❌ Não existe |
| Email ao concluir GPS | ❌ Não existe |
| Popup upgrade ao atingir limite | ❌ Não existe |

## Onde estão as tarefas diárias

`generate-daily-tasks` e `generate-daily-checklist` são **funções órfãs**:
- Nenhum cron as agenda
- Nenhum componente frontend as invoca
- Custo declarado em `plans.ts` mas nunca debitado de fato

São código morto. **Recomendo NÃO criar cron** sem antes decidir se essas tarefas devem mesmo existir como produto (o módulo de Tarefas atual já é alimentado pelo CRM e pelo GPS). Vou apenas **manter as funções** (já refatoradas com `debitIfGPSDone`) prontas, sem agendar.

## O que vou implementar agora

### 1. Email de boas-vindas (signup)
- Criar `supabase/functions/send-welcome-email/index.ts` (template inline pt-BR, white-label)
- Disparar dentro de `signup-provisioning` após criar organização (envio assíncrono via fila)
- Conteúdo: boas-vindas, próximo passo é completar o GPS, link direto

### 2. Email de confirmação de pagamento
- Estender `asaas-webhook` no evento `PAYMENT_RECEIVED` / `PAYMENT_CONFIRMED` para:
  - Disparar `send-payment-confirmed` (novo) para o admin do cliente
  - Idempotência via `email_campaigns` (`trigger_event = payment_confirmed:<payment_id>`)

### 3. Email de pagamento para franqueado (split 20%)
- No mesmo handler `PAYMENT_RECEIVED`, identificar a unit pai → enviar `send-franchisee-commission-email` ao franqueado dono da unit
- Idempotência via mesma chave + sufixo `:franchisee`

### 4. Email ao concluir GPS
- Trigger no momento em que `marketing_strategies.status` muda para `approved`
- Implementar via DB trigger que chama edge function `send-gps-completed` (já existe a notificação via toast — só falta email)

### 5. Threshold do alerta de créditos
- Atualizar `credits-low-check` para usar `15%` do plano contratado (ler `plan_credits_total` da org) em vez do absoluto `≤50`

### 6. Popup de upgrade ao atingir limite
- Quando `INSUFFICIENT_CREDITS` é lançado em qualquer hook frontend, exibir um modal global (`CreditsExhaustedModal`) com CTA "Comprar créditos"
- Adicionar listener no `useCreditsHandler` (ou hook equivalente) — uma única instância no `ClienteLayout`

## O que NÃO faço neste plano (precisa decisão sua)

- **Cron para `generate-daily-tasks`/`generate-daily-checklist`**: confirmar se você quer ativar essas funções como produto. Hoje são código morto.
- **Onboarding com CTA assessoria** e **popup consultoria gratuita**: requer copy + design — não é automático.
- **Banner de venda assessoria nas ferramentas**: já está pendente publicar conforme anexo.
- **GPS adaptativo / GPS lê URL do site**: mudança grande no engine de GPS — fora do escopo desta entrega.

## Pré-requisitos técnicos

- A infraestrutura de email (`auth-email-hook`, `process-email-queue`, fila pgmq) já está deployada.
- O domínio de envio (`notify.sistema.noexcusedigital.com.br`) está com DNS **falhando** — emails ficarão na fila até o DNS ser corrigido em **Cloud → Emails**. Vou avisar no fim da implementação.

## Resumo — o que muda em código

- **Novas edge functions**: `send-welcome-email`, `send-payment-confirmed`, `send-franchisee-commission-email`, `send-gps-completed`
- **Modificadas**: `signup-provisioning`, `asaas-webhook`, `credits-low-check`
- **Novos componentes UI**: `CreditsExhaustedModal` + integração no `ClienteLayout`
- **Nova migration**: trigger SQL em `marketing_strategies` para disparar `send-gps-completed`
