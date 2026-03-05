

# Atualizar Token do Webhook Asaas

## Ação

Atualizar o secret `ASAAS_WEBHOOK_TOKEN` com o novo valor fornecido: `whsec_kcAPJXcUC4aRV0Klx4vkTqOmTSOse8Ow9cACaZbRqIw`

## Após a atualização

- O endpoint `asaas-webhook` passará a validar requisições usando este novo token
- Certifique-se de que o **mesmo token** esteja configurado no painel do Asaas em **Integrações → Webhooks → Token de autenticação**

Nenhuma alteração de código é necessária — apenas a atualização do secret.

