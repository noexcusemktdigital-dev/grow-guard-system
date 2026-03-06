

## Plano: Atualizar token do webhook Asaas

### Contexto
O token `whsec_7qh6EjwwtEyf2EX2vM5S7y-tXeCexGmnCVjtNCgXIug` foi gerado pelo próprio painel do Asaas. O código em `asaas-webhook/index.ts` já valida o header `asaas-access-token` contra o secret `ASAAS_WEBHOOK_TOKEN`.

### Ação
1. **Atualizar o secret `ASAAS_WEBHOOK_TOKEN`** com o valor `whsec_7qh6EjwwtEyf2EX2vM5S7y-tXeCexGmnCVjtNCgXIug`
2. Nenhuma alteração de código necessária — a lógica de validação já está correta

### Resultado
O webhook receberá as notificações do Asaas e validará o token corretamente, permitindo atualização automática dos status de pagamento.

