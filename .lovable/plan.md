

# Testar Conexão Asaas

## Ação

Executar a Edge Function `asaas-test-connection` para verificar se o IP `3.124.193.96` foi aceito na lista de IPs autorizados do Asaas e as chamadas de saída estão funcionando.

## Resultado Esperado

- `connected: true` e `status: 200` indicam que a integração está 100% operacional
- Se ainda retornar `not_allowed_ip`, o IP pode ter mudado (rotação de infraestrutura cloud)

