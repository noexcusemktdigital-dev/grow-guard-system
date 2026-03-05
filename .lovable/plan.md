

# Configurar Webhook do Asaas

## URL do Webhook

A Edge Function `asaas-webhook` já está implementada e com `verify_jwt = false` (correto para receber chamadas externas). A URL que você deve configurar no painel do Asaas é:

```text
https://gxrhdpbbxfipeopdyygn.supabase.co/functions/v1/asaas-webhook
```

## Configuração no Painel Asaas

1. Acesse **Integrações → Webhooks** no painel do Asaas
2. Cole a URL acima
3. Selecione os eventos que o sistema já trata:
   - `PAYMENT_CONFIRMED`
   - `PAYMENT_RECEIVED`
   - `PAYMENT_OVERDUE`
   - `PAYMENT_UPDATED`
   - `PAYMENT_REFUNDED`
   - `PAYMENT_REFUND_IN_PROGRESS`
   - `PAYMENT_DELETED`
   - `PAYMENT_CHARGEBACK_REQUESTED`
   - `PAYMENT_CREDIT_CARD_CAPTURE_REFUSED`
   - `PAYMENT_SPLIT_DIVERGENCE_BLOCK`
   - `PAYMENT_SPLIT_DIVERGENCE_BLOCK_FINISHED`
4. Defina o **Token de autenticação** — deve ser o mesmo valor salvo no secret `ASAAS_WEBHOOK_TOKEN` (o sistema valida via header `asaas-access-token`)

## Importante

- O webhook é o Asaas chamando **nosso** servidor, então o bloqueio `not_allowed_ip` **não afeta** o webhook (o IP bloqueado é o nosso chamando a API deles)
- O endpoint já responde HTTP 200 rapidamente para todos os eventos
- Eventos não tratados retornam `{ ok: true, ignored: true }` sem erro
- Não há alteração de código necessária — apenas configurar a URL no painel

## Sobre o Bloqueio de IP (chamadas de saída)

O problema `not_allowed_ip` persiste para chamadas **do servidor para o Asaas** (criar cobranças, listar pagamentos, etc.). Isso é separado do webhook. Para resolver, as opções continuam sendo:
1. Descobrir o IP de saída (`get-outbound-ip`) e autorizar no Asaas
2. Contratar um proxy HTTP com IP fixo
3. Contatar suporte Asaas

