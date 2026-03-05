

# Atualizar Chave de API Asaas para Produção

## O que fazer

Atualizar o secret `ASAAS_API_KEY` com a chave de produção fornecida pelo usuário. A chave começa com `$aact_prod_`, confirmando que é do ambiente correto.

## Verificações adicionais

Após atualizar a chave, executar `asaas-test-connection` para validar que a integração está funcionando com a nova chave de produção.

## Checklist restante

Depois de confirmar a conexão, verificar com o usuário:
1. `ASAAS_BASE_URL` — deve ser `https://api.asaas.com/v3`
2. `ASAAS_PROXY_URL` — remover ou configurar proxy válido
3. `asaas_wallet_id` na tabela organizations — deve ser ID de produção

